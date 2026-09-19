-- =====================================================================
-- PRESTIGE WASH — API publique de réservation
-- Le site public ne possède que la clé publiable. Toute écriture passe
-- par ces fonctions SECURITY DEFINER qui valident elles-mêmes la demande.
-- =====================================================================

alter table public.bookings
  add column if not exists client_token uuid not null default gen_random_uuid();

-- --------------------------------------------------------------------
-- Créneaux libres d'une journée, en tenant compte des horaires, des
-- fermetures exceptionnelles, des réservations actives et du délai de
-- prévenance.
-- --------------------------------------------------------------------
create or replace function public.get_available_slots(p_day date, p_duration integer default 120)
returns table (slot_start time, slot_end time)
language plpgsql stable security definer set search_path = public as $$
declare
  v_hours        public.business_hours%rowtype;
  v_exception    public.availability_exceptions%rowtype;
  v_open         time;
  v_close        time;
  v_step         integer;
  v_cursor       time;
  v_lead         timestamp;
  v_duration     integer := greatest(coalesce(p_duration, 120), 15);
begin
  if p_day is null or p_day < (now() at time zone 'Europe/Zurich')::date then
    return;
  end if;
  if p_day > ((now() at time zone 'Europe/Zurich')::date + 120) then
    return;
  end if;

  select * into v_hours from public.business_hours
   where weekday = extract(dow from p_day)::smallint;
  if not found or not v_hours.is_open then
    return;
  end if;

  v_open  := v_hours.open_time;
  v_close := v_hours.close_time;
  v_step  := greatest(v_hours.slot_minutes, 15);

  select * into v_exception from public.availability_exceptions where day = p_day;
  if found then
    if v_exception.is_closed then
      return;
    end if;
    v_open  := coalesce(v_exception.open_time, v_open);
    v_close := coalesce(v_exception.close_time, v_close);
  end if;

  -- Deux heures de prévenance minimum.
  v_lead := (now() at time zone 'Europe/Zurich') + interval '2 hours';

  v_cursor := v_open;
  while (v_cursor + make_interval(mins => v_duration)) <= v_close loop
    if (p_day + v_cursor)::timestamp >= v_lead
       and not exists (
         select 1 from public.bookings b
          where b.status in ('pending', 'confirmed', 'in_progress')
            and b.slot && tsrange(
                  (p_day + v_cursor)::timestamp,
                  (p_day + v_cursor + make_interval(mins => v_duration))::timestamp,
                  '[)')
       )
    then
      slot_start := v_cursor;
      slot_end   := v_cursor + make_interval(mins => v_duration);
      return next;
    end if;
    v_cursor := v_cursor + make_interval(mins => v_step);
  end loop;
end;
$$;

-- --------------------------------------------------------------------
-- Jours du mois où il reste au moins un créneau.
-- --------------------------------------------------------------------
create or replace function public.get_open_days(p_from date, p_to date, p_duration integer default 120)
returns table (day date, slots integer)
language sql stable security definer set search_path = public as $$
  select d::date,
         (select count(*)::integer from public.get_available_slots(d::date, p_duration))
    from generate_series(p_from, p_to, interval '1 day') d
$$;

-- --------------------------------------------------------------------
-- Création d'une réservation depuis le site public.
-- --------------------------------------------------------------------
create or replace function public.create_booking(
  p_service_slug   text,
  p_variant_slug   text,
  p_options        text[],
  p_day            date,
  p_start          time,
  p_first_name     text,
  p_last_name      text,
  p_email          text,
  p_phone          text,
  p_address        text,
  p_postal_code    text,
  p_city           text,
  p_access_notes   text default '',
  p_customer_notes text default ''
)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  v_service   public.services%rowtype;
  v_variant   public.vehicle_categories%rowtype;
  v_customer  public.customers%rowtype;
  v_duration  integer;
  v_price     integer;
  v_end       time;
  v_options   jsonb := '[]'::jsonb;
  v_opt       public.service_options%rowtype;
  v_slug      text;
  v_booking   public.bookings%rowtype;
  v_deposit   integer;
