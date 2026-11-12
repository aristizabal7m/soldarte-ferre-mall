export interface ItemCarrito {
  producto_id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  stock: number;
}

export interface EstadoCarrito {
  ferreteria_id: string | null;
  ferreteria_nombre: string | null;
  items: ItemCarrito[];
}

const STORAGE_KEY = "soldarte_ferremall_carrito_v1";

const CARRITO_VACIO: EstadoCarrito = {
  ferreteria_id: null,
  ferreteria_nombre: null,
  items: [],
};

export function leerCarrito(): EstadoCarrito {
  if (typeof window === "undefined") return CARRITO_VACIO;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return CARRITO_VACIO;
    const parsed = JSON.parse(raw) as EstadoCarrito;
    if (!parsed || !Array.isArray(parsed.items)) return CARRITO_VACIO;
    return parsed;
  } catch {
    return CARRITO_VACIO;
  }
}

export function guardarCarrito(estado: EstadoCarrito): void {
  if (typeof window === "undefined") return;
  try {
    if (estado.items.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
    }
    window.dispatchEvent(new Event("carrito-actualizado"));
  } catch (err) {
    console.error("Error guardando carrito en localStorage:", err);
  }
}

export function vaciarCarrito(): void {
  guardarCarrito(CARRITO_VACIO);
}

export function calcularTotalCarrito(items: ItemCarrito[]): number {
  return items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
}