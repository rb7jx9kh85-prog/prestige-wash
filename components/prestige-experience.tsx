"use client";

import { FormEvent, PointerEvent, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Car,
  Check,
  ChevronRight,
  Clock3,
  Instagram,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";

const PHONE = "41754282715";
const heroImage =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2400&q=90";

const services = [
  {
    number: "01",
    title: "Automobile",
    eyebrow: "Intérieur & finition",
    copy: "Aspiration minutieuse, vapeur, sièges, cuirs, plastiques et finitions. Votre véhicule retrouve une sensation réellement nette.",
    image:
      "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1400&q=85",
  },
  {
    number: "02",
    title: "Textile",
    eyebrow: "Canapés, matelas & tapis",
    copy: "Extraction en profondeur des taches, poussières et odeurs, directement à votre domicile dans tout le Valais.",
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1400&q=85",
  },
  {
    number: "03",
    title: "Location",
    eyebrow: "Matériel professionnel",
    copy: "Louez une machine performante et réalisez votre nettoyage vous-même, avec nos conseils pour un résultat optimal.",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1400&q=85",
  },
];

const projects = [
  {
    type: "Automobile",
    title: "Habitacle intégral",
    meta: "Sion · 3 h 30",
    image:
      "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1800&q=88",
  },
  {
    type: "Textile",
    title: "Canapé clair",
    meta: "Conthey · 2 h",
    image:
      "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=1800&q=88",
  },
  {
    type: "Automobile",
    title: "Finition prestige",
    meta: "Bramois · 4 h",
    image:
      "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=1800&q=88",
  },
];

const processSteps = [
  ["01", "Diagnostic", "Nous observons les matières, les taches et le niveau de saleté."],
  ["02", "Préparation", "Chaque zone est préparée avec la méthode et les produits adaptés."],
  ["03", "Traitement", "Aspiration, vapeur et extraction en profondeur, sans raccourci."],
  ["04", "Contrôle", "Nous inspectons les détails et validons le résultat avec vous."],
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <a className={`brand ${compact ? "brand--compact" : ""}`} href="#top" aria-label="Prestige Wash, accueil">
      <span className="brand__mark">PW</span>
      <span className="brand__words">
        PRESTIGE <i>WASH</i>
      </span>
    </a>
  );
}

function Navigation({ onBook }: { onBook: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="nav-shell">
      <nav className="nav container">
        <Brand />
        <div className={`nav__links ${open ? "is-open" : ""}`}>
          <a href="#services" onClick={() => setOpen(false)}>Services</a>
          <a href="#methode" onClick={() => setOpen(false)}>Méthode</a>
          <a href="#resultats" onClick={() => setOpen(false)}>Résultats</a>
          <a href="#contact" onClick={() => setOpen(false)}>Contact</a>
        </div>
        <button className="nav__cta" onClick={onBook}>Réserver <ArrowDownRight size={17} /></button>
        <button className="nav__menu" onClick={() => setOpen(!open)} aria-label="Ouvrir le menu">
          {open ? <X /> : <Menu />}
        </button>
      </nav>
    </header>
  );
}

