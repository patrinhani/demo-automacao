import { useState } from 'react'; // <--- Adicione useState
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from "firebase/auth"; // <--- Importe a função do Firebase
import { auth } from '../firebase'; // <--- Importe o auth que acabamos de criar
import Logo from '../components/Logo';
import '../App.css';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(''); // Estado para o email
  const [password, setPassword] = useState(''); // Estado para a senha
  const [error, setError] = useState(''); // Estado para erros visuais

  const handleLogin = async (e) => { // <--- Transforme em async
    e.preventDefault();
    setError(''); // Limpa erros anteriores

    try {
      // Tenta logar no Firebase
      await signInWithEmailAndPassword(auth, email, password);
      
      // Se der certo, redireciona
      navigate('/dashboard');
    } catch (error) {
      console.error("Erro ao logar:", error);
      // Tratamento básico de erros
      if (error.code === 'auth/invalid-credential') {
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
              onChange={(e) => setEmail(e.target.value)} // Atualiza estado
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
              onChange={(e) => setPassword(e.target.value)} // Atualiza estado
              required
            />
          </div>

          {/* Exibe erro se houver, sem quebrar a tela */}
          {error && <p style={{ color: '#ff4d4d', fontSize: '0.9rem', textAlign: 'center' }}>{error}</p>}

          <button type="submit" className="btn-neon">
            Entrar no Sistema
          </button>
        </form>

        <div className="login-footer">
          <p>Esqueceu sua senha? <span className="link-highlight">Recuperar acesso</span></p>
        </div>
      </div>
    </div>
  );
}