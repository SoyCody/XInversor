const PlatformSection = () => {
  return (
    <section className="platform-section" id="plataforma">
      <div className="section-heading">
        <span>LA PLATAFORMA</span>
        <h2>Pensada para ser simple desde el primer día</h2>
        <p>Estamos construyendo, paso a paso, las bases de la plataforma.</p>
      </div>

      <div className="feature-grid">
        <article>
          <div className="feature-icon">01</div>
          <h3>Compra y venta</h3>
          <p>
            Gestiona tus operaciones de activos digitales desde una interfaz
            clara.
          </p>
        </article>

        <article>
          <div className="feature-icon">02</div>
          <h3>Seguimiento</h3>
          <p>Consulta el estado de tus operaciones en un solo lugar.</p>
        </article>

        <article>
          <div className="feature-icon">03</div>
          <h3>Cuenta verificada</h3>
          <p>
            Registro y verificación orientados a mantener cuentas confiables.
          </p>
        </article>
      </div>
    </section>
  );
};

export default PlatformSection;