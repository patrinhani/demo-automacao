import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { useUser } from '../../contexts/UserContext'; 
import { useAlert } from '../../contexts/AlertContext'; // <-- Importado o AlertContext
import { db } from '../../firebase';
import { ref, onValue, update, set } from 'firebase/database';
import './Conciliacao.css';

export default function Conciliacao() {
  // Pegamos os dados do Contexto (já com a lógica de nome e permissão aplicada)
  const { user, uidAtivo, isFinanceiro } = useUser();
  const { showAlert } = useAlert(); // <-- Inicializado o hook do alerta
  const navigate = useNavigate();
  
  // Estados de Dados
  const [faturas, setFaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modoApresentacaoAtivo, setModoApresentacaoAtivo] = useState(false);
  
  // Estados de Interface
  const [busca, setBusca] = useState('');
  const [faturaSelecionada, setFaturaSelecionada] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Estados do Formulário de Baixa Manual
  const [inputCodigo, setInputCodigo] = useState('');
  const [arquivoUpload, setArquivoUpload] = useState(null);
  const [erroValidacao, setErroValidacao] = useState('');
  const [dataPagamento, setDataPagamento] = useState('');
  const [bancoDestino, setBancoDestino] = useState('');

  // --- FUNÇÃO AUXILIAR: GERAR INICIAIS DO AVATAR ---
  // Ex: "João Silva" -> "JS", "Robô de Ana" -> "RA"
  const getIniciais = (nome) => {
    if (!nome) return 'FN'; // FN = Financeiro (Padrão)
    
    // Remove emojis da string (ex: 🤖) para não quebrar a inicial
    const nomeLimpo = nome.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').trim();
    
    // Divide por espaços e ignora preposições como 'de', 'da'
    const partes = nomeLimpo.split(' ').filter(p => p.length > 2 && p.toLowerCase() !== 'robô'); 
    
    if (partes.length === 0) return nomeLimpo.substring(0, 2).toUpperCase();
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    
    // Pega a primeira letra do primeiro nome e a primeira do último
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  };

  // Calcula as iniciais baseadas no nome inteligente do Contexto
  const iniciaisAvatar = getIniciais(user?.displayName);

  // --- 1. SEGURANÇA: BLOQUEIO DE ACESSO ---
  useEffect(() => {
    // Criado uma função async interna para aguardar o fechamento do alerta antes de navegar
    const verificarAcesso = async () => {
      // Se o usuário carregou e NÃO é do financeiro, expulsa
      if (user && isFinanceiro === false) {
        await showAlert("⛔ Acesso Negado", "Esta área é restrita ao Departamento Financeiro.");
        navigate('/dashboard');
      }
    };
    
    verificarAcesso();
  }, [user, isFinanceiro, navigate, showAlert]);

  // --- 2. BUSCA DE DADOS (FIREBASE) ---
  useEffect(() => {
    // Só busca se tiver um UID ativo e permissão
    if (!uidAtivo || !isFinanceiro) return;

    const faturasRef = ref(db, `users/${uidAtivo}/financeiro/faturas`);
    
    const unsubscribeFaturas = onValue(faturasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let lista = [];
        // Normaliza os dados (pode ser array ou objeto)
        if (Array.isArray(data)) {
          lista = data.map((item, index) => ({ ...item, firebaseKey: index }));
        } else {
          lista = Object.keys(data).map(key => ({ ...data[key], firebaseKey: key }));
        }
        // Ordena: Pendentes primeiro
        lista.sort((a, b) => (a.status === 'Pendente' ? -1 : 1));
        setFaturas(lista);
      } else {
        setFaturas([]);
      }
      setLoading(false);
    });

    // Escuta o modo apresentação (para mostrar o botão mágico do robô)
    const demoRef = ref(db, 'configuracoes_globais/modo_apresentacao');
    const unsubscribeDemo = onValue(demoRef, (snapshot) => {
      setModoApresentacaoAtivo(!!snapshot.val());
    });

    return () => {
      unsubscribeFaturas();
      unsubscribeDemo();
    };
  }, [uidAtivo, isFinanceiro]);

  // --- 3. AUTOMAÇÃO (O Robô) ---
  const executarAutomacaoEmMassa = async () => {
    const pendentes = faturas.filter(f => f.status === 'Pendente');
    console.log("🚀 Botão acionado! Enviando sinal para fila_automacao...");
    
    try {
        // Envia o comando para o Python ler
        await set(ref(db, `fila_automacao/${uidAtivo}`), { 
            nome: user.displayName || "Operador Financeiro",
            timestamp: Date.now(),
            acao: "CONCILIAR_PENDENTES",
            qtd_pendencias: pendentes.length 
        });
        
        if (pendentes.length === 0) {
            // <-- Substituído o alert nativo
            await showAlert("Aviso", "⚠️ Nenhuma pendência encontrada, mas o sinal de teste foi enviado ao Robô.");
        } else {
            // <-- Substituído o alert nativo
            await showAlert("Sucesso", `🤖 Robô acionado com sucesso! Processando ${pendentes.length} itens.`);
        }
    } catch (error) {
        console.error("Erro ao acionar automação:", error);
        // <-- Substituído o alert nativo
        await showAlert("Erro", "Erro ao conectar com o Robô.");
    }
  };

  // --- 4. FILTROS E BUSCA ---
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

  // --- 5. FUNÇÕES DE BAIXA MANUAL ---
  const solicitarBaixaManual = (fatura) => {
    if (fatura.firebaseKey === undefined) return;
    setFaturaSelecionada(fatura);
    
    // Reseta o formulário
    setDataPagamento(new Date().toISOString().split('T')[0]); // Data de hoje
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

    // Validação do Hash (Simulação de segurança)
    const hashCorreto = faturaSelecionada.codigoHash;
    if (!inputCodigo || inputCodigo.trim().toUpperCase() !== hashCorreto) {
      setErroValidacao(`❌ Código incorreto! O hash esperado é: ${hashCorreto}`);
      return;
    }

    if (!arquivoUpload) {
      setErroValidacao('❌ É obrigatório anexar o comprovante PDF.');
      return;
    }

    if (!bancoDestino) {
        setErroValidacao('❌ Selecione o banco de destino.');
        return;
    }

    // Atualiza no Firebase
    const key = faturaSelecionada.firebaseKey;
    const updates = {};
    const basePath = `users/${uidAtivo}/financeiro/faturas/${key}`;
    
    updates[`${basePath}/status`] = 'Conciliado';
    updates[`${basePath}/dataBaixa`] = dataPagamento;
    updates[`${basePath}/bancoDestino`] = bancoDestino;
    updates[`${basePath}/auditoria`] = {
      validadoPor: user.displayName, // Salva o nome real de quem fez (Robô ou Humano)
      metodo: 'Manual (Portal Web)',
      hashValidado: inputCodigo,
      arquivoComprovante: arquivoUpload.name,
      dataAuditoria: new Date().toISOString()
    };
    
    try {
        await update(ref(db), updates);
        setShowModal(false);
        setFaturaSelecionada(null);
    } catch (err) {
        console.error("Erro ao salvar baixa manual:", err);
        setErroValidacao("Erro de conexão ao salvar.");
    }
  };

  // Se não tiver permissão, retorna null para não renderizar nada enquanto redireciona
  if (isFinanceiro === false) return null;

  return (
    <div className="tech-layout">
      {/* Luz de fundo ambiente */}
      <div className="ambient-light light-1"></div>
      
      <Sidebar />

      <main className="tech-main">
        <header className="tech-header">
          <div className="header-content">
            <h1>Conciliação Financeira</h1>
            <p>Auditoria Cruzada e Baixa de Títulos</p>
          </div>
          
          {/* --- CARD DE PERFIL DINÂMICO --- */}
          <div className="tech-profile">
             <div className="profile-info">
               {/* Nome vem do Contexto (pode ser Robô ou Humano) */}
               <span className="name">{user?.displayName || 'Usuário'}</span>
               
               {/* Tag extra se for Robô para dar feedback visual */}
               {user?.displayName?.includes('Robô') && (
                  <small style={{display:'block', fontSize:'0.65rem', color:'#34d399', letterSpacing:'1px'}}>
                    AUTO-PILOT ACTIVE
                  </small>
               )}
             </div>
             
             {/* Avatar com cor diferente se for Robô */}
             <div 
               className="profile-avatar" 
               style={{ 
                 background: user?.displayName?.includes('Robô') ? 'linear-gradient(135deg, #059669, #34d399)' : 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                 boxShadow: user?.displayName?.includes('Robô') ? '0 0 15px rgba(52, 211, 153, 0.5)' : 'none'
               }}
             >
               {iniciaisAvatar}
             </div>
          </div>
        </header>

        <div className="tech-scroll-content">
          
          {/* --- PAINEL DE AUTOMAÇÃO (Só aparece se ativado nas configs globais) --- */}
          {modoApresentacaoAtivo && (
             <div style={{
               background: 'linear-gradient(90deg, #064e3b 0%, #065f46 100%)',
               padding: '25px',
               borderRadius: '16px',
               marginBottom: '30px',
               color: 'white',
               boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
               display: 'flex',
               justifyContent: 'space-between',
               alignItems: 'center',
               border: '1px solid #059669',
               position: 'relative',
               overflow: 'hidden'
             }}>
               {/* Efeito de brilho de fundo */}
               <div style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', background:'url("/noise.png")', opacity:0.05}}></div>
               
               <div style={{zIndex:1}}>
                 <h2 style={{margin:0, fontSize:'1.5rem', display:'flex', alignItems:'center', gap:'10px'}}>
                   🚀 Automação RPA Disponível
                 </h2>
                 <p style={{margin:'8px 0 0 0', opacity:0.8, fontSize:'0.95rem', maxWidth:'500px'}}>
                   O Robô Bancário está online e pronto para processar. Existem <strong>{faturas.filter(f => f.status === 'Pendente').length} faturas pendentes</strong> na fila.
                 </p>
               </div>
               
               <button 
                 onClick={executarAutomacaoEmMassa}
                 className="btn-magic-tech"
                 style={{
                   zIndex: 1,
                   background: 'white',
                   color: '#047857',
                   border: 'none',
                   padding: '14px 28px',
                   borderRadius: '10px',
                   fontWeight: '800',
                   fontSize: '1rem',
                   cursor: 'pointer',
                   boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                   transition: 'all 0.3s ease',
                   textTransform: 'uppercase',
                   letterSpacing: '0.5px'
                 }}
                 onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 20px rgba(255,255,255,0.2)';
                 }}
                 onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                 }}
               >
                 ⚡ Iniciar Processamento
               </button>
             </div>
          )}

          {/* --- BARRA DE BUSCA --- */}
          <div className="search-bar-container" style={{marginBottom: '20px'}}>
            <input 
              type="text" 
              placeholder="🔍 Buscar por Cliente, ID, Nota Fiscal ou Valor..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="search-input-tech"
              style={{
                width: '100%', 
                padding: '15px', 
                borderRadius: '12px', 
                border: '1px solid #334155', 
                background: 'rgba(15,23,42, 0.8)', 
                color: 'white',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* --- TABELA DE DADOS --- */}
          <div className="tech-card-table-wrapper">
            {loading ? (
              <div style={{padding:'40px', textAlign:'center', color:'#94a3b8'}}>
                <div className="spinner" style={{marginBottom:'10px'}}>↻</div>
                <p>Sincronizando com o ERP...</p>
              </div>
            ) : faturasFiltradas.length === 0 ? (
              <div className="empty-state-tech">
                <div className="empty-icon">✅</div>
                <h3>Tudo Limpo!</h3>
                <p>Nenhuma pendência encontrada com os filtros atuais.</p>
              </div>
            ) : (
              <table className="tech-table">
                <thead>
                  <tr>
                    <th>ID Interno</th>
                    <th>Cliente / Fornecedor</th>
                    <th>Nota Fiscal</th>
                    <th>Valor (R$)</th>
                    <th>Status</th>
                    <th style={{textAlign:'right'}}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {faturasFiltradas.map((fatura, idx) => (
                    <tr key={idx} className={fatura.status === 'Conciliado' ? 'row-conciliado' : ''}>
                      <td style={{fontFamily:'monospace', color:'#94a3b8'}}>{fatura.id}</td>
                      <td>
                        <strong>{fatura.cliente}</strong>
                        <div style={{fontSize:'0.75rem', color:'#64748b'}}>{fatura.descricao || 'Serviços Prestados'}</div>
                      </td>
                      <td>{fatura.nfe}</td>
                      <td className="col-valor" style={{color: '#e2e8f0', fontWeight:'bold'}}>
                        {Number(fatura.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td>
                        <span className={`status-badge ${fatura.status.toLowerCase()}`}>
                          {fatura.status}
                        </span>
                      </td>
                      <td style={{textAlign:'right'}}>
                        {fatura.status === 'Pendente' && (
                           <button className="btn-action-tech" onClick={() => solicitarBaixaManual(fatura)}>
                             Auditar
                           </button>
                        )}
                        {fatura.status === 'Conciliado' && (
                            <span style={{color:'#10b981', fontSize:'0.9rem', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'5px'}}>
                                <span>✔</span> 
                                {fatura.auditoria?.metodo === 'Robô (RPA)' ? 'RPA Auto' : 'Manual'}
                            </span>
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

      {/* --- MODAL DE BAIXA MANUAL --- */}
      {showModal && faturaSelecionada && (
        <div className="modal-overlay-tech">
          <div className="modal-glass" style={{maxWidth: '600px', animation: 'fadeIn 0.3s ease'}}>
            <div className="modal-header">
              <h3>✍️ Auditoria & Baixa Manual</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div style={{display:'flex', flexDirection:'column', gap:'20px', padding:'10px'}}>
              
              <div className="info-summary" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', background:'rgba(255,255,255,0.05)', padding:'10px', borderRadius:'8px'}}>
                 <div>
                    <small style={{color:'#94a3b8'}}>Cliente</small>
                    <div style={{fontWeight:'bold'}}>{faturaSelecionada.cliente}</div>
                 </div>
                 <div style={{textAlign:'right'}}>
                    <small style={{color:'#94a3b8'}}>Valor</small>
                    <div style={{fontWeight:'bold', color:'#34d399'}}>
                        {Number(faturaSelecionada.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                 </div>
              </div>

              <div className="step-box completed" style={{background:'rgba(245, 158, 11, 0.1)', borderLeft:'4px solid #f59e0b', padding:'15px'}}>
                 <strong style={{color:'#fbbf24', display:'block', marginBottom:'5px'}}>⚠️ PROCESSO MANUAL</strong>
                 <p style={{fontSize:'0.85rem', margin:0, color:'#cbd5e1'}}>
                   Você está substituindo a automação. Verifique o comprovante bancário e insira o hash de segurança.
                 </p>
              </div>

              <form onSubmit={confirmarBaixaManual} className="form-tech">
                
                {/* Campo de Código Hash */}
                <div className="form-group-tech">
                    <label style={{color:'#f59e0b', fontWeight:'bold'}}>
                        Digite o Hash de Validação
                        <span style={{float:'right', fontSize:'0.7rem', fontWeight:'normal', opacity:0.7}}>
                           (Disponível no Extrato: {faturaSelecionada.codigoHash})
                        </span>
                    </label>
                    <input 
                        type="text" 
                        value={inputCodigo} 
                        onChange={(e) => setInputCodigo(e.target.value)} 
                        className="input-highlight"
                        placeholder="Ex: A1B2C3"
                        style={{
                            textAlign:'center', 
                            textTransform:'uppercase', 
                            fontSize:'1.2rem', 
                            letterSpacing:'3px',
                            borderColor: erroValidacao.includes('Código') ? '#ef4444' : '#334155'
                        }}
                    />
                </div>

                <div className="form-row" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                    <div className="form-group-tech">
                        <label>Data da Baixa</label>
                        <input 
                            type="date" 
                            value={dataPagamento} 
                            onChange={(e) => setDataPagamento(e.target.value)} 
                            required 
                            className="input-tech"
                        />
                    </div>
                    <div className="form-group-tech">
                        <label>Banco de Destino</label>
                        <select 
                            value={bancoDestino} 
                            onChange={(e) => setBancoDestino(e.target.value)} 
                            required
                            className="input-tech"
                            style={{borderColor: erroValidacao.includes('Banco') ? '#ef4444' : '#334155'}}
                        >
                            <option value="">Selecione...</option>
                            <option value="Horizon Bank">Horizon Bank (Corp)</option>
                            <option value="Caixa">Caixa Econômica</option>
                            <option value="Itau">Itaú Empresas</option>
                        </select>
                    </div>
                </div>

                <div className="form-group-tech" style={{marginTop:'5px'}}>
                   <label>Upload do Comprovante (PDF)</label>
                   <div className="file-upload-wrapper" style={{position:'relative'}}>
                       <input 
                           type="file" 
                           onChange={handleFileUpload} 
                           className="file-input-tech" 
                           accept=".pdf,.jpg,.png" 
                           style={{width:'100%', padding:'10px', background:'rgba(0,0,0,0.2)', borderRadius:'8px'}}
                       />
                   </div>
                </div>

                {erroValidacao && (
                    <div className="error-message" style={{
                        background:'rgba(239, 68, 68, 0.1)', 
                        color:'#fca5a5', 
                        padding:'10px', 
                        borderRadius:'6px', 
                        textAlign:'center',
                        fontSize:'0.9rem',
                        marginTop:'10px'
                    }}>
                        {erroValidacao}
                    </div>
                )}

                <div className="modal-actions-tech" style={{marginTop:'25px'}}>
                  <button type="submit" className="btn-save-tech" style={{width:'100%', padding:'15px', fontSize:'1rem'}}>
                    ✅ Confirmar Baixa
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