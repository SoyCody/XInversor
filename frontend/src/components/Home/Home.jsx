import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const Home = () => {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState(null);

  const goClientDashboard = () => {
    navigate("/adminDasboard");
  };
  const heroRef = useRef(null);

  // ========================================
  // ESTADOS DEL REGISTRO
  // ========================================

  const [registerStep, setRegisterStep] = useState(1);

  const [registerData, setRegisterData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [registerError, setRegisterError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // ========================================
  // EFECTO DEL HERO
  // ========================================

  const handleHeroMouseMove = (e) => {
    const el = heroRef.current;

    if (!el) return;

    const rect = el.getBoundingClientRect();

    const x = ((e.clientX - rect.left) / rect.width) * 100;

    const y = ((e.clientY - rect.top) / rect.height) * 100;

    el.style.setProperty("--mx", `${x}%`);
    el.style.setProperty("--my", `${y}%`);
  };

  // ========================================
  // CAMBIAR DATOS DEL REGISTRO
  // ========================================

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;

    setRegisterData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setRegisterError("");
  };

  // ========================================
  // ABRIR REGISTRO
  // ========================================

  const openRegister = () => {
    setAuthMode("register");
    setRegisterStep(1);
    setRegisterError("");
  };

  // ========================================
  // ABRIR LOGIN
  // ========================================

  const openLogin = () => {
    setAuthMode("login");
    setRegisterError("");
  };

  // ========================================
  // CERRAR MODAL
  // ========================================

  const closeAuth = () => {
    setAuthMode(null);
    setRegisterStep(1);
    setRegisterError("");
  };

  // ========================================
  // PASO 1 DEL REGISTRO
  // ========================================

  const handleStepOne = () => {
    if (
      !registerData.firstName.trim() ||
      !registerData.lastName.trim() ||
      !registerData.email.trim()
    ) {
      setRegisterError("Completa todos los campos antes de continuar.");

      return;
    }

    setRegisterError("");
    setRegisterStep(2);
  };

  // ========================================
  // PASO 2 DEL REGISTRO
  // ========================================

  const handleStepTwo = () => {
    if (!registerData.password || !registerData.confirmPassword) {
      setRegisterError("Completa ambos campos de contraseña.");

      return;
    }

    if (registerData.password.length < 8) {
      setRegisterError("La contraseña debe tener al menos 8 caracteres.");

      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError("Las contraseñas no coinciden.");

      return;
    }

    setRegisterError("");
    setRegisterStep(3);
  };

  // ========================================
  // REGISTRO FINAL
  // ========================================

  const handleRegister = async (e) => {
    e.preventDefault();

    setRegisterError("");
    setIsRegistering(true);

    try {
      const response = await fetch(`${API_URL}/api/users/register`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          email: registerData.email,
          password: registerData.password,
          // El rol NO se envía desde aquí: el registro
          // público siempre crea cuentas CLIENT. Las cuentas
          // ADMIN se crean por otra vía, no desde este formulario.
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setRegisterError(data.error || "No se pudo crear la cuenta.");
        return;
      }
      console.log("Usuario creado correctamente:", data);
      // Limpiar formulario
      setRegisterData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setRegisterStep(1);
      setRegisterError("");

      // Después de registrarse se puede
      // pasar automáticamente al login.
      setAuthMode("login");
      goClientDashboard();
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      setRegisterError("No se pudo conectar con el servidor.");
    } finally {
      setIsRegistering(false);
    }
  };

  // ========================================
  // CAMBIAR ENTRE LOGIN Y REGISTRO
  // ========================================

  const switchAuthMode = () => {
    if (authMode === "login") {
      setAuthMode("register");
      setRegisterStep(1);
      setRegisterError("");
    } else {
      setAuthMode("login");
      setRegisterError("");
    }
  };

  return (
    <div className="welcome-page">
      {/* ========================================
          HEADER
      ======================================== */}

      <header className="welcome-header">
        <a className="welcome-brand" href="#inicio">
          <span className="brand-mark">
            <i />
            <i />
            <i />
          </span>
          XInversor
        </a>

        <nav className="welcome-nav">
          <a href="#inicio">Inicio</a>

          <a href="#plataforma">La plataforma</a>

          <a href="#seguridad">Seguridad</a>
        </nav>

        <div className="header-actions">
          <button className="header-login" onClick={openLogin}>
            Iniciar sesión
          </button>

          <button className="header-register" onClick={openRegister}>
            Crear cuenta
          </button>
        </div>
      </header>

      {/* ========================================
          MAIN
      ======================================== */}

      <main>
        {/* ========================================
            HERO
        ======================================== */}

        <section
          className="hero"
          id="inicio"
          ref={heroRef}
          onMouseMove={handleHeroMouseMove}
        >
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
              <button className="primary-button" onClick={openRegister}>
                Crear una cuenta <b>→</b>
              </button>

              <button className="secondary-button" onClick={openLogin}>
                Ya tengo una cuenta
              </button>
            </div>

            <div className="hero-note">
              Algunas funciones aún no están disponibles.
            </div>
          </div>
        </section>

        {/* ========================================
            PLATAFORMA
        ======================================== */}

        <section className="platform-section" id="plataforma">
          <div className="section-heading">
            <span>LA PLATAFORMA</span>

            <h2>Pensada para ser simple desde el primer día</h2>

            <p>
              Estamos construyendo, paso a paso, las bases de la plataforma.
            </p>
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
                Registro y verificación orientados a mantener cuentas
                confiables.
              </p>
            </article>
          </div>
        </section>

        {/* ========================================
            SEGURIDAD
        ======================================== */}

        <section className="security-section" id="seguridad">
          <div>
            <span className="section-tag">SEGURIDAD Y CONTROL</span>

            <h2>Una plataforma construida alrededor de la confianza.</h2>

            <p>
              El acceso está separado por perfiles de usuario, con
              verificaciones y controles específicos.
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

        {/* ========================================
            CTA
        ======================================== */}

        <section className="cta-section">
          <div>
            <span className="section-tag">COMIENZA AHORA</span>

            <h2>Accede a tu cuenta o crea una nueva.</h2>

            <p>
              Regístrate para seguir el desarrollo de la plataforma desde
              adentro.
            </p>
          </div>

          <div className="cta-actions">
            <button className="primary-button" onClick={openRegister}>
              Crear cuenta
            </button>

            <button className="cta-login" onClick={openLogin}>
              Iniciar sesión
            </button>
          </div>
        </section>
      </main>

      {/* ========================================
          FOOTER
      ======================================== */}

      <footer>
        <strong>XInversor</strong>

        <span>Plataforma en desarrollo</span>

        <span>© 2026 XInversor</span>
      </footer>

      {/* ========================================
          MODAL LOGIN / REGISTRO
      ======================================== */}

      {authMode && (
        <div className="auth-backdrop" onMouseDown={closeAuth}>
          <div className="auth-panel" onMouseDown={(e) => e.stopPropagation()}>
            {/* Cerrar */}

            <button className="close-auth" onClick={closeAuth}>
              ×
            </button>

            {/* Título */}

            <span className="section-tag">
              {authMode === "login" ? "BIENVENIDO DE NUEVO" : "NUEVA CUENTA"}
            </span>

            <h2>{authMode === "login" ? "Iniciar sesión" : "Crear cuenta"}</h2>

            {/* ========================================
                LOGIN
            ======================================== */}

            {authMode === "login" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();

                  // Aquí posteriormente se conectará
                  // la API de inicio de sesión.
                }}
              >
                <label>
                  Correo electrónico
                  <input type="email" placeholder="correo@ejemplo.com" />
                </label>

                <label>
                  Contraseña
                  <input type="password" placeholder="Ingresa tu contraseña" />
                </label>

                <div className="form-options">
                  <label>
                    <input type="checkbox" />
                    Recordarme
                  </label>

                  <a href="#recuperar">¿Olvidaste tu contraseña?</a>
                </div>

                <button className="auth-submit" type="submit">
                  Ingresar a la plataforma
                </button>
              </form>
            )}

            {/* ========================================
                REGISTRO
            ======================================== */}

            {authMode === "register" && (
              <form
                onSubmit={
                  registerStep === 3
                    ? handleRegister
                    : (e) => e.preventDefault()
                }
              >
                {/* ========================================
                    INDICADOR DE PASOS
                ======================================== */}

                <div className="register-steps">
                  <div className={registerStep >= 1 ? "step active" : "step"}>
                    <span>1</span>
                    <small>Datos</small>
                  </div>

                  <div className={registerStep >= 2 ? "step active" : "step"}>
                    <span>2</span>
                    <small>Seguridad</small>
                  </div>

                  <div className={registerStep >= 3 ? "step active" : "step"}>
                    <span>3</span>
                    <small>Confirmar</small>
                  </div>
                </div>

                {/* ========================================
                    PASO 1
                ======================================== */}

                {registerStep === 1 && (
                  <>
                    <label>
                      Nombres
                      <input
                        type="text"
                        name="firstName"
                        placeholder="Ingresa tus nombres"
                        value={registerData.firstName}
                        onChange={handleRegisterChange}
                      />
                    </label>

                    <label>
                      Apellidos
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Ingresa tus apellidos"
                        value={registerData.lastName}
                        onChange={handleRegisterChange}
                      />
                    </label>

                    <label>
                      Correo electrónico
                      <input
                        type="email"
                        name="email"
                        placeholder="correo@ejemplo.com"
                        value={registerData.email}
                        onChange={handleRegisterChange}
                      />
                    </label>

                    {registerError && (
                      <p className="auth-error">{registerError}</p>
                    )}
                    <button
                      className="auth-submit"
                      type="button"
                      onClick={handleStepOne}
                    >
                      Continuar
                    </button>
                  </>
                )}
                {/* ========================================
                    PASO 2
                ======================================== */}

                {registerStep === 2 && (
                  <>
                    <label>
                      Contraseña
                      <input
                        type="password"
                        name="password"
                        placeholder="Ingresa tu contraseña"
                        value={registerData.password}
                        onChange={handleRegisterChange}
                      />
                    </label>
                    <label>
                      Confirmar contraseña
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Repite tu contraseña"
                        value={registerData.confirmPassword}
                        onChange={handleRegisterChange}
                      />
                    </label>
                    <p className="password-hint">
                      La contraseña debe tener al menos 8 caracteres.
                    </p>
                    {registerError && (
                      <p className="auth-error">{registerError}</p>
                    )}
                    <div className="register-navigation">
                      <button
                        type="button"
                        className="auth-secondary"
                        onClick={() => {
                          setRegisterError("");
                          setRegisterStep(1);
                        }}
                      >
                        Atrás
                      </button>
                      <button
                        type="button"
                        className="auth-submit"
                        onClick={handleStepTwo}
                      >
                        Continuar
                      </button>
                    </div>
                  </>
                )}

                {/* ========================================
                    PASO 3 — CONFIRMACIÓN
                    (sin selector de rol: el registro
                    público siempre crea una cuenta CLIENT)
                ======================================== */}
                {registerStep === 3 && (
                  <>
                    <div className="confirm-summary">
                      <div>
                        <span>Nombre</span>
                        <strong>
                          {registerData.firstName} {registerData.lastName}
                        </strong>
                      </div>
                      <div>
                        <span>Correo</span>
                        <strong>{registerData.email}</strong>
                      </div>
                    </div>
                    <p className="role-description">
                      Al crear tu cuenta aceptas seguir el desarrollo de la
                      plataforma como usuario cliente.
                    </p>
                    {registerError && (
                      <p className="auth-error">{registerError}</p>
                    )}
                    <div className="register-navigation">
                      <button
                        type="button"
                        className="auth-secondary"
                        onClick={() => {
                          setRegisterError("");
                          setRegisterStep(2);
                        }}
                        disabled={isRegistering}
                      >
                        Atrás
                      </button>
                      <button
                        className="auth-submit"
                        type="submit"
                        disabled={isRegistering}
                      >
                        {isRegistering
                          ? "Creando cuenta..."
                          : "Crear mi cuenta"}
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}
            {/* ========================================
                CAMBIAR ENTRE LOGIN Y REGISTRO
            ======================================== */}

            <p className="switch-auth">
              {authMode === "login"
                ? "¿Todavía no tienes una cuenta?"
                : "¿Ya tienes una cuenta?"}

              <button type="button" onClick={switchAuthMode}>
                {authMode === "login" ? "Registrarme" : "Iniciar sesión"}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
export default Home;
