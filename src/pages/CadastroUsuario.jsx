import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { ref, set, get } from "firebase/database"; // Adicionado 'get' para segurança
import { db, auth, firebaseConfig } from '../firebase'; // Importa auth atual também
import Logo from '../components/Logo';
import './CadastroUsuario.css';

export default function CadastroUsuario() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true); // Estado para verificar permissão

  const [formData, setFormData] = useState({
    nome: '',
    cargo: '',
    unidade: 'Matriz SP - TechHub',
    email: '',
    matricula: '',
    senha: 'Mudar@123'
  });

  // --- 1. SEGURANÇA: VERIFICAR SE O USUÁRIO ATUAL PODE ESTAR AQUI ---
  useEffect(() => {
    const verificarPermissao = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/'); // Se não tá logado, tchau
        return;
      }

      // Busca o perfil do usuário logado para ver se ele é admin/gestor
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);
      const dados = snapshot.val();

      // REGRA DE SEGURANÇA:
      // Se não tiver dados OU o cargo não incluir "Gestor" ou "Admin" (ajuste conforme sua preferência)
      // Bloqueia o acesso.
      // Nota: Idealmente use um campo 'role': 'admin' no banco. Aqui vou verificar o cargo ou role.
      const ehAutorizado = dados && (dados.role === 'admin' || dados.role === 'gestor' || (dados.cargo && dados.cargo.includes('Gestor')));

      if (!ehAutorizado) {
        alert("ACESSO NEGADO: Apenas Gestores podem criar novos usuários.");
        navigate('/dashboard');
      }
      setCheckingAuth(false);
    };

    verificarPermissao();
  }, [navigate]);

  // --- 2. LÓGICA DE NOME E E-MAIL (PRIMEIRO + ÚLTIMO) ---
  const gerarEmail = (nomeCompleto) => {
    if (!nomeCompleto) return '';
    
    // Remove acentos
    const textoLimpo = nomeCompleto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Divide por espaços (remove espaços duplos)
    const partes = textoLimpo.trim().toLowerCase().split(/\s+/);
    
    if (partes.length === 0) return '';
    
    // Se tiver só um nome: joao@...
    if (partes.length === 1) return `${partes[0]}@techcorp.com.br`;
    
    // Se tiver mais de um (ex: "Pedro de Alcântara Francisco Santos")
    // Pega "pedro" e "santos" -> pedro.santos@...
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

  // --- 3. CRIAÇÃO DO USUÁRIO (APP SECUNDÁRIO) ---
  const handleCriarUsuario = async (e) => {
    e.preventDefault();
    setLoading(true);
    let secondaryApp = null;

    try {
      // Inicializa app secundário para não deslogar o gestor
      secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getAuth(secondaryApp);

      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth, 
        formData.email, 
        formData.senha
      );
      
      const novoUid = userCredential.user.uid;

      // Salva no banco principal
      await set(ref(db, `users/${novoUid}`), {
        nome: formData.nome,
        cargo: formData.cargo,
        email: formData.email,
        matricula: formData.matricula,
        unidade: formData.unidade,
        role: 'colaborador', // Cria como colaborador padrão
        forceChangePassword: true,
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser.uid // Auditoria: quem criou
      });

      alert(`Sucesso!\nColaborador: ${formData.nome}\nEmail: ${formData.email}\nSenha: ${formData.senha}`);
      navigate('/dashboard');

    } catch (error) {
      console.error("Erro:", error);
      if (error.code === 'auth/email-already-in-use') {
        alert("Erro: Este e-mail já existe. Tente usar um nome diferente.");
      } else {
        alert("Erro: " + error.message);
      }
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
            <h2>Cadastrar Novo Usuário</h2>
            <p>Os dados de acesso serão gerados automaticamente.</p>
          </div>

          <form onSubmit={handleCriarUsuario} className="cadastro-form">
            <div className="form-row">
              <div className="form-group">
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

              <div className="form-group">
                <label>Cargo / Função</label>
                <input 
                  type="text" 
                  value={formData.cargo}
                  onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                  placeholder="Ex: Desenvolvedor Jr"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Unidade</label>
              <select 
                value={formData.unidade}
                onChange={(e) => setFormData({...formData, unidade: e.target.value})}
              >
                <option>Matriz SP - TechHub</option>
                <option>Filial RJ - Centro</option>
                <option>Filial MG - Savassi</option>
                <option>Remoto / Home Office</option>
              </select>
            </div>

            <hr className="divider-neon" />

            <div className="auto-generated-section">
              <h4 className="section-subtitle">Credenciais Automáticas</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>E-mail (Primeiro.Ultimo)</label>
                  <input type="text" value={formData.email} readOnly className="input-generated"/>
                </div>
                <div className="form-group">
                  <label>Matrícula (900...)</label>
                  <input type="text" value={formData.matricula} readOnly className="input-generated"/>
                </div>
              </div>
              <div className="form-group">
                <label>Senha Inicial</label>
                <div className="password-display">
                  {formData.senha}
                  <span className="password-note">Padrão</span>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-create-user" disabled={loading || !formData.nome}>
                {loading ? 'Criando...' : 'Criar Acesso 🚀'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}