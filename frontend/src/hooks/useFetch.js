import { useCallback, useEffect, useState } from "react";

const initialState = { data: null, isLoading: true, error: "" };

// Reutilizable para cualquier pantalla que solo necesita
// "cargar datos al montar y mostrarlos": dashboards, listas, etc.
//
// Nota: isLoading/error solo se actualizan DENTRO del .then/.catch,
// nunca de forma síncrona al entrar al efecto (eso es justo lo que
// react-hooks/set-state-in-effect prohíbe). Como consecuencia, si
// `deps` cambia y se dispara un refetch, la UI seguirá mostrando los
// datos/estado anteriores hasta que la nueva petición resuelva —no
// vuelve a mostrar "cargando" a mitad de camino. Para el caso actual
// (deps=[], se pide una sola vez al montar) esto no afecta en nada.
export function useFetch(fetchFn, deps = []) {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    let isMounted = true;

    fetchFn()
      .then((result) => {
        if (isMounted) setState({ data: result, isLoading: false, error: "" });
      })
      .catch((err) => {
        if (isMounted) setState({ data: null, isLoading: false, error: err.message });
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Vuelve a pedir los datos al backend (p. ej. tras subir una foto nueva,
  // donde solo cambió "avatarUpdatedAt" y no conviene mandarlo a mano).
  const refetch = useCallback(() => {
    fetchFn()
      .then((result) => setState({ data: result, isLoading: false, error: "" }))
      .catch((err) => setState({ data: null, isLoading: false, error: err.message }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actualiza "data" directo con lo que ya devolvió un PUT/POST, sin
  // pedirlo de nuevo (p. ej. tras editar nombre/apellido/email).
  const setData = useCallback((data) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  return { ...state, refetch, setData };
}