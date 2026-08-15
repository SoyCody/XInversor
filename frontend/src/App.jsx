import './App.css';
import './components/Home/Home.css';
import Home from './components/Home/Home';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminDashboard from './components/AdminDasboard/AdminDashboard.jsx';
import ClientDashboard from './components/ClientDashboard/ClientDashboard.jsx';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/adminDashboard" element={<AdminDashboard />} />
          <Route path="/dashboard" element={<ClientDashboard />} />
          <Route path="/clientDashboard" element={<ClientDashboard />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;