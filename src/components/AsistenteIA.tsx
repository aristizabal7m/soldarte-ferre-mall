import { useState, useRef, useEffect } from "react";
import { enviarMensajeChat } from "@/lib/chat-server";
import { Sparkles, X, Send, Bot, AlertTriangle } from "lucide-react";

interface Mensaje {
  role: "user" | "model";
  text: string;
}

const SUGERENCIAS = [
  "¿Qué ferreterías hay disponibles?",
  "¿Cuánto cuesta un taladro percutor?",
  "¿Cómo hago un pedido?",
];

export function AsistenteIA() {
  const [abierto, setAbierto] = useState(false);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      role: "model",
      text: "¡Hola! Soy Soldi, tu asesor de SoldArte FerreMALL. Pregúntame por herramientas, precios o qué ferretería tiene lo que buscas.",
    },
  ]);

  const finChatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (abierto) {
      finChatRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensajes, cargando, abierto]);

  const enviarConsulta = async (textoPregunta?: string) => {
    const texto = (textoPregunta ?? input).trim();
    if (!texto || cargando) return;

    setErrorMsg(null);
    const nuevosMensajes: Mensaje[] = [...mensajes, { role: "user", text: texto }];
    setMensajes(nuevosMensajes);
    if (!textoPregunta) setInput("");
    setCargando(true);

    try {
      const res = await enviarMensajeChat({
        data: { messages: nuevosMensajes },
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.reply) {
        setMensajes((prev) => [...prev, { role: "model", text: res.reply! }]);
      }
    } catch (err) {
      console.error("Error consultando asistente IA:", err);
      setErrorMsg("No se pudo conectar con el asistente. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Ventana del Asistente */}
      {abierto && (
        <div className="mb-3 flex h-[440px] w-[340px] sm:w-[370px] flex-col border border-border bg-card shadow-2xl">
          {/* Encabezado */}
          <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-forge/15 text-forge">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                  Soldi · Asesor Ferretero IA
                </h3>
                <span className="block text-[10px] text-emerald-400">
                  ● Conectado al inventario real
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar asistente"
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Historial de mensajes */}
          <div className="flex-1 space-y-3 overflow-y-auto p-3 text-xs">
            {mensajes.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 leading-relaxed whitespace-pre-line ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-foreground"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {/* Sugerencias rápidas iniciales */}
            {mensajes.length === 1 && !cargando && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGERENCIAS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => enviarConsulta(sug)}
                    className="border border-forge/40 bg-forge/10 px-2.5 py-1 text-left text-[11px] text-foreground transition-colors hover:bg-forge/20"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}

            {/* Estado de espera */}
            {cargando && (
              <div className="flex justify-start">
                <div className="border border-border bg-background px-3 py-2 text-[11px] font-semibold text-forge animate-pulse">
                  Generando respuesta con inventario real...
                </div>
              </div>
            )}

            {/* Estado de error */}
            {errorMsg && (
              <div className="flex items-start gap-2 border border-destructive/50 bg-destructive/10 p-2.5 text-[11px] text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div ref={finChatRef} />
          </div>

          {/* Input de pregunta */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviarConsulta();
            }}
            className="flex border-t border-border bg-background p-2 gap-2"
          >
            <input
              type="text"
              maxLength={500}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ej. ¿Dónde hay taladros?"
              className="flex-1 border border-border bg-input px-3 py-1.5 text-xs text-foreground outline-none focus:border-forge"
            />
            <button
              type="submit"
              disabled={cargando || !input.trim()}
              aria-label="Enviar pregunta"
              className="bg-primary px-3 py-1.5 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Botón Flotante */}
      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        aria-label="Abrir asesor IA"
        className="ml-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105"
      >
        {abierto ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </button>
    </div>
  );
}