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

  const printRef = useRef();

  // O Estado inicial agora é uma lista que podemos modificar
  const [pontos, setPontos] = useState([
    { id: 1, data: '01/10/24', dia: 'Terça', e1: '08:00', s1: '12:00', e2: '13:00', s2: '17:00', total: '08:00', status: 'OK' },
    { id: 2, data: '02/10/24', dia: 'Quarta', e1: '08:05', s1: '12:10', e2: '13:10', s2: '17:05', total: '08:00', status: 'OK' },
    { id: 3, data: '03/10/24', dia: 'Quinta', e1: '07:55', s1: '12:00', e2: '13:00', s2: '17:00', total: '08:05', status: 'OK' },
    { id: 4, data: '04/10/24', dia: 'Sexta', e1: '--:--', s1: '--:--', e2: '--:--', s2: '--:--', total: '00:00', status: 'FALTA' },
  ]);

  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- FUNÇÃO DE REGISTRAR PONTO (Adiciona na Lista) ---
  const handleRegistrar = () => {
    setProcessando(true);
    
    // Simula delay de rede
    setTimeout(() => {
      const agora = new Date();
      const horaFormatada = agora.toLocaleTimeString().slice(0, 5); // Ex: 14:30
      const dataFormatada = agora.toLocaleDateString();

      // Cria o objeto da nova batida
      const novaBatida = {
        id: Date.now(), // ID único baseado no tempo
        data: dataFormatada,
        dia: 'Hoje', // Poderíamos calcular o dia da semana, mas "Hoje" fica claro
        e1: horaFormatada, // Preenche a primeira entrada
        s1: '--:--', e2: '--:--', s2: '--:--',
        total: '00:00',
        status: 'EM ABERTO'
      };

      // ATUALIZA A LISTA VISUALMENTE
      // Adiciona a nova batida no final da lista atual
      setPontos([...pontos, novaBatida]);

      setProcessando(false);
      alert(`✅ Ponto registrado com sucesso às ${horaFormatada}!`);
      
      // Rola a página para baixo para ver a nova linha (opcional)
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 1500);
  };

  const abrirModalAjuste = (ponto) => {
    setPontoSelecionado(ponto);
    setModalAberto(true);
  };

  const handleEnviarJustificativa = (e) => {
    e.preventDefault();
    
    // Aqui capturamos os horários do input time
    const form = e.target;
    const entrada = form.entrada_ajuste.value;
    const saida = form.saida_ajuste.value;

    setModalAberto(false);
    alert(`Solicitação enviada!\nDia: ${pontoSelecionado.data}\nNovo Horário Proposto: ${entrada} às ${saida}`);
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
      pdf.save(`Espelho_Ponto_TechCorp.pdf`);
      setGerandoPDF(false);
    }, 500);
  };

  return (
    <div className="app-container">
      <header className="top-bar">
        <div className="brand"><Logo /></div>
        <div className="user-badge" onClick={() => navigate('/dashboard')}>Voltar ao Menu ↩</div>
      </header>

      <div className="dashboard-wrapper">
        <div className="ponto-header">
          <div>
            <h2>Espelho de Ponto</h2>
            <div className="breadcrumbs">RH &gt; Gestão de Ponto &gt; Outubro/2024</div>
          </div>
          <div className="clock-container">
            <div className="clock-label">Horário Oficial</div>
            <div className="clock-display">{horaAtual.toLocaleTimeString()}</div>
          </div>
        </div>

        <div className="summary-grid">
            <div className="summary-card blue">
                <span className="summary-label">Horas Trabalhadas</span>
                <div className="summary-value">31:35</div>
                <span className="summary-sub">Acumulado do Mês</span>
            </div>
            <div className="summary-card gray">
                <span className="summary-label">Horas Previstas</span>
                <div className="summary-value">176:00</div>
                <span className="summary-sub">Jornada Contratual</span>
            </div>
            <div className="summary-card red">
                <span className="summary-label">Saldo Banco</span>
                <div className="summary-value negative">-08:25</div>
                <span className="summary-sub alert">⚠ Regularizar Urgente</span>
            </div>
        </div>

        <div className="register-area">
          <p className="register-text">Clique no botão abaixo para registrar sua entrada ou saída.</p>
          <button 
            className={`btn-primary btn-register ${processando ? 'processing' : ''}`}
            onClick={handleRegistrar}
            disabled={processando}
          >
            {processando ? '📡 Sincronizando...' : '👆 REGISTRAR PONTO AGORA'}
          </button>
        </div>

        <div className="table-container">
          <div className="table-header-actions">
             <strong>Detalhamento Diário</strong>
             <button className="btn-secondary btn-adjust">📅 Filtrar Período</button>
          </div>
          <table>
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
                  <td className="date-cell">
                    <strong>{p.data}</strong>
                    <span>{p.dia}</span>
                  </td>
                  <td>{p.e1}</td>
                  <td>{p.s1}</td>
                  <td>{p.e2}</td>
                  <td>{p.s2}</td>
                  <td><strong>{p.total}</strong></td>
                  <td>
                    <span className={`status-badge ${
                      p.status === 'FALTA' ? 'falta' : 
                      p.status === 'ATRASO' ? 'atraso' : 
                      p.status === 'EM ABERTO' ? 'atraso' : 'normal'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{textAlign: 'right'}}>
                    <button className="btn-adjust" onClick={() => abrirModalAjuste(p)} style={{float: 'right'}}>
                        ⚙ Ajustar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="footer-actions">
          <button className="btn-secondary" onClick={() => window.print()}>🖨 Imprimir Tela</button>
          <button className="btn-primary" onClick={exportarPDF} disabled={gerandoPDF}>
            {gerandoPDF ? 'Gerando Documento...' : '📥 Baixar Espelho Oficial (PDF)'}
          </button>
        </div>
      </div>

      {/* MODAL DE JUSTIFICATIVA */}
      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Solicitação de Ajuste</h3>
              <button className="modal-close" onClick={() => setModalAberto(false)}>×</button>
            </div>
            
            <form onSubmit={handleEnviarJustificativa}>
              <div style={{background: '#f8f9fa', padding: '10px', marginBottom: '15px', borderRadius: '4px', fontSize: '0.9rem'}}>
                Ajustando data: <strong>{pontoSelecionado?.data}</strong>
              </div>

              <div className="modal-form-group">
                <label>Tipo de Ocorrência</label>
                <select required>
                  <option value="">-- Selecione o motivo --</option>
                  <option value="esquecimento">Esquecimento de Marcação</option>
                  <option value="medico">Atestado Médico</option>
                  <option value="sistema">Erro no Sistema</option>
                </select>
              </div>

              {/* AQUI ESTÁ A MUDANÇA: INPUT TYPE="TIME" */}
              <div className="modal-form-group">
                <label>Horários Corretos</label>
                <div style={{display: 'flex', gap: '10px'}}>
                  <div style={{flex: 1}}>
                    <span style={{fontSize: '0.8rem', color:'#666'}}>Entrada:</span>
                    <input type="time" name="entrada_ajuste" required style={{width: '100%'}} />
                  </div>
                  <div style={{flex: 1}}>
                    <span style={{fontSize: '0.8rem', color:'#666'}}>Saída:</span>
                    <input type="time" name="saida_ajuste" required style={{width: '100%'}} />
                  </div>
                </div>
              </div>

              <div className="modal-form-group">
                <label>Justificativa Detalhada</label>
                <textarea rows="3" placeholder="Descreva o motivo..." required></textarea>
              </div>

              <div className="modal-form-group">
                <label>Anexar Comprovante</label>
                <input type="file" />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setModalAberto(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Enviar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEMPLATE DO PDF (Para impressão) */}
      <div className="print-hidden-wrapper">
        <div ref={printRef} className="print-a4-page">
            <div className="print-header-row">
                <Logo lightMode={true} size={1.2} />
                <div className="print-title-box">
                    <h1 className="print-title-main">Relatório de Frequência</h1>
                    <p className="print-title-sub">Período: 01/10/2024 a 31/10/2024</p>
                </div>
            </div>
            {/* Tabela do PDF mapeia os mesmos 'pontos', então o novo registro aparecerá lá também! */}
            <table className="print-table">
                <thead>
                    <tr><th>DATA</th><th>ENTRADA</th><th>SAÍDA ALMOÇO</th><th>VOLTA ALMOÇO</th><th>SAÍDA</th><th>TOTAL</th><th>OBSERVAÇÃO</th></tr>
                </thead>
                <tbody>
                    {pontos.map((p, i) => (
                        <tr key={i}>
                            <td>{p.data}</td>
                            <td>{p.e1}</td><td>{p.s1}</td><td>{p.e2}</td><td>{p.s2}</td>
                            <td style={{fontWeight: 'bold'}}>{p.total}</td>
                            <td>{p.status !== 'OK' ? p.status : ''}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {/* ... Restante do PDF igual ao anterior ... */}
            <div className="print-disclaimer">Documento gerado eletronicamente em {new Date().toLocaleDateString()}.</div>
        </div>
      </div>
    </div>
  );
}