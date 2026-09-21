import iconosCompleto from "../../assets/iconosCompleto.png";

const PlatformSection = () => {
  return (
    <section className="platform-section" id="plataforma">
      <div className="platform-icons">
        <img
          className="platform-icons-img"
          src={iconosCompleto}
          alt="Bitcoin, Ethereum, Tether, USD, Binance Coin"
        />
      </div>

      <div className="section-heading">
        <span>LA PLATAFORMA</span>
        <h2>Pensada para ser simple desde el primer día</h2>
        <p>Estamos construyendo, paso a paso, las bases de la plataforma.</p>
      </div>

      <div className="feature-grid">
        <article>
          <h3>Sistema de paquetes</h3>
          <p>Cada paquete representa un monto inicial.</p>
        </article>

        <article>
          <h3>Seguimiento</h3>
          <p>Consulta el estado de tus inversiones en un solo lugar.</p>
        </article>

        <article>
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