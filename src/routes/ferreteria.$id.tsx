import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/use-session";
import { cop } from "@/lib/soldarte";
import { Store, MapPin, Phone, ShoppingCart, ArrowLeft, CheckCircle2, ShieldAlert, LogIn } from "lucide-react";

export const Route = createFileRoute("/ferreteria/$id")({
  head: () => ({
    meta: [
      { title: "Detalle de Ferretería | SoldArte FerreMALL" },
      { name: "description", content: "Consulte productos e insumos de la ferretería." },
    ],
  }),
  component: FerreteriaDetalleComponent,
});

interface FerreteriaDetalle {
  id: string;
  nombre: string;
  ciudad: string;
  direccion: string;
  telefono: string;
}

interface ProductoFerreteria {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  categoria: string | null;
}

function FerreteriaDetalleComponent() {
  const { id } = Route.useParams();
  const { session } = useSession();
  const navigate = useNavigate();

  const [ferreteria, setFerreteria] = useState<FerreteriaDetalle | null>(null);
  const [productos, setProductos] = useState<ProductoFerreteria[]>([]);
  const [cargando, setCargando] = useState(true);

  // Estado para el modal de compra
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoFerreteria | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteDireccion, setClienteDireccion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(false);
  const [errorPedido, setErrorPedido] = useState<string | null>(null);

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      try {
        // Cargar ferretería
        const { data: ferrData, error: ferrErr } = await supabase
          .from("ferreterias")
          .select("id, nombre, ciudad, direccion, telefono")
          .eq("id", id)
          .eq("estado", "aprobada")
          .eq("activo", true)
          .maybeSingle();

        if (ferrErr || !ferrData) {
          setFerreteria(null);
          return;
        }

        setFerreteria(ferrData as FerreteriaDetalle);

        // Cargar productos
        const { data: prodData, error: prodErr } = await supabase
          .from("productos")
          .select("id, nombre, descripcion, precio, stock, categoria")
          .eq("ferreteria_id", id)
          .eq("disponible", true);

        if (!prodErr && prodData) {
          setProductos(prodData as ProductoFerreteria[]);
        }
      } catch (err) {
        console.error("Excepción al cargar detalles:", err);
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, [id]);

  const realizarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !productoSeleccionado || !ferreteria) return;

    setEnviando(true);
    setErrorPedido(null);

    const totalCalculado = productoSeleccionado.precio * cantidad;

    try {
      // 1. Crear el pedido
      const { data: pedidoData, error: pedidoErr } = await supabase
        .from("pedidos")
        .insert({
          ferreteria_id: ferreteria.id,
          cliente_id: session.user.id,
          cliente_nombre: clienteNombre,
          cliente_telefono: clienteTelefono,
          cliente_direccion: clienteDireccion,
          total: totalCalculado,
          estado: "pendiente",
        })
        .select("id")
        .single();

      if (pedidoErr) {
        setErrorPedido(pedidoErr.message);
        return;
      }

      // 2. Insertar el item del pedido
      const { error: itemErr } = await supabase.from("pedido_items").insert({
        pedido_id: pedidoData.id,
        producto_id: productoSeleccionado.id,
        cantidad: cantidad,
        precio_unitario: productoSeleccionado.precio,
      });

      if (itemErr) {
        setErrorPedido(itemErr.message);
        return;
      }

      setMensajeExito(true);
      setTimeout(() => {
        setProductoSeleccionado(null);
        setMensajeExito(false);
        setCantidad(1);
      }, 2500);
    } catch (err) {
      console.error("Error al procesar el pedido:", err);
      setErrorPedido("Ocurrió un error inesperado al procesar el pedido.");
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-background">
        <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground animate-pulse">
          Cargando ferretería...
        </p>
      </main>
    );
  }

  if (!ferreteria) {
    return (
      <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-background px-4">
        <div className="max-w-md border border-border bg-card p-8 text-center shadow-xl">
          <h2 className="font-display text-xl font-bold uppercase text-foreground">
            Ferretería no encontrada
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">
            El comercio no existe o no se encuentra activo actualmente.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al inicio</span>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Botón de retorno */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al directorio</span>
        </Link>

        {/* Encabezado Ferretería */}
        <div className="border border-border bg-card p-6 md:p-8 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-forge/30 bg-forge/10 px-3 py-0.5 text-[10px] font-semibold text-forge">
                <Store className="h-3 w-3" />
                <span>Ferretería Verificada</span>
              </div>
              <h1 className="font-display text-3xl font-bold uppercase text-foreground">
                {ferreteria.nombre}
              </h1>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-forge" />
                  {ferreteria.ciudad} — {ferreteria.direccion}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-forge" />
                  {ferreteria.telefono}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Catálogo de Productos */}
        <div className="mb-6">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide text-foreground mb-1">
            Catálogo Disponible ({productos.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Seleccione el producto que desea adquirir en esta ferretería
          </p>
        </div>

        {productos.length === 0 ? (
          <div className="border border-border bg-card p-12 text-center text-xs text-muted-foreground">
            Esta ferretería aún no ha publicado productos en su catálogo.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {productos.map((prod) => (
              <div
                key={prod.id}
                className="flex flex-col justify-between border border-border bg-card p-5"
              >
                <div>
                  {prod.categoria && (
                    <span className="text-[10px] font-bold uppercase text-forge bg-forge/10 px-2 py-0.5 rounded">
                      {prod.categoria}
                    </span>
                  )}
                  <h3 className="font-display text-base font-bold text-foreground mt-2">
                    {prod.nombre}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {prod.descripcion || "Sin descripción detallada."}
                  </p>
                  <div className="mt-4 font-display text-lg font-bold text-foreground">
                    {cop(prod.precio)}
                  </div>
                </div>

                <div className="mt-6 border-t border-border pt-4">
                  {session ? (
                    <button
                      onClick={() => {
                        setProductoSeleccionado(prod);
                        setMensajeExito(false);
                        setErrorPedido(null);
                      }}
                      className="inline-flex w-full items-center justify-center gap-2 bg-primary py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>Comprar / Pedir</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate({ to: "/login" })}
                      className="inline-flex w-full items-center justify-center gap-2 border border-input bg-background py-2 text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-accent"
                    >
                      <LogIn className="h-4 w-4 text-forge" />
                      <span>Ingresar para comprar</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Pedido */}
        {productoSeleccionado && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md border border-border bg-card p-6 shadow-2xl">
              <h3 className="font-display text-lg font-bold uppercase text-foreground mb-1">
                Confirmar Pedido
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Artículo: <strong className="text-foreground">{productoSeleccionado.nombre}</strong>
              </p>

              {mensajeExito ? (
                <div className="my-6 flex flex-col items-center justify-center text-center p-4 bg-emerald-500/10 border border-emerald-500/30">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-2" />
                  <p className="text-xs font-bold text-emerald-400">
                    ¡Pedido registrado con éxito!
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    La ferretería procesará su solicitud a la brevedad.
                  </p>
                </div>
              ) : (
                <form onSubmit={realizarPedido} className="space-y-4">
                  {errorPedido && (
                    <div className="flex items-center gap-2 border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                      <ShieldAlert className="h-4 w-4 shrink-0" />
                      <span>{errorPedido}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={cantidad}
                      onChange={(e) => setCantidad(Number(e.target.value))}
                      className="w-full border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-forge"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Su Nombre Completo
                    </label>
                    <input
                      type="text"
                      required
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                      placeholder="Ej. Juan Gómez"
                      className="w-full border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-forge"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="text"
                      required
                      value={clienteTelefono}
                      onChange={(e) => setClienteTelefono(e.target.value)}
                      placeholder="300 000 0000"
                      className="w-full border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-forge"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Dirección de Entrega
                    </label>
                    <input
                      type="text"
                      required
                      value={clienteDireccion}
                      onChange={(e) => setClienteDireccion(e.target.value)}
                      placeholder="Calle 10 # 5-15"
                      className="w-full border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-forge"
                    />
                  </div>

                  <div className="pt-2 border-t border-border flex justify-between items-center text-xs">
                    <span className="font-bold text-muted-foreground">Total a Pagar:</span>
                    <span className="font-display text-base font-bold text-forge">
                      {cop(productoSeleccionado.precio * cantidad)}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setProductoSeleccionado(null)}
                      className="w-1/2 border border-border bg-background py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-accent"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={enviando}
                      className="w-1/2 bg-primary py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {enviando ? "Enviando..." : "Confirmar Pedido"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}