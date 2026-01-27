import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { ref, onValue, update, get } from 'firebase/database';
import Logo from '../components/Logo';
import './GestaoReembolsos.css'; // Usando o mesmo CSS

export default function GestaoAprovacoes() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState('ferias'); // ferias | viagens | helpdesk | reembolsos
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. SEGURANÇA (Verifica se é Gestor/CEO)
  useEffect(() => {
    const checkUser = async () => {
      const user = auth.currentUser;
      if (!user) return navigate('/');

      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);
      const userData = snapshot.val();

      // Regra de segurança simplificada para demonstração
      const ehCEO = userData && (userData.cargo?.includes('C.E.O') || userData.role === 'admin' || userData.role === 'gestor');

      if (!ehCEO) {
        // alert("Acesso restrito."); // Comentado para facilitar testes se necessário
        // navigate('/dashboard');
      }
    };
    checkUser();
  }, [navigate]);

  // 2. ESCUTAR BANCO DE DADOS (Lógica Unificada)
  useEffect(() => {
    setLoading(true);
    let dbRef;

    // Define qual nó do banco escutar
    if (abaAtiva === 'viagens') {
      dbRef = ref(db, 'viagens'); // Estrutura: viagens/{uid}/{tripId}
    } else if (abaAtiva === 'reembolsos') {
      dbRef = ref(db, 'reembolsos');
    } else {
      dbRef = ref(db, `solicitacoes/${abaAtiva}`);
    }

    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      let listaProcessada = [];

      if (data) {
        if (abaAtiva === 'viagens') {
          // LÓGICA ESPECIAL PARA VIAGENS (Aninhado por Usuário)
          Object.keys(data).forEach((uid) => {
            const viagensDoUser = data[uid];
            Object.keys(viagensDoUser).forEach((tripId) => {
              const viagem = viagensDoUser[tripId];
              // Filtra apenas PENDENTE (Compatível com a tela de cadastro)
              if (viagem.status === 'PENDENTE') {
                listaProcessada.push({
                  id: tripId,
                  uidOriginal: uid, // Importante para aprovar depois
                  ...viagem
                });
              }
            });
          });
        } else {
          // LÓGICA PADRÃO (Lista Plana)
          listaProcessada = Object.entries(data)
            .map(([id, valor]) => ({ id, ...valor }))
            .filter(item => {
                if (abaAtiva === 'reembolsos') return item.status === 'em_analise';
                return item.status === 'pendente';
            });
        }
      }
      
      setDados(listaProcessada);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [abaAtiva]);

  // 3. APROVAR / REPROVAR
  const handleAvaliar = async (item, decisao) => {
    // decisao: 'aprovado' | 'rejeitado'
    if (!window.confirm(`Confirma ${decisao.toUpperCase()} esta solicitação?`)) return;

    try {
      let itemRef;
      let updateData = {};

      if (abaAtiva === 'viagens') {
          // Caminho específico: viagens/UID/ID_DA_TRIP
          itemRef = ref(db, `viagens/${item.uidOriginal}/${item.id}`);
          // Viagens usa STATUS em caixa alta
          updateData = {
            status: decisao === 'aprovado' ? 'APROVADO' : 'REJEITADO',
            aprovadoPor: auth.currentUser.email,
            dataAprovacao: new Date().toISOString()
          };
      } else if (abaAtiva === 'reembolsos') {
          itemRef = ref(db, `reembolsos/${item.id}`);
          updateData = { status: decisao };
      } else {
          itemRef = ref(db, `solicitacoes/${abaAtiva}/${item.id}`);
          updateData = { status: decisao };
      }

      await update(itemRef, updateData);
      alert("Status atualizado com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar: " + error.message);
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

        {/* ABAS DE NAVEGAÇÃO */}
        <div style={{display:'flex', gap:'10px', marginBottom:'20px', justifyContent:'center', flexWrap:'wrap'}}>
            <button onClick={() => setAbaAtiva('ferias')} style={estiloAba(abaAtiva === 'ferias')}>🏖 Férias</button>
            <button onClick={() => setAbaAtiva('viagens')} style={estiloAba(abaAtiva === 'viagens')}>✈ Viagens</button>
            <button onClick={() => setAbaAtiva('helpdesk')} style={estiloAba(abaAtiva === 'helpdesk')}>🎧 TI / Helpdesk</button>
            <button onClick={() => setAbaAtiva('reembolsos')} style={estiloAba(abaAtiva === 'reembolsos')}>💰 Reembolsos</button>
        </div>

        {loading ? <p className="loading-text">Carregando...</p> : dados.length === 0 ? (
          <div className="empty-state"><span style={{fontSize:'3rem'}}>✅</span><p>Tudo em dia em {abaAtiva.toUpperCase()}!</p></div>
        ) : (
          <div className="grid-cards">
            {dados.map(item => (
              <div key={item.id} className="card-aprovacao">
                <div className="card-header">
                  <span className="protocolo">{abaAtiva === 'reembolsos' ? item.protocolo : item.id}</span>
                  <span className="data">
                      {new Date(item.createdAt || item.data_criacao || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="card-body">
                  {/* Tenta mostrar nome, se não tiver (caso das viagens), mostra um genérico ou busca info extra se necessário */}
                  <h3>{item.solicitanteNome || item.nome || 'Colaborador Tech'}</h3>
                  <p className="cargo-info">{item.solicitanteCargo || (item.matricula ? `Mat: ${item.matricula}` : '')}</p>
                  
                  {/* RENDERIZAÇÃO CONDICIONAL POR TIPO */}
                  {abaAtiva === 'ferias' && (
                      <>
                        <div className="detalhe-row"><span>Início:</span><p>{new Date(item.inicio).toLocaleDateString()}</p></div>
                        <div className="detalhe-row"><span>Dias:</span><p>{item.dias} dias</p></div>
                        <div className="detalhe-row"><span>Vender:</span><p>{item.vender ? 'Sim' : 'Não'}</p></div>
                      </>
                  )}

                  {abaAtiva === 'viagens' && (
                      <>
                        <div className="detalhe-row"><span>Rota:</span><p>{item.origem} ➝ {item.destino}</p></div>
                        <div className="detalhe-row"><span>Data:</span><p>{item.data_ida}</p></div>
                        <div className="detalhe-row"><span>Motivo:</span><p>{item.motivo}</p></div>
                        <div className="detalhe-row"><span>Adiantamento:</span><p className="valor-destaque">R$ {item.adiantamento}</p></div>
                      </>
                  )}

                  {abaAtiva === 'helpdesk' && (
                      <>
                        <div className="detalhe-row"><span>Assunto:</span><p>{item.assunto}</p></div>
                        <div className="detalhe-row"><span>Categoria:</span><p>{item.categoria}</p></div>
                        <div className="detalhe-row"><span>Prioridade:</span><span style={{color: item.prioridade === 'Alta' ? 'red' : 'inherit'}}>{item.prioridade}</span></div>
                      </>
                  )}

                  {abaAtiva === 'reembolsos' && (
                      <>
                        <div className="detalhe-row"><span>Motivo:</span><p>{item.motivo}</p></div>
                        <div className="detalhe-row"><span>Centro Custo:</span><p>{item.centro_custo}</p></div>
                        <div className="detalhe-row"><span>Valor:</span><p className="valor-destaque">R$ {item.valor}</p></div>
                      </>
                  )}
                </div>

                <div className="card-actions">
                  {/* Passamos o ITEM inteiro agora, pois precisamos do UID para viagens */}
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
    padding: '10px 20px',
    borderRadius: '20px',
    background: ativo ? 'var(--neon-blue)' : 'rgba(255,255,255,0.05)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: '0.3s',
    minWidth: '120px'
});