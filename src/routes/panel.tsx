import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { cop } from "@/lib/soldarte";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/lib/supabase";
import {
  Store,
  ShieldAlert,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  Check,
  Settings,
  Save,
  Eye,
  EyeOff,
  ShoppingBag,
  Package,
  Phone,
  MapPin,
  CheckCircle2,
  Truck,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/panel")({
  head: () => ({
    meta: [
      { title: "Panel de Gestión | SoldArte FerreMALL" },
      { name: "description", content: "Administre pedidos, catálogo y perfil de su ferretería." },
    ],
  }),
  component: PanelComponent,
});

interface FerreteriaInfo {
  id: string;
  nombre: string;
  ciudad: string;
  telefono: string;
  direccion: string;
  estado: "pendiente" | "aprobada" | "rechazada" | "suspendida";
}

interface ProductoDB {
  id: string;
  ferreteria_id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  categoria: string | null;
  disponible: boolean;
}

type EstadoPedido = "pendiente" | "confirmado" | "despachado" | "entregado" | "cancelado";

interface PedidoItemDetalle {
  id: string;
  cantidad: number;
  precio_unitario: number;
  productos: {
    nombre: string;
  } | null;
}

interface PedidoFerreteria {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_direccion: string;
  total: number;
  estado: EstadoPedido;
  created_at: string;
  pedido_items: PedidoItemDetalle[];
}

type TabPanel = "pedidos" | "catalogo" | "perfil";

