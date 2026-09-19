-- =====================================================================
-- PRESTIGE WASH — schéma complet du logiciel de prise de rendez-vous
-- =====================================================================

drop table if exists public.booking_events cascade;
drop table if exists public.payments cascade;
drop table if exists public.booking_holds cascade;
drop table if exists public.bookings cascade;
drop table if exists public.vehicles cascade;
drop table if exists public.customers cascade;
drop table if exists public.availability_exceptions cascade;
drop table if exists public.business_hours cascade;
drop table if exists public.service_prices cascade;
drop table if exists public.vehicle_categories cascade;
drop table if exists public.service_options cascade;
drop table if exists public.services cascade;
drop table if exists public.projects cascade;
drop table if exists public.gallery_items cascade;
drop table if exists public.testimonials cascade;
drop table if exists public.faqs cascade;
drop table if exists public.settings cascade;
drop table if exists public.admin_profiles cascade;

drop type if exists public.booking_status cascade;
drop type if exists public.payment_status cascade;
drop type if exists public.service_category cascade;

create type public.booking_status as enum
  ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
create type public.payment_status as enum
  ('pending', 'paid', 'refunded', 'failed');
create type public.service_category as enum
  ('auto', 'textile', 'location');

-- ---------------------------------------------------------------- utils
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- L'administration est adossée à Supabase Auth.
create table public.admin_profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Équipe Prestige Wash',
  role         text not null default 'owner',
  created_at   timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_profiles p where p.user_id = auth.uid()
  );
$$;

