import { useState } from "react";
import eyeIcon from "../../assets/eye.png";
import closedEyeIcon from "../../assets/closedEye.png";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

          <button className="btn btn--primary btn--block" type="button" onClick={onNextStep}>
            Continuar
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <label>
            Contraseña
            <div className="auth-password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Ingresa tu contraseña"
                value={data.password}
                onChange={onChange}
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                <img src={showPassword ? eyeIcon : closedEyeIcon} alt="" />
              </button>
            </div>
          </label>

          <label>
            Confirmar contraseña
            <div className="auth-password-field">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Repite tu contraseña"
                value={data.confirmPassword}
                onChange={onChange}
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                <img src={showConfirmPassword ? eyeIcon : closedEyeIcon} alt="" />
              </button>
            </div>
          </label>

          <p className="password-hint">
            La contraseña debe tener al menos 8 caracteres.
          </p>

          {error && <p className="auth-error">{error}</p>}

          <div className="register-navigation">
            <button type="button" className="btn btn--muted" onClick={onPrevStep}>
              Atrás
            </button>
            <button type="button" className="btn btn--primary btn--block" onClick={onNextStep}>
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
              className="btn btn--muted"
              onClick={onPrevStep}
              disabled={isSubmitting}
            >
              Atrás
            </button>
            <button className="btn btn--primary btn--block" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando cuenta..." : "Crear mi cuenta"}
            </button>
          </div>
        </>
      )}
    </form>
  );
};

export default RegisterForm;
