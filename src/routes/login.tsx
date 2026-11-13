import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/use-session";
import { Wrench, ShieldAlert, CheckCircle2, Lock, Mail } from "lucide-react";

function sanitizarRedirect(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.includes("://")) {
    return trimmed;
  }
  return undefined;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "register" ? "register" : "login",
    redirect: sanitizarRedirect(search.redirect),
  }),
  head: () => ({
    meta: [
      { title: "Acceso | SoldArte FerreMALL" },
      { name: "description", content: "Inicie sesión o cree su cuenta en SoldArte FerreMALL." },
    ],
  }),
  component: LoginComponent,
});

function LoginComponent() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const { user, cargando: cargandoSesion } = useSession();

  const [esRegistro, setEsRegistro] = useState(search.mode === "register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [aceptaDatos, setAceptaDatos] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    setEsRegistro(search.mode === "register");
  }, [search.mode]);

  const redirigirDestino = async (userId: string) => {
    if (search.redirect) {
      navigate({ to: search.redirect as never });
      return;
    }

    const { data: esAdmin } = await supabase.rpc("es_admin");
    if (esAdmin) {
      navigate({ to: "/admin" });
      return;
    }

    const { data: ferr } = await supabase
      .from("ferreterias")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();

    if (ferr) {
      navigate({ to: "/panel" });
    } else {
      navigate({ to: "/" });
    }
  };

  // Si el usuario llega tras confirmar su correo en Supabase, redirigir automáticamente
  useEffect(() => {
    if (!cargandoSesion && user) {
      redirigirDestino(user.id);
    }
  }, [user, cargandoSesion]);

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

    if (esRegistro && !aceptaDatos) {
      setErrorText("Debe autorizar el tratamiento de datos personales (Ley 1581) para continuar.");
      return;
    }

    setCargando(true);

    try {
      if (esRegistro) {
        const redirectUrl =
          typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) {
          setErrorText(error.message);
          return;
        }

        if (!data.session) {
          setMensajeExito(
            "Cuenta creada. Revise su bandeja de entrada y haga clic en el enlace de confirmación para activar su cuenta."
          );
          setEmail("");
          setPassword("");
        } else {
          await redirigirDestino(data.session.user.id);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setErrorText("Correo o contraseña incorrectos.");
          return;
        }

        if (data.session) {
          await redirigirDestino(data.session.user.id);
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
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-forge/10 text-forge">
            <Wrench className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">
            {esRegistro ? "Crear una Cuenta" : "Ingresar a FerreMALL"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {search.redirect
              ? "Inicie sesión o regístrese para continuar con su solicitud"
              : esRegistro
              ? "Cree su cuenta única para comprar o registrar su ferretería"
              : "Ingrese sus credenciales de acceso"}
          </p>
        </div>

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

          {esRegistro && (
            <label className="flex items-start gap-2 text-[11px] text-muted-foreground cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={aceptaDatos}
                onChange={(e) => setAceptaDatos(e.target.checked)}
                className="mt-0.5 accent-forge"
              />
              <span>
                Autorizo el tratamiento de mis datos personales conforme a la Ley 1581 de 2012.
              </span>
            </label>
          )}

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