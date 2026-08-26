import { getMeAdmin } from "../../../services/adminApi.js";
import { deleteAccount, getAvatarUrl } from "../../../services/authApi.js";
import { useFetch } from "../../../hooks/useFetch";
import AdminSideBar from "../../SideBar/AdminSideBar.jsx";
import Header from "../../Header/Header.jsx";
import AccountDetails from "./AccountDetails";
import "./AdminGetMe.css";
import EditProfileForm from "../../Auth/EditProfileForm";
import ConfirmDeleteModal from "../../Auth/ConfirmDeleteModal";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const formatDate = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const AdminGetMe = () => {
  const { data: user, isLoading, error, refetch, setData } = useFetch(getMeAdmin);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const navigate = useNavigate();

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

          {!isLoading && user?.id && (
            <div className="profile-avatar-wrapper">
              <img
                className="profile-avatar-large"
                src={getAvatarUrl(user.id, user.avatarUpdatedAt)}
                alt="Foto de perfil"
              />
            </div>
          )}

          {error && <p className="dashboard-error">{error}</p>}
          {deleteError && <p className="dashboard-error">{deleteError}</p>}

          {isEditing ? (
            <EditProfileForm
              user={user}
              onCancel={() => setIsEditing(false)}
              onSuccess={(updatedUser) => {
                if (updatedUser) setData(updatedUser);
                setIsEditing(false);
              }}
              onAvatarUpdated={refetch}
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

              <div className="profile-actions">
                <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
                  Editar perfil
                </button>
                <button
                  className="edit-profile-btn"
                  onClick={() => navigate("/admin/change/password")}
                >
                  Cambiar contraseña
                </button>
                <button
                  className="edit-profile-btn"
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  Eliminar cuenta
                </button>
              </div>
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

export default AdminGetMe;