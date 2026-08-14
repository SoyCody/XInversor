import { useHeroTilt } from "../../hooks/useHeroTilt";

const Hero = ({ onRegister, onLogin }) => {
  const { heroRef, handleHeroMouseMove } = useHeroTilt();

  return (
    <section className="hero" id="inicio" ref={heroRef} onMouseMove={handleHeroMouseMove}>
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-copy">
        <div className="eyebrow">
          <span />
          En construcción — acceso anticipado
        </div>

        <h1>
          Estamos construyendo <strong>algo nuevo.</strong>
        </h1>

        <p>
          XInversor es una plataforma para gestionar operaciones de activos
          digitales. Todavía está en desarrollo: crea tu cuenta para seguir
          de cerca los próximos avances.
        </p>

        <div className="hero-actions">
          <button className="primary-button" onClick={onRegister}>
            Crear una cuenta <b>→</b>
          </button>
          <button className="secondary-button" onClick={onLogin}>
            Ya tengo una cuenta
          </button>
        </div>

        <div className="hero-note">Algunas funciones aún no están disponibles.</div>
      </div>
    </section>
  );
};

export default Hero;