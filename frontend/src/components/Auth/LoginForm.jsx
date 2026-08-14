const LoginForm = ({ data, error, isSubmitting, onChange, onSubmit }) => {
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
        <input
          type="password"
          name="password"
          placeholder="Ingresa tu contraseña"
          value={data.password}
          onChange={onChange}
        />
      </label>

      <div className="form-options">
        <label>
          <input type="checkbox" />
          Recordarme
        </label>
        <a href="#recuperar">¿Olvidaste tu contraseña?</a>
      </div>

      {error && <p className="auth-error">{error}</p>}

      <button className="auth-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Ingresando..." : "Ingresar a la plataforma"}
      </button>
    </form>
  );
};

export default LoginForm;