import { useState } from "react";
import eyeIcon from "../../assets/eye.png";
import closedEyeIcon from "../../assets/closedEye.png";

const LoginForm = ({ data, error, isSubmitting, onChange, onSubmit }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit}>
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

      <div className="form-options">
        <label>
          <input type="checkbox" />
          Recordarme
        </label>
        <a href="#recuperar">¿Olvidaste tu contraseña?</a>
      </div>

      {error && <p className="auth-error">{error}</p>}

      <button className="btn btn--primary btn--block" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Ingresando..." : "Ingresar a la plataforma"}
      </button>
    </form>
  );
};

export default LoginForm;
