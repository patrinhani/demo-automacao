// src/utils/geradorFinanceiro.js

export const gerarCenarioFinanceiro = () => {
  const formatarData = (d) => d.toISOString().split('T')[0];
  const formatarHora = () => new Date().toLocaleTimeString('pt-BR');
  
  const gerarHash = () => Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Função auxiliar para gerar CNPJ realista
  const gerarCNPJ = () => {
    const n = () => Math.floor(Math.random() * 9);
    return `${n()}${n()}.${n()}${n()}${n()}.${n()}${n()}${n()}/0001-${n()}${n()}`;
  };

  const adicionarDias = (dias) => {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return formatarData(d);
  };

  const clientes = [
    "TechSolutions Ltda", "Padaria do João", "Mercado Preço Bom", 
    "Posto Ipiranga Centro", "Farmácia Saúde Total", "Restaurante Sabor Mineiro",
    "Papelaria Escolar", "Oficina Mecânica Veloz", "Consultoria Alpha",
    "Condomínio Jardins", "Academia FitLife", "Uber do Brasil",
    "Netflix Servicos", "Amazon BR", "Spotify Premium",
    "Vivo Telecom", "Claro Net", "Enel Energia", "Sabesp Agua",
    "Lanchonete da Esquina", "Gráfica Rápida", "Petshop Amigo",
    "Drogaria São Paulo", "Leroy Merlin", "Kalunga Papelaria",
    "Smart Fit", "Burger King", "McDonalds", "Outback Steakhouse"
  ];

  let extrato = []; 
  let faturas = []; 

  for (let i = 1; i <= 50; i++) { // Reduzi para 50 para facilitar testes
    const clienteNome = clientes[Math.floor(Math.random() * clientes.length)];
    // GERA O CNPJ AQUI PARA USAR NOS DOIS LADOS
    const clienteCnpj = gerarCNPJ(); 
    
    const valorBase = (Math.random() * 2000) + 50; 
    const valorFinal = parseFloat(valorBase.toFixed(2));
    
    const idTransacao = `TRX-${10000 + i}`;
    const hashSeguranca = gerarHash();
    const dataVencimento = adicionarDias(Math.floor(Math.random() * 30) + 1);
    const dataCreditoBanco = adicionarDias(Math.random() > 0.5 ? 0 : -1);
    const ehCaos = Math.random() > 0.8;

    // --- 1. DADOS PARA O SISTEMA (Conciliação) ---
    faturas.push({
      id: idTransacao,
      nfe: `NF-${202500 + i}`,
      cnpj: clienteCnpj, // CNPJ correto
      cliente: clienteNome,
      vencimento: dataVencimento,
      valor: valorFinal,
      codigoHash: hashSeguranca,
      status: "Pendente",
      origem: "Sistema Interno"
    });

    // --- 2. DADOS PARA O BANCO (Extrato e PDF) ---
    if (!ehCaos) {
      extrato.push({
        data: dataCreditoBanco,
        hora: formatarHora(), // Adicionando hora
        historico: `LIQ. COBRANÇA - ${clienteNome.toUpperCase()}`,
        documento: idTransacao,
        valor: valorFinal, 
        tipo: "C",
        hash: hashSeguranca,
        // NOVOS CAMPOS PARA O PDF FICAR RICO:
        pagador_nome: clienteNome.toUpperCase(),
        pagador_cnpj: clienteCnpj,
        pagador_banco: "BANCO EXTERNO S.A."
      });
    } else {
      // Caso de caos (valor diferente)
      const valorComJuros = parseFloat((valorFinal + 10.50).toFixed(2));
      extrato.push({
        data: dataCreditoBanco,
        hora: formatarHora(),
        historico: `CRÉDITO DIVERSO (DIVERGÊNCIA)`, 
        documento: idTransacao, 
        valor: valorComJuros, 
        tipo: "C",
        hash: hashSeguranca,
        pagador_nome: clienteNome.toUpperCase(),
        pagador_cnpj: clienteCnpj,
        pagador_banco: "BANCO EXTERNO S.A."
      });
    }
  }

  // Taxas do banco (sem pagador externo)
  const hoje = new Date();
  extrato.push({ data: formatarData(hoje), hora: "02:15:00", historico: "TAR MANUTENCAO CONTA", documento: "TAR", valor: -45.00, tipo: "D" });

  return { extrato, faturas };
};