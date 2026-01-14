// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Solicitacao from './pages/Solicitacao';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Caminho Raiz -> Tela de Login */}
        <Route path="/" element={<Login />} />
        
        {/* Caminho /dashboard -> Menu Principal */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Caminho /solicitacao -> O Formulário (Antigo App) */}
        <Route path="/solicitacao" element={<Solicitacao />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;