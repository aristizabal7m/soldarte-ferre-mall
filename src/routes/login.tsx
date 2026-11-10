import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Wrench, ShieldAlert, CheckCircle2, Lock, Mail } from "lucide-react";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "register" ? "register" : "login",
  }),
  head: () => ({
    meta: [
      { title: "Ingresar | SoldArte FerreMALL" },
      { name: "description", content: "Acceso para ferreterías y administradores." },
    ],
  }),
  component: LoginComponent,
});

function LoginComponent() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const [esRegistro, setEsRegistro] = useState(search.mode === "register");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    setEsRegistro(search.mode === "register");
  }, [search.mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);
    setMensajeExito(null);

    // Validaciones básicas de cliente
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
        });

        if (error) {
          setErrorText(error.message);
          return;
        }

        if (!data.session) {
          setMensajeExito(
            "Cuenta registrada. Por favor revise su correo electrónico para confirmar el registro antes de ingresar."
          );
          setEmail("");
          setPassword("");
        } else {
          // Si el proyecto no requiere confirmación y devuelve sesión directa
          navigate({ to: "/panel" });
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
          // Consultar rol para redirigir
          const { data: esAdmin } = await supabase.rpc("es_admin");
          if (esAdmin) {
            navigate({ to: "/admin" });
          } else {
            navigate({ to: "/panel" });
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
            {esRegistro ? "Crear Cuenta de Ferretería" : "Ingresar a la Plataforma"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {esRegistro
              ? "Registre sus credenciales para comenzar a vender"
              : "Ingrese con sus credenciales de acceso"}
          </p>
        </div>

        {/* Mensajes de Alerta */}
        {errorText && (
          <div className="mt-6 flex items-start gap-2 border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorText}</span>
          </div>
        )}

        {mensajeExito && (
          <div className="mt-6 flex items-start gap-2 border border-emerald-500/50 bg-emerald-500/10 p-3 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                placeholder="ferreteria@ejemplo.com"
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
              ? "Registrar Cuenta"
              : "Iniciar Sesión"}
          </button>
        </form>

        {/* Alternador de Modo */}
        <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          {esRegistro ? (
            <p>
              ¿Ya tiene una cuenta creada?{" "}
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
              ¿Quiere registrar su ferretería?{" "}
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