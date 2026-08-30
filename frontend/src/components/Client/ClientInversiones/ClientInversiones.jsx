import { useState } from "react";
import "../../../App.css";
import "../ClientGetMe/ClientGetMe.css";
import ClientSideBar from "../../SideBar/ClientSideBar.jsx";
import Header from "../../Header/Header.jsx";
import NuevaInversionForm from "./NuevaInversionForm.jsx";

const ClientInversiones = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  return (
    <div className="app">
      <ClientSideBar />

      <main className="main">
        <Header />

        <div className="content">
          <div className="page-heading">
            <div>
              <h1>Inversiones</h1>
              <p>Crea una nueva inversión</p>
            </div>

            {!isCreating && (
              <button
                className="edit-profile-btn"
                onClick={() => {
                  setSuccessMsg(null);
                  setIsCreating(true);
                }}
              >
                Nueva Inversión
              </button>
            )}
          </div>

          {successMsg && <p className="edit-avatar-success">{successMsg}</p>}

          {isCreating && (
            <NuevaInversionForm
              onCancel={() => setIsCreating(false)}
              onSuccess={() => {
                setIsCreating(false);
                setSuccessMsg("Inversión creada correctamente");
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default ClientInversiones;
