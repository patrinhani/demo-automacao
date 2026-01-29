import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// --- CONTEXTO GLOBAL ---
import { UserProvider } from './contexts/UserContext';

// --- COMPONENTE DE NOTIFICAÇÃO ---
import NotificationPopup from './components/NotificationPopup';

// --- PÁGINAS ---
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Perfil from './pages/Perfil';
import TrocarSenha from './pages/TrocarSenha';

// --- ADMIN / GESTÃO ---
import CadastroUsuario from './pages/CadastroUsuario';
import GestaoReembolsos from './pages/GestaoReembolsos';
import GestaoAprovacoes from './pages/GestaoAprovaçoes';

// --- FINANCEIRO ---
import Solicitacao from './pages/Solicitacao';
import StatusReembolso from './pages/StatusReembolso';
import GeradorNota from './pages/GeradorNota';
import Holerite from './pages/Holerite';
import Conciliacao from './pages/Conciliacao/Conciliacao';

// --- RH ---
import FolhaPonto from './pages/FolhaPonto'; 
import PlanoSaude from './pages/PlanoSaude';
import Ferias from './pages/Ferias'; 
import Carreira from './pages/Carreira';

// --- SERVIÇOS ---
import GestaoViagens from './pages/GestaoViagens';
import Helpdesk from './pages/Helpdesk';
import ReservaSalas from './pages/ReservaSalas';
import HistoricoSolicitacoes from './pages/HistoricoSolicitacoes';

// --- COMUNICAÇÃO ---
import Comunicacao from './pages/Comunicacao';
import PortalCliente from './pages/PortalCliente';
import ChatInterno from './pages/ChatInterno'; 
import Tarefas from './pages/Tarefas';

// --- FERRAMENTAS ---
import DevTools from './pages/DevTools/DevTools';

// --- CAMINHO ATUALIZADO AQUI ---
import Banco from './pages/Banco/Banco'; 

// CSS GLOBAL
import './App.css';

function App() {
  return (                               
    <UserProvider>
      <BrowserRouter>
        
        {/* Notificações Globais */}
        <NotificationPopup />

        <Routes>
          {/* Rota Inicial */}
          <Route path="/" element={<Login />} />
          <Route path="/trocar-senha" element={<TrocarSenha />} />

          {/* Sistema Principal */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/perfil" element={<Perfil />} />
          
          {/* Admin */}
          <Route path="/cadastro-usuario" element={<CadastroUsuario />} />
          <Route path="/gestao-reembolsos" element={<GestaoReembolsos />} />
          <Route path="/aprovacoes-gerais" element={<GestaoAprovacoes />} />

          {/* Financeiro */}
          <Route path="/solicitacao" element={<Solicitacao />} />
          <Route path="/status-reembolso" element={<StatusReembolso />} />
          <Route path="/gerar-nota" element={<GeradorNota />} />
          <Route path="/holerite" element={<Holerite />} />
          <Route path="/conciliacao" element={<Conciliacao />} />
          
          {/* RH */}
          <Route path="/folha-ponto" element={<FolhaPonto />} />
          <Route path="/plano-saude" element={<PlanoSaude />} />
          <Route path="/ferias" element={<Ferias />} />
          <Route path="/Carreira" element={<Carreira />} />

          {/* Serviços */}
          <Route path="/viagens" element={<GestaoViagens />} />
          <Route path="/helpdesk" element={<Helpdesk />} />
          <Route path="/reservas" element={<ReservaSalas />} /> 
          <Route path="/historico-solicitacoes" element={<HistoricoSolicitacoes />} />

          {/* Comunicação */}
          <Route path="/comunicacao" element={<Comunicacao />} />
          <Route path="/portal-cliente" element={<PortalCliente />} />
          <Route path="/chat" element={<ChatInterno />} />
          <Route path="/tarefas" element={<Tarefas />} />

          {/* Ferramentas e Simulações */}
          <Route path="/dev-tools" element={<DevTools />} />
          <Route path="/Banco" element={<Banco />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
          
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;