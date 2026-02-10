import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar'; // Adicionado Sidebar que faltava na visualização
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { ref, set } from "firebase/database"; 
import { db, auth, firebaseConfig } from '../firebase'; 
import Logo from '../components/Logo';
import { jsPDF } from "jspdf"; 
import './CadastroUsuario.css';

// --- CONFIGURAÇÃO DE CARGOS COM PESOS (PROBABILIDADE) ---
const TABELA_CARGOS = [
  // --- RECURSOS HUMANOS ---
  { cargo: "Assistente de RH", salario: 2100.00, setor: "Recursos Humanos", peso: 40 },
  { cargo: "Analista de RH Júnior", salario: 3500.00, setor: "Recursos Humanos", peso: 30 },
  { cargo: "Analista de RH Pleno", salario: 5200.00, setor: "Recursos Humanos", peso: 15 },
  { cargo: "Business Partner (BP)", salario: 8500.00, setor: "Recursos Humanos", peso: 10 },
  { cargo: "Gerente de Pessoas e Cultura", salario: 15000.00, setor: "Recursos Humanos", peso: 5 },

  // --- FINANCEIRO ---
  { cargo: "Auxiliar Financeiro", salario: 1900.00, setor: "Financeiro", peso: 40 },
  { cargo: "Analista Financeiro Jr", salario: 3200.00, setor: "Financeiro", peso: 30 },
  { cargo: "Analista Financeiro Sr", salario: 6000.00, setor: "Financeiro", peso: 15 },
  { cargo: "Controller", salario: 11000.00, setor: "Financeiro", peso: 10 },
  { cargo: "Diretor Financeiro (CFO)", salario: 25000.00, setor: "Financeiro", peso: 5 }
];

