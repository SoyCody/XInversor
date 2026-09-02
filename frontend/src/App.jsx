import './App.css';
import './components/Home/Home.css';
import Home from './components/Home/Home';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminDashboard from './components/Admin/AdminDasboard/AdminDashboard.jsx';
import ClientDashboard from './components/Client/ClientDashboard/ClientDashboard.jsx';
import ClientGetMe from './components/Client/ClientGetMe/ClientGetMe.jsx';
import AdminGetMe from './components/Admin/AdminGetMe/AdminGetMe.jsx';
import AdminChangePassword from './components/Admin/AdminGetMe/AdminChangePassword.jsx';
import ClientChangePassword  from './components/Client/ClientGetMe/ClientChangePassword.jsx';
import ObtenerClientes from './components/Admin/ObtenerClientes/ObtenerClientes.jsx';
import ObtenerInversiones from './components/Admin/ObtenerInversiones/ObtenerInversiones.jsx';
import ClientInversiones from './components/Client/ClientInversiones/ClientInversiones.jsx';
import VerInversion from './components/Client/ClientInversiones/VerInversion.jsx';
import VerCliente from './components/Admin/VerCliente/VerCliente.jsx';
import MakeAdmin from './components/Admin/MakeAdmin/MakeAdmin.jsx';
import PromoteClient from './components/Admin/MakeAdmin/PromoteClient.jsx';
import Auditorias from './components/Admin/Auditorias/Auditorias.jsx';
import VerAuditoria from './components/Admin/Auditorias/VerAuditoria.jsx';

function App() {
  return (
    <>
      <Router>
        <Routes>
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
          <Route path="/admin/clientes" element={<ObtenerClientes />} />
          <Route path="/admin/clientes/:id" element={<VerCliente />} />
          <Route path="/admin/solicitudes" element={<MakeAdmin />} />
          <Route path="/admin/promote/:id" element={<PromoteClient />} />
          <Route path="/admin/auditorias" element={<Auditorias />} />
          <Route path="/admin/auditorias/:id" element={<VerAuditoria />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;