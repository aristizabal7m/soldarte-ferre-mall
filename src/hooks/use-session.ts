import { useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface UseSessionReturn {
  session: Session | null;
  user: User | null;
  esAdmin: boolean;
  cargando: boolean;
}

export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [esAdmin, setEsAdmin] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function verificarAdmin(userSession: Session | null) {
      if (!userSession?.user) {
        if (isMounted) {
          setEsAdmin(false);
          setCargando(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase.rpc("es_admin");
        if (isMounted) {
          if (error) {
            console.error("Error al verificar rol de admin:", error.message);
            setEsAdmin(false);
          } else {
            setEsAdmin(!!data);
          }
        }
      } catch (err) {
        console.error("Excepción al verificar rol de admin:", err);
        if (isMounted) setEsAdmin(false);
      } finally {
        if (isMounted) setCargando(false);
      }
    }

    // Cargar sesión inicial al montar en cliente
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      setSession(initialSession);
      if (initialSession) {
        verificarAdmin(initialSession);
      } else {
        setCargando(false);
      }
    });

    // Escuchar cambios de estado de sesión en tiempo real
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!isMounted) return;
      setSession(currentSession);
      if (currentSession) {
        await verificarAdmin(currentSession);
      } else {
        setEsAdmin(false);
        setCargando(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user: session?.user ?? null,
    esAdmin,
    cargando,
  };
}