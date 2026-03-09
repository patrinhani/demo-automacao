import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePassword } from "firebase/auth"; 
import { ref, update } from "firebase/database"; 
import { auth, db } from '../firebase';
import Logo from '../components/Logo';
import { useAlert } from '../contexts/AlertContext'; // <-- Importado o AlertContext
import './Login.css'; // Reutiliza o CSS da tela de login para manter o padrão visual

export default function TrocarSenha() {
  const navigate = useNavigate();
  const { showAlert } = useAlert(); // <-- Inicializado o hook do alerta
  
  // Estados do formulário
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Validações Locais
    if (novaSenha !== confirmarSenha) {
      setError("As senhas não coincidem. Tente novamente.");
      return;
    }

    if (novaSenha.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    const user = auth.currentUser;

    // Segurança: Se por algum motivo o usuário não estiver logado, chuta para fora
    if (!user) {
      // <-- Substituído o alert nativo
      await showAlert("Aviso", "Sessão expirada. Faça login novamente.");
      navigate('/');
      return;
    }

    try {
      // 2. Atualiza a senha no Firebase Authentication (Login Real)
      await updatePassword(user, novaSenha);

      // 3. Atualiza no Banco de Dados (Realtime DB)
      // Aqui salvamos a senha nova para consulta e removemos a obrigatoriedade de troca
      const userRef = ref(db, `users/${user.uid}`);
      
      await update(userRef, {
        forceChangePassword: false, // Libera o usuário para usar o sistema
        senha: novaSenha            // <--- IMPORTANTE: Salva a senha nova para testes
      });

      // Sucesso!
      // <-- Substituído o alert nativo
      await showAlert("Sucesso", "Senha atualizada com sucesso! Você será redirecionado.");
      navigate('/dashboard');

    } catch (err) {
      console.error("Erro ao trocar senha:", err);
      
      // Tratamento de erro específico do Firebase
      if (err.code === 'auth/requires-recent-login') {
        setError("Por segurança, esta operação exige um login recente. Saia e entre novamente.");
      } else if (err.code === 'auth/weak-password') {
        setError("A senha escolhida é muito fraca.");
      } else {
        setError("Erro ao atualizar senha: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="ambient-light light-1"></div>
      
      <div className="login-glass-card" style={{borderColor: '#f59e0b', boxShadow: '0 0 30px rgba(245, 158, 11, 0.2)'}}> 
        <div className="login-header">
          <div style={{transform: 'scale(0.9)', marginBottom: '10px'}}>
            <Logo />
          </div>
          <h2 style={{color: '#f59e0b', fontSize: '1.5rem'}}>Troca Obrigatória</h2>
          <p style={{fontSize: '0.9rem', opacity: 0.8}}>
            Por segurança, você deve redefinir sua senha provisória antes de continuar.
          </p>
        </div>

        {error && (
          <div className="error-banner" style={{background: 'rgba(220, 38, 38, 0.2)', color: '#fca5a5', border: '1px solid #ef4444'}}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label style={{color: '#f59e0b'}}>Nova Senha</label>
            <input 
              type="password" 
              placeholder="Crie uma nova senha segura" 
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              required
              className="tech-input"
              style={{borderColor: '#f59e0b'}}
            />
          </div>

          <div className="input-group">
            <label style={{color: '#f59e0b'}}>Confirmar Nova Senha</label>
            <input 
              type="password" 
              placeholder="Digite a senha novamente" 
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
              className="tech-input"
              style={{borderColor: '#f59e0b'}}
            />
          </div>

          <button 
            type="submit" 
            className="btn-login" 
            disabled={loading}
            style={{
              background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              marginTop: '10px'
            }}
          >
            {loading ? 'Atualizando...' : 'Confirmar e Acessar ➔'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>Ambiente Seguro • TechCorp Security</p>
        </div>
      </div>
    </div>
  );
}