import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../../../services/authApi.js";
import AdminSideBar from "../../SideBar/AdminSideBar.jsx";
import Header from "../../Header/Header.jsx";
import "../../../App.css";

const AdminChangePassword = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.password) {
      setError("La contraseña es obligatoria");
      return;
    }

    if (formData.password.length < 8) {
      setError("La contraseña debe tener mínimo 8 caracteres");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword({ password: formData.password });
      navigate("/admin/me");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app">
      <AdminSideBar />

      <main className="main">
        <Header />

        <div className="content">
          <div className="page-heading">
            <div>
              <h1>Cambiar contraseña</h1>
              <p>Actualiza la contraseña de tu cuenta</p>
            </div>
          </div>

          <form className="section-form" onSubmit={handleSubmit}>
            {error && <p className="form-error">{error}</p>}

            <div className="field">
              <label htmlFor="admin-pwd-new">Nueva contraseña</label>
              <input
                id="admin-pwd-new"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
              />
            </div>

            <div className="field">
              <label htmlFor="admin-pwd-confirm">Confirmar nueva contraseña</label>
              <input
                id="admin-pwd-confirm"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repite la contraseña"
                autoComplete="new-password"
              />
            </div>

            <div className="form-actions section-actions">
              <button
                type="button"
                className="btn btn--muted"
                onClick={() => navigate("/admin/me")}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar contraseña"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AdminChangePassword;
