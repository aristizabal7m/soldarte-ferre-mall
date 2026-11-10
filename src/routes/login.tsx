import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Wrench, ShieldAlert, CheckCircle2, Lock, Mail, User, Store } from "lucide-react";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "register" ? "register" : "login",
    role: search.role === "ferreteria" ? "ferreteria" : "cliente",
  }),
  head: () => ({
    meta: [
      { title: "Acceso | SoldArte FerreMALL" },
      { name: "description", content: "Inicie sesión o regístrese para comprar o vender en la plataforma." },
    ],
  }),
  component: LoginComponent,
});

function LoginComponent() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });

  const [esRegistro, setEsRegistro] = useState(search.mode === "register");
  const [tipoCuenta, setTipoCuenta] = useState<"cliente" | "ferreteria">(search.role);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    setEsRegistro(search.mode === "register");
    setTipoCuenta(search.role);
  }, [search.mode, search.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);
    setMensajeExito(null);

    if (!email.includes("@")) {
      setErrorText("Por favor, ingrese un correo electrónico válido.");
      return;
    }

    if (password.length < 8) {
      setErrorText("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setCargando(true);

    try {
      if (esRegistro) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nombre: nombreCompleto,
              tipo_usuario: tipoCuenta,
            },
          },
        });

        if (error) {
          setErrorText(error.message);
          return;
        }

        if (!data.session) {
          setMensajeExito(
            "Cuenta creada con éxito. Por favor revise su correo para confirmar su cuenta antes de ingresar."
          );
          setEmail("");
          setPassword("");
          setNombreCompleto("");
        } else {
          if (tipoCuenta === "ferreteria") {
            navigate({ to: "/panel" });
          } else {
            navigate({ to: "/" });
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorText("Correo o contraseña incorrectos.");
          return;
        }

        if (data.session) {
          const { data: esAdmin } = await supabase.rpc("es_admin");
          if (esAdmin) {
            navigate({ to: "/admin" });
          } else {
            const { data: ferr } = await supabase
              .from("ferreterias")
              .select("id")
              .eq("owner_id", data.session.user.id)
              .maybeSingle();

            if (ferr) {
              navigate({ to: "/panel" });
            } else {
              navigate({ to: "/" });
            }
          }
        }
      }
    } catch (err) {
      console.error("Error en autenticación:", err);
      setErrorText("Ocurrió un error inesperado. Intente nuevamente.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md border border-border bg-card p-6 sm:p-8 shadow-2xl">
        {/* Encabezado */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-forge/10 text-forge">
            <Wrench className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">
            {esRegistro ? "Crear una Cuenta" : "Ingresar a FerreMALL"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {esRegistro
              ? "Seleccione su perfil y complete sus datos"
              : "Ingrese sus credenciales de acceso"}
          </p>
        </div>

        {/* Selector de Rol en Registro */}
        {esRegistro && (
          <div className="mt-6 grid grid-cols-2 gap-2 p-1 bg-muted rounded">
            <button
              type="button"
              onClick={() => setTipoCuenta("cliente")}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                tipoCuenta === "cliente"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Cliente</span>
            </button>
            <button
              type="button"
              onClick={() => setTipoCuenta("ferreteria")}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                tipoCuenta === "ferreteria"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Store className="h-3.5 w-3.5" />
              <span>Ferretería</span>
            </button>
          </div>
        )}

        {/* Mensajes de Alerta */}
        {errorText && (
          <div className="mt-4 flex items-start gap-2 border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorText}</span>
          </div>
        )}

        {mensajeExito && (
          <div className="mt-4 flex items-start gap-2 border border-emerald-500/50 bg-emerald-500/10 p-3 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {esRegistro && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                placeholder="Ej. Carlos Pérez"
                className="w-full border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-forge"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                className="w-full border border-border bg-input pl-9 pr-3 py-2 text-xs text-foreground outline-none focus:border-forge"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Contraseña (mínimo 8 caracteres)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-border bg-input pl-9 pr-3 py-2 text-xs text-foreground outline-none focus:border-forge"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-primary py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {cargando
              ? "Procesando..."
              : esRegistro
              ? "Crear Cuenta"
              : "Iniciar Sesión"}
          </button>
        </form>

        {/* Alternador de Modo */}
        <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          {esRegistro ? (
            <p>
              ¿Ya tiene una cuenta?{" "}
              <button
                type="button"
                onClick={() => {
                  setEsRegistro(false);
                  setErrorText(null);
                  setMensajeExito(null);
                }}
                className="font-bold text-forge hover:underline"
              >
                Ingresar aquí
              </button>
            </p>
          ) : (
            <p>
              ¿No tiene cuenta aún?{" "}
              <button
                type="button"
                onClick={() => {
                  setEsRegistro(true);
                  setErrorText(null);
                  setMensajeExito(null);
                }}
                className="font-bold text-forge hover:underline"
              >
                Crear cuenta
              </button>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}