import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import '../App.css';
import './Perfil.css';

export default function Perfil() {
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    nome: 'Guilherme Silva',
    cargo: 'Analista de Sistemas Pleno',
    email: 'guilherme.silva@techcorp.com.br',
    telefone: '(11) 99999-8888',
    nascimento: '1995-05-20',
    matricula: '829304',
    unidade: 'Matriz SP - TechHub',
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
    // Simulação de salvamento
    alert('Perfil atualizado com sucesso!');
  };

  return (
    <div className="tech-layout-perfil">
      
      {/* LUZES DE FUNDO ANIMADAS */}
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>
      
      {/* HEADER TECH */}
      <header className="tech-header-glass">
        <div className="brand" onClick={() => navigate('/dashboard')} style={{cursor: 'pointer'}}>
          <Logo />
        </div>
        <div className="tech-user-badge">
          <div className="avatar-mini">GS</div>
          <span>{userData.nome}</span>
        </div>
      </header>

      <div className="perfil-container-tech">
        
        <div className="perfil-header-tech">
          <button className="btn-voltar-tech" onClick={() => navigate('/dashboard')}>
            ← Voltar ao Dashboard
          </button>
          <h2 className="titulo-neon">Meu Perfil</h2>
        </div>

        {/* CARD PRINCIPAL COM EFEITO DE VIDRO */}
        <div className="perfil-card-glass">
          
          {/* COLUNA ESQUERDA (AVATAR) */}
          <div className="perfil-sidebar-tech">
            <div className="avatar-large-tech">
              GS
              <div className="status-dot"></div>
            </div>
            <h3 className="user-name-tech">{userData.nome}</h3>
            <p className="user-role-tech">{userData.cargo}</p>
            
            <div className="info-badges">
              <span className="badge-tech">Matrícula: {userData.matricula}</span>
              <span className="badge-tech">Admissão: 2022</span>
            </div>
          </div>

          {/* COLUNA DIREITA (FORMULÁRIO) */}
          <form onSubmit={handleSalvar} className="perfil-form-tech">
            <div className="form-header">
              <h3>Dados Pessoais</h3>
              <p>Gerencie suas informações de contato e cadastro.</p>
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
                  className={editando ? 'editable' : ''}
                />
              </div>

              <div className="form-group-tech">
                <label>E-mail Corporativo</label>
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
                <label>Unidade de Lotação</label>
                <input type="text" value={userData.unidade} disabled className="locked"/>
              </div>
              
              <div className="form-group-tech">
                <label>Cargo Atual</label>
                <input type="text" value={userData.cargo} disabled className="locked"/>
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