# Car Detailion

Site premium pour **Car Detailion** — detailing automobile, Place de la Gare, 1020 Renens (VD).
Contenu repris du site officiel [cardetailion.ch](https://www.cardetailion.ch).

- Téléphone / WhatsApp : 078 804 96 23
- Instagram : [@la_romande_auto](https://www.instagram.com/la_romande_auto/)
- Typographie : Playfair Display (titres) + Inter (textes)

## Prestations et tarifs

| Prestation | Tarif |
| --- | --- |
| Lavage express | 120.- |
| Lavage Detailing | 200.- |
| Lavage textile | 150.- |
| Soin du cuir | 200.- |
| Polissage & correction de la peinture | 600.- |
| Traitement céramique | 200.- |
| Traitement céramique plus | 250.- |

## Fonctionnalités

- révélation avant/après pilotée par le scroll ;
- lampe d’inspection interactive ;
- parcours animé de la méthode ;
- galerie de résultats ;
- demande de rendez-vous en trois étapes (Supabase) ;
- repli automatique vers WhatsApp en cas d’indisponibilité ;
- assistant intégré ;
- espace d’administration protégé par mot de passe ;
- schéma Supabase complet avec RLS, Storage et protection contre les doubles réservations.

## Développement local

```bash
cp .env.example .env.local
npm install
npm run dev
```

Ouvrir `http://localhost:3000`.

## Variables d’environnement Vercel

Settings → Environment Variables :

| Variable | Valeur | Portée |
| --- | --- | --- |
| `ADMIN_PASSWORD` | mot de passe de l’espace `/admin` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pbnniqdthncaphedvgej.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_YC-MXCNOMHjIqiG6iFWadg_sybtPyw5` | Production, Preview, Development |
| `SUPABASE_SECRET_KEY` | clé `service_role` (Supabase → Settings → API) | Production, Preview |
| `NEXT_PUBLIC_SITE_URL` | `https://prestige-wash-eight.vercel.app` | Production (facultatif) |

Seule `ADMIN_PASSWORD` est indispensable : les valeurs Supabase publiques ont un
repli dans le code, et `NEXT_PUBLIC_SITE_URL` retombe sur le domaine Vercel.

## Espace d’administration

`/admin` demande uniquement un mot de passe (pas d’e-mail, pas de compte).
Le mot de passe vit à deux endroits qui doivent rester identiques :

1. la variable `ADMIN_PASSWORD` dans Vercel — elle valide la connexion ;
2. son empreinte dans Supabase — elle autorise la lecture des demandes.

Pour le changer, exécuter dans le SQL Editor de Supabase :

```sql
select public.admin_set_password('nouveau-mot-de-passe');
```

puis mettre `ADMIN_PASSWORD` à la même valeur dans Vercel. La session
d’administration est un cookie `httpOnly` signé avec le mot de passe : le
changer déconnecte immédiatement les sessions ouvertes.

Si `SUPABASE_SECRET_KEY` est renseignée, la lecture des demandes passe
directement par la clé de service et l’empreinte Supabase n’est plus sollicitée :
c’est la configuration recommandée, elle supprime toute désynchronisation.

**Message « Lecture des demandes bloquée par Supabase »** : la connexion a réussi
(la variable Vercel est bonne) mais l’empreinte en base diffère. Corrigez au
choix en ajoutant `SUPABASE_SECRET_KEY`, ou en exécutant
`select public.admin_set_password('<valeur de ADMIN_PASSWORD>');` dans Supabase.

## Supabase

Projet `prestige-wash` (`pbnniqdthncaphedvgej`, région `eu-central-2`) : tables,
RLS, Storage, prestations, FAQ et fonctions `create_booking_secure`,
`admin_bookings`, `admin_set_password`.

Migrations dans `supabase/migrations/`, appliquées dans l’ordre des noms.

### Durcissement en production

Tant que `SUPABASE_SECRET_KEY` n’est pas renseignée, `create_booking_secure` est
appelable avec la clé publiable. Une fois la clé secrète ajoutée :

```sql
revoke execute on function public.create_booking_secure(text,text,timestamptz,text,text,text,text) from anon, authenticated;
revoke execute on function public.admin_bookings(text) from anon, authenticated;
```

## À confirmer avant publication

- durées des prestations (valeurs de travail dans `services.duration_minutes`) ;
- horaires d’ouverture (non publiés sur cardetailion.ch) ;
- photos réelles de Car Detailion à la place des images de démonstration ;
- avis clients réels ;
- mentions légales et politique de confidentialité.
