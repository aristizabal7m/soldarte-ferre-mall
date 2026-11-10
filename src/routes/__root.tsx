import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState, useRef, type ReactNode } from "react";
import { X, Send, Sparkles, Bot, User } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { enviarMensajeChat } from "../lib/chat-server";
import { useSession } from "../hooks/use-session";
import { supabase } from "../lib/supabase";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SoldArte FerreMALL | Tu plataforma de ferreterías" },
      {
        name: "description",
        content:
          "Encuentre herramientas y materiales de las mejores ferreterías en un solo lugar y elija dónde comprar con SoldArte FerreMALL.",
      },
      { name: "author", content: "SoldArte FerreMALL" },
      { property: "og:title", content: "SoldArte FerreMALL | Tu plataforma de ferreterías" },
      {
        property: "og:description",
        content: "Compare y compre herramientas y materiales de construccion en múltiples ferreterías.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Barlow:wght@400;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const navCls =
  "border border-transparent px-3 py-2 text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-foreground";

type ChatMessage = {
  role: "user" | "model";
  text: string;
};

function ChatBot() {
  const [abierto, setAbierto] = useState(false);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensajes, setMensajes] = useState<ChatMessage[]>([
    {
      role: "model",
      text: "¡Hola! Soy el asistente virtual de SoldArte FerreMALL. ¿En qué le puedo ayudar con herramientas, materiales o ferreterías?",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, cargando]);

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    const texto = input.trim();
    if (!texto || cargando) return;

    const nuevosMensajes: ChatMessage[] = [...mensajes, { role: "user", text: texto }];
    setMensajes(nuevosMensajes);
    setInput("");
    setCargando(true);

    try {
      const resultado = await enviarMensajeChat({ data: { messages: nuevosMensajes } });

      if (resultado && resultado.reply) {
        setMensajes([...nuevosMensajes, { role: "model", text: resultado.reply }]);
      } else {
        setMensajes([
          ...nuevosMensajes,
          {
            role: "model",
            text: resultado?.error || "Disculpe, ocurrió un problema al procesar su consulta.",
          },
        ]);
      }
    } catch (err) {
      console.error("Error al ejecutar server function:", err);
      setMensajes([
        ...nuevosMensajes,
        {
          role: "model",
          text: "Lo sentimos, no hay conexión con el servidor en este momento. Intente más tarde.",
        },
      ]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!abierto ? (
        <button
          onClick={() => setAbierto(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-forge text-black shadow-lg shadow-forge/20 transition-transform hover:scale-105 active:scale-95"
          aria-label="Abrir asistente virtual"
        >
          <Sparkles className="h-7 w-7" />
        </button>
      ) : (
        <div className="flex h-[500px] w-[350px] sm:w-[380px] flex-col border border-border bg-card shadow-2xl">
          {/* Encabezado */}
          <div className="flex items-center justify-between border-b border-border bg-black/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center bg-forge font-display text-xs font-bold text-black">
                AI
              </span>
              <div>
                <h3 className="font-display text-sm font-bold tracking-wide uppercase text-foreground">
                  Asistente FerreMALL
                </h3>
                <p className="text-[10px] text-muted-foreground">En línea · Plataforma de Ferreterías</p>
              </div>
            </div>
            <button
              onClick={() => setAbierto(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Cerrar chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Lista de mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
            {mensajes.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "model" && (
                  <div className="grid h-6 w-6 shrink-0 place-items-center rounded bg-forge/20 text-forge">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3 py-2 text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground font-medium"
                      : "border border-border bg-muted/50 text-foreground"
                  }`}
                >
                  {m.text}
                </div>
                {m.role === "user" && (
                  <div className="grid h-6 w-6 shrink-0 place-items-center rounded bg-primary/20 text-primary">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}
            {cargando && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Bot className="h-3.5 w-3.5 text-forge animate-pulse" />
                <span>Escribiendo respuesta...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulario de entrada */}
          <form onSubmit={enviarMensaje} className="border-t border-border p-3 flex gap-2 bg-black/20">
            <input
              type="text"
              maxLength={500}
              placeholder="Escriba su consulta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-forge"
            />
            <button
              type="submit"
              disabled={cargando || !input.trim()}
              className="bg-primary px-3 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { session, esAdmin } = useSession();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <QueryClientProvider client={queryClient}>
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center bg-primary font-display text-lg font-bold text-primary-foreground">
              S
            </span>
            <div className="flex flex-col">
              <span className="truncate font-display text-xl font-bold tracking-widest uppercase leading-none">
                Sold<span className="text-forge">Arte</span>
              </span>
              <span className="font-display text-[10px] font-semibold tracking-[0.25em] uppercase text-forge">
                ferreMALL
              </span>
            </div>
          </Link>
        </div>
        <nav className="flex overflow-x-auto border-t border-border px-2">
          <Link to="/" className={navCls} activeProps={{ className: "text-forge border-b-2 border-forge" }} activeOptions={{ exact: true }}>
            Inicio
          </Link>
          <Link to="/cotizar" className={navCls} activeProps={{ className: "text-forge border-b-2 border-forge" }}>
            Cotizador
          </Link>
          <Link to="/herramientas" className={navCls} activeProps={{ className: "text-forge border-b-2 border-forge" }}>
            Herramientas
          </Link>
          <Link to="/vender" className={navCls} activeProps={{ className: "text-forge border-b-2 border-forge" }}>
            Vender
          </Link>
          <Link to="/panel" className={navCls} activeProps={{ className: "text-forge border-b-2 border-forge" }}>
            Panel
          </Link>
          {esAdmin && (
            <Link to="/admin" className={navCls} activeProps={{ className: "text-forge border-b-2 border-forge" }}>
              Admin
            </Link>
          )}
          {!session ? (
            <Link to="/login" className={navCls} activeProps={{ className: "text-forge border-b-2 border-forge" }}>
              Ingresar
            </Link>
          ) : (
            <button onClick={handleSignOut} className={navCls}>
              Salir
            </button>
          )}
        </nav>
      </header>
      <Outlet />
      <ChatBot />
    </QueryClientProvider>
  );
}