function Hero({ onBook }: { onBook: () => void }) {
  const section = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const eased = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.35 });
  const clip = useTransform(eased, [0.08, 0.82], ["inset(0 100% 0 0)", "inset(0 0% 0 0)"]);
  const beamLeft = useTransform(eased, [0.08, 0.82], ["0%", "100%"]);
  const copyOpacity = useTransform(eased, [0, 0.12, 0.7, 0.88], [1, 1, 1, 0]);
  const finishOpacity = useTransform(eased, [0.72, 0.92], [0, 1]);

  return (
    <section className="hero" id="top" ref={section}>
      <div className="hero__sticky">
        <div className="hero__image hero__image--before" style={{ backgroundImage: `url(${heroImage})` }} />
        <motion.div
          className="hero__image hero__image--after"
          style={{ backgroundImage: `url(${heroImage})`, clipPath: reduced ? "inset(0)" : clip }}
        />
        {!reduced && <motion.div className="hero__beam" style={{ left: beamLeft }} />}
        <div className="hero__veil" />
        <motion.div className="hero__copy container" style={{ opacity: reduced ? 1 : copyOpacity }}>
          <div className="hero__kicker"><span /> Nettoyage à domicile · Valais</div>
          <h1>L’excellence<br />dans chaque <em>détail.</em></h1>
          <p>Automobile & textile. Un résultat professionnel, directement chez vous.</p>
          <div className="hero__actions">
            <button className="button button--gold" onClick={onBook}>Choisir une prestation <ArrowRight size={18} /></button>
            <a className="button button--ghost" href={`https://wa.me/${PHONE}`} target="_blank" rel="noreferrer">
              Écrire sur WhatsApp
            </a>
          </div>
        </motion.div>
        <motion.div className="hero__finish" style={{ opacity: reduced ? 0 : finishOpacity }}>
          <span>Transformation terminée</span>
          <strong>La différence se voit.<br />La qualité se ressent.</strong>
          <button onClick={onBook}>Réserver maintenant <ArrowRight /></button>
        </motion.div>
        <div className="hero__trust">
          <div className="stars">★★★★★</div>
          <strong>5,0 / 5</strong>
          <span>19 avis clients</span>
        </div>
        <div className="hero__scroll"><span>Faites défiler pour révéler</span><i /></div>
      </div>
    </section>
  );
}

