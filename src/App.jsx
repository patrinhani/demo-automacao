import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// --- PÁGINAS DE ACESSO E CONTA ---
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Perfil from './pages/Perfil';
import TrocarSenha from './pages/TrocarSenha'; // Segurança: Troca Obrigatória

// --- PÁGINAS ADMINISTRATIVAS ---
import CadastroUsuario from './pages/CadastroUsuario'; // Criar novos usuários
import GestaoReembolsos from './pages/GestaoReembolsos'; // Aprovar solicitações (NOVO)
import GestaoAprovacoes from './pages/GestaoAprovaçoes';

// --- MÓDULOS FINANCEIROS ---
import Solicitacao from './pages/Solicitacao';
import StatusReembolso from './pages/StatusReembolso';
import GeradorNota from './pages/GeradorNota';
import Holerite from './pages/Holerite';

// --- MÓDULOS DE RH ---
import FolhaPonto from './pages/FolhaPonto'; 
import PlanoSaude from './pages/PlanoSaude';
import Ferias from './pages/Ferias'; 
import Carreira from './pages/Carreira';

// --- MÓDULOS DE SERVIÇOS E INFRA ---
import GestaoViagens from './pages/GestaoViagens';
import Helpdesk from './pages/Helpdesk';
import ReservaSalas from './pages/ReservaSalas';
import HistoricoSolicitacoes from './pages/HistoricoSolicitacoes'; // <--- Nova página Geral

// --- COMUNICAÇÃO E COLABORAÇÃO ---
import Comunicacao from './pages/Comunicacao';
import PortalCliente from './pages/PortalCliente';
import ChatInterno from './pages/ChatInterno'; 

// --- PRODUTIVIDADE ---
import Tarefas from './pages/Tarefas';

// CSS GLOBAL
import './App.css';

function App() {
  return (                               
    <BrowserRouter>
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

        {/* Configurações do Usuário */}
        <Route path="/perfil" element={<Perfil />} />
        
        {/* --- ÁREA DO GESTOR / ADMIN --- */}
        <Route path="/cadastro-usuario" element={<CadastroUsuario />} />
        <Route path="/gestao-reembolsos" element={<GestaoReembolsos />} />
        <Route path="/aprovacoes-gerais" element={<GestaoAprovacoes />} />

        {/* --- OPERACIONAIS --- */}
        <Route path="/solicitacao" element={<Solicitacao />} />
        <Route path="/status-reembolso" element={<StatusReembolso />} />
        <Route path="/gerar-nota" element={<GeradorNota />} />
        <Route path="/holerite" element={<Holerite />} />
        
        <Route path="/folha-ponto" element={<FolhaPonto />} />
        <Route path="/plano-saude" element={<PlanoSaude />} />
        <Route path="/ferias" element={<Ferias />} />
        <Route path="/Carreira" element={<Carreira />} />

        <Route path="/viagens" element={<GestaoViagens />} />
        <Route path="/helpdesk" element={<Helpdesk />} />
        <Route path="/reservas" element={<ReservaSalas />} />
        <Route path="/historico-solicitacoes" element={<HistoricoSolicitacoes />} /> {/* Rota do Histórico */}

        <Route path="/comunicacao" element={<Comunicacao />} />
        <Route path="/portal-cliente" element={<PortalCliente />} />
        <Route path="/chat" element={<ChatInterno />} />

        <Route path="/tarefas" element={<Tarefas />} />
        
        {/* Rota de Fallback: Se digitar algo errado, volta pro Login */}
        <Route path="*" element={<Navigate to="/" />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;