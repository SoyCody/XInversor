const RegisterForm = ({
  step,
  data,
  error,
  isSubmitting,
  onChange,
  onNextStep,
  onPrevStep,
  onSubmit,
}) => {
  return (
    <form onSubmit={step === 3 ? onSubmit : (e) => e.preventDefault()}>
      <div className="register-steps">
        <div className={step >= 1 ? "step active" : "step"}>
          <span>1</span>
          <small>Datos</small>
        </div>
        <div className={step >= 2 ? "step active" : "step"}>
          <span>2</span>
          <small>Seguridad</small>
        </div>
        <div className={step >= 3 ? "step active" : "step"}>
          <span>3</span>
          <small>Confirmar</small>
        </div>
      </div>

      {step === 1 && (
        <>
          <label>
            Nombres
            <input
              type="text"
              name="firstName"
              placeholder="Ingresa tus nombres"
              value={data.firstName}
              onChange={onChange}
            />
          </label>

          <label>
            Apellidos
            <input
              type="text"
              name="lastName"
              placeholder="Ingresa tus apellidos"
              value={data.lastName}
              onChange={onChange}
            />
          </label>

          <label>
            Correo electrónico
            <input
              type="email"
              name="email"
              placeholder="correo@ejemplo.com"
              value={data.email}
              onChange={onChange}
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" type="button" onClick={onNextStep}>
            Continuar
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <label>
            Contraseña
            <input
              type="password"
              name="password"
              placeholder="Ingresa tu contraseña"
              value={data.password}
              onChange={onChange}
            />
          </label>

          <label>
            Confirmar contraseña
            <input
              type="password"
              name="confirmPassword"
              placeholder="Repite tu contraseña"
              value={data.confirmPassword}
              onChange={onChange}
            />
          </label>

          <p className="password-hint">
            La contraseña debe tener al menos 8 caracteres.
          </p>

          {error && <p className="auth-error">{error}</p>}

          <div className="register-navigation">
            <button type="button" className="auth-secondary" onClick={onPrevStep}>
              Atrás
            </button>
            <button type="button" className="auth-submit" onClick={onNextStep}>
              Continuar
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="confirm-summary">
            <div>
              <span>Nombre</span>
              <strong>
                {data.firstName} {data.lastName}
              </strong>
            </div>
            <div>
              <span>Correo</span>
              <strong>{data.email}</strong>
            </div>
          </div>

          <p className="role-description">
            Al crear tu cuenta aceptas seguir el desarrollo de la plataforma
            como usuario cliente.
          </p>

          {error && <p className="auth-error">{error}</p>}

          <div className="register-navigation">
            <button
              type="button"
              className="auth-secondary"
              onClick={onPrevStep}
              disabled={isSubmitting}
            >
              Atrás
            </button>
            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando cuenta..." : "Crear mi cuenta"}
            </button>
          </div>
        </>
      )}
    </form>
  );
};

export default RegisterForm;