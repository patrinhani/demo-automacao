import { useState } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from "firebase/auth"; // Importa a função de login
import { auth } from '../firebase'; // Importa a conexão que configuramos
import Logo from '../components/Logo';
import '../App.css';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ESTA É A MÁGICA:
      // Envia email/senha para o Firebase. Se estiver certo, o Firebase devolve o Usuário (e o ID dele)
      // e salva isso na sessão do navegador automaticamente.
      await signInWithEmailAndPassword(auth, email, password);
      
      navigate('/dashboard');
    } catch (error) {
      console.error("Erro ao logar:", error);
      setLoading(false);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        setError('E-mail ou senha incorretos.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Tente mais tarde.');
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

          {error && <p style={{ color: '#ff4d4d', fontSize: '0.9rem', textAlign: 'center', marginBottom: '10px' }}>{error}</p>}

          <button type="submit" className="btn-neon" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="login-footer">
          <p>Esqueceu sua senha? <span className="link-highlight">Recuperar acesso</span></p>
        </div>
      </div>
    </div>
  );
}