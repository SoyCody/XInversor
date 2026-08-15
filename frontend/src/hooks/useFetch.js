import { useEffect, useState } from "react";

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

  return state;
}