function Intro() {
  return (
    <section className="intro section-pad">
      <div className="container intro__grid">
        <div className="section-label"><span>01</span> Notre exigence</div>
        <div>
          <h2>Nous ne nettoyons pas simplement.<br /><em>Nous révélons.</em></h2>
          <div className="intro__body">
            <p>Chaque matière demande un geste précis. Chaque véhicule mérite le même niveau d’attention. Prestige Wash intervient chez vous, partout en Valais.</p>
            <div className="metric"><strong>100%</strong><span>mobile<br />en Valais</span></div>
            <div className="metric"><strong>5,0</strong><span>note Google<br />observée</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServiceSection({ onBook }: { onBook: () => void }) {
  return (
    <section className="services section-pad" id="services">
      <div className="container">
        <div className="heading-row">
          <div className="section-label section-label--light"><span>02</span> Nos services</div>
          <h2>Trois expertises.<br /><em>Une seule exigence.</em></h2>
        </div>
        <div className="service-grid">
          {services.map((service, index) => (
            <motion.article
              className="service-card"
              key={service.title}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: index * 0.08, duration: 0.7 }}
            >
              <div className="service-card__image" style={{ backgroundImage: `url(${service.image})` }}>
                <span>{service.number}</span>
                <div className="service-card__shine" />
              </div>
              <div className="service-card__copy">
                <small>{service.eyebrow}</small>
                <h3>{service.title}</h3>
                <p>{service.copy}</p>
                <button onClick={onBook}>Demander un créneau <ChevronRight size={17} /></button>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Inspection() {
  const [position, setPosition] = useState({ x: 62, y: 46 });
  const [active, setActive] = useState(false);
  const handlePointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPosition({ x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 });
    setActive(true);
  };
  const image = "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=2200&q=90";
  return (
    <section className="inspection section-pad">
      <div className="container inspection__header">
        <div className="section-label"><span>03</span> Voyez la différence</div>
        <div><h2>Inspectez le résultat.<br /><em>Dans les moindres détails.</em></h2><p>Déplacez la lampe sur le véhicule.</p></div>
      </div>
      <div
        className={`inspection__stage ${active ? "is-active" : ""}`}
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        onPointerLeave={() => setActive(false)}
        style={{ "--x": `${position.x}%`, "--y": `${position.y}%`, "--inspection-image": `url(${image})` } as React.CSSProperties}
      >
        <div className="inspection__dark" />
        <div className="inspection__reveal" />
        <div className="inspection__cursor"><Sparkles size={20} /><span>APRÈS</span></div>
        <div className="inspection__legend"><span>AVANT</span><i /><span>APRÈS</span></div>
      </div>
    </section>
  );
}

function ProcessJourney() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const carX = useTransform(scrollYProgress, [0, 1], ["-38vw", "38vw"]);
  const carRotate = useTransform(scrollYProgress, [0, 0.5, 1], [-8, 0, 8]);
  const line = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  return (
    <section className="journey" id="methode" ref={ref}>
      <div className="journey__sticky">
        <div className="container journey__head">
          <div className="section-label section-label--light"><span>04</span> La méthode</div>
          <h2>Quatre étapes.<br /><em>Aucun raccourci.</em></h2>
        </div>
        <div className="journey__track"><motion.i style={{ width: line }} /></div>
        <motion.div className="journey__car" style={{ x: carX, rotate: carRotate }}>
          <div className="journey__glow" /><Car strokeWidth={1.1} />
        </motion.div>
        <div className="container journey__steps">
          {processSteps.map(([number, title, copy]) => (
            <motion.div key={number} className="journey__step" initial={{ opacity: 0.28 }} whileInView={{ opacity: 1 }} viewport={{ margin: "-42% 0px -42%" }}>
              <span>{number}</span><strong>{title}</strong><p>{copy}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SteamBreak() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20%" });
  return (
    <div className="steam" ref={ref}>
      <AnimatePresence>
        {inView && Array.from({ length: 9 }).map((_, index) => (
          <motion.i
            key={index}
            initial={{ opacity: 0, x: "-20vw", y: (index % 3) * 60 - 60, scale: 0.5 }}
            animate={{ opacity: [0, 0.55, 0], x: "120vw", y: (index % 2 ? -1 : 1) * 80, scale: 1.8 }}
            transition={{ duration: 2.5 + index * 0.12, delay: index * 0.09, ease: "easeInOut" }}
          />
        ))}
      </AnimatePresence>
      <span>Une nouvelle sensation de propre.</span>
    </div>
  );
}

function Results() {
  return (
    <section className="results section-pad" id="resultats">
      <div className="container heading-row heading-row--dark">
        <div className="section-label"><span>05</span> Résultats</div>
        <h2>La preuve,<br /><em>image après image.</em></h2>
      </div>
      <div className="results__rail">
        {projects.map((project, index) => (
          <motion.article className="project" key={project.title} whileHover={{ y: -12 }} transition={{ type: "spring", stiffness: 170 }}>
            <div className="project__image" style={{ backgroundImage: `url(${project.image})` }}>
              <div className="project__before" />
              <div className="project__sweep"><span>APRÈS</span></div>
              <span className="project__index">0{index + 1}</span>
            </div>
            <div className="project__copy"><span>{project.type}</span><h3>{project.title}</h3><small>{project.meta}</small></div>
          </motion.article>
        ))}
      </div>
      <p className="results__hint"><ArrowLeft size={16} /> Faites glisser pour explorer <ArrowRight size={16} /></p>
    </section>
  );
}

function Trust() {
  const reviews = [
    ["Un résultat incroyable", "Travail minutieux et service très professionnel. La voiture a retrouvé une seconde jeunesse."],
    ["Ponctuel et efficace", "Intervention directement à domicile, très pratique. Le résultat dépasse mes attentes."],
    ["La différence est nette", "Les sièges et les tapis sont impeccables. Je recommande Prestige Wash sans hésiter."],
  ];
  return (
    <section className="trust section-pad">
      <div className="container trust__top">
        <div><div className="stars stars--large">★★★★★</div><h2>5,0 sur Google</h2><p>19 avis publics observés</p></div>
        <p>La confiance ne se promet pas.<br /><em>Elle se mérite.</em></p>
      </div>
      <div className="container review-grid">
        {reviews.map(([title, copy], index) => <article key={title}><span>“</span><p>{copy}</p><div><strong>{title}</strong><small>Avis client · 5 étoiles</small></div><i>0{index + 1}</i></article>)}
      </div>
      <p className="reviews-note container">Contenus de démonstration à remplacer par les avis Google réels avant publication.</p>
    </section>
  );
}

type BookingData = { service: string; vehicle: string; date: string; time: string; name: string; phone: string; location: string; notes: string };
const initialBooking: BookingData = { service: "", vehicle: "", date: "", time: "", name: "", phone: "", location: "", notes: "" };

function BookingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(initialBooking);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const update = (key: keyof BookingData, value: string) => setData((current) => ({ ...current, [key]: value }));
  const canContinue = step === 1 ? data.service && data.vehicle : step === 2 ? data.date && data.time : data.name && data.phone && data.location;
  async function submit(event: FormEvent) {
    event.preventDefault(); setStatus("loading");
    try {
      const response = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!response.ok) throw new Error("Supabase non configuré");
      setStatus("success");
    } catch {
      const message = `Bonjour Prestige Wash, je souhaite demander un créneau.\n\nPrestation : ${data.service}\nType : ${data.vehicle}\nDate souhaitée : ${data.date} à ${data.time}\nNom : ${data.name}\nCommune : ${data.location}\nTéléphone : ${data.phone}\nPrécisions : ${data.notes || "Aucune"}`;
      window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
      setStatus("success");
    }
  }
  function close() { onClose(); setTimeout(() => { setStep(1); setStatus("idle"); }, 250); }
  return (
    <AnimatePresence>
      {open && <motion.div className="modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="modal__panel" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}>
          <button className="modal__close" onClick={close} aria-label="Fermer"><X /></button>
          {status === "success" ? <div className="booking-success"><div><Check /></div><small>Demande préparée</small><h2>Merci, {data.name.split(" ")[0]}.</h2><p>Votre demande a été transmise. Prestige Wash vous confirmera le créneau personnellement.</p><button className="button button--gold" onClick={close}>Retour au site</button></div> : <form onSubmit={submit}>
            <div className="modal__head"><Brand compact /><span>Étape {step} sur 3</span></div>
            <div className="progress"><i style={{ width: `${step * 33.333}%` }} /></div>
            {step === 1 && <div className="booking-step"><small>Votre besoin</small><h2>Que souhaitez-vous nettoyer ?</h2><div className="choice-grid">
              {["Nettoyage automobile", "Nettoyage textile", "Location de machine"].map((item) => <button type="button" className={data.service === item ? "selected" : ""} onClick={() => update("service", item)} key={item}>{item}<Check /></button>)}
            </div><label>Type de véhicule ou textile<input value={data.vehicle} onChange={(e) => update("vehicle", e.target.value)} placeholder="Ex. SUV, canapé 3 places…" /></label></div>}
            {step === 2 && <div className="booking-step"><small>Votre disponibilité</small><h2>Quel moment vous conviendrait ?</h2><div className="field-row"><label><CalendarDays /> Date souhaitée<input type="date" value={data.date} min={new Date().toISOString().split("T")[0]} onChange={(e) => update("date", e.target.value)} /></label><label><Clock3 /> Heure souhaitée<select value={data.time} onChange={(e) => update("time", e.target.value)}><option value="">Sélectionner</option>{["08:00", "10:00", "13:00", "15:00", "17:00"].map((time) => <option key={time}>{time}</option>)}</select></label></div><p className="booking-note"><ShieldCheck /> Le créneau reste à confirmer selon la durée et le lieu de l’intervention.</p></div>}
            {step === 3 && <div className="booking-step"><small>Vos coordonnées</small><h2>Où pouvons-nous intervenir ?</h2><div className="field-row"><label>Nom complet<input value={data.name} onChange={(e) => update("name", e.target.value)} placeholder="Votre nom" /></label><label>Téléphone<input type="tel" value={data.phone} onChange={(e) => update("phone", e.target.value)} placeholder="07x xxx xx xx" /></label></div><label>Commune d’intervention<input value={data.location} onChange={(e) => update("location", e.target.value)} placeholder="Ex. Sion" /></label><label>Précisions facultatives<textarea value={data.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Taches, poils d’animaux, accès…" /></label></div>}
            <div className="modal__footer">{step > 1 ? <button type="button" className="back" onClick={() => setStep(step - 1)}><ArrowLeft /> Retour</button> : <span />}{step < 3 ? <button type="button" className="button button--gold" disabled={!canContinue} onClick={() => setStep(step + 1)}>Continuer <ArrowRight /></button> : <button className="button button--gold" disabled={!canContinue || status === "loading"}>{status === "loading" ? "Envoi…" : "Envoyer ma demande"} <ArrowRight /></button>}</div>
          </form>}
        </motion.div>
      </motion.div>}
    </AnimatePresence>
  );
}

function ChatAssistant({ onBook }: { onBook: () => void }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<string[]>(["Bonjour 👋 Je peux vous aider à choisir une prestation ou à préparer votre demande."]);
  const questions = useMemo(() => ["Vous déplacez-vous chez moi ?", "Quels textiles nettoyez-vous ?", "Comment obtenir un prix ?"], []);
  const answer = (question: string) => {
    const response = question.includes("déplacez") ? "Oui. Prestige Wash intervient à domicile dans tout le Valais. La commune sera confirmée lors de votre demande." : question.includes("textiles") ? "Canapés, matelas, tapis, fauteuils et sièges peuvent être traités selon leur matière et leur état." : "Le prix dépend du type, de la taille et de l’état. Envoyez votre besoin et quelques précisions pour recevoir un devis adapté.";
    setMessages((items) => [...items, question, response]);
  };
  return <><button className="chat-button" onClick={() => setOpen(!open)} aria-label="Assistant Prestige Wash"><MessageCircle /><span>Une question ?</span></button><AnimatePresence>{open && <motion.aside className="chat" initial={{ opacity: 0, y: 20, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: .96 }}><div className="chat__head"><div className="chat__avatar">PW</div><div><strong>Assistant Prestige</strong><span><i /> Disponible</span></div><button onClick={() => setOpen(false)}><X size={18} /></button></div><div className="chat__messages">{messages.map((message, index) => <p className={index > 0 && index % 2 === 1 ? "mine" : ""} key={`${message}-${index}`}>{message}</p>)}</div><div className="chat__questions">{questions.map((question) => <button key={question} onClick={() => answer(question)}>{question}</button>)}<button className="chat__book" onClick={() => { setOpen(false); onBook(); }}>Préparer ma demande <ArrowRight size={15} /></button></div></motion.aside>}</AnimatePresence></>;
}

function Footer({ onBook }: { onBook: () => void }) {
  return <footer id="contact"><div className="container footer__cta"><div><span>Prêt à retrouver cette sensation ?</span><h2>Offrez une seconde vie<br />à ce qui compte.</h2></div><button className="button button--gold button--large" onClick={onBook}>Demander un créneau <ArrowDownRight /></button></div><div className="container footer__main"><Brand /><div><small>Navigation</small><a href="#services">Services</a><a href="#methode">Notre méthode</a><a href="#resultats">Résultats</a></div><div><small>Contact</small><a href={`tel:+${PHONE}`}><Phone size={15} /> 075 428 27 15</a><a href={`https://wa.me/${PHONE}`}><MessageCircle size={15} /> WhatsApp</a><a href="https://instagram.com" target="_blank" rel="noreferrer"><Instagram size={15} /> Instagram</a></div><div><small>Zone</small><span><MapPin size={15} /> Tout le Valais</span><span>Route de Bramois 36<br />1967 Bramois</span></div></div><div className="container footer__bottom"><span>© {new Date().getFullYear()} Prestige Wash</span><span>Confidentialité · Mentions légales</span><span>Site conçu avec précision en Valais</span></div></footer>;
}

export default function PrestigeExperience() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const openBooking = () => setBookingOpen(true);
  return <main><Navigation onBook={openBooking} /><Hero onBook={openBooking} /><Intro /><ServiceSection onBook={openBooking} /><Inspection /><ProcessJourney /><SteamBreak /><Results /><Trust /><Footer onBook={openBooking} /><ChatAssistant onBook={openBooking} /><BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} /></main>;
}
