import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import './Tarefas.css';

export default function Tarefas() {
  const navigate = useNavigate();
  
  // Estado do Modal
  const [modalAberto, setModalAberto] = useState(false);

  // Estado do Formulário
  const [novoItem, setNovoItem] = useState({
    titulo: '',
    descricao: '',
    prioridade: 'media'
  });

  // Lista de Tarefas
  const [tarefas, setTarefas] = useState([
    { id: 1, titulo: 'Relatório Mensal', descricao: 'Compilar dados de vendas de SP e RJ.', status: 'todo', prioridade: 'alta' },
    { id: 2, titulo: 'Reunião Fornecedores', descricao: 'Discutir renovação de contrato de TI.', status: 'doing', prioridade: 'media' },
    { id: 3, titulo: 'Planilha de Custos', descricao: 'Atualizar abas de Janeiro e Fevereiro.', status: 'done', prioridade: 'baixa' },
  ]);

  // Salvar Nova Tarefa
  const handleSalvar = (e) => {
    e.preventDefault();
    if (!novoItem.titulo.trim()) return alert("O título é obrigatório!");

    const nova = {
      id: Date.now(),
      titulo: novoItem.titulo,
      descricao: novoItem.descricao,
      status: 'todo',
      prioridade: novoItem.prioridade
    };

    setTarefas([...tarefas, nova]);
    setNovoItem({ titulo: '', descricao: '', prioridade: 'media' }); // Limpa form
    setModalAberto(false); // Fecha modal
  };

  // Funções de Manipulação
  const moverTarefa = (id, novoStatus) => {
    setTarefas(tarefas.map(t => t.id === id ? { ...t, status: novoStatus } : t));
  };

  const excluirTarefa = (id) => {
    if(window.confirm("Remover esta tarefa?")) {
      setTarefas(tarefas.filter(t => t.id !== id));
    }
  };

  // Componente Coluna
  const Coluna = ({ titulo, status, icon }) => {
    const itens = tarefas.filter(t => t.status === status);

    return (
      <div className={`kanban-column column-${status}`}>
        <div className="column-header">
          <h3>{icon} {titulo}</h3>
          <span className="count-badge">{itens.length}</span>
        </div>
        
        <div className="column-body">
          {itens.length === 0 && <p className="empty-msg">Vazio</p>}
          
          {itens.map(item => (
            <div key={item.id} className={`task-card border-${item.prioridade}`}>
              <div className="card-top">
                <span className={`badge-prioridade ${item.prioridade}`}>{item.prioridade}</span>
                <button onClick={() => excluirTarefa(item.id)} className="btn-icon-delete" title="Excluir">✖</button>
              </div>
              
              <h4>{item.titulo}</h4>
              {item.descricao && <p className="task-desc">{item.descricao}</p>}
              
              <div className="task-actions">
                {status !== 'todo' && (
                  <button className="btn-move" onClick={() => moverTarefa(item.id, status === 'done' ? 'doing' : 'todo')}>⬅ Voltar</button>
                )}
                {status !== 'done' && (
                  <button className="btn-move" onClick={() => moverTarefa(item.id, status === 'todo' ? 'doing' : 'done')}>Avançar ➡</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      
      {/* --- MODAL DE NOVA TAREFA --- */}
      {modalAberto && (
        <div className="modal-overlay" onClick={() => setModalAberto(false)}>
          <div className="modal-content task-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nova Tarefa</h3>
              <button className="close-btn" onClick={() => setModalAberto(false)}>✖</button>
            </div>
            
            <form onSubmit={handleSalvar}>
              <div className="form-group">
                <label>Título da Tarefa</label>
                <input 
                  type="text" 
                  placeholder="Ex: Enviar relatório..." 
                  value={novoItem.titulo}
                  onChange={(e) => setNovoItem({...novoItem, titulo: e.target.value})}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Prioridade</label>
                <div className="priority-options">
                  {['baixa', 'media', 'alta'].map(p => (
                    <button
                      key={p}
                      type="button"
                      className={`p-btn ${p} ${novoItem.prioridade === p ? 'selected' : ''}`}
                      onClick={() => setNovoItem({...novoItem, prioridade: p})}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Descrição (Opcional)</label>
                <textarea 
                  rows="4" 
                  placeholder="Detalhes do que precisa ser feito..."
                  value={novoItem.descricao}
                  onChange={(e) => setNovoItem({...novoItem, descricao: e.target.value})}
                ></textarea>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setModalAberto(false)}>Cancelar</button>
                <button type="submit" className="btn-save">Salvar Tarefa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <header className="header-bar">
        <div className="logo-container"><Logo /></div>
        <div className="back-button" onClick={() => navigate('/dashboard')}>Voltar ao Menu ↩</div>
      </header>

      <div className="tarefas-container">
        <div className="page-header-row">
          <div className="text-group">
            <h2>Gestão de Tarefas</h2>
            <p>Organize suas atividades diárias.</p>
          </div>
          <button className="btn-new-task" onClick={() => setModalAberto(true)}>
            + Nova Tarefa
          </button>
        </div>

        <div className="kanban-board">
          <Coluna titulo="A Fazer" status="todo" icon="📝" />
          <Coluna titulo="Em Andamento" status="doing" icon="⚡" />
          <Coluna titulo="Concluído" status="done" icon="✅" />
        </div>
      </div>
    </div>
  );
}