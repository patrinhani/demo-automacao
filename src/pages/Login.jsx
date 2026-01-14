import { useNavigate } from 'react-router-dom';
import '../App.css'; 

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>TechCorp Solutions</h1>
          <p>Portal do Colaborador</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group" style={{marginBottom: '15px'}}>
            <label>Usuário de Rede</label>
            <input type="text" placeholder="ex: br.joao.silva" />
          </div>

          <div className="form-group" style={{marginBottom: '25px'}}>
            <label>Senha</label>
            <input type="password" placeholder="••••••••" />
          </div>

          <button type="submit" className="btn-login">
            ACESSAR SISTEMA
          </button>
        </form>
        
        <div className="login-footer">
          © 2024 TechCorp Internal Systems v4.2
        </div>
      </div>
    </div>
  );
}