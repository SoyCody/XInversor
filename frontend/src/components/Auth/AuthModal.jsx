import { useRegisterForm } from "../../hooks/useRegisterForm";
import { useLogin } from "../../hooks/useLogin";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

const AuthModal = ({ mode, onClose, onSwitchMode, onAuthSuccess }) => {
  const register = useRegisterForm({ onSuccess: onAuthSuccess });
  const login = useLogin({ onSuccess: onAuthSuccess });

  return (
    <div className="auth-backdrop" onMouseDown={onClose}>
      <div className="auth-panel" onMouseDown={(e) => e.stopPropagation()}>
        <button className="close-auth" onClick={onClose}>
          ×
        </button>

        <span className="section-tag">
          {mode === "login" ? "BIENVENIDO DE NUEVO" : "NUEVA CUENTA"}
        </span>
        <h2>{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</h2>

        {mode === "login" && (
          <LoginForm
            data={login.data}
            error={login.error}
            isSubmitting={login.isSubmitting}
            onChange={login.handleChange}
            onSubmit={login.submit}
          />
        )}

        {mode === "register" && (
          <RegisterForm
            step={register.step}
            data={register.data}
            error={register.error}
            isSubmitting={register.isSubmitting}
            onChange={register.handleChange}
            onNextStep={register.step === 1 ? register.goToStepTwo : register.goToStepThree}
            onPrevStep={register.goBack}
            onSubmit={register.submit}
          />
        )}

        <p className="switch-auth">
          {mode === "login" ? "¿Todavía no tienes una cuenta?" : "¿Ya tienes una cuenta?"}
          <button type="button" onClick={onSwitchMode}>
            {mode === "login" ? "Registrarme" : "Iniciar sesión"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;