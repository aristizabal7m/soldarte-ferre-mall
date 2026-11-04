import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Wrench, ShieldCheck, ShoppingBag, Store } from "lucide-react";
import { productos, cop } from "@/lib/soldarte";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SoldArte FerreMALL | Tu plataforma de ferreterías" },
      {
        name: "description",
        content:
          "Compare y compre herramientas y materiales en las mejores ferreterías. Elija en cuál comprar con SoldArte FerreMALL.",
      },
      { property: "og:title", content: "SoldArte FerreMALL | Tu plataforma de ferreterías" },
      {
        property: "og:description",
        content:
          "Marketplace de ferreterías: herramientas, materiales y suministros de construcción.",
      },
    ],
  }),
  component: IndexComponent,
});

function IndexComponent() {
  const destacadas = productos.slice(0, 3);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-card py-16 md:py-24">
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
            HERRAMIENTAS Y MATERIALES DE LAS MEJORES FERRETERÍAS
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
            Encuentre todo para su proyecto en un solo lugar. Compare catálogos y elija la ferretería de su preferencia.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/herramientas"
              className="inline-flex items-center gap-2 bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <span>Ver Catálogo</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/cotizar"
              className="inline-flex items-center gap-2 border border-input bg-background px-6 py-3 text-sm font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-accent"
            >
              <span>Cotizador</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Características principales */}
      <section className="border-b border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-4">
              <div className="rounded bg-forge/10 p-2 text-forge">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold uppercase text-foreground">
                  Múltiples Ferreterías
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Acceda a la oferta variada de distintos comercios y proveedores en una sola plataforma.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-4">
              <div className="rounded bg-forge/10 p-2 text-forge">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold uppercase text-foreground">
                  Elección Transparente
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Elija dónde comprar según ubicación, disponibilidad y catálogo de productos.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-4">
              <div className="rounded bg-forge/10 p-2 text-forge">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold uppercase text-foreground">
                  Garantía y Calidad
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Equipos, insumos y herramientas respaldados por marcas reconocidas del sector.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Productos Destacados */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold uppercase tracking-wide text-foreground">
                Herramientas Destacadas
              </h2>
              <p className="text-xs text-muted-foreground">
                Suministros populares disponibles en catálogo
              </p>
            </div>
            <Link
              to="/herramientas"
              className="text-xs font-bold uppercase tracking-wider text-forge hover:underline"
            >
              Ver todo →
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {destacadas.map((prod) => (
              <div
                key={prod.id}
                className="flex flex-col justify-between border border-border bg-card p-4 transition-all hover:border-forge/50"
              >
                <div>
                  <div className="mb-2 inline-block rounded bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                    {prod.categoria}
                  </div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    {prod.nombre}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {prod.detalle}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="font-display text-base font-bold text-forge">
                    {cop(prod.precio)}
                  </span>
                  <Link
                    to="/herramientas"
                    className="inline-flex items-center gap-1 text-xs font-bold uppercase text-foreground hover:text-forge"
                  >
                    <span>Ver</span>
                    <Wrench className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}