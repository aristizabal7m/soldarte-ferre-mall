import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
  useNavigate,
} from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/lib/supabase";
import {
  Menu,
  X,
  LogIn,
  LogOut,
  Store,
  ShieldCheck,
  LayoutDashboard,
  ShoppingBag,
} from "lucide-react";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SoldArte FerreMALL | Tu plataforma de ferreterías" },
      {
        name: "description",
        content:
          "Encuentra las mejores ferreterías en un solo lugar, consulta su catálogo y realiza tus compras en línea.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootLayout,
});

function Navbar() {
  const { session, user, esAdmin } = useSession();
  const navigate = useNavigate();

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [tieneFerreteria, setTieneFerreteria] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Verificar si el usuario autenticado posee una ferretería registrada
  useEffect(() => {
    let activo = true;

    async function verificarFerreteria() {
      if (!user) {
        if (activo) setTieneFerreteria(false);
        return;
      }
      const { data } = await supabase
        .from("ferreterias")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (activo) {
        setTieneFerreteria(Boolean(data));
      }
    }

    verificarFerreteria();
    return () => {
      activo = false;
    };
  }, [user]);

  // Cerrar el menú hamburguesa al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cerrarSesion = async () => {
    setMenuAbierto(false);
    await supabase.auth.signOut();
    setTieneFerreteria(false);
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Marca */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center bg-primary font-display text-base font-bold text-primary-foreground">
            S
          </div>
          <div className="leading-none">
            <span className="font-display text-lg font-bold tracking-wider uppercase text-foreground">
              Sold<span className="text-forge">Arte</span>
            </span>
            <span className="block font-display text-[9px] font-semibold tracking-[0.3em] uppercase text-forge">
              ferreMALL
            </span>
          </div>
        </Link>

        {/* Barra de Navegación Principal Limpia */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider">
          <Link
            to="/"
            className="text-muted-foreground transition-colors hover:text-foreground [&.active]:text-forge"
          >
            Inicio
          </Link>

          <a
            href="/#directorio"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Ferreterías Disponibles
          </a>

          {session && tieneFerreteria && (
            <Link
              to="/panel"
              className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground [&.active]:text-forge"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-forge" />
              <span>Mi Panel</span>
            </Link>
          )}

          {session && esAdmin && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 text-amber-400 transition-colors hover:text-amber-300 [&.active]:underline"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Admin</span>
            </Link>
          )}
        </nav>

        {/* Menú Hamburguesa (Cuenta, Pedidos y Registro de Negocio) */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuAbierto((prev) => !prev)}
            aria-label="Abrir menú de opciones"
            aria-expanded={menuAbierto}
            className="inline-flex items-center gap-2 border border-border bg-background px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-forge/60 hover:bg-accent"
          >
            {menuAbierto ? <X className="h-4 w-4 text-forge" /> : <Menu className="h-4 w-4 text-forge" />}
            <span className="hidden sm:inline">Menú</span>
          </button>

          {menuAbierto && (
            <div className="absolute right-0 mt-2 w-64 border border-border bg-card p-2 shadow-2xl z-50">
              {/* Enlaces móviles (solo visibles en pantallas pequeñas) */}
              <div className="md:hidden border-b border-border pb-2 mb-2 space-y-1">
                <Link
                  to="/"
                  onClick={() => setMenuAbierto(false)}
                  className="block px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-accent"
                >
                  Inicio
                </Link>
                <a
                  href="/#directorio"
                  onClick={() => setMenuAbierto(false)}
                  className="block px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-accent"
                >
                  Ferreterías Disponibles
                </a>
                {session && tieneFerreteria && (
                  <Link
                    to="/panel"
                    onClick={() => setMenuAbierto(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-forge hover:bg-accent"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    <span>Mi Panel</span>
                  </Link>
                )}
                {session && esAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMenuAbierto(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-amber-400 hover:bg-accent"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Admin</span>
                  </Link>
                )}
              </div>

              {/* Opciones de Cuenta y Negocio */}
              {!session ? (
                <div className="space-y-1">
                  <Link
                    to="/login"
                    search={{ mode: "login", redirect: undefined }}
                    onClick={() => setMenuAbierto(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-accent"
                  >
                    <LogIn className="h-4 w-4 text-forge" />
                    <span>Ingresar</span>
                  </Link>

                  <Link
                    to="/vender"
                    onClick={() => setMenuAbierto(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-forge hover:bg-accent"
                  >
                    <Store className="h-4 w-4" />
                    <span>Registrar mi Ferretería</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <span className="block text-[10px] uppercase text-muted-foreground">
                      Sesión activa
                    </span>
                    <span className="block truncate text-xs font-semibold text-foreground">
                      {user?.email}
                    </span>
                  </div>

                  <Link
                    to="/mis-pedidos"
                    onClick={() => setMenuAbierto(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-accent"
                  >
                    <ShoppingBag className="h-4 w-4 text-forge" />
                    <span>Mis Pedidos</span>
                  </Link>

                  {!tieneFerreteria && (
                    <Link
                      to="/vender"
                      onClick={() => setMenuAbierto(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-forge hover:bg-accent"
                    >
                      <Store className="h-4 w-4" />
                      <span>Registrar mi Ferretería</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={cerrarSesion}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Salir</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function RootLayout() {
  return (
    <html lang="es" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
        <Navbar />
        <div className="flex-1">
          <Outlet />
        </div>
        <footer className="border-t border-border bg-card py-6 text-center text-xs text-muted-foreground">
          <div className="container mx-auto px-4">
            <p className="font-display font-bold uppercase tracking-wider text-foreground">
              SoldArte FerreMALL
            </p>
            <p className="mt-1">
              Plataforma de ferreterías locales · Armenia, Quindío
            </p>
          </div>
        </footer>
        <Scripts />
      </body>
    </html>
  );
}