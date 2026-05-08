import { Building2, BusFront, CreditCard, MapPinned, Plus, RefreshCcw, Route, Trash2, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import axiosInstance from "../../../api/axiosConfig";
import SurfaceCard from "../../../components/dashboard/SurfaceCard";
import { formatCurrency, formatDate, formatDateTime } from "../../../utils/formatDate";

type TransportDepot = {
  id: number;
  label: string;
  commune: string;
  address: string;
  manager_phone: string;
  is_active: boolean;
};

type TransportCommune = {
  id: number;
  label: string;
  pickup_point: string;
  monthly_fee: string;
  is_active: boolean;
};

type TransportRoute = {
  id: number;
  label: string;
  origin: number;
  origin_label: string;
  destination: string;
  pickup_time?: string | null;
  distance_km: string;
  is_active: boolean;
};

type TransportCar = {
  id: number;
  label: string;
  plate_number: string;
  places: number;
  depot?: number | null;
  depot_label: string;
  route?: number | null;
  route_label: string;
  description: string;
  is_active: boolean;
  created_at: string;
};

type TransportDriver = {
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

type TransportTrip = {
  id: number;
  driver: number;
  driver_name: string;
  car: number;
  car_label: string;
  route?: number | null;
  route_label: string;
  service_date: string;
  departure_time?: string | null;
  arrival_time?: string | null;
  notes: string;
  created_at: string;
};

type TransportPayment = {
  id: number;
  student_name: string;
  matricule: string;
  commune_label: string;
  car: TransportCar;
  tarif: string;
  month?: number | null;
  year?: number | null;
  paid_at: string;
  expires_at?: string | null;
  reference: string;
};

type TransportOverview = {
  summary: {
    cars: number;
    communes: number;
    routes: number;
    drivers: number;
    paid_this_month: number;
    paid_this_year: number;
  };
  depots: TransportDepot[];
  communes: TransportCommune[];
  routes: TransportRoute[];
  cars: TransportCar[];
  drivers: TransportDriver[];
  trips: TransportTrip[];
  payments: TransportPayment[];
};

const AdminTransportPage = () => {
  const [summary, setSummary] = useState<TransportOverview["summary"] | null>(null);
  const [depots, setDepots] = useState<TransportDepot[]>([]);
  const [communes, setCommunes] = useState<TransportCommune[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [cars, setCars] = useState<TransportCar[]>([]);
  const [drivers, setDrivers] = useState<TransportDriver[]>([]);
  const [trips, setTrips] = useState<TransportTrip[]>([]);
  const [payments, setPayments] = useState<TransportPayment[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [newDepot, setNewDepot] = useState({ label: "", commune: "", address: "", managerPhone: "" });
  const [newCommune, setNewCommune] = useState({ label: "", pickupPoint: "", monthlyFee: "" });
  const [newRoute, setNewRoute] = useState({ label: "", originId: "", destination: "EMSP", pickupTime: "", distanceKm: "" });
  const [newCar, setNewCar] = useState({ label: "", plateNumber: "", places: "", depotId: "", routeId: "", description: "" });
  const [newDriver, setNewDriver] = useState({ fullName: "", email: "", phone: "", carId: "", licenseNumber: "", password: "" });

  const clearFeedback = () => {
    setError("");
    setSuccess("");
  };

  const reload = async () => {
    const response = await axiosInstance.get<TransportOverview>("/scolarite/admin/transport/");
    setSummary(response.data.summary);
    setDepots(response.data.depots);
    setCommunes(response.data.communes);
    setRoutes(response.data.routes);
    setCars(response.data.cars);
    setDrivers(response.data.drivers);
    setTrips(response.data.trips);
    setPayments(response.data.payments);
  };

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        setIsLoading(true);
        clearFeedback();
        await reload();
      } catch (requestError) {
        console.error(requestError);
        if (!mounted) return;
        setError("Impossible de charger la gestion transport.");
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

  const buildErrorMessage = (fallback: string, requestError: unknown) => {
    if (
      requestError &&
      typeof requestError === "object" &&
      "response" in requestError &&
      (requestError as { response?: { data?: unknown } }).response?.data
    ) {
      const data = (requestError as { response?: { data?: Record<string, unknown> } }).response?.data;
      if (data?.detail && typeof data.detail === "string") {
        return data.detail;
      }
      const firstEntry = Object.entries(data || {}).find(([, value]) => value);
      if (firstEntry) {
        const [, value] = firstEntry;
        if (Array.isArray(value) && typeof value[0] === "string") return value[0];
        if (typeof value === "string") return value;
      }
    }
    return fallback;
  };

  const submitAndReload = async (action: () => Promise<void>, successMessage: string, fallbackError: string) => {
    try {
      setIsSaving(true);
      clearFeedback();
      await action();
      await reload();
      setSuccess(successMessage);
    } catch (requestError) {
      console.error(requestError);
      setError(buildErrorMessage(fallbackError, requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDepot = async (event: FormEvent) => {
    event.preventDefault();
    if (!newDepot.label.trim()) {
      setError("Renseignez le libelle du depot.");
      return;
    }
    await submitAndReload(
      async () => {
        await axiosInstance.post("/scolarite/admin/transport/depots/", {
          label: newDepot.label.trim(),
          commune: newDepot.commune.trim(),
          address: newDepot.address.trim(),
          manager_phone: newDepot.managerPhone.trim(),
        });
        setNewDepot({ label: "", commune: "", address: "", managerPhone: "" });
      },
      "Depot ajoute avec succes.",
      "Echec lors de l'ajout du depot.",
    );
  };

  const handleAddCommune = async (event: FormEvent) => {
    event.preventDefault();
    if (!newCommune.label.trim()) {
      setError("Renseignez la commune.");
      return;
    }
    await submitAndReload(
      async () => {
        await axiosInstance.post("/scolarite/admin/transport/communes/", {
          label: newCommune.label.trim(),
          pickup_point: newCommune.pickupPoint.trim(),
          monthly_fee: newCommune.monthlyFee || 0,
        });
        setNewCommune({ label: "", pickupPoint: "", monthlyFee: "" });
      },
      "Commune ajoutee avec succes.",
      "Echec lors de l'ajout de la commune.",
    );
  };

  const handleAddRoute = async (event: FormEvent) => {
    event.preventDefault();
    if (!newRoute.originId) {
      setError("Selectionnez le lieu de depart.");
      return;
    }
    await submitAndReload(
      async () => {
        await axiosInstance.post("/scolarite/admin/transport/routes/", {
          label: newRoute.label.trim(),
          origin: Number(newRoute.originId),
          destination: newRoute.destination.trim() || "EMSP",
          pickup_time: newRoute.pickupTime || null,
          distance_km: newRoute.distanceKm || 0,
        });
        setNewRoute({ label: "", originId: "", destination: "EMSP", pickupTime: "", distanceKm: "" });
      },
      "Trajet ajoute avec succes.",
      "Echec lors de l'ajout du trajet.",
    );
  };

  const handleAddCar = async (event: FormEvent) => {
    event.preventDefault();
    if (!newCar.label.trim()) {
      setError("Renseignez le libelle du car.");
      return;
    }
    await submitAndReload(
      async () => {
        await axiosInstance.post("/scolarite/admin/transport/cars/", {
          label: newCar.label.trim(),
          plate_number: newCar.plateNumber.trim(),
          places: Number(newCar.places) || 0,
          depot: newCar.depotId ? Number(newCar.depotId) : null,
          route: newCar.routeId ? Number(newCar.routeId) : null,
          description: newCar.description.trim(),
        });
        setNewCar({ label: "", plateNumber: "", places: "", depotId: "", routeId: "", description: "" });
      },
      "Car ajoute avec succes.",
      "Echec lors de l'ajout du car.",
    );
  };

  const handleDeleteCar = async (id: number) => {
    await submitAndReload(
      async () => {
        await axiosInstance.delete(`/scolarite/admin/transport/cars/${id}/`);
      },
      "Car supprime avec succes.",
      "Echec lors de la suppression du car.",
    );
  };

  const handleAddDriver = async (event: FormEvent) => {
    event.preventDefault();
    if (!newDriver.fullName.trim() || !newDriver.email.trim()) {
      setError("Le nom complet et l'email du chauffeur sont obligatoires.");
      return;
    }
    await submitAndReload(
      async () => {
        await axiosInstance.post("/scolarite/admin/transport/drivers/", {
          full_name: newDriver.fullName.trim(),
          email: newDriver.email.trim(),
          phone: newDriver.phone.trim(),
          car: newDriver.carId ? Number(newDriver.carId) : null,
          license_number: newDriver.licenseNumber.trim(),
          password: newDriver.password.trim() || undefined,
        });
        setNewDriver({ fullName: "", email: "", phone: "", carId: "", licenseNumber: "", password: "" });
      },
      "Profil chauffeur enregistre avec succes.",
      "Echec lors de l'enregistrement du chauffeur.",
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-secondary">Portail admin</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-dark md:text-3xl">Gestion transport</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Administration des cars, trajets, depots, chauffeurs et suivi des pointages transport.
          </p>
        </div>
        <button
          type="button"
          disabled={isLoading || isSaving}
          onClick={() => void reload()}
          className="inline-flex items-center gap-2 rounded-2xl border border-secondary/20 bg-white px-4 py-2.5 text-sm font-semibold text-secondary transition hover:border-secondary hover:bg-secondary/5 disabled:opacity-60"
        >
          <RefreshCcw size={16} />
          Actualiser
        </button>
      </div>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div> : null}

      {isLoading ? (
        <SurfaceCard className="p-6 text-sm text-slate-500">Chargement...</SurfaceCard>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SurfaceCard className="p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-secondary">Cars</p>
              <p className="mt-3 font-display text-4xl font-bold text-dark">{summary?.cars || 0}</p>
              <p className="mt-2 text-sm text-slate-500">vehicules disponibles dans le parc transport</p>
            </SurfaceCard>
            <SurfaceCard className="p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-secondary">Communes</p>
              <p className="mt-3 font-display text-4xl font-bold text-dark">{summary?.communes || 0}</p>
              <p className="mt-2 text-sm text-slate-500">zones de depart et points de ramassage</p>
            </SurfaceCard>
            <SurfaceCard className="p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-secondary">Chauffeurs</p>
              <p className="mt-3 font-display text-4xl font-bold text-dark">{summary?.drivers || 0}</p>
              <p className="mt-2 text-sm text-slate-500">comptes chauffeur actifs sur le portail</p>
            </SurfaceCard>
            <SurfaceCard className="p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-secondary">Encaisse cette annee</p>
              <p className="mt-3 font-display text-4xl font-bold text-dark">{formatCurrency(summary?.paid_this_year || 0)}</p>
              <p className="mt-2 text-sm text-slate-500">
                dont {formatCurrency(summary?.paid_this_month || 0)} ce mois-ci
              </p>
            </SurfaceCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <SurfaceCard className="p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-secondary/10 p-3 text-secondary">
                  <BusFront size={18} />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-secondary">Cars</p>
                  <h2 className="mt-1 font-display text-xl font-bold text-dark">Parc automobile</h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {cars.length ? (
                  cars.map((car) => (
                    <div key={car.id} className="flex items-start justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4">
                      <div>
                        <p className="font-semibold text-dark">{car.label}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          Immatriculation: <span className="font-medium">{car.plate_number || "Non renseignee"}</span>
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Places: <span className="font-medium">{car.places}</span>
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Depot: <span className="font-medium">{car.depot_label || "Non assigne"}</span>
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Trajet: <span className="font-medium">{car.route_label || "Non assigne"}</span>
                        </p>
                        {car.description ? <p className="mt-2 text-sm text-slate-500">{car.description}</p> : null}
                        <p className="mt-2 text-xs text-slate-400">Cree le {formatDateTime(car.created_at)}</p>
                      </div>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => void handleDeleteCar(car.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                      >
                        <Trash2 size={16} />
                        Supprimer
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Aucun car enregistre.</p>
                )}
              </div>

              <form onSubmit={handleAddCar} className="mt-6 grid gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-dark">Libelle</span>
                  <input
                    value={newCar.label}
                    onChange={(event) => setNewCar((current) => ({ ...current, label: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-dark">Immatriculation</span>
                  <input
                    value={newCar.plateNumber}
                    onChange={(event) => setNewCar((current) => ({ ...current, plateNumber: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-dark">Nombre de places</span>
                  <input
                    type="number"
                    min={0}
                    value={newCar.places}
                    onChange={(event) => setNewCar((current) => ({ ...current, places: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-dark">Depot</span>
                  <select
                    value={newCar.depotId}
                    onChange={(event) => setNewCar((current) => ({ ...current, depotId: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                  >
                    <option value="">Choisir un depot</option>
                    {depots.map((depot) => (
                      <option key={depot.id} value={depot.id}>
                        {depot.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-dark">Trajet</span>
                  <select
                    value={newCar.routeId}
                    onChange={(event) => setNewCar((current) => ({ ...current, routeId: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                  >
                    <option value="">Choisir un trajet</option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-dark">Description</span>
                  <input
                    value={newCar.description}
                    onChange={(event) => setNewCar((current) => ({ ...current, description: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                  />
                </label>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-2xl bg-dark px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    <Plus size={18} />
                    Ajouter un car
                  </button>
                </div>
              </form>
            </SurfaceCard>

            <SurfaceCard className="p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-secondary/10 p-3 text-secondary">
                  <Route size={18} />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-secondary">Trajets</p>
                  <h2 className="mt-1 font-display text-xl font-bold text-dark">Lignes et terminus</h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {routes.length ? (
                  routes.map((route) => (
                    <div key={route.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-dark">{route.label}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Depart: <span className="font-medium">{route.origin_label}</span>
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Terminus: <span className="font-medium">{route.destination || "EMSP"}</span>
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Heure de depart: <span className="font-medium">{route.pickup_time || "Non definie"}</span>
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Distance: <span className="font-medium">{route.distance_km} km</span>
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Aucun trajet configure.</p>
                )}
              </div>

              <form onSubmit={handleAddRoute} className="mt-6 grid gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-dark">Libelle du trajet</span>
                  <input
                    value={newRoute.label}
                    onChange={(event) => setNewRoute((current) => ({ ...current, label: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                    placeholder="Ex: Cocody Riviera - EMSP"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-dark">Lieu de depart</span>
                  <select
                    value={newRoute.originId}
                    onChange={(event) => setNewRoute((current) => ({ ...current, originId: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                    required
                  >
                    <option value="">Choisir une commune</option>
                    {communes.map((commune) => (
                      <option key={commune.id} value={commune.id}>
                        {commune.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-dark">Terminus</span>
                  <input
                    value={newRoute.destination}
                    onChange={(event) => setNewRoute((current) => ({ ...current, destination: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-dark">Heure de depart</span>
                  <input
                    type="time"
                    value={newRoute.pickupTime}
                    onChange={(event) => setNewRoute((current) => ({ ...current, pickupTime: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-dark">Distance (km)</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={newRoute.distanceKm}
                    onChange={(event) => setNewRoute((current) => ({ ...current, distanceKm: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                  />
                </label>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-2xl bg-dark px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    <Plus size={18} />
                    Ajouter un trajet
                  </button>
                </div>
              </form>
            </SurfaceCard>

            <SurfaceCard className="p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-secondary/10 p-3 text-secondary">
                  <Building2 size={18} />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-secondary">Depots</p>
                  <h2 className="mt-1 font-display text-xl font-bold text-dark">Base des depots</h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {depots.length ? (
                  depots.map((depot) => (
                    <div key={depot.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-dark">{depot.label}</p>
                      <p className="mt-1 text-sm text-slate-600">Commune: {depot.commune || "Non renseignee"}</p>
                      <p className="mt-1 text-sm text-slate-600">Adresse: {depot.address || "Non renseignee"}</p>
                      <p className="mt-1 text-sm text-slate-600">Contact depot: {depot.manager_phone || "Non renseigne"}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Aucun depot enregistre.</p>
                )}
              </div>

              <form onSubmit={handleAddDepot} className="mt-6 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-dark">Libelle</span>
                  <input
                    value={newDepot.label}
                    onChange={(event) => setNewDepot((current) => ({ ...current, label: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-dark">Commune</span>
                  <input
                    value={newDepot.commune}
                    onChange={(event) => setNewDepot((current) => ({ ...current, commune: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-dark">Adresse</span>
                  <input
                    value={newDepot.address}
                    onChange={(event) => setNewDepot((current) => ({ ...current, address: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-dark">Telephone du responsable depot</span>
                  <input
                    value={newDepot.managerPhone}
                    onChange={(event) => setNewDepot((current) => ({ ...current, managerPhone: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                  />
                </label>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-2xl bg-dark px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    <Plus size={18} />
                    Ajouter un depot
                  </button>
                </div>
              </form>
            </SurfaceCard>

            <SurfaceCard className="p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-secondary/10 p-3 text-secondary">
                  <MapPinned size={18} />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-secondary">Communes</p>
                  <h2 className="mt-1 font-display text-xl font-bold text-dark">Lieux de depart</h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {communes.length ? (
                  communes.map((commune) => (
                    <div key={commune.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-dark">{commune.label}</p>
                      <p className="mt-1 text-sm text-slate-600">Point de ramassage: {commune.pickup_point || "Non renseigne"}</p>
                      <p className="mt-1 text-sm text-slate-600">Frais mensuel: {formatCurrency(Number(commune.monthly_fee || 0))}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Aucune commune configuree.</p>
                )}
              </div>

              <form onSubmit={handleAddCommune} className="mt-6 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-dark">Commune</span>
                  <input
                    value={newCommune.label}
                    onChange={(event) => setNewCommune((current) => ({ ...current, label: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-dark">Point de ramassage</span>
                  <input
                    value={newCommune.pickupPoint}
                    onChange={(event) => setNewCommune((current) => ({ ...current, pickupPoint: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-dark">Frais mensuel (FCFA)</span>
                  <input
                    type="number"
                    min={0}
                    value={newCommune.monthlyFee}
                    onChange={(event) => setNewCommune((current) => ({ ...current, monthlyFee: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                  />
                </label>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-2xl bg-dark px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    <Plus size={18} />
                    Ajouter une commune
                  </button>
                </div>
              </form>
            </SurfaceCard>

            <SurfaceCard className="p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-primary/30 p-3 text-dark">
                  <UserRound size={18} />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-secondary">Chauffeurs</p>
                  <h2 className="mt-1 font-display text-xl font-bold text-dark">Comptes et affectations</h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {drivers.length ? (
                  drivers.map((driver) => (
                    <div key={driver.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-dark">{driver.full_name}</p>
                      <p className="mt-1 text-sm text-slate-600">Email: {driver.email}</p>
                      <p className="mt-1 text-sm text-slate-600">Telephone: {driver.phone || "Non renseigne"}</p>
                      <p className="mt-1 text-sm text-slate-600">Car assigne: {driver.car_label || "Non assigne"}</p>
                      <p className="mt-1 text-sm text-slate-600">Trajet courant: {driver.route_label || "Non assigne"}</p>
                      <p className="mt-1 text-sm text-slate-600">Permis: {driver.license_number || "Non renseigne"}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Aucun chauffeur enregistre.</p>
                )}
              </div>

              <form onSubmit={handleAddDriver} className="mt-6 grid gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-dark">Nom complet</span>
                  <input
                    value={newDriver.fullName}
                    onChange={(event) => setNewDriver((current) => ({ ...current, fullName: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-dark">Email</span>
                  <input
                    type="email"
                    value={newDriver.email}
                    onChange={(event) => setNewDriver((current) => ({ ...current, email: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-dark">Telephone</span>
                  <input
                    value={newDriver.phone}
                    onChange={(event) => setNewDriver((current) => ({ ...current, phone: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-dark">Car affecte</span>
                  <select
                    value={newDriver.carId}
                    onChange={(event) => setNewDriver((current) => ({ ...current, carId: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                  >
                    <option value="">Choisir un car</option>
                    {cars.map((car) => (
                      <option key={car.id} value={car.id}>
                        {car.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-dark">Numero de permis</span>
                  <input
                    value={newDriver.licenseNumber}
                    onChange={(event) => setNewDriver((current) => ({ ...current, licenseNumber: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-dark">Mot de passe initial</span>
                  <input
                    value={newDriver.password}
                    onChange={(event) => setNewDriver((current) => ({ ...current, password: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                    placeholder="Laisser vide pour utiliser le mot de passe par defaut"
                  />
                </label>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-2xl bg-dark px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    <Plus size={18} />
                    Enregistrer le chauffeur
                  </button>
                </div>
              </form>
            </SurfaceCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <SurfaceCard className="p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-primary/30 p-3 text-dark">
                  <CreditCard size={18} />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-secondary">Paiements</p>
                  <h2 className="mt-1 font-display text-xl font-bold text-dark">Historique des paiements transport</h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {payments.length ? (
                  payments.map((payment) => (
                    <div key={payment.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-dark">{payment.student_name}</p>
                          <p className="mt-1 text-sm text-slate-600">Matricule: {payment.matricule}</p>
                          <p className="mt-1 text-sm text-slate-600">Car: {payment.car.label}</p>
                          <p className="mt-1 text-sm text-slate-600">Commune: {payment.commune_label || "Non renseignee"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-secondary">{formatCurrency(Number(payment.tarif || 0))}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {payment.month || "-"} / {payment.year || "-"}
                          </p>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">Paye le {formatDateTime(payment.paid_at)}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Expiration: <span className="font-medium">{payment.expires_at ? formatDate(payment.expires_at) : "Non definie"}</span>
                      </p>
                      {payment.reference ? <p className="mt-1 text-xs text-slate-500">Ref: {payment.reference}</p> : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Aucun paiement transport.</p>
                )}
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-primary/30 p-3 text-dark">
                  <UserRound size={18} />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-secondary">Section chauffeur</p>
                  <h2 className="mt-1 font-display text-xl font-bold text-dark">Pointages recents</h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {trips.length ? (
                  trips.map((trip) => (
                    <div key={trip.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-dark">{trip.driver_name}</p>
                          <p className="mt-1 text-sm text-slate-600">Car: {trip.car_label}</p>
                          <p className="mt-1 text-sm text-slate-600">Trajet: {trip.route_label || "Non assigne"}</p>
                        </div>
                        <p className="text-sm font-semibold text-secondary">{formatDate(trip.service_date)}</p>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        Depart: <span className="font-medium">{trip.departure_time || "Non renseigne"}</span>
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Arrivee: <span className="font-medium">{trip.arrival_time || "Non renseignee"}</span>
                      </p>
                      {trip.notes ? <p className="mt-2 text-sm text-slate-500">{trip.notes}</p> : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Aucun pointage chauffeur disponible.</p>
                )}
              </div>
            </SurfaceCard>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminTransportPage;
