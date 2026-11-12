import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/use-session";
import {
  ShieldCheck,
  Store,
  CheckCircle2,
  XCircle,
  PauseCircle,
  PlayCircle,
  Package,
  ShoppingBag,
  Clock,
  AlertTriangle,
  Search,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Monitoreo Administrativo | SoldArte FerreMALL" },
      { name: "description", content: "Panel de control y auditoría de ferreterías." },
    ],
  }),
  component: AdminComponent,
});

interface ResumenFerreteria {
  id: string;
  nombre: string;
  ciudad: string;
  telefono: string;
  estado: "pendiente" | "aprobada" | "rechazada" | "suspendida";
  activo: boolean;
  created_at: string;
  productos: number;
  pedidos_total: number;
  pedidos_pendientes: number;
  ultimo_pedido: string | null;
}

type FiltroEstado = "todas" | "pendiente" | "aprobada" | "suspendida" | "rechazada";

function AdminComponent() {
  const navigate = useNavigate();
  const { user, esAdmin, cargando: cargandoSesion } = useSession();

  const [ferreterias, setFerreterias] = useState<ResumenFerreteria[]>([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todas");
  const [busqueda, setBusqueda] = useState("");

  // Modal de decisión con nota de auditoría
  const [accionModal, setAccionModal] = useState<{
    ferreteria: ResumenFerreteria;
    nuevoEstado: "aprobada" | "rechazada" | "suspendida";
    titulo: string;
  } | null>(null);
  const [notaAuditoria, setNotaAuditoria] = useState("");
  const [procesandoCambio, setProcesandoCambio] = useState(false);
  const [errorCambio, setErrorCambio] = useState<string | null>(null);

  const cargarResumen = async () => {
    setCargandoDatos(true);
    setErrorCarga(null);
    try {
      const { data, error } = await supabase.rpc("resumen_ferreterias");
      if (error) {
        setErrorCarga(error.message);
      } else if (data) {
        setFerreterias(data as ResumenFerreteria[]);
      }
    } catch (err) {
      console.error("Error cargando resumen de ferreterías:", err);
      setErrorCarga("No se pudo obtener el resumen operativo.");
    } finally {
      setCargandoDatos(false);
    }
  };

  useEffect(() => {
    if (cargandoSesion) return;

    if (!user || !esAdmin) {
      navigate({ to: "/" });
      return;
    }

    cargarResumen();
  }, [user, esAdmin, cargandoSesion, navigate]);

  const confirmarCambioEstado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accionModal) return;

    setProcesandoCambio(true);
    setErrorCambio(null);

    try {
      const { error } = await supabase.rpc("cambiar_estado_ferreteria", {
        p_id: accionModal.ferreteria.id,
        p_estado: accionModal.nuevoEstado,
        p_nota: notaAuditoria.trim() || null,
      });

      if (error) {
        setErrorCambio(error.message);
        return;
      }

      setAccionModal(null);
      setNotaAuditoria("");
      await cargarResumen();
    } catch (err) {
      console.error("Error cambiando estado:", err);
      setErrorCambio("Error inesperado al registrar la decisión.");
    } finally {
      setProcesandoCambio(false);
    }
  };

  const formatearFecha = (fechaIso: string | null) => {
    if (!fechaIso) return "Sin actividad";
    return new Date(fechaIso).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const ferreteriasFiltradas = ferreterias.filter((f) => {
    const coincideEstado = filtroEstado === "todas" || f.estado === filtroEstado;
    const termino = busqueda.toLowerCase().trim();
    const coincideTexto =
      !termino ||
      f.nombre.toLowerCase().includes(termino) ||
      f.ciudad.toLowerCase().includes(termino);
    return coincideEstado && coincideTexto;
  });

  if (cargandoSesion || cargandoDatos) {
    return (
      <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-background">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground animate-pulse">
          Cargando panel de monitoreo...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-10">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Encabezado */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forge">
              <ShieldCheck className="h-4 w-4" />
              <span>Control y Auditoría</span>
            </div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">
              Monitoreo de Ferreterías
            </h1>
            <p className="text-xs text-muted-foreground">
              Supervisión operativa de comercios registrados (métricas agregadas)
            </p>
          </div>

          <div className="flex gap-3 text-xs">
            <div className="border border-border bg-card px-4 py-2 text-center">
              <span className="block font-display text-lg font-bold text-foreground">
                {ferreterias.length}
              </span>
              <span className="text-[10px] uppercase text-muted-foreground">Total</span>
            </div>
            <div className="border border-forge/40 bg-forge/10 px-4 py-2 text-center">
              <span className="block font-display text-lg font-bold text-forge">
                {ferreterias.filter((f) => f.estado === "pendiente").length}
              </span>
              <span className="text-[10px] uppercase text-forge">Pendientes</span>
            </div>
            <div className="border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-center">
              <span className="block font-display text-lg font-bold text-emerald-400">
                {ferreterias.filter((f) => f.estado === "aprobada").length}
              </span>
              <span className="text-[10px] uppercase text-emerald-400">Activas</span>
            </div>
          </div>
        </div>

        {/* Filtros y Buscador */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1.5">
            {(["todas", "pendiente", "aprobada", "suspendida", "rechazada"] as FiltroEstado[]).map(
              (estado) => (
                <button
                  key={estado}
                  onClick={() => setFiltroEstado(estado)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                    filtroEstado === estado
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {estado}
                </button>
              )
            )}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre o ciudad..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full border border-border bg-input pl-8 pr-3 py-1.5 text-xs text-foreground outline-none focus:border-forge"
            />
          </div>
        </div>

        {errorCarga && (
          <div className="mb-6 flex items-center gap-2 border border-destructive/50 bg-destructive/10 p-4 text-xs text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorCarga}</span>
          </div>
        )}

        {/* Listado de Ferreterías */}
        {ferreteriasFiltradas.length === 0 ? (
          <div className="border border-border bg-card p-12 text-center text-xs text-muted-foreground">
            No se encontraron ferreterías con los filtros seleccionados.
          </div>
        ) : (
          <div className="space-y-4">
            {ferreteriasFiltradas.map((f) => (
              <div
                key={f.id}
                className="border border-border bg-card p-5 transition-colors hover:border-border/80"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  {/* Info Principal */}
                  <div>
                    <div className="flex items-center gap-2.5">
                      <Store className="h-4 w-4 text-forge" />
                      <h2 className="font-display text-lg font-bold text-foreground">
                        {f.nombre}
                      </h2>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          f.estado === "aprobada"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : f.estado === "pendiente"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : f.estado === "suspendida"
                            ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                            : "bg-destructive/15 text-destructive border border-destructive/30"
                        }`}
                      >
                        {f.estado}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {f.ciudad} · Tel: {f.telefono} · Registrada: {formatearFecha(f.created_at)}
                    </p>
                  </div>

                  {/* Controles de Estado */}
                  <div className="flex flex-wrap gap-2">
                    {f.estado === "pendiente" && (
                      <>
                        <button
                          onClick={() => {
                            setNotaAuditoria("");
                            setErrorCambio(null);
                            setAccionModal({
                              ferreteria: f,
                              nuevoEstado: "aprobada",
                              titulo: "Aprobar Ferretería",
                            });
                          }}
                          className="inline-flex items-center gap-1.5 bg-emerald-600 px-3 py-1.5 text-xs font-bold uppercase text-white hover:bg-emerald-500"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Aprobar</span>
                        </button>
                        <button
                          onClick={() => {
                            setNotaAuditoria("");
                            setErrorCambio(null);
                            setAccionModal({
                              ferreteria: f,
                              nuevoEstado: "rechazada",
                              titulo: "Rechazar Solicitud",
                            });
                          }}
                          className="inline-flex items-center gap-1.5 bg-destructive px-3 py-1.5 text-xs font-bold uppercase text-white hover:bg-destructive/90"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Rechazar</span>
                        </button>
                      </>
                    )}

                    {f.estado === "aprobada" && (
                      <button
                        onClick={() => {
                          setNotaAuditoria("");
                          setErrorCambio(null);
                          setAccionModal({
                            ferreteria: f,
                            nuevoEstado: "suspendida",
                            titulo: "Suspender Ferretería",
                          });
                        }}
                        className="inline-flex items-center gap-1.5 border border-orange-500/50 bg-orange-500/10 px-3 py-1.5 text-xs font-bold uppercase text-orange-400 hover:bg-orange-500/20"
                      >
                        <PauseCircle className="h-3.5 w-3.5" />
                        <span>Suspender</span>
                      </button>
                    )}

                    {(f.estado === "suspendida" || f.estado === "rechazada") && (
                      <button
                        onClick={() => {
                          setNotaAuditoria("");
                          setErrorCambio(null);
                          setAccionModal({
                            ferreteria: f,
                            nuevoEstado: "aprobada",
                            titulo: "Reactivar Ferretería",
                          });
                        }}
                        className="inline-flex items-center gap-1.5 border border-emerald-500/50 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold uppercase text-emerald-400 hover:bg-emerald-500/20"
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                        <span>Reactivar</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Métricas Operativas */}
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4 text-xs">
                  <div className="flex items-center gap-2 bg-background p-2.5 border border-border/60">
                    <Package className="h-4 w-4 text-forge shrink-0" />
                    <div>
                      <span className="block font-bold text-foreground">{f.productos}</span>
                      <span className="text-[10px] text-muted-foreground">Productos</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-background p-2.5 border border-border/60">
                    <ShoppingBag className="h-4 w-4 text-forge shrink-0" />
                    <div>
                      <span className="block font-bold text-foreground">{f.pedidos_total}</span>
                      <span className="text-[10px] text-muted-foreground">Pedidos Totales</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-background p-2.5 border border-border/60">
                    <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="block font-bold text-foreground">
                        {f.pedidos_pendientes}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Sin Atender</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-background p-2.5 border border-border/60">
                    <div>
                      <span className="block font-bold text-foreground">
                        {formatearFecha(f.ultimo_pedido)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Último Pedido</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Confirmación y Nota de Auditoría */}
        {accionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md border border-border bg-card p-6 shadow-2xl">
              <h3 className="font-display text-lg font-bold uppercase text-foreground">
                {accionModal.titulo}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Comercio: <strong className="text-foreground">{accionModal.ferreteria.nombre}</strong>
              </p>

              {errorCambio && (
                <div className="mt-4 flex items-center gap-2 border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{errorCambio}</span>
                </div>
              )}

              <form onSubmit={confirmarCambioEstado} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Nota de Auditoría (Opcional · Máx. 300 caracteres)
                  </label>
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={notaAuditoria}
                    onChange={(e) => setNotaAuditoria(e.target.value)}
                    placeholder="Motivo de la decisión (ej. Documentación verificada / Pedidos pendientes sin atención)..."
                    className="w-full border border-border bg-input p-2.5 text-xs text-foreground outline-none focus:border-forge"
                  />
                  <span className="block text-right text-[10px] text-muted-foreground mt-1">
                    {notaAuditoria.length}/300
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAccionModal(null)}
                    className="w-1/2 border border-border bg-background py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-accent"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={procesandoCambio}
                    className="w-1/2 bg-primary py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {procesandoCambio ? "Guardando..." : "Confirmar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}