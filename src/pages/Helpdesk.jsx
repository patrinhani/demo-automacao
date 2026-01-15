import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import './Helpdesk.css';

export default function Helpdesk() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState('meus-tickets'); // 'meus-tickets', 'novo-ticket', 'detalhes'
  const [ticketSelecionado, setTicketSelecionado] = useState(null);
  
  // Simulação de banco de dados enriquecido
  const [tickets, setTickets] = useState([
    { 
      id: 1024, 
      assunto: 'Erro no SAP ao lançar nota', 
      categoria: 'Software', 
      prioridade: 'Alta', 
      status: 'Em Andamento', 
      data: '10/01/2026',
      descricao: 'Sempre que tento lançar a nota fiscal de entrada na transação MIRO, o sistema trava e fecha sozinho. O erro acontece especificamente com notas de serviço.',
      historico: [
        { autor: 'Você', data: '10/01/2026 09:00', tipo: 'abertura', texto: 'Ticket criado com prioridade Alta.' },
        { autor: 'Suporte TI', data: '10/01/2026 10:30', tipo: 'resposta', texto: 'Olá! Estamos analisando os logs do servidor SAP. Você poderia nos enviar um print do erro?' },
        { autor: 'Você', data: '10/01/2026 11:00', tipo: 'resposta', texto: 'Infelizmente não gera código de erro, a janela apenas fecha.' }
      ]
    },
    { 
      id: 1023, 
      assunto: 'Solicitação de Monitor Extra', 
      categoria: 'Hardware', 
      prioridade: 'Média', 
      status: 'Aberto', 
      data: '08/01/2026',
      descricao: 'Gostaria de solicitar um segundo monitor para auxiliar nas comparações de planilhas.',
      historico: [
        { autor: 'Você', data: '08/01/2026 14:20', tipo: 'abertura', texto: 'Ticket criado aguardando aprovação da gestão.' }
      ]
    },
    { 
      id: 1010, 
      assunto: 'Reset de Senha de Rede', 
      categoria: 'Acesso', 
      prioridade: 'Baixa', 
      status: 'Concluído', 
      data: '15/12/2025',
      descricao: 'Esqueci minha senha do Windows após as férias.',
      historico: [
        { autor: 'Você', data: '15/12/2025 08:00', tipo: 'abertura', texto: 'Solicitação de reset de senha.' },
        { autor: 'Sistema', data: '15/12/2025 08:05', tipo: 'sistema', texto: 'Senha temporária enviada para o e-mail do gestor.' },
        { autor: 'Suporte TI', data: '15/12/2025 09:00', tipo: 'conclusao', texto: 'Chamado encerrado. Usuário conseguiu logar.' }
      ]
    },
  ]);

  const [novoTicket, setNovoTicket] = useState({ assunto: '', categoria: 'Software', prioridade: 'Baixa', descricao: '' });

  // Ação de abrir detalhes
  const handleVerDetalhes = (ticket) => {
    setTicketSelecionado(ticket);
    setAbaAtiva('detalhes');
  };

  // Ação de criar ticket
  const handleSubmit = (e) => {
    e.preventDefault();
    const ticketGerado = {
      id: Math.floor(Math.random() * 1000) + 2000,
      ...novoTicket,
      status: 'Aberto',
      data: new Date().toLocaleDateString('pt-BR'),
      historico: [{ autor: 'Você', data: new Date().toLocaleString('pt-BR'), tipo: 'abertura', texto: 'Ticket criado.' }]
    };

    setTickets([ticketGerado, ...tickets]);
    alert(`Chamado #${ticketGerado.id} criado!`);
    setNovoTicket({ assunto: '', categoria: 'Software', prioridade: 'Baixa', descricao: '' });
    setAbaAtiva('meus-tickets');
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Aberto': return 'status-aberto';
      case 'Em Andamento': return 'status-andamento';
      case 'Concluído': return 'status-concluido';
      default: return '';
    }
  };

  return (
    <div className="app-container">
      <header className="header-bar">
        <div className="logo-container"><Logo /></div>
        <div className="back-button" onClick={() => navigate('/dashboard')}>Voltar ao Menu ↩</div>
      </header>

      <div className="helpdesk-container">
        
        {/* CABEÇALHO DA PÁGINA (Muda se estiver em detalhes) */}
        <div className="page-header">
          {abaAtiva === 'detalhes' ? (
             <button className="btn-voltar-lista" onClick={() => setAbaAtiva('meus-tickets')}>
               ← Voltar para a lista
             </button>
          ) : (
            <>
              <h2>Central de Suporte TI</h2>
              <p>Gerencie seus chamados técnicos.</p>
            </>
          )}
        </div>

        {/* NAVEGAÇÃO DE ABAS (Esconde se estiver em detalhes) */}
        {abaAtiva !== 'detalhes' && (
          <div className="tabs">
            <button className={`tab-btn ${abaAtiva === 'meus-tickets' ? 'active' : ''}`} onClick={() => setAbaAtiva('meus-tickets')}>📋 Meus Chamados</button>
            <button className={`tab-btn ${abaAtiva === 'novo-ticket' ? 'active' : ''}`} onClick={() => setAbaAtiva('novo-ticket')}>➕ Novo Chamado</button>
          </div>
        )}

        <div className="tab-content">
          
          {/* LISTA */}
          {abaAtiva === 'meus-tickets' && (
            <div className="tickets-list">
               <table className="tickets-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Assunto</th>
                      <th className="hide-mobile">Categoria</th>
                      <th className="hide-mobile">Data</th>
                      <th>Status</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => (
                      <tr key={t.id}>
                        <td className="id-col">#{t.id}</td>
                        <td>
                          <strong>{t.assunto}</strong>
                          <div className="mobile-meta">{t.categoria} • {t.data}</div>
                        </td>
                        <td className="hide-mobile">{t.categoria}</td>
                        <td className="hide-mobile">{t.data}</td>
                        <td><span className={`status-badge ${getStatusColor(t.status)}`}>{t.status}</span></td>
                        <td>
                          <button className="btn-details" onClick={() => handleVerDetalhes(t)}>Ver</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          )}

          {/* DETALHES DO TICKET (NOVA TELA) */}
          {abaAtiva === 'detalhes' && ticketSelecionado && (
            <div className="ticket-detail-view">
              
              {/* Info Header */}
              <div className="detail-header">
                <div className="detail-title">
                  <span className="detail-id">#{ticketSelecionado.id}</span>
                  <h3>{ticketSelecionado.assunto}</h3>
                </div>
                <div className={`status-badge ${getStatusColor(ticketSelecionado.status)} large-badge`}>
                  {ticketSelecionado.status}
                </div>
              </div>

              {/* Info Grid */}
              <div className="detail-info-grid">
                <div className="info-box">
                  <label>Categoria</label>
                  <span>{ticketSelecionado.categoria}</span>
                </div>
                <div className="info-box">
                  <label>Prioridade</label>
                  <span>{ticketSelecionado.prioridade}</span>
                </div>
                <div className="info-box">
                  <label>Data de Abertura</label>
                  <span>{ticketSelecionado.data}</span>
                </div>
              </div>

              {/* Descrição Original */}
              <div className="detail-description">
                <h4>Descrição do Problema</h4>
                <p>{ticketSelecionado.descricao}</p>
              </div>

              {/* Timeline / Histórico */}
              <div className="detail-timeline">
                <h4>Histórico de Interações</h4>
                <div className="timeline-container">
                  {ticketSelecionado.historico && ticketSelecionado.historico.map((msg, idx) => (
                    <div key={idx} className={`timeline-item ${msg.autor === 'Você' ? 'user-msg' : 'support-msg'}`}>
                      <div className="msg-header">
                        <strong>{msg.autor}</strong>
                        <span>{msg.data}</span>
                      </div>
                      <div className="msg-body">
                        {msg.texto}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Caixa de Resposta (Simulada) */}
                {ticketSelecionado.status !== 'Concluído' && (
                  <div className="reply-box">
                    <textarea placeholder="Digite uma resposta para o suporte..."></textarea>
                    <button className="btn-reply">Enviar Resposta</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FORMULÁRIO (Mantido igual) */}
          {abaAtiva === 'novo-ticket' && (
            <form className="new-ticket-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Assunto</label>
                  <input type="text" required value={novoTicket.assunto} onChange={(e) => setNovoTicket({...novoTicket, assunto: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Categoria</label>
                  <select value={novoTicket.categoria} onChange={(e) => setNovoTicket({...novoTicket, categoria: e.target.value})}>
                    <option>Software</option><option>Hardware</option><option>Acesso</option><option>Rede</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Descrição</label>
                <textarea rows="5" required value={novoTicket.descricao} onChange={(e) => setNovoTicket({...novoTicket, descricao: e.target.value})}></textarea>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setAbaAtiva('meus-tickets')}>Cancelar</button>
                <button type="submit" className="btn-submit">Abrir Chamado</button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}