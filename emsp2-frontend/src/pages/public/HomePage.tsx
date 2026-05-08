import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Globe2, GraduationCap, Laptop, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import FormationVisualFallback from "../../components/public/FormationVisualFallback";
import { useFormations } from "../../hooks/useFormations";
import { useMedia } from "../../hooks/useMedia";
import { useNews } from "../../hooks/useNews";
import { useSiteConfig } from "../../hooks/useSiteConfig";
import { getFormationPath } from "../../utils/formations";

const stats = [
  { label: "Pays Membres", target: 8 },
  { label: "Annees d'Excellence", target: 50 },
  { label: "Diplomes Formes", target: 5000 },
  { label: "Programmes de Formation", target: 15 },
];

const heroTitles = [
  "Former l'Elite Postale de l'Afrique depuis 1970",
  "8 Pays Membres, Une Vision Commune : l'Excellence",
  "Rejoignez une Institution Intergouvernementale d'Exception",
];

const primaryHeroImage = {
  id: -1,
  title: heroTitles[0],
  url: "/media/imageemsp/Photo%20de%20Al%C3%A8ve.jpg",
  altText: "Etudiants EMSP alignes dans la cour",
  type: "image" as const,
  category: "hero",
  createdAt: "",
};

const fallbackHeroImages = [
  primaryHeroImage,
  {
    id: -2,
    title: heroTitles[1],
    url: "/media/imageemsp/Photo%20de%20Al%C3%A8ve(12).jpg",
    altText: "Etudiants EMSP accueillant une responsable academique",
    type: "image" as const,
    category: "hero",
    createdAt: "",
  },
  {
    id: -3,
    title: heroTitles[2],
    url: "/media/imageemsp/Photo%20de%20Al%C3%A8ve(14).jpg",
    altText: "Etudiants EMSP reunis dans la cour de l'ecole",
    type: "image" as const,
    category: "hero",
    createdAt: "",
  },
];

const fallbackPresentationImage = {
  id: -10,
  title: "Atelier IAC",
  url: "/static/emsp/images/home-iac-classroom.jpg",
  altText: "Etudiants EMSP dans une salle IAC",
  type: "image" as const,
  category: "fallback",
  createdAt: "",
};

const fallbackWhyImage = {
  id: -11,
  title: "Certification ARTCI ITU",
  url: "/static/emsp/images/home-artci-itu.jpg",
  altText: "Groupe EMSP lors d'une certification ARTCI ITU",
  type: "image" as const,
  category: "fallback",
  createdAt: "",
};

const fallbackPromoImage = {
  id: -12,
  title: "Ivoire Tech Forum",
  url: "/static/emsp/images/home-tech-forum.jpg",
  altText: "EMSP au Ivoire Tech Forum",
  type: "image" as const,
  category: "fallback",
  createdAt: "",
};

const featureCards = [
  {
    title: "Formations accreditees",
    description: "Des parcours construits autour des standards de l'UPU et des besoins des operateurs postaux.",
    icon: ShieldCheck,
  },
  {
    title: "Cursus complets",
    description: "FSP, FS-MENUM et parcours d'excellence internationale pour couvrir les enjeux postaux et numeriques.",
    icon: GraduationCap,
  },
  {
    title: "Approche terrain",
    description: "Des contenus professionnalisants concus pour les administrations, entreprises et managers du secteur.",
    icon: Laptop,
  },
  {
    title: "Reseau regional",
    description: "Une institution intergouvernementale reliee a huit pays membres et a un ecosysteme partenaire solide.",
    icon: Globe2,
  },
];

const valuePoints = [
  {
    step: "01",
    title: "Un enseignement ancre dans les metiers",
    description: "Les modules sont penses pour repondre aux priorites postales, logistiques et digitales du terrain.",
  },
  {
    step: "02",
    title: "Une montee en competence progressive",
    description: "Du perfectionnement court aux parcours diplomants, chaque niveau s'inscrit dans une logique de progression.",
  },
  {
    step: "03",
    title: "Un levier pour les institutions et les talents",
    description: "L'EMSP aide les organisations a structurer leurs equipes tout en ouvrant des debouches concrets aux apprenants.",
  },
];

