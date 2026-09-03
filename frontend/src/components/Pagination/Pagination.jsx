import "./Pagination.css";

// Construye la lista de páginas a mostrar con "…" cuando hay muchas:
// siempre la primera, la última y una ventana alrededor de la actual.
const buildPages = (page, totalPages) => {
  const delta = 1;
  const pages = [];

  for (
    let i = Math.max(1, page - delta);
    i <= Math.min(totalPages, page + delta);
    i += 1
  ) {
    pages.push(i);
  }

  if (pages[0] > 1) {
    if (pages[0] > 2) pages.unshift("…");
    pages.unshift(1);
  }

  if (pages[pages.length - 1] < totalPages) {
    if (pages[pages.length - 1] < totalPages - 1) pages.push("…");
    pages.push(totalPages);
  }

  return pages;
};

// Paginador centrado. Reutiliza el diseño del selector de archivo:
// contenedor rectangular con esquinas redondeadas, borde fino y sutil,
// e ítems separados por líneas divisorias finas de gris claro.
// La página activa se pinta con el azul del sidebar.
const Pagination = ({ page = 1, totalPages = 1, onChange }) => {
  if (totalPages <= 1) return null;

  const current = Math.min(Math.max(1, page), totalPages);
  const go = (p) => {
    if (p >= 1 && p <= totalPages && p !== current) onChange?.(p);
  };

  return (
    <nav className="pagination" aria-label="Paginación">
      <div className="pagination__box">
        <button
          type="button"
          className="pagination__item"
          onClick={() => go(current - 1)}
          disabled={current === 1}
          aria-label="Página anterior"
        >
          ‹
        </button>

        {buildPages(current, totalPages).map((p, i) =>
          p === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className="pagination__item pagination__ellipsis"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              type="button"
              key={p}
              className={
                p === current
                  ? "pagination__item pagination__item--active"
                  : "pagination__item"
              }
              aria-current={p === current ? "page" : undefined}
              onClick={() => go(p)}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          className="pagination__item"
          onClick={() => go(current + 1)}
          disabled={current === totalPages}
          aria-label="Página siguiente"
        >
          ›
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
