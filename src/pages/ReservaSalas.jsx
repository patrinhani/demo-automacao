import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import './ReservaSalas.css'; // CSS Isolado

export default function ReservaSalas() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState('reservar'); // 'reservar' | 'minhas-reservas'
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
  const [salaSelecionada, setSalaSelecionada] = useState(1);
  
  // Dados Mockados
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

  const [reservas, setReservas] = useState([
    { id: 101, salaId: 1, data: new Date().toISOString().split('T')[0], horario: '10:00', usuario: 'Carlos TI', meu: false },
    { id: 102, salaId: 1, data: new Date().toISOString().split('T')[0], horario: '14:00', usuario: 'Você', meu: true },
    { id: 103, salaId: 2, data: new Date().toISOString().split('T')[0], horario: '09:00', usuario: 'Ana RH', meu: false },
  ]);

  const getStatusHorario = (hora) => {
    const reserva = reservas.find(r => r.salaId === salaSelecionada && r.data === dataSelecionada && r.horario === hora);
    if (reserva) return reserva.meu ? 'reservado-voce' : 'ocupado';
    return 'livre';
  };

  const handleReservar = (hora) => {
    const status = getStatusHorario(hora);
    if (status === 'ocupado') return alert('Este horário já está reservado.');
    if (status === 'reservado-voce') return alert('Você já reservou este horário.');

    if (window.confirm(`Confirmar reserva da ${salas.find(s=>s.id===salaSelecionada).nome} às ${hora}?`)) {
      const novaReserva = { id: Date.now(), salaId: salaSelecionada, data: dataSelecionada, horario: hora, usuario: 'Você', meu: true };
      setReservas([...reservas, novaReserva]);
      alert('Sala reservada com sucesso! ✅');
    }
  };

  const handleCancelar = (id) => {
    if (window.confirm('Tem certeza que deseja cancelar esta reserva?')) {
      setReservas(reservas.filter(r => r.id !== id));
    }
  };

  return (
    // CLASSE RENOMEADA: reserva-layout
    <div className="reserva-layout">
      
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>
      <div className="ambient-light light-3"></div>

      {/* HEADER ESPECÍFICO */}
      <header className="reserva-header">
        <div className="brand" onClick={() => navigate('/dashboard')} style={{cursor:'pointer'}}>
          <div style={{transform: 'scale(0.8)'}}><Logo /></div> 
          <span style={{color:'white', marginLeft:'10px', fontWeight: 'bold', fontSize: '1.2rem'}}>Reservas</span>
        </div>
        <div className="tech-profile" onClick={() => navigate('/dashboard')}>
          <span style={{color:'#94a3b8', fontSize:'0.9rem'}}>Voltar ao Menu ↩</span>
        </div>
      </header>

      {/* CONTEÚDO COM SCROLL ESPECÍFICO */}
      <div className="reserva-scroll-content">
        <div className="page-header-tech">
          <h2>Reservas de Espaço</h2>
          <div className="breadcrumbs-tech">Serviços / Facilities / Agendamento</div>
        </div>

        <div className="reserva-tabs-glass">
          <button className={`tab-glass-btn ${abaAtiva === 'reservar' ? 'active' : ''}`} onClick={() => setAbaAtiva('reservar')}>📅 Nova Reserva</button>
          <button className={`tab-glass-btn ${abaAtiva === 'minhas-reservas' ? 'active' : ''}`} onClick={() => setAbaAtiva('minhas-reservas')}>📂 Meus Agendamentos</button>
        </div>

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
                    <span className="slot-status">{status === 'livre' ? 'Disponível' : status === 'ocupado' ? 'Ocupado' : 'Sua Reserva'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {abaAtiva === 'minhas-reservas' && (
          <div className="my-bookings-list-tech" style={{animation: 'fadeIn 0.5s', width: '100%', maxWidth: '1000px'}}>
            {reservas.filter(r => r.meu).length === 0 ? (
              <div className="empty-state-glass">
                <span style={{fontSize:'2rem', display:'block', marginBottom:'10px'}}>📅</span>
                Você não possui agendamentos futuros.
              </div>
            ) : (
              <div className="bookings-grid-tech">
                {reservas.filter(r => r.meu).sort((a,b) => a.data > b.data ? 1 : -1).map(r => {
                  const salaNome = salas.find(s => s.id === r.salaId)?.nome;
                  return (
                    <div key={r.id} className="booking-card-glass">
                      <div className="booking-date-neon">
                        <span className="day">{r.data.split('-')[2]}</span>
                        <span className="month">/ {r.data.split('-')[1]}</span>
                      </div>
                      <div className="booking-details-tech">
                        <h4>{salaNome}</h4>
                        <p>Horário: <strong style={{color: 'var(--neon-blue)'}}>{r.horario}</strong></p>
                      </div>
                      <button className="btn-cancel-glass" onClick={() => handleCancelar(r.id)}>Cancelar ✖</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}