const fallbackMemberCountries = [
  "Benin",
  "Burkina Faso",
  "Cote d'Ivoire",
  "Mali",
  "Mauritanie",
  "Niger",
  "Senegal",
  "Togo",
];

const partnerLogoModules = import.meta.glob("../../../../logopartenaire/*.{png,jpg,jpeg,svg,webp}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const formatPartnerTitle = (path: string) =>
  path
    .split(/[\\/]/)
    .pop()
    ?.replace(/\.(png|jpe?g|svg|webp)$/gi, "")
    .replace(/[_()]+/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Partenaire EMSP";

const rootPartnerLogos = Object.entries(partnerLogoModules)
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([path, url], index) => ({
    id: -(index + 2000),
    title: formatPartnerTitle(path),
    url,
    altText: formatPartnerTitle(path),
    type: "image" as const,
    category: "partenaires",
    createdAt: "",
  }));

const HomePage = () => {
  const { data: site } = useSiteConfig();
  const { data: flagImages = [] } = useMedia("drapeaux", "image");
  const { data: partnerImages = [] } = useMedia("partenaires", "image");
  const { data: formations = [] } = useFormations({ limit: 8 });
  const { data: news = [] } = useNews({ limit: 3 });

  const [activeSlide, setActiveSlide] = useState(0);
  const [hoveringHero, setHoveringHero] = useState(false);
  const [visibleStats, setVisibleStats] = useState<number[]>(stats.map(() => 0));
  const statsRef = useRef<HTMLElement | null>(null);

  const heroSlides = useMemo(
    () => {
      const orderedSlides = fallbackHeroImages;

      return orderedSlides.map((item, index) => ({
        ...item,
        title: heroTitles[index] || heroTitles[0],
      }));
    },
    [],
  );
  const partnerLogos = useMemo(() => {
    const mergedPartners = [...rootPartnerLogos, ...partnerImages.filter((item) => item.url)];
    const seenUrls = new Set<string>();
    return mergedPartners.filter((item) => {
      if (seenUrls.has(item.url)) {
        return false;
      }

      seenUrls.add(item.url);
      return true;
    });
  }, [partnerImages]);
  const memberCountries = useMemo(() => {
    const activeFlags = flagImages.filter((item) => item.url).slice(0, 8);

    if (activeFlags.length) {
      return activeFlags.map((item, index) => ({
        id: item.id,
        name: item.title || item.altText || fallbackMemberCountries[index] || `Pays ${index + 1}`,
        url: item.url,
        altText: item.altText || item.title || fallbackMemberCountries[index] || `Pays ${index + 1}`,
      }));
    }

    return fallbackMemberCountries.map((name, index) => ({
      id: -(index + 1),
      name,
      url: "",
      altText: name,
    }));
  }, [flagImages]);
  const presentationImage = fallbackPresentationImage;
  const whyImage = fallbackWhyImage;
  const promoImage = fallbackPromoImage;

  useEffect(() => {
    if (heroSlides.length <= 1 || hoveringHero) return;
    const id = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 2000);
    return () => window.clearInterval(id);
  }, [heroSlides.length, hoveringHero]);

  useEffect(() => {
    if (!statsRef.current) return;
    const node = statsRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          stats.forEach((item, index) => {
            let current = 0;
            const increment = Math.max(1, Math.floor(item.target / 40));
            const interval = window.setInterval(() => {
              current += increment;
              if (current >= item.target) {
                current = item.target;
                window.clearInterval(interval);
              }
              setVisibleStats((prev) => {
                const next = [...prev];
                next[index] = current;
                return next;
              });
            }, 25);
          });
          observer.disconnect();
        });
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-white">
      {site?.showHomepageBanner !== false && site?.homepageBannerText ? (
        <section className="overflow-hidden bg-[#B91C1C] text-white">
          <div className="flex w-max animate-marquee items-center gap-10 py-3">
            {[0, 1].map((groupIndex) => (
              <div key={groupIndex} className="flex items-center gap-10 px-4">
                {Array.from({ length: 4 }).map((_, itemIndex) => (
                  <div key={`${groupIndex}-${itemIndex}`} className="flex shrink-0 items-center gap-3">
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white">
                      Infos EMSP
                    </span>
                    <p className="whitespace-nowrap text-sm font-medium text-white/95 sm:text-base">
                      {site.homepageBannerText}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section
        className="relative h-[60vh] min-h-[480px] overflow-hidden lg:h-[90vh]"
        onMouseEnter={() => setHoveringHero(true)}
        onMouseLeave={() => setHoveringHero(false)}
      >
        {heroSlides.length > 0 ? (
          heroSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ${index === activeSlide ? "opacity-100" : "opacity-0"}`}
            >
              <img src={slide.url} alt={slide.altText || slide.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/80 to-emerald-700/20" />
            </div>
          ))
        ) : (
          <div className="absolute inset-0 bg-slate-200" />
        )}

        <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-4">
          <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl text-white">
            <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-6xl">
              {heroSlides[activeSlide]?.title || "EMSP - Excellence postale africaine"}
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/85 lg:text-lg">
              Institution intergouvernementale sous l'egide de l'UPU, au service du developpement des competences postales, logistiques et numeriques en Afrique.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/formations" className="rounded-md bg-primary px-5 py-3 font-semibold text-dark">
                Nos Formations
              </Link>
              <Link to="/contact" className="rounded-md border border-white px-5 py-3 font-semibold text-white">
                Nous Contacter
              </Link>
            </div>
          </motion.div>
        </div>

        <button
          aria-label="Slide precedent"
          className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur"
          onClick={() => setActiveSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
          disabled={heroSlides.length <= 1}
        >
          <ChevronLeft size={20} />
        </button>
        <button
          aria-label="Slide suivant"
          className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur"
          onClick={() => setActiveSlide((prev) => (prev + 1) % heroSlides.length)}
          disabled={heroSlides.length <= 1}
        >
          <ChevronRight size={20} />
        </button>
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {(heroSlides.length ? heroSlides : [1, 2, 3]).map((_, idx) => (
            <button
              key={`dot-${idx}`}
              aria-label={`Aller au slide ${idx + 1}`}
              className={`h-2.5 w-2.5 rounded-full ${idx === activeSlide ? "bg-secondary" : "bg-white/80"}`}
              onClick={() => setActiveSlide(idx)}
            />
          ))}
        </div>
      </section>

      <section ref={statsRef} className="bg-secondary py-8 text-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 md:grid-cols-4">
          {stats.map((item, index) => (
            <div key={item.label} className="text-center md:border-r md:border-white/30 md:last:border-r-0">
              <p className="font-display text-4xl font-bold">{visibleStats[index]}{item.target > 9 ? "+" : ""}</p>
              <p className="mt-1 text-sm text-white/90">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <span className="text-sm font-semibold uppercase tracking-wide text-secondary">A propos de l'EMSP</span>
          <h2 className="mt-3 font-display text-3xl font-bold text-dark">Former les talents postaux et numeriques de la sous-region</h2>
          <p className="mt-4 text-slate-600">
            {site?.aboutText ||
              "L'EMSP propose des cursus de haut niveau organises autour des Formations Superieures Postales et du management de l'economie numerique, pour accompagner les administrations, entreprises et professionnels des Etats membres."}
          </p>
          <Link to="/contact" className="mt-6 inline-flex rounded-md bg-primary px-5 py-3 font-semibold text-dark">
            En savoir plus
          </Link>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
          <div className="absolute -left-4 -top-4 h-24 w-24 rounded-xl bg-secondary/25" />
          <img
            src={presentationImage.url}
            alt={presentationImage.altText || presentationImage.title}
            className="relative z-10 h-full max-h-[360px] w-full rounded-xl object-cover"
          />
        </motion.div>
      </section>

      <section className="bg-[linear-gradient(180deg,#f8fafc_0%,#ecfdf5_100%)] py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="max-w-2xl">
            <span className="text-sm font-semibold uppercase tracking-wide text-secondary">Pourquoi choisir l'EMSP</span>
            <h2 className="mt-3 font-display text-3xl font-bold text-dark">Les atouts qui font la difference</h2>
            <p className="mt-3 text-slate-600">
              Une institution de reference pour former, specialiser et accompagner les profils qui font avancer les services postaux et numeriques.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="group rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)] transition hover:-translate-y-1 hover:shadow-[0_28px_70px_-38px_rgba(34,197,94,0.35)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                    <Icon size={24} />
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold text-dark">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-dark">Nos Programmes de Formation</h2>
            <p className="mt-2 text-slate-600">Des cursus adaptes aux enjeux postaux et numeriques africains</p>
          </div>
        <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-3">
          <article className="flex h-full overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-secondary/20 transition hover:-translate-y-1 hover:shadow-[0_24px_55px_-35px_rgba(34,197,94,0.45)]">
            <div className="flex w-full flex-col">
              <img
                src="/media/imageemsp/IMG-20250705-WA0133.jpg"
                alt="Etudiants EMSP reunis dans une salle"
                className="h-48 w-full object-cover"
              />
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-xl font-semibold text-dark">FSP - Formations Superieures Postales</h3>
                <p className="mt-2 text-sm text-slate-600">ADM | INP | CTR</p>
                <Link to="/formations/fsp" className="mt-auto inline-flex w-fit rounded-md bg-primary px-4 py-2 font-semibold text-dark">
                Decouvrir FSP
              </Link>
              </div>
            </div>
            </article>
            <article className="flex h-full overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-secondary/20 transition hover:-translate-y-1 hover:shadow-[0_24px_55px_-35px_rgba(34,197,94,0.45)]">
              <div className="flex w-full flex-col">
                <img
                  src="/media/imageemsp/Photo%20de%20Al%C3%A8ve(11).jpg"
                  alt="Conference academique EMSP en salle"
                  className="h-48 w-full object-cover"
                />
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-xl font-semibold text-dark">FS-MENUM</h3>
                  <p className="mt-2 text-sm text-slate-600">Licences et masters professionnels : LNUM, FDIG, MDIG, DSER, LECO, FMER, MDEB et TNOR</p>
                  <Link to="/formations/fs-menum" className="mt-auto inline-flex w-fit rounded-md bg-secondary px-4 py-2 font-semibold text-white">
                Decouvrir FS-MENUM
              </Link>
                </div>
              </div>
            </article>
            <article className="flex h-full overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-primary/50 transition hover:-translate-y-1 hover:shadow-[0_24px_55px_-35px_rgba(250,204,21,0.4)]">
              <div className="flex w-full flex-col">
                <img
                  src="/media/imageemsp/IMG-20251206-WA0229(1).jpg"
                  alt="Delegation EMSP au Ivoire Tech Forum"
                  className="h-48 w-full object-cover"
                />
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-xl font-semibold text-dark">Pole d'Excellence International</h3>
                  <p className="mt-2 text-sm text-slate-600">MS-RegNUM en co-diplomation avec Telecom Paris pour les cadres de la regulation numerique</p>
                  <Link to="/formations/fs-menum/ms-regnum" className="mt-auto inline-flex w-fit rounded-md bg-secondary px-4 py-2 font-semibold text-white">
                Voir MS-RegNUM
              </Link>
                </div>
              </div>
            </article>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {formations.slice(0, 4).map((formation) => (
              <article key={formation.code} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="h-44 bg-slate-100">
                  {formation.coverImage ? (
                    <img
                      src={formation.coverImage.url}
                      alt={formation.coverImage.altText || formation.coverImage.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FormationVisualFallback formation={formation} />
                  )}
                </div>
                <div className="p-5">
                  <span className="rounded-full bg-secondary/10 px-2 py-1 text-xs font-semibold text-secondary">
                    {formation.programType}
                  </span>
                  <h3 className="mt-3 font-display text-xl font-semibold text-dark">{formation.code} - {formation.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">{formation.duration}</p>
                  <p className="mt-3 line-clamp-3 text-sm text-slate-600">{formation.description}</p>
                  <Link to={getFormationPath(formation)} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-secondary">
                    Voir le programme <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          {formations.length === 0 ? <p className="mt-4 text-center text-sm text-slate-500">Aucune formation chargee depuis l'API pour le moment.</p> : null}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <span className="text-sm font-semibold uppercase tracking-wide text-secondary">Pourquoi nous rejoindre</span>
          <h2 className="mt-3 font-display text-3xl font-bold text-dark">Les meilleures raisons de choisir l'EMSP</h2>
          <p className="mt-4 text-slate-600">
            Diplomes reconnus, encadrement de qualite et ecosysteme professionnel solide : l'EMSP relie les ambitions des apprenants aux besoins concrets des services postaux, logistiques et numeriques.
          </p>
          <div className="mt-8 space-y-4">
            {valuePoints.map((item) => (
              <div key={item.step} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary font-display text-sm font-bold text-dark">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-dark">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/60 blur-2xl" />
          <img
            src={whyImage.url}
            alt={whyImage.altText || whyImage.title}
            className="relative z-10 h-full min-h-[340px] w-full rounded-[32px] object-cover shadow-[0_30px_80px_-40px_rgba(15,23,42,0.55)]"
          />
        </motion.div>
      </section>

      <section className="bg-[linear-gradient(135deg,#f0fdf4_0%,#ffffff_52%,#fefce8_100%)] py-16 text-dark">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-sm font-semibold uppercase tracking-[0.28em] text-secondary">Opportunites</span>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight lg:text-5xl">
              Une institution, des dizaines de debouches pour les talents postaux et numeriques
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              L'EMSP accompagne la transformation des services, la professionnalisation des equipes et l'employabilite des apprenants dans toute la sous-region.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/formations" className="rounded-md bg-primary px-5 py-3 font-semibold text-dark">
                Explorer les formations
              </Link>
              <Link to="/inscription" className="rounded-md border border-secondary/30 bg-white px-5 py-3 font-semibold text-secondary">
                Deposer une candidature
              </Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                <p className="text-sm uppercase tracking-wide text-slate-500">Cursus</p>
                <p className="mt-2 font-display text-2xl font-bold text-primary">3</p>
                <p className="mt-1 text-sm text-slate-600">grandes familles de programmes</p>
              </div>
              <div className="group/flags relative min-h-[188px] overflow-hidden rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(15,23,42,0.18)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.16),transparent_48%)] opacity-0 transition duration-300 group-hover/flags:opacity-100" />
                <div className="relative z-10 transition duration-300 group-hover/flags:-translate-y-5 group-hover/flags:opacity-0">
                  <p className="text-sm uppercase tracking-wide text-slate-500">Portee</p>
                  <p className="mt-2 font-display text-2xl font-bold text-primary">8</p>
                  <p className="mt-1 text-sm text-slate-600">pays membres relies par l'ecole</p>
                  <p className="mt-5 text-xs uppercase tracking-[0.28em] text-slate-400">Survolez pour explorer</p>
                </div>
                <div className="pointer-events-none absolute inset-0 z-10 p-3 opacity-0 transition duration-300 group-hover/flags:opacity-100">
                  <div className="rounded-[22px] border border-emerald-100 bg-[linear-gradient(135deg,#f0fdf4_0%,#ffffff_55%,#fefce8_100%)] p-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-secondary">Reseau EMSP</p>
                        <p className="mt-1 text-sm font-semibold text-dark">8 pays membres</p>
                      </div>
                      <div className="rounded-full border border-secondary/15 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                        UPU
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {memberCountries.map((country, index) => (
                        <div
                          key={country.id}
                          className="flex translate-y-2 items-center gap-2 rounded-xl border border-emerald-100 bg-white px-2 py-2 opacity-0 transition duration-300 group-hover/flags:translate-y-0 group-hover/flags:opacity-100"
                          style={{ transitionDelay: `${60 + index * 35}ms` }}
                        >
                          {country.url ? (
                            <img src={country.url} alt={country.altText} className="h-8 w-10 rounded-lg object-cover shadow-sm" />
                          ) : (
                            <div className="flex h-8 w-10 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-semibold uppercase text-slate-500">
                              {country.name.slice(0, 2)}
                            </div>
                          )}
                          <span className="text-[11px] font-medium leading-4 text-dark">{country.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                <p className="text-sm uppercase tracking-wide text-slate-500">Impact</p>
                <p className="mt-2 font-display text-2xl font-bold text-primary">50+</p>
                <p className="mt-1 text-sm text-slate-600">annees de transmission d'expertise</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative">
            <img
              src={promoImage.url}
              alt={promoImage.altText || promoImage.title}
              className="h-full min-h-[320px] w-full rounded-[32px] border border-white object-cover shadow-[0_30px_80px_-35px_rgba(15,23,42,0.3)]"
            />
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold text-dark">Dernieres Actualites</h2>
            <p className="mt-2 text-slate-600">Informations institutionnelles et vie academique</p>
          </div>
          <Link to="/actualites" className="hidden rounded-md border border-secondary px-4 py-2 font-semibold text-secondary md:inline-flex">
            Toutes les actualites
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {news.slice(0, 3).map((item) => (
            <motion.article key={item.id} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="h-48 w-full bg-slate-100">
                {item.coverImage ? (
                  item.coverImage.type === "video" ? (
                    <video src={item.coverImage.url} className="h-full w-full object-cover" muted playsInline />
                  ) : (
                    <img src={item.coverImage.url} alt={item.coverImage.altText || item.title} className="h-full w-full object-cover" />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">Aucune couverture</div>
                )}
              </div>
              <div className="p-5">
                <span className="rounded-full bg-secondary/10 px-2 py-1 text-xs font-semibold text-secondary">
                  {item.category || "Actualite"}
                </span>
                <h3 className="mt-3 line-clamp-2 font-display text-xl font-semibold text-dark">{item.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">{item.excerpt}</p>
                <p className="mt-3 text-xs text-slate-500">{new Date(item.publishedAt).toLocaleDateString("fr-FR")}</p>
                <Link to={`/actualites/${item.slug || item.id}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-secondary">
                  Lire la suite <ArrowRight size={14} />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-center font-display text-3xl font-bold text-dark">Nos 8 Pays Membres</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {flagImages.slice(0, 8).map((item) => (
              <div key={item.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <img src={item.url} alt={item.altText || item.title} className="h-28 w-full object-cover" />
                <p className="p-3 text-center text-sm font-medium text-dark">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary py-14 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="font-display text-3xl font-bold">Pret a Rejoindre l'EMSP ?</h2>
          <p className="mt-3 text-white/90">Les inscriptions pour l'annee academique en cours sont ouvertes.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/inscription" className="rounded-md bg-primary px-5 py-3 font-semibold text-dark">
              S'inscrire maintenant
            </Link>
            <Link to="/contact" className="rounded-md border border-white px-5 py-3 font-semibold text-white">
              Telecharger la brochure
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary">Partenaires</p>
            <h2 className="mt-4 font-display text-4xl font-bold uppercase tracking-tight text-secondary sm:text-5xl lg:text-6xl">
              Ils Nous Ont Fait Confiance
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Institutions, operateurs, ecoles et organisations internationales accompagnent la dynamique de formation et d'innovation de l'EMSP.
            </p>
          </div>

          <div
            className="mt-12 rounded-[36px] border border-slate-200 bg-white px-4 py-8 shadow-[0_32px_90px_-55px_rgba(15,23,42,0.35)] sm:px-6 lg:px-8"
          >
            {partnerLogos.length > 0 ? (
              <>
                <div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-secondary">Reseau partenaire</p>
                    <p className="mt-2 text-sm text-slate-600">
                      Un reseau institutionnel, academique et technique mobilise autour de l'excellence EMSP.
                    </p>
                  </div>
                </div>

                <div className="relative mt-8 overflow-hidden">
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white to-transparent" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white to-transparent" />
                  <div className="flex w-max animate-marquee gap-5 py-2">
                    {[...partnerLogos, ...partnerLogos].map((item, index) => (
                      <article
                        key={`${item.id}-${index}`}
                        className="group flex h-36 w-[300px] shrink-0 items-center justify-center rounded-[28px] border border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-6 py-5 shadow-sm transition hover:-translate-y-1 hover:border-secondary/20 hover:shadow-[0_24px_50px_-30px_rgba(34,197,94,0.35)] sm:w-[360px]"
                      >
                          <img
                            src={item.url}
                            alt={item.altText || item.title}
                            className="max-h-20 w-auto object-contain transition duration-300 group-hover:scale-[1.03]"
                          />
                      </article>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-10 text-center text-sm text-slate-500">Aucun partenaire disponible pour le moment.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
