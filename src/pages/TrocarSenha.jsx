import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePassword, onAuthStateChanged } from "firebase/auth"; 
import { ref, update } from "firebase/database"; 
import { auth, db } from '../firebase';
import Logo from '../components/Logo';
import { useAlert } from '../contexts/AlertContext';
import './TrocarSenha.css';

export default function TrocarSenha() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Segurança Adicional: Verifica se o utilizador tem permissão para estar aqui
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/'); // Se não estiver com o login feito, volta para a página inicial
      }
    });
    return () => unsubscribe();
  }, [navigate]);

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

    try {
      // 1. Atualiza no Firebase Auth
      await updatePassword(user, novaSenha);

      // 2. Atualiza no Realtime Database para libertar o acesso
      const userRef = ref(db, `users/${user.uid}`);
      await update(userRef, {
        forceChangePassword: false, // Remove o bloqueio
        senha: novaSenha
      });

      // 3. Só após a confirmação da base de dados, permitimos a saída
      await showAlert("Sucesso", "Senha atualizada! Agora tem acesso total ao sistema.");
      navigate('/dashboard');

    } catch (err) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setError("Sessão expirada. Por favor, saia e faça login novamente para validar a troca.");
      } else {
        setError("Erro crítico ao guardar a nova senha. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page-container">
      <div className="ambient-glow"></div>
      
      <div className="reset-card"> 
        <div className="reset-header">
          <div className="logo-wrapper">
            <Logo />
          </div>
          <h2 className="mandatory-title">Acesso Bloqueado</h2>
          <p>Está a usar uma senha temporária. <strong>É obrigatório</strong> definir uma nova senha para continuar.</p>
        </div>

        {error && <div className="reset-error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="reset-form">
          <div className="input-field-group">
            <label>Nova Senha</label>
            <input 
              type="password" 
              placeholder="Digite a nova senha" 
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="input-field-group">
            <label>Confirmar Nova Senha</label>
            <input 
              type="password" 
              placeholder="Repita a nova senha" 
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="reset-submit-btn mandatory" 
            disabled={loading}
          >
            {loading ? <span className="loader"></span> : 'Guardar e Desbloquear Sistema ➔'}
          </button>
        </form>
        
        <div className="reset-footer">
          <p>Segurança TechCorp • Protocolo de Troca Obrigatória</p>
        </div>
      </div>
    </div>
  );
}