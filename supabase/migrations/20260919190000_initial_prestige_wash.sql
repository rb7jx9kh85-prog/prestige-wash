-- Prestige Wash — schéma initial Supabase
create extension if not exists btree_gist with schema extensions;

create type public.booking_status as enum ('pending','pending_payment','confirmed','rescheduled','completed','cancelled','no_show');
create type public.price_type as enum ('fixed','from','quote');
create type public.payment_status as enum ('pending','paid','failed','refunded');

create table public.services (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
  summary text not null default '', description text not null default '', active boolean not null default true,
  display_order integer not null default 0, duration_minutes integer not null check (duration_minutes between 15 and 1440),
  buffer_minutes integer not null default 15 check (buffer_minutes between 0 and 240), direct_booking boolean not null default false,
  deposit_amount numeric(10,2), deposit_percentage numeric(5,2), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.vehicle_categories (id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique, display_order integer not null default 0);
create table public.service_prices (
  id uuid primary key default gen_random_uuid(), service_id uuid not null references public.services(id) on delete restrict,
  vehicle_category_id uuid references public.vehicle_categories(id) on delete restrict, price numeric(10,2),
  price_type public.price_type not null default 'quote', surcharge numeric(10,2) not null default 0, active boolean not null default true,
  unique(service_id, vehicle_category_id)
);
create table public.business_hours (id uuid primary key default gen_random_uuid(), weekday smallint not null check (weekday between 0 and 6), opens_at time, closes_at time, closed boolean not null default false, unique(weekday));
create table public.availability_exceptions (id uuid primary key default gen_random_uuid(), starts_at timestamptz not null, ends_at timestamptz not null, kind text not null check (kind in ('closed','blocked','open')), note text, check (ends_at > starts_at));
create table public.customers (
  id uuid primary key default gen_random_uuid(), first_name text not null, last_name text, email text,
  phone text not null, preferred_channel text not null default 'phone', terms_accepted boolean not null default true,
  marketing_consent boolean not null default false, created_at timestamptz not null default now()
);
create table public.vehicles (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.customers(id) on delete restrict,
  category_id uuid references public.vehicle_categories(id) on delete restrict, label text not null, brand text, model text,
  production_year smallint, details text, declared_condition text, created_at timestamptz not null default now()
);
create table public.bookings (
  id uuid primary key default gen_random_uuid(), booking_number text not null unique,
  customer_id uuid not null references public.customers(id) on delete restrict,
  vehicle_id uuid references public.vehicles(id) on delete restrict, service_id uuid not null references public.services(id) on delete restrict,
  start_at timestamptz not null, end_at timestamptz not null, status public.booking_status not null default 'pending',
  calculated_price numeric(10,2), deposit_requested numeric(10,2) not null default 0, deposit_paid numeric(10,2) not null default 0,
  location text not null, customer_notes text, internal_notes text, source text not null default 'website',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (end_at > start_at)
);
alter table public.bookings add constraint bookings_no_overlap exclude using gist
  (tstzrange(start_at, end_at, '[)') with &&)
  where (status in ('pending_payment','confirmed','rescheduled'));
create index bookings_start_idx on public.bookings(start_at);
create index bookings_customer_idx on public.bookings(customer_id);

create table public.booking_holds (
  id uuid primary key default gen_random_uuid(), service_id uuid not null references public.services(id) on delete cascade,
  start_at timestamptz not null, end_at timestamptz not null, session_token_hash text not null unique,
  expires_at timestamptz not null, payment_reference text, created_at timestamptz not null default now(), check (end_at > start_at)
);
create table public.payments (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id) on delete restrict,
  provider text not null, external_id text not null unique, amount numeric(10,2) not null, currency text not null default 'CHF',
  status public.payment_status not null default 'pending', paid_at timestamptz, refunded_at timestamptz, created_at timestamptz not null default now()
);
create table public.booking_events (id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id) on delete cascade, event_type text not null, payload jsonb not null default '{}', created_at timestamptz not null default now());
create table public.projects (
  id uuid primary key default gen_random_uuid(), title text not null, vehicle_label text, service_id uuid references public.services(id) on delete set null,
  description text not null default '', before_image_path text, after_image_path text, status text not null default 'draft' check(status in ('draft','published')),
  publication_authorized boolean not null default false, display_order integer not null default 0, created_at timestamptz not null default now()
);
create table public.faqs (id uuid primary key default gen_random_uuid(), question text not null, answer text not null, active boolean not null default true, display_order integer not null default 0);
create table public.admin_profiles (user_id uuid primary key references auth.users(id) on delete cascade, display_name text not null, created_at timestamptz not null default now());

alter table public.services enable row level security; alter table public.vehicle_categories enable row level security;
alter table public.service_prices enable row level security; alter table public.business_hours enable row level security;
alter table public.availability_exceptions enable row level security; alter table public.customers enable row level security;
alter table public.vehicles enable row level security; alter table public.bookings enable row level security;
alter table public.booking_holds enable row level security; alter table public.payments enable row level security;
alter table public.booking_events enable row level security; alter table public.projects enable row level security;
alter table public.faqs enable row level security; alter table public.admin_profiles enable row level security;

grant select on public.services, public.vehicle_categories, public.service_prices, public.business_hours, public.projects, public.faqs to anon, authenticated;
grant select, insert, update, delete on public.customers, public.vehicles, public.bookings, public.booking_holds, public.payments, public.booking_events, public.availability_exceptions, public.admin_profiles to authenticated;
grant insert, update, delete on public.services, public.vehicle_categories, public.service_prices, public.business_hours, public.projects, public.faqs to authenticated;

