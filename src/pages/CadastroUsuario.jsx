import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { ref, set } from "firebase/database"; 
import { db, auth, firebaseConfig } from '../firebase'; 
import Logo from '../components/Logo';
import { jsPDF } from "jspdf"; 
import './CadastroUsuario.css';

const TABELA_CARGOS = [
  { cargo: "Estagiário de TI", salario: 1800.00, setor: "Tecnologia" },
  { cargo: "Assistente Administrativo", salario: 2500.00, setor: "Administração" },
  { cargo: "Analista de Suporte Jr", salario: 3200.00, setor: "Tecnologia" },
  { cargo: "Desenvolvedor Júnior", salario: 4500.00, setor: "Desenvolvimento" },
  { cargo: "Analista de Marketing", salario: 5000.00, setor: "Marketing" },
  { cargo: "Designer UI/UX", salario: 6000.00, setor: "Design" },
  { cargo: "Desenvolvedor Pleno", salario: 8500.00, setor: "Desenvolvimento" },
  { cargo: "Product Owner (PO)", salario: 11000.00, setor: "Produto" },
  { cargo: "Engenheiro de Dados", salario: 13500.00, setor: "Dados" },
  { cargo: "Desenvolvedor Sênior", salario: 16000.00, setor: "Desenvolvimento" },
  { cargo: "Tech Lead", salario: 22000.00, setor: "Tecnologia" },
  { cargo: "Gerente de Projetos", salario: 25000.00, setor: "Gestão" }
];

export default function CadastroUsuario() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [formData, setFormData] = useState({
    nome: '',
    unidade: 'Matriz SP - TechHub',
    admissao: new Date().toISOString().split('T')[0],
    email: '',
    matricula: '',
    senha: 'Mudar@123'
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

  // --- FUNÇÃO DE PDF AJUSTADA ---
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

    // Quadro de Credenciais (Apenas Cargo, sem 'Sorteado')
    doc.setDrawColor(azulTech);
    doc.rect(20, 80, 170, 45);
    doc.setFont("helvetica", "bold");
    doc.text("LOGIN:", 25, 90);
    doc.text("SENHA TEMPORÁRIA:", 25, 100);
    doc.text("MATRÍCULA:", 25, 110);
    doc.text("CARGO:", 25, 120); // Removido o 'Sorteado'

    doc.setFont("helvetica", "normal");
    doc.text(user.email, 75, 90);
    doc.text(user.senha, 75, 100);
    doc.text(user.matricula, 75, 110);
    doc.text(cargoInfo.cargo, 75, 120);

    // Rodapé
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(10);
    doc.text("Gerado pelo Portal TechCorp - Gestão de RH", 105, 280, { align: "center" });

    doc.save(`BoasVindas_TechCorp_${user.nome.replace(/\s+/g, '_')}.pdf`);
  };

  const gerarEmail = (nomeCompleto) => {
    if (!nomeCompleto) return '';
    const textoLimpo = nomeCompleto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const partes = textoLimpo.trim().toLowerCase().split(/\s+/);
    if (partes.length <= 1) return `${partes[0] || ''}@techcorp.com.br`;
    return `${partes[0]}.${partes[partes.length - 1]}@techcorp.com.br`;
  };

  const gerarMatricula = () => `900${Math.floor(10000 + Math.random() * 90000)}`;

  const handleNomeChange = (e) => {
    const novoNome = e.target.value;
    setFormData(prev => ({
      ...prev,
      nome: novoNome,
      email: gerarEmail(novoNome),
      matricula: prev.matricula || gerarMatricula()
    }));
  };

  const handleCriarUsuario = async (e) => {
    e.preventDefault();
    setLoading(true);
    let secondaryApp = null;

    try {
      const cargoSorteado = TABELA_CARGOS[Math.floor(Math.random() * TABELA_CARGOS.length)];
      secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getAuth(secondaryApp);

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.senha);
      const novoUid = userCredential.user.uid;

      await set(ref(db, `users/${novoUid}`), {
        nome: formData.nome,
        email: formData.email,
        matricula: formData.matricula,
        unidade: formData.unidade,
        admissao: formData.admissao,
        cargo: cargoSorteado.cargo,
        setor: cargoSorteado.setor,
        salarioBase: cargoSorteado.salario,
        role: 'colaborador',
        forceChangePassword: true,
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser.uid
      });

      gerarPDFBoasVindas(formData, cargoSorteado);

      alert(`✅ SUCESSO!\nUsuário criado e PDF gerado.`);
      navigate('/dashboard');

    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao criar usuário: " + error.message);
    } finally {
      if (secondaryApp) await signOut(getAuth(secondaryApp));
      setLoading(false);
    }
  };

  if (checkingAuth) return <div className="loading-screen">Verificando permissões...</div>;

  return (
    <div className="cadastro-layout">
      <header className="tech-header-glass">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
           <span className="page-title">Gestão de Acessos</span>
        </div>
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>Cancelar ✖</button>
      </header>

      <div className="cadastro-container">
        <div className="form-card-glass">
          <div className="form-header">
            <h2>Cadastrar Novo Usuário</h2>
          </div>

          <form onSubmit={handleCriarUsuario} className="cadastro-form">
            <div className="form-row">
              <div className="form-group" style={{flex: 2}}>
                <label>Nome Completo</label>
                <input type="text" value={formData.nome} onChange={handleNomeChange} required autoFocus />
              </div>
              <div className="form-group" style={{flex: 1}}>
                <label>Data de Admissão</label>
                <input type="date" value={formData.admissao} onChange={(e) => setFormData({...formData, admissao: e.target.value})} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Unidade</label>
                <select value={formData.unidade} onChange={(e) => setFormData({...formData, unidade: e.target.value})}>
                  <option>Matriz SP - TechHub</option>
                  <option>Filial RJ - Centro</option>
                  <option>Filial MG - Savassi</option>
                  <option>Remoto</option>
                </select>
              </div>
            </div>

            <hr className="divider-neon" />

            <div className="auto-generated-section">
              <div className="form-row">
                <div className="form-group">
                  <label>E-mail Corporativo</label>
                  <input type="text" value={formData.email} readOnly className="input-generated"/>
                </div>
                <div className="form-group">
                  <label>Matrícula</label>
                  <input type="text" value={formData.matricula} readOnly className="input-generated"/>
                </div>
                <div className="form-group">
                  <label>Senha Provisória</label>
                  <div className="password-display">{formData.senha}</div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-create-user" disabled={loading || !formData.nome}>
                {loading ? 'A processar...' : 'Criar Usuário e Gerar PDF'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}