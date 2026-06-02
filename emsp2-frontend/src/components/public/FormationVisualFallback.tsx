import type { Formation } from "../../types";
import { resolvePublicAssetUrl } from "../../utils/media";

interface FormationVisualFallbackProps {
  formation: Pick<Formation, "code" | "name" | "programType" | "level">;
  className?: string;
}

const paletteByProgram: Record<Formation["programType"], { wrapper: string; badge: string }> = {
  FSP: {
    wrapper: "text-white",
    badge: "bg-white/20 text-white",
  },
  "FS-MENUM": {
    wrapper: "text-white",
    badge: "bg-primary text-dark",
  },
  FCQ: {
    wrapper: "text-white",
    badge: "bg-white/20 text-white",
  },
};

const formationFallbackImages = [
  resolvePublicAssetUrl("/media/imageemsp/IMG-20250705-WA0133.jpg"),
  resolvePublicAssetUrl("/media/imageemsp/Photo%20de%20Al%C3%A8ve(11).jpg"),
  resolvePublicAssetUrl("/media/imageemsp/IMG-20251206-WA0229(1).jpg"),
  resolvePublicAssetUrl("/media/imageemsp/IMG-20250605-WA0018.jpg"),
  resolvePublicAssetUrl("/media/imageemsp/Photo%20de%20Al%C3%A8ve(4).jpg"),
  resolvePublicAssetUrl("/media/imageemsp/Photo%20de%20Al%C3%A8ve(9).jpg"),
];

const getFallbackImage = (code: string) => {
  const total = code.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return formationFallbackImages[total % formationFallbackImages.length];
};

const FormationVisualFallback = ({ formation, className = "" }: FormationVisualFallbackProps) => {
  const palette = paletteByProgram[formation.programType];
  const imageUrl = getFallbackImage(formation.code);

  return (
    <div className={`relative h-full w-full overflow-hidden ${palette.wrapper} ${className}`}>
      <img src={imageUrl} alt={`Vie academique EMSP - ${formation.name}`} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/80 via-emerald-800/60 to-slate-950/35" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_45%)]" />
      <div className="relative flex h-full flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-3">
          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${palette.badge}`}>
            {formation.programType}
          </span>
          <span className="text-xs uppercase tracking-[0.22em] text-white/75">{formation.level}</span>
        </div>
        <div>
          <p className="font-display text-3xl font-bold leading-none">{formation.code}</p>
          <p className="mt-2 max-w-[18rem] text-sm leading-6 text-white/90">{formation.name}</p>
        </div>
      </div>
    </div>
  );
};

export default FormationVisualFallback;
