import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { ref, set } from "firebase/database"; 
import { db, auth, firebaseConfig } from '../firebase'; 
import Logo from '../components/Logo';
import { jsPDF } from "jspdf"; 
import './CadastroUsuario.css';

// --- CONFIGURAÇÃO DE CARGOS COM PESOS (PROBABILIDADE) ---
// Peso maior = maior chance de ser sorteado.
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
  const [progresso, setProgresso] = useState(""); // Feedback visual do lote

  // Estado modificado para aceitar múltiplos nomes
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
    // Filtra apenas os cargos do setor desejado
    const cargosDoSetor = TABELA_CARGOS.filter(c => c.setor === setorAlvo);
    
    // Soma total dos pesos
    const pesoTotal = cargosDoSetor.reduce((acc, item) => acc + item.peso, 0);
    let random = Math.random() * pesoTotal;
    
    // Seleciona baseado no peso
    for (const cargo of cargosDoSetor) {
      if (random < cargo.peso) {
        return cargo;
      }
      random -= cargo.peso;
    }
    return cargosDoSetor[0]; // Fallback
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
    doc.text("SENHA TEMPORÁRIA:", 25, 100);
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
    
    // Processar a lista de nomes (quebra por linha e remove vazios)
    const nomesArray = listaNomes.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    
    if (nomesArray.length === 0) {
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

      for (let i = 0; i < nomesArray.length; i++) {
        const nomeAtual = nomesArray[i];
        setProgresso(`Processando ${i + 1} de ${nomesArray.length}: ${nomeAtual}...`);

        // --- LÓGICA DE DISTRIBUIÇÃO IGUALITÁRIA ---
        // Se o índice for par vai para RH, ímpar vai para Financeiro
        const setorAlvo = (i % 2 === 0) ? "Recursos Humanos" : "Financeiro";
        
        // Sorteia cargo dentro do setor específico respeitando probabilidades
        const cargoSorteado = sortearCargoPorSetor(setorAlvo);

        const emailGerado = gerarEmail(nomeAtual);
        const matriculaGerada = gerarMatricula();

        // Criar Auth
        const userCredential = await createUserWithEmailAndPassword(
          secondaryAuth, 
          emailGerado, 
          commonData.senhaPadrao
        );
        const novoUid = userCredential.user.uid;

        // Salvar no Realtime Database
        await set(ref(db, `users/${novoUid}`), {
          nome: nomeAtual,
          email: emailGerado,
          matricula: matriculaGerada,
          unidade: commonData.unidade,
          admissao: commonData.admissao,
          cargo: cargoSorteado.cargo,
          setor: cargoSorteado.setor,
          salarioBase: cargoSorteado.salario,
          role: 'colaborador',
          forceChangePassword: true,
          createdAt: new Date().toISOString(),
          createdBy: auth.currentUser.uid
        });

        // Gerar PDF individual
        gerarPDFBoasVindas({
          nome: nomeAtual,
          email: emailGerado,
          senha: commonData.senhaPadrao,
          matricula: matriculaGerada
        }, cargoSorteado);

        sucessos++;
        // Pequena pausa para garantir downloads sequenciais se forem muitos
        await new Promise(r => setTimeout(r, 500));
      }

      alert(`✅ PROCESSO CONCLUÍDO!\n${sucessos} usuários criados com sucesso.`);
      navigate('/dashboard');

    } catch (error) {
      console.error("Erro:", error);
      alert("Erro durante o processo em lote: " + error.message);
    } finally {
      if (secondaryApp) await signOut(getAuth(secondaryApp));
      setLoading(false);
      setProgresso("");
    }
  };

  if (checkingAuth) return <div className="loading-screen">Verificando permissões...</div>;

  return (
    <div className="cadastro-layout">
      <header className="tech-header-glass">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
           <span className="page-title">Gestão de Acessos (Lote)</span>
        </div>
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>Cancelar ✖</button>
      </header>

      <div className="cadastro-container">
        <div className="form-card-glass">
          <div className="form-header">
            <h2>Cadastrar Usuários em Lote</h2>
            <p>Insira os nomes abaixo (um por linha). O sistema distribuirá automaticamente entre RH e Financeiro.</p>
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
                  placeholder="Ex:\nJoão Silva\nMaria Souza\nPedro Santos"
                  rows={6}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid #334155',
                    padding: '0.8rem',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Data de Admissão (Para todos)</label>
                <input 
                  type="date" 
                  value={commonData.admissao} 
                  onChange={(e) => setCommonData({...commonData, admissao: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Unidade</label>
                <select value={commonData.unidade} onChange={(e) => setCommonData({...commonData, unidade: e.target.value})}>
                  <option>Matriz SP - TechHub</option>
                  <option>Filial RJ - Centro</option>
                  <option>Filial MG - Savassi</option>
                  <option>Remoto</option>
                </select>
              </div>
            </div>

            <hr className="divider-neon" />

            {loading && (
              <div style={{textAlign: 'center', color: '#0ea5e9', marginBottom: '1rem', fontWeight: 'bold'}}>
                {progresso}
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-create-user" disabled={loading || !listaNomes.trim()}>
                {loading ? 'Processando Lote...' : 'Gerar Todos os Usuários e PDFs'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}