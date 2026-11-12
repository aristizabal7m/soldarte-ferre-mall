import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/use-session";
import { cop } from "@/lib/soldarte";
import {
  leerCarrito,
  guardarCarrito,
  vaciarCarrito,
  calcularTotalCarrito,
  type EstadoCarrito,
} from "@/lib/carrito";
import {
  Store,
  MapPin,
  Phone,
  ShoppingCart,
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/ferreteria/$id")({
  head: () => ({
    meta: [
      { title: "Catálogo de Ferretería | SoldArte FerreMALL" },
      { name: "description", content: "Explore productos y realice su pedido en línea." },
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

  // Estado del carrito persistente
  const [carrito, setCarrito] = useState<EstadoCarrito>(() => leerCarrito());
  const [conflictoFerreteria, setConflictoFerreteria] = useState<ProductoFerreteria | null>(null);

  // Checkout y precarga de perfil
  const [checkoutAbierto, setCheckoutAbierto] = useState(false);
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteDireccion, setClienteDireccion] = useState("");
  const [tienePerfilPrevio, setTienePerfilPrevio] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(false);
  const [errorPedido, setErrorPedido] = useState<string | null>(null);

  // Sincronizar carrito desde localStorage
  useEffect(() => {
    const sync = () => setCarrito(leerCarrito());
    window.addEventListener("carrito-actualizado", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("carrito-actualizado", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Cargar datos de la ferretería y su catálogo
  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      try {
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

        const { data: prodData, error: prodErr } = await supabase
          .from("productos")
          .select("id, nombre, descripcion, precio, stock, categoria")
          .eq("ferreteria_id", id)
          .eq("disponible", true)
          .order("created_at", { ascending: false });

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

  // Precargar perfil si el cliente tiene sesión iniciada
  useEffect(() => {
    if (!session) return;
    async function cargarPerfil() {
      const { data } = await supabase
        .from("perfiles")
        .select("nombre, telefono, direccion")
        .eq("user_id", session!.user.id)
        .maybeSingle();

      if (data) {
        setClienteNombre(data.nombre || "");
        setClienteTelefono(data.telefono || "");
        setClienteDireccion(data.direccion || "");
        setTienePerfilPrevio(true);
      }
    }
    cargarPerfil();
  }, [session]);

  const agregarAlCarrito = (prod: ProductoFerreteria, forzarNuevo = false) => {
    if (!ferreteria) return;
    const actual = leerCarrito();

    // Si hay ítems de otra ferretería y no se ha confirmado reemplazo
    if (
      !forzarNuevo &&
      actual.items.length > 0 &&
      actual.ferreteria_id &&
      actual.ferreteria_id !== ferreteria.id
    ) {
      setConflictoFerreteria(prod);
      return;
    }

    const baseItems = forzarNuevo ? [] : [...actual.items];
    const existente = baseItems.find((i) => i.producto_id === prod.id);

    if (existente) {
      existente.cantidad += 1;
    } else {
      baseItems.push({
        producto_id: prod.id,
        nombre: prod.nombre,
        precio: prod.precio,
        cantidad: 1,
        stock: prod.stock,
      });
    }

    const nuevoEstado: EstadoCarrito = {
      ferreteria_id: ferreteria.id,
      ferreteria_nombre: ferreteria.nombre,
      items: baseItems,
    };

    guardarCarrito(nuevoEstado);
    setCarrito(nuevoEstado);
    setConflictoFerreteria(null);
  };

  const cambiarCantidadItem = (productoId: string, delta: number) => {
    if (!carrito.ferreteria_id) return;
    const actualizados = carrito.items
      .map((item) =>
        item.producto_id === productoId
          ? { ...item, cantidad: item.cantidad + delta }
          : item
      )
      .filter((item) => item.cantidad > 0);

    const nuevoEstado: EstadoCarrito =
      actualizados.length === 0
        ? { ferreteria_id: null, ferreteria_nombre: null, items: [] }
        : { ...carrito, items: actualizados };

    guardarCarrito(nuevoEstado);
    setCarrito(nuevoEstado);
  };

  const iniciarCheckout = () => {
    if (!session) {
      navigate({
        to: "/login",
        search: {
          mode: "login",
          role: "cliente",
          redirect: `/ferreteria/${id}`,
        },
      });
      return;
    }
    setErrorPedido(null);
    setMensajeExito(false);
    setCheckoutAbierto(true);
  };

  const confirmarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !ferreteria || carrito.items.length === 0) return;

    setEnviando(true);
    setErrorPedido(null);

    const totalCalculado = calcularTotalCarrito(carrito.items);

    try {
      // 1. Guardar o actualizar perfil del cliente para futuras compras
      if (tienePerfilPrevio) {
        await supabase
          .from("perfiles")
          .update({
            nombre: clienteNombre.trim(),
            telefono: clienteTelefono.trim(),
            direccion: clienteDireccion.trim(),
          })
          .eq("user_id", session.user.id);
      } else {
        await supabase.from("perfiles").insert({
          user_id: session.user.id,
          nombre: clienteNombre.trim(),
          telefono: clienteTelefono.trim(),
          direccion: clienteDireccion.trim(),
        });
        setTienePerfilPrevio(true);
      }

      // 2. Crear la cabecera del pedido
      const { data: pedidoData, error: pedidoErr } = await supabase
        .from("pedidos")
        .insert({
          ferreteria_id: ferreteria.id,
          cliente_id: session.user.id,
          cliente_nombre: clienteNombre.trim(),
          cliente_telefono: clienteTelefono.trim(),
          cliente_direccion: clienteDireccion.trim(),
          total: totalCalculado,
          estado: "pendiente",
        })
        .select("id")
        .single();

      if (pedidoErr) {
        setErrorPedido(pedidoErr.message);
        return;
      }

      // 3. Insertar todos los ítems del carrito
      const itemsPayload = carrito.items.map((item) => ({
        pedido_id: pedidoData.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
      }));

      const { error: itemsErr } = await supabase.from("pedido_items").insert(itemsPayload);

      if (itemsErr) {
        setErrorPedido(itemsErr.message);
        return;
      }

      // 4. Limpiar carrito tras confirmación exitosa
      vaciarCarrito();
      setCarrito({ ferreteria_id: null, ferreteria_nombre: null, items: [] });
      setMensajeExito(true);

      setTimeout(() => {
        setCheckoutAbierto(false);
        setMensajeExito(false);
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
            Ferretería no disponible
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Este comercio no existe o se encuentra temporalmente inactivo.
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

  const carritoEsDeEstaFerreteria = carrito.ferreteria_id === ferreteria.id;
  const itemsVisibles = carritoEsDeEstaFerreteria ? carrito.items : [];
  const totalCarrito = calcularTotalCarrito(itemsVisibles);

  return (
    <main className="min-h-screen bg-background py-10">
      <div className="container mx-auto max-w-6xl px-4">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al directorio</span>
        </Link>

        {/* Encabezado Ferretería */}
        <div className="mb-8 border border-border bg-card p-6 md:p-8">
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

        {/* Layout Catálogo + Carrito Lateral */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Productos */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h2 className="font-display text-xl font-bold uppercase tracking-wide text-foreground">
                Catálogo Disponible ({productos.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Agregue los productos que necesite a su carrito
              </p>
            </div>

            {productos.length === 0 ? (
              <div className="border border-border bg-card p-12 text-center text-xs text-muted-foreground">
                Esta ferretería aún no ha publicado productos en su catálogo.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {productos.map((prod) => (
                  <div
                    key={prod.id}
                    className="flex flex-col justify-between border border-border bg-card p-5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        {prod.categoria && (
                          <span className="rounded bg-forge/10 px-2 py-0.5 text-[10px] font-bold uppercase text-forge">
                            {prod.categoria}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          Disp: {prod.stock}
                        </span>
                      </div>
                      <h3 className="mt-2 font-display text-base font-bold text-foreground">
                        {prod.nombre}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {prod.descripcion || "Sin descripción detallada."}
                      </p>
                      <div className="mt-4 font-display text-lg font-bold text-foreground">
                        {cop(prod.precio)}
                      </div>
                    </div>

                    <div className="mt-5 border-t border-border pt-4">
                      <button
                        onClick={() => agregarAlCarrito(prod)}
                        className="inline-flex w-full items-center justify-center gap-2 bg-primary py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>Agregar al carrito</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Carrito de Compras Persistente */}
          <aside className="h-fit border border-border bg-card p-6 sticky top-24">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-forge" />
                <h2 className="font-display text-base font-bold uppercase text-foreground">
                  Tu Carrito
                </h2>
              </div>
              {itemsVisibles.length > 0 && (
                <button
                  onClick={() => {
                    vaciarCarrito();
                    setCarrito({ ferreteria_id: null, ferreteria_nombre: null, items: [] });
                  }}
                  className="text-[10px] font-bold uppercase text-muted-foreground hover:text-destructive"
                >
                  Vaciar
                </button>
              )}
            </div>

            {!carritoEsDeEstaFerreteria && carrito.items.length > 0 && (
              <div className="mb-4 border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-300">
                Tienes un carrito activo en <strong>{carrito.ferreteria_nombre}</strong>. Si agregas productos aquí, podrás reemplazarlo.
              </div>
            )}

            {itemsVisibles.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                Tu carrito está vacío. Agrega herramientas o materiales del catálogo.
              </p>
            ) : (
              <>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {itemsVisibles.map((item) => (
                    <div
                      key={item.producto_id}
                      className="flex items-center justify-between gap-2 border-b border-border/60 pb-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-foreground">{item.nombre}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {cop(item.precio)} c/u
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => cambiarCantidadItem(item.producto_id, -1)}
                          className="grid h-6 w-6 place-items-center border border-border bg-background hover:bg-accent"
                          aria-label="Disminuir cantidad"
                        >
                          {item.cantidad === 1 ? (
                            <Trash2 className="h-3 w-3 text-destructive" />
                          ) : (
                            <Minus className="h-3 w-3" />
                          )}
                        </button>
                        <span className="w-6 text-center font-bold">{item.cantidad}</span>
                        <button
                          onClick={() => cambiarCantidadItem(item.producto_id, 1)}
                          className="grid h-6 w-6 place-items-center border border-border bg-background hover:bg-accent"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs">
                  <span className="font-bold uppercase text-muted-foreground">Total:</span>
                  <span className="font-display text-lg font-bold text-forge">
                    {cop(totalCarrito)}
                  </span>
                </div>

                <button
                  onClick={iniciarCheckout}
                  className="mt-4 w-full bg-primary py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Hacer Pedido ({itemsVisibles.reduce((a, b) => a + b.cantidad, 0)})
                </button>

                {!session && (
                  <p className="mt-2 text-center text-[10px] text-muted-foreground">
                    Se te pedirá ingresar o crear cuenta al confirmar. Tu carrito quedará guardado.
                  </p>
                )}
              </>
            )}
          </aside>
        </div>

        {/* Modal de Conflicto de Ferretería (Un carrito = Una ferretería) */}
        {conflictoFerreteria && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md border border-border bg-card p-6 shadow-2xl">
              <div className="mb-3 flex items-center gap-2 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-display text-lg font-bold uppercase text-foreground">
                  ¿Empezar un carrito nuevo?
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Ya tienes productos seleccionados de{" "}
                <strong className="text-foreground">{carrito.ferreteria_nombre}</strong>. Los pedidos se gestionan por separado para cada comercio. Si continúas, se reemplazará tu carrito anterior.
              </p>
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setConflictoFerreteria(null)}
                  className="w-1/2 border border-border bg-background py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-accent"
                >
                  Mantener anterior
                </button>
                <button
                  onClick={() => agregarAlCarrito(conflictoFerreteria, true)}
                  className="w-1/2 bg-primary py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
                >
                  Nuevo carrito
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmación Final de Pedido */}
        {checkoutAbierto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md border border-border bg-card p-6 shadow-2xl">
              <h3 className="mb-1 font-display text-lg font-bold uppercase text-foreground">
                Confirmar Pedido en {ferreteria.nombre}
              </h3>
              <p className="mb-4 text-xs text-muted-foreground">
                Verifique sus datos de entrega para enviar la orden
              </p>

              {mensajeExito ? (
                <div className="my-6 flex flex-col items-center justify-center border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
                  <CheckCircle2 className="mb-2 h-10 w-10 text-emerald-400" />
                  <p className="text-xs font-bold text-emerald-400">
                    ¡Pedido enviado con éxito!
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    La ferretería ha recibido su orden y se pondrá en contacto pronto.
                  </p>
                </div>
              ) : (
                <form onSubmit={confirmarPedido} className="space-y-4">
                  {errorPedido && (
                    <div className="flex items-center gap-2 border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                      <ShieldAlert className="h-4 w-4 shrink-0" />
                      <span>{errorPedido}</span>
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={100}
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                      placeholder="Ej. Juan Gómez"
                      className="w-full border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-forge"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="text"
                      required
                      minLength={7}
                      maxLength={20}
                      value={clienteTelefono}
                      onChange={(e) => setClienteTelefono(e.target.value)}
                      placeholder="300 000 0000"
                      className="w-full border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-forge"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Dirección de Entrega
                    </label>
                    <input
                      type="text"
                      required
                      minLength={5}
                      maxLength={200}
                      value={clienteDireccion}
                      onChange={(e) => setClienteDireccion(e.target.value)}
                      placeholder="Calle 10 # 5-15, Armenia"
                      className="w-full border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-forge"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
                    <span className="font-bold text-muted-foreground">
                      Total ({itemsVisibles.reduce((a, b) => a + b.cantidad, 0)} ítems):
                    </span>
                    <span className="font-display text-base font-bold text-forge">
                      {cop(totalCarrito)}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setCheckoutAbierto(false)}
                      className="w-1/2 border border-border bg-background py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-accent"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={enviando}
                      className="w-1/2 bg-primary py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {enviando ? "Enviando..." : "Confirmar Orden"}
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