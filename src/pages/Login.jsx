import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import '../App.css'; // ou './Login.css' se preferir separar
import './Login.css';
export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="login-container">
      {/* Fundo Animado */}
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
            <input type="email" placeholder="usuario@techcorp.com" className="glass-input" />
          </div>

          <div className="input-group">
            <label>Senha</label>
            <input type="password" placeholder="••••••••" className="glass-input" />
          </div>

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