import Header from '../Header/Header';
import SideBar from '../SideBar/SideBar';

const AdminDashboard = () => {
  return (
    <div className="app">
      <SideBar />

      <main className="main">
        <Header />

        <div className="content">
          <div className="page-heading">
            <div>
              <h1>Inicio</h1>
              <p>Resumen general</p>
            </div>

            <button className="date-picker" type="button">
              <span className="calendar-icon" aria-hidden="true" />
              9 de Agosto, 2026
              <span className="chevron" aria-hidden="true" />
            </button>
          </div>

          <section className="metrics">
            <article className="metric-card">
              <div className="metric-top">
                <div>
                  <span className="metric-label">USUARIOS TOTALES</span>
                  <strong>2</strong>
                  <small className="positive">+0.0% <span>vs ayer</span></small>
                </div>
                <span className="metric-symbol blue">↗</span>
              </div>
              <div className="sparkline blue-line">
                <span></span><span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span><span></span>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-top">
                <div>
                  <span className="metric-label">USUARIOS ACTIVOS</span>
                  <strong>842</strong>
                  <small className="positive">+0.0% <span>vs ayer</span></small>
                </div>
                <span className="metric-symbol green">↗</span>
              </div>
              <div className="sparkline blue-line">
                <span></span><span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span><span></span>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-top">
                <div>
                  <span className="metric-label">INGRESOS</span>
                  <strong>$24.4K</strong>
                  <small className="positive">+3.2% <span>vs ayer</span></small>
                </div>
                <span className="metric-symbol purple">↗</span>
              </div>
              <div className="sparkline green-line">
                <span></span><span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span><span></span>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-top">
                <div>
                  <span className="metric-label">PENDING</span>
                  <strong>18</strong>
                  <small className="negative">-1.1% <span>vs ayer</span></small>
                </div>
                <span className="metric-symbol blue">↘</span>
              </div>
              <div className="sparkline purple-line">
                <span></span><span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span><span></span>
              </div>
            </article>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;