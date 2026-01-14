import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Logo from '../components/Logo';
import '../App.css';
import './PlanoSaude.css';

export default function PlanoSaude() {
  const navigate = useNavigate();
  
  // Controle das Abas
  const [activeTab, setActiveTab] = useState('carteirinha');
  const [cardFlipped, setCardFlipped] = useState(false);

  // Busca e Dados
  const [busca, setBusca] = useState({ especialidade: '', cidade: '' });
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [todosMedicos, setTodosMedicos] = useState([]); // Lista completa gerada

  // Extrato
  const [baixandoExtrato, setBaixandoExtrato] = useState(false);
  const printRef = useRef();

  // --- GERADOR DE DADOS ALEATÓRIOS ---
  useEffect(() => {
    const gerarMedicos = () => {
        const nomes = ['Dr. Roberto', 'Dra. Ana', 'Dr. Carlos', 'Dra. Juliana', 'Dr. Marcos', 'Dra. Fernanda', 'Dr. Paulo', 'Dra. Camila', 'Clinica Vida', 'Centro Medico'];
        const sobrenomes = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Ferreira', 'Costa', 'Almeida', 'Nascimento'];
        const especialidades = ['cardiologia', 'dermatologia', 'ortopedia', 'pediatria', 'ginecologia', 'oftalmologia', 'neurologia'];
        const cidades = ['sp', 'rj'];
        const bairrosSP = ['Paulista', 'Jardins', 'Pinheiros', 'Moema', 'Centro', 'Tatuapé', 'Santana'];
        const bairrosRJ = ['Centro', 'Copacabana', 'Barra', 'Tijuca', 'Botafogo', 'Leblon'];

        const lista = [];
        // Gerar 60 médicos
        for (let i = 0; i < 60; i++) {
            const cidade = Math.random() > 0.5 ? 'sp' : 'rj';
            const bairro = cidade === 'sp' 
                ? bairrosSP[Math.floor(Math.random() * bairrosSP.length)] 
                : bairrosRJ[Math.floor(Math.random() * bairrosRJ.length)];
            
            const nomeBase = nomes[Math.floor(Math.random() * nomes.length)];
            const sobrenome = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
            const isClinica = nomeBase.includes('Clinica') || nomeBase.includes('Centro');
            const nomeFinal = isClinica ? `${nomeBase} ${sobrenome}` : `${nomeBase} ${sobrenome}`;

            lista.push({
                id: i,
                nome: nomeFinal,
                esp: especialidades[Math.floor(Math.random() * especialidades.length)],
                cidade: cidade,
                end: `Av. Principal, ${Math.floor(Math.random() * 1000) + 1} - ${bairro}`,
                tel: cidade === 'sp' ? '(11) 3000-' + (1000 + i) : '(21) 2000-' + (1000 + i)
            });
        }
        return lista;
    };

    setTodosMedicos(gerarMedicos());
  }, []);

  // Dados Mockados para Extrato
  const extratoMock = [
    { data: '10/09/2024', prestador: 'LABORATORIO A+', proc: 'HEMOGRAMA COMPLETO', valor: '50,00', copart: '5,00' },
    { data: '10/09/2024', prestador: 'LABORATORIO A+', proc: 'COLESTEROL TOTAL', valor: '30,00', copart: '3,00' },
    { data: '22/09/2024', prestador: 'DR ROBERTO SILVA', proc: 'CONSULTA ELETIVA', valor: '400,00', copart: '40,00' },
    { data: '05/10/2024', prestador: 'HOSPITAL S. LUIZ', proc: 'PRONTO SOCORRO', valor: '850,00', copart: '85,00' },
    { data: '05/10/2024', prestador: 'HOSPITAL S. LUIZ', proc: 'MEDICAMENTOS', valor: '120,00', copart: '12,00' },
    { data: '15/10/2024', prestador: 'CLINICA OFTALMO', proc: 'CONSULTA ELETIVA', valor: '350,00', copart: '35,00' },
  ];

  const handleBusca = (e) => {
    e.preventDefault();
    setBuscando(true);
    setResultados([]);

    setTimeout(() => {
      const filtrados = todosMedicos.filter(m => {
        const matchEsp = busca.especialidade ? m.esp === busca.especialidade : true;
        const matchCity = busca.cidade ? m.cidade === busca.cidade : true;
        return matchEsp && matchCity;
      });
      setResultados(filtrados);
      setBuscando(false);
    }, 800);
  };

  const handleDownloadExtrato = async () => {
    setBaixandoExtrato(true);
    // Pequeno delay para garantir que o React renderizou o hidden div se necessário
    setTimeout(async () => {
      const element = printRef.current;
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('Extrato_Coparticipacao.pdf');
      
      setBaixandoExtrato(false);
      alert('Extrato baixado com sucesso!');
    }, 500);
  };

  return (
    <div className="app-container">
      <header className="top-bar">
        <div className="brand"><Logo /></div>
        <div className="user-badge" onClick={() => navigate('/dashboard')}>Voltar ao Menu ↩</div>
      </header>

      <div className="dashboard-wrapper">
        <div className="page-header">
          <h2>Saúde & Bem-estar</h2>
          <div className="breadcrumbs">Benefícios &gt; Plano de Saúde &gt; Titular</div>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="health-tabs">
          <button className={`tab-btn ${activeTab === 'carteirinha' ? 'active' : ''}`} onClick={() => setActiveTab('carteirinha')}>💳 Carteirinha Digital</button>
          <button className={`tab-btn ${activeTab === 'rede' ? 'active' : ''}`} onClick={() => setActiveTab('rede')}>🔍 Rede Credenciada</button>
          <button className={`tab-btn ${activeTab === 'extrato' ? 'active' : ''}`} onClick={() => setActiveTab('extrato')}>📄 Extrato de Utilização</button>
        </div>

        {/* === ABA 1: CARTEIRINHA === */}
        {activeTab === 'carteirinha' && (
          <div style={{textAlign: 'center', padding: '20px'}}>
            <p style={{color: '#666'}}>Clique no cartão para visualizar o token de atendimento no verso.</p>
            <div className="card-scene" onClick={() => setCardFlipped(!cardFlipped)}>
              <div className={`card-object ${cardFlipped ? 'flipped' : ''}`}>
                <div className="card-face front">
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'start'}}>
                    <Logo lightMode={true} size={0.8} />
                    <div className="card-chip"></div>
                  </div>
                  <div style={{textAlign:'left', margin: '15px 0'}}><span className="card-number">8899 2233 1111 0045</span></div>
                  <div style={{display:'flex', justifyContent:'space-between', textAlign:'left'}}>
                    <div><span className="card-label">BENEFICIÁRIO</span><span className="card-value">GUILHERME SILVA</span></div>
                    <div><span className="card-label">VALIDADE</span><span className="card-value">12/2028</span></div>
                  </div>
                </div>
                <div className="card-face back">
                   <div style={{textAlign: 'left', borderBottom: '1px solid #ddd', paddingBottom: '10px'}}>
                      <strong style={{color: '#004a80'}}>TOKEN DE ATENDIMENTO</strong>
                      <div style={{fontSize: '1.5rem', letterSpacing: '2px', fontWeight: 'bold', marginTop: '5px'}}>AB45-99X</div>
                      <span style={{fontSize: '0.7rem', color: 'red'}}>Válido por 10 min</span>
                   </div>
                   <div style={{fontSize: '0.8rem', textAlign: 'left', marginTop: '15px', color: '#555'}}>
                      <p><strong>Carência:</strong> CUMPRIDA</p>
                      <p><strong>Acomodação:</strong> APARTAMENTO</p>
                      <p><strong>Emergência:</strong> 0800 777 9999</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === ABA 2: REDE CREDENCIADA (POPULADA) === */}
        {activeTab === 'rede' && (
          <div style={{animation: 'fadeIn 0.3s'}}>
            <form className="search-box" onSubmit={handleBusca}>
              <div className="search-field">
                <label>Especialidade</label>
                <select value={busca.especialidade} onChange={(e) => setBusca({...busca, especialidade: e.target.value})}>
                  <option value="">-- Todas --</option>
                  <option value="cardiologia">Cardiologia</option>
                  <option value="dermatologia">Dermatologia</option>
                  <option value="ortopedia">Ortopedia</option>
                  <option value="pediatria">Pediatria</option>
                  <option value="ginecologia">Ginecologia</option>
                  <option value="neurologia">Neurologia</option>
                </select>
              </div>
              <div className="search-field">
                <label>Cidade</label>
                <select value={busca.cidade} onChange={(e) => setBusca({...busca, cidade: e.target.value})}>
                  <option value="">-- Todas --</option>
                  <option value="sp">São Paulo - SP</option>
                  <option value="rj">Rio de Janeiro - RJ</option>
                </select>
              </div>
              <button type="submit" className="btn-primary" disabled={buscando}>
                {buscando ? 'Buscando...' : '🔍 Buscar'}
              </button>
            </form>

            <div className="results-container">
               {resultados.length === 0 && !buscando && (
                   <div style={{color: '#888', textAlign: 'center', padding: '20px'}}>
                       Utilize os filtros acima para encontrar médicos. Total de {todosMedicos.length} profissionais disponíveis.
                   </div>
               )}
               <div className="results-grid">
                  {resultados.map(med => (
                      <div key={med.id} className="doctor-card">
                          <div>
                            <span className="doc-name">{med.nome}</span>
                            <span className="doc-spec">{med.esp}</span>
                            <span className="doc-address">📍 {med.end}<br/>{med.cidade.toUpperCase()}</span>
                          </div>
                          <div style={{marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #eee'}}>
                              <span style={{fontSize: '0.8rem', fontWeight: 'bold'}}>{med.tel}</span>
                              <button className="btn-secondary" style={{padding: '5px 10px', fontSize: '0.8rem'}}>Agendar</button>
                          </div>
                      </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {/* === ABA 3: EXTRATO === */}
        {activeTab === 'extrato' && (
          <div style={{animation: 'fadeIn 0.3s'}}>
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                <div>
                   <h3 style={{margin: 0, color: '#333'}}>Extrato de Coparticipação</h3>
                   <span style={{fontSize: '0.9rem', color: '#666'}}>Últimos 90 dias</span>
                </div>
                <button className="btn-download-stmt" onClick={handleDownloadExtrato} disabled={baixandoExtrato}>
                   {baixandoExtrato ? 'Gerando PDF...' : '⬇ Baixar PDF Oficial'}
                </button>
             </div>

             <div className="table-container">
                <table className="usage-table">
                   <thead>
                      <tr><th>Data</th><th>Prestador</th><th>Procedimento</th><th style={{textAlign: 'right'}}>Valor</th><th style={{textAlign: 'right'}}>Copart. (10%)</th></tr>
                   </thead>
                   <tbody>
                      {extratoMock.map((item, idx) => (
                          <tr key={idx}>
                             <td>{item.data}</td><td>{item.prestador}</td><td>{item.proc}</td>
                             <td style={{textAlign: 'right'}}>R$ {item.valor}</td>
                             <td style={{textAlign: 'right', fontWeight: 'bold', color: '#dc3545'}}>R$ {item.copart}</td>
                          </tr>
                      ))}
                   </tbody>
                </table>
             </div>
             <div style={{marginTop: '20px', padding: '15px', background: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '4px', color: '#856404', fontSize: '0.9rem'}}>
                ℹ Os valores serão descontados em folha.
             </div>
          </div>
        )}
      </div>

      {/* =================================================================
          TEMPLATE OCULTO PARA IMPRESSÃO (PDF A4)
         ================================================================= */}
      <div className="print-hidden-wrapper">
        <div ref={printRef} className="print-health-page">
            
            <div className="health-header-print">
               <Logo lightMode={true} size={1.5} />
               <div style={{textAlign: 'right'}}>
                  <h2 style={{margin: 0, textTransform: 'uppercase', color: '#004a80'}}>Extrato de Utilização</h2>
                  <p style={{margin: '5px 0', fontSize: '10pt', color: '#555'}}>Demonstrativo de Coparticipação</p>
               </div>
            </div>

            <div className="health-info-box">
               <table style={{width: '100%'}}>
                   <tbody>
                       <tr>
                           <td><strong>TITULAR:</strong> GUILHERME SILVA</td>
                           <td><strong>CARTEIRINHA:</strong> 8899 2233 1111 0045</td>
                       </tr>
                       <tr>
                           <td><strong>PLANO:</strong> OURO MAX NACIONAL</td>
                           <td><strong>PERÍODO:</strong> 01/09/2024 A 30/10/2024</td>
                       </tr>
                   </tbody>
               </table>
            </div>

            <table className="health-table-print">
               <thead>
                  <tr>
                     <th>DATA</th>
                     <th>PRESTADOR</th>
                     <th>PROCEDIMENTO</th>
                     <th style={{textAlign: 'right'}}>VALOR TOTAL</th>
                     <th style={{textAlign: 'right'}}>COPART.</th>
                  </tr>
               </thead>
               <tbody>
                  {extratoMock.map((item, idx) => (
                      <tr key={idx}>
                         <td>{item.data}</td>
                         <td>{item.prestador}</td>
                         <td>{item.proc}</td>
                         <td style={{textAlign: 'right'}}>R$ {item.valor}</td>
                         <td style={{textAlign: 'right', fontWeight: 'bold'}}>R$ {item.copart}</td>
                      </tr>
                  ))}
                  {/* Linha de Total */}
                  <tr style={{background: '#f0f0f0'}}>
                      <td colSpan="4" style={{textAlign: 'right', fontWeight: 'bold'}}>TOTAL A DESCONTAR:</td>
                      <td style={{textAlign: 'right', fontWeight: 'bold', color: '#dc3545'}}>
                          R$ {extratoMock.reduce((acc, item) => acc + parseFloat(item.copart.replace(',','.')), 0).toFixed(2).replace('.',',')}
                      </td>
                  </tr>
               </tbody>
            </table>
            
            <div className="health-footer-print">
               <p>Este documento serve como comprovante de despesas médicas para fins de Imposto de Renda.</p>
               <p>TechCorp Saúde - ANS nº 123456</p>
               <p>Gerado em: {new Date().toLocaleDateString()} às {new Date().toLocaleTimeString()}</p>
            </div>

        </div>
      </div>

    </div>
  );
}