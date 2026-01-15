import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import '../App.css';
import '../Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();

  // Lista de Módulos do Sistema
  const modulos = [
    {
      titulo: 'Folha de Ponto',
      desc: 'Registro de entrada/saída, ajustes e espelho de ponto.',
      icon: '⏰',
      classeIcone: 'icon-ponto',
      rota: '/folha-ponto',
      notificacao: '3 pendências'
    },
    {
      titulo: 'Holerites',
      desc: 'Consulte seus demonstrativos de pagamento e informes.',
      icon: '📄',
      classeIcone: 'icon-holerite',
      rota: '/holerite',
      notificacao: null
    },
    {
      titulo: 'Férias', // <--- NOVO
      desc: 'Planejamento de férias, venda de dias e consulta de período.',
      icon: '🏖️',
      classeIcone: 'icon-ferias', // Nota: Pode precisar criar estilo CSS para esta classe ou usar uma genérica
      rota: '/ferias',
      notificacao: null
    },
    {
      titulo: 'Solicitar Reembolso',
      desc: 'Nova solicitação de reembolso e envio de notas fiscais.',
      icon: '💸',
      classeIcone: 'icon-reembolso',
      rota: '/solicitacao',
      notificacao: null
    },
    {
      titulo: 'Status Reembolsos', // <--- NOVO
      desc: 'Acompanhe a aprovação e pagamento dos seus pedidos.',
      icon: '📊',
      classeIcone: 'icon-reembolso-status',
      rota: '/status-reembolso',
      notificacao: null
    },
    {
      titulo: 'Gerador de Nota', // <--- NOVO
      desc: 'Ferramenta auxiliar para gerar notas de serviço.',
      icon: '🧾',
      classeIcone: 'icon-nota',
      rota: '/gerar-nota',
      notificacao: null
    },
    {
      titulo: 'Plano de Saúde',
      desc: 'Carteirinha digital, busca de rede credenciada e extratos.',
      icon: '❤️',
      classeIcone: 'icon-saude',
      rota: '/plano-saude',
      notificacao: null
    },
    {
      titulo: 'Gestão de Viagens',
      desc: 'Solicite passagens, hospedagem e adiantamentos corporativos.',
      icon: '✈️',
      classeIcone: 'icon-viagem',
      rota: '/viagens',
      notificacao: '1 aprovada'
    },
    {
      titulo: 'Helpdesk TI',
      desc: 'Abra chamados para suporte técnico, acessos e equipamentos.',
      icon: '🎧',
      classeIcone: 'icon-ti',
      rota: '/helpdesk',
      notificacao: null
    },
    {
     titulo: 'Reserva de Salas',
     desc: 'Agende salas de reunião e espaços.',
     icon: '📅',
    classeIcone: 'icon-reserva', 
    rota: '/reservas',
    notificacao: null
    },
    {
    titulo: 'Mural & Avisos',
    desc: 'Notícias da empresa e aniversariantes do mês.',
    icon: '📢', // Ou 📰
    classeIcone: 'icon-comunicacao',
    rota: '/comunicacao',
    notificacao: '2 novas' // Para chamar a atenção
    },
    {
    titulo: 'Carreira & Cursos',
    desc: 'Vagas internas e treinamentos corporativos.',
    icon: '🚀',
    classeIcone: 'icon-carreira',
    rota: '/carreira',
    notificacao: null
    },
    {
    titulo: 'Minhas Tarefas',
    desc: 'Kanban pessoal de atividades.',
    icon: '✅',
    classeIcone: 'icon-tarefas',
    rota: '/tarefas',
    notificacao: null
     },
  ];

  return (
    <div className="app-container">
      {/* BARRA SUPERIOR */}
      <header className="top-bar">
        <div className="brand">
          <Logo />
        </div>
        <div className="user-info">
          <div className="avatar">GS</div>
          <span>Guilherme Silva</span>
        </div>
      </header>

      <div className="dashboard-container">
        
        {/* BOAS VINDAS */}
        <div className="welcome-section">
          <div className="welcome-text">
            <h2>Olá, Guilherme! 👋</h2>
            <p>Bem-vindo ao Portal do Colaborador TechCorp.</p>
          </div>
          <div className="quick-stats">
            <div className="stat-badge">📅 <span>Hoje: <strong>{new Date().toLocaleDateString()}</strong></span></div>
            <div className="stat-badge">🏢 <span>Unidade: <strong>Matriz SP</strong></span></div>
          </div>
        </div>

        {/* GRID DE MÓDULOS */}
        <div className="modules-grid">
          {modulos.map((mod, index) => (
            <div key={index} className="module-card" onClick={() => navigate(mod.rota)}>
              {mod.notificacao && <span className="notify-badge">{mod.notificacao}</span>}
              
              <div className={`card-icon ${mod.classeIcone}`}>
                {mod.icon}
              </div>
              
              <h3>{mod.titulo}</h3>
              <p>{mod.desc}</p>
              
              <span className="card-link">Acessar Módulo →</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}