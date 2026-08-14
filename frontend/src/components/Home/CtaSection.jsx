const CtaSection = ({ onRegister, onLogin }) => {
  return (
    <section className="cta-section">
      <div>
        <span className="section-tag">COMIENZA AHORA</span>
        <h2>Accede a tu cuenta o crea una nueva.</h2>
        <p>
          Regístrate para seguir el desarrollo de la plataforma desde adentro.
        </p>
      </div>

      <div className="cta-actions">
        <button className="primary-button" onClick={onRegister}>
          Crear cuenta
        </button>
        <button className="cta-login" onClick={onLogin}>
          Iniciar sesión
        </button>
      </div>
    </section>
  );
};

export default CtaSection;