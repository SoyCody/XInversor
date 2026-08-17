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
          <Route path="/admin/me" element={<AdminGetMe/>}/>
          <Route path="/change/password" element={<AdminChangePassword/>}/>
          <Route path="/admin/change/password" element={<ClientChangePassword/>}/>
          <Route path="/admin/clientes" element={<ObtenerClientes />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;