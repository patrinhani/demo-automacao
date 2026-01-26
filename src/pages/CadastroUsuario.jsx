import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { ref, set } from "firebase/database"; 
import { db, auth, firebaseConfig } from '../firebase'; 
import Logo from '../components/Logo';
import './CadastroUsuario.css';

// --- TABELA DA SORTE (CARGOS E SALÁRIOS) ---
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
    admissao: new Date().toISOString().split('T')[0], // Padrão hoje
    email: '',
    matricula: '',
    senha: 'Mudar@123'
  });

  // --- 1. SEGURANÇA ---
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

  // --- 2. GERAÇÃO AUTOMÁTICA DE EMAIL/MATRÍCULA ---
  const gerarEmail = (nomeCompleto) => {
    if (!nomeCompleto) return '';
    const textoLimpo = nomeCompleto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const partes = textoLimpo.trim().toLowerCase().split(/\s+/);
    if (partes.length === 0) return '';
    if (partes.length === 1) return `${partes[0]}@techcorp.com.br`;
    const primeiro = partes[0];
    const ultimo = partes[partes.length - 1];
    return `${primeiro}.${ultimo}@techcorp.com.br`;
  };

  const gerarMatricula = () => {
    const aleatorio = Math.floor(10000 + Math.random() * 90000);
    return `900${aleatorio}`;
  };

  const handleNomeChange = (e) => {
    const novoNome = e.target.value;
    setFormData(prev => ({
      ...prev,
      nome: novoNome,
      email: gerarEmail(novoNome),
      matricula: prev.matricula || gerarMatricula()
    }));
  };

  // --- 3. CRIAR NO FIREBASE COM SORTEIO ---
  const handleCriarUsuario = async (e) => {
    e.preventDefault();
    setLoading(true);
    let secondaryApp = null;

    try {
      // 🎲 AQUI ACONTECE O SORTEIO MÁGICO 🎲
      const cargoSorteado = TABELA_CARGOS[Math.floor(Math.random() * TABELA_CARGOS.length)];
      
      // Cria app secundário
      secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getAuth(secondaryApp);

      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth, 
        formData.email, 
        formData.senha
      );
      
      const novoUid = userCredential.user.uid;

      // Salva no Realtime Database com os dados sorteados
      await set(ref(db, `users/${novoUid}`), {
        nome: formData.nome,
        email: formData.email,
        matricula: formData.matricula,
        unidade: formData.unidade,
        admissao: formData.admissao,
        
        // --- DADOS DO SORTEIO ---
        cargo: cargoSorteado.cargo,
        setor: cargoSorteado.setor, // Adicionei setor pra ficar mais completo
        salarioBase: cargoSorteado.salario,
        // ------------------------

        role: 'colaborador',
        forceChangePassword: true,
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser.uid
      });

      alert(`✅ USUÁRIO CRIADO COM SUCESSO!\n\n🎲 RESULTADO DO SORTEIO:\nCargo: ${cargoSorteado.cargo}\nSalário: R$ ${cargoSorteado.salario.toLocaleString('pt-BR')}\n\nO holerite já foi gerado com esses valores.`);
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
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>

      <header className="tech-header-glass">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
           <span className="page-title">Gestão de Acessos</span>
        </div>
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>
          Cancelar ✖
        </button>
      </header>

      <div className="cadastro-container">
        <div className="form-card-glass">
          <div className="form-header">
            <h2>Cadastrar Novo Usuário (Modo Roleta 🎲)</h2>
            <p>Preencha os dados básicos. O cargo e salário serão sorteados pelo sistema!</p>
          </div>

          <form onSubmit={handleCriarUsuario} className="cadastro-form">
            
            {/* LINHA 1: Nome e Data */}
            <div className="form-row">
              <div className="form-group" style={{flex: 2}}>
                <label>Nome Completo</label>
                <input 
                  type="text" 
                  value={formData.nome}
                  onChange={handleNomeChange}
                  placeholder="Ex: Pedro de Alcântara Santos"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group" style={{flex: 1}}>
                <label>Data de Admissão</label>
                <input 
                  type="date" 
                  value={formData.admissao}
                  onChange={(e) => setFormData({...formData, admissao: e.target.value})}
                  required
                />
              </div>
            </div>

            {/* LINHA 2: Unidade e Aviso do Sorteio */}
            <div className="form-row">
              <div className="form-group">
                <label>Unidade</label>
                <select 
                  value={formData.unidade}
                  onChange={(e) => setFormData({...formData, unidade: e.target.value})}
                >
                  <option>Matriz SP - TechHub</option>
                  <option>Filial RJ - Centro</option>
                  <option>Filial MG - Savassi</option>
                  <option>Remoto</option>
                </select>
              </div>
              <div className="form-group">
                <label>Cargo & Salário</label>
                <div className="input-generated" style={{textAlign:'center', fontStyle:'italic', color: '#f59e0b'}}>
                   🎲 Serão definidos no clique!
                </div>
              </div>
            </div>

            <hr className="divider-neon" />

            <div className="auto-generated-section">
              <h4 className="section-subtitle">Credenciais Automáticas</h4>
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
                  <label>Senha Inicial</label>
                  <div className="password-display">
                    {formData.senha}
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-create-user" disabled={loading || !formData.nome}>
                {loading ? 'Sorteando...' : '🎲 Criar e Sortear Cargo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
