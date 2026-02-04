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

  // 1. CARREGAR DADOS DO FIREBASE (CORRIGIDO)
  useEffect(() => {
    if (!user) return;

    const faturasRef = ref(db, `users/${user.uid}/financeiro/faturas`);
    
    const unsubscribe = onValue(faturasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let lista = [];

        // CORREÇÃO CRÍTICA AQUI:
        // Se for Array, mapeamos o índice (0, 1, 2...) para 'firebaseKey' ANTES de ordenar.
        // Isso garante que sabemos exatamente qual linha atualizar no banco depois.
        if (Array.isArray(data)) {
          lista = data.map((item, index) => ({
            ...item,
            firebaseKey: index // Salva o índice real do banco (ex: 0, 5, 12)
          }));
        } else {
          // Se for Objeto (chaves aleatórias do Firebase), pegamos as chaves
          lista = Object.keys(data).map(key => ({
            firebaseKey: key,
            ...data[key]
          }));
        }
        
        // Ordena: Pendentes primeiro (Agora é seguro ordenar, pois firebaseKey está salvo)
        lista.sort((a, b) => (a.status === 'Pendente' ? -1 : 1));
        setFaturas(lista);
      } else {
        setFaturas([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. FILTRO DE BUSCA
  const faturasFiltradas = faturas.filter(fatura => {
    const termo = busca.toLowerCase();
    const valorString = fatura.valor ? fatura.valor.toString() : '';
    return (
      fatura.cliente.toLowerCase().includes(termo) ||
      (fatura.id && fatura.id.toLowerCase().includes(termo)) ||
      (fatura.nfe && fatura.nfe.toLowerCase().includes(termo)) ||
      valorString.includes(termo)
    );
  });

  // 3. ABRIR MODAL
  const solicitarBaixa = (fatura) => {
    setFaturaSelecionada(fatura);
    
    // Limpar campos
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
    if (file) {
      setArquivoUpload(file);
    }
  };

  // 5. CONFIRMAR E VALIDAR
  const confirmarBaixa = async (e) => {
    e.preventDefault();
    if (!faturaSelecionada) return;
    
    setErroValidacao('');

    // Validação de Hash (Código do Comprovante)
    const hashCorreto = faturaSelecionada.codigoHash;
    if (hashCorreto && inputCodigo.trim().toUpperCase() !== hashCorreto) {
      setErroValidacao('❌ Código de Autenticação inválido! Verifique o comprovante no menu Banco.');
      return;
    }

    // Validação de Upload
    if (!arquivoUpload) {
      setErroValidacao('❌ É obrigatório anexar o comprovante bancário.');
      return;
    }

    // Identifica a chave correta no Firebase
    // Agora usamos com segurança o 'firebaseKey' que garantimos no useEffect
    const key = faturaSelecionada.firebaseKey;

    if (key === undefined || key === null) {
      alert("Erro Crítico: Não foi possível localizar o registro original no banco de dados.");
      return;
    }

    // Prepara atualização
    const updates = {};
    const basePath = `users/${user.uid}/financeiro/faturas/${key}`;
    
    updates[`${basePath}/status`] = 'Conciliado';
    updates[`${basePath}/dataBaixa`] = dataPagamento || new Date().toISOString();
    updates[`${basePath}/bancoDestino`] = bancoDestino;
    updates[`${basePath}/auditoria`] = {
      validadoPor: 'Usuario Financeiro',
      metodo: 'Conferencia Manual (Swivel Chair)',
      hashValidado: inputCodigo,
      arquivoComprovante: arquivoUpload.name,
      dataAuditoria: new Date().toISOString()
    };
    
    try {
      await update(ref(db), updates);
      setShowModal(false);
      setFaturaSelecionada(null);
      // O onValue no useEffect vai atualizar a lista automaticamente
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao salvar conciliação.");
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
             <div className="profile-info">
               <span className="name">Financeiro</span>
               <span className="role">Auditoria</span>
             </div>
             <div className="profile-avatar">FN</div>
          </div>
        </header>

        <div className="tech-scroll-content">
          
          <div className="conciliacao-alert">
            <span className="alert-icon">🔄</span>
            <div>
              <strong>Processo de Auditoria:</strong> Para conciliar, busque o comprovante no 
              <span className="highlight" style={{cursor:'pointer', marginLeft:'5px'}} onClick={() => navigate('/banco')}>
                 Menu Banco &gt; Extrato
              </span>.
            </div>
          </div>

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
              <p style={{padding:'20px', color:'white'}}>Carregando sistema...</p>
            ) : faturasFiltradas.length === 0 ? (
              <div className="empty-state-tech">
                <div className="empty-icon">📂</div>
                <h3>Tudo em dia!</h3>
                <p>Não há pendências de conciliação no momento.</p>
              </div>
            ) : (
              <table className="tech-table">
                <thead>
                  <tr>
                    <th>Doc. Interno</th>
                    <th>Nota Fiscal</th>
                    <th>Cliente</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {faturasFiltradas.map((fatura, idx) => (
                    <tr key={idx} className={fatura.status === 'Conciliado' ? 'row-conciliado' : ''}>
                      <td className="mono" style={{fontSize: '0.8rem', color:'#94a3b8'}}>{fatura.id}</td>
                      <td className="mono" style={{color:'#f59e0b'}}>{fatura.nfe || '-'}</td>
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
                          <button className="btn-action-tech" onClick={() => solicitarBaixa(fatura)}>
                            Auditar
                          </button>
                        )}
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
              
              <div className="step-box completed" style={{
                  background:'rgba(245, 158, 11, 0.1)', 
                  border:'1px solid #f59e0b', 
                  display:'flex', 
                  gap:'15px',
                  alignItems:'flex-start'
              }}>
                 <div style={{fontSize:'2rem', marginTop:'-5px'}}>🏦</div>
                 <div>
                   <strong style={{color:'#fbbf24', fontSize:'0.9rem', textTransform:'uppercase'}}>1. Ação Externa Necessária</strong>
                   <p style={{fontSize:'0.85rem', margin:'5px 0 0 0', color:'#e2e8f0', lineHeight:'1.4'}}>
                     Acesse o sistema bancário, localize o crédito de 
                     <strong style={{color:'#fff'}}> R$ {faturaSelecionada.valor.toFixed(2)}</strong> e baixe o 
                     Comprovante.
                   </p>
                 </div>
              </div>

              <form onSubmit={confirmarBaixa} className="form-tech">
                
                <div className="step-box" style={{border:'1px dashed #64748b', padding:'15px', borderRadius:'8px'}}>
                    <strong style={{display:'block', marginBottom:'15px', color:'#e2e8f0'}}>2. Transcrever Dados</strong>
                    <div className="form-group-tech">
                        <label style={{color:'#f59e0b'}}>Código de Autenticação (Hash)*</label>
                        <input 
                            type="text" 
                            value={inputCodigo} 
                            onChange={(e) => setInputCodigo(e.target.value)} 
                            placeholder="Ex: 8X2A9B" 
                            required 
                            className="input-highlight"
                            style={{textAlign:'center', letterSpacing:'4px', fontWeight:'bold', textTransform:'uppercase', fontSize: '1.2rem'}}
                        />
                    </div>
                </div>

                <div className="step-box" style={{marginTop:'15px'}}>
                   <strong style={{display:'block', marginBottom:'15px', color:'#e2e8f0'}}>3. Anexos e Classificação</strong>
                   <div className="form-group-tech">
                      <label>Upload do Comprovante*</label>
                      <input type="file" onChange={handleFileUpload} className="file-input-tech" accept=".pdf,.jpg,.png" />
                   </div>
                   <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
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
                </div>

                {erroValidacao && (
                    <div style={{background:'rgba(239, 68, 68, 0.2)', color:'#fca5a5', padding:'12px', borderRadius:'6px', marginTop:'15px', border:'1px solid #ef4444', textAlign: 'center', fontWeight: 'bold'}}>
                        {erroValidacao}
                    </div>
                )}

                <div className="modal-actions-tech" style={{marginTop:'25px'}}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-cancel-tech">Cancelar</button>
                  <button type="submit" className="btn-save-tech">✅ Validar e Baixar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}