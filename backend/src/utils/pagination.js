// Paginación uniforme para los listados largos (usuarios, auditorías,
// inversiones): se sirven de PAGE_SIZE en PAGE_SIZE.
const PAGE_SIZE = 15;

// Lee ?page=... de la query y lo normaliza a un entero >= 1.
const parsePage = (rawPage) => {
  const page = Number.parseInt(rawPage, 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

// Traduce (page, pageSize) a los { skip, take } que espera Prisma.
//
// INCONSISTENCIA conocida: si el cliente pide ?page=999 y solo hay 2
// páginas, la consulta devuelve [] (skip enorme) pero buildMeta recorta
// `page` a 2 en la respuesta. El frontend ve page=2 sin filas. Para
// arreglarlo hay que recortar la página contra el total ANTES de
// consultar (contar primero, luego findMany con el skip ya acotado).
const toPrismaRange = (page, pageSize = PAGE_SIZE) => ({
  skip: (page - 1) * pageSize,
  take: pageSize,
});

// Metadatos que acompañan a cada respuesta paginada. `page` se recorta
// al último rango válido para que el frontend nunca marque una página
// que ya no existe.
const buildMeta = (total, page, pageSize = PAGE_SIZE) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    total,
    page: Math.min(page, totalPages),
    totalPages,
    pageSize,
  };
};

// Pagina en memoria una lista ya filtrada (se usa cuando el filtro no se
// puede expresar directamente en la consulta a la base de datos).
const paginateArray = (items, page, pageSize = PAGE_SIZE) => {
  const { skip, take } = toPrismaRange(page, pageSize);
  return items.slice(skip, skip + take);
};

export { PAGE_SIZE, parsePage, toPrismaRange, buildMeta, paginateArray };