create policy "public reads active services" on public.services for select to anon, authenticated using (active);
create policy "public reads categories" on public.vehicle_categories for select to anon, authenticated using (true);
create policy "public reads active prices" on public.service_prices for select to anon, authenticated using (active);
create policy "public reads hours" on public.business_hours for select to anon, authenticated using (true);
create policy "public reads published projects" on public.projects for select to anon, authenticated using (status = 'published' and publication_authorized);
create policy "public reads active faqs" on public.faqs for select to anon, authenticated using (active);
create policy "admin reads own profile" on public.admin_profiles for select to authenticated using ((select auth.uid()) = user_id);

do $$ declare t text; begin
  foreach t in array array['services','vehicle_categories','service_prices','business_hours','availability_exceptions','customers','vehicles','bookings','booking_holds','payments','booking_events','projects','faqs'] loop
    execute format('create policy "admins manage %1$s" on public.%1$I for all to authenticated using (exists (select 1 from public.admin_profiles ap where ap.user_id = (select auth.uid()))) with check (exists (select 1 from public.admin_profiles ap where ap.user_id = (select auth.uid())))', t);
  end loop;
end $$;

create or replace function public.create_booking_secure(
  p_service_slug text, p_vehicle_label text, p_start_at timestamptz, p_full_name text,
  p_phone text, p_location text, p_notes text default null
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_service public.services%rowtype; v_customer uuid; v_vehicle uuid; v_booking uuid; v_number text; v_first text; v_last text; v_category uuid;
begin
  if p_start_at <= now() or length(trim(p_phone)) < 8 or length(trim(p_full_name)) < 2 then raise exception 'invalid booking'; end if;
  select * into strict v_service from public.services where slug = p_service_slug and active;
  select id into v_category from public.vehicle_categories where slug = 'berline-break';
  v_first := split_part(trim(p_full_name), ' ', 1); v_last := nullif(trim(substr(trim(p_full_name), length(v_first) + 1)), '');
  insert into public.customers(first_name,last_name,phone) values(v_first,v_last,trim(p_phone)) returning id into v_customer;
  insert into public.vehicles(customer_id,category_id,label) values(v_customer,v_category,left(trim(p_vehicle_label),100)) returning id into v_vehicle;
  v_number := 'CD-' || to_char(now(),'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,5));
  insert into public.bookings(booking_number,customer_id,vehicle_id,service_id,start_at,end_at,status,location,customer_notes)
  values(v_number,v_customer,v_vehicle,v_service.id,p_start_at,p_start_at + make_interval(mins => v_service.duration_minutes + v_service.buffer_minutes),'pending',left(trim(p_location),100),left(p_notes,700)) returning id into v_booking;
  insert into public.booking_events(booking_id,event_type,payload) values(v_booking,'booking_created',jsonb_build_object('source','website'));
  return jsonb_build_object('id',v_booking,'booking_number',v_number);
end $$;
revoke all on function public.create_booking_secure(text,text,timestamptz,text,text,text,text) from public, anon, authenticated;
grant execute on function public.create_booking_secure(text,text,timestamptz,text,text,text,text) to service_role;

insert into public.vehicle_categories(name,slug,display_order) values ('Citadine','citadine',1),('Berline / break','berline-break',2),('SUV / 4×4','suv-4x4',3),('Utilitaire','utilitaire',4);
insert into public.services(name,slug,summary,duration_minutes,buffer_minutes,direct_booking,display_order) values
  ('Nettoyage automobile','nettoyage-automobile','Intérieur complet, vapeur et finitions.',210,30,false,1),
  ('Nettoyage textile','nettoyage-textile','Canapés, matelas, tapis et fauteuils.',150,30,false,2),
  ('Location de machine','location-machine','Matériel professionnel à louer.',60,15,false,3);
insert into public.business_hours(weekday,opens_at,closes_at,closed) values (0,null,null,true),(1,'08:00','21:00',false),(2,'08:00','21:00',false),(3,'08:00','21:00',false),(4,'08:00','21:00',false),(5,'08:00','22:00',false),(6,'08:00','18:00',false);
insert into public.faqs(question,answer,display_order) values
  ('Vous déplacez-vous dans tout le Valais ?','Oui. La disponibilité et les éventuels frais sont confirmés selon votre commune.',1),
  ('Comment recevoir un prix ?','Indiquez la prestation, la taille, l’état et, idéalement, joignez quelques photos.',2),
  ('Avez-vous besoin d’eau ou d’électricité ?','Les besoins exacts dépendent de la prestation et sont confirmés avant le rendez-vous.',3);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
  ('public-projects','public-projects',true,10485760,array['image/jpeg','image/png','image/webp','image/avif']),
  ('private-booking-uploads','private-booking-uploads',false,10485760,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do nothing;
create policy "read approved public project images" on storage.objects for select to anon, authenticated using (bucket_id = 'public-projects');
create policy "admins manage project images" on storage.objects for all to authenticated using (bucket_id = 'public-projects' and exists(select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()))) with check (bucket_id = 'public-projects' and exists(select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid())));
create policy "admins manage private booking images" on storage.objects for all to authenticated using (bucket_id = 'private-booking-uploads' and exists(select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid()))) with check (bucket_id = 'private-booking-uploads' and exists(select 1 from public.admin_profiles ap where ap.user_id=(select auth.uid())));
