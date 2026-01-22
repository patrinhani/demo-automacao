import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { ref, onValue, update } from 'firebase/database';
import Logo from '../components/Logo';
import '../App.css';
import './Perfil.css';

export default function Perfil() {
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    nome: '',
    cargo: '',
    email: '',
    telefone: '',
    nascimento: '',
    matricula: '',
    unidade: 'Matriz SP - TechHub',
    admissao: ''
  });

  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);

  // --- FUNÇÕES AUXILIARES ---

  // Gera matrícula: Começa com 900 e adiciona 5 números aleatórios
  const gerarMatricula = () => {
    const aleatorio = Math.floor(10000 + Math.random() * 90000); // 5 dígitos
    return `900${aleatorio}`;
  };

  // Formata telefone: (11) 99999-8888
  const formatarTelefone = (valor) => {
    if (!valor) return "";
    valor = valor.replace(/\D/g, ""); // Remove tudo que não é número
    valor = valor.replace(/^(\d{2})(\d)/g, "($1) $2"); // Coloca parênteses
    valor = valor.replace(/(\d)(\d{4})$/, "$1-$2"); // Coloca hífen
    return valor;
  };

  // --- CARREGAR DADOS ---
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/');
      return;
    }

    setUserData(prev => ({ ...prev, email: user.email }));

    const userRef = ref(db, `users/${user.uid}`);
    
    // Ouve os dados do banco
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        // Se já existe, carrega
        setUserData(prev => ({ ...prev, ...data }));
      } else {
        // --- PRIMEIRO ACESSO ---
        // Se o usuário não tem dados no banco, geramos a matrícula agora
        const novaMatricula = gerarMatricula();
        setUserData(prev => ({ ...prev, matricula: novaMatricula }));
        
        // (Opcional) Já salvamos a matrícula no banco para garantir que ela não mude
        update(userRef, { matricula: novaMatricula });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // --- SALVAR ---
  const handleSalvar = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userRef = ref(db, `users/${user.uid}`);
      
      await update(userRef, {
        nome: userData.nome,
        cargo: userData.cargo,
        telefone: userData.telefone, // Salva já formatado
        nascimento: userData.nascimento,
        matricula: userData.matricula, // Salva a matrícula gerada
        unidade: userData.unidade,
      });

      setEditando(false);
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar alterações.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Aplica formatação se for telefone
    if (name === 'telefone') {
      setUserData(prev => ({ ...prev, [name]: formatarTelefone(value) }));
    } else {
      setUserData(prev => ({ ...prev, [name]: value }));
    }
  };

  if (loading) return <div className="loading-screen">Carregando perfil...</div>;

  return (
    <div className="tech-layout-perfil">
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>
      
      <header className="tech-header-glass">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
           <span className="page-title">Configurações de Conta</span>
        </div>
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>
          Voltar ao Menu ↩
        </button>
      </header>

      <div className="perfil-container-tech">
        <div className="perfil-header-tech">
          <h2 className="titulo-neon">Minhas Informações</h2>
          <p style={{color: '#94a3b8', margin: 0}}>Mantenha seus dados cadastrais atualizados.</p>
        </div>

        <div className="perfil-card-glass">
          {/* COLUNA ESQUERDA (AVATAR) */}
          <div className="perfil-sidebar-tech">
            <div className="avatar-large-tech">
              {userData.nome ? userData.nome.substring(0,2).toUpperCase() : '??'}
              <div className="status-dot"></div>
            </div>
            <h3 className="user-name-tech">{userData.nome || 'Usuário Novo'}</h3>
            <p className="user-role-tech">{userData.cargo || 'Cargo não definido'}</p>
            
            <div className="info-badges">
              {/* Exibe a Matrícula Gerada */}
              <span className="badge-tech">Matrícula: {userData.matricula}</span>
              <span className="badge-tech" style={{fontSize: '0.7rem'}}>{userData.email}</span>
            </div>
          </div>

          {/* COLUNA DIREITA (FORMULÁRIO) */}
          <form onSubmit={handleSalvar} className="perfil-form-tech">
            <div className="form-header">
              <h3>Dados Pessoais</h3>
              <p>Edite suas informações de contato e cargo.</p>
            </div>

            <div className="form-grid-tech">
              <div className="form-group-tech">
                <label>Nome Completo</label>
                <input 
                  type="text" 
                  name="nome"
                  value={userData.nome} 
                  disabled={!editando}
                  onChange={handleChange}
                  placeholder="Seu nome aqui"
                  className={editando ? 'editable' : ''}
                />
              </div>

              <div className="form-group-tech">
                <label>Cargo Atual</label>
                <input 
                  type="text" 
                  name="cargo"
                  value={userData.cargo} 
                  disabled={!editando}
                  onChange={handleChange}
                  placeholder="Ex: Desenvolvedor Front-end"
                  className={editando ? 'editable' : ''}
                />
              </div>

              <div className="form-group-tech">
                <label>E-mail de Acesso</label>
                <input 
                  type="email" 
                  value={userData.email} 
                  disabled={true} 
                  className="locked"
                />
              </div>

              <div className="form-group-tech">
                <label>Telefone / Celular</label>
                <input 
                  type="text" 
                  name="telefone"
                  value={userData.telefone} 
                  disabled={!editando}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                  maxLength="15" // Limite para formato (XX) XXXXX-XXXX
                  className={editando ? 'editable' : ''}
                />
              </div>

              <div className="form-group-tech">
                <label>Data de Nascimento</label>
                <input 
                  type="date" 
                  name="nascimento"
                  value={userData.nascimento} 
                  disabled={!editando}
                  onChange={handleChange}
                  className={editando ? 'editable' : ''}
                />
              </div>

              <div className="form-group-tech">
                <label>Matrícula (Automática)</label>
                <input 
                  type="text" 
                  value={userData.matricula} 
                  disabled={true} 
                  className="locked"
                  style={{ color: '#3b82f6', fontWeight: 'bold' }}
                />
              </div>
            </div>

            <div className="form-actions-tech">
              {editando ? (
                <>
                  <button type="button" className="btn-cancelar-tech" onClick={() => setEditando(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-salvar-tech">
                    Salvar Alterações
                  </button>
                </>
              ) : (
                <button type="button" className="btn-editar-tech" onClick={() => setEditando(true)}>
                  ✎ Editar Informações
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}