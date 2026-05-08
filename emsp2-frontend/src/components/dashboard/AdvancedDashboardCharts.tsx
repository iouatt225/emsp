import "echarts-gl";

import { Activity, Globe2, Network, Orbit, Wifi, WifiOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ForceGraph3D from "react-force-graph-3d";
import { ResponsiveSunburst } from "@nivo/sunburst";
import ReactECharts from "echarts-for-react";

import type { AdminDashboardData } from "../../types";
import SurfaceCard from "./SurfaceCard";

interface AdvancedDashboardChartsProps {
  advanced: AdminDashboardData["advanced"];
}

type StreamStatus = "connecting" | "live" | "offline";

const buildDashboardWebSocketUrl = (token: string) => {
  const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.REACT_APP_API_BASE_URL || "").replace(/\/+$/, "");

  if (rawBaseUrl && rawBaseUrl.startsWith("http")) {
    return `${rawBaseUrl.replace(/^http/, "ws").replace(/\/api$/, "")}/ws/dashboard/stream/?token=${encodeURIComponent(token)}`;
  }

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}/ws/dashboard/stream/?token=${encodeURIComponent(token)}`;
};

const formatCompactValue = (value: number) =>
  new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const AdvancedDashboardCharts = ({ advanced }: AdvancedDashboardChartsProps) => {
  const [streamPoints, setStreamPoints] = useState(advanced.streamSeed.slice(-18));
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("connecting");

  useEffect(() => {
    setStreamPoints(advanced.streamSeed.slice(-18));
  }, [advanced.streamSeed]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setStreamStatus("offline");
      return;
    }

    let isMounted = true;
    let retryCount = 0;
    let retryTimer: number | null = null;
    let socket: WebSocket | null = null;

    const connect = () => {
      if (!isMounted) return;

      setStreamStatus("connecting");
      socket = new WebSocket(buildDashboardWebSocketUrl(token));

      socket.onopen = () => {
        if (!isMounted) return;
        retryCount = 0;
        setStreamStatus("live");
      };

      socket.onmessage = (event) => {
        if (!isMounted) return;

        try {
          const payload = JSON.parse(event.data) as
            | { type: "seed"; points: AdminDashboardData["advanced"]["streamSeed"] }
            | { type: "point"; point: AdminDashboardData["advanced"]["streamSeed"][number] };

          if (payload.type === "seed") {
            setStreamPoints(payload.points.slice(-18));
            return;
          }

          setStreamPoints((current) => [...current.slice(-17), payload.point]);
        } catch (error) {
          console.error(error);
        }
      };

      socket.onerror = () => {
        if (isMounted) {
          setStreamStatus("offline");
        }
      };

      socket.onclose = () => {
        if (!isMounted) return;

        setStreamStatus("offline");
        const delay = Math.min(12000, 1500 * 2 ** retryCount);
        retryCount += 1;
        retryTimer = window.setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
      socket?.close();
    };
  }, []);

  const globeOption = useMemo(
    () => ({
      backgroundColor: "transparent",
      globe: {
        baseColor: "#102647",
        shading: "lambert",
        environment: "#020617",
        globeRadius: 88,
        light: {
          ambient: {
            intensity: 0.65,
          },
          main: {
            intensity: 1.2,
          },
        },
        viewControl: {
          autoRotate: true,
          autoRotateSpeed: 8,
          distance: 180,
          alpha: 18,
          beta: 155,
        },
      },
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        borderColor: "rgba(148, 163, 184, 0.22)",
        textStyle: {
          color: "#e2e8f0",
        },
      },
      series: [
        {
          type: "lines3D",
          coordinateSystem: "globe",
          blendMode: "lighter",
          effect: {
            show: true,
            trailWidth: 2,
            trailLength: 0.2,
            trailOpacity: 0.65,
            trailColor: "#fde047",
          },
          lineStyle: {
            width: 2,
            color: "#34d399",
            opacity: 0.75,
          },
          data: advanced.globe.arcs.map((item) => ({
            coords: [
              [item.fromLng, item.fromLat],
              [item.toLng, item.toLat],
            ],
            value: item.value,
            fromName: item.fromName,
            toName: item.toName,
          })),
        },
        {
          type: "scatter3D",
          coordinateSystem: "globe",
          label: {
            show: true,
            formatter: "{b}",
            position: "right",
            textStyle: {
              color: "#e2e8f0",
              fontSize: 10,
            },
          },
          symbolSize: (value: [number, number, number]) => Math.max(10, Math.sqrt(value[2]) * 5),
          data: advanced.globe.nodes.map((item) => ({
            name: item.city,
            value: [item.lng, item.lat, item.value],
            itemStyle: {
              color: item.kind === "hub" ? "#facc15" : "#60a5fa",
              opacity: 0.95,
            },
          })),
        },
      ],
    }),
    [advanced.globe.arcs, advanced.globe.nodes],
  );

  const streamingOption = useMemo(
    () => ({
      backgroundColor: "transparent",
      animation: true,
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        borderColor: "rgba(148, 163, 184, 0.22)",
        textStyle: {
          color: "#e2e8f0",
        },
      },
      legend: {
        top: 0,
        textStyle: {
          color: "#475569",
        },
      },
      grid: {
        left: 18,
        right: 18,
        top: 42,
        bottom: 16,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: streamPoints.map((item) => item.label),
        axisLabel: {
          color: "#64748b",
        },
        axisLine: {
          lineStyle: {
            color: "#cbd5e1",
          },
        },
      },
      yAxis: [
        {
          type: "value",
          name: "Volume",
          axisLabel: {
            color: "#64748b",
          },
          splitLine: {
            lineStyle: {
              color: "rgba(203, 213, 225, 0.45)",
            },
          },
        },
      ],
      dataZoom: [
        {
          type: "inside",
          startValue: Math.max(streamPoints.length - 12, 0),
          endValue: streamPoints.length - 1,
        },
      ],
      series: [
        {
          name: "Recettes",
          type: "line",
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 3, color: "#0f766e" },
          areaStyle: {
            color: "rgba(16, 185, 129, 0.16)",
          },
          data: streamPoints.map((item) => item.revenue),
        },
        {
          name: "Paiements en attente",
          type: "line",
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2, color: "#f59e0b" },
          data: streamPoints.map((item) => item.pendingPayments),
        },
        {
          name: "Candidatures en cours",
          type: "line",
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2, color: "#6366f1" },
          data: streamPoints.map((item) => item.pendingApplications),
        },
        {
          name: "Etudiants actifs",
          type: "line",
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2, color: "#ef4444" },
          data: streamPoints.map((item) => item.activeStudents),
        },
      ],
    }),
    [streamPoints],
  );

  const liveSummary = streamPoints[streamPoints.length - 1];

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

      <SurfaceCard className="overflow-hidden border-sky-100 bg-[radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.16),_transparent_42%),linear-gradient(180deg,_#ffffff,_#f8fbff)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-secondary">Geo-donnees</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-dark">3D Global Visualization</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Lecture immediate des flux entre les villes de provenance et le hub EMSP d&apos;Abidjan.
            </p>
          </div>
          <div className="rounded-2xl bg-sky-100/70 p-3 text-sky-700">
            <Globe2 size={20} />
          </div>
        </div>
        <div className="mt-5 overflow-hidden rounded-3xl bg-slate-950/95 p-2">
          <ReactECharts option={globeOption} style={{ height: 404 }} opts={{ renderer: "canvas" }} />
        </div>
      </SurfaceCard>

      <SurfaceCard className="overflow-hidden border-indigo-100 bg-[radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.16),_transparent_42%),linear-gradient(180deg,_#ffffff,_#f9faff)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-secondary">Performance</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-dark">Real-time Streaming Line Chart</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Flux temps reel sans rechargement sur les volumes cles du pilotage admin.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
            {streamStatus === "live" ? <Wifi size={14} className="text-secondary" /> : streamStatus === "connecting" ? <Activity size={14} className="text-primary" /> : <WifiOff size={14} className="text-red-500" />}
            {streamStatus === "live" ? "WebSocket actif" : streamStatus === "connecting" ? "Connexion..." : "Mode hors ligne"}
          </div>
        </div>
        {liveSummary ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Recettes</p>
              <p className="mt-2 font-display text-2xl font-bold text-dark">{formatCompactValue(liveSummary.revenue)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Paiements</p>
              <p className="mt-2 font-display text-2xl font-bold text-dark">{liveSummary.pendingPayments}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Candidatures</p>
              <p className="mt-2 font-display text-2xl font-bold text-dark">{liveSummary.pendingApplications}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Etudiants actifs</p>
              <p className="mt-2 font-display text-2xl font-bold text-dark">{liveSummary.activeStudents}</p>
            </div>
          </div>
        ) : null}
        <div className="mt-5 overflow-hidden rounded-3xl bg-white">
          <ReactECharts option={streamingOption} style={{ height: 330 }} opts={{ renderer: "canvas" }} />
        </div>
      </SurfaceCard>
    </div>
  );
};

export default AdvancedDashboardCharts;
