# Prestige Wash — site vitrine et logiciel de rendez-vous

Site public animé et back-office de gestion des rendez-vous pour
**Prestige Wash**, nettoyage automobile et textile à domicile en Valais.

La direction artistique, les textes et les coordonnées sont repris du site
existant [prestigewash.ch](https://www.prestigewash.ch) et du flyer officiel :
noir profond, bleu électrique `#0F9EFB`, typographie condensée Oswald, prix
en italique gras (« dès 80.- »), monogramme PW.

---

## Ce que contient le projet

| Adresse | Rôle |
| --- | --- |
| `/` | Site vitrine animé |
| `/reservation` | Tunnel de réservation en cinq étapes, acompte de 50 CHF |
| `/admin` | Tableau de bord |
| `/admin/reservations` | Liste, filtres, fiche détaillée, workflow de statuts |
| `/admin/calendrier` | Vue mensuelle des interventions |
| `/admin/clients` | Fiches clients, historique, chiffre réalisé |
| `/admin/paiements` | Acomptes encaissés et remboursés |
| `/admin/prestations` | Tarifs, durées, visibilité, formules et options |
| `/admin/disponibilites` | Horaires hebdomadaires et fermetures exceptionnelles |

### Le site public

Préchargeur qui dessine le monogramme, défilement fluide (Lenis), curseur
personnalisé, barre de progression, titres révélés ligne par ligne, héros en
parallaxe, bandeau défilant dont la vitesse suit le scroll, comparateur
avant/après manipulable, cartes de prestations avec inclinaison 3D et halo
suivant le curseur, méthode en six étapes avec rail de progression, galerie
qui défile horizontalement pendant le scroll, carte du Valais dessinée en SVG
avec villes et point d’intervention pulsant, FAQ dépliante, pied de page
cinétique.

Toutes les animations sont désactivées sous `prefers-reduced-motion`.

### Le tunnel de réservation

1. **Prestation** — automobile, textile ou location.
2. **Formule et options** — la taille du véhicule ou la pièce textile, puis
   les options ; chacune ajoute son prix *et* sa durée.
3. **Date et heure** — le calendrier n’ouvre que les jours où un créneau de la
   durée calculée existe réellement, en tenant compte des horaires, des
   fermetures, des rendez-vous déjà pris et d’un délai de prévenance de 2 h.
4. **Coordonnées** — client et adresse d’intervention.
5. **Acompte de 50 CHF** — paiement de démonstration, puis confirmation avec
   numéro de référence.

### Le paiement est une démonstration

**Aucune transaction réelle n’a lieu.** Le formulaire de carte ne contacte
aucun prestataire : seuls la marque déduite du numéro et les quatre derniers
chiffres saisis sont enregistrés, pour que la démonstration reste lisible
dans le back-office. Les écrans, l’état « acompte payé », la ligne de paiement
et l’historique se comportent comme en production.

Pour encaisser réellement, remplacer l’appel à `register_demo_payment` par le
webhook d’un prestataire (Stripe, Datatrans, TWINT). La réservation est déjà
créée avant le paiement et passe en `confirmed` seulement une fois l’acompte
enregistré : le point de bascule est donc unique.

---

## Architecture

Next.js 16 (App Router), React 19, TypeScript, Supabase (Postgres + Auth),
Lenis pour le défilement. Aucune librairie d’UI : tout le style est écrit à la
main dans `app/globals.css`, `site.css`, `booking.css` et `admin.css`.

**Le site n’utilise que la clé publiable.** Il n’y a pas de clé secrète dans
l’application :

- les données publiques (prestations, FAQ, galerie) sont lues en RLS ;
- les écritures publiques passent par des fonctions `SECURITY DEFINER`
  (`create_booking`, `register_demo_payment`) qui revalident elles-mêmes la
  disponibilité, le format des champs et un garde-fou anti-spam ;
- les données personnelles (clients, réservations, paiements) ne sont lisibles
  que par un utilisateur présent dans `admin_profiles` ;
- deux interventions ne peuvent pas se chevaucher : une contrainte
  d’exclusion GiST sur la plage horaire le garantit au niveau de la base, pas
  seulement de l’interface.

### Base de données

`supabase/migrations/` contient quatre fichiers, à appliquer dans l’ordre :

1. `…_core.sql` — types, tables, contraintes, RLS ;
2. `…_rpc.sql` — API publique de réservation ;
3. `…_seed.sql` — prestations, tarifs, horaires, FAQ, galerie ;
4. `…_hardening.sql` — nettoyage des objets hérités et droits d’exécution.

---

## Démarrer

```bash
npm install
cp .env.example .env.local   # puis renseigner les deux clés Supabase
npm run dev
```

`http://localhost:3000`

Sans Supabase configuré, le site vitrine s’affiche avec un catalogue de repli ;
la réservation affiche un message et renvoie vers WhatsApp.

### Connecter Supabase

1. Appliquer les quatre migrations dans l’ordre.
2. Renseigner `NEXT_PUBLIC_SUPABASE_URL` et
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` dans `.env.local`.
3. Créer un utilisateur dans **Authentication → Users**.
4. Ajouter son UUID dans `admin_profiles` :

```sql
insert into public.admin_profiles (user_id, display_name, role)
values ('<uuid>', 'Votre nom', 'owner');
```

5. Reporter les mêmes variables dans l’hébergeur (Vercel, etc.).

---

## Avant une mise en ligne réelle

- [ ] **Témoignages** — la table `testimonials` ne contient que des exemples
      marqués `is_demo = true`. Les remplacer par de vrais avis ; la section
      affiche un bandeau d’avertissement tant que tout est en démonstration.
- [ ] **Avant / après** — le côté gauche du comparateur est la photo finale
      ternie par filtre, pas un vrai cliché d’avant. La section le dit
      explicitement. Fournir les vraies paires et retirer la mention.
- [ ] **Tarifs** — « dès 80.- » et les fourchettes viennent du flyer officiel ;
      le détail par formule et par option a été construit autour et doit être
      validé.
- [ ] **Horaires et zone** — vérifier les horaires par défaut
      (lun–ven 8 h–18 h 30, ven jusqu’à 19 h, sam 9 h–17 h) et la liste des
      communes.
- [ ] **Paiement** — brancher un vrai prestataire si l’acompte doit être
      réellement encaissé.
- [ ] **Notifications** — aucun e-mail ni SMS n’est envoyé pour l’instant ;
      le back-office le rappelle sur la fiche de réservation.
- [ ] **Mentions légales et politique de confidentialité** — à rédiger.
- [ ] **Supabase Auth** — activer la protection contre les mots de passe
      compromis (Authentication → Policies).
- [ ] **Photos** — les quatre visuels de `public/media/` proviennent du site
      existant ; ajouter des photos supplémentaires si possible.
