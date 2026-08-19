import { getMeClient } from "../../../services/clientApi";
import "../../../App.css";
import { useFetch } from "../../../hooks/useFetch";
import ClientSideBar from "../../SideBar/ClientSideBar.jsx";
import Header from "../../Header/Header.jsx";
import AccountDetails from "./AccountDetails";
import "./ClientGetMe.css";
import EditProfileForm from "../../Auth/EditProfileForm";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDeleteModal from "../../Auth/ConfirmDeleteModal";
import { deleteAccount } from "../../../services/authApi.js";

const formatDate = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const ClientGetMe = () => {
  const { data: user, isLoading, error } = useFetch(getMeClient);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      navigate("/", { replace: true }); // ajusta si tu Home vive en otra ruta
    } catch (err) {
      setDeleteError(err.message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="app">
      <ClientSideBar />

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
          {deleteError && <p className="dashboard-error">{deleteError}</p>}

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
              <button
                className="edit-profile-btn"
                onClick={() => navigate("/change/password", { state: { role: "CLIENT" } })}
              >
                Cambiar contraseña
              </button>
              <button
                className="edit-profile-btn edit-profile-btn--danger"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                Eliminar cuenta
              </button>
            </>
          )}
          {isDeleteModalOpen && (
            <ConfirmDeleteModal
              isDeleting={isDeleting}
              onCancel={() => setIsDeleteModalOpen(false)}
              onConfirm={handleDeleteAccount}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default ClientGetMe;