-- ------------------------------------------------------------ catalogue
create table public.services (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  category       public.service_category not null,
  emoji          text not null default '',
  name           text not null,
  tagline        text not null default '',
  description    text not null default '',
  details        text[] not null default '{}',
  price_from     integer not null default 0,
  price_to       integer,
  price_unit     text not null default 'CHF',
  duration_min   integer not null default 120,
  image_path     text,
  is_active      boolean not null default true,
  is_bookable    boolean not null default true,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.service_options (
  id           uuid primary key default gen_random_uuid(),
  service_id   uuid references public.services(id) on delete cascade,
  slug         text not null,
  name         text not null,
  description  text not null default '',
  price        integer not null default 0,
  duration_min integer not null default 0,
  is_active    boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  unique (service_id, slug)
);

-- Taille du véhicule / du textile : module le prix et la durée.
create table public.vehicle_categories (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  label        text not null,
  description  text not null default '',
  price_delta  integer not null default 0,
  duration_delta integer not null default 0,
  applies_to   public.service_category not null default 'auto',
  sort_order   integer not null default 0,
  is_active    boolean not null default true
);

-- ---------------------------------------------------------- disponibilité
create table public.business_hours (
  weekday      smallint primary key check (weekday between 0 and 6),
  is_open      boolean not null default true,
  open_time    time not null default '08:00',
  close_time   time not null default '18:00',
  slot_minutes integer not null default 30,
  updated_at   timestamptz not null default now()
);

create table public.availability_exceptions (
  id          uuid primary key default gen_random_uuid(),
  day         date not null unique,
  is_closed   boolean not null default true,
  open_time   time,
  close_time  time,
  reason      text not null default '',
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------- clientèle
create table public.customers (
  id           uuid primary key default gen_random_uuid(),
  first_name   text not null,
  last_name    text not null,
  email        text not null unique,
  phone        text not null default '',
  address      text not null default '',
  postal_code  text not null default '',
  city         text not null default '',
  notes        text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------- réservations
create sequence if not exists public.booking_seq start 1000;

create or replace function public.next_booking_reference()
returns text language sql volatile as $$
  select 'PW-' || to_char(now() at time zone 'Europe/Zurich', 'YYMM')
         || '-' || nextval('public.booking_seq')::text;
$$;

create table public.bookings (
  id              uuid primary key default gen_random_uuid(),
  reference       text not null unique default public.next_booking_reference(),
  customer_id     uuid not null references public.customers(id) on delete restrict,
  service_id      uuid not null references public.services(id) on delete restrict,
  service_name    text not null,
  vehicle_slug    text,
  vehicle_label   text,
  options         jsonb not null default '[]'::jsonb,
  scheduled_date  date not null,
  start_time      time not null,
  end_time        time not null,
  duration_min    integer not null,
  slot            tsrange generated always as (
                    tsrange((scheduled_date + start_time)::timestamp,
                            (scheduled_date + end_time)::timestamp, '[)')
                  ) stored,
  status          public.booking_status not null default 'pending',
  address         text not null default '',
  postal_code     text not null default '',
  city            text not null default '',
  access_notes    text not null default '',
  customer_notes  text not null default '',
  admin_notes     text not null default '',
  price_estimate  integer not null default 0,
  deposit_amount  integer not null default 50,
  deposit_status  public.payment_status not null default 'pending',
  source          text not null default 'web',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  confirmed_at    timestamptz,
  completed_at    timestamptz,
  cancelled_at    timestamptz
);

-- Deux interventions ne peuvent pas se chevaucher tant qu'elles sont actives.
alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (slot with &&)
  where (status in ('pending', 'confirmed', 'in_progress'));

create index bookings_date_idx on public.bookings (scheduled_date);
create index bookings_status_idx on public.bookings (status);
create index bookings_customer_idx on public.bookings (customer_id);

create table public.payments (
  id                 uuid primary key default gen_random_uuid(),
  booking_id         uuid not null references public.bookings(id) on delete cascade,
  amount             integer not null,
  currency           text not null default 'CHF',
  status             public.payment_status not null default 'pending',
  method             text not null default 'card',
  provider           text not null default 'demo',
  provider_reference text not null default '',
  card_brand         text not null default '',
  card_last4         text not null default '',
  cardholder         text not null default '',
  is_demo            boolean not null default true,
  paid_at            timestamptz,
  created_at         timestamptz not null default now()
);

create index payments_booking_idx on public.payments (booking_id);

create table public.booking_events (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  kind       text not null,
  message    text not null default '',
  actor      text not null default 'system',
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index booking_events_booking_idx on public.booking_events (booking_id, created_at desc);

-- --------------------------------------------------------------- contenu
create table public.faqs (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answer     text not null,
  sort_order integer not null default 0,
  is_active  boolean not null default true
);

create table public.testimonials (
  id         uuid primary key default gen_random_uuid(),
  author     text not null,
  city       text not null default '',
  rating     smallint not null default 5 check (rating between 1 and 5),
  content    text not null,
  service    text not null default '',
  is_demo    boolean not null default true,
  is_active  boolean not null default true,
  sort_order integer not null default 0
);

create table public.gallery_items (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  subtitle    text not null default '',
  category    public.service_category not null default 'auto',
  image_path  text not null,
  sort_order  integer not null default 0,
  is_active   boolean not null default true
);

create table public.settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------- triggers
create trigger services_touch before update on public.services
  for each row execute function public.touch_updated_at();
create trigger customers_touch before update on public.customers
  for each row execute function public.touch_updated_at();
create trigger bookings_touch before update on public.bookings
  for each row execute function public.touch_updated_at();
create trigger business_hours_touch before update on public.business_hours
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------------ RLS
alter table public.services              enable row level security;
alter table public.service_options       enable row level security;
alter table public.vehicle_categories    enable row level security;
alter table public.business_hours        enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.customers             enable row level security;
alter table public.bookings              enable row level security;
alter table public.payments              enable row level security;
alter table public.booking_events        enable row level security;
alter table public.faqs                  enable row level security;
alter table public.testimonials          enable row level security;
alter table public.gallery_items         enable row level security;
alter table public.settings              enable row level security;
alter table public.admin_profiles        enable row level security;

-- Catalogue et contenu : lecture publique de ce qui est actif.
create policy "services_public_read" on public.services
  for select to anon, authenticated using (is_active);
create policy "service_options_public_read" on public.service_options
  for select to anon, authenticated using (is_active);
create policy "vehicle_categories_public_read" on public.vehicle_categories
  for select to anon, authenticated using (is_active);
create policy "business_hours_public_read" on public.business_hours
  for select to anon, authenticated using (true);
create policy "availability_exceptions_public_read" on public.availability_exceptions
  for select to anon, authenticated using (true);
create policy "faqs_public_read" on public.faqs
  for select to anon, authenticated using (is_active);
create policy "testimonials_public_read" on public.testimonials
  for select to anon, authenticated using (is_active);
create policy "gallery_public_read" on public.gallery_items
  for select to anon, authenticated using (is_active);

-- Catalogue et contenu : écriture réservée à l'administration.
create policy "services_admin_write" on public.services
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "service_options_admin_write" on public.service_options
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "vehicle_categories_admin_write" on public.vehicle_categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "business_hours_admin_write" on public.business_hours
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "availability_exceptions_admin_write" on public.availability_exceptions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "faqs_admin_write" on public.faqs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "testimonials_admin_write" on public.testimonials
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "gallery_admin_write" on public.gallery_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "settings_admin_all" on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Données personnelles : aucune lecture publique. Les réservations sont
-- créées côté serveur avec la clé secrète, jamais depuis le navigateur.
create policy "customers_admin_all" on public.customers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "bookings_admin_all" on public.bookings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "payments_admin_all" on public.payments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "booking_events_admin_all" on public.booking_events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_profiles_self_read" on public.admin_profiles
  for select to authenticated using (user_id = auth.uid());
