import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { useUser } from '../../contexts/UserContext';
import { db } from '../../firebase';
import { ref, onValue, update } from 'firebase/database';
import './Conciliacao.css';

export default function Conciliacao() {
  const { user } = useUser();
  const navigate = useNavigate();
  
  // --- ESTADOS DE DADOS ---
  const [faturas, setFaturas] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADO DO MODO APRESENTAÇÃO ---
  const [modoApresentacaoAtivo, setModoApresentacaoAtivo] = useState(false);
  
  // --- ESTADOS DE INTERAÇÃO ---
  const [busca, setBusca] = useState('');
  const [faturaSelecionada, setFaturaSelecionada] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // --- CAMPOS DO FORMULÁRIO MANUAL ---
  const [inputCodigo, setInputCodigo] = useState('');
  const [arquivoUpload, setArquivoUpload] = useState(null);
  const [erroValidacao, setErroValidacao] = useState('');
  const [dataPagamento, setDataPagamento] = useState('');
  const [bancoDestino, setBancoDestino] = useState('');

  // 1. CARREGAR DADOS + OUVIR MODO APRESENTAÇÃO
  useEffect(() => {
    if (!user) return;

    // A. Escuta faturas
    const faturasRef = ref(db, `users/${user.uid}/financeiro/faturas`);
    const unsubscribeFaturas = onValue(faturasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let lista = [];
        if (Array.isArray(data)) {
          lista = data.map((item, index) => ({ ...item, firebaseKey: index }));
        } else {
          lista = Object.keys(data).map(key => ({ ...data[key], firebaseKey: key }));
        }
        lista.sort((a, b) => (a.status === 'Pendente' ? -1 : 1));
        setFaturas(lista);
      } else {
        setFaturas([]);
      }
      setLoading(false);
    });

    // B. Escuta o "Controle Remoto"
    const demoRef = ref(db, 'configuracoes_globais/modo_apresentacao');
    const unsubscribeDemo = onValue(demoRef, (snapshot) => {
      setModoApresentacaoAtivo(!!snapshot.val());
    });

    return () => {
      unsubscribeFaturas();
      unsubscribeDemo();
    };
  }, [user]);

  // 2. LÓGICA DO ROBÔ (EXECUÇÃO EM MASSA)
  const executarAutomacaoEmMassa = async () => {
    // Pega todas as pendentes atuais
    const pendentes = faturas.filter(f => f.status === 'Pendente');
    
    if (pendentes.length === 0) {
      alert("Nenhuma fatura pendente para processar!");
      return;
    }

    const updates = {};
    const timestamp = new Date().toISOString();

    // Monta o pacote de atualizações para TUDO de uma vez
    pendentes.forEach(fatura => {
        const path = `users/${user.uid}/financeiro/faturas/${fatura.firebaseKey}`;
        
        updates[`${path}/status`] = 'Conciliado';
        updates[`${path}/dataBaixa`] = timestamp;
        updates[`${path}/bancoDestino`] = 'Horizon Bank (Automático)';
        updates[`${path}/auditoria`] = {
            validadoPor: '🤖 Robô de Automação (RPA)',
            metodo: 'Conciliação em Lote (Batch)',
            hashValidado: fatura.codigoHash, // O Robô "lê" o hash correto automaticamente
            arquivoComprovante: 'comprovante_automatico_lote.pdf',
            dataAuditoria: timestamp
        };
    });

    try {
        await update(ref(db), updates);
        // Não precisa de alert, a atualização visual será instantânea via socket
    } catch (error) {
        alert("Erro na automação: " + error.message);
    }
  };

  // 3. FILTROS E MODAL MANUAL (O PROCESSO "CHATO")
  const faturasFiltradas = faturas.filter(fatura => {
    const termo = busca.toLowerCase();
    const valorString = fatura.valor ? fatura.valor.toString() : '';
    return (
      (fatura.cliente && fatura.cliente.toLowerCase().includes(termo)) ||
      (fatura.id && fatura.id.toLowerCase().includes(termo)) ||
      (fatura.nfe && fatura.nfe.toLowerCase().includes(termo)) ||
      valorString.includes(termo)
    );
  });

  const solicitarBaixaManual = (fatura) => {
    if (fatura.firebaseKey === undefined) return;
    setFaturaSelecionada(fatura);
    // Limpa campos para obrigar o usuário a digitar (demonstrar trabalho manual)
    setDataPagamento('');
    setBancoDestino('');
    setInputCodigo('');
    setArquivoUpload(null);
    setErroValidacao('');
    setShowModal(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) setArquivoUpload(file);
  };

  const confirmarBaixaManual = async (e) => {
    e.preventDefault();
    if (!faturaSelecionada) return;
    setErroValidacao('');

    // Validação Manual Rigorosa
    const hashCorreto = faturaSelecionada.codigoHash;
    if (!inputCodigo || inputCodigo.trim().toUpperCase() !== hashCorreto) {
      setErroValidacao(`❌ Código incorreto! (Dica: é ${hashCorreto})`);
      return;
    }

    if (!arquivoUpload) {
      setErroValidacao('❌ Anexe o comprovante PDF.');
      return;
    }

    const key = faturaSelecionada.firebaseKey;
    const updates = {};
    const basePath = `users/${user.uid}/financeiro/faturas/${key}`;
    
    updates[`${basePath}/status`] = 'Conciliado';
    updates[`${basePath}/dataBaixa`] = dataPagamento || new Date().toISOString();
    updates[`${basePath}/bancoDestino`] = bancoDestino;
    updates[`${basePath}/auditoria`] = {
      validadoPor: 'Usuario Financeiro',
      metodo: 'Manual (Humano)',
      hashValidado: inputCodigo,
      arquivoComprovante: arquivoUpload.name,
      dataAuditoria: new Date().toISOString()
    };
    
    await update(ref(db), updates);
    setShowModal(false);
    setFaturaSelecionada(null);
  };

  return (
    <div className="tech-layout">
      <div className="ambient-light light-1"></div>
      <Sidebar />

      <main className="tech-main">
        <header className="tech-header">
          <div className="header-content">
            <h1>Conciliação Financeira</h1>
            <p>Auditoria Cruzada e Baixa de Títulos</p>
          </div>
          <div className="tech-profile">
             <div className="profile-info"><span className="name">Financeiro</span></div>
             <div className="profile-avatar">FN</div>
          </div>
        </header>

        <div className="tech-scroll-content">
          
          {/* ÁREA MÁGICA: SÓ APARECE SE O MODO ESTIVER ATIVO */}
          {modoApresentacaoAtivo && (
             <div style={{
               background: 'linear-gradient(90deg, #059669 0%, #047857 100%)',
               padding: '20px',
               borderRadius: '12px',
               marginBottom: '25px',
               color: 'white',
               boxShadow: '0 10px 25px rgba(5, 150, 105, 0.4)',
               display: 'flex',
               justifyContent: 'space-between',
               alignItems: 'center',
               border: '1px solid #34d399'
             }}>
               <div>
                 <h2 style={{margin:0, fontSize:'1.4rem'}}>🚀 Automação Disponível</h2>
                 <p style={{margin:'5px 0 0 0', opacity:0.9, fontSize:'0.9rem'}}>
                   O robô identificou {faturas.filter(f => f.status === 'Pendente').length} pendências prontas para processamento.
                 </p>
               </div>
               <button 
                 onClick={executarAutomacaoEmMassa}
                 className="btn-magic-tech"
                 style={{
                   background: 'white',
                   color: '#059669',
                   border: 'none',
                   padding: '12px 24px',
                   borderRadius: '8px',
                   fontWeight: 'bold',
                   fontSize: '1rem',
                   cursor: 'pointer',
                   boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                   transition: 'transform 0.2s',
                   textTransform: 'uppercase'
                 }}
                 onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                 onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
               >
                 ⚡ Processar Tudo Agora
               </button>
             </div>
          )}

          <div className="search-bar-container" style={{marginBottom: '20px'}}>
            <input 
              type="text" 
              placeholder="🔍 Buscar..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="search-input-tech"
              style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: 'rgba(15,23,42,0.6)', color: 'white'}}
            />
          </div>

          <div className="tech-card-table-wrapper">
            {loading ? (
              <p style={{padding:'20px', color:'white'}}>Conectando...</p>
            ) : faturasFiltradas.length === 0 ? (
              <div className="empty-state-tech">
                <div className="empty-icon">✅</div>
                <h3>Tudo Conciliado!</h3>
                <p>Nenhuma pendência financeira encontrada.</p>
              </div>
            ) : (
              <table className="tech-table">
                <thead>
                  <tr>
                    <th>Doc. Interno</th>
                    <th>Cliente</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Processo Manual</th>
                  </tr>
                </thead>
                <tbody>
                  {faturasFiltradas.map((fatura, idx) => (
                    <tr key={idx} className={fatura.status === 'Conciliado' ? 'row-conciliado' : ''}>
                      <td style={{color:'#94a3b8'}}>{fatura.id}</td>
                      <td><strong>{fatura.cliente}</strong></td>
                      <td className="col-valor">
                        {Number(fatura.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td>
                        <span className={`status-badge ${fatura.status.toLowerCase()}`}>
                          {fatura.status}
                        </span>
                      </td>
                      <td>
                        {fatura.status === 'Pendente' && (
                           // Botão Manual SEMPRE disponível (para mostrar o jeito "velho")
                           <button className="btn-action-tech" onClick={() => solicitarBaixaManual(fatura)}>
                             Auditar
                           </button>
                        )}
                        {fatura.status === 'Conciliado' && <span style={{color:'#10b981'}}>✔ Concluído</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* MODAL MANUAL (Mantido para a demo do "antes") */}
      {showModal && faturaSelecionada && (
        <div className="modal-overlay-tech">
          <div className="modal-glass" style={{maxWidth: '600px'}}>
            <div className="modal-header">
              <h3>✍️ Auditoria Manual</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
              <div className="step-box completed" style={{background:'rgba(245, 158, 11, 0.1)', border:'1px solid #f59e0b', padding:'15px'}}>
                 <strong style={{color:'#fbbf24'}}>PROCESSO HUMANO:</strong>
                 <p style={{fontSize:'0.85rem', margin:'5px 0 0 0', color:'#e2e8f0'}}>
                   Localize a transação no banco, verifique o código Hash e faça o upload.
                 </p>
              </div>

              <form onSubmit={confirmarBaixaManual} className="form-tech">
                <div className="form-group-tech">
                    <label style={{color:'#f59e0b'}}>Digite o Hash (Doc: {faturaSelecionada.codigoHash})</label>
                    <input 
                        type="text" 
                        value={inputCodigo} 
                        onChange={(e) => setInputCodigo(e.target.value)} 
                        className="input-highlight"
                        style={{textAlign:'center', textTransform:'uppercase'}}
                    />
                </div>

                <div className="form-group-tech" style={{marginTop:'15px'}}>
                   <label>Upload Manual do PDF</label>
                   <input type="file" onChange={handleFileUpload} className="file-input-tech" accept=".pdf,.jpg,.png" />
                </div>
                
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginTop: '15px'}}>
                    <div className="form-group-tech">
                        <label>Data</label>
                        <input type="date" value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} required />
                    </div>
                    <div className="form-group-tech">
                        <label>Banco</label>
                        <select value={bancoDestino} onChange={(e) => setBancoDestino(e.target.value)} required>
                            <option value="">Selecione...</option>
                            <option value="horizon">Horizon Bank</option>
                            <option value="caixa">Caixa</option>
                        </select>
                    </div>
                </div>

                {erroValidacao && (
                    <p style={{color:'#fca5a5', textAlign: 'center', fontWeight: 'bold', marginTop:'10px'}}>{erroValidacao}</p>
                )}

                <div className="modal-actions-tech" style={{marginTop:'25px'}}>
                  <button type="submit" className="btn-save-tech" style={{width:'100%'}}>
                    Salvar Manualmente
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}