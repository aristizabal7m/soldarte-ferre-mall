import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/lib/supabase";
import { Shield, CheckCircle2, XCircle, Clock, Filter, Store } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel Administrativo | SoldArte FerreMALL" },
      { name: "description", content: "Administración global de ferreterías y solicitudes." },
    ],
  }),
  component: AdminComponent,
});

interface FerreteriaAdmin {
  id: string;
  nombre: string;
  ciudad: string;
  telefono: string;
  direccion: string;
  estado: "pendiente" | "aprobada" | "rechazada";
  created_at: string;
}

function AdminComponent() {
  const navigate = useNavigate();
  const { esAdmin, cargando: cargandoSesion } = useSession();

  const [ferreterias, setFerreterias] = useState<FerreteriaAdmin[]>([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  // Redirección de seguridad si no es admin
  useEffect(() => {
    if (cargandoSesion) return;

    if (!esAdmin) {
      navigate({ to: "/" });
    } else {
      cargarFerreterias();
    }
  }, [esAdmin, cargandoSesion, navigate]);

  const cargarFerreterias = async () => {
    setCargandoLista(true);
    try {
      const { data, error } = await supabase
        .from("ferreterias")
        .select("id, nombre, ciudad, telefono, direccion, estado, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error al cargar ferreterías:", error.message);
      } else if (data) {
        // Ordenar colocando las pendientes primero
        const ordenadas = (data as FerreteriaAdmin[]).sort((a, b) => {
          if (a.estado === "pendiente" && b.estado !== "pendiente") return -1;
          if (a.estado !== "pendiente" && b.estado === "pendiente") return 1;
          return 0;
        });
        setFerreterias(ordenadas);
      }
    } catch (err) {
      console.error("Excepción al consultar ferreterías:", err);
    } finally {
      setCargandoLista(false);
    }
  };

  const cambiarEstado = async (id: string, nuevoEstado: "aprobada" | "rechazada") => {
    setProcesandoId(id);
    try {
      const { error } = await supabase.rpc("cambiar_estado_ferreteria", {
        p_id: id,
        p_estado: nuevoEstado,
      });

      if (error) {
        console.error("Error al ejecutar RPC cambiar_estado_ferreteria:", error.message);
        alert(`No se pudo cambiar el estado: ${error.message}`);
      } else {
        await cargarFerreterias();
      }
    } catch (err) {
      console.error("Excepción en RPC:", err);
    } finally {
      setProcesandoId(null);
    }
  };

  if (cargandoSesion || !esAdmin) {
    return (
      <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-background">
        <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground animate-pulse">
          Verificando permisos de administrador...
        </p>
      </main>
    );
  }

  const ferreteriasFiltradas = ferreterias.filter((f) => {
    if (filtroEstado === "todos") return true;
    return f.estado === filtroEstado;
  });

  return (
    <main className="min-h-screen bg-background py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Encabezado */}
        <div className="mb-8 border-b border-border pb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-forge/10 text-forge rounded">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">
                Panel de Administración
              </h1>
              <p className="text-xs text-muted-foreground">
                Gestión de solicitudes de ferreterías registradas
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="border border-border bg-input px-3 py-1.5 text-xs text-foreground outline-none focus:border-forge"
            >
              <option value="todos">Todas las solicitudes</option>
              <option value="pendiente">Solo Pendientes</option>
              <option value="aprobada">Solo Aprobadas</option>
              <option value="rechazada">Solo Rechazadas</option>
            </select>
          </div>
        </div>

        {/* Tabla / Lista de Ferreterías */}
        {cargandoLista ? (
          <p className="text-xs uppercase font-bold text-muted-foreground animate-pulse text-center py-12">
            Cargando solicitudes...
          </p>
        ) : ferreteriasFiltradas.length === 0 ? (
          <div className="border border-border bg-card p-12 text-center text-xs text-muted-foreground">
            No se encontraron ferreterías con el filtro seleccionado.
          </div>
        ) : (
          <div className="space-y-4">
            {ferreteriasFiltradas.map((f) => (
              <div
                key={f.id}
                className="flex flex-wrap items-center justify-between border border-border bg-card p-5 gap-4"
              >
                <div className="flex items-start gap-4 min-w-[250px]">
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center bg-muted text-muted-foreground rounded">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base font-bold text-foreground">
                        {f.nombre}
                      </h3>
                      {f.estado === "pendiente" && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                          <Clock className="h-3 w-3" />
                          Pendiente
                        </span>
                      )}
                      {f.estado === "aprobada" && (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          Aprobada
                        </span>
                      )}
                      {f.estado === "rechazada" && (
                        <span className="inline-flex items-center gap-1 rounded bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive border border-destructive/20">
                          <XCircle className="h-3 w-3" />
                          Rechazada
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {f.ciudad} · {f.direccion} · Tel: {f.telefono}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      Registrada el: {new Date(f.created_at).toLocaleDateString("es-CO")}
                    </p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2">
                  {f.estado !== "aprobada" && (
                    <button
                      disabled={procesandoId === f.id}
                      onClick={() => cambiarEstado(f.id, "aprobada")}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Aprobar</span>
                    </button>
                  )}
                  {f.estado !== "rechazada" && (
                    <button
                      disabled={procesandoId === f.id}
                      onClick={() => cambiarEstado(f.id, "rechazada")}
                      className="inline-flex items-center gap-1.5 border border-destructive/50 bg-destructive/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-destructive hover:bg-destructive/20 disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Rechazar</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}