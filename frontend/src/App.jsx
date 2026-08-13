import './App.css';
import './components/Home/Home.css';
import Home from './components/Home/Home';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminDashboard from './components/AdminDasboard/AdminDashboard';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/adminDasboard" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;