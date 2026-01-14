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
  const [tipoAbono, setTipoAbono] = useState('parcial');

  const printRef = useRef();

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

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    // Tenta lidar com formatos dd/mm/yy ou dd/mm/yyyy
    const parts = dateStr.split('/');
    if (parts.length !== 3) return '';
    let [day, month, year] = parts;
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  };

  // --- NOVA LÓGICA DE REGISTRO INTELIGENTE ---
  const handleRegistrar = () => {
    setProcessando(true);
    
    setTimeout(() => {
      const agora = new Date();
      const dataHoje = agora.toLocaleDateString(); // Ex: "14/01/2026"
      const horaFormatada = agora.toLocaleTimeString().slice(0, 5); // Ex: "13:45"

      // 1. Procura se já existe registro hoje
      const indexHoje = pontos.findIndex(p => p.data === dataHoje);

      let novosPontos = [...pontos];
      let tipoBatida = "";

      if (indexHoje !== -1) {
        // --- CENÁRIO: JÁ TEM LINHA, VAMOS ATUALIZAR ---
        const pontoExistente = { ...novosPontos[indexHoje] };

        // Lógica sequencial de preenchimento
        if (pontoExistente.e1 === '--:--' || !pontoExistente.e1) {
            pontoExistente.e1 = horaFormatada;
            pontoExistente.status = 'EM ABERTO';
            tipoBatida = "Entrada";
        } 
        else if (pontoExistente.s1 === '--:--') {
            pontoExistente.s1 = horaFormatada;
            pontoExistente.status = 'INTERVALO';
            tipoBatida = "Saída Almoço";
        } 
        else if (pontoExistente.e2 === '--:--') {
            pontoExistente.e2 = horaFormatada;
            pontoExistente.status = 'EM ABERTO';
            tipoBatida = "Volta Almoço";
        } 
        else if (pontoExistente.s2 === '--:--') {
            pontoExistente.s2 = horaFormatada;
            pontoExistente.status = 'OK'; // Dia fechado
            // Cálculo simples de total (fictício para demo)
            pontoExistente.total = '08:00'; 
            tipoBatida = "Saída";
        } 
        else {
            setProcessando(false);
            alert("⚠ Todas as marcações de hoje já foram realizadas!");
            return;
        }

        // Atualiza a lista na posição correta
        novosPontos[indexHoje] = pontoExistente;

      } else {
        // --- CENÁRIO: DIA NOVO, CRIA LINHA ---
        tipoBatida = "Entrada";
        const novoPonto = {
            id: Date.now(),
            data: dataHoje,
            dia: 'Hoje',
            e1: horaFormatada,
            s1: '--:--', e2: '--:--', s2: '--:--',
            total: '00:00',
            status: 'EM ABERTO'
        };
        novosPontos.push(novoPonto);
      }

      setPontos(novosPontos);
      setProcessando(false);
      
      // Feedback visual
      alert(`✅ Batida registrada com sucesso!\nTipo: ${tipoBatida}\nHorário: ${horaFormatada}`);
      
      // Rola para o fim da tabela
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);

    }, 1500);
  };

  const abrirModalAjuste = (ponto) => {
    setPontoSelecionado(ponto);
    setTipoJustificativa('');
    setTipoAbono('parcial'); 
    setModalAberto(true);
  };

  const handleEnviarJustificativa = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const dados = Object.fromEntries(formData.entries());

    let resumo = `Justificativa enviada para ${pontoSelecionado.data}\nMotivo: ${tipoJustificativa}`;

    if (tipoJustificativa === 'medico') {
        resumo += `\nProfissional: ${dados.conselho} ${dados.numero_conselho}`;
        if (tipoAbono === 'integral') {
            const dInicio = new Date(dados.data_inicio_atestado).toLocaleDateString();
            const dFim = new Date(dados.data_fim_atestado).toLocaleDateString();
            resumo += `\nAfastamento: ${dInicio} até ${dFim}`;
        } else {
            resumo += `\nAbono Parcial: ${dados.hora_inicio} às ${dados.hora_fim}`;
        }
    } else {
        resumo += `\nAjuste de Horários Proposto.`;
    }

    setModalAberto(false);
    alert(resumo);
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
          <button className={`btn-primary btn-register ${processando ? 'processing' : ''}`} onClick={handleRegistrar} disabled={processando}>
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
                  <td className="date-cell"><strong>{p.data}</strong><span>{p.dia}</span></td>
                  <td>{p.e1}</td><td>{p.s1}</td><td>{p.e2}</td><td>{p.s2}</td>
                  <td><strong>{p.total}</strong></td>
                  <td><span className={`status-badge ${p.status === 'FALTA' ? 'falta' : p.status === 'INTERVALO' ? 'atraso' : 'normal'}`}>{p.status}</span></td>
                  <td style={{textAlign: 'right'}}>
                    <button className="btn-adjust" onClick={() => abrirModalAjuste(p)} style={{float: 'right'}}>⚙ Ajustar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="footer-actions">
            <button className="btn-secondary" onClick={() => window.print()}>🖨 Imprimir Tela</button>
            <button className="btn-primary" onClick={exportarPDF} disabled={gerandoPDF}>📥 Baixar Espelho Oficial</button>
        </div>
      </div>

      {/* ================= MODAL AVANÇADO ================= */}
      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Ajuste de Ponto: {pontoSelecionado?.data}</h3>
              <button className="modal-close" onClick={() => setModalAberto(false)}>×</button>
            </div>
            
            <form onSubmit={handleEnviarJustificativa}>
              <div className="modal-form-group">
                <label>Motivo da Ocorrência</label>
                <select name="motivo" required value={tipoJustificativa} onChange={(e) => setTipoJustificativa(e.target.value)}>
                  <option value="">-- Selecione --</option>
                  <optgroup label="Requer Marcação de Horário">
                    <option value="esquecimento">Esquecimento / Erro de Marcação</option>
                    <option value="sistema">Erro no Relógio/Sistema</option>
                    <option value="hora_extra">Hora Extra Autorizada</option>
                  </optgroup>
                  <optgroup label="Abono (Atestado/Folga)">
                    <option value="medico">Atestado Médico / Odontológico</option>
                    <option value="doacao_sangue">Doação de Sangue</option>
                    <option value="luto">Licença Nojo / Luto</option>
                  </optgroup>
                </select>
              </div>

              {/* === CENÁRIO 1: ATESTADO MÉDICO === */}
              {tipoJustificativa === 'medico' && (
                <div className="medico-area" style={{animation: 'fadeIn 0.3s'}}>
                    <div className="modal-row">
                        <div className="modal-col" style={{flex: 1}}>
                            <div className="modal-form-group">
                                <label>Conselho</label>
                                <select name="conselho" required>
                                    <option value="CRM">CRM</option>
                                    <option value="CRO">CRO</option>
                                    <option value="RMS">RMS</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-col" style={{flex: 2}}>
                             <div className="modal-form-group">
                                <label>Número Registro *</label>
                                <input name="numero_conselho" type="text" placeholder="Ex: 123456/SP" required />
                            </div>
                        </div>
                    </div>
                    <div className="modal-form-group">
                        <label>CID (Opcional)</label>
                        <input name="cid" type="text" placeholder="Código da Doença (Ex: Z00.0)" />
                    </div>
                    <div className="modal-form-group" style={{background: '#f0f8ff', padding: '10px', borderRadius: '4px'}}>
                        <label style={{color: '#004a80'}}>Abrangência</label>
                        <div className="radio-group">
                            <label><input type="radio" name="tipo_abono" value="integral" checked={tipoAbono === 'integral'} onChange={() => setTipoAbono('integral')} /> Dias Integrais</label>
                            <label><input type="radio" name="tipo_abono" value="parcial" checked={tipoAbono === 'parcial'} onChange={() => setTipoAbono('parcial')} /> Parcial</label>
                        </div>
                    </div>
                    {tipoAbono === 'integral' && (
                        <div className="modal-row" style={{marginTop: '10px', animation: 'fadeIn 0.3s'}}>
                            <div className="modal-col"><div className="modal-form-group"><label>Data Início</label><input name="data_inicio_atestado" type="date" required defaultValue={formatDateForInput(pontoSelecionado?.data)}/></div></div>
                            <div className="modal-col"><div className="modal-form-group"><label>Data Fim</label><input name="data_fim_atestado" type="date" required defaultValue={formatDateForInput(pontoSelecionado?.data)}/></div></div>
                        </div>
                    )}
                    {tipoAbono === 'parcial' && (
                        <div className="modal-row" style={{marginTop: '10px', animation: 'fadeIn 0.3s'}}>
                            <div className="modal-col"><div className="modal-form-group"><label>Saída Consulta</label><input name="hora_inicio" type="time" required /></div></div>
                            <div className="modal-col"><div className="modal-form-group"><label>Retorno</label><input name="hora_fim" type="time" required /></div></div>
                        </div>
                    )}
                </div>
              )}

              {/* === CENÁRIO 2: ESQUECIMENTO === */}
              {(tipoJustificativa === 'esquecimento' || tipoJustificativa === 'sistema') && (
                <div style={{animation: 'fadeIn 0.3s'}}>
                    <p style={{fontSize: '0.8rem', color: '#666', marginBottom: '10px'}}>Preencha apenas os horários que deseja corrigir.</p>
                    <div className="modal-row">
                        <div className="modal-col modal-form-group"><label>Entrada</label><input name="adj_e1" type="time" defaultValue={pontoSelecionado?.e1 !== '--:--' ? pontoSelecionado?.e1 : ''} /></div>
                        <div className="modal-col modal-form-group"><label>Almoço</label><input name="adj_s1" type="time" defaultValue={pontoSelecionado?.s1 !== '--:--' ? pontoSelecionado?.s1 : ''}/></div>
                    </div>
                    <div className="modal-row">
                        <div className="modal-col modal-form-group"><label>Volta</label><input name="adj_e2" type="time" defaultValue={pontoSelecionado?.e2 !== '--:--' ? pontoSelecionado?.e2 : ''}/></div>
                        <div className="modal-col modal-form-group"><label>Saída</label><input name="adj_s2" type="time" defaultValue={pontoSelecionado?.s2 !== '--:--' ? pontoSelecionado?.s2 : ''}/></div>
                    </div>
                </div>
              )}

              <div className="modal-form-group">
                <label>Observação / Justificativa</label>
                <textarea name="obs" rows="2" placeholder="Descreva detalhes adicionais..." required></textarea>
              </div>
              <div className="modal-form-group">
                <label>Anexar Comprovante {tipoJustificativa === 'medico' && <span style={{color:'red'}}> *</span>}</label>
                <input type="file" required={tipoJustificativa === 'medico'} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setModalAberto(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Enviar Ajuste</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="print-hidden-wrapper">
        <div ref={printRef} className="print-a4-page">
           <div className="print-header-row"><Logo lightMode={true} size={1.2} /><div className="print-title-box"><h1 className="print-title-main">Relatório de Frequência</h1></div></div>
           <table className="print-table">
                <thead><tr><th>DATA</th><th>ENTRADA</th><th>SAÍDA</th><th>TOTAL</th><th>STATUS</th></tr></thead>
                <tbody>{pontos.map((p,i)=>(<tr key={i}><td>{p.data}</td><td>{p.e1}</td><td>{p.s2}</td><td>{p.total}</td><td>{p.status}</td></tr>))}</tbody>
           </table>
        </div>
      </div>
    </div>
  );
}