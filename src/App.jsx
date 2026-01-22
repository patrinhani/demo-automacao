import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importação das Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Perfil from './pages/Perfil';

// Funcionalidades de Segurança e Admin (NOVAS)
import CadastroUsuario from './pages/CadastroUsuario';
import TrocarSenha from './pages/TrocarSenha';

// Módulos Financeiros
import Solicitacao from './pages/Solicitacao';
import StatusReembolso from './pages/StatusReembolso';
import GeradorNota from './pages/GeradorNota';
import Holerite from './pages/Holerite';

// Módulos RH
import FolhaPonto from './pages/FolhaPonto'; 
import PlanoSaude from './pages/PlanoSaude';
import Ferias from './pages/Ferias'; 
import Carreira from './pages/Carreira';

// Módulos de Serviços
import GestaoViagens from './pages/GestaoViagens';
import Helpdesk from './pages/Helpdesk';
import ReservaSalas from './pages/ReservaSalas';

// Módulos de Comunicação e Colaboração
import Comunicacao from './pages/Comunicacao';
import PortalCliente from './pages/PortalCliente';
import ChatInterno from './pages/ChatInterno'; 

// Módulos de Produtividade
import Tarefas from './pages/Tarefas';

// CSS Global
import './App.css';

function App() {
  return (                               
    <BrowserRouter>
      <Routes>
        {/* --- ROTAS DE ACESSO --- */}
        
        {/* Tela de Login (Pública) */}
        <Route path="/" element={<Login />} />
        
        {/* Tela de Troca Obrigatória de Senha */}
        <Route path="/trocar-senha" element={<TrocarSenha />} />

        {/* --- ÁREA LOGADA --- */}
        
        {/* Menu Principal */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Perfil do Usuário */}
        <Route path="/perfil" element={<Perfil />} />
        
        {/* Área Administrativa (Protegida) */}
        <Route path="/cadastro-usuario" element={<CadastroUsuario />} />

        {/* --- MÓDULOS DO SISTEMA --- */}
        
        {/* Financeiro */}
        <Route path="/solicitacao" element={<Solicitacao />} />
        <Route path="/status-reembolso" element={<StatusReembolso />} />
        <Route path="/gerar-nota" element={<GeradorNota />} />
        <Route path="/holerite" element={<Holerite />} />

        {/* Recursos Humanos */}
        <Route path="/folha-ponto" element={<FolhaPonto />} />
        <Route path="/plano-saude" element={<PlanoSaude />} />
        <Route path="/ferias" element={<Ferias />} />
        <Route path="/Carreira" element={<Carreira />} />

        {/* Serviços e Infra */}
        <Route path="/viagens" element={<GestaoViagens />} />
        <Route path="/helpdesk" element={<Helpdesk />} />
        <Route path="/reservas" element={<ReservaSalas />} /> 

        {/* Comunicação */}
        <Route path="/comunicacao" element={<Comunicacao />} />
        <Route path="/portal-cliente" element={<PortalCliente />} />
        <Route path="/chat" element={<ChatInterno />} />

        {/* Produtividade */}
        <Route path="/tarefas" element={<Tarefas />} />
        
        {/* Rota Coringa: Redireciona para login se a página não existir */}
        <Route path="*" element={<Navigate to="/" />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;