import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Solicitacao from './pages/Solicitacao';
import FolhaPonto from './pages/FolhaPonto'; // Importe as novas páginas
import Holerite from './pages/Holerite';
import PlanoSaude from './pages/PlanoSaude';
import GeradorNota from './pages/GeradorNota';
import StatusReembolso from './pages/StatusReembolso';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Novas Rotas */}
        <Route path="/solicitacao" element={<Solicitacao />} />
        <Route path="/ponto" element={<FolhaPonto />} />
        <Route path="/holerite" element={<Holerite />} />
        <Route path="/plano" element={<PlanoSaude />} />
        <Route path="/gerador-nota" element={<GeradorNota />} />
        <Route path="/status-reembolso" element={<StatusReembolso />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;