function PanelComponent() {
  const navigate = useNavigate();
  const { user, cargando: cargandoSesion } = useSession();

  const [tabActiva, setTabActiva] = useState<TabPanel>("pedidos");
  const [ferreteria, setFerreteria] = useState<FerreteriaInfo | null>(null);
  const [cargandoFerreteria, setCargandoFerreteria] = useState(true);

  // Formulario de registro inicial de ferretería
  const [nombre, setNombre] = useState("");
  const [ciudad, setCiudad] = useState("Armenia");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  // Formulario de personalización / edición de perfil de ferretería
  const [editNombre, setEditNombre] = useState("");
  const [editCiudad, setEditCiudad] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [editDireccion, setEditDireccion] = useState("");
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [mensajePerfilExito, setMensajePerfilExito] = useState(false);
  const [errorPerfil, setErrorPerfil] = useState<string | null>(null);

  // Estado real del catálogo en Supabase
  const [listaProductos, setListaProductos] = useState<ProductoDB[]>([]);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoPrecio, setNuevoPrecio] = useState("");
  const [nuevoStock, setNuevoStock] = useState("10");
  const [nuevaCategoria, setNuevaCategoria] = useState("Herramientas");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [guardandoProducto, setGuardandoProducto] = useState(false);
  const [errorProducto, setErrorProducto] = useState<string | null>(null);

  // Estado real de pedidos recibidos
  const [pedidos, setPedidos] = useState<PedidoFerreteria[]>([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(false);
  const [actualizandoPedidoId, setActualizandoPedidoId] = useState<string | null>(null);
  const [errorPedidos, setErrorPedidos] = useState<string | null>(null);

  const cargarPedidosFerreteria = async (ferreteriaId: string) => {
    setCargandoPedidos(true);
    setErrorPedidos(null);
    try {
      const { data, error } = await supabase
        .from("pedidos")
        .select(
          `
          id,
          cliente_nombre,
          cliente_telefono,
          cliente_direccion,
          total,
          estado,
          created_at,
          pedido_items (
            id,
            cantidad,
            precio_unitario,
            productos ( nombre )
          )
        `
        )
        .eq("ferreteria_id", ferreteriaId)
        .order("created_at", { ascending: false });

      if (error) {
        setErrorPedidos(error.message);
      } else if (data) {
        setPedidos(data as unknown as PedidoFerreteria[]);
      }
    } catch (err) {
      console.error("Error cargando pedidos:", err);
      setErrorPedidos("No se pudieron cargar los pedidos recibidos.");
    } finally {
      setCargandoPedidos(false);
    }
  };

  // Cargar información de la ferretería, sus productos y sus pedidos
  useEffect(() => {
    if (cargandoSesion) return;

    if (!user) {
      navigate({ to: "/login" });
      return;
    }

    async function cargarTodo() {
      setCargandoFerreteria(true);
      try {
        const { data, error } = await supabase
          .from("ferreterias")
          .select("id, nombre, ciudad, telefono, direccion, estado")
          .eq("owner_id", user!.id)
          .maybeSingle();

        if (error) {
          console.error("Error al cargar ferretería:", error.message);
        } else if (data) {
          const ferr = data as FerreteriaInfo;
          setFerreteria(ferr);
          setEditNombre(ferr.nombre);
          setEditCiudad(ferr.ciudad);
          setEditTelefono(ferr.telefono);
          setEditDireccion(ferr.direccion);

          // Cargar productos reales
          setCargandoProductos(true);
          const { data: prods, error: prodErr } = await supabase
            .from("productos")
            .select("id, ferreteria_id, nombre, descripcion, precio, stock, categoria, disponible")
            .eq("ferreteria_id", ferr.id)
            .order("created_at", { ascending: false });

          if (!prodErr && prods) {
            setListaProductos(prods as ProductoDB[]);
          }
          setCargandoProductos(false);

          // Cargar pedidos reales
          await cargarPedidosFerreteria(ferr.id);
        }
      } catch (err) {
        console.error("Excepción al consultar ferretería:", err);
      } finally {
        setCargandoFerreteria(false);
      }
    }

    cargarTodo();
  }, [user, cargandoSesion, navigate]);

  const cambiarEstadoPedido = async (pedidoId: string, nuevoEstado: EstadoPedido) => {
    setActualizandoPedidoId(pedidoId);
    setErrorPedidos(null);

    try {
      const { error } = await supabase
        .from("pedidos")
        .update({ estado: nuevoEstado })
        .eq("id", pedidoId);

      if (error) {
        setErrorPedidos(error.message);
        return;
      }

      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoId ? { ...p, estado: nuevoEstado } : p))
      );
    } catch (err) {
      console.error("Error actualizando pedido:", err);
      setErrorPedidos("No se pudo actualizar el estado del pedido.");
    } finally {
      setActualizandoPedidoId(null);
    }
  };

  const registrarFerreteria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorForm(null);
    setGuardando(true);

    try {
      const { data, error } = await supabase
        .from("ferreterias")
        .insert({
          nombre,
          ciudad,
          telefono,
          direccion,
        })
        .select("id, nombre, ciudad, telefono, direccion, estado")
        .single();

      if (error) {
        setErrorForm(error.message);
      } else if (data) {
        const ferr = data as FerreteriaInfo;
        setFerreteria(ferr);
        setEditNombre(ferr.nombre);
        setEditCiudad(ferr.ciudad);
        setEditTelefono(ferr.telefono);
        setEditDireccion(ferr.direccion);
      }
    } catch (err) {
      console.error("Error al registrar ferretería:", err);
      setErrorForm("Ocurrió un error al guardar los datos de su ferretería.");
    } finally {
      setGuardando(false);
    }
  };

  const actualizarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ferreteria) return;

    setGuardandoPerfil(true);
    setErrorPerfil(null);
    setMensajePerfilExito(false);

    try {
      const { data, error } = await supabase
        .from("ferreterias")
        .update({
          nombre: editNombre,
          ciudad: editCiudad,
          telefono: editTelefono,
          direccion: editDireccion,
        })
        .eq("id", ferreteria.id)
        .select("id, nombre, ciudad, telefono, direccion, estado")
        .single();

      if (error) {
        setErrorPerfil(error.message);
      } else if (data) {
        setFerreteria(data as FerreteriaInfo);
        setMensajePerfilExito(true);
        setTimeout(() => setMensajePerfilExito(false), 3000);
      }
    } catch (err) {
      console.error("Error al actualizar perfil:", err);
      setErrorPerfil("No se pudo actualizar el perfil de la ferretería.");
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const agregarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ferreteria || !nuevoNombre.trim() || !nuevoPrecio) return;

    setGuardandoProducto(true);
    setErrorProducto(null);

    try {
      const { data, error } = await supabase
        .from("productos")
        .insert({
          ferreteria_id: ferreteria.id,
          nombre: nuevoNombre.trim(),
          precio: Number(nuevoPrecio),
          stock: Math.max(0, Number(nuevoStock) || 0),
          categoria: nuevaCategoria,
          descripcion: nuevaDescripcion.trim() || null,
          disponible: true,
        })
        .select("id, ferreteria_id, nombre, descripcion, precio, stock, categoria, disponible")
        .single();

      if (error) {
        setErrorProducto(error.message);
        return;
      }

      if (data) {
        setListaProductos([data as ProductoDB, ...listaProductos]);
        setNuevoNombre("");
        setNuevoPrecio("");
        setNuevoStock("10");
        setNuevaDescripcion("");
      }
    } catch (err) {
      console.error("Error al agregar producto:", err);
      setErrorProducto("Ocurrió un error inesperado al guardar el producto.");
    } finally {
      setGuardandoProducto(false);
    }
  };

  const toggleDisponibilidad = async (prod: ProductoDB) => {
    const nuevoEstado = !prod.disponible;
    const { error } = await supabase
      .from("productos")
      .update({ disponible: nuevoEstado })
      .eq("id", prod.id);

    if (!error) {
      setListaProductos(
        listaProductos.map((p) => (p.id === prod.id ? { ...p, disponible: nuevoEstado } : p))
      );
    } else {
      setErrorProducto(error.message);
    }
  };

  const eliminarProducto = async (id: string) => {
    const { error } = await supabase.from("productos").delete().eq("id", id);

    if (!error) {
      setListaProductos(listaProductos.filter((p) => p.id !== id));
    } else {
      setErrorProducto(error.message);
    }
  };

  const formatearFechaHora = (iso: string) => {
    return new Date(iso).toLocaleString("es-CO", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (cargandoSesion || cargandoFerreteria) {
    return (
      <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-background">
        <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground animate-pulse">
          Cargando panel de gestión...
        </p>
      </main>
    );
  }

  // 1. Registro de Ferretería
  if (!ferreteria) {
    return (
      <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-lg border border-border bg-card p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-forge/10 text-forge">
              <Store className="h-6 w-6" />
            </div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">
              Datos de su Ferretería
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Complete la información de su establecimiento para enviar la solicitud de registro.
            </p>
          </div>

          {errorForm && (
            <div className="mb-4 flex items-center gap-2 border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorForm}</span>
            </div>
          )}

          <form onSubmit={registrarFerreteria} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Nombre de la Ferretería
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Ferretería El Pregonero"
                className="w-full border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-forge"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  required
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
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
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="300 000 0000"
                  className="w-full border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-forge"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Dirección Comercial
              </label>
              <input
                type="text"
                required
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Carrera 7 # 15-20"
                className="w-full border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-forge"
              />
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full bg-primary py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Enviar Solicitud"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // 2. Solicitud Pendiente
  if (ferreteria.estado === "pendiente") {
    return (
      <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-background px-4">
        <div className="max-w-md border border-forge/30 bg-card p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-forge/10 text-forge">
            <Clock className="h-7 w-7" />
          </div>
          <h2 className="font-display text-xl font-bold uppercase text-foreground">
            Solicitud en revisión
          </h2>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            Su ferretería <strong className="text-foreground">{ferreteria.nombre}</strong> está siendo validada por nuestro equipo de administración. Le notificaremos tan pronto sea aprobada para publicar inventario.
          </p>
        </div>
      </main>
    );
  }

  // 3. Solicitud Rechazada o Suspendida
  if (ferreteria.estado === "rechazada" || ferreteria.estado === "suspendida") {
    return (
      <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-background px-4">
        <div className="max-w-md border border-destructive/50 bg-card p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="font-display text-xl font-bold uppercase text-foreground">
            {ferreteria.estado === "suspendida" ? "Comercio Suspendido" : "Solicitud no aprobada"}
          </h2>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            {ferreteria.estado === "suspendida"
              ? `La operación de ${ferreteria.nombre} se encuentra temporalmente suspendida por administración. Su catálogo está oculto al público.`
              : `La inscripción de la ferretería ${ferreteria.nombre} no ha sido aprobada en este momento.`}
          </p>
        </div>
      </main>
    );
  }

  const pedidosPendientesCount = pedidos.filter((p) => p.estado === "pendiente").length;

  // 4. Solicitud Aprobada
  return (
    <main className="min-h-screen bg-background py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Encabezado */}
        <div className="mb-6 border-b border-border pb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">
              Panel de Control - {ferreteria.nombre}
            </h1>
            <p className="text-xs text-muted-foreground">
              Gestión operativa de órdenes, inventario e identidad comercial ({ferreteria.ciudad})
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            <Check className="h-3.5 w-3.5" />
            <span>Ferretería Aprobada</span>
          </span>
        </div>

        {/* Navegación por Pestañas */}
        <div className="mb-8 flex flex-wrap gap-2 border-b border-border pb-3">
          <button
            onClick={() => setTabActiva("pedidos")}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              tabActiva === "pedidos"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Pedidos Recibidos ({pedidos.length})</span>
            {pedidosPendientesCount > 0 && (
              <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-black">
                {pedidosPendientesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setTabActiva("catalogo")}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              tabActiva === "catalogo"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Catálogo ({listaProductos.length})</span>
          </button>

          <button
            onClick={() => setTabActiva("perfil")}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              tabActiva === "perfil"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Perfil del Comercio</span>
          </button>
        </div>

        {/* PESTAÑA 1: PEDIDOS RECIBIDOS */}
        {tabActiva === "pedidos" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold uppercase text-foreground">
                Órdenes de Clientes
              </h2>
              <button
                onClick={() => cargarPedidosFerreteria(ferreteria.id)}
                className="border border-border bg-card px-3 py-1.5 text-xs font-bold uppercase text-muted-foreground hover:text-foreground"
              >
                Actualizar lista
              </button>
            </div>

            {errorPedidos && (
              <div className="flex items-center gap-2 border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorPedidos}</span>
              </div>
            )}

            {cargandoPedidos ? (
              <p className="py-12 text-center text-xs font-bold uppercase text-muted-foreground animate-pulse">
                Cargando pedidos recibidos...
              </p>
            ) : pedidos.length === 0 ? (
              <div className="border border-border bg-card p-12 text-center text-xs text-muted-foreground">
                Aún no has recibido pedidos de clientes. Cuando un comprador confirme su carrito, aparecerá aquí.
              </div>
            ) : (
              <div className="space-y-4">
                {pedidos.map((pedido) => (
                  <div
                    key={pedido.id}
                    className="border border-border bg-card p-5 transition-colors"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs text-muted-foreground">
                            #{pedido.id.slice(0, 8)}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                              pedido.estado === "pendiente"
                                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                : pedido.estado === "confirmado"
                                ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                                : pedido.estado === "despachado"
                                ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                                : pedido.estado === "entregado"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : "bg-destructive/15 text-destructive border border-destructive/30"
                            }`}
                          >
                            {pedido.estado}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {formatearFechaHora(pedido.created_at)}
                          </span>
                        </div>

                        <h3 className="mt-2 font-display text-base font-bold text-foreground">
                          {pedido.cliente_nombre}
                        </h3>
                        <div className="mt-1 flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-forge" />
                            {pedido.cliente_telefono}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-forge" />
                            {pedido.cliente_direccion}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                          Total Orden
                        </span>
                        <span className="font-display text-xl font-bold text-forge">
                          {cop(pedido.total)}
                        </span>
                      </div>
                    </div>

                    {/* Ítems del pedido */}
                    <div className="my-4 space-y-1.5 bg-background p-3 border border-border/60 text-xs">
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

                    {/* Botones de flujo de estado */}
                    <div className="flex flex-wrap justify-end gap-2 pt-1">
                      {pedido.estado === "pendiente" && (
                        <>
                          <button
                            disabled={actualizandoPedidoId === pedido.id}
                            onClick={() => cambiarEstadoPedido(pedido.id, "confirmado")}
                            className="inline-flex items-center gap-1.5 bg-blue-600 px-3 py-1.5 text-xs font-bold uppercase text-white hover:bg-blue-500 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Confirmar Pedido</span>
                          </button>
                          <button
                            disabled={actualizandoPedidoId === pedido.id}
                            onClick={() => cambiarEstadoPedido(pedido.id, "cancelado")}
                            className="inline-flex items-center gap-1.5 border border-destructive/50 bg-destructive/10 px-3 py-1.5 text-xs font-bold uppercase text-destructive hover:bg-destructive/20 disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Cancelar</span>
                          </button>
                        </>
                      )}

                      {pedido.estado === "confirmado" && (
                        <button
                          disabled={actualizandoPedidoId === pedido.id}
                          onClick={() => cambiarEstadoPedido(pedido.id, "despachado")}
                          className="inline-flex items-center gap-1.5 bg-purple-600 px-3 py-1.5 text-xs font-bold uppercase text-white hover:bg-purple-500 disabled:opacity-50"
                        >
                          <Truck className="h-3.5 w-3.5" />
                          <span>Marcar como Despachado</span>
                        </button>
                      )}

                      {pedido.estado === "despachado" && (
                        <button
                          disabled={actualizandoPedidoId === pedido.id}
                          onClick={() => cambiarEstadoPedido(pedido.id, "entregado")}
                          className="inline-flex items-center gap-1.5 bg-emerald-600 px-3 py-1.5 text-xs font-bold uppercase text-white hover:bg-emerald-500 disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Confirmar Entrega</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 2: CATÁLOGO */}
        {tabActiva === "catalogo" && (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Formulario Agregar Producto */}
            <div className="border border-border bg-card p-6 h-fit">
              <h2 className="font-display text-base font-bold uppercase text-foreground mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4 text-forge" />
                <span>Nuevo Producto</span>
              </h2>

              {errorProducto && (
                <div className="mb-4 flex items-center gap-2 border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{errorProducto}</span>
                </div>
              )}

              <form onSubmit={agregarProducto} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold uppercase text-muted-foreground mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    placeholder="Ej. Taladro Percutor 1/2"
                    className="w-full border border-border bg-input px-3 py-2 text-foreground outline-none focus:border-forge"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold uppercase text-muted-foreground mb-1">
                      Precio (COP)
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={nuevoPrecio}
                      onChange={(e) => setNuevoPrecio(e.target.value)}
                      placeholder="250000"
                      className="w-full border border-border bg-input px-3 py-2 text-foreground outline-none focus:border-forge"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase text-muted-foreground mb-1">
                      Stock
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={nuevoStock}
                      onChange={(e) => setNuevoStock(e.target.value)}
                      className="w-full border border-border bg-input px-3 py-2 text-foreground outline-none focus:border-forge"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold uppercase text-muted-foreground mb-1">
                    Categoría
                  </label>
                  <select
                    value={nuevaCategoria}
                    onChange={(e) => setNuevaCategoria(e.target.value)}
                    className="w-full border border-border bg-input px-3 py-2 text-foreground outline-none focus:border-forge"
                  >
                    <option value="Herramientas">Herramientas</option>
                    <option value="Equipos">Equipos</option>
                    <option value="Materiales">Materiales</option>
                    <option value="Insumos">Insumos</option>
                    <option value="Seguridad">Seguridad</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-muted-foreground mb-1">
                    Descripción / Especificaciones
                  </label>
                  <textarea
                    rows={3}
                    value={nuevaDescripcion}
                    onChange={(e) => setNuevaDescripcion(e.target.value)}
                    placeholder="Descripción del artículo..."
                    className="w-full border border-border bg-input px-3 py-2 text-foreground outline-none focus:border-forge"
                  />
                </div>

                <button
                  type="submit"
                  disabled={guardandoProducto}
                  className="w-full bg-primary py-2 font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {guardandoProducto ? "Guardando..." : "Publicar en Catálogo"}
                </button>
              </form>
            </div>

            {/* Lista de Productos Reales */}
            <div className="lg:col-span-2 border border-border bg-card p-6">
              <h2 className="font-display text-base font-bold uppercase text-foreground mb-4">
                Catálogo Publicado ({listaProductos.length})
              </h2>

              {cargandoProductos ? (
                <p className="text-xs text-muted-foreground animate-pulse py-8 text-center">
                  Cargando inventario...
                </p>
              ) : listaProductos.length === 0 ? (
                <div className="border border-border bg-background p-8 text-center text-xs text-muted-foreground">
                  Aún no tienes productos registrados. Agrega el primero desde el formulario de la izquierda.
                </div>
              ) : (
                <div className="space-y-3">
                  {listaProductos.map((p) => (
                    <div
                      key={p.id}
                      className={`flex flex-wrap items-center justify-between border border-border bg-background p-3 gap-3 ${
                        !p.disponible ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          {p.categoria && (
                            <span className="text-[10px] font-bold uppercase text-forge bg-forge/10 px-1.5 py-0.5 rounded">
                              {p.categoria}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            Stock: {p.stock}
                          </span>
                          {!p.disponible && (
                            <span className="text-[10px] font-bold uppercase text-amber-400">
                              (Oculto al público)
                            </span>
                          )}
                        </div>
                        <h3 className="font-display text-sm font-bold text-foreground mt-1">
                          {p.nombre}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {p.descripcion || "Sin descripción"}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-display text-sm font-bold text-foreground">
                          {cop(p.precio)}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => toggleDisponibilidad(p)}
                            className="p-1 text-muted-foreground hover:text-foreground"
                            title={p.disponible ? "Ocultar producto" : "Mostrar producto"}
                          >
                            {p.disponible ? (
                              <Eye className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-amber-400" />
                            )}
                          </button>
                          <button
                            onClick={() => eliminarProducto(p.id)}
                            className="p-1 text-muted-foreground hover:text-destructive"
                            title="Eliminar de la base de datos"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA 3: PERFIL DEL COMERCIO */}
        {tabActiva === "perfil" && (
          <div className="border border-border bg-card p-6 md:p-8 max-w-3xl">
            <div className="mb-6 flex items-center gap-2 border-b border-border pb-3">
              <Settings className="h-5 w-5 text-forge" />
              <h2 className="font-display text-lg font-bold uppercase text-foreground">
                Personalización del Perfil de la Ferretería
              </h2>
            </div>

            {mensajePerfilExito && (
              <div className="mb-4 flex items-center gap-2 border border-emerald-500/50 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                <Check className="h-4 w-4 shrink-0" />
                <span>Información de la ferretería actualizada correctamente.</span>
              </div>
            )}

            {errorPerfil && (
              <div className="mb-4 flex items-center gap-2 border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorPerfil}</span>
              </div>
            )}

            <form onSubmit={actualizarPerfil} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Nombre Comercial
                  </label>
                  <input
                    type="text"
                    required
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    className="w-full border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-forge"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    required
                    value={editCiudad}
                    onChange={(e) => setEditCiudad(e.target.value)}
                    className="w-full border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-forge"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    required
                    value={editTelefono}
                    onChange={(e) => setEditTelefono(e.target.value)}
                    className="w-full border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-forge"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Dirección Comercial
                  </label>
                  <input
                    type="text"
                    required
                    value={editDireccion}
                    onChange={(e) => setEditDireccion(e.target.value)}
                    className="w-full border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-forge"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={guardandoPerfil}
                  className="inline-flex items-center gap-2 bg-primary px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{guardandoPerfil ? "Guardando..." : "Guardar Cambios del Perfil"}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}