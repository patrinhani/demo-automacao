import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import './Comunicacao.css';

export default function Comunicacao() {
  const navigate = useNavigate();
  const [filtroAtivo, setFiltroAtivo] = useState('Todos');
  
  // Estado para controlar qual notícia está expandida
  const [noticiaExpandida, setNoticiaExpandida] = useState(null);
  
  // Estado para controlar a animação de parabéns
  const [enviandoParabens, setEnviandoParabens] = useState(false);

  // Dados Mockados: Notícias (Agora com conteudo completo)
  const noticias = [
    {
      id: 1,
      titulo: 'Festa de Fim de Ano 2026',
      data: '15/12/2026',
      categoria: 'Eventos',
      resumo: 'Prepare-se! Nossa festa será no dia 20 de Dezembro no Espaço Villa Lobos. Confirme sua presença até sexta-feira.',
      conteudo: 'Prepare-se! Nossa festa será no dia 20 de Dezembro no Espaço Villa Lobos. Teremos banda ao vivo, buffet completo e sorteio de brindes. O traje é esporte fino. Por favor, confirme sua presença no link enviado por e-mail até a próxima sexta-feira para garantirmos a organização. Contamos com você!',
      importante: true
    },
    {
      id: 2,
      titulo: 'Novo Benefício: Gympass',
      data: '10/01/2026',
      categoria: 'RH',
      resumo: 'Agora todos os colaboradores têm acesso aos planos do Gympass a partir de R$ 29,90. Acesse o portal do RH para ativar.',
      conteudo: 'Temos o prazer de anunciar nossa parceria com o Gympass! Agora, todos os colaboradores CLT e PJ têm acesso a milhares de academias e apps de bem-estar. Os planos começam a partir de R$ 29,90 mensais, descontados em folha. Para ativar, baixe o app do Gympass e use seu e-mail corporativo.',
      importante: false
    },
    {
      id: 3,
      titulo: 'Manutenção Programada nos Servidores',
      data: '08/01/2026',
      categoria: 'TI',
      resumo: 'Neste sábado (18/01), o sistema ficará instável entre 14h e 16h para atualização de segurança.',
      conteudo: 'A equipe de Infraestrutura realizará uma atualização crítica de segurança nos servidores de arquivos e no ERP. Durante o período de 14h às 16h deste sábado (18/01), o acesso remoto (VPN) e o sistema de arquivos poderão apresentar instabilidade. Recomendamos salvar seus trabalhos antes desse horário.',
      importante: true
    },
    {
      id: 4,
      titulo: 'Bem-vindos aos novos estagiários!',
      data: '05/01/2026',
      categoria: 'Geral',
      resumo: 'Dêem as boas-vindas aos 5 novos integrantes do time de Desenvolvimento e Marketing que iniciaram hoje.',
      conteudo: 'Estamos muito felizes em receber nossos novos talentos! Dêem as boas-vindas a: Lucas e Mariana (Dev), Pedro (QA), Sofia e João (Marketing). Eles passarão pela integração institucional nesta semana. Sintam-se à vontade para convidá-los para um café!',
      importante: false
    }
  ];

  const aniversariantes = [
    { nome: 'Julia Pereira', setor: 'Design', dia: '12', foto: '👩‍🎨' },
    { nome: 'Roberto Alves', setor: 'Financeiro', dia: '15', foto: '👨‍💼' },
    { nome: 'Amanda Costa', setor: 'Marketing', dia: '23', foto: '👩‍💻' },
    { nome: 'Ricardo Silva', setor: 'Logística', dia: '30', foto: '👷' },
  ];

  // Lógica do Ler Mais
  const toggleLerMais = (id) => {
    if (noticiaExpandida === id) {
      setNoticiaExpandida(null); // Fecha se já estiver aberto
    } else {
      setNoticiaExpandida(id); // Abre o novo
    }
  };

  // Lógica do Parabéns
  const handleEnviarParabens = () => {
    setEnviandoParabens(true);
    // Remove a animação após 3 segundos
    setTimeout(() => {
      setEnviandoParabens(false);
    }, 3000);
  };

  const noticiasFiltradas = filtroAtivo === 'Todos' 
    ? noticias 
    : noticias.filter(n => n.categoria === filtroAtivo);

  return (
    <div className="app-container">
      
      {/* OVERLAY DE ANIMAÇÃO (Aparece quando envia parabéns) */}
      {enviandoParabens && (
        <div className="celebration-overlay">
          <div className="celebration-content">
            <div className="emojis">🎉 🎂 🎈 🎁</div>
            <h3>Parabéns Enviado!</h3>
            <p>Sua mensagem foi entregue para a equipe.</p>
          </div>
        </div>
      )}

      <header className="header-bar">
        <div className="logo-container"><Logo /></div>
        <div className="back-button" onClick={() => navigate('/dashboard')}>Voltar ao Menu ↩</div>
      </header>

      <div className="comunicacao-container">
        <div className="page-header">
          <h2>Mural de Comunicação</h2>
          <p>Fique por dentro das novidades da TechCorp.</p>
        </div>

        <div className="layout-grid">
          
          {/* COLUNA ESQUERDA: NOTÍCIAS */}
          <div className="news-section">
            <div className="news-filters">
              {['Todos', 'RH', 'TI', 'Eventos', 'Geral'].map(cat => (
                <button 
                  key={cat} 
                  className={`filter-badge ${filtroAtivo === cat ? 'active' : ''}`}
                  onClick={() => setFiltroAtivo(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="news-list">
              {noticiasFiltradas.map(noticia => (
                <div key={noticia.id} className={`news-card ${noticia.importante ? 'highlight' : ''}`}>
                  <div className="news-header">
                    <span className={`category-tag ${noticia.categoria.toLowerCase()}`}>{noticia.categoria}</span>
                    <span className="news-date">{noticia.data}</span>
                  </div>
                  <h3>{noticia.titulo}</h3>
                  
                  {/* Lógica de Exibição do Texto */}
                  <div className={`news-content ${noticiaExpandida === noticia.id ? 'expanded' : ''}`}>
                    <p>{noticiaExpandida === noticia.id ? noticia.conteudo : noticia.resumo}</p>
                  </div>

                  <button className="read-more" onClick={() => toggleLerMais(noticia.id)}>
                    {noticiaExpandida === noticia.id ? 'Ler menos ↑' : 'Ler mais →'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* COLUNA DIREITA: ANIVERSARIANTES */}
          <aside className="sidebar">
            <div className="birthdays-card">
              <div className="card-header">
                <h3>🎂 Aniversariantes</h3>
                <span>Janeiro</span>
              </div>
              <ul className="birthday-list">
                {aniversariantes.map((bday, index) => (
                  <li key={index} className="birthday-item">
                    <div className="bday-avatar">{bday.foto}</div>
                    <div className="bday-info">
                      <strong>{bday.nome}</strong>
                      <span>{bday.setor}</span>
                    </div>
                    <div className="bday-date">Dia {bday.dia}</div>
                  </li>
                ))}
              </ul>
              
              <button 
                className="btn-send-congrats" 
                onClick={handleEnviarParabens}
                disabled={enviandoParabens}
              >
                {enviandoParabens ? 'Enviando...' : 'Enviar Parabéns Geral 🎉'}
              </button>
            </div>

            <div className="quick-links-card">
              <h3>🔗 Links Úteis</h3>
              <ul>
                <li><a href="#">Portal do Cliente</a></li>
                <li><a href="#">LinkedIn da Empresa</a></li>
                <li><a href="#">Manual de Conduta</a></li>
              </ul>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}