import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase'; // Importação do Banco
import { ref, onValue, push, update, remove } from 'firebase/database'; // Funções do Firebase
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

  // Lista de Tarefas (Começa vazia, será preenchida pelo Firebase)
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. LEITURA EM TEMPO REAL (FIREBASE) ---
  useEffect(() => {
    const tarefasRef = ref(db, 'tarefas');

    // O onValue fica "escutando" mudanças. Se alguém criar uma tarefa em outro PC, aparece aqui na hora.
    const unsubscribe = onValue(tarefasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // O Firebase devolve um Objeto { id1: {dados}, id2: {dados} }
        // Precisamos converter para Array [ {id: id1, ...dados}, {id: id2, ...dados} ]
        const listaTarefas = Object.entries(data).map(([key, value]) => ({
          id: key, 
          ...value
        }));
        setTarefas(listaTarefas);
      } else {
        setTarefas([]);
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Limpa o ouvinte ao sair da página
  }, []);

  // --- 2. SALVAR NOVA TAREFA (CREATE) ---
  const handleSalvar = (e) => {
    e.preventDefault();
    if (!novoItem.titulo.trim()) return alert("O título é obrigatório!");

    const tarefasRef = ref(db, 'tarefas');
    
    // O push gera um ID único automático e salva os dados
    push(tarefasRef, {
      titulo: novoItem.titulo,
      descricao: novoItem.descricao,
      status: 'todo', // Status inicial padrão
      prioridade: novoItem.prioridade,
      createdAt: new Date().toISOString()
    });

    setNovoItem({ titulo: '', descricao: '', prioridade: 'media' }); // Limpa form
    setModalAberto(false); // Fecha modal
  };

  // --- 3. MOVER TAREFA (UPDATE) ---
  const moverTarefa = (id, novoStatus) => {
    // Atualiza apenas o campo 'status' da tarefa específica
    const tarefaRef = ref(db, `tarefas/${id}`);
    update(tarefaRef, {
      status: novoStatus
    });
  };

  // --- 4. EXCLUIR TAREFA (DELETE) ---
  const excluirTarefa = (id) => {
    if(window.confirm("Remover esta tarefa permanentemente?")) {
      const tarefaRef = ref(db, `tarefas/${id}`);
      remove(tarefaRef);
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
          {loading && <p className="loading-text">Carregando...</p>}
          {!loading && itens.length === 0 && <p className="empty-msg">Vazio</p>}
          
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