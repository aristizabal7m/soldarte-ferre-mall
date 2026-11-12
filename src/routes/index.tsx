import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/use-session";
import { Store, MapPin, Phone, ArrowRight, ShieldCheck, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SoldArte FerreMALL | Tu plataforma de ferreterías" },
      {
        name: "description",
        content:
          "Encuentre herramientas y materiales de las mejores ferreterías locales y elija en cuál comprar.",
      },
      { property: "og:title", content: "SoldArte FerreMALL | Tu plataforma de ferreterías" },
    ],
  }),
  component: IndexComponent,
});

interface FerreteriaPublica {
  id: string;
  nombre: string;
  ciudad: string;
  direccion: string;
  telefono: string;
}

function IndexComponent() {
  const { session } = useSession();
  const [ferreterias, setFerreterias] = useState<FerreteriaPublica[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarFerreterias() {
      try {
        const { data, error } = await supabase
          .from("ferreterias")
          .select("id, nombre, ciudad, direccion, telefono")
          .eq("estado", "aprobada")
          .eq("activo", true)
          .order("nombre", { ascending: true });

        if (error) {
          console.error("Error al cargar ferreterías:", error.message);
        } else if (data) {
          setFerreterias(data as FerreteriaPublica[]);
        }
      } catch (err) {
        console.error("Excepción al consultar ferreterías:", err);
      } finally {
        setCargando(false);
      }
    }

    cargarFerreterias();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-card py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-forge/30 bg-forge/10 px-3 py-1 text-xs font-semibold text-forge">
            <Store className="h-3.5 w-3.5" />
            <span>Marketplace de Ferreterías</span>
          </div>

          <div className="mb-6 flex justify-center">
            <div className="flex flex-col items-center">
              <span className="font-display text-5xl font-bold tracking-widest uppercase md:text-6xl">
                Sold<span className="text-forge">Arte</span>
              </span>
              <span className="font-display text-lg font-semibold tracking-[0.35em] uppercase text-forge -mt-1">
                ferreMALL
              </span>
            </div>
          </div>

          <h1 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            LAS MEJORES FERRETERÍAS EN UN SOLO LUGAR
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
            Explore los comercios disponibles, consulte sus productos e insumos de construcción y elija dónde realizar su compra.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="#directorio"
              className="inline-flex items-center gap-2 bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <span>Explorar Ferreterías</span>
              <ArrowRight className="h-4 w-4" />
            </a>

            {!session && (
              <Link
                to="/vender"
                className="inline-flex items-center gap-2 border border-input bg-background px-6 py-3 text-sm font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-accent"
              >
                <Store className="h-4 w-4 text-forge" />
                <span>Registrar mi Ferretería</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Directorio de Ferreterías */}
      <section id="directorio" className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 border-b border-border pb-4">
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">
              Ferreterías Disponibles
            </h2>
            <p className="text-xs text-muted-foreground">
              Seleccione una ferretería para ver su catálogo de herramientas e insumos
            </p>
          </div>

          {cargando ? (
            <p className="text-xs uppercase font-bold text-muted-foreground animate-pulse text-center py-12">
              Cargando catálogo de ferreterías...
            </p>
          ) : ferreterias.length === 0 ? (
            <div className="border border-border bg-card p-12 text-center text-xs text-muted-foreground">
              No hay ferreterías registradas o disponibles en este momento.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {ferreterias.map((f) => (
                <div
                  key={f.id}
                  className="flex flex-col justify-between border border-border bg-card p-5 transition-all hover:border-forge/50"
                >
                  <div>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded bg-forge/10 text-forge">
                      <Store className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-foreground">
                      {f.nombre}
                    </h3>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-forge shrink-0" />
                        <span>{f.ciudad} — {f.direccion}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-forge shrink-0" />
                        <span>{f.telefono}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-border pt-4">
                    <Link
                      to="/ferreteria/$id"
                      params={{ id: f.id }}
                      className="inline-flex w-full items-center justify-center gap-2 bg-primary py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <span>Ver Catálogo</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Características principales */}
      <section className="border-t border-border py-12 bg-black/20">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-4">
              <div className="rounded bg-forge/10 p-2 text-forge">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold uppercase text-foreground">
                  Comercios Verificados
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cada ferretería es revisada y validada antes de ofrecer sus productos en la plataforma.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-4">
              <div className="rounded bg-forge/10 p-2 text-forge">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold uppercase text-foreground">
                  Compras Directas
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Elija el comercio de su preferencia según cercanía, catálogo y disponibilidad de insumos.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-4">
              <div className="rounded bg-forge/10 p-2 text-forge">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold uppercase text-foreground">
                  Cuentas Seguras
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sus datos de compra y pedidos quedan almacenados de manera privada en su cuenta.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}