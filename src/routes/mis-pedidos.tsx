import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/use-session";
import { cop } from "@/lib/soldarte";
import {
  ShoppingBag,
  Store,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/mis-pedidos")({
  head: () => ({
    meta: [
      { title: "Mis Pedidos | SoldArte FerreMALL" },
      { name: "description", content: "Consulte el historial y estado de sus pedidos." },
    ],
  }),
  component: MisPedidosComponent,
});

interface PedidoItemCliente {
  id: string;
  cantidad: number;
  precio_unitario: number;
  productos: {
    nombre: string;
  } | null;
}

interface PedidoCliente {
  id: string;
  total: number;
  estado: "pendiente" | "confirmado" | "despachado" | "entregado" | "cancelado";
  cliente_direccion: string;
  created_at: string;
  ferreterias: {
    id: string;
    nombre: string;
    ciudad: string;
    telefono: string;
  } | null;
  pedido_items: PedidoItemCliente[];
}

function MisPedidosComponent() {
  const navigate = useNavigate();
  const { user, cargando: cargandoSesion } = useSession();

  const [pedidos, setPedidos] = useState<PedidoCliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const cargarMisPedidos = async (userId: string) => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const { data, error } = await supabase
        .from("pedidos")
        .select(
          `
          id,
          total,
          estado,
          cliente_direccion,
          created_at,
          ferreterias (
            id,
            nombre,
            ciudad,
            telefono
          ),
          pedido_items (
            id,
            cantidad,
            precio_unitario,
            productos ( nombre )
          )
        `
        )
        .eq("cliente_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        setErrorCarga(error.message);
      } else if (data) {
        setPedidos(data as unknown as PedidoCliente[]);
      }
    } catch (err) {
      console.error("Error cargando historial de pedidos:", err);
      setErrorCarga("No se pudo cargar su historial de pedidos.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (cargandoSesion) return;

    if (!user) {
      navigate({
        to: "/login",
        search: { mode: "login", redirect: "/mis-pedidos" },
      });
      return;
    }

    cargarMisPedidos(user.id);
  }, [user, cargandoSesion, navigate]);

  const formatearFecha = (iso: string) => {
    return new Date(iso).toLocaleString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderBadgeEstado = (estado: PedidoCliente["estado"]) => {
    switch (estado) {
      case "pendiente":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-400">
            <Clock className="h-3 w-3" />
            <span>Pendiente</span>
          </span>
        );
      case "confirmado":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase text-blue-400">
            <CheckCircle2 className="h-3 w-3" />
            <span>Confirmado</span>
          </span>
        );
      case "despachado":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase text-purple-400">
            <Truck className="h-3 w-3" />
            <span>Despachado</span>
          </span>
        );
      case "entregado":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            <span>Entregado</span>
          </span>
        );
      case "cancelado":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/15 px-2.5 py-0.5 text-[10px] font-bold uppercase text-destructive">
            <XCircle className="h-3 w-3" />
            <span>Cancelado</span>
          </span>
        );
    }
  };

  if (cargandoSesion || cargando) {
    return (
      <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-background">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground animate-pulse">
          Cargando tus pedidos...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-10">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forge">
              <ShoppingBag className="h-4 w-4" />
              <span>Historial de Compras</span>
            </div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">
              Mis Pedidos
            </h1>
            <p className="text-xs text-muted-foreground">
              Seguimiento en tiempo real de tus órdenes realizadas en FerreMALL
            </p>
          </div>

          {user && (
            <button
              onClick={() => cargarMisPedidos(user.id)}
              className="border border-border bg-card px-3 py-1.5 text-xs font-bold uppercase text-muted-foreground hover:text-foreground"
            >
              Actualizar Estado
            </button>
          )}
        </div>

        {errorCarga && (
          <div className="mb-6 flex items-center gap-2 border border-destructive/50 bg-destructive/10 p-4 text-xs text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorCarga}</span>
          </div>
        )}

        {pedidos.length === 0 ? (
          <div className="border border-border bg-card p-12 text-center">
            <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <h2 className="font-display text-lg font-bold uppercase text-foreground">
              Aún no tienes pedidos realizados
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Explora nuestras ferreterías verificadas y arma tu primer carrito.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
            >
              <span>Explorar Ferreterías</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs text-muted-foreground">
                        Orden #{pedido.id.slice(0, 8)}
                      </span>
                      {renderBadgeEstado(pedido.estado)}
                      <span className="text-[11px] text-muted-foreground">
                        {formatearFecha(pedido.created_at)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <Store className="h-4 w-4 text-forge shrink-0" />
                      <h2 className="font-display text-base font-bold text-foreground">
                        {pedido.ferreterias?.nombre || "Ferretería"}
                      </h2>
                    </div>

                    <div className="mt-1 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      {pedido.ferreterias?.telefono && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-forge" />
                          Tel tienda: {pedido.ferreterias.telefono}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-forge" />
                        Entrega: {pedido.cliente_direccion}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                      Total Pagado
                    </span>
                    <span className="font-display text-xl font-bold text-forge">
                      {cop(pedido.total)}
                    </span>
                  </div>
                </div>

                {/* Desglose de productos */}
                <div className="mt-4 space-y-1.5 border border-border/60 bg-background p-3 text-xs">
                  {pedido.pedido_items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-muted-foreground"
                    >
                      <span>
                        <strong className="text-foreground">{item.cantidad}x</strong>{" "}
                        {item.productos?.nombre || "Producto"}
                      </span>
                      <span className="font-mono text-foreground">
                        {cop(item.cantidad * item.precio_unitario)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}