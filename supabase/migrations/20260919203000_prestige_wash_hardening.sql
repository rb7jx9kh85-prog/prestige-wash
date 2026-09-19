-- =====================================================================
-- PRESTIGE WASH — nettoyage et durcissement
-- Supprime les objets hérités d'un premier essai de schéma (une fonction
-- exposait les réservations à quiconque connaissait un mot de passe) et
-- referme les droits d'exécution qui n'ont pas lieu d'être publics.
-- =====================================================================

drop function if exists public.admin_bookings(text) cascade;
drop function if exists public.admin_bootstrap_password(text) cascade;
drop function if exists public.create_booking_secure(text, text, timestamptz, text, text, text, text) cascade;
drop function if exists public.create_booking_secure(text, text, timestamptz, text, text, text, text, text) cascade;
drop table if exists public.app_secrets cascade;

-- Un search_path figé évite qu'un schéma prioritaire détourne ces fonctions.
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.next_booking_reference()
returns text language sql volatile set search_path = public as $$
  select 'PW-' || to_char(now() at time zone 'Europe/Zurich', 'YYMM')
         || '-' || nextval('public.booking_seq')::text;
$$;

-- `is_admin()` est évalué par les politiques RLS sous l'identité de
-- l'appelant : le rôle `authenticated` doit donc garder le droit de
-- l'exécuter, sans quoi toutes les lectures de l'administration échouent.
-- En revanche, rien ne justifie de l'exposer aux visiteurs anonymes.
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
