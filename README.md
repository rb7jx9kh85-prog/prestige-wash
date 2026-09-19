# Prestige Wash Valais

Expérience web premium pour le nettoyage automobile et textile à domicile en Valais.

## Fonctionnalités

- révélation avant/après pilotée par le scroll ;
- lampe d’inspection interactive ;
- parcours animé de la méthode ;
- galerie de transformations ;
- formulaire de demande en trois étapes ;
- repli automatique vers WhatsApp tant que Supabase n’est pas configuré ;
- assistant FAQ intégré ;
- espace d’administration protégé ;
- schéma Supabase complet avec RLS, Storage et protection contre les doubles réservations.

## Lancer localement

```bash
npm install
npm run dev
```

Ouvrir `http://localhost:3000`.

## Connexion Supabase

Le projet Supabase `prestige-wash` (`pbnniqdthncaphedvgej`, région `eu-central-2`)
est déjà créé et migré : tables, RLS, Storage, données de base et fonction
`create_booking_secure`.

L'URL et la clé publiable Supabase sont des valeurs publiques : elles servent de
repli dans `lib/supabase/config.ts`, ce qui rend le site fonctionnel même sans
variables d'environnement. Toute variable définie reste prioritaire.

### Variables à ajouter dans Vercel (Settings → Environment Variables)

| Variable | Valeur | Portée |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pbnniqdthncaphedvgej.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_YC-MXCNOMHjIqiG6iFWadg_sybtPyw5` | Production, Preview, Development |
| `SUPABASE_SECRET_KEY` | clé `service_role` du tableau de bord Supabase | Production, Preview (serveur uniquement) |
| `NEXT_PUBLIC_SITE_URL` | `https://prestige-wash-eight.vercel.app` | Production (facultatif) |

`NEXT_PUBLIC_SITE_URL` peut rester vide ou absente : le site retombe
automatiquement sur le domaine Vercel, puis sur `https://prestigewash.ch`.

### Sécuriser la réservation en production

Tant que `SUPABASE_SECRET_KEY` n'est pas renseignée, la route `/api/bookings`
appelle la fonction `create_booking_secure` avec la clé publiable ; la fonction
est donc exécutable publiquement (validations incluses). Une fois la clé secrète
ajoutée dans Vercel, repasser en mode strict :

```sql
revoke execute on function public.create_booking_secure(text,text,timestamptz,text,text,text,text) from anon, authenticated;
```

### Accès à l'administration

1. Créer un utilisateur dans Supabase Auth (Authentication → Users).
2. Ajouter son UUID dans `admin_profiles` :

```sql
insert into public.admin_profiles(user_id, display_name) values ('<uuid>', 'Noé');
```

3. Se connecter sur `/admin`.

La clé `SUPABASE_SECRET_KEY` reste exclusivement côté serveur. Elle ne doit jamais porter le préfixe `NEXT_PUBLIC_`.

## Développement local

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Avant publication

- remplacer les images de démonstration par les photos autorisées de Prestige Wash ;
- remplacer les témoignages de démonstration par les avis Google réels ;
- faire confirmer tarifs, horaires et périmètre d’intervention ;
- compléter les mentions légales et la politique de confidentialité ;
- compresser les médias finaux et contrôler l’affichage mobile.
