import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import './Comunicacao.css';

export default function Comunicacao() {
  const navigate = useNavigate();
  const [filtroAtivo, setFiltroAtivo] = useState('Todos');
  const [noticiaExpandida, setNoticiaExpandida] = useState(null);
  const [enviandoParabens, setEnviandoParabens] = useState(false);
  
  // Controle do Modal de Ética (Já existente)
  const [showModalEtica, setShowModalEtica] = useState(false);

  // NOVOS ESTADOS: Controle do Modal de Documentação e das Abas Internas
  const [showModalDocs, setShowModalDocs] = useState(false);
  const [abaAtivaDoc, setAbaAtivaDoc] = useState('banco');

  // Dados Mockados (Mantidos iguais)
  const noticias = [
    {
      id: 1,
      titulo: 'Festa de Fim de Ano 2026',
      data: '15/12/2026',
      categoria: 'Eventos',
      resumo: 'Prepare-se! Nossa festa será no dia 20 de Dezembro no Espaço Villa Lobos.',
      conteudo: 'Prepare-se! Nossa festa será no dia 20 de Dezembro no Espaço Villa Lobos. Teremos banda ao vivo, buffet completo e sorteio de brindes. O traje é esporte fino. Por favor, confirme sua presença no link enviado por e-mail até a próxima sexta-feira para garantirmos a organização. Contamos com você!',
      importante: true
    },
    {
      id: 2,
      titulo: 'Novo Benefício: Gympass',
      data: '10/01/2026',
      categoria: 'RH',
      resumo: 'Agora todos os colaboradores têm acesso aos planos do Gympass a partir de R$ 29,90.',
      conteudo: 'Temos o prazer de anunciar nossa parceria com o Gympass! Agora, todos os colaboradores CLT e PJ têm acesso a milhares de academias e apps de bem-estar. Os planos começam a partir de R$ 29,90 mensais, descontados em folha. Para ativar, baixe o app do Gympass e use seu e-mail corporativo.',
      importante: false
    },
    {
      id: 3,
      titulo: 'Manutenção Programada',
      data: '08/01/2026',
      categoria: 'TI',
      resumo: 'Neste sábado (18/01), o sistema ficará instável entre 14h e 16h.',
      conteudo: 'A equipe de Infraestrutura realizará uma atualização crítica de segurança nos servidores de arquivos e no ERP. Durante o período de 14h às 16h deste sábado (18/01), o acesso remoto (VPN) e o sistema de arquivos poderão apresentar instabilidade. Recomendamos salvar seus trabalhos antes desse horário.',
      importante: true
    },
    {
      id: 4,
      titulo: 'Bem-vindos aos novos estagiários!',
      data: '05/01/2026',
      categoria: 'Geral',
      resumo: 'Dêem as boas-vindas aos 5 novos integrantes do time de Desenvolvimento.',
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

  const toggleLerMais = (id) => {
    setNoticiaExpandida(noticiaExpandida === id ? null : id);
  };

  const handleEnviarParabens = () => {
    setEnviandoParabens(true);
    setTimeout(() => setEnviandoParabens(false), 3000);
  };

  const noticiasFiltradas = filtroAtivo === 'Todos' 
    ? noticias 
    : noticias.filter(n => n.categoria === filtroAtivo);

  return (
    <div className="tech-comunicacao-layout">
      
      {/* LUZES DE FUNDO */}
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>
      <div className="ambient-light light-3"></div>

      {/* OVERLAY DE ANIMAÇÃO (Parabéns) */}
      {enviandoParabens && (
        <div className="celebration-overlay">
          <div className="celebration-content glass-effect">
            <div className="emojis">🎉 🎂 🎈 🎁</div>
            <h3>Parabéns Enviado!</h3>
            <p>Sua mensagem foi entregue para a equipe.</p>
          </div>
        </div>
      )}

      {/* MODAL DE CÓDIGO DE ÉTICA (Já existente) */}
      {showModalEtica && (
        <div className="celebration-overlay" onClick={() => setShowModalEtica(false)}>
          <div className="celebration-content glass-effect" onClick={(e) => e.stopPropagation()} style={{textAlign: 'left', maxWidth: '600px'}}>
             <h3 style={{borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '20px'}}>⚖️ Código de Ética e Conduta</h3>
             <div style={{maxHeight: '400px', overflowY: 'auto', paddingRight: '10px', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6'}}>
               <p><strong>1. Objetivo</strong><br/>Estabelecer os princípios éticos que guiam nossas ações profissionais.</p>
               <p><strong>2. Respeito e Inclusão</strong><br/>Não toleramos discriminação de qualquer natureza. Valorizamos a diversidade e o respeito mútuo no ambiente de trabalho.</p>
               <p><strong>3. Confidencialidade</strong><br/>Todas as informações estratégicas da TechCorp e dados de clientes devem ser tratados com sigilo absoluto.</p>
               <p><strong>4. Conflito de Interesses</strong><br/>Colaboradores devem evitar situações onde interesses pessoais conflitem com os da empresa.</p>
               <p><strong>5. Uso de Recursos</strong><br/>Equipamentos e softwares corporativos destinam-se exclusivamente ao uso profissional.</p>
             </div>
             <button 
               onClick={() => setShowModalEtica(false)}
               style={{width: '100%', padding: '12px', marginTop: '20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}}
             >
               Entendido
             </button>
          </div>
        </div>
      )}

      {/* NOVO MODAL: DOCUMENTAÇÕES / MANUAIS (POP) */}
      {showModalDocs && (
        <div className="celebration-overlay" onClick={() => setShowModalDocs(false)}>
          <div className="celebration-content glass-effect" onClick={(e) => e.stopPropagation()} style={{textAlign: 'left', maxWidth: '800px', width: '90%'}}>
             <h3 style={{borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '20px'}}>📚 Manuais e Procedimentos (POP)</h3>

             {/* Controles das Abas */}
             <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
               <button
                 style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: abaAtivaDoc === 'banco' ? '#3b82f6' : '#334155', color: 'white', cursor: 'pointer', transition: '0.3s' }}
                 onClick={() => setAbaAtivaDoc('banco')}
               >
                 IT 01 - Conciliação Bancária
               </button>
               <button
                 style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: abaAtivaDoc === 'rh' ? '#3b82f6' : '#334155', color: 'white', cursor: 'pointer', transition: '0.3s' }}
                 onClick={() => setAbaAtivaDoc('rh')}
               >
                 IT 02 - Auditoria RH
               </button>
             </div>

             {/* Conteúdo Dinâmico com barra de rolagem */}
             <div style={{maxHeight: '50vh', overflowY: 'auto', paddingRight: '15px', color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6'}}>
               
               {abaAtivaDoc === 'banco' && (
                 <div>
                   <h4 style={{ color: '#60a5fa', marginBottom: '10px' }}>IT 01 - Conciliação Bancária e Anexação de Comprovantes</h4>
                   <p style={{ marginBottom: '15px' }}><strong>Objetivo:</strong> Realizar a conciliação manual de transações financeiras pendentes no ERP, cruzando os dados com o extrato bancário do Horizon Bank, validando o hash de segurança e anexando o comprovante físico.</p>
                   
                   <h5 style={{ color: '#94a3b8', marginBottom: '10px' }}>Passo a Passo:</h5>
                   <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <li><strong>Acesso:</strong> Acesse o ERP e o Horizon Bank com suas credenciais.</li>
                      <li><strong>Geração do Extrato:</strong> No banco, clique em "Extrato" e mantenha a aba aberta.</li>
                      <li><strong>Verificação:</strong> No ERP (módulo Conciliação), filtre pelas transações com status "Pendente".</li>
                      <li><strong>Busca:</strong> Anote o ID Interno da transação no ERP e busque-o na barra de pesquisa do Horizon Bank. Faça o download do PDF (Comprovativo).</li>
                      <li><strong>Extração de Chave:</strong> Abra o PDF, localize "AUTENTICAÇÃO ELETRÔNICA" e copie o código alfanumérico logo abaixo. (Contingência: <code>HRZ-AUTH-[ID_TRANSAÇÃO]</code>).</li>
                      <li><strong>Liquidação:</strong> Retorne ao ERP, clique em liquidar, cole o código, preencha a data de hoje, selecione "Horizon Bank (Corp)" e anexe o PDF. Clique em Salvar.</li>
                      <li><strong>Finalização:</strong> Exclua o PDF da sua máquina por segurança e repita o processo para as demais pendências.</li>
                   </ol>
                 </div>
               )}

               {abaAtivaDoc === 'rh' && (
                 <div>
                   <h4 style={{ color: '#60a5fa', marginBottom: '10px' }}>IT 02 - Auditoria de Espelho de Ponto e Notificação</h4>
                   <p style={{ marginBottom: '15px' }}><strong>Objetivo:</strong> Auditar diariamente a folha de ponto dos colaboradores no sistema, identificar inconsistências (atrasos, faltas, marcações incorretas) e notificar ativamente o colaborador via chat interno para regularização.</p>
                   
                   <h5 style={{ color: '#94a3b8', marginBottom: '10px' }}>Passo a Passo:</h5>
                   <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <li><strong>Acesso:</strong> Acesse o Portal ERP (Folha de Ponto) e alterne para a aba "Gestão RH".</li>
                      <li><strong>Identificação:</strong> Localize na tabela os registros sinalizados com badges de erro e anote: Nome do Colaborador, Data e Tipo da ocorrência.</li>
                      <li><strong>Seleção da Mensagem:</strong> Escolha o texto padrão correspondente à regra de RH infringida (ex: Marcação Ímpar, Falta Injustificada, Atraso, etc.) e substitua a variável <code>[DATA]</code> pela data real.</li>
                      <li><strong>Notificação:</strong> Clique em "Chamar/Notificar" na linha do colaborador. O sistema abrirá o Chat Interno. Cole a mensagem padrão na caixa de texto e envie.</li>
                      <li><strong>Acompanhamento:</strong> Retorne à tela principal de Folha de Ponto, aguarde a correção ou justificativa do colaborador (o status mudará para "Respondido") e repita o processo até zerar a fila.</li>
                   </ol>
                 </div>
               )}

             </div>
             
             <button 
               onClick={() => setShowModalDocs(false)}
               style={{width: '100%', padding: '12px', marginTop: '20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}}
             >
               Fechar Documentação
             </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="tech-header-bar glass-effect">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
           <span className="page-title">Mural Digital</span>
        </div>
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>
          Voltar ao Menu ↩
        </button>
      </header>

      <div className="comunicacao-content-scroll">
        <div className="comunicacao-container">
          
          <div className="page-header-tech">
            <h2>Últimos Comunicados</h2>
            <p>Fique conectado com o que acontece na TechCorp.</p>
          </div>

          <div className="layout-grid-tech">
            
            {/* COLUNA ESQUERDA: NOTÍCIAS */}
            <div className="news-section">
              <div className="news-filters">
                {['Todos', 'RH', 'TI', 'Eventos', 'Geral'].map(cat => (
                  <button 
                    key={cat} 
                    className={`tech-filter-badge ${filtroAtivo === cat ? 'active' : ''}`}
                    onClick={() => setFiltroAtivo(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="news-list">
                {noticiasFiltradas.map(noticia => (
                  <div key={noticia.id} className={`tech-news-card glass-effect ${noticia.importante ? 'highlight-glow' : ''}`}>
                    <div className="news-header">
                      <span className={`tech-category-tag ${noticia.categoria.toLowerCase()}`}>{noticia.categoria}</span>
                      <span className="tech-news-date">{noticia.data}</span>
                    </div>
                    
                    <h3>{noticia.titulo}</h3>
                    
                    <div className={`tech-news-content ${noticiaExpandida === noticia.id ? 'expanded' : ''}`}>
                      <p>{noticiaExpandida === noticia.id ? noticia.conteudo : noticia.resumo}</p>
                    </div>

                    <button className="tech-read-more" onClick={() => toggleLerMais(noticia.id)}>
                      {noticiaExpandida === noticia.id ? 'Ler menos ↑' : 'Ler mais →'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUNA DIREITA: SIDEBAR */}
            <aside className="tech-sidebar-right">
              
              {/* CARD ANIVERSARIANTES */}
              <div className="tech-sidebar-card glass-effect">
                <div className="card-header-tech">
                  <h3>🎂 Aniversariantes</h3>
                  <span className="month-badge">Janeiro</span>
                </div>
                <ul className="tech-birthday-list">
                  {aniversariantes.map((bday, index) => (
                    <li key={index} className="tech-birthday-item">
                      <div className="tech-bday-avatar">{bday.foto}</div>
                      <div className="tech-bday-info">
                        <strong>{bday.nome}</strong>
                        <span>{bday.setor}</span>
                      </div>
                      <div className="tech-bday-date">{bday.dia}</div>
                    </li>
                  ))}
                </ul>
                <button 
                  className="tech-btn-congrats" 
                  onClick={handleEnviarParabens}
                  disabled={enviandoParabens}
                >
                  {enviandoParabens ? 'Enviando...' : 'Parabéns Geral 🎉'}
                </button>
              </div>

              {/* CARD LINKS ÚTEIS */}
              <div className="tech-sidebar-card glass-effect">
                <div className="card-header-tech">
                  <h3>🔗 Links Rápidos</h3>
                </div>
                <ul className="tech-quick-links">
                  
                  {/* Link 1: Navega para a página interna fictícia (MANTIDO) */}
                  <li>
                    <a href="#" onClick={(e) => { e.preventDefault(); navigate('/portal-cliente'); }}>
                      Documentações do Colaborador
                    </a>
                  </li>

                  {/* Link NOVO: Abre o Modal de Documentações / POP (ADICIONADO) */}
                  <li>
                    <a href="#" onClick={(e) => { e.preventDefault(); setShowModalDocs(true); }}>
                      📚 Manuais e Procedimentos (POP)
                    </a>
                  </li>

                  {/* Link 2: Abre o LinkedIn real em nova aba (MANTIDO) */}
                  <li>
                    <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">
                      LinkedIn Oficial
                    </a>
                  </li>

                  {/* Link 3: Abre o Modal de Ética (MANTIDO) */}
                  <li>
                    <a href="#" onClick={(e) => { e.preventDefault(); setShowModalEtica(true); }}>
                      Código de Ética e Conduta
                    </a>
                  </li>

                </ul>
              </div>

            </aside>

          </div>
        </div>
      </div>
    </div>
  );
}