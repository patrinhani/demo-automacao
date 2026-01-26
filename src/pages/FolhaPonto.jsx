import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { ref, onValue, set, update } from "firebase/database";
import Logo from '../components/Logo';
import './FolhaPonto.css';

export default function FolhaPonto() {
  const navigate = useNavigate();
  
  // Estados para Data e Hora
  const [dataHoje, setDataHoje] = useState(new Date());
  const [horaAtual, setHoraAtual] = useState(new Date());

  // Estado dos Registros (vêm do Firebase)
  const [registros, setRegistros] = useState({
    entrada: null,
    almoco_ida: null,
    almoco_volta: null,
    saida: null
  });

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Formata data para usar como CHAVE no banco (Ex: 2023-10-25)
  const getDataKey = (date) => date.toISOString().split('T')[0];

  // 1. RELÓGIO E AUTENTICAÇÃO
  useEffect(() => {
    // Relógio em tempo real
    const timer = setInterval(() => setHoraAtual(new Date()), 1000);

    // Listener do Usuário + Busca de Dados
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Busca os pontos de HOJE no Firebase
        const dateKey = getDataKey(new Date());
        const pontoRef = ref(db, `ponto/${currentUser.uid}/${dateKey}`);
        
        onValue(pontoRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setRegistros({
              entrada: data.entrada || null,
              almoco_ida: data.almoco_ida || null,
              almoco_volta: data.almoco_volta || null,
              saida: data.saida || null
            });
          }
          setLoading(false);
        });

      } else {
        navigate('/');
      }
    });

    return () => {
      clearInterval(timer);
      unsubscribeAuth();
    };
  }, [navigate]);

  // 2. FUNÇÃO DE BATER PONTO
  const registrarPonto = async (tipo) => {
    if (!user) return;

    const horarioFormatado = horaAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dateKey = getDataKey(new Date());
    
    // Referência do dia específico
    const diaRef = ref(db, `ponto/${user.uid}/${dateKey}`);

    try {
      // Atualiza apenas o campo clicado
      await update(diaRef, {
        [tipo]: horarioFormatado,
        userId: user.uid,
        data: dateKey,
        timestamp: Date.now() // Útil para ordenação se precisar
      });
      alert(`Ponto de ${tipo.replace('_', ' ').toUpperCase()} registrado: ${horarioFormatado}`);
    } catch (error) {
      console.error("Erro ao registrar:", error);
      // Se o nó não existir, 'update' falha em alguns casos se não tiver raiz, 
      // mas no Firebase Realtime 'update' cria se precisar. 
      // Por segurança, usamos 'set' com merge manual se der erro, mas 'update' é o padrão.
      alert("Erro ao registrar ponto.");
    }
  };

  // Helper para formatar exibição
  const formatarDataExtenso = (date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <div className="tech-layout-ponto">
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>

      <header className="tech-header-glass">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
           <span className="page-title">Controle de Ponto</span>
        </div>
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>
          Voltar ↩
        </button>
      </header>

      <div className="ponto-container">
        
        {/* CARD DO RELÓGIO */}
        <div className="clock-card glass-effect">
          <h2 className="time-display">
            {horaAtual.toLocaleTimeString('pt-BR')}
          </h2>
          <p className="date-display">
            {formatarDataExtenso(dataHoje)}
          </p>
          <div className="status-badge-ponto">
            {loading ? 'Sincronizando...' : 'Online • Sincronizado'}
          </div>
        </div>

        {/* GRID DE REGISTROS */}
        <div className="registers-grid">
          
          {/* ENTRADA */}
          <div className={`register-card ${registros.entrada ? 'filled' : ''}`}>
            <span className="card-label">Entrada</span>
            <div className="time-value">
              {registros.entrada || '--:--'}
            </div>
            <button 
              className="btn-register" 
              onClick={() => registrarPonto('entrada')}
              disabled={!!registros.entrada}
            >
              {registros.entrada ? 'Registrado' : 'Registrar'}
            </button>
          </div>

          {/* ALMOÇO (IDA) */}
          <div className={`register-card ${registros.almoco_ida ? 'filled' : ''}`}>
            <span className="card-label">Almoço (Ida)</span>
            <div className="time-value">
              {registros.almoco_ida || '--:--'}
            </div>
            <button 
              className="btn-register" 
              onClick={() => registrarPonto('almoco_ida')}
              disabled={!registros.entrada || !!registros.almoco_ida}
            >
              {registros.almoco_ida ? 'Registrado' : 'Registrar'}
            </button>
          </div>

          {/* ALMOÇO (VOLTA) */}
          <div className={`register-card ${registros.almoco_volta ? 'filled' : ''}`}>
            <span className="card-label">Almoço (Volta)</span>
            <div className="time-value">
              {registros.almoco_volta || '--:--'}
            </div>
            <button 
              className="btn-register" 
              onClick={() => registrarPonto('almoco_volta')}
              disabled={!registros.almoco_ida || !!registros.almoco_volta}
            >
              {registros.almoco_volta ? 'Registrado' : 'Registrar'}
            </button>
          </div>

          {/* SAÍDA */}
          <div className={`register-card ${registros.saida ? 'filled' : ''}`}>
            <span className="card-label">Saída</span>
            <div className="time-value">
              {registros.saida || '--:--'}
            </div>
            <button 
              className="btn-register" 
              onClick={() => registrarPonto('saida')}
              disabled={!registros.almoco_volta || !!registros.saida}
            >
              {registros.saida ? 'Registrado' : 'Encerrar Dia'}
            </button>
          </div>

        </div>

        {/* RESUMO DIÁRIO (Opcional, pode ser calculado depois) */}
        <div className="daily-summary glass-effect">
          <h4>Resumo do Dia</h4>
          <p>Jornada Padrão: 08:00h</p>
          {registros.saida && <p style={{color: '#4ade80'}}>Dia Finalizado!</p>}
        </div>

      </div>
    </div>
  );
}