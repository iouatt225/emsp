import { useMutation } from "@tanstack/react-query";
import { Facebook, Linkedin, Mail, MapPin, Phone, Send, Twitter, Youtube } from "lucide-react";
import { useMemo, useState } from "react";

import { submitContactMessage } from "../../api/contactApi";
import { useSiteConfig } from "../../hooks/useSiteConfig";
import type { ContactMessagePayload } from "../../types";

type ContactFormErrors = Partial<Record<keyof ContactMessagePayload, string>>;

const defaultValues: ContactMessagePayload = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  subject: "information",
  message: "",
  honeypot: "",
};

const ContactPage = () => {
  const { data: site } = useSiteConfig();
  const [form, setForm] = useState<ContactMessagePayload>(defaultValues);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: submitContactMessage,
    onSuccess: () => {
      setSubmitted(true);
      setErrors({});
      setForm(defaultValues);
    },
  });

  const socialLinks = useMemo(
    () => [
      { href: site?.facebookUrl, label: "Facebook", icon: Facebook },
      { href: site?.twitterUrl, label: "Twitter", icon: Twitter },
      { href: site?.linkedinUrl, label: "LinkedIn", icon: Linkedin },
      { href: site?.youtubeUrl, label: "YouTube", icon: Youtube },
    ],
    [site],
  );

  const validate = () => {
    const nextErrors: ContactFormErrors = {};

    if (!form.firstName.trim()) nextErrors.firstName = "Le prenom est requis.";
    if (!form.lastName.trim()) nextErrors.lastName = "Le nom est requis.";
    if (!form.email.trim()) {
      nextErrors.email = "L'email est requis.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "L'email saisi est invalide.";
    }
    if (!form.subject) nextErrors.subject = "Le sujet est requis.";
    if (!form.message.trim()) nextErrors.message = "Le message est requis.";
    if (form.honeypot) nextErrors.honeypot = "Valeur invalide.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(false);
    if (!validate()) return;
    await mutation.mutateAsync(form);
  };

  const handleFieldChange = (field: keyof ContactMessagePayload, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  return (
    <div className="bg-slate-50">
      <section className="bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_58%,#fef9c3_100%)] py-16 text-dark">
        <div className="mx-auto max-w-7xl px-4">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-secondary">Contact</p>
          <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">Prenons contact avec l'EMSP</h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            Notre equipe reste a votre disposition pour toute demande d'information, d'inscription, de partenariat ou
            d'accompagnement institutionnel.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <article className="rounded-3xl bg-white p-6 shadow-sm">
            <MapPin className="text-secondary" size={24} />
            <h2 className="mt-4 font-display text-2xl font-semibold text-dark">Adresse</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {site?.address || "Treichville, Zone 3, Km4, Boulevard de Marseille, Abidjan"}
            </p>
          </article>
          <article className="rounded-3xl bg-white p-6 shadow-sm">
            <Phone className="text-secondary" size={24} />
            <h2 className="mt-4 font-display text-2xl font-semibold text-dark">Telephone</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {site?.phone1 || "+225 27 21 21 45 60"}
              {site?.phone2 ? ` / ${site.phone2}` : ""}
            </p>
          </article>
          <article className="rounded-3xl bg-white p-6 shadow-sm">
            <Mail className="text-secondary" size={24} />
            <h2 className="mt-4 font-display text-2xl font-semibold text-dark">Emails</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {site?.emailContact || "contact@emsp.int"}
              <br />
              {site?.emailInfo || "info@emsp.int"}
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <Send className="text-secondary" size={22} />
            <h2 className="font-display text-3xl font-bold text-dark">Ecrivez-nous</h2>
          </div>

          {submitted ? (
            <div className="mt-6 rounded-2xl border border-secondary/20 bg-secondary/10 px-4 py-3 text-sm text-secondary">
              Votre message a bien ete envoye. L'equipe EMSP vous repondra rapidement.
            </div>
          ) : null}
          {mutation.isError ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              L'envoi du message a echoue. Verifie le formulaire puis reessaie.
            </div>
          ) : null}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-dark">Prenom*</span>
                <input
                  value={form.firstName}
                  onChange={(event) => handleFieldChange("firstName", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary"
                />
                {errors.firstName ? <span className="mt-2 block text-sm text-red-600">{errors.firstName}</span> : null}
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-dark">Nom*</span>
                <input
                  value={form.lastName}
                  onChange={(event) => handleFieldChange("lastName", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary"
                />
                {errors.lastName ? <span className="mt-2 block text-sm text-red-600">{errors.lastName}</span> : null}
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-dark">Email*</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => handleFieldChange("email", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary"
                />
                {errors.email ? <span className="mt-2 block text-sm text-red-600">{errors.email}</span> : null}
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-dark">Telephone</span>
                <input
                  value={form.phone}
                  onChange={(event) => handleFieldChange("phone", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-dark">Sujet*</span>
              <select
                value={form.subject}
                onChange={(event) => handleFieldChange("subject", event.target.value as ContactMessagePayload["subject"])}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary"
              >
                <option value="information">Information</option>
                <option value="inscription">Inscription</option>
                <option value="partenariat">Partenariat</option>
                <option value="autre">Autre</option>
              </select>
            </label>

            <label className="hidden">
              <span>Website</span>
              <input
                value={form.honeypot}
                onChange={(event) => handleFieldChange("honeypot", event.target.value)}
                autoComplete="off"
                tabIndex={-1}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-dark">Message*</span>
              <textarea
                rows={6}
                value={form.message}
                onChange={(event) => handleFieldChange("message", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary"
              />
              {errors.message ? <span className="mt-2 block text-sm text-red-600">{errors.message}</span> : null}
            </label>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-secondary px-5 py-3 font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Send size={16} />
              {mutation.isPending ? "Envoi en cours..." : "Envoyer"}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
            <iframe
              title="Carte EMSP"
              src="https://www.google.com/maps?q=5.3069,-4.0211&z=15&output=embed"
              className="h-[420px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-[linear-gradient(135deg,#f0fdf4_0%,#ffffff_55%,#fefce8_100%)] p-6 text-dark shadow-sm">
            <h2 className="font-display text-2xl font-semibold">Nos canaux officiels</h2>
            <p className="mt-3 text-sm text-slate-600">
              Consultez nos plateformes officielles pour suivre l'actualite de l'ecole et rester informe de nos
              annonces institutionnelles.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {socialLinks.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                    href
                      ? "bg-white text-dark ring-1 ring-emerald-100 transition hover:bg-secondary hover:text-white"
                      : "pointer-events-none bg-white/60 text-slate-400 ring-1 ring-slate-200"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
