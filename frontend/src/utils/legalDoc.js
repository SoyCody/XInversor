// Convierte el .txt "plano" de un documento legal (Política de Privacidad,
// Términos y Condiciones) en bloques que un componente puede pintar de
// forma legible, en vez de mostrar el .txt crudo.
//
// Formato que se espera en el .txt (ver src/assets/docs/):
// - Una línea que empieza con "N. " (N = número) es un título de sección.
// - Líneas consecutivas con tabuladores son una tabla; la primera es el
//   encabezado.
// - Cualquier otra línea es un párrafo.
//
// Dentro de un párrafo, "Término: resto del texto" (el término sin punto
// y no muy largo) resalta el término en negrita — cubre las listas de
// definiciones ("Titular: la persona...") sin necesitar marcado extra en
// el .txt.
const SECTION_RE = /^(\d+)\.\s+(.*)$/;
const TERM_RE = /^([^:.]{1,50}):\s+(.+)$/;

export function parseLegalDoc(raw) {
  const lines = raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    const heading = line.match(SECTION_RE);
    if (heading) {
      blocks.push({ type: "heading", number: heading[1], text: heading[2] });
      i++;
      continue;
    }

    if (line.includes("\t")) {
      const rows = [];
      while (i < lines.length && lines[i].includes("\t")) {
        rows.push(lines[i].split("\t").map((cell) => cell.trim()));
        i++;
      }
      blocks.push({ type: "table", header: rows[0], rows: rows.slice(1) });
      continue;
    }

    const term = line.match(TERM_RE);
    blocks.push(
      term
        ? { type: "paragraph", term: term[1], text: term[2] }
        : { type: "paragraph", text: line },
    );
    i++;
  }

  return blocks;
}