export default function CadastroUsuario() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [progresso, setProgresso] = useState(""); 

  // Estado para múltiplos nomes
  const [listaNomes, setListaNomes] = useState('');
  
  const [commonData, setCommonData] = useState({
    unidade: 'Matriz SP - TechHub',
    admissao: new Date().toISOString().split('T')[0],
    senhaPadrao: 'Mudar@123'
  });

  useEffect(() => {
    const verificarPermissao = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/'); 
        return;
      }
      setCheckingAuth(false);
    };
    verificarPermissao();
  }, [navigate]);

  // --- LÓGICA DE SORTEIO PONDERADO ---
  const sortearCargoPorSetor = (setorAlvo) => {
    const cargosDoSetor = TABELA_CARGOS.filter(c => c.setor === setorAlvo);
    const pesoTotal = cargosDoSetor.reduce((acc, item) => acc + item.peso, 0);
    let random = Math.random() * pesoTotal;
    
    for (const cargo of cargosDoSetor) {
      if (random < cargo.peso) {
        return cargo;
      }
      random -= cargo.peso;
    }
    return cargosDoSetor[0]; 
  };

  const gerarPDFBoasVindas = (user, cargoInfo) => {
    const doc = new jsPDF();
    const azulTech = "#0ea5e9";

    // Cabeçalho
    doc.setFillColor(14, 165, 233);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("BEM-VINDO À TECHCORP", 105, 25, { align: "center" });

    // Mensagem Inicial
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(16);
    doc.text(`Olá, ${user.nome}!`, 20, 60);
    doc.setFontSize(12);
    doc.text("Aqui estão os seus dados de acesso ao portal corporativo:", 20, 70);

    // Quadro de Credenciais
    doc.setDrawColor(azulTech);
    doc.rect(20, 80, 170, 45);
    doc.setFont("helvetica", "bold");
    doc.text("LOGIN:", 25, 90);
    doc.text("SENHA PROVISÓRIA:", 25, 100); // Texto ajustado
    doc.text("MATRÍCULA:", 25, 110);
    doc.text("CARGO:", 25, 120);

    doc.setFont("helvetica", "normal");
    doc.text(user.email, 75, 90);
    doc.text(user.senha, 75, 100);
    doc.text(user.matricula, 75, 110);
    doc.text(cargoInfo.cargo, 75, 120);

    doc.setTextColor(150, 150, 150);
    doc.setFontSize(10);
    doc.text("Gerado pelo Portal TechCorp - Gestão de RH", 105, 280, { align: "center" });

    doc.save(`BoasVindas_${user.nome.replace(/\s+/g, '_')}.pdf`);
  };

  const gerarEmail = (nomeCompleto) => {
    if (!nomeCompleto) return '';
    const textoLimpo = nomeCompleto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const partes = textoLimpo.trim().toLowerCase().split(/\s+/);
    if (partes.length <= 1) return `${partes[0] || ''}@techcorp.com.br`;
    return `${partes[0]}.${partes[partes.length - 1]}@techcorp.com.br`;
  };

  const gerarMatricula = () => `900${Math.floor(10000 + Math.random() * 90000)}`;

  const handleCriarUsuariosEmLote = async (e) => {
    e.preventDefault();
    
    const linhasBrutas = listaNomes.split('\n').filter(n => n.trim().length > 0);
    
    if (linhasBrutas.length === 0) {
      alert("Por favor, insira pelo menos um nome.");
      return;
    }

    setLoading(true);
    let secondaryApp = null;
    let sucessos = 0;

    try {
      // Inicializa app secundário para não deslogar o admin atual
      secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getAuth(secondaryApp);

      for (let i = 0; i < linhasBrutas.length; i++) {
        const linhaOriginal = linhasBrutas[i];
        const partes = linhaOriginal.split(/[;-]/); // Separa por ; ou -
        
        const nomeLimpo = partes[0].trim();
        let setorAlvo = "";
        
        // Detecção de Setor Manual
        if (partes.length > 1) {
          const comando = partes[1].toLowerCase().trim();
          if (comando.includes('rh') || comando.includes('recursos')) setorAlvo = "Recursos Humanos";
          else if (comando.includes('fin') || comando.includes('banco')) setorAlvo = "Financeiro";
        }

        // Sorteio se não definido
        if (!setorAlvo) {
          setorAlvo = Math.random() < 0.5 ? "Recursos Humanos" : "Financeiro";
        }

        setProgresso(`Criando ${i + 1}/${linhasBrutas.length}: ${nomeLimpo} (${setorAlvo})...`);
        
        const cargoSorteado = sortearCargoPorSetor(setorAlvo);
        const emailGerado = gerarEmail(nomeLimpo);
        const matriculaGerada = gerarMatricula();

        // 1. Criar Auth no Firebase (App Secundário)
        const userCredential = await createUserWithEmailAndPassword(
          secondaryAuth, 
          emailGerado, 
          commonData.senhaPadrao
        );
        const novoUsuario = userCredential.user;
        const novoUid = novoUsuario.uid;

        // 2. Atualizar Display Name no Auth
        await updateProfile(novoUsuario, { displayName: nomeLimpo });

        // 3. Salvar no Realtime Database (COM A SENHA!)
        await set(ref(db, `users/${novoUid}`), {
          nome: nomeLimpo,
          email: emailGerado,
          matricula: matriculaGerada,
          unidade: commonData.unidade,
          admissao: commonData.admissao,
          
          cargo: cargoSorteado.cargo,
          setor: cargoSorteado.setor,
          salarioBase: cargoSorteado.salario,
          
          role: 'colaborador', // Todos nascem como colaborador padrão
          senha: commonData.senhaPadrao, // <--- O CAMPO QUE FALTAVA
          
          forceChangePassword: true,
          createdAt: new Date().toISOString(),
          createdBy: auth.currentUser.uid
        });

        // 4. Gerar PDF
        gerarPDFBoasVindas({
          nome: nomeLimpo,
          email: emailGerado,
          senha: commonData.senhaPadrao,
          matricula: matriculaGerada
        }, cargoSorteado);

        sucessos++;
        await new Promise(r => setTimeout(r, 500)); // Delay para não travar
      }

      alert(`✅ SUCESSO!\n${sucessos} usuários criados.`);
      setListaNomes(""); // Limpa lista

    } catch (error) {
      console.error("Erro no lote:", error);
      alert("Erro parcial ou total: " + error.message);
    } finally {
      if (secondaryApp) await signOut(getAuth(secondaryApp)); // Limpa app secundário
      setLoading(false);
      setProgresso("");
    }
  };

  if (checkingAuth) return <div className="loading-screen">Carregando...</div>;

  return (
    <div className="tech-layout">
      {/* Adicionei o Sidebar para manter a consistência visual */}
      <Sidebar />
      <div className="ambient-light light-2"></div>

      <main className="tech-main">
        <header className="tech-header-glass">
            <div className="header-left">
            <div style={{transform: 'scale(0.8)'}}><Logo /></div>
            <span className="divider">|</span>
            <span className="page-title">Fábrica de Usuários (Lote)</span>
            </div>
        </header>

        <div className="cadastro-container" style={{padding:'20px'}}>
            <div className="form-card-glass" style={{maxWidth:'800px', margin:'0 auto'}}>
            <div className="form-header">
                <h2>Gerador de Usuários em Massa</h2>
                <p style={{fontSize: '0.9rem', opacity: 0.8}}>
                Cria logins reais, salva senhas no banco para testes e gera PDFs de boas-vindas.
                </p>
            </div>

            <form onSubmit={handleCriarUsuariosEmLote} className="cadastro-form">
                
                <div className="form-row">
                <div className="form-group" style={{flex: 2}}>
                    <label>Lista de Nomes (Um por linha)</label>
                    <textarea 
                    value={listaNomes} 
                    onChange={(e) => setListaNomes(e.target.value)} 
                    required 
                    autoFocus 
                    placeholder={"Exemplos:\nAna Costa\nPedro Santos ; Financeiro\nLucas Silva ; RH"}
                    rows={8}
                    style={{
                        width: '100%',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid #334155',
                        padding: '1rem',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                        fontSize: '1rem',
                        fontFamily: 'monospace'
                    }}
                    />
                </div>
                </div>

                <div className="form-row">
                <div className="form-group">
                    <label>Senha Padrão (Salva no Banco)</label>
                    <input 
                    type="text" 
                    value={commonData.senhaPadrao} 
                    onChange={(e) => setCommonData({...commonData, senhaPadrao: e.target.value})} 
                    required 
                    style={{color:'#34d399', fontWeight:'bold'}}
                    />
                </div>
                <div className="form-group">
                    <label>Unidade</label>
                    <select value={commonData.unidade} onChange={(e) => setCommonData({...commonData, unidade: e.target.value})}>
                    <option>Matriz SP - TechHub</option>
                    <option>Filial RJ - Centro</option>
                    <option>Filial MG - Savassi</option>
                    <option>Home Office</option>
                    </select>
                </div>
                </div>

                {loading && (
                <div style={{
                    textAlign: 'center', 
                    color: '#0ea5e9', 
                    margin: '1rem 0', 
                    fontWeight: 'bold',
                    padding: '10px',
                    background: 'rgba(14, 165, 233, 0.1)',
                    borderRadius: '8px'
                }}>
                    ⏳ {progresso}
                </div>
                )}

                <div className="form-actions">
                <button type="submit" className="btn-create-user" disabled={loading || !listaNomes.trim()}>
                    {loading ? 'Processando...' : '🚀 Gerar Usuários'}
                </button>
                </div>
            </form>
            </div>
        </div>
      </main>
    </div>
  );
}