-- Contenu réel Car Detailion + accès administrateur par mot de passe.
create extension if not exists pgcrypto with schema extensions;

-- 1. Prestations réelles ------------------------------------------------------
alter table public.services add column if not exists base_price numeric(10,2);

delete from public.service_prices;
delete from public.services;

insert into public.services(name,slug,summary,duration_minutes,buffer_minutes,direct_booking,display_order,base_price) values
  ('Lavage express','lavage-express','Nettoyage rapide et soigné de la carrosserie pour redonner éclat et propreté en un minimum de temps.',60,15,false,1,120),
  ('Lavage Detailing','lavage-detailing','Soin complet et précis de l''habitacle pour un rendu propre, raffiné et durable.',180,30,false,2,200),
  ('Lavage textile','lavage-textile','Élimination en profondeur des taches et saletés sur les sièges, les tapis et les moquettes.',120,30,false,3,150),
  ('Soin du cuir','soin-du-cuir','Nettoyage, nutrition et protection du cuir pour préserver sa souplesse, sa couleur et son éclat.',120,30,false,4,200),
  ('Polissage & correction de la peinture','polissage-correction-peinture','Élimination des micro-rayures et des défauts pour raviver la brillance de la carrosserie.',480,60,false,5,600),
  ('Traitement céramique','traitement-ceramique','Protection durable de la carrosserie, brillance intense et effet déperlant longue durée.',240,60,false,6,200),
  ('Traitement céramique plus','traitement-ceramique-plus','Protection haute performance de la carrosserie, des vitres et des pneus.',300,60,false,7,250);

-- 2. FAQ alignée sur les informations publiées --------------------------------
delete from public.faqs;
insert into public.faqs(question,answer,display_order) values
  ('Où êtes-vous situés ?','Car Detailion se trouve Place de la Gare, 1020 Renens, dans le canton de Vaud.',1),
  ('Comment vous contacter ?','Par téléphone ou WhatsApp au 078 804 96 23, ou via le formulaire de demande de rendez-vous.',2),
  ('Quelle est la différence entre les deux traitements céramique ?','Le traitement céramique protège la carrosserie ; la formule « plus » couvre également les vitres et les pneus.',3);

-- 3. Secret d'administration --------------------------------------------------
create table if not exists public.app_secrets (
  key text primary key,
  value_hash text not null,
  updated_at timestamptz not null default now()
);
alter table public.app_secrets enable row level security; -- aucune policy : invisible depuis l'API
revoke all on public.app_secrets from anon, authenticated;

create or replace function public.admin_set_password(p_password text)
returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  if length(coalesce(p_password, '')) < 10 then
    raise exception 'mot de passe trop court (10 caracteres minimum)';
  end if;
  insert into public.app_secrets(key, value_hash, updated_at)
  values ('admin_password', encode(digest(p_password, 'sha256'), 'hex'), now())
  on conflict (key) do update set value_hash = excluded.value_hash, updated_at = now();
end $$;
revoke all on function public.admin_set_password(text) from public, anon, authenticated;

create or replace function public.admin_password_matches(p_password text)
returns boolean language sql security definer set search_path = public, extensions, pg_temp as $$
  select exists (
    select 1 from public.app_secrets
    where key = 'admin_password'
      and value_hash = encode(digest(coalesce(p_password, ''), 'sha256'), 'hex')
  );
$$;
revoke all on function public.admin_password_matches(text) from public, anon, authenticated;

-- Lecture des demandes, protégée par le même mot de passe que l'espace admin.
-- Appelée uniquement côté serveur ; utilisée tant que SUPABASE_SECRET_KEY n'est pas configurée.
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
revoke all on function public.admin_bookings(text) from public;
grant execute on function public.admin_bookings(text) to anon, authenticated, service_role;

-- Mot de passe d'administration initial (à changer avec admin_set_password).
select public.admin_set_password('CarDetailion-6ai6HKSQPY');
