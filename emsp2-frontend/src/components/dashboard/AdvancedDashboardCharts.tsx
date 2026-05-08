import { Network, Orbit } from "lucide-react";
import ForceGraph3D from "react-force-graph-3d";
import { ResponsiveSunburst } from "@nivo/sunburst";

import type { AdminDashboardData } from "../../types";
import SurfaceCard from "./SurfaceCard";

interface AdvancedDashboardChartsProps {
  advanced: AdminDashboardData["advanced"];
}

const AdvancedDashboardCharts = ({ advanced }: AdvancedDashboardChartsProps) => {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <SurfaceCard className="overflow-hidden border-emerald-100 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_48%),linear-gradient(180deg,_#ffffff,_#f8fafc)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-secondary">Relations complexes</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-dark">3D Force Graph</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Connexions directes entre etudiants, filieres, promotions et zones d&apos;origine.
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-100/70 p-3 text-emerald-700">
            <Network size={20} />
          </div>
        </div>
        <div className="mt-5 h-[420px] overflow-hidden rounded-3xl bg-slate-950/95">
          <ForceGraph3D
            graphData={advanced.forceGraph}
            backgroundColor="rgba(2,6,23,0.98)"
            nodeLabel={(node) => `${node.name} (${node.type})`}
            nodeColor={(node) => node.color}
            nodeVal={(node) => node.value}
            linkColor={() => "rgba(148,163,184,0.35)"}
            linkWidth={(link) => Math.max(Number(link.value) * 0.45, 0.8)}
            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={(link) => Math.max(Number(link.value) * 0.0035, 0.002)}
            linkDirectionalParticleWidth={2}
            cooldownTicks={120}
          />
        </div>
      </SurfaceCard>

      <SurfaceCard className="overflow-hidden border-amber-100 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.18),_transparent_42%),linear-gradient(180deg,_#ffffff,_#fffdf6)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-secondary">Hierarchie</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-dark">Drill-down Sunburst</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Explore les sous-categories par filiere, promotion et bassin d&apos;origine en un clic.
            </p>
          </div>
          <div className="rounded-2xl bg-amber-100/70 p-3 text-amber-700">
            <Orbit size={20} />
          </div>
        </div>
        <div className="mt-5 h-[420px] rounded-3xl bg-white">
          <ResponsiveSunburst
            data={advanced.sunburst}
            id="name"
            value="value"
            margin={{ top: 18, right: 18, bottom: 18, left: 18 }}
            cornerRadius={4}
            borderWidth={1}
            borderColor={{ theme: "background" }}
            colors={{ scheme: "spectral" }}
            childColor={{
              from: "color",
              modifiers: [["brighter", 0.08]],
            }}
            animate
            motionConfig="gentle"
            enableArcLabels
            arcLabelsSkipAngle={12}
            arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2.4]] }}
          />
        </div>
      </SurfaceCard>
    </div>
  );
};

export default AdvancedDashboardCharts;