begin
  if coalesce(trim(p_email), '') = '' or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'ADRESSE_EMAIL_INVALIDE';
  end if;
  if coalesce(trim(p_first_name), '') = '' or coalesce(trim(p_last_name), '') = '' then
    raise exception 'NOM_REQUIS';
  end if;
  if coalesce(trim(p_phone), '') = '' then
    raise exception 'TELEPHONE_REQUIS';
  end if;
  if coalesce(trim(p_address), '') = '' or coalesce(trim(p_city), '') = '' then
    raise exception 'ADRESSE_REQUISE';
  end if;

  select * into v_service from public.services
   where slug = p_service_slug and is_active and is_bookable;
  if not found then
    raise exception 'PRESTATION_INTROUVABLE';
  end if;

  v_duration := v_service.duration_min;
  v_price    := v_service.price_from;

  if p_variant_slug is not null and p_variant_slug <> '' then
    select * into v_variant from public.vehicle_categories
     where slug = p_variant_slug and is_active and applies_to = v_service.category;
    if not found then
      raise exception 'FORMULE_INTROUVABLE';
    end if;
    v_duration := v_duration + v_variant.duration_delta;
    v_price    := v_price + v_variant.price_delta;
  end if;

  foreach v_slug in array coalesce(p_options, '{}'::text[]) loop
    select * into v_opt from public.service_options
     where slug = v_slug and is_active
       and (service_id is null or service_id = v_service.id);
    if found then
      v_duration := v_duration + v_opt.duration_min;
      v_price    := v_price + v_opt.price;
      v_options  := v_options || jsonb_build_object(
        'slug', v_opt.slug, 'name', v_opt.name, 'price', v_opt.price);
    end if;
  end loop;

  v_end := p_start + make_interval(mins => v_duration);

  -- Le créneau demandé doit toujours faire partie des créneaux libres.
  if not exists (
    select 1 from public.get_available_slots(p_day, v_duration) s
     where s.slot_start = p_start
  ) then
    raise exception 'CRENEAU_INDISPONIBLE';
  end if;

  -- Garde-fou anti-spam : 3 demandes par adresse e-mail et par jour.
  if (select count(*) from public.bookings b
        join public.customers c on c.id = b.customer_id
       where lower(c.email) = lower(trim(p_email))
         and b.created_at > now() - interval '24 hours') >= 3 then
    raise exception 'TROP_DE_DEMANDES';
  end if;

  insert into public.customers (first_name, last_name, email, phone, address, postal_code, city)
  values (trim(p_first_name), trim(p_last_name), lower(trim(p_email)), trim(p_phone),
          trim(p_address), trim(p_postal_code), trim(p_city))
  on conflict (email) do update
    set first_name  = excluded.first_name,
        last_name   = excluded.last_name,
        phone       = excluded.phone,
        address     = excluded.address,
        postal_code = excluded.postal_code,
        city        = excluded.city
  returning * into v_customer;

  v_deposit := coalesce((select (value->>'amount')::integer from public.settings where key = 'deposit'), 50);

  insert into public.bookings (
    customer_id, service_id, service_name, vehicle_slug, vehicle_label, options,
    scheduled_date, start_time, end_time, duration_min,
    address, postal_code, city, access_notes, customer_notes,
    price_estimate, deposit_amount, deposit_status, status, source
  ) values (
    v_customer.id, v_service.id, v_service.name, v_variant.slug, v_variant.label, v_options,
    p_day, p_start, v_end, v_duration,
    trim(p_address), trim(p_postal_code), trim(p_city),
    left(coalesce(p_access_notes, ''), 1000), left(coalesce(p_customer_notes, ''), 1000),
    v_price, v_deposit, 'pending', 'pending', 'web'
  )
  returning * into v_booking;

  insert into public.booking_events (booking_id, kind, message, actor)
  values (v_booking.id, 'created',
          'Demande reçue depuis le site — acompte de ' || v_deposit || ' CHF en attente.',
          'client');

  return jsonb_build_object(
    'id',            v_booking.id,
    'reference',     v_booking.reference,
    'client_token',  v_booking.client_token,
    'price',         v_price,
    'deposit',       v_deposit,
    'duration_min',  v_duration,
    'day',           p_day,
    'start_time',    p_start,
    'end_time',      v_end
  );
exception
  when exclusion_violation then
    raise exception 'CRENEAU_INDISPONIBLE';
end;
$$;

-- --------------------------------------------------------------------
-- Paiement de démonstration de l'acompte.
-- Aucune donnée bancaire réelle n'est traitée : on n'enregistre que la
-- marque et les quatre derniers chiffres saisis dans le formulaire.
-- --------------------------------------------------------------------
create or replace function public.register_demo_payment(
  p_booking_id   uuid,
  p_client_token uuid,
  p_cardholder   text,
  p_card_brand   text,
  p_card_last4   text
)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  v_booking public.bookings%rowtype;
  v_ref     text;
begin
  select * into v_booking from public.bookings
   where id = p_booking_id and client_token = p_client_token;
  if not found then
    raise exception 'RESERVATION_INTROUVABLE';
  end if;
  if v_booking.deposit_status = 'paid' then
    return jsonb_build_object('reference', v_booking.reference, 'already_paid', true);
  end if;

  v_ref := 'DEMO-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));

  insert into public.payments (
    booking_id, amount, currency, status, method, provider, provider_reference,
    card_brand, card_last4, cardholder, is_demo, paid_at
  ) values (
    v_booking.id, v_booking.deposit_amount, 'CHF', 'paid', 'card', 'demo', v_ref,
    left(coalesce(p_card_brand, 'carte'), 24),
    right(regexp_replace(coalesce(p_card_last4, ''), '\D', '', 'g'), 4),
    left(coalesce(p_cardholder, ''), 120), true, now()
  );

  update public.bookings
     set deposit_status = 'paid',
         status         = 'confirmed',
         confirmed_at   = now()
   where id = v_booking.id;

  insert into public.booking_events (booking_id, kind, message, actor)
  values (v_booking.id, 'deposit_paid',
          'Acompte de ' || v_booking.deposit_amount ||
          ' CHF réglé (paiement de démonstration, référence ' || v_ref || ').',
          'client');

  return jsonb_build_object(
    'reference',         v_booking.reference,
    'payment_reference', v_ref,
    'amount',            v_booking.deposit_amount,
    'already_paid',      false
  );
end;
$$;

revoke all on function public.create_booking(text, text, text[], date, time, text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.create_booking(text, text, text[], date, time, text, text, text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.get_available_slots(date, integer) to anon, authenticated;
grant execute on function public.get_open_days(date, date, integer) to anon, authenticated;
grant execute on function public.register_demo_payment(uuid, uuid, text, text, text) to anon, authenticated;
