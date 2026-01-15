import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import '../App.css';
import './Perfil.css';

export default function Perfil() {
  const navigate = useNavigate();

  // Estado com dados simulados do usuário
  const [userData, setUserData] = useState({
    nome: 'Guilherme Silva',
    cargo: 'Analista de Sistemas Pleno',
    email: 'guilherme.silva@techcorp.com.br',
    telefone: '(11) 99999-8888',
    nascimento: '1995-05-20',
    matricula: '123456',
    unidade: 'Matriz SP',
    admissao: '2022-03-15'
  });

  const [editando, setEditando] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSalvar = (e) => {
    e.preventDefault();
    setEditando(false);
    alert('Dados atualizados com sucesso! (Simulação)');
  };

  return (
    <div className="app-container">
      {/* Barra Superior Igual ao Dashboard */}
      <header className="top-bar">
        <div className="brand" onClick={() => navigate('/dashboard')} style={{cursor: 'pointer'}}>
          <Logo />
        </div>
        <div className="user-info">
          <div className="avatar">GS</div>
          <span>{userData.nome}</span>
        </div>
      </header>

      <div className="perfil-container">
        <div className="perfil-header">
          <button className="btn-voltar" onClick={() => navigate('/dashboard')}>
            ← Voltar
          </button>
          <h2>Meu Perfil</h2>
        </div>

        <div className="perfil-card">
          <div className="perfil-avatar-section">
            <div className="avatar-large">GS</div>
            <h3>{userData.nome}</h3>
            <p className="cargo-badge">{userData.cargo}</p>
          </div>

          <form onSubmit={handleSalvar} className="perfil-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Nome Completo</label>
                <input 
                  type="text" 
                  name="nome"
                  value={userData.nome} 
                  disabled={!editando}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>E-mail Corporativo</label>
                <input 
                  type="email" 
                  name="email"
                  value={userData.email} 
                  disabled={true} // E-mail geralmente não é editável
                  className="input-disabled"
                />
              </div>

              <div className="form-group">
                <label>Telefone / Celular</label>
                <input 
                  type="text" 
                  name="telefone"
                  value={userData.telefone} 
                  disabled={!editando}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Data de Nascimento</label>
                <input 
                  type="date" 
                  name="nascimento"
                  value={userData.nascimento} 
                  disabled={!editando}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Matrícula</label>
                <input type="text" value={userData.matricula} disabled className="input-disabled"/>
              </div>

              <div className="form-group">
                <label>Unidade</label>
                <input type="text" value={userData.unidade} disabled className="input-disabled"/>
              </div>
            </div>

            <div className="form-actions">
              {editando ? (
                <>
                  <button type="button" className="btn-cancelar" onClick={() => setEditando(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-salvar">
                    Salvar Alterações
                  </button>
                </>
              ) : (
                <button type="button" className="btn-editar" onClick={() => setEditando(true)}>
                  Editar Dados
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}