import { createFileRoute, Link } from "@tanstack/react-router";
import { Store, ShieldCheck, Upload, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/vender")({
  head: () => ({
    meta: [
      { title: "Vender en SoldArte FerreMALL | Sume su ferretería" },
      {
        name: "description",
        content: "Publique sus productos y llegue a más clientes en SoldArte FerreMALL.",
      },
    ],
  }),
  component: VenderComponent,
});

function VenderComponent() {
  return (
    <main className="min-h-screen bg-background py-12 md:py-20">
      <div className="container mx-auto px-4 text-center max-w-4xl">
        {/* Insignia y Encabezado */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-forge/30 bg-forge/10 px-3 py-1 text-xs font-semibold text-forge">
          <Store className="h-3.5 w-3.5" />
          <span>Únase a la red de ferreterías</span>
        </div>

        <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-foreground md:text-5xl">
          Venda sus herramientas y materiales en <span className="text-forge">FerreMALL</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
          Conecte su inventario con miles de clientes en la región. Gestione sus productos y aumente las ventas de su ferretería.
        </p>

        {/* Pasos del Proceso */}
        <div className="mt-12 grid gap-6 md:grid-cols-3 text-left">
          <div className="border border-border bg-card p-6 flex flex-col justify-between">
            <div>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded bg-forge/10 font-display text-lg font-bold text-forge">
                1
              </div>
              <h3 className="font-display text-base font-bold uppercase text-foreground">
                Cree su cuenta
              </h3>
              <p className="mt-2 text-xs text-muted-foreground">
                Regístrese con el correo electrónico de su establecimiento y una contraseña segura.
              </p>
            </div>
          </div>

          <div className="border border-border bg-card p-6 flex flex-col justify-between">
            <div>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded bg-forge/10 font-display text-lg font-bold text-forge">
                2
              </div>
              <h3 className="font-display text-base font-bold uppercase text-foreground">
                Revisión e Identificación
              </h3>
              <p className="mt-2 text-xs text-muted-foreground">
                Complete la información de su ferretería. El equipo administrador validará la solicitud.
              </p>
            </div>
          </div>

          <div className="border border-border bg-card p-6 flex flex-col justify-between">
            <div>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded bg-forge/10 font-display text-lg font-bold text-forge">
                3
              </div>
              <h3 className="font-display text-base font-bold uppercase text-foreground">
                Publique y Venda
              </h3>
              <p className="mt-2 text-xs text-muted-foreground">
                Una vez aprobada su ferretería, cargue sus productos y comience a recibir pedidos.
              </p>
            </div>
          </div>
        </div>

        {/* Botón de Acción Principal */}
        <div className="mt-10">
          <Link
            to="/login"
            search={{ mode: "register" }}
            className="inline-flex items-center gap-2 bg-primary px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <span>Registrar mi ferretería</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}