import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase'; // Importa o Firebase
import { ref, onValue, push, remove } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import Logo from '../components/Logo';
import './ReservaSalas.css';

export default function ReservaSalas() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('reservar');
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
  const [salaSelecionada, setSalaSelecionada] = useState(1);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dados das Salas (Estáticos pois são infraestrutura)
  const salas = [
    { id: 1, nome: 'Sala de Reunião A (Térreo)', capacidade: 6, recursos: ['TV', 'HDMI', 'Ar Condicionado'] },
    { id: 2, nome: 'Sala de Reunião B (2º Andar)', capacidade: 10, recursos: ['Projetor', 'Lousa', 'Webcam'] },
    { id: 3, nome: 'Auditório Principal', capacidade: 40, recursos: ['Som', 'Microfone', 'Projetor Duplo'] },
    { id: 4, nome: 'Cabine de Call (Individual)', capacidade: 1, recursos: ['Isolamento Acústico', 'Mesa'] },
  ];

  const horarios = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  // --- 1. CONEXÃO COM FIREBASE ---
  useEffect(() => {
    // Monitora Autenticação
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate('/');
      }
    });

    // Monitora Reservas em Tempo Real
    const reservasRef = ref(db, 'reservas_salas');
    const unsubscribeReservas = onValue(reservasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lista = Object.entries(data).map(([key, val]) => ({
          id: key,
          ...val
        }));
        setReservas(lista);
      } else {
        setReservas([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeReservas();
    };
  }, [navigate]);

  // --- 2. LÓGICA DE STATUS ---
  const getStatusHorario = (hora) => {
    if (!user) return 'loading';

    // Procura se existe reserva para: Sala X, Dia Y, Hora Z
    const reserva = reservas.find(r => 
      r.salaId === salaSelecionada && 
      r.data === dataSelecionada && 
      r.horario === hora
    );

    if (reserva) {
      // Se a reserva é minha (pelo UID)
      return reserva.userId === user.uid ? 'reservado-voce' : 'ocupado';
    }
    return 'livre';
  };

  // --- 3. AÇÕES ---
  const handleReservar = async (hora) => {
    const status = getStatusHorario(hora);
    if (status === 'ocupado') return alert('❌ Este horário já foi reservado por outro colega.');
    if (status === 'reservado-voce') return alert('⚠️ Você já reservou este horário.');
    if (!user) return;

    const salaInfo = salas.find(s => s.id === salaSelecionada);

    if (window.confirm(`Confirmar reserva da ${salaInfo.nome} às ${hora}?`)) {
      try {
        const reservasRef = ref(db, 'reservas_salas');
        await push(reservasRef, {
          salaId: salaSelecionada,
          salaNome: salaInfo.nome, // Salvamos o nome para facilitar exibição
          data: dataSelecionada,
          horario: hora,
          userId: user.uid,
          usuarioNome: user.displayName || user.email.split('@')[0], // Nome para quem for admin ver
          createdAt: Date.now()
        });
        alert('✅ Sala reservada com sucesso!');
      } catch (error) {
        console.error(error);
        alert('Erro ao realizar reserva.');
      }
    }
  };

  const handleCancelar = async (id) => {
    if (window.confirm('Tem certeza que deseja cancelar esta reserva?')) {
      try {
        const reservaRef = ref(db, `reservas_salas/${id}`);
        await remove(reservaRef);
      } catch (error) {
        alert('Erro ao cancelar.');
      }
    }
  };

  // Filtra minhas reservas para a aba "Meus Agendamentos"
  const minhasReservas = reservas
    .filter(r => user && r.userId === user.uid)
    .sort((a,b) => a.data > b.data ? 1 : -1);

  return (
    <div className="reserva-layout">
      
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>
      <div className="ambient-light light-3"></div>

      <header className="reserva-header">
        <div className="brand" onClick={() => navigate('/dashboard')} style={{cursor:'pointer'}}>
          <div style={{transform: 'scale(0.8)'}}><Logo /></div> 
          <span style={{color:'white', marginLeft:'10px', fontWeight: 'bold', fontSize: '1.2rem'}}>Reservas</span>
        </div>
        <div className="tech-profile" onClick={() => navigate('/dashboard')}>
          <span style={{color:'#94a3b8', fontSize:'0.9rem'}}>Voltar ao Menu ↩</span>
        </div>
      </header>

      <div className="reserva-scroll-content">
        <div className="page-header-tech">
          <h2>Reservas de Espaço</h2>
          <div className="breadcrumbs-tech">Serviços / Facilities / Agendamento</div>
        </div>

        <div className="reserva-tabs-glass">
          <button className={`tab-glass-btn ${abaAtiva === 'reservar' ? 'active' : ''}`} onClick={() => setAbaAtiva('reservar')}>📅 Nova Reserva</button>
          <button className={`tab-glass-btn ${abaAtiva === 'minhas-reservas' ? 'active' : ''}`} onClick={() => setAbaAtiva('minhas-reservas')}>📂 Meus Agendamentos</button>
        </div>

        {loading ? (
           <div style={{color:'white', textAlign:'center', marginTop:'50px'}}>Carregando disponibilidade...</div>
        ) : (
          <>
            {abaAtiva === 'reservar' && (
              <div className="booking-glass-container" style={{animation: 'fadeIn 0.5s', width: '100%', maxWidth: '1000px'}}>
                <div className="filters-glass-card">
                  <div className="filter-group-tech">
                    <label>Escolha a Data</label>
                    <input className="glass-input" type="date" value={dataSelecionada} onChange={(e) => setDataSelecionada(e.target.value)} />
                  </div>
                  <div className="filter-group-tech" style={{flex: 2}}>
                    <label>Escolha a Sala</label>
                    <select className="glass-input" value={salaSelecionada} onChange={(e) => setSalaSelecionada(Number(e.target.value))}>
                      {salas.map(sala => <option key={sala.id} value={sala.id}>{sala.nome}</option>)}
                    </select>
                  </div>
                </div>

                <div className="room-info-glass">
                    {(() => {
                      const sala = salas.find(s => s.id === salaSelecionada);
                      return (
                        <>
                          <div className="room-header-tech">
                            <h3 className="neon-text-title">{sala.nome}</h3>
                            <span className="capacity-badge-neon">👥 {sala.capacidade} pessoas</span>
                          </div>
                          <div className="room-resources-tech">
                            {sala.recursos.map((rec, i) => <span key={i} className="resource-tag-glass">{rec}</span>)}
                          </div>
                        </>
                      )
                    })()}
                </div>

                <div className="slots-grid-tech">
                  {horarios.map(hora => {
                    const status = getStatusHorario(hora);
                    return (
                      <button key={hora} className={`slot-btn-glass ${status}`} onClick={() => handleReservar(hora)} disabled={status === 'ocupado'}>
                        <span className="slot-time">{hora}</span>
                        <span className="slot-status">
                          {status === 'livre' ? 'Disponível' : status === 'ocupado' ? 'Ocupado' : 'Sua Reserva'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {abaAtiva === 'minhas-reservas' && (
              <div className="my-bookings-list-tech" style={{animation: 'fadeIn 0.5s', width: '100%', maxWidth: '1000px'}}>
                {minhasReservas.length === 0 ? (
                  <div className="empty-state-glass">
                    <span style={{fontSize:'2rem', display:'block', marginBottom:'10px'}}>📅</span>
                    Você não possui agendamentos futuros.
                  </div>
                ) : (
                  <div className="bookings-grid-tech">
                    {minhasReservas.map(r => (
                      <div key={r.id} className="booking-card-glass">
                        <div className="booking-date-neon">
                          <span className="day">{r.data.split('-')[2]}</span>
                          <span className="month">/ {r.data.split('-')[1]}</span>
                        </div>
                        <div className="booking-details-tech">
                          <h4>{r.salaNome}</h4>
                          <p>Horário: <strong style={{color: 'var(--neon-blue)'}}>{r.horario}</strong></p>
                        </div>
                        <button className="btn-cancel-glass" onClick={() => handleCancelar(r.id)}>Cancelar ✖</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}