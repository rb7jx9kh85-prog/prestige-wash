-- =====================================================================
-- PRESTIGE WASH — données de départ
-- Textes, tarifs et coordonnées repris de prestigewash.ch et du flyer
-- officiel (« DÈS 80.- », véhicules intérieur / canapés).
-- Les témoignages sont des exemples de démonstration (is_demo = true) :
-- ils doivent être remplacés par de vrais avis avant mise en ligne.
-- =====================================================================

insert into public.settings (key, value) values
  ('deposit', '{"amount": 50, "currency": "CHF", "demo": true}'::jsonb),
  ('contact', '{"phone": "+41754282715", "display_phone": "+41 75 428 27 15", "whatsapp": "https://wa.me/41754282715", "lat": 46.227818, "lng": 7.397365, "region": "Valais, Suisse"}'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ------------------------------------------------------------ horaires
insert into public.business_hours (weekday, is_open, open_time, close_time, slot_minutes) values
  (1, true,  '08:00', '18:30', 30),
  (2, true,  '08:00', '18:30', 30),
  (3, true,  '08:00', '18:30', 30),
  (4, true,  '08:00', '18:30', 30),
  (5, true,  '08:00', '19:00', 30),
  (6, true,  '09:00', '17:00', 30),
  (0, false, '09:00', '17:00', 30)
on conflict (weekday) do update
  set is_open = excluded.is_open, open_time = excluded.open_time,
      close_time = excluded.close_time, slot_minutes = excluded.slot_minutes;

-- --------------------------------------------------------- prestations
insert into public.services
  (slug, category, emoji, name, tagline, description, details,
   price_from, price_to, duration_min, image_path, sort_order) values
  ('nettoyage-automobile', 'auto', '🚗', 'Nettoyage automobile',
   'Intérieur complet, comme sorti de concession',
   'Intérieur complet, sièges tissu ou cuir, vapeur, aspiration et finitions professionnelles.',
   array['Aspiration intégrale habitacle et coffre',
         'Injection-extraction des sièges et moquettes',
         'Nettoyage vapeur des plastiques et aérations',
         'Traitement et nourrissage du cuir',
         'Vitres intérieures sans traces',
         'Désodorisation longue durée'],
   80, 300, 150, '/media/audi-q3-interieur.jpg', 1),

  ('nettoyage-textile', 'textile', '🛋️', 'Nettoyage textile',
   'Canapés, matelas, tapis : une seconde vie',
   'Canapés, matelas, tapis, fauteuils et sièges. Élimination des tâches et des mauvaises odeurs.',
   array['Injection-extraction professionnelle',
         'Détachage ciblé avant traitement',
         'Élimination des acariens et des odeurs',
         'Séchage accéléré sur place',
         'Produits sans danger pour enfants et animaux',
         'Intervention directement à votre domicile'],
   80, 250, 120, '/media/detail-siege.jpg', 2),

  ('location-machines', 'location', '🧼', 'Location de machines',
   'Le matériel pro, chez vous',
   'Louez du matériel professionnel pour nettoyer vous-même vos textiles.',
   array['Injecteur-extracteur professionnel',
         'Produits détachants fournis',
         'Prise en main expliquée à la remise',
         'Livraison et reprise possibles',
         'Tarif dégressif dès 48 h',
         'Assistance téléphonique pendant la location'],
   60, 180, 30, '/media/porsche-vapeur.jpg', 3)
on conflict (slug) do update
  set category = excluded.category, emoji = excluded.emoji, name = excluded.name,
      tagline = excluded.tagline, description = excluded.description,
      details = excluded.details, price_from = excluded.price_from,
      price_to = excluded.price_to, duration_min = excluded.duration_min,
      image_path = excluded.image_path, sort_order = excluded.sort_order;

-- ------------------------------------------------------------ formules
insert into public.vehicle_categories
  (slug, label, description, price_delta, duration_delta, applies_to, sort_order) values
  ('citadine',    'Citadine',            'Polo, Clio, 500…',                    0,   0, 'auto', 1),
  ('berline',     'Berline / Break',     'Classe C, Passat, A4…',              25,  30, 'auto', 2),
  ('suv',         'SUV / Monospace',     'Q3, X3, Tiguan…',                    45,  45, 'auto', 3),
  ('van',         'Van / 7 places',      'Utilitaire, monospace 7 places…',    80,  75, 'auto', 4),
  ('canape-2',    'Canapé 2 places',     'Deux places, tissu ou microfibre',    0,   0, 'textile', 1),
  ('canape-3',    'Canapé 3 places',     'Trois places, tissu ou microfibre',  30,  30, 'textile', 2),
  ('canape-angle','Canapé d''angle',     'Angle ou méridienne',                65,  60, 'textile', 3),
  ('matelas',     'Matelas',             'Simple ou double, deux faces',       40,  30, 'textile', 4),
  ('tapis',       'Tapis',               'Jusqu''à 3 m²',                      20,  20, 'textile', 5),
  ('fauteuil',    'Fauteuil',            'Fauteuil ou chaise rembourrée',      10,  15, 'textile', 6),
  ('loc-24h',     'Location 24 h',       'Retrait et retour le lendemain',      0,   0, 'location', 1),
  ('loc-weekend', 'Location week-end',   'Du samedi matin au lundi matin',     55,   0, 'location', 2),
  ('loc-semaine', 'Location 7 jours',    'Une semaine complète',              120,   0, 'location', 3)
on conflict (slug) do update
  set label = excluded.label, description = excluded.description,
      price_delta = excluded.price_delta, duration_delta = excluded.duration_delta,
      applies_to = excluded.applies_to, sort_order = excluded.sort_order;

-- ------------------------------------------------------------- options
insert into public.service_options (service_id, slug, name, description, price, duration_min, sort_order)
select s.id, o.slug, o.name, o.description, o.price, o.duration_min, o.sort_order
from public.services s
join (values
  ('nettoyage-automobile', 'auto-cuir',     'Traitement cuir',            'Nettoyage doux puis nourrissage des surfaces cuir.',            45, 30, 1),
  ('nettoyage-automobile', 'auto-ozone',    'Traitement anti-odeurs',     'Choc ozone : tabac, animaux, humidité.',                       40, 30, 2),
  ('nettoyage-automobile', 'auto-coffre',   'Coffre complet',             'Aspiration, shampooing et désodorisation du coffre.',          25, 20, 3),
  ('nettoyage-automobile', 'auto-vitres',   'Vitres intérieur/extérieur', 'Finition sans traces, y compris pare-brise.',                  20, 15, 4),
  ('nettoyage-automobile', 'auto-plastique','Rénovation des plastiques',  'Nettoyage vapeur puis protection UV mate.',                    35, 25, 5),
  ('nettoyage-textile',    'tex-acariens',  'Traitement anti-acariens',   'Produit certifié, idéal chambres et matelas.',                 35, 20, 1),
  ('nettoyage-textile',    'tex-detachage', 'Détachage renforcé',         'Taches anciennes, encre, vin, gras.',                          30, 25, 2),
  ('nettoyage-textile',    'tex-sechage',   'Séchage accéléré',           'Souffleurs professionnels : utilisable en 3 h.',               25, 30, 3),
  ('nettoyage-textile',    'tex-piece-sup', 'Pièce supplémentaire',       'Un fauteuil ou un tapis en plus pendant l''intervention.',     40, 35, 4),
  ('location-machines',    'loc-livraison', 'Livraison et reprise',       'Machine déposée et reprise à votre adresse.',                  35, 15, 1),
  ('location-machines',    'loc-produits',  'Pack produits pro',          'Détachant, shampooing et anti-mousse.',                        20,  5, 2),
  ('location-machines',    'loc-demo',      'Démonstration sur place',    'Prise en main guidée sur votre premier textile.',              30, 30, 3)
) as o(service_slug, slug, name, description, price, duration_min, sort_order)
  on o.service_slug = s.slug
on conflict (service_id, slug) do update
  set name = excluded.name, description = excluded.description,
      price = excluded.price, duration_min = excluded.duration_min,
      sort_order = excluded.sort_order;

-- ------------------------------------------------------------ galerie
insert into public.gallery_items (title, subtitle, category, image_path, sort_order) values
  ('Audi Q3 — intérieur complet', 'Sièges tissu, moquettes et plastiques', 'auto', '/media/audi-q3-interieur.jpg', 1),
  ('Porsche Panamera — vapeur',   'Console et cuir traités à la vapeur',   'auto', '/media/porsche-vapeur.jpg', 2),
  ('Audi S line — habitacle',     'Finition concession, prêt à livrer',    'auto', '/media/audi-s-line.jpg', 3),
  ('Détail siège',                'Injection-extraction en profondeur',    'textile', '/media/detail-siege.jpg', 4)
on conflict do nothing;

-- ---------------------------------------------------------------- FAQ
delete from public.faqs;
insert into public.faqs (question, answer, sort_order) values
  ('Où intervenez-vous ?',
   'Dans tout le Valais, directement chez vous : domicile, parking, place de travail. Le déplacement est compris dans le tarif pour le Valais central ; au-delà, une participation peut s''ajouter selon la distance.', 1),
  ('Ai-je besoin d''une prise électrique ou d''eau ?',
   'Une simple prise 230 V suffit. Nous apportons notre eau, nos machines et nos produits.', 2),
  ('Combien de temps dure une intervention ?',
   'Comptez environ 2 h 30 pour un intérieur de véhicule complet, 2 h pour un canapé. La durée exacte est calculée au moment de la réservation selon la formule et les options choisies.', 3),
  ('Pourquoi un acompte de 50 CHF ?',
   'L''acompte bloque le créneau et garantit que le rendez-vous sera honoré. Il est intégralement déduit du montant final de la prestation.', 4),
  ('Puis-je annuler ou déplacer mon rendez-vous ?',
   'Oui. Jusqu''à 48 h avant l''intervention, le rendez-vous est déplacé sans frais et l''acompte est reporté. Passé ce délai, l''acompte reste acquis.', 5),
  ('Combien de temps le textile met-il à sécher ?',
   'Entre 4 et 8 heures selon l''épaisseur et l''aération de la pièce. L''option séchage accéléré ramène ce délai à environ 3 heures.', 6),
  ('Vos produits sont-ils sûrs pour les enfants et les animaux ?',
   'Oui. Nous utilisons des produits professionnels sans solvant agressif, rincés par injection-extraction. Les surfaces sont utilisables dès qu''elles sont sèches.', 7),
  ('Comment se passe le paiement ?',
   'L''acompte est réglé en ligne au moment de la réservation. Le solde se règle sur place à la fin de l''intervention, en espèces ou par TWINT.', 8);

-- -------------------------------------------------------- témoignages
-- ⚠ Contenu de démonstration — à remplacer par de vrais avis clients.
delete from public.testimonials;
insert into public.testimonials (author, city, rating, content, service, is_demo, sort_order) values
  ('Exemple de démonstration 1', 'Sion',     5, 'Exemple de témoignage à remplacer par un véritable avis client avant la mise en ligne.', 'Nettoyage automobile', true, 1),
  ('Exemple de démonstration 2', 'Martigny', 5, 'Exemple de témoignage à remplacer par un véritable avis client avant la mise en ligne.', 'Nettoyage textile', true, 2),
  ('Exemple de démonstration 3', 'Sierre',   5, 'Exemple de témoignage à remplacer par un véritable avis client avant la mise en ligne.', 'Location de machines', true, 3);
