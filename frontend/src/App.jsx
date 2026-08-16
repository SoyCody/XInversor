import './App.css';
import './components/Home/Home.css';
import Home from './components/Home/Home';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminDashboard from './components/Admin/AdminDasboard/AdminDashboard.jsx';
import ClientDashboard from './components/Client/ClientDashboard/ClientDashboard.jsx';
import ClientGetMe from './components/Client/ClientGetMe/ClientGetMe.jsx';
import AdminGetMe from './components/Admin/AdminGetMe/AdminGetMe.jsx';

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
        </Routes>
      </Router>
    </>
  );
}

export default App;