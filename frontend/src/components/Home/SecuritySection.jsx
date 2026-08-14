const SecuritySection = () => {
  return (
    <section className="security-section" id="seguridad">
      <div>
        <span className="section-tag">SEGURIDAD Y CONTROL</span>
        <h2>Una plataforma construida alrededor de la confianza.</h2>
        <p>
          El acceso está separado por perfiles de usuario, con verificaciones
          y controles específicos.
        </p>

        <div className="security-points">
          <div>
            <i>✓</i>
            <p>
              <strong>Autenticación de usuarios</strong>
              <span>Acceso mediante credenciales personales.</span>
            </p>
          </div>

          <div>
            <i>✓</i>
            <p>
              <strong>Verificación de identidad</strong>
              <span>Proceso de validación para las cuentas.</span>
            </p>
          </div>

          <div>
            <i>✓</i>
            <p>
              <strong>Auditoría administrativa</strong>
              <span>Seguimiento de las acciones realizadas.</span>
            </p>
          </div>
        </div>
      </div>

      <div className="security-panel">
        <div className="security-title">
          <div>
            <strong>Protección de cuenta</strong>
            <small>Controles activos</small>
          </div>
        </div>

        <div>
          <span>Autenticación</span>
          <b>
            <i />
            Activa
          </b>
        </div>

        <div>
          <span>Verificación</span>
          <b>
            <i />
            Disponible
          </b>
        </div>

        <div>
          <span>Registro de actividad</span>
          <b>
            <i />
            Activo
          </b>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;