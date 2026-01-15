import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import './ReservaSalas.css';

export default function ReservaSalas() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState('reservar'); // 'reservar' | 'minhas-reservas'
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
  const [salaSelecionada, setSalaSelecionada] = useState(1);
  
  // Dados Mockados (Simulando Banco de Dados)
  const salas = [
    { id: 1, nome: 'Sala de Reunião A (Térreo)', capacidade: 6, recursos: ['TV', 'HDMI', 'Ar Condicionado'] },
    { id: 2, nome: 'Sala de Reunião B (2º Andar)', capacidade: 10, recursos: ['Projetor', 'Lousa', 'Webcam'] },
    { id: 3, nome: 'Auditório Principal', capacidade: 40, recursos: ['Som', 'Microfone', 'Projetor Duplo'] },
    { id: 4, nome: 'Cabine de Call (Individual)', capacidade: 1, recursos: ['Isolamento Acústico', 'Mesa'] },
  ];

  // Horários disponíveis para agendamento (08h às 18h)
  const horarios = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  // Estado inicial de reservas (alguns horários já ocupados para teste)
  const [reservas, setReservas] = useState([
    { id: 101, salaId: 1, data: new Date().toISOString().split('T')[0], horario: '10:00', usuario: 'Carlos TI', meu: false },
    { id: 102, salaId: 1, data: new Date().toISOString().split('T')[0], horario: '14:00', usuario: 'Você', meu: true },
    { id: 103, salaId: 2, data: new Date().toISOString().split('T')[0], horario: '09:00', usuario: 'Ana RH', meu: false },
  ]);

  // Função para verificar status do horário
  const getStatusHorario = (hora) => {
    const reserva = reservas.find(r => r.salaId === salaSelecionada && r.data === dataSelecionada && r.horario === hora);
    if (reserva) {
      return reserva.meu ? 'reservado-voce' : 'ocupado';
    }
    return 'livre';
  };

  // Ação de Reservar
  const handleReservar = (hora) => {
    const status = getStatusHorario(hora);
    
    if (status === 'ocupado') return alert('Este horário já está reservado por outro colega.');
    if (status === 'reservado-voce') return alert('Você já reservou este horário.');

    if (window.confirm(`Confirmar reserva da ${salas.find(s=>s.id===salaSelecionada).nome} às ${hora}?`)) {
      const novaReserva = {
        id: Date.now(),
        salaId: salaSelecionada,
        data: dataSelecionada,
        horario: hora,
        usuario: 'Você',
        meu: true
      };
      setReservas([...reservas, novaReserva]);
      alert('Sala reservada com sucesso! ✅');
    }
  };

  // Ação de Cancelar
  const handleCancelar = (id) => {
    if (window.confirm('Tem certeza que deseja cancelar esta reserva?')) {
      setReservas(reservas.filter(r => r.id !== id));
    }
  };

  return (
    <div className="app-container">
      <header className="header-bar">
        <div className="logo-container"><Logo /></div>
        <div className="back-button" onClick={() => navigate('/dashboard')}>Voltar ao Menu ↩</div>
      </header>

      <div className="reserva-container">
        <div className="page-header">
          <h2>Reservas de Espaço</h2>
          <p>Agende salas de reunião e estações de trabalho.</p>
        </div>

        {/* Abas de Navegação */}
        <div className="tabs">
          <button className={`tab-btn ${abaAtiva === 'reservar' ? 'active' : ''}`} onClick={() => setAbaAtiva('reservar')}>📅 Nova Reserva</button>
          <button className={`tab-btn ${abaAtiva === 'minhas-reservas' ? 'active' : ''}`} onClick={() => setAbaAtiva('minhas-reservas')}>Meus Agendamentos</button>
        </div>

        {/* CONTEÚDO: NOVA RESERVA */}
        {abaAtiva === 'reservar' && (
          <div className="booking-interface">
            
            {/* Filtros */}
            <div className="filters-card">
              <div className="filter-group">
                <label>Escolha a Data</label>
                <input type="date" value={dataSelecionada} onChange={(e) => setDataSelecionada(e.target.value)} />
              </div>
              <div className="filter-group">
                <label>Escolha a Sala</label>
                <select value={salaSelecionada} onChange={(e) => setSalaSelecionada(Number(e.target.value))}>
                  {salas.map(sala => (
                    <option key={sala.id} value={sala.id}>{sala.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Detalhes da Sala Selecionada */}
            <div className="room-info">
               {(() => {
                 const sala = salas.find(s => s.id === salaSelecionada);
                 return (
                   <>
                    <div className="room-header">
                      <h3>{sala.nome}</h3>
                      <span className="capacity-badge">👥 {sala.capacidade} pessoas</span>
                    </div>
                    <div className="room-resources">
                      {sala.recursos.map((rec, i) => <span key={i} className="resource-tag">{rec}</span>)}
                    </div>
                   </>
                 )
               })()}
            </div>

            {/* Grade de Horários */}
            <div className="slots-grid">
              {horarios.map(hora => {
                const status = getStatusHorario(hora);
                return (
                  <button 
                    key={hora} 
                    className={`slot-btn ${status}`} 
                    onClick={() => handleReservar(hora)}
                    disabled={status === 'ocupado'}
                  >
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

        {/* CONTEÚDO: MINHAS RESERVAS */}
        {abaAtiva === 'minhas-reservas' && (
          <div className="my-bookings-list">
            {reservas.filter(r => r.meu).length === 0 ? (
              <p className="empty-state">Você não possui agendamentos futuros.</p>
            ) : (
              reservas.filter(r => r.meu).sort((a,b) => a.data > b.data ? 1 : -1).map(r => {
                const salaNome = salas.find(s => s.id === r.salaId)?.nome;
                return (
                  <div key={r.id} className="booking-card">
                    <div className="booking-date">
                      <span className="day">{r.data.split('-')[2]}</span>
                      <span className="month">/ {r.data.split('-')[1]}</span>
                    </div>
                    <div className="booking-details">
                      <h4>{salaNome}</h4>
                      <p>Horário: <strong>{r.horario}</strong></p>
                    </div>
                    <button className="btn-cancel-booking" onClick={() => handleCancelar(r.id)}>Cancelar ✖</button>
                  </div>
                )
              })
            )}
          </div>
        )}

      </div>
    </div>
  );
}