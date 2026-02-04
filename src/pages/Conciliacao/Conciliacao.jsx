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

  // --- O SEGREDO: ESTADO QUE ESCUTA O COMANDO DO TERMINAL ---
  const [modoApresentacaoAtivo, setModoApresentacaoAtivo] = useState(false);
  
  // --- ESTADOS DE INTERAÇÃO ---
  const [busca, setBusca] = useState('');
  const [faturaSelecionada, setFaturaSelecionada] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // --- CAMPOS DO FORMULÁRIO ---
  const [inputCodigo, setInputCodigo] = useState('');
  const [arquivoUpload, setArquivoUpload] = useState(null);
  const [erroValidacao, setErroValidacao] = useState('');

  // --- CAMPOS DE BAIXA ---
  const [dataPagamento, setDataPagamento] = useState('');
  const [bancoDestino, setBancoDestino] = useState('');

  // 1. CARREGAR DADOS + OUVIR O MODO APRESENTAÇÃO
  useEffect(() => {
    if (!user) return;

    // A. Escuta as faturas do usuário
    const faturasRef = ref(db, `users/${user.uid}/financeiro/faturas`);
    const unsubscribeFaturas = onValue(faturasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let lista = [];
        // Tratamento seguro de IDs (Array ou Objeto)
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

    // B. AQUI ESTÁ A MÁGICA: Escuta o comando global do seu terminal
    const demoRef = ref(db, 'configuracoes_globais/modo_apresentacao');
    const unsubscribeDemo = onValue(demoRef, (snapshot) => {
      const isAtivo = snapshot.val();
      setModoApresentacaoAtivo(!!isAtivo); // Atualiza a tela em tempo real
    });

    return () => {
      unsubscribeFaturas();
      unsubscribeDemo();
    };
  }, [user]);

  // 2. FILTRO DE BUSCA
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

  // 3. ABRIR MODAL
  const solicitarBaixa = (fatura) => {
    if (fatura.firebaseKey === undefined || fatura.firebaseKey === null) {
      alert("Erro de referência no banco de dados.");
      return;
    }
    setFaturaSelecionada(fatura);
    setDataPagamento('');
    setBancoDestino('');
    setInputCodigo('');
    setArquivoUpload(null);
    setErroValidacao('');
    setShowModal(true);
  };

  // 4. UPLOAD
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) setArquivoUpload(file);
  };

  // 5. CONFIRMAR E VALIDAR (COM VERIFICAÇÃO DE HASH)
  const confirmarBaixa = async (e) => {
    e.preventDefault();
    if (!faturaSelecionada) return;
    setErroValidacao('');

    // Validação Rigorosa do Código
    const hashCorreto = faturaSelecionada.codigoHash;
    if (!inputCodigo || inputCodigo.trim().toUpperCase() !== hashCorreto) {
      setErroValidacao(`❌ Código incorreto! O documento exige: ${hashCorreto}`);
      return;
    }

    if (!arquivoUpload) {
      setErroValidacao('❌ Anexe o comprovante PDF.');
      return;
    }

    const key = faturaSelecionada.firebaseKey;
    if (key === undefined || key === null) return;

    // Atualização no Firebase
    const updates = {};
    const basePath = `users/${user.uid}/financeiro/faturas/${key}`;
    
    updates[`${basePath}/status`] = 'Conciliado';
    updates[`${basePath}/dataBaixa`] = dataPagamento || new Date().toISOString();
    updates[`${basePath}/bancoDestino`] = bancoDestino;
    updates[`${basePath}/auditoria`] = {
      validadoPor: 'Usuario Financeiro',
      metodo: 'Automação Supervisionada',
      hashValidado: inputCodigo,
      arquivoComprovante: arquivoUpload.name,
      dataAuditoria: new Date().toISOString()
    };
    
    try {
      await update(ref(db), updates);
      setShowModal(false);
      setFaturaSelecionada(null);
    } catch (error) {
      alert("Erro ao salvar: " + error.message);
    }
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
          
          {/* BANNER QUE APARECE QUANDO VOCÊ DÁ O COMANDO */}
          {modoApresentacaoAtivo && (
             <div style={{
               background: 'linear-gradient(90deg, #059669 0%, #10b981 100%)',
               padding: '15px',
               borderRadius: '8px',
               marginBottom: '20px',
               color: 'white',
               fontWeight: 'bold',
               boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
               textAlign: 'center',
               textTransform: 'uppercase',
               letterSpacing: '1px',
               animation: 'pulse 2s infinite'
             }}>
               🚀 MODO DEMONSTRAÇÃO ATIVO: Automação liberada via Terminal
             </div>
          )}

          <div className="search-bar-container" style={{marginBottom: '20px'}}>
            <input 
              type="text" 
              placeholder="🔍 Buscar por Cliente, NF ou Valor..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="search-input-tech"
              style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: 'rgba(15,23,42,0.6)', color: 'white'}}
            />
          </div>

          <div className="tech-card-table-wrapper">
            {loading ? (
              <p style={{padding:'20px', color:'white'}}>Conectando ao banco de dados...</p>
            ) : faturasFiltradas.length === 0 ? (
              <div className="empty-state-tech">
                <div className="empty-icon">📂</div>
                <h3>Tudo em dia!</h3>
              </div>
            ) : (
              <table className="tech-table">
                <thead>
                  <tr>
                    <th>Doc. Interno</th>
                    <th>Cliente</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Ação (Automação)</th>
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
                          // LÓGICA DO BOTÃO: Só aparece se o modo estiver ATIVO
                          modoApresentacaoAtivo ? (
                            <button className="btn-action-tech" onClick={() => solicitarBaixa(fatura)}>
                              Auditar Agora
                            </button>
                          ) : (
                            <span style={{
                              fontSize:'0.75rem', 
                              color:'#64748b', 
                              border:'1px dashed #475569', 
                              padding:'4px 8px', 
                              borderRadius:'4px'
                            }}>
                              Aguardando Liberação...
                            </span>
                          )
                        )}
                        {fatura.status === 'Conciliado' && <span style={{color:'#10b981'}}>✔</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* MODAL DE AUDITORIA */}
      {showModal && faturaSelecionada && (
        <div className="modal-overlay-tech">
          <div className="modal-glass" style={{maxWidth: '600px'}}>
            <div className="modal-header">
              <h3>🛡️ Auditoria de Recebimento</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
              <div className="step-box completed" style={{background:'rgba(245, 158, 11, 0.1)', border:'1px solid #f59e0b', padding:'15px'}}>
                 <strong style={{color:'#fbbf24', fontSize:'0.9rem'}}>INSTRUÇÃO:</strong>
                 <p style={{fontSize:'0.85rem', margin:'5px 0 0 0', color:'#e2e8f0'}}>
                   Para validar esta transação de <strong>R$ {faturaSelecionada.valor.toFixed(2)}</strong>, insira o código de segurança do extrato.
                 </p>
              </div>

              <form onSubmit={confirmarBaixa} className="form-tech">
                <div className="form-group-tech">
                    <label style={{color:'#f59e0b'}}>Código Hash (Exigido: {faturaSelecionada.codigoHash})</label>
                    <input 
                        type="text" 
                        value={inputCodigo} 
                        onChange={(e) => setInputCodigo(e.target.value)} 
                        placeholder="Digite o código..." 
                        className="input-highlight"
                        style={{textAlign:'center', letterSpacing:'3px', fontWeight:'bold', textTransform:'uppercase'}}
                    />
                </div>

                <div className="form-group-tech" style={{marginTop:'15px'}}>
                   <label>Upload do Comprovante</label>
                   <input type="file" onChange={handleFileUpload} className="file-input-tech" accept=".pdf,.jpg,.png" />
                </div>
                
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginTop: '15px'}}>
                    <div className="form-group-tech">
                        <label>Data Efetiva</label>
                        <input type="date" value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} required />
                    </div>
                    <div className="form-group-tech">
                        <label>Conta Destino</label>
                        <select value={bancoDestino} onChange={(e) => setBancoDestino(e.target.value)} required>
                            <option value="">Selecione...</option>
                            <option value="horizon">Horizon Bank</option>
                            <option value="caixa">Caixa Econômica</option>
                        </select>
                    </div>
                </div>

                {erroValidacao && (
                    <div style={{background:'rgba(239, 68, 68, 0.2)', color:'#fca5a5', padding:'10px', borderRadius:'6px', marginTop:'15px', textAlign: 'center', fontWeight: 'bold'}}>
                        {erroValidacao}
                    </div>
                )}

                <div className="modal-actions-tech" style={{marginTop:'25px'}}>
                  <button type="submit" className="btn-save-tech" style={{width:'100%'}}>
                    ✅ Confirmar Automação
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