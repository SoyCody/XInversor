import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMeClient } from "../../../services/clientApi";
import { deleteAccount } from "../../../services/authApi.js";
import { useFetch } from "../../../hooks/useFetch";
import "../../../App.css";
import "../../Config/config.css";
import "./ClientGetMe.css";
import ClientSideBar from "../../SideBar/ClientSideBar.jsx";
import Header from "../../Header/Header.jsx";
import AccountDetails from "../../Config/AccountDetails.jsx";
import ProfilePhoto from "../../Config/ProfilePhoto.jsx";
import WalletCard from "../../Config/WalletCard.jsx";
import EditProfileModal from "../../Config/EditProfileModal.jsx";
import ChangePasswordModal from "../../Config/ChangePasswordModal.jsx";
import DeleteAccountModal from "../../Config/DeleteAccountModal.jsx";

const formatDate = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const ClientGetMe = () => {
  const { data: user, isLoading, error, refetch, setData } = useFetch(getMeClient);
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const roleLabel = isLoading
    ? "—"
    : user?.role === "ADMIN"
      ? "Administrador"
      : "Cliente";

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      navigate("/", { replace: true });
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
         <div className="cfg-page">
          <div className="page-heading">
            <div>
              <h1>Configuración</h1>
            </div>
          </div>

          {error && <p className="dashboard-error">{error}</p>}
          {deleteError && <p className="dashboard-error">{deleteError}</p>}

          {isLoading ? (
            <p>Cargando tu cuenta...</p>
          ) : !user ? (
            <p>No se encontró tu información.</p>
          ) : (
            <div className="cfg">
              <section className="cfg-section">
                <h2>Mi perfil</h2>
                <p className="cfg-subtitle">Información de tu cuenta</p>

                <div className="cfg-perfil">
                  <ProfilePhoto
                    user={user}
                    roleLabel={roleLabel}
                    onUpdated={refetch}
                  />

                  <div className="cfg-datos">
                    <AccountDetails user={user} isLoading={isLoading} />
                    <p className="cfg-since">
                      Miembro desde {formatDate(user?.createdAt)}
                    </p>
                    <div className="cfg-datos-actions">
                      <button
                        className="cfg-btn cfg-btn--primary"
                        onClick={() => setEditOpen(true)}
                      >
                        Editar perfil
                      </button>
                      <button
                        className="cfg-btn cfg-btn--primary"
                        onClick={() => setPasswordOpen(true)}
                      >
                        Cambiar contraseña
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <WalletCard
                initialWallet={user?.client?.wallet}
                onSaved={(wallet) =>
                  setData({
                    ...user,
                    client: { ...(user?.client ?? {}), wallet },
                  })
                }
              />

              <div className="cfg-danger">
                <button
                  className="cfg-btn cfg-btn--muted"
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  Eliminar Cuenta
                </button>
              </div>
            </div>
          )}
         </div>

          {editOpen && user && (
            <EditProfileModal
              user={user}
              onClose={() => setEditOpen(false)}
              onSuccess={(updatedUser) => {
                if (updatedUser) setData(updatedUser);
                setEditOpen(false);
              }}
            />
          )}

          {passwordOpen && (
            <ChangePasswordModal onClose={() => setPasswordOpen(false)} />
          )}

          {isDeleteModalOpen && (
            <DeleteAccountModal
              isDeleting={isDeleting}
              error={deleteError}
              onClose={() => setIsDeleteModalOpen(false)}
              onConfirm={handleDeleteAccount}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default ClientGetMe;
