import { getMeAdmin } from "../../../services/adminApi.js";
import { useFetch } from "../../../hooks/useFetch";
import AdminSideBar from "../../SideBar/AdminSideBar.jsx";
import Header from "../../Header/Header.jsx";
import AccountDetails from "./AccountDetails";
import "./AdminGetMe.css";
import EditProfileForm from "../../Auth/EditProfileForm";
import { useState } from "react";

const formatDate = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const AdminGetMe = () => {
  const { data: user, isLoading, error } = useFetch(getMeAdmin);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="app">
      <AdminSideBar />

      <main className="main">
        <Header />

        <div className="content">
          <div className="page-heading">
            <div>
              <h1>Mi perfil</h1>
              <p>Información de tu cuenta</p>
            </div>
          </div>

          {error && <p className="dashboard-error">{error}</p>}

          {isEditing ? (
            <EditProfileForm
              user={user}
              onCancel={() => setIsEditing(false)}
              onSuccess={() => setIsEditing(false)} // idealmente aquí refrescas el useFetch
            />
          ) : (
            <>
              <section className="profile-card">
                <AccountDetails user={user} isLoading={isLoading} />
                <div className="profile-meta">
                  <span
                    className={`role-badge role-badge--${(
                      user?.role ?? "client"
                    ).toLowerCase()}`}
                  >
                    {isLoading
                      ? "—"
                      : user?.role === "ADMIN"
                        ? "Administrador"
                        : "Cliente"}
                  </span>
                  <span className="profile-since">
                    Miembro desde {isLoading ? "—" : formatDate(user?.createdAt)}
                  </span>
                </div>
              </section>
              <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>Editar perfil</button>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminGetMe;