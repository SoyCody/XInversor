import { parseLegalDoc } from "../../utils/legalDoc.js";
import "./LegalDocument.css";

// Pinta un documento legal (Política de Privacidad, Términos y
// Condiciones) a partir de su .txt fuente (ver src/assets/docs/),
// parseado por parseLegalDoc: títulos numerados como <h2>, tablas como
// <table> y el resto como párrafos.
const LegalDocument = ({ raw }) => {
  const blocks = parseLegalDoc(raw);

  return (
    <div className="legal-doc">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h2 key={index} className="legal-doc-heading">
              <span className="legal-doc-heading-number">{block.number}.</span>
              {block.text}
            </h2>
          );
        }

        if (block.type === "table") {
          return (
            <div className="legal-doc-table-wrap" key={index}>
              <table className="legal-doc-table">
                <thead>
                  <tr>
                    {block.header.map((cell, cellIndex) => (
                      <th key={cellIndex}>{cell}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return (
          <p className="legal-doc-paragraph" key={index}>
            {block.term && <strong>{block.term}: </strong>}
            {block.text}
          </p>
        );
      })}
    </div>
  );
};

export default LegalDocument;
