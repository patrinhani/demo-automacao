import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase'; // <--- Importamos o auth
import { ref, onValue, push, update, remove } from 'firebase/database';
import Logo from '../components/Logo';
import { useAlert } from '../contexts/AlertContext'; // <-- Importado o AlertContext
import './Tarefas.css';

export default function Tarefas() {
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useAlert(); // <-- Inicializado o hook de alertas
  
  const [modalAberto, setModalAberto] = useState(false);
  const [novoItem, setNovoItem] = useState({
    titulo: '',
    descricao: '',
    prioridade: 'media'
  });

  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. LEITURA FILTRADA (APENAS MINHAS TAREFAS) ---
  useEffect(() => {
    const tarefasRef = ref(db, 'tarefas');

    const unsubscribe = onValue(tarefasRef, (snapshot) => {
      const data = snapshot.val();
      const user = auth.currentUser; // Pega usuário atual

      if (data && user) {
        // Filtra para pegar apenas tarefas onde userId == meu ID
        const listaTarefas = Object.entries(data)
          .map(([key, value]) => ({ id: key, ...value }))
          .filter(tarefa => tarefa.userId === user.uid);
          
        setTarefas(listaTarefas);
      } else {
        setTarefas([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- 2. SALVAR COM O ID DO USUÁRIO ---
  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!novoItem.titulo.trim()) {
      // <-- Substituído o alert nativo
      await showAlert("Aviso", "O título é obrigatório!");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      // <-- Substituído o alert nativo
      await showAlert("Erro", "Você precisa estar logado!");
      return;
    }

    const tarefasRef = ref(db, 'tarefas');
    
    push(tarefasRef, {
      titulo: novoItem.titulo,
      descricao: novoItem.descricao,
      status: 'todo',
      prioridade: novoItem.prioridade,
      createdAt: new Date().toISOString(),
      userId: user.uid // <--- O SEGREDO: Gravamos quem criou!
    });

    setNovoItem({ titulo: '', descricao: '', prioridade: 'media' });
    setModalAberto(false);
  };

  const moverTarefa = (id, novoStatus) => {
    const tarefaRef = ref(db, `tarefas/${id}`);
    update(tarefaRef, { status: novoStatus });
  };

  const excluirTarefa = async (id) => {
    // <-- Substituído o window.confirm nativo
    const confirmou = await showConfirm("Atenção", "Remover esta tarefa permanentemente?");
    if (confirmou) {
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
                <input type="text" placeholder="Ex: Enviar relatório..." value={novoItem.titulo} onChange={(e) => setNovoItem({...novoItem, titulo: e.target.value})} autoFocus />
              </div>
              <div className="form-group">
                <label>Prioridade</label>
                <div className="priority-options">
                  {['baixa', 'media', 'alta'].map(p => (
                    <button key={p} type="button" className={`p-btn ${p} ${novoItem.prioridade === p ? 'selected' : ''}`} onClick={() => setNovoItem({...novoItem, prioridade: p})}>{p.toUpperCase()}</button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Descrição (Opcional)</label>
                <textarea rows="4" placeholder="Detalhes..." value={novoItem.descricao} onChange={(e) => setNovoItem({...novoItem, descricao: e.target.value})}></textarea>
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
          <button className="btn-new-task" onClick={() => setModalAberto(true)}>+ Nova Tarefa</button>
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