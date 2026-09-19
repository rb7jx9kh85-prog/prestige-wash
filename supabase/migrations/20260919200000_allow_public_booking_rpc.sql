-- Permet d'appeler `create_booking_secure` avec la clé publiable lorsque
-- `SUPABASE_SECRET_KEY` n'est pas configurée côté serveur.
-- La fonction est `security definer` et valide elle-même ses entrées.
--
-- Pour revenir au mode strict (service_role uniquement) une fois
-- `SUPABASE_SECRET_KEY` renseignée dans Vercel :
--   revoke execute on function public.create_booking_secure(text,text,timestamptz,text,text,text,text) from anon, authenticated;
grant execute on function public.create_booking_secure(text,text,timestamptz,text,text,text,text) to anon, authenticated;
