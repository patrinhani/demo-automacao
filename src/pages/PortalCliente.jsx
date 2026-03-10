import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { db, auth } from '../firebase';
import { ref, get } from 'firebase/database';
import { onAuthStateChanged } from "firebase/auth";
import Logo from '../components/Logo';
import './PortalCliente.css';

// --- CONTEÚDO DOS DOCUMENTOS (HTML PARA WORD) ---
const DOCS_CONTENT = {
  // 1. RH - RESPOSTAS PRONTAS (COMPLETO)
  respostas_rh: `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #333; }
      
      h1 { color: #1F4E79; font-size: 18pt; text-align: center; text-transform: uppercase; border-bottom: 2px solid #1F4E79; padding-bottom: 10px; margin-bottom: 30px; }
      h2 { color: #fff; background-color: #2E74B5; font-size: 14pt; padding: 5px 10px; margin-top: 30px; margin-bottom: 15px; border-radius: 4px; }
      h3 { color: #2E74B5; font-size: 12pt; margin-top: 20px; margin-bottom: 5px; text-decoration: underline; }
      .assunto { font-weight: bold; color: #555; margin-bottom: 5px; font-style: italic; }
      .msg-box { border: 1px solid #ccc; background-color: #f9f9f9; padding: 10px; border-left: 4px solid #1F4E79; font-family: 'Consolas', 'Courier New', monospace; font-size: 10pt; color: #000; }
      .footer { margin-top: 50px; font-size: 9pt; text-align: center; color: #999; border-top: 1px solid #ccc; padding-top: 10px; }
    </style>
    </head>
    <body>

      <h1>Banco de Respostas Padrão – RH</h1>
      <p style="text-align: center; color: #666;">Documento oficial para padronização de comunicação interna.</p>

      <h2>🕒 SEÇÃO 1: TRATAMENTO DE PONTO (OCORRÊNCIAS DIÁRIAS)</h2>

      <h3>1. Marcação Ímpar (Esquecimento de Saída/Entrada)</h3>
      <div class="assunto">Assunto: Ajuste de Ponto – Marcação Pendente</div>
      <div class="msg-box">
        Olá!<br><br>
        Identificamos uma <b>marcação ímpar</b> no seu espelho de ponto referente ao dia <b>[DATA]</b>. 
        Isso significa que o sistema registrou sua entrada, mas não encontrou a saída (ou vice-versa).<br><br>
        Por favor, verifique se houve esquecimento e realize o ajuste ou justificativa no sistema o quanto antes para evitar descontos ou inconsistências no fechamento.<br><br>
        Atenciosamente,<br>
        <b>Equipe de RH</b>
      </div>

      <h3>2. Falta Injustificada</h3>
      <div class="assunto">Assunto: Ausência de Registros</div>
      <div class="msg-box">
        Olá!<br><br>
        Não identificamos nenhum registro de ponto no dia <b>[DATA]</b>. 
        Caso tenha sido uma falta justificada, folga compensatória ou trabalho externo, por favor anexe o comprovante ou realize o ajuste manual no sistema.<br>
        Se foi um esquecimento total das batidas, regularize sua situação imediatamente.<br><br>
        Obrigado,<br>
        <b>Equipe de RH</b>
      </div>

      <h3>3. Intervalo Curto (&lt; 1 Hora)</h3>
      <div class="assunto">Assunto: Intervalo de Almoço Inferior a 1h</div>
      <div class="msg-box">
        Olá!<br><br>
        Notamos que seu intervalo de almoço no dia <b>[DATA]</b> foi inferior a 1 hora (Mínimo legal). 
        Lembre-se que, por lei e política da empresa, o intervalo de descanso deve ser respeitado integralmente. Evite retornar antes do tempo para não gerar passivo trabalhista.<br><br>
        Atenciosamente,<br>
        <b>Equipe de RH</b>
      </div>

      <h3>4. Atraso Excessivo</h3>
      <div class="assunto">Assunto: Registro de Entrada em Atraso</div>
      <div class="msg-box">
        Olá!<br><br>
        Identificamos um atraso superior à tolerância permitida (10 min) no dia <b>[DATA]</b>. 
        Caso tenha ocorrido algum problema de transporte ou imprevisto, favor justificar no campo de observação do ponto para avaliação do gestor.<br><br>
        Obrigado,<br>
        <b>Equipe de RH</b>
      </div>

      <h3>5. Hora Extra Não Autorizada</h3>
      <div class="assunto">Assunto: Extensão de Jornada sem Solicitação</div>
      <div class="msg-box">
        Olá!<br><br>
        Verificamos que sua saída no dia <b>[DATA]</b> ocorreu muito após o horário contratual, gerando horas extras não planejadas.<br>
        Lembramos que toda hora extra deve ser previamente alinhada e autorizada pelo gestor imediato. Favor alinhar com sua liderança.<br><br>
        Atenciosamente,<br>
        <b>Equipe de RH</b>
      </div>

      <h3>6. Batida Duplicada</h3>
      <div class="assunto">Assunto: Registros Duplicados</div>
      <div class="msg-box">
        Olá!<br><br>
        O sistema identificou registros duplicados no seu ponto do dia <b>[DATA]</b> (Ex: Bateu entrada duas vezes seguidas).<br>
        Por gentileza, solicite a desconsideração/exclusão da marcação incorreta via sistema para que o cálculo de horas do dia fique correto.<br><br>
        Obrigado,<br>
        <b>Equipe de RH</b>
      </div>

      <h3>7. Ponto Britânico (Horários Idênticos)</h3>
      <div class="assunto">Assunto: Alerta - Registros Invariáveis</div>
      <div class="msg-box">
        Olá!<br><br>
        Notamos que seus registros de ponto estão idênticos por vários dias consecutivos (Ex: Entrando exatamente às 08:00 e saindo exatamente às 17:00).<br>
        O Ministério do Trabalho exige a variação real dos minutos (Ponto Real). Por favor, atente-se para registrar o ponto no momento exato que iniciar/terminar suas atividades, evitando anotações artificiais.<br><br>
        Atenciosamente,<br>
        <b>Equipe de RH</b>
      </div>

      <h2>🏥 SEÇÃO 2: ATESTADOS E AFASTAMENTOS</h2>

      <h3>1. Atestado Aprovado</h3>
      <div class="msg-box">
        Gestor,<br><br>
        Informamos que o(a) colaborador(a) <b>[NOME]</b>, Matrícula: [MATRICULA], apresentou na data de [DATA] um atestado médico referente ao período de [INICIO] a [FIM].<br>
        O registro já foi devidamente cadastrado no sistema.<br><br>
        Obrigada,<br>
        <b>Gestão de Atestados</b>
      </div>

      <h3>2. Reprovado: Geral</h3>
      <div class="msg-box">
        Gestor,<br><br>
        O documento apresentado pelo colaborador <b>[NOME]</b> foi <b>reprovado</b>, e as informações pertinentes foram enviadas ao mesmo via sistema.<br><br>
        Obrigada,<br>
        <b>Gestão de Atestados</b>
      </div>

      <h3>3. Reprovado: Fora do Prazo (48h)</h3>
      <div class="msg-box">
        Olá!<br><br>
        O documento enviado foi imputado fora do período da política da empresa (48 horas). Por esse motivo a solicitação foi reprovada.<br><br>
        Obrigado,<br>
        <b>Gestão de Atestados</b>
      </div>

      <h3>4. Reprovado: Ilegível / Rasurado</h3>
      <div class="msg-box">
        Olá!<br><br>
        O documento não será aceito, pois está <b>ilegível/rasurado</b>. 
        Caso possua o documento correto, peça ao seu gestor que abra um chamado de retificação.<br><br>
        Obrigado,<br>
        <b>Gestão de Atestados</b>
      </div>

      <h3>5. Encaminhamento ao INSS (>15 Dias)</h3>
      <div class="msg-box">
        Prezado(a),<br><br>
        Identificamos que a soma de atestados ultrapassou 15 dias. O colaborador deve realizar o agendamento da perícia médica no INSS (Central 135) em até 48 horas.<br><br>
        Obrigada,<br>
        <b>Gestão de Atestados</b>
      </div>

      <h3>6. Doação de Sangue</h3>
      <div class="msg-box">
        Olá!<br><br>
        O documento trata-se de Doação de Sangue. Deve ser imputado como <b>'Justificativa de Ausência' (Abono)</b>, e não como atestado médico.<br><br>
        Obrigado,<br>
        <b>Gestão de Atestados</b>
      </div>

      <div class="footer">
        Gerado automaticamente pelo TechPortal • Uso exclusivo interno.
      </div>

    </body>
    </html>
  `,

  // 2. RH - POLÍTICA DE REEMBOLSO
  reembolso_rh: `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset="utf-8"><style>
      body{font-family:'Arial',sans-serif;font-size:11pt;}
      h1{color:#2E74B5;border-bottom:2px solid #2E74B5;text-align:center;}
      h3{background:#eee;padding:5px;}
      table{width:100%;border-collapse:collapse;margin-top:10px;}
      td,th{border:1px solid #999;padding:8px;text-align:left;}
    </style></head>
    <body>
      <h1>POLÍTICA DE REEMBOLSO DE DESPESAS 2026</h1>
      <p>Este documento estabelece as diretrizes para reembolso de despesas corporativas.</p>
      
      <h3>1. ALIMENTAÇÃO</h3>
      <p>O limite diário para refeições em viagens é de <b>R$ 55,00</b> (almoço) e <b>R$ 60,00</b> (jantar). Bebidas alcoólicas não são reembolsáveis.</p>
      
      <h3>2. QUILOMETRAGEM (KM)</h3>
      <p>Para uso de veículo próprio, o valor pago por KM rodado é de <b>R$ 1,45</b>. É obrigatório apresentar o relatório do Google Maps com a rota.</p>
      
      <h3>3. HOSPEDAGEM</h3>
      <p>O teto para diárias em hotéis é de <b>R$ 350,00</b> (Capitais) e <b>R$ 250,00</b> (Interior).</p>
      
      <h3>4. PRAZOS</h3>
      <p>As notas fiscais devem ser lançadas no sistema até o dia 05 do mês subsequente.</p>
    </body></html>
  `,

  // 3. TI - MANUAL DE SEGURANÇA
  seguranca_ti: `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset="utf-8"><style>
      body{font-family:'Calibri',sans-serif;font-size:12pt;}
      h1{color:#C00000;text-align:center;}
      .alert{border:1px solid red;color:red;padding:10px;font-weight:bold;text-align:center;}
    </style></head>
    <body>
      <h1>MANUAL DE SEGURANÇA DA INFORMAÇÃO</h1>
      
      <div class="alert">ATENÇÃO: A segurança é responsabilidade de todos!</div>
      
      <h3>🔐 1. SENHAS FORTES</h3>
      <ul>
        <li>Mínimo de 10 caracteres.</li>
        <li>Deve conter letras maiúsculas, minúsculas, números e símbolos (@#$%).</li>
        <li>Nunca utilize datas de nascimento ou nomes de familiares.</li>
      </ul>

      <h3>🚫 2. PHISHING E E-MAILS SUSPEITOS</h3>
      <p>Desconfie de e-mails pedindo alteração de senha ou com anexos urgentes. A TI nunca pede sua senha por e-mail.</p>

      <h3>💻 3. BLOQUEIO DE TELA</h3>
      <p>Ao levantar da mesa, pressione <b>Windows + L</b> para bloquear seu computador.</p>
    </body></html>
  `,

  // 4. FINANCEIRO - CENTROS DE CUSTO
  centro_custo_fin: `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset="utf-8"><style>
      body{font-family:'Arial',sans-serif;}
      h1{background:#18995B;color:white;padding:10px;text-align:center;}
      table{width:100%;border-collapse:collapse;}
      th{background:#ddd;font-weight:bold;}
      td,th{border:1px solid #000;padding:8px;text-align:center;}
    </style></head>
    <body>
      <h1>TABELA DE CENTROS DE CUSTO (C.C.) - 2026</h1>
      <p>Utilize os códigos abaixo para abertura de solicitações e rateio de notas.</p>
      
      <table>
        <tr><th>CÓDIGO</th><th>DEPARTAMENTO</th><th>GESTOR RESPONSÁVEL</th></tr>
        <tr><td>1001</td><td>Administrativo</td><td>Roberto Silva</td></tr>
        <tr><td>2005</td><td>Tecnologia (TI)</td><td>Amanda Nunes</td></tr>
        <tr><td>3010</td><td>Comercial / Vendas</td><td>Felipe Costa</td></tr>
        <tr><td>4020</td><td>Recursos Humanos</td><td>Patrícia Abravanel</td></tr>
        <tr><td>5000</td><td>Financeiro</td><td>Fausto Silva</td></tr>
        <tr><td>6001</td><td>Marketing</td><td>Juliana Paes</td></tr>
      </table>
    </body></html>
  `
};

