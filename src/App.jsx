import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// --- CONTEXTO GLOBAL (Autenticação) ---
import { UserProvider } from './contexts/UserContext';

// --- COMPONENTE GLOBAL DE NOTIFICAÇÃO ---
import NotificationPopup from './components/NotificationPopup';

// --- PÁGINAS DE ACESSO E CONTA ---
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Perfil from './pages/Perfil';
import TrocarSenha from './pages/TrocarSenha';

// --- PÁGINAS ADMINISTRATIVAS ---
import CadastroUsuario from './pages/CadastroUsuario';
import GestaoReembolsos from './pages/GestaoReembolsos';
import GestaoAprovacoes from './pages/GestaoAprovaçoes';

// --- MÓDULOS FINANCEIROS ---
import Solicitacao from './pages/Solicitacao';
import StatusReembolso from './pages/StatusReembolso';
import GeradorNota from './pages/GeradorNota';
import Holerite from './pages/Holerite';
import Conciliacao from './pages/Conciliacao/Conciliacao';

// --- MÓDULOS DE RH ---
import FolhaPonto from './pages/FolhaPonto'; 
import PlanoSaude from './pages/PlanoSaude';
import Ferias from './pages/Ferias'; 
import Carreira from './pages/Carreira';

// --- MÓDULOS DE SERVIÇOS E INFRA ---
import GestaoViagens from './pages/GestaoViagens';
import Helpdesk from './pages/Helpdesk';
import ReservaSalas from './pages/ReservaSalas';
import HistoricoSolicitacoes from './pages/HistoricoSolicitacoes';

// --- COMUNICAÇÃO E COLABORAÇÃO ---
import Comunicacao from './pages/Comunicacao';
import PortalCliente from './pages/PortalCliente';
import ChatInterno from './pages/ChatInterno'; 
import Tarefas from './pages/Tarefas';

// --- FERRAMENTAS ---
import DevTools from './pages/DevTools/DevTools';

// --- NOVO MÓDULO: BANCO (Horizon Bank) ---
// Importamos apenas o arquivo principal (Container). 
// Ele gerencia sozinho se mostra o Login ou o Extrato.
import Banco from './pages/Banco/Banco'; 

// CSS GLOBAL
import './App.css';

function App() {
  return (                               
    <UserProvider>
      <BrowserRouter>
        
        {/* O NotificationPopup fica aqui para funcionar em todas as telas */}
        <NotificationPopup />

        <Routes>
          {/* =======================================================
              ROTAS PÚBLICAS / INICIAIS
             ======================================================= */}
          <Route path="/" element={<Login />} />
          <Route path="/trocar-senha" element={<TrocarSenha />} />

          {/* =======================================================
              ROTAS DO SISTEMA (ÁREA LOGADA)
             ======================================================= */}
          
          {/* Menu Principal */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/tarefas" element={<Tarefas />} />
          
          {/* --- ÁREA DO GESTOR / ADMIN --- */}
          <Route path="/cadastro-usuario" element={<CadastroUsuario />} />
          <Route path="/gestao-reembolsos" element={<GestaoReembolsos />} />
          <Route path="/aprovacoes-gerais" element={<GestaoAprovacoes />} />

          {/* --- OPERACIONAIS FINANCEIROS --- */}
          <Route path="/solicitacao" element={<Solicitacao />} />
          <Route path="/status-reembolso" element={<StatusReembolso />} />
          <Route path="/gerar-nota" element={<GeradorNota />} />
          <Route path="/holerite" element={<Holerite />} />
          <Route path="/conciliacao" element={<Conciliacao />} />
          
          {/* --- RH --- */}
          <Route path="/folha-ponto" element={<FolhaPonto />} />
          <Route path="/plano-saude" element={<PlanoSaude />} />
          <Route path="/ferias" element={<Ferias />} />
          <Route path="/Carreira" element={<Carreira />} />

          {/* --- SERVIÇOS --- */}
          <Route path="/viagens" element={<GestaoViagens />} />
          <Route path="/helpdesk" element={<Helpdesk />} />
          <Route path="/reservas" element={<ReservaSalas />} /> 
          <Route path="/historico-solicitacoes" element={<HistoricoSolicitacoes />} />

          {/* --- COMUNICAÇÃO --- */}
          <Route path="/comunicacao" element={<Comunicacao />} />
          <Route path="/portal-cliente" element={<PortalCliente />} />
          <Route path="/chat" element={<ChatInterno />} />

          {/* --- ROTA OCULTA/DEV --- */}
          <Route path="/dev-tools" element={<DevTools />} />
          
          {/* --- ROTA DO BANCO (SIMULAÇÃO EXTERNA) --- */}
          {/* Ao acessar /banco, o React carrega o arquivo Banco.jsx */}
          <Route path="/banco" element={<Banco />} />

          {/* Rota de Fallback: Se digitar algo errado, volta pro Login */}
          <Route path="*" element={<Navigate to="/" />} />
          
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;