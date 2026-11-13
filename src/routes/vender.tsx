import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/use-session";
import {
  Store,
  ArrowRight,
  CheckCircle2,
  ShieldAlert,
  LayoutDashboard,
  Building2,
  MapPin,
  Phone,
  FileText,
} from "lucide-react";

export const Route = createFileRoute("/vender")({
  head: () => ({
    meta: [
      { title: "Registrar mi Ferretería | SoldArte FerreMALL" },
      {
        name: "description",
        content: "Publique sus productos y llegue a más clientes en SoldArte FerreMALL.",
      },
    ],
  }),
  component: VenderComponent,
});

function VenderComponent() {
  const { user, cargando: cargandoSesion } = useSession();
  const navigate = useNavigate();

  const [ferreteriaExistente, setFerreteriaExistente] = useState<{
    id: string;
    nombre: string;
    estado: string;
  } | null>(null);
  const [verificando, setVerificando] = useState(false);

  // Campos del formulario de registro de ferretería
  const [nombre, setNombre] = useState("");
  const [ciudad, setCiudad] = useState("Armenia");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [registroExitoso, setRegistroExitoso] = useState(false);

  useEffect(() => {
    let activo = true;

    async function verificarNegocio() {
      if (!user) {
        if (activo) setFerreteriaExistente(null);
        return;
      }
      setVerificando(true);
      const { data } = await supabase
        .from("ferreterias")
        .select("id, nombre, estado")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (activo) {
        setFerreteriaExistente(data ?? null);
        setVerificando(false);
      }
    }

    verificarNegocio();
    return () => {
      activo = false;
    };
  }, [user]);

  const handleRegistrarFerreteria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorForm(null);

    if (nombre.trim().length < 3) {
      setErrorForm("El nombre de la ferretería debe tener al menos 3 caracteres.");
      return;
    }
    if (ciudad.trim().length < 3) {
      setErrorForm("Ingrese una ciudad válida.");
      return;
    }
    if (direccion.trim().length < 5) {
      setErrorForm("Ingrese la dirección completa del local.");
      return;
    }
    if (telefono.trim().length < 7) {
      setErrorForm("Ingrese un teléfono de contacto válido.");
      return;
    }

    setGuardando(true);
    try {
      const { data, error } = await supabase
        .from("ferreterias")
        .insert({
          owner_id: user.id,
          nombre: nombre.trim(),
          ciudad: ciudad.trim(),
          direccion: direccion.trim(),
          telefono: telefono.trim(),
          descripcion: descripcion.trim() || null,
          estado: "pendiente",
          activo: true,
        })
        .select("id, nombre, estado")
        .single();

      if (error) {
        setErrorForm(error.message);
        return;
      }

      if (data) {
        setFerreteriaExistente(data);
        setRegistroExitoso(true);
      }
    } catch (err) {
      console.error("Error registrando ferretería:", err);
      setErrorForm("No se pudo registrar la ferretería. Intente nuevamente.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="min-h-screen bg-background py-12 md:py-16">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Encabezado */}
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-forge/30 bg-forge/10 px-3 py-1 text-xs font-semibold text-forge">
            <Store className="h-3.5 w-3.5" />
            <span>Únase a la red de ferreterías</span>
          </div>

          <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-foreground md:text-5xl">
            Venda sus herramientas y materiales en <span className="text-forge">FerreMALL</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
            Conecte su inventario con clientes de la región. Administre sus productos y reciba pedidos en línea.
          </p>
        </div>

        {/* Pasos del Proceso */}
        <div className="mt-10 grid gap-6 md:grid-cols-3 text-left">
          <div className="border border-border bg-card p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded bg-forge/10 font-display text-lg font-bold text-forge">
              1
            </div>
            <h3 className="font-display text-base font-bold uppercase text-foreground">
              Cuenta Única
            </h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Use su cuenta de SoldArte FerreMALL o cree una nueva con su correo electrónico.
            </p>
          </div>

          <div className="border border-border bg-card p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded bg-forge/10 font-display text-lg font-bold text-forge">
              2
            </div>
            <h3 className="font-display text-base font-bold uppercase text-foreground">
              Registro y Validación
            </h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Complete los datos de su establecimiento. El equipo administrador aprobará su tienda.
            </p>
          </div>

          <div className="border border-border bg-card p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded bg-forge/10 font-display text-lg font-bold text-forge">
              3
            </div>
            <h3 className="font-display text-base font-bold uppercase text-foreground">
              Publique y Venda
            </h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Cargue su catálogo desde "Mi Panel" y gestione los pedidos recibidos en tiempo real.
            </p>
          </div>
        </div>

        {/* Zona Dinámica según Estado de Sesión y Negocio */}
        <div className="mt-12">
          {cargandoSesion || verificando ? (
            <div className="border border-border bg-card p-8 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground animate-pulse">
              Verificando estado de tu cuenta...
            </div>
          ) : !user ? (
            <div className="border border-border bg-card p-8 text-center">
              <h2 className="font-display text-xl font-bold uppercase text-foreground">
                ¿Listo para sumar tu ferretería?
              </h2>
              <p className="mt-2 text-xs text-muted-foreground">
                Inicia sesión con tu cuenta actual o crea una nueva para completar el formulario de tu establecimiento.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  to="/login"
                  search={{ mode: "register", redirect: "/vender" }}
                  className="inline-flex items-center gap-2 bg-primary px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <span>Crear cuenta y registrar</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  search={{ mode: "login", redirect: "/vender" }}
                  className="inline-flex items-center gap-2 border border-border bg-background px-6 py-3 text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-forge/60"
                >
                  <span>Ya tengo cuenta · Ingresar</span>
                </Link>
              </div>
            </div>
          ) : ferreteriaExistente ? (
            <div className="border border-emerald-500/40 bg-card p-8 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
              <h2 className="font-display text-xl font-bold uppercase text-foreground">
                {registroExitoso
                  ? "¡Ferretería registrada con éxito!"
                  : "Ya tienes una ferretería asociada"}
              </h2>
              <p className="mt-2 text-xs text-muted-foreground">
                Establecimiento: <strong className="text-foreground">{ferreteriaExistente.nombre}</strong> · Estado:{" "}
                <span className="uppercase font-bold text-forge">{ferreteriaExistente.estado}</span>
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => {
                    // Recarga suave para que Navbar detecte la nueva ferretería y muestre "Mi Panel"
                    window.location.href = "/panel";
                  }}
                  className="inline-flex items-center gap-2 bg-primary px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Ir a Mi Panel de Ferretería</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-xl border border-border bg-card p-6 sm:p-8 shadow-xl">
              <h2 className="font-display text-xl font-bold uppercase text-foreground">
                Datos de tu Ferretería
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Registrando bajo la cuenta: <strong className="text-foreground">{user.email}</strong>
              </p>

              {errorForm && (
                <div className="mt-4 flex items-start gap-2 border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorForm}</span>
                </div>
              )}

              <form onSubmit={handleRegistrarFerreteria} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Nombre Comercial de la Ferretería *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      minLength={3}
                      maxLength={100}
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej. Ferretería El Constructor Quindío"
                      className="w-full border border-border bg-input pl-9 pr-3 py-2 text-xs text-foreground outline-none focus:border-forge"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      required
                      minLength={3}
                      maxLength={60}
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      placeholder="Armenia"
                      className="w-full border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-forge"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Teléfono / WhatsApp *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <input
                        type="tel"
                        required
                        minLength={7}
                        maxLength={20}
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="310 555 1234"
                        className="w-full border border-border bg-input pl-9 pr-3 py-2 text-xs text-foreground outline-none focus:border-forge"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Dirección Física del Local *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      minLength={5}
                      maxLength={150}
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Cra 14 # 20-35, Centro"
                      className="w-full border border-border bg-input pl-9 pr-3 py-2 text-xs text-foreground outline-none focus:border-forge"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Descripción / Especialidad (Opcional)
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <textarea
                      rows={3}
                      maxLength={300}
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Herramientas eléctricas, materiales de construcción, plomería y pintura..."
                      className="w-full border border-border bg-input pl-9 pr-3 py-2 text-xs text-foreground outline-none focus:border-forge"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={guardando}
                  className="w-full bg-primary py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {guardando ? "Registrando ferretería..." : "Enviar Solicitud de Registro"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}