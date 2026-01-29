import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { ref, push, remove, get } from 'firebase/database';
import './Banco.css';

export default function Banco() {
  // --- ESTADOS DE CONTROLE DE ACESSO ---
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Começa BLOQUEADO
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  // Estados do Banco
  const [extrato, setExtrato] = useState([]);
  const [saldo, setSaldo] = useState(0);
  const [loading, setLoading] = useState(false);
  const [contaUser, setContaUser] = useState(null);
  const [activeTab, setActiveTab] = useState('extrato');

  useEffect(() => {
    document.title = "Horizon Bank | Acesso Corporativo";
    return () => document.title = "TechPortal";
  }, []);

  // --- FUNÇÃO DE LOGIN (SIMULAÇÃO DE SSO + VALIDAÇÃO DE CARGO) ---
  const handleBankLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    const user = auth.currentUser;

    if (!user) {
      setLoginError("Token de segurança não detectado. Faça login no TechPortal primeiro.");
      setLoginLoading(false);
      return;
    }

    try {
      // Busca os dados reais do usuário para ver se ele é do Financeiro
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const userData = snapshot.val();
        const setor = (userData.setor || '').toLowerCase();
        const role = (userData.role || '').toLowerCase();

        // 🔒 REGRA DE NEGÓCIO: Só entra Financeiro, Admin ou Dev
        const acessoPermitido = 
          setor.includes('financeiro') || 
          role === 'admin' || 
          role === 'dev' || 
          role === 'gestor'; // Gestor também pode ver

        if (acessoPermitido) {
          // SUCESSO: Libera o acesso
          setContaUser({
            nome: userData.nome || user.displayName,
            empresa: "TECHCORP SOLUTIONS LTDA",
            conta: "99.201-X",
            cartao: "**** **** **** 8829"
          });
          setSaldo(125000.00);
          setExtrato([]);
          setTimeout(() => setIsLoggedIn(true), 1500); // Delay dramático para parecer que está "autenticando no mainframe"
        } else {
          setLoginError("⛔ ACESSO NEGADO: Usuário não autorizado para movimentação bancária.");
        }
      } else {
        setLoginError("Erro ao validar credenciais corporativas.");
      }
    } catch (error) {
      console.error(error);
      setLoginError("Falha na conexão com o servidor do banco.");
    } finally {
      if (!isLoggedIn) setLoginLoading(false);
    }
  };

  // --- LÓGICA DE GERAÇÃO (IGUAL ANTERIOR) ---
  const gerarMovimentacaoDiaria = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    const hoje = new Date().toISOString().split('T')[0];
    
    await remove(ref(db, 'financeiro/contasReceber')); 

    const empresas = ["Alpha Tech", "Omega Systems", "Global Imports", "Solaris Energy", "Quantum Soft"];
    const novosItens = [];
    const faturasParaERP = [];
    
    novosItens.push({ data: hoje, desc: "IOF - OPERAÇÃO CÂMBIO", doc: "TAX-99", valor: -120.00, tipo: "D" });
    novosItens.push({ data: hoje, desc: "ASSINATURA PLATINUM", doc: "SRV-01", valor: -99.90, tipo: "D" });

    for (let i = 0; i < 5; i++) {
        const empresa = empresas[i];
        const valorReal = parseFloat(((Math.random() * 8000) + 1000).toFixed(2));
        const docId = `INV-${Math.floor(Math.random() * 89999) + 10000}`;

        novosItens.push({ data: hoje, desc: `TED RECEBIDA - ${empresa}`, doc: docId, valor: valorReal, tipo: "C" });

        faturasParaERP.push({
            id: docId, 
            cliente: empresa,
            valor: valorReal.toFixed(2), 
            vencimento: hoje,
            status: "Aberto",
            origem: "Horizon Infinite"
        });
    }

    setExtrato(novosItens);
    setSaldo(125000 + novosItens.reduce((acc, item) => acc + item.valor, 0));

    const erpRef = ref(db, 'financeiro/contasReceber');
    await Promise.all(faturasParaERP.map(f => push(erpRef, f)));
    setLoading(false);
  };

  // --- RENDERIZAÇÃO DA TELA DE LOGIN (SE NÃO ESTIVER LOGADO) ---
  if (!isLoggedIn) {
    return (
      <div className="infinite-layout login-mode">
        <div className="aurora-bg"></div>
        <div className="login-container-horizon">
          <div className="login-brand">
            <div className="logo-circle-lg">H</div>
            <h1>HORIZON <small>INFINITE</small></h1>
          </div>
          
          <div className="glass-login-card">
            <h3>Acesso Corporativo</h3>
            <p>Insira suas credenciais de gestão financeira.</p>
            
            <form onSubmit={handleBankLogin}>
              <div className="input-group-horizon">
                <label>Chave de Acesso</label>
                <input type="text" defaultValue={auth.currentUser?.email} disabled className="input-disabled" />
              </div>
              
              <div className="input-group-horizon">
                <label>Token / Senha</label>
                <input type="password" placeholder="••••••••" required />
              </div>

              {loginError && <div className="error-banner">{loginError}</div>}

              <button type="submit" className="btn-login-horizon" disabled={loginLoading}>
                {loginLoading ? 'Autenticando...' : 'ACESSAR CONTA PJ'}
              </button>
            </form>
            
            <div className="secure-badge">
              🔒 Conexão Criptografada End-to-End
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERIZAÇÃO DO PAINEL DO BANCO (SE LOGADO) ---
  return (
    <div className="infinite-layout">
      <div className="aurora-bg"></div>

      <aside className="infinite-sidebar">
        <div className="brand-box">
          <div className="logo-circle">H</div>
          <span>HORIZON</span>
        </div>
        
        <nav className="infinite-nav">
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
            <span className="icon">📊</span> Dashboard
          </button>
          <button className={activeTab === 'extrato' ? 'active' : ''} onClick={() => setActiveTab('extrato')}>
            <span className="icon">💳</span> Extrato
          </button>
          <button className={activeTab === 'invest' ? 'active' : ''} onClick={() => setActiveTab('invest')}>
            <span className="icon">📈</span> Investimentos
          </button>
          <button className={activeTab === 'cards' ? 'active' : ''} onClick={() => setActiveTab('cards')}>
            <span className="icon">🔒</span> Cartões
          </button>
        </nav>

        <div className="sidebar-footer-infinite">
          <div className="user-profile-mini">
            <div className="avatar">{contaUser?.nome[0]}</div>
            <div className="info">
              <strong>{contaUser?.nome}</strong>
              <small>Infinite Member</small>
            </div>
          </div>
          <button className="btn-logout-infinite" onClick={() => window.close()}>Sair</button>
        </div>
      </aside>

      <main className="infinite-main fade-in-up">
        <header className="main-header-infinite">
          <h1>Olá, {contaUser?.nome.split(' ')[0]}</h1>
          <div className="header-actions">
            <span className="date-badge">{new Date().toLocaleDateString()}</span>
            <button className="btn-notif">🔔</button>
          </div>
        </header>

        <div className="infinite-grid">
          <div className="glass-card credit-card-visual">
            <div className="card-top">
              <span>Horizon Infinite</span>
              <span className="contactless">)))</span>
            </div>
            <div className="card-chip"></div>
            <div className="card-number">{contaUser?.cartao}</div>
            <div className="card-bottom">
              <div className="holder">{contaUser?.nome.toUpperCase()}</div>
              <div className="expiry">12/29</div>
            </div>
          </div>

          <div className="glass-card balance-card">
            <h3>Saldo em Conta</h3>
            <div className="balance-amount">
              <small>R$</small> {saldo.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
            </div>
            <div className="balance-change">+ 12.5% este mês</div>
          </div>

          <div className="glass-card action-card">
            <h3>Simulação RPA</h3>
            <p>Gerar lote de transações para conciliação.</p>
            <button className="btn-generate-infinite" onClick={gerarMovimentacaoDiaria} disabled={loading}>
              {loading ? 'Processando...' : '⚡ Gerar Movimentação'}
            </button>
          </div>

          <div className="glass-card full-width extrato-infinite">
            <div className="card-header">
              <h3>Últimos Lançamentos</h3>
              <button className="btn-export">Exportar OFX</button>
            </div>
            
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Documento</th>
                    <th className="text-right">Valor</th>
                    <th className="text-center">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {extrato.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-msg">
                        Nenhuma movimentação recente. <br/>Use o simulador acima.
                      </td>
                    </tr>
                  ) : (
                    extrato.map((item, i) => (
                      <tr key={i}>
                        <td>{new Date(item.data).toLocaleDateString()}</td>
                        <td className="desc-infinite">{item.desc}</td>
                        <td className="mono">{item.doc}</td>
                        <td className={`text-right ${item.tipo === 'D' ? 'neg' : 'pos'}`}>
                          R$ {Math.abs(item.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                        <td className="text-center">
                          <span className={`tag-type ${item.tipo}`}>{item.tipo}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}