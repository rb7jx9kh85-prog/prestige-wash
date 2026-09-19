-- E-mail du client dans la demande + changement de statut depuis l'administration.

-- 1. La création de demande accepte désormais un e-mail.
create or replace function public.create_booking_secure(
  p_service_slug text, p_vehicle_label text, p_start_at timestamptz, p_full_name text,
  p_phone text, p_location text, p_notes text default null, p_email text default null
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_service public.services%rowtype; v_customer uuid; v_vehicle uuid; v_booking uuid; v_number text; v_first text; v_last text; v_category uuid;
begin
  if p_start_at <= now() or length(trim(p_phone)) < 8 or length(trim(p_full_name)) < 2 then raise exception 'invalid booking'; end if;
  select * into strict v_service from public.services where slug = p_service_slug and active;
  select id into v_category from public.vehicle_categories where slug = 'berline-break';
  v_first := split_part(trim(p_full_name), ' ', 1); v_last := nullif(trim(substr(trim(p_full_name), length(v_first) + 1)), '');
  insert into public.customers(first_name,last_name,phone,email)
  values(v_first,v_last,trim(p_phone),nullif(lower(trim(p_email)),'')) returning id into v_customer;
  insert into public.vehicles(customer_id,category_id,label) values(v_customer,v_category,left(trim(p_vehicle_label),100)) returning id into v_vehicle;
  v_number := 'CD-' || to_char(now(),'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,5));
  insert into public.bookings(booking_number,customer_id,vehicle_id,service_id,start_at,end_at,status,location,customer_notes)
  values(v_number,v_customer,v_vehicle,v_service.id,p_start_at,p_start_at + make_interval(mins => v_service.duration_minutes + v_service.buffer_minutes),'pending',left(trim(p_location),100),left(p_notes,700)) returning id into v_booking;
  insert into public.booking_events(booking_id,event_type,payload) values(v_booking,'booking_created',jsonb_build_object('source','website'));
  return jsonb_build_object('id',v_booking,'booking_number',v_number);
end $$;
grant execute on function public.create_booking_secure(text,text,timestamptz,text,text,text,text,text) to anon, authenticated, service_role;

-- 2. L'e-mail remonte dans la liste de l'administration.
create or replace function public.admin_bookings(p_password text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_result jsonb;
begin
  if not public.admin_password_matches(p_password) then
    raise exception 'unauthorized' using errcode = '28000';
  end if;
  select coalesce(jsonb_agg(item order by item->>'start_at'), '[]'::jsonb) into v_result
  from (
    select jsonb_build_object(
      'booking_number', b.booking_number,
      'start_at', b.start_at,
      'status', b.status,
      'location', b.location,
      'customer_name', trim(concat(c.first_name, ' ', coalesce(c.last_name, ''))),
      'phone', c.phone,
      'email', c.email,
      'service', s.name,
      'vehicle', v.label,
      'notes', b.customer_notes
    ) as item
    from public.bookings b
    join public.customers c on c.id = b.customer_id
    join public.services s on s.id = b.service_id
    left join public.vehicles v on v.id = b.vehicle_id
    order by b.start_at
    limit 100
  ) rows;
  return v_result;
end $$;
grant execute on function public.admin_bookings(text) to anon, authenticated, service_role;

-- 3. Acceptation / refus d'une demande, protégé par le mot de passe d'administration.
create or replace function public.admin_update_booking_status(
  p_password text, p_booking_number text, p_status public.booking_status
) returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_booking public.bookings%rowtype; v_result jsonb;
begin
  if not public.admin_password_matches(p_password) then
    raise exception 'unauthorized' using errcode = '28000';
  end if;
  if p_status not in ('confirmed','cancelled','completed','pending') then
    raise exception 'statut non autorise';
  end if;
  update public.bookings set status = p_status, updated_at = now()
  where booking_number = p_booking_number returning * into v_booking;
  if not found then raise exception 'demande introuvable'; end if;
  insert into public.booking_events(booking_id, event_type, payload)
  values (v_booking.id, 'status_changed', jsonb_build_object('status', p_status, 'source', 'admin'));
  select jsonb_build_object(
    'booking_number', v_booking.booking_number,
    'start_at', v_booking.start_at,
    'status', v_booking.status,
    'location', v_booking.location,
    'customer_name', trim(concat(c.first_name, ' ', coalesce(c.last_name, ''))),
    'email', c.email,
    'phone', c.phone,
    'service', s.name,
    'vehicle', v.label
  ) into v_result
  from public.customers c, public.services s
  left join public.vehicles v on v.id = v_booking.vehicle_id
  where c.id = v_booking.customer_id and s.id = v_booking.service_id;
  return v_result;
end $$;
revoke all on function public.admin_update_booking_status(text, text, public.booking_status) from public;
grant execute on function public.admin_update_booking_status(text, text, public.booking_status) to anon, authenticated, service_role;
