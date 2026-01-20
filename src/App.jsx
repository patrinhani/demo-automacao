import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Solicitacao from './pages/Solicitacao';
import FolhaPonto from './pages/FolhaPonto'; 
import Holerite from './pages/Holerite';
import Ferias from './pages/Ferias'; 
import PlanoSaude from './pages/PlanoSaude';
import GeradorNota from './pages/GeradorNota';
import StatusReembolso from './pages/StatusReembolso';
import GestaoViagens from './pages/GestaoViagens';
import Helpdesk from './pages/Helpdesk';
import ReservaSalas from './pages/ReservaSalas';
import Comunicacao from './pages/Comunicacao';
import Carreira from './pages/Carreira';
import Tarefas from './pages/Tarefas';
import Perfil from './pages/Perfil';
import PortalCliente from './pages/PortalCliente';
import ChatInterno from './pages/ChatInterno'; // <--- NOVO IMPORT
import './App.css';

function App() {
  return (                               
    <BrowserRouter>
      <Routes>
        {/* Rota Inicial */}
        <Route path="/" element={<Login />} />
        
        {/* Menu Principal */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Perfil */}
        <Route path="/perfil" element={<Perfil />} />
        
        {/* Módulos Financeiros */}
        <Route path="/solicitacao" element={<Solicitacao />} />
        <Route path="/status-reembolso" element={<StatusReembolso />} />
        <Route path="/gerar-nota" element={<GeradorNota />} />
        <Route path="/holerite" element={<Holerite />} />

        {/* Módulos RH */}
        <Route path="/folha-ponto" element={<FolhaPonto />} />
        <Route path="/plano-saude" element={<PlanoSaude />} />
        <Route path="/ferias" element={<Ferias />} />
        <Route path="/Carreira" element={<Carreira />} />

        {/* Módulos de Serviços */}
        <Route path="/viagens" element={<GestaoViagens />} />
        <Route path="/helpdesk" element={<Helpdesk />} />
        <Route path="/reservas" element={<ReservaSalas />} /> 

        {/* Módulos de Comunicação e Colaboração */}
        <Route path="/comunicacao" element={<Comunicacao />} />
        <Route path="/portal-cliente" element={<PortalCliente />} />
        <Route path="/chat" element={<ChatInterno />} /> {/* <--- NOVA ROTA */}

        {/* Módulos de Produtividade */}
        <Route path="/tarefas" element={<Tarefas />} />
        
        {/* Redirecionamento para evitar 404 em rotas desconhecidas */}
        <Route path="*" element={<Navigate to="/" />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;