import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../Footer/Footer";
import AuthModal from "../Auth/AuthModal";
import Hero from "./Hero";
import PlatformSection from "./PlatformSection";
import SecuritySection from "./SecuritySection";
import CtaSection from "./CtaSection";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState(null);

  const openRegister = () => setAuthMode("register");
  const openLogin = () => setAuthMode("login");
  const closeAuth = () => setAuthMode(null);
  const switchAuthMode = () =>
    setAuthMode((prev) => (prev === "login" ? "register" : "login"));

  // Se llama tanto desde el login como desde el registro exitoso.
  // El backend devuelve el rol en la respuesta (junto al token),
  // así que aquí decidimos a dónde navegar según ese rol.
  const handleAuthSuccess = (result) => {
    closeAuth();
    navigate(result.role === "ADMIN" ? "/adminDashboard" : "/dashboard");
  };

  return (
    <div className="welcome-page">
      <main>
        <Hero onRegister={openRegister} onLogin={openLogin} />
        <PlatformSection />
        <SecuritySection />
        <CtaSection onRegister={openRegister} onLogin={openLogin} />
      </main>

      <Footer />

      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={closeAuth}
          onSwitchMode={switchAuthMode}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
};

export default Home;