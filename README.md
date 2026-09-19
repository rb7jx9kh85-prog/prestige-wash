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

1. Créer ou sélectionner un projet Supabase.
2. Appliquer `supabase/migrations/20260919190000_initial_prestige_wash.sql`.
3. Copier `.env.example` vers `.env.local` et renseigner les trois clés.
4. Créer un utilisateur dans Supabase Auth.
5. Ajouter son UUID dans `admin_profiles` avec un nom d’affichage.
6. Ajouter les mêmes variables dans Vercel.

La clé `SUPABASE_SECRET_KEY` reste exclusivement côté serveur. Elle ne doit jamais porter le préfixe `NEXT_PUBLIC_`.

## Avant publication

- remplacer les images de démonstration par les photos autorisées de Prestige Wash ;
- remplacer les témoignages de démonstration par les avis Google réels ;
- faire confirmer tarifs, horaires et périmètre d’intervention ;
- compléter les mentions légales et la politique de confidentialité ;
- compresser les médias finaux et contrôler l’affichage mobile.
