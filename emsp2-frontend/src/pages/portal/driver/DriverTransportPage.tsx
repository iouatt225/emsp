import { BusFront, Clock3, Plus, Route as RouteIcon } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import axiosInstance from "../../../api/axiosConfig";
import SurfaceCard from "../../../components/dashboard/SurfaceCard";
import { formatDate, formatDateTime } from "../../../utils/formatDate";

type DriverProfile = {
  id: number;
  full_name: string;
  email: string;
  car?: number | null;
  car_label: string;
  route_label: string;
  phone: string;
  license_number: string;
  is_active: boolean;
  created_at: string;
};

type DriverTrip = {
  id: number;
  service_date: string;
  departure_time?: string | null;
  arrival_time?: string | null;
  car_label: string;
  route_label: string;
  notes: string;
  created_at: string;
};

type DriverTripResponse = {
  driver: DriverProfile;
  trips: DriverTrip[];
};

const DriverTransportPage = () => {
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [trips, setTrips] = useState<DriverTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    serviceDate: new Date().toISOString().slice(0, 10),
    departureTime: "",
    arrivalTime: "",
    notes: "",
  });

  const loadTrips = async () => {
    const response = await axiosInstance.get<DriverTripResponse>("/scolarite/transport/driver/trips/");
    setDriver(response.data.driver);
    setTrips(response.data.trips);
  };

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        setIsLoading(true);
        setError("");
        await loadTrips();
      } catch (requestError) {
        console.error(requestError);
        if (!mounted) return;
        setError("Impossible de charger votre espace transport.");
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");
      await axiosInstance.post("/scolarite/transport/driver/trips/", {
        service_date: form.serviceDate,
        departure_time: form.departureTime || null,
        arrival_time: form.arrivalTime || null,
        notes: form.notes.trim(),
      });
      await loadTrips();
      setSuccess("Pointage enregistre avec succes.");
      setForm((current) => ({ ...current, notes: "" }));
    } catch (requestError) {
      console.error(requestError);
      const detail =
        requestError && typeof requestError === "object" && "response" in requestError
          ? (requestError as { response?: { data?: { detail?: string; car?: string[] } } }).response?.data
          : undefined;
      setError(detail?.detail || detail?.car?.[0] || "Echec lors de l'enregistrement du pointage.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-secondary">Transport</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-dark md:text-3xl">Pointage chauffeur</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enregistrez votre heure de depart, votre heure d'arrivee et consultez l'historique de vos services.
        </p>
      </div>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div> : null}

      {isLoading ? (
        <SurfaceCard className="p-6 text-sm text-slate-500">Chargement...</SurfaceCard>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <SurfaceCard className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-secondary/10 p-3 text-secondary">
                  <BusFront size={18} />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-secondary">Car affecte</p>
                  <p className="mt-2 font-display text-2xl font-bold text-dark">{driver?.car_label || "Non assigne"}</p>
                </div>
              </div>
            </SurfaceCard>
            <SurfaceCard className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-secondary/10 p-3 text-secondary">
                  <RouteIcon size={18} />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-secondary">Trajet</p>
                  <p className="mt-2 font-display text-2xl font-bold text-dark">{driver?.route_label || "Non assigne"}</p>
                </div>
              </div>
            </SurfaceCard>
            <SurfaceCard className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-secondary/10 p-3 text-secondary">
                  <Clock3 size={18} />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-secondary">Services</p>
                  <p className="mt-2 font-display text-2xl font-bold text-dark">{trips.length}</p>
                </div>
              </div>
            </SurfaceCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <SurfaceCard className="p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-secondary">Enregistrement</p>
              <h2 className="mt-1 font-display text-xl font-bold text-dark">Declarer un service</h2>

              <form onSubmit={handleSubmit} className="mt-6 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-dark">Date de service</span>
                  <input
                    type="date"
                    value={form.serviceDate}
                    onChange={(event) => setForm((current) => ({ ...current, serviceDate: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-dark">Heure de depart</span>
                  <input
                    type="time"
                    value={form.departureTime}
                    onChange={(event) => setForm((current) => ({ ...current, departureTime: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-dark">Heure d'arrivee</span>
                  <input
                    type="time"
                    value={form.arrivalTime}
                    onChange={(event) => setForm((current) => ({ ...current, arrivalTime: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-dark">Observations</span>
                  <textarea
                    rows={4}
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                    placeholder="Optionnel"
                  />
                </label>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-2xl bg-dark px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    <Plus size={18} />
                    {isSaving ? "Enregistrement..." : "Enregistrer le pointage"}
                  </button>
                </div>
              </form>
            </SurfaceCard>

            <SurfaceCard className="p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-secondary">Historique</p>
              <h2 className="mt-1 font-display text-xl font-bold text-dark">Derniers services enregistres</h2>

              <div className="mt-6 space-y-3">
                {trips.length ? (
                  trips.map((trip) => (
                    <div key={trip.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-semibold text-dark">{formatDate(trip.service_date)}</p>
                        <p className="text-xs text-slate-400">Enregistre le {formatDateTime(trip.created_at)}</p>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">Car: {trip.car_label}</p>
                      <p className="mt-1 text-sm text-slate-600">Trajet: {trip.route_label || "Non assigne"}</p>
                      <p className="mt-1 text-sm text-slate-600">Depart: {trip.departure_time || "Non renseigne"}</p>
                      <p className="mt-1 text-sm text-slate-600">Arrivee: {trip.arrival_time || "Non renseignee"}</p>
                      {trip.notes ? <p className="mt-2 text-sm text-slate-500">{trip.notes}</p> : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Aucun pointage enregistre pour le moment.</p>
                )}
              </div>
            </SurfaceCard>
          </div>
        </>
      )}
    </div>
  );
};

export default DriverTransportPage;
