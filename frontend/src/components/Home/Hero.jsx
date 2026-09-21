import { useHeroTilt } from "../../hooks/useHeroTilt";
import logoGrande from "../../assets/logoGrande.png";

const Hero = ({ onRegister, onLogin }) => {
  const { heroRef, handleHeroMouseMove } = useHeroTilt();

  return (
    <section className="hero" id="inicio" ref={heroRef} onMouseMove={handleHeroMouseMove}>
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-copy">
        <div className="hero-brand">
          <img className="hero-logo" src={logoGrande} alt="FXInversors" />
          <h1 className="hero-brand-name">
            FX<span>INVERSORS</span>
          </h1>
        </div>

        <p>
          Convierte tus activos digitales en una estrategia de inversión
          estructurada y transparente.
        </p>

        <div className="hero-actions">
          <button className="primary-button" onClick={onRegister}>
            Crear cuenta <b>→</b>
          </button>
          <button className="secondary-button" onClick={onLogin}>
            Ya tengo una cuenta
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
