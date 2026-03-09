import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { ref, onValue, update, get } from 'firebase/database';
import Logo from '../components/Logo';
import { useAlert } from '../contexts/AlertContext'; 
import { useUser } from '../contexts/UserContext'; 
import './GestaoReembolsos.css';

export default function GestaoAprovacoes() {
  const navigate = useNavigate();
  const { showToast, showAlert } = useAlert(); 
  
  // PEGANDO DIRETAMENTE AS STRINGS DO DEVTOOLS PARA NÃO FALHAR
  const { realRole, simulatedRole } = useUser(); 
  const roleAtiva = simulatedRole || realRole;
  
  // REGRA DE OURO: Somente Admin (ou Dev, para vocês não se trancarem fora) podem ver
  const isSuperAdmin = roleAtiva === 'admin' || roleAtiva === 'dev';
  
  const [abaAtiva, setAbaAtiva] = useState('ferias');
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS DO MODAL INTERNO ---
  const [modalAcao, setModalAcao] = useState({ isOpen: false, type: '', title: '', message: '', item: null, decisao: '' });
  const [motivoRejeicao, setMotivoRejeicao] = useState('');

  // 1. SEGURANÇA
  useEffect(() => {
    const checkUser = async () => {
      const user = auth.currentUser;
      if (!user) return navigate('/');
    };
    checkUser();
  }, [navigate]);

  const isPendente = (s) => {
      if (!s) return true;
      return ['pendente', 'em analise', 'em_analise', 'em análise', 'solicitado', 'aguardando', 'aberto'].includes(s.toLowerCase());
  };

  // 2. BUSCA INTELIGENTE DE DADOS
  useEffect(() => {
    // 🔒 TRAVA DE SEGURANÇA ATIVA DO DEVTOOLS
    // Se o usuário não for CEO/Dev e tentar acessar reembolsos, é chutado para a aba de Férias.
    if (abaAtiva === 'reembolsos' && !isSuperAdmin) {
        setAbaAtiva('ferias');
        return;
    }

    setLoading(true);
    setDados([]); 
    
    let dbRef;
    if (abaAtiva === 'viagens') {
        dbRef = ref(db, 'viagens'); 
    } else if (abaAtiva === 'reembolsos') {
        dbRef = ref(db, 'reembolsos'); 
    } else {
        dbRef = ref(db, `solicitacoes/${abaAtiva}`);
    }

    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      let lista = [];

      if (data) {
        if (abaAtiva === 'viagens') {
          Object.keys(data).forEach((uidUsuario) => {
            const viagensUser = data[uidUsuario];
            if (viagensUser) {
                Object.keys(viagensUser).forEach((chaveFirebase) => {
                  const viagem = viagensUser[chaveFirebase];
                  if (isPendente(viagem.status)) {
                    lista.push({ ...viagem, firebaseKey: chaveFirebase, uidOriginal: uidUsuario });
                  }
                });
            }
          });
        } else {
          lista = Object.entries(data)
            .map(([chaveFirebase, valor]) => ({ ...valor, firebaseKey: chaveFirebase, id: valor.protocolo || valor.id || chaveFirebase }))
            .filter(item => isPendente(item.status));
        }
      }
      
      lista.sort((a, b) => {
          const dA = new Date(a.createdAt || a.data_criacao || a.data_ida || 0);
          const dB = new Date(b.createdAt || b.data_criacao || b.data_ida || 0);
          return dB - dA;
      });

      setDados(lista);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [abaAtiva, isSuperAdmin]);

  // 3. ABRE O MODAL LOCAL
  const handleAvaliarClick = (item, decisao) => {
    const isAprovando = decisao === 'aprovado';
    const nomeSolicitante = item.solicitanteNome || item.nome || item.userEmail || 'Colaborador';

    setMotivoRejeicao(''); // Limpa o input
    setModalAcao({
        isOpen: true,
        type: isAprovando ? 'confirm' : 'prompt',
        title: `${isAprovando ? 'Aprovar' : 'Rejeitar'} Solicitação`,
        message: isAprovando 
            ? `Deseja realmente APROVAR esta solicitação de ${nomeSolicitante}?` 
            : `Por favor, indique o motivo para rejeitar a solicitação de ${nomeSolicitante}:`,
        item,
        decisao
    });
  };

  // 4. CONFIRMA A AÇÃO E SALVA NO BANCO
  const confirmarAcao = async () => {
    const { item, decisao } = modalAcao;
    const isAprovando = decisao === 'aprovado';
    const motivo = motivoRejeicao;

    // Remove da tela imediatamente (Otimismo UI)
    setDados(prev => prev.filter(d => d.firebaseKey !== item.firebaseKey));
    setModalAcao({ isOpen: false, type: '', title: '', message: '', item: null, decisao: '' }); // Fecha o modal

    try {
      let itemRef;
      let updateData = {};
      const user = auth.currentUser;

      // Usando "avaliadoPor" como combinamos na correção visual
      if (abaAtiva === 'viagens') {
          itemRef = ref(db, `viagens/${item.uidOriginal}/${item.firebaseKey}`);
          updateData = { status: isAprovando ? 'APROVADO' : 'REJEITADO', avaliadoPor: user.email, dataAvaliacao: new Date().toISOString() };
          if (!isAprovando) updateData.observacao = motivo;
      } else if (abaAtiva === 'reembolsos') {
          itemRef = ref(db, `reembolsos/${item.firebaseKey}`);
          updateData = { status: decisao, avaliadoPor: user.uid };
          if (!isAprovando) updateData.motivoReprovacao = motivo;
      } else {
          itemRef = ref(db, `solicitacoes/${abaAtiva}/${item.firebaseKey}`);
          if (abaAtiva === 'helpdesk') {
              updateData = { status: isAprovando ? 'em_andamento' : 'cancelado', atendidoPor: user.uid };
              if (!isAprovando) updateData.motivoCancelamento = motivo;
          } else {
              updateData = { status: decisao, avaliadoPor: user.uid };
              if (!isAprovando) updateData.motivoReprovacao = motivo;
          }
      }

      await update(itemRef, updateData);
      showToast(isAprovando ? 'Aprovado!' : 'Rejeitado!', `A solicitação foi ${isAprovando ? 'aprovada' : 'negada'} com sucesso.`, isAprovando ? 'success' : 'warning');
      
    } catch (error) {
      console.error(error);
      showAlert("Erro", "Erro ao salvar. A página será recarregada.");
      window.location.reload();
    }
  };

  return (
    <div className="gestao-layout">
      <div className="ambient-light light-1"></div>
      <header className="tech-header-glass">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
           <span className="page-title">Central de Aprovações</span>
        </div>
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>Voltar ↩</button>
      </header>

      <div className="gestao-container">
        <h2 className="page-title-neon">Pendências da Diretoria</h2>

        <div style={{display:'flex', gap:'10px', marginBottom:'20px', justifyContent:'center', flexWrap:'wrap'}}>
            <button onClick={() => setAbaAtiva('ferias')} style={estiloAba(abaAtiva === 'ferias')}>🏖 Férias</button>
            <button onClick={() => setAbaAtiva('viagens')} style={estiloAba(abaAtiva === 'viagens')}>✈ Viagens</button>
            <button onClick={() => setAbaAtiva('helpdesk')} style={estiloAba(abaAtiva === 'helpdesk')}>🎧 Helpdesk</button>
            
            {/* O BOTÃO SÓ APARECE SE O USUÁRIO FOR O CEO/DEV */}
            {isSuperAdmin && (
              <button onClick={() => setAbaAtiva('reembolsos')} style={estiloAba(abaAtiva === 'reembolsos')}>💰 Reembolsos</button>
            )}
        </div>

        {loading ? (
            <div className="loading-container"><span className="tech-spinner">🔄</span><p>Carregando...</p></div>
        ) : dados.length === 0 ? (
          <div className="empty-state"><span style={{fontSize:'3rem'}}>✅</span><p>Tudo limpo em {abaAtiva.toUpperCase()}!</p></div>
        ) : (
          <div className="grid-cards">
            {dados.map(item => (
              <div key={item.firebaseKey} className="card-aprovacao">
                <div className="card-header">
                  <span className="protocolo">{(item.protocolo || item.id || 'ID').toString().substring(0,10).toUpperCase()}</span>
                  <span className="data">{new Date(item.createdAt || item.data_criacao || item.dataInicio || Date.now()).toLocaleDateString()}</span>
                </div>
                
                <div className="card-body">
                  <h3>{item.solicitanteNome || item.nome || item.userEmail || 'Colaborador'}</h3>
                  <p className="cargo-info">{item.solicitanteCargo || item.categoria || (item.matricula ? `Mat: ${item.matricula}` : 'TechTeam')}</p>
                  
                  {abaAtiva === 'ferias' && (
                      <><div className="detalhe-row"><span>Início:</span><p>{item.inicio ? new Date(item.inicio).toLocaleDateString() : '---'}</p></div>
                        <div className="detalhe-row"><span>Dias:</span><p>{item.dias} dias</p></div></>
                  )}
                  
                  {abaAtiva === 'viagens' && (
                      <><div className="detalhe-row"><span>Rota:</span><p>{item.origem} ➝ {item.destino}</p></div>
                        <div className="detalhe-row"><span>Motivo:</span><p>{item.motivo}</p></div>
                        <div className="detalhe-row"><span>Valor:</span><p className="valor-destaque">R$ {item.adiantamento || '0,00'}</p></div></>
                  )}
                  
                  {abaAtiva === 'helpdesk' && (
                      <>
                        <div className="detalhe-row"><span>Assunto:</span><p><strong>{item.titulo || item.assunto}</strong></p></div>
                        <div className="detalhe-row"><span>Categoria:</span><p>{item.categoria}</p></div>
                        <div className="detalhe-row"><span>Prioridade:</span><span style={{color: ['alta','critica'].includes(item.prioridade) ? 'red' : 'inherit'}}>{item.prioridade}</span></div>
                      </>
                  )}
                  
                  {abaAtiva === 'reembolsos' && (
                      <><div className="detalhe-row"><span>Motivo:</span><p>{item.motivo}</p></div>
                        <div className="detalhe-row"><span>Valor:</span><p className="valor-destaque">R$ {item.valor}</p></div></>
                  )}
                </div>

                <div className="card-actions">
                  <button className="btn-reject" onClick={() => handleAvaliarClick(item, 'rejeitado')}>✖ {abaAtiva === 'helpdesk' ? 'Cancelar' : 'Negar'}</button>
                  <button className="btn-approve" onClick={() => handleAvaliarClick(item, 'aprovado')}>✔ {abaAtiva === 'helpdesk' ? 'Atender' : 'Aprovar'}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL INTERNO --- */}
      {modalAcao.isOpen && (
        <div className="local-modal-overlay">
          <div className="local-modal-box glass-effect">
            <h3 className="local-modal-title">{modalAcao.title}</h3>
            <p className="local-modal-message">{modalAcao.message}</p>

            {modalAcao.type === 'prompt' && (
              <textarea 
                className="local-modal-input" 
                placeholder="Escreva o motivo aqui..."
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                rows={3}
                autoFocus
              />
            )}

            <div className="local-modal-actions">
              <button 
                className="btn-reject" 
                style={{flex: 1}} 
                onClick={() => setModalAcao({ isOpen: false, type: '', title: '', message: '', item: null, decisao: '' })}
              >
                Cancelar
              </button>
              <button 
                className="btn-approve" 
                style={{flex: 1, opacity: (modalAcao.type === 'prompt' && !motivoRejeicao.trim()) ? 0.5 : 1}}
                onClick={confirmarAcao}
                disabled={modalAcao.type === 'prompt' && !motivoRejeicao.trim()}
              >
                {modalAcao.type === 'prompt' ? 'Confirmar Rejeição' : 'Confirmar Aprovação'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const estiloAba = (ativo) => ({
    padding: '10px 20px', borderRadius: '20px',
    background: ativo ? 'var(--neon-blue)' : 'rgba(255,255,255,0.05)',
    color: 'white', border: ativo ? '1px solid var(--neon-blue)' : '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer', fontWeight: 'bold', transition: '0.3s', minWidth: '120px'
});