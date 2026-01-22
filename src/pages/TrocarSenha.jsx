import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePassword } from "firebase/auth"; // Função para trocar senha
import { ref, update } from "firebase/database"; // Função para atualizar banco
import { auth, db } from '../firebase';
import Logo from '../components/Logo';
import './Login.css'; // Podemos reaproveitar o CSS do Login

export default function TrocarSenha() {
  const navigate = useNavigate();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (novaSenha !== confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }

    if (novaSenha.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    const user = auth.currentUser;

    if (!user) {
      alert("Sessão expirada. Faça login novamente.");
      navigate('/');
      return;
    }

    try {
      // 1. Atualiza a senha no Auth (Firebase Security)
      await updatePassword(user, novaSenha);

      // 2. Remove a obrigatoriedade no Banco de Dados
      const userRef = ref(db, `users/${user.uid}`);
      await update(userRef, {
        forceChangePassword: false // Libera o usuário
      });

      alert("Senha atualizada com sucesso!");
      navigate('/dashboard');

    } catch (err) {
      console.error(err);
      setError("Erro ao atualizar senha. Tente uma senha mais forte ou faça login novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="ambient-light light-1"></div>
      
      <div className="login-glass-card" style={{borderColor: '#f59e0b'}}> {/* Borda Laranja de Alerta */}
        <div className="login-header">
          <Logo />
          <h2 style={{color: '#f59e0b'}}>Troca Obrigatória</h2>
          <p>Por segurança, redefina sua senha provisória.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Nova Senha</label>
            <input 
              type="password" 
              placeholder="Mínimo 6 caracteres" 
              className="glass-input"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Confirmar Nova Senha</label>
            <input 
              type="password" 
              placeholder="Repita a senha" 
              className="glass-input"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
            />
          </div>

          {error && <p style={{color: '#ff4d4d', textAlign: 'center'}}>{error}</p>}

          <button type="submit" className="btn-neon" disabled={loading} style={{background: '#f59e0b'}}>
            {loading ? 'Atualizando...' : 'Definir Nova Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}