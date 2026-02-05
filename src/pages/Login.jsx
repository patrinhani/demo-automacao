import { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from "firebase/auth"; 
import { ref, get } from "firebase/database"; 
import { auth, db } from '../firebase'; 
import Logo from '../components/Logo';
import '../App.css';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- 🤖 CÉREBRO DO ROBÔ (Faltava este bloco!) ---
  useEffect(() => {
    // 1. Lê a URL para ver se tem o crachá 'auth_bypass'
    const params = new URLSearchParams(window.location.search);
    const isRobo = params.get('auth_bypass');

    if (isRobo === 'true') {
      console.log("🤖 Protocolo de Automação Detectado!");
      setLoading(true); 
      
      // 2. Faz o login automático com a conta 'demo'
      signInWithEmailAndPassword(auth, "demo@tech.com", "123456")
        .then(() => {
          console.log("✅ Robô entrou! Redirecionando...");
          navigate("/dashboard"); 
        })
        .catch((err) => {
          console.error("❌ O Robô foi barrado:", err);
          setError("Erro: Usuário demo@tech.com não encontrado ou senha incorreta.");
          setLoading(false);
        });
    }
  }, []); 
  // ------------------------------------------------

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);
      const userData = snapshot.val();

      if (userData && userData.forceChangePassword === true) {
        navigate('/trocar-senha');
      } else {
        navigate('/dashboard');
      }

    } catch (error) {
      console.error("Erro ao logar:", error);
      setLoading(false);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        setError('E-mail ou senha incorretos.');
      } else {
        setError('Falha ao entrar. Verifique sua conexão.');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>

      <div className="login-glass-card">
        <div className="login-header">
          <Logo />
          <h2>Bem-vindo de volta</h2>
          <p>Acesse sua conta corporativa</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>E-mail Corporativo</label>
            <input 
              type="email" 
              placeholder="usuario@techcorp.com" 
              className="glass-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Senha</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="glass-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="error-msg" style={{color: '#ff4d4d', fontWeight: 'bold'}}>{error}</p>}

          <button type="submit" className="btn-neon" disabled={loading}>
            {loading ? 'Verificando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="login-footer">
          <p>Esqueceu sua senha? <span className="link-highlight">Recuperar acesso</span></p>
        </div>
      </div>
    </div>
  );
}