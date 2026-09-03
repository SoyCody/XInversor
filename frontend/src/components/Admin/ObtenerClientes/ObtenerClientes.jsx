import { useMemo, useState } from "react";
import { obtenerPersonas } from "../../../services/adminApi.js";
import { useFetch } from "../../../hooks/useFetch";
import AdminSideBar from "../../SideBar/AdminSideBar.jsx";
import Header from "../../Header/Header.jsx";
import Pagination from "../../Pagination/Pagination.jsx";
import { useNavigate } from "react-router-dom";
import "../../../App.css";
import "./ObtenerClientes.css";

const FILTROS = [
  { value: "CLIENT", label: "Clientes", titulo: "Clientes", descripcion: "Listado de todos los clientes registrados" },
  { value: "ALL", label: "Todos los usuarios", titulo: "Usuarios", descripcion: "Listado de todos los usuarios registrados" },
  { value: "ADMIN", label: "Administradores", titulo: "Administradores", descripcion: "Listado de los administradores" },
  { value: "BLOCKED", label: "Clientes bloqueados", titulo: "Clientes bloqueados", descripcion: "Clientes que no pueden operar" },
  { value: "DELETED", label: "Cuentas eliminadas", titulo: "Cuentas eliminadas", descripcion: "Usuarios que eliminaron su cuenta" },
];

const formatDate = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const ObtenerClientes = () => {
  const [tipo, setTipo] = useState("CLIENT");
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  // Al cambiar el filtro o la página el hook vuelve a pedir la lista (de 20 en 20).
  const { data, isLoading, error } = useFetch(
    () => obtenerPersonas(tipo, page),
    [tipo, page]
  );

  const cambiarTipo = (value) => {
    setTipo(value);
    setPage(1);
  };

  const filtroActual = FILTROS.find((f) => f.value === tipo) ?? FILTROS[0];
  const usuariosFiltrados = useMemo(() => {
    const usuarios = data?.users ?? [];
    const q = busqueda.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter((u) =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)
    );
  }, [data, busqueda]);

  return (
    <div className="app">
      <AdminSideBar />

      <main className="main">
        <Header />

        <div className="content">
          <div className="page-heading">
            <div>
              <h1>{filtroActual.titulo}</h1>
              <p>{filtroActual.descripcion}</p>
            </div>

            <div className="clientes-controls">
              <label className="clientes-filtro">
                <span>Ver:</span>
                <select value={tipo} onChange={(e) => cambiarTipo(e.target.value)}>
                  {FILTROS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="search">
                <span className="search-icon" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o apellido..."
                  aria-label="Buscar por nombre o apellido"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && <p className="dashboard-error">{error}</p>}

          {isLoading ? (
            <p>Cargando usuarios...</p>
          ) : (
            <>
              <div className="clientes-summary">
                <span className="clientes-total">
                  Total: <strong>{data?.total ?? usuariosFiltrados.length}</strong>
                </span>
              </div>

              {usuariosFiltrados.length === 0 ? (
                <p>
                  {busqueda.trim()
                    ? "Ningún usuario coincide con la búsqueda."
                    : "No hay usuarios para este filtro."}
                </p>
              ) : (
                <div className="clientes-table-wrapper">
                  <table className="clientes-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>Registrado</th>
                        <th>Bloqueado</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuariosFiltrados.map((usuario) => (
                        <tr key={usuario.id}>
                          <td>{usuario.firstName}</td>
                          <td>{usuario.lastName}</td>
                          <td>{formatDate(usuario.createdAt)}</td>
                          <td>{usuario.blocked ? "Sí" : "—"}</td>
                          <td>
                            <button
                              className="edit-profile-btn"
                              onClick={() => navigate(`/admin/clientes/${usuario.id}`)}
                            >
                              Ver detalles
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {!isLoading && (
            <Pagination
              page={data?.page ?? 1}
              totalPages={data?.totalPages ?? 1}
              onChange={setPage}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default ObtenerClientes;
