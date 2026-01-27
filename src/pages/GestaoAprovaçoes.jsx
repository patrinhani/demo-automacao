import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { ref, onValue, update, get } from 'firebase/database';
import Logo from '../components/Logo';
import './GestaoReembolsos.css';

export default function GestaoAprovacoes() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState('ferias');
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Segurança
  useEffect(() => {
    const checkUser = async () => {
      const user = auth.currentUser;
      if (!user) return navigate('/');
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);
      const userData = snapshot.val();
      const ehCEO = userData && (userData.cargo?.includes('C.E.O') || userData.role === 'admin' || userData.role === 'gestor');
      if (!ehCEO) {
         // alert("Acesso restrito."); 
      }
    };
    checkUser();
  }, [navigate]);

  // Helper de Status
  const isPendente = (s) => {
      if (!s) return true;
      return ['pendente', 'em analise', 'em análise', 'solicitado', 'aguardando'].includes(s.toLowerCase());
  };

  // 2. Busca de Dados
  useEffect(() => {
    setLoading(true);
    setDados([]); 
    
    let dbRef;
    if (abaAtiva === 'viagens') dbRef = ref(db, 'viagens');
    else if (abaAtiva === 'reembolsos') dbRef = ref(db, 'reembolsos');
    else dbRef = ref(db, `solicitacoes/${abaAtiva}`);

    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      let lista = [];

      if (data) {
        if (abaAtiva === 'viagens') {
          // Flatten Viagens
          Object.keys(data).forEach((uid) => {
            const viagensUser = data[uid];
            if (viagensUser) {
                Object.keys(viagensUser).forEach((tripId) => {
                  const viagem = viagensUser[tripId];
                  if (isPendente(viagem.status)) {
                    lista.push({ id: tripId, uidOriginal: uid, ...viagem });
                  }
                });
            }
          });
        } else {
          // Flatten Padrão
          lista = Object.entries(data)
            .map(([id, valor]) => ({ id, ...valor }))
            .filter(item => isPendente(item.status));
        }
      }
      
      // Ordenação
      lista.sort((a, b) => {
          const dA = new Date(a.createdAt || a.data_criacao || a.dataInicio || 0);
          const dB = new Date(b.createdAt || b.data_criacao || b.dataInicio || 0);
          return dB - dA;
      });

      setDados(lista);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [abaAtiva]);

  // 3. Ação de Aprovar
  const handleAvaliar = async (item, decisao) => {
    if (!window.confirm(`Confirma ${decisao.toUpperCase()} esta solicitação?`)) return;

    // --- OTIMISMO: Remove da tela imediatamente ---
    setDados(prev => prev.filter(d => d.id !== item.id));

    try {
      let itemRef;
      let updateData = {};
      const user = auth.currentUser;

      if (abaAtiva === 'viagens') {
          if (!item.uidOriginal) throw new Error("ID de usuário não encontrado na viagem.");
          itemRef = ref(db, `viagens/${item.uidOriginal}/${item.id}`);
          updateData = {
            status: decisao === 'aprovado' ? 'APROVADO' : 'REJEITADO',
            aprovadoPor: user.email,
            dataAprovacao: new Date().toISOString()
          };
      } else if (abaAtiva === 'reembolsos') {
          itemRef = ref(db, `reembolsos/${item.id}`);
          updateData = { 
              status: decisao, 
              avaliadoPor: user.uid,
              dataAvaliacao: new Date().toISOString()
          };
      } else {
          itemRef = ref(db, `solicitacoes/${abaAtiva}/${item.id}`);
          updateData = { 
              status: decisao,
              avaliadoPor: user.uid,
              dataAvaliacao: new Date().toISOString()
          };
      }

      await update(itemRef, updateData);
      // alert("Sucesso!"); // Opcional, já removemos visualmente
      
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar no banco: " + error.message);
      // Se der erro, recarregamos a página para voltar o item (fallback simples)
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
            <button onClick={() => setAbaAtiva('helpdesk')} style={estiloAba(abaAtiva === 'helpdesk')}>🎧 TI / Helpdesk</button>
            <button onClick={() => setAbaAtiva('reembolsos')} style={estiloAba(abaAtiva === 'reembolsos')}>💰 Reembolsos</button>
        </div>

        {loading ? (
            <div className="loading-container"><span className="tech-spinner">🔄</span><p>Carregando...</p></div>
        ) : dados.length === 0 ? (
          <div className="empty-state"><span style={{fontSize:'3rem'}}>✅</span><p>Tudo limpo em {abaAtiva.toUpperCase()}!</p></div>
        ) : (
          <div className="grid-cards">
            {dados.map(item => (
              <div key={item.id} className="card-aprovacao">
                <div className="card-header">
                  <span className="protocolo">{abaAtiva === 'reembolsos' ? (item.protocolo || item.id.slice(-6)) : item.id.slice(-8).toUpperCase()}</span>
                  <span className="data">{new Date(item.createdAt || item.data_criacao || item.dataInicio || Date.now()).toLocaleDateString()}</span>
                </div>
                
                <div className="card-body">
                  <h3>{item.solicitanteNome || item.nome || 'Colaborador'}</h3>
                  <p className="cargo-info">{item.solicitanteCargo || (item.matricula ? `Mat: ${item.matricula}` : 'TechTeam')}</p>
                  
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
                      <><div className="detalhe-row"><span>Assunto:</span><p>{item.assunto}</p></div>
                        <div className="detalhe-row"><span>Prioridade:</span><span style={{color:'red'}}>{item.prioridade}</span></div></>
                  )}
                  {abaAtiva === 'reembolsos' && (
                      <><div className="detalhe-row"><span>Motivo:</span><p>{item.motivo}</p></div>
                        <div className="detalhe-row"><span>Valor:</span><p className="valor-destaque">R$ {item.valor}</p></div></>
                  )}
                </div>

                <div className="card-actions">
                  <button className="btn-reject" onClick={() => handleAvaliar(item, 'rejeitado')}>✖ Negar</button>
                  <button className="btn-approve" onClick={() => handleAvaliar(item, 'aprovado')}>✔ Aprovar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const estiloAba = (ativo) => ({
    padding: '10px 20px', borderRadius: '20px',
    background: ativo ? 'var(--neon-blue)' : 'rgba(255,255,255,0.05)',
    color: 'white', border: ativo ? '1px solid var(--neon-blue)' : '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer', fontWeight: 'bold', transition: '0.3s', minWidth: '120px'
});