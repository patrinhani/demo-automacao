// src/pages/FolhaPonto.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Logo from '../components/Logo';
import '../App.css';
import './FolhaPonto.css';

export default function FolhaPonto() {
  const navigate = useNavigate();
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [processando, setProcessando] = useState(false);
  const [gerandoPDF, setGerandoPDF] = useState(false);
  
  // Estados do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [pontoSelecionado, setPontoSelecionado] = useState(null);
  const [tipoJustificativa, setTipoJustificativa] = useState('');

  const printRef = useRef();

  // --- FUNÇÃO PARA GERAR DIAS DINÂMICOS ---
  const gerarHistoricoDinamico = () => {
    const listaDias = [];
    let diaAnalise = new Date();
    
    // Começa a analisar a partir de "ontem" para pegar o histórico passado
    diaAnalise.setDate(diaAnalise.getDate() - 1);

    while (listaDias.length < 5) { // Queremos os 5 últimos dias úteis
      const diaSemana = diaAnalise.getDay(); // 0 = Domingo, 6 = Sábado

      if (diaSemana !== 0 && diaSemana !== 6) {
        // Se for dia útil, adiciona no INÍCIO do array (unshift) para manter ordem cronológica
        listaDias.unshift(new Date(diaAnalise));
      }
      // Volta mais um dia
      diaAnalise.setDate(diaAnalise.getDate() - 1);
    }

    // Transforma as datas em objetos de ponto
    return listaDias.map((data, index) => {
      // Formata data: DD/MM/YY
      const dataFormatada = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
      
      // Formata dia da semana: "Segunda", "Terça"...
      let nomeDia = data.toLocaleDateString('pt-BR', { weekday: 'long' });
      nomeDia = nomeDia.charAt(0).toUpperCase() + nomeDia.slice(1).split('-')[0]; // Capitaliza e remove "-feira" se quiser

      // Simula dados variados para não ficar tudo igual
      let mock = { e1: '08:00', s1: '12:00', e2: '13:00', s2: '17:00', total: '08:00', status: 'OK' };

      // Simula uma "FALTA" no dia mais recente (último do array) para exemplo
      if (index === 4) {
         mock = { e1: '--:--', s1: '--:--', e2: '--:--', s2: '--:--', total: '00:00', status: 'FALTA' };
      } 
      // Simula uns minutos quebrados em outro dia
      else if (index === 2) {
         mock = { e1: '08:05', s1: '12:05', e2: '13:05', s2: '17:05', total: '08:00', status: 'OK' };
      }

      return {
        id: index,
        data: dataFormatada,
        dia: nomeDia,
        ...mock
      };
    });
  };

  // Inicializa o estado com a função geradora
  const [pontos, setPontos] = useState(gerarHistoricoDinamico());

  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRegistrar = () => {
    setProcessando(true);

    setTimeout(() => {
      const agora = new Date();
      const dataHoje = agora.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
      const horaAgora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const diaSemanaRaw = agora.toLocaleDateString('pt-BR', { weekday: 'long' });
      const diaSemana = diaSemanaRaw.charAt(0).toUpperCase() + diaSemanaRaw.slice(1).split('-')[0];

      setPontos(prevPontos => {
        // Verifica se hoje já está na lista (pode ser que o usuário registre num dia que acabou de virar útil)
        const indexHoje = prevPontos.findIndex(p => p.data === dataHoje);

        if (indexHoje !== -1) {
          // Atualiza registro existente
          const novosPontos = [...prevPontos];
          const ponto = { ...novosPontos[indexHoje] };

          if (ponto.e1 === '--:--') { ponto.e1 = horaAgora; ponto.status = 'EM ABERTO'; }
          else if (ponto.s1 === '--:--') { ponto.s1 = horaAgora; ponto.status = 'INTERVALO'; }
          else if (ponto.e2 === '--:--') { ponto.e2 = horaAgora; ponto.status = 'EM ABERTO'; }
          else if (ponto.s2 === '--:--') { ponto.s2 = horaAgora; ponto.status = 'OK'; ponto.total = 'Calculando...'; }
          else { alert("Todos os registros de hoje já foram realizados!"); return prevPontos; }

          novosPontos[indexHoje] = ponto;
          return novosPontos;
        } else {
          // Adiciona hoje na lista se não existir
          const novoPonto = {
            id: Date.now(), // ID único
            data: dataHoje,
            dia: diaSemana,
            e1: horaAgora, s1: '--:--', e2: '--:--', s2: '--:--', total: '--:--', status: 'EM ABERTO'
          };
          return [...prevPontos, novoPonto];
        }
      });

      setProcessando(false);
    }, 1500);
  };

  const abrirModalAjuste = (ponto) => {
    setPontoSelecionado(ponto);
    setTipoJustificativa('');
    setModalAberto(true);
  };

  const handleEnviarJustificativa = (e) => {
    e.preventDefault();
    setModalAberto(false);
    alert(`Ajuste solicitado para o dia ${pontoSelecionado.data}. Aguarde aprovação.`);
  };

  const exportarPDF = async () => {
    setGerandoPDF(true);
    setTimeout(async () => {
      const element = printRef.current;
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff', logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Espelho_Ponto.pdf`);
      setGerandoPDF(false);
    }, 500);
  };

  const getStatusClass = (status) => {
    if (status === 'FALTA') return 'falta';
    if (status === 'INTERVALO') return 'intervalo';
    if (status === 'EM ABERTO') return 'aberto';
    return 'ok';
  };

  return (
    <div className="tech-ponto-layout">
      
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>

      <header className="tech-header-glass">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
           <span className="page-title">Gestão de Ponto</span>
        </div>
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>
          Voltar ao Menu ↩
        </button>
      </header>

      <div className="ponto-container-tech">
        
        <div className="top-row-flex">
          <div className="page-header-tech">
            <h2>Espelho de Ponto</h2>
            <p>RH &gt; Controle de Jornada &gt; {new Date().toLocaleDateString('pt-BR', {month:'long', year:'numeric'})}</p>
          </div>
          <div className="clock-display-tech">
            {horaAtual.toLocaleTimeString()}
          </div>
        </div>

        <div className="summary-grid-tech">
            <div className="summary-card-tech blue">
                <span className="summary-label">Horas Trabalhadas</span>
                <div className="summary-value">31:35</div>
                <span className="summary-sub">Acumulado do Mês</span>
            </div>
            <div className="summary-card-tech gray">
                <span className="summary-label">Horas Previstas</span>
                <div className="summary-value">176:00</div>
                <span className="summary-sub">Jornada Contratual</span>
            </div>
            <div className="summary-card-tech red">
                <span className="summary-label">Saldo Banco</span>
                <div className="summary-value negative">-08:25</div>
                <span className="summary-sub alert">⚠ Regularizar Urgente</span>
            </div>
        </div>

        <div className="register-area-tech">
          <p style={{color: '#94a3b8', marginBottom: '20px', fontSize: '0.95rem'}}>
            Sistema de registro biométrico digital. Clique abaixo para marcar seu ponto.
          </p>
          <button className="btn-register-tech" onClick={handleRegistrar} disabled={processando}>
            {processando ? '📡 Sincronizando...' : '👆 Registrar Ponto Agora'}
          </button>
        </div>

        <div className="table-glass-container">
          <div className="table-header-actions">
             <span>Detalhamento Diário (Últimos 5 dias úteis)</span>
             <button className="btn-adjust-tech">📅 Filtrar Período</button>
          </div>
          <table className="tech-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Entrada</th>
                <th>Almoço</th>
                <th>Retorno</th>
                <th>Saída</th>
                <th>Total</th>
                <th>Status</th>
                <th style={{textAlign: 'right'}}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pontos.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong style={{color: '#fff', fontSize: '1rem'}}>{p.data}</strong><br/>
                    <small style={{color: '#64748b'}}>{p.dia}</small>
                  </td>
                  <td>{p.e1}</td><td>{p.s1}</td><td>{p.e2}</td><td>{p.s2}</td>
                  <td><strong style={{color: '#fff'}}>{p.total}</strong></td>
                  <td><span className={`status-badge-tech ${getStatusClass(p.status)}`}>{p.status}</span></td>
                  <td style={{textAlign: 'right'}}>
                    <button className="btn-adjust-tech" onClick={() => abrirModalAjuste(p)}>⚙ Ajustar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="footer-actions">
            <button className="btn-action-tech" onClick={() => window.print()}>🖨 Imprimir Tela</button>
            <button 
              className="btn-action-tech" 
              onClick={exportarPDF} 
              disabled={gerandoPDF} 
              style={{background: 'var(--neon-blue)', borderColor: 'var(--neon-blue)', boxShadow: '0 0 15px rgba(59,130,246,0.3)'}}
            >
               {gerandoPDF ? 'Gerando PDF...' : '📥 Baixar Espelho Oficial'}
            </button>
        </div>
      </div>

      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal-content-tech">
            <div className="modal-header-tech">
              <h3>Ajuste de Ponto: {pontoSelecionado?.data}</h3>
              <button className="modal-close-tech" onClick={() => setModalAberto(false)}>×</button>
            </div>
            
            <form onSubmit={handleEnviarJustificativa}>
              <div className="modal-form-group">
                <label>Motivo da Ocorrência</label>
                <select name="motivo" required value={tipoJustificativa} onChange={(e) => setTipoJustificativa(e.target.value)}>
                  <option value="">-- Selecione --</option>
                  <option value="esquecimento">Esquecimento de Marcação</option>
                  <option value="sistema">Erro Técnico / Sistema</option>
                  <option value="medico">Atestado Médico</option>
                </select>
              </div>

              {tipoJustificativa === 'medico' && (
                <div className="medico-area-tech">
                    <p style={{margin:0, color: '#10b981', fontSize:'0.9rem', fontWeight: 'bold'}}>Upload de Atestado Obrigatório</p>
                    <div className="modal-form-group" style={{marginTop: '15px'}}>
                        <label>CID (Opcional)</label>
                        <input type="text" placeholder="Ex: Z00.0" />
                    </div>
                </div>
              )}

              <div className="modal-form-group">
                <label>Observação</label>
                <textarea rows="3" placeholder="Descreva o motivo detalhadamente..." required></textarea>
              </div>

              <div className="modal-actions-tech">
                <button type="button" className="btn-action-tech" onClick={() => setModalAberto(false)}>Cancelar</button>
                <button type="submit" className="btn-confirm-tech">Confirmar Ajuste</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="print-hidden-wrapper">
        <div ref={printRef} className="print-a4-page">
           <div style={{display:'flex', justifyContent:'space-between', borderBottom:'2px solid #000', paddingBottom:'20px'}}>
              <Logo lightMode={true} size={1.5} />
              <div style={{textAlign:'right'}}>
                 <h1 style={{margin:0, fontSize:'18pt'}}>RELATÓRIO DE FREQUÊNCIA</h1>
                 <p style={{margin:0, fontSize:'10pt', color:'#555'}}>Departamento de Recursos Humanos</p>
              </div>
           </div>
           <table className="print-table">
               <thead><tr><th>DATA</th><th>ENTRADA</th><th>SAÍDA ALMOÇO</th><th>VOLTA ALMOÇO</th><th>SAÍDA</th><th>TOTAL</th><th>STATUS</th></tr></thead>
               <tbody>{pontos.map((p,i)=>(<tr key={i}><td>{p.data}</td><td>{p.e1}</td><td>{p.s1}</td><td>{p.e2}</td><td>{p.s2}</td><td>{p.total}</td><td>{p.status}</td></tr>))}</tbody>
           </table>
           <div style={{marginTop:'50px', borderTop:'1px solid #000', width:'40%', paddingTop:'5px', textAlign:'center', marginLeft:'auto'}}>Assinatura do Gestor</div>
        </div>
      </div>
    </div>
  );
}