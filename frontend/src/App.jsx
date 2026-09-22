import { createRef, useMemo } from 'react';
import './App.css';
import './PageTransition.css';
import './components/Home/Home.css';
import Home from './components/Home/Home';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import AdminDashboard from './components/Admin/AdminDasboard/AdminDashboard.jsx';
import ClientDashboard from './components/Client/ClientDashboard/ClientDashboard.jsx';
import ClientGetMe from './components/Client/ClientGetMe/ClientGetMe.jsx';
import AdminGetMe from './components/Admin/AdminGetMe/AdminGetMe.jsx';
import AdminChangePassword from './components/Admin/AdminGetMe/AdminChangePassword.jsx';
import ClientChangePassword  from './components/Client/ClientGetMe/ClientChangePassword.jsx';
import ObtenerClientes from './components/Admin/ObtenerClientes/ObtenerClientes.jsx';
import ObtenerInversiones from './components/Admin/ObtenerInversiones/ObtenerInversiones.jsx';
import VerInversionAdmin from './components/Admin/ObtenerInversiones/VerInversionAdmin.jsx';
import ClientInversiones from './components/Client/ClientInversiones/ClientInversiones.jsx';
import VerInversion from './components/Client/ClientInversiones/VerInversion.jsx';
import VerCliente from './components/Admin/VerCliente/VerCliente.jsx';
import Auditorias from './components/Admin/Auditorias/Auditorias.jsx';
import VerAuditoria from './components/Admin/Auditorias/VerAuditoria.jsx';
import ClientNotificaciones from './components/Client/Notificaciones/Notificaciones.jsx';
import AdminNotificaciones from './components/Admin/Notificaciones/Notificaciones.jsx';
import NotFound from './components/NotFound/NotFound.jsx';

// Transición de página (fade) al navegar entre rutas. React 19 quitó
// findDOMNode, del que react-transition-group dependía por defecto para
// ubicar el nodo del DOM a animar; `nodeRef` es el reemplazo oficial,
// pero cada instancia de CSSTransition necesita SU PROPIA ref (no una
// compartida entre la página que sale y la que entra) o la que monta
// último "roba" el nodo de la que está saliendo. `useMemo` atado a
// `location.pathname` logra justo eso: una ref nueva por navegación,
// mientras los renders intermedios (que no cambian de ruta) siguen
// devolviendo la misma.
const AnimatedRoutes = () => {
  const location = useLocation();
  // A propósito: se quiere una ref nueva CADA VEZ que cambia la ruta, no
  // memoizada por otra razón.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const nodeRef = useMemo(() => createRef(), [location.pathname]);

  return (
    <div className="page-transition-container">
      <TransitionGroup>
        <CSSTransition
          key={location.pathname}
          nodeRef={nodeRef}
          timeout={250}
          classNames="page-fade"
        >
          <div ref={nodeRef} className="page-fade-wrapper">
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/adminDashboard" element={<AdminDashboard />} />
              <Route path="/dashboard" element={<ClientDashboard />} />
              <Route path="/clientDashboard" element={<ClientDashboard />} />
              <Route path="/client/me" element={<ClientGetMe/>}/>
              <Route path="/client/inversiones" element={<ClientInversiones />} />
              <Route path="/client/inversiones/:inversionId" element={<VerInversion />} />
              <Route path="/admin/me" element={<AdminGetMe/>}/>
              <Route path="/admin/change/password" element={<AdminChangePassword/>}/>
              <Route path="/client/change/password" element={<ClientChangePassword/>}/>
              <Route path="/admin/inversiones" element={<ObtenerInversiones />} />
              <Route path="/admin/inversiones/:inversionId" element={<VerInversionAdmin />} />
              <Route path="/admin/clientes" element={<ObtenerClientes />} />
              <Route path="/admin/clientes/:id" element={<VerCliente />} />
              <Route path="/admin/auditorias" element={<Auditorias />} />
              <Route path="/admin/auditorias/:id" element={<VerAuditoria />} />
              <Route path="/client/notificaciones" element={<ClientNotificaciones />} />
              <Route path="/admin/notificaciones" element={<AdminNotificaciones />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </CSSTransition>
      </TransitionGroup>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}

export default App;