export default function PortalCliente() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isRH, setIsRH] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) return navigate('/');
      setUser(currentUser);

      const userRef = ref(db, `users/${currentUser.uid}`);
      get(userRef).then((snap) => {
        const dados = snap.val();
        if (dados) {
          const setor = (dados.setor || '').toLowerCase();
          const cargo = (dados.cargo || '').toLowerCase();
          const role = dados.role || '';
          if (setor.includes('rh') || setor.includes('recursos') || cargo.includes('c.e.o') || role === 'admin') {
            setIsRH(true);
          }
        }
      });
    });
    return () => unsubscribe();
  }, [navigate]);

  // FUNÇÃO GENÉRICA DE DOWNLOAD (Mantida ativa apenas para os Modelos do RH)
  const baixarDocumento = (chaveConteudo, nomeArquivo) => {
    const conteudo = DOCS_CONTENT[chaveConteudo];
    if (!conteudo) return alert("Erro: Documento não encontrado.");

    const blob = new Blob(['\ufeff', conteudo], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="tech-layout">
      <div className="ambient-light light-1"></div>
      <Sidebar />

      <main className="tech-main">
        <header className="tech-header">
          <div className="header-content">
            <h1>Documentos & Processos</h1>
            <p>Central de Conhecimento e Padronização</p>
          </div>
        </header>

        <div className="tech-scroll-content">
          <div className="docs-grid">
            
            {/* --- BLOCO RH --- */}
            <div className="doc-section glass-effect">
              <div className="section-header">
                <span className="icon-section">👥</span>
                <h2>Recursos Humanos</h2>
              </div>
              
              <div className="doc-list">
                {/* DOC 1: Respostas Prontas - O ÚNICO PERMITIDO */}
                <div className="doc-card">
                  <div className="doc-icon">📄</div>
                  <div className="doc-info">
                    <h3>Modelos de Resposta</h3>
                    <p>Mensagens padrão para Pontos e Atestados.</p>
                    {isRH ? (
                      <button className="btn-download" onClick={() => baixarDocumento('respostas_rh', 'Mensagens_RH.doc')}>
                        ⬇ Baixar Documento
                      </button>
                    ) : (
                      <span className="badge-lock">🔒 Acesso Restrito</span>
                    )}
                  </div>
                </div>

                {/* DOC 2: Política Reembolso - BLOQUEADO */}
                <div className="doc-card">
                  <div className="doc-icon">⚖️</div>
                  <div className="doc-info">
                    <h3>Política de Reembolso</h3>
                    <p>Regras para KM, Alimentação e Hotéis.</p>
                    <span className="badge-lock" style={{ opacity: 0.7, cursor: 'not-allowed' }}>🔒 Download Indisponível</span>
                  </div>
                </div>
              </div>
            </div>

            {/* --- BLOCO TI --- */}
            <div className="doc-section glass-effect">
              <div className="section-header">
                <span className="icon-section">💻</span>
                <h2>Tecnologia (TI)</h2>
              </div>
              <div className="doc-list">
                {/* DOC 3: Manual Segurança - BLOQUEADO */}
                <div className="doc-card">
                  <div className="doc-icon">🔒</div>
                  <div className="doc-info">
                    <h3>Manual de Segurança</h3>
                    <p>Boas práticas de senhas e VPN.</p>
                    <span className="badge-lock" style={{ opacity: 0.7, cursor: 'not-allowed' }}>🔒 Download Indisponível</span>
                  </div>
                </div>
              </div>
            </div>

            {/* --- BLOCO FINANCEIRO --- */}
            <div className="doc-section glass-effect">
              <div className="section-header">
                <span className="icon-section">💰</span>
                <h2>Financeiro</h2>
              </div>
              <div className="doc-list">
                {/* DOC 4: Centro de Custo - BLOQUEADO */}
                <div className="doc-card">
                  <div className="doc-icon">📊</div>
                  <div className="doc-info">
                    <h3>Centros de Custo</h3>
                    <p>Tabela de códigos para rateio.</p>
                    <span className="badge-lock" style={{ opacity: 0.7, cursor: 'not-allowed' }}>🔒 Download Indisponível</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}