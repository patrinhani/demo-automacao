// src/utils/geradorFinanceiro.js

export const gerarCenarioFinanceiro = () => {
  const formatarData = (d) => d.toISOString().split('T')[0];
  
  // Função para adicionar dias a uma data (Futuro)
  const adicionarDias = (dias) => {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return formatarData(d);
  };

  // Lista de empresas (Clientes que nos pagam)
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

  let extrato = []; // O que vai para o Excel (Banco)
  let faturas = []; // O que vai para a Tela (Sistema Interno)

  // --- GERAR 100 LANÇAMENTOS DE RECEBIMENTO ---
  for (let i = 1; i <= 100; i++) {
    const cliente = clientes[Math.floor(Math.random() * clientes.length)];
    const valorBase = (Math.random() * 2000) + 50; 
    const valorFinal = parseFloat(valorBase.toFixed(2));
    
    const idUnico = `DOC-${10000 + i}-${Math.floor(Math.random() * 999)}`;

    // DATAS:
    // Sistema: Fatura vence no futuro (D+1 a D+30)
    const dataVencimento = adicionarDias(Math.floor(Math.random() * 30) + 1);
    
    // Banco: Cliente pagou Hoje ou Ontem (Entrada de Dinheiro)
    const dataCreditoBanco = adicionarDias(Math.random() > 0.5 ? 0 : -1);

    // 80% Match Perfeito / 20% Caos
    const ehCaos = Math.random() > 0.8;

    // --- 1. CRIA A "CONTA A RECEBER" (SISTEMA) ---
    faturas.push({
      id: idUnico,
      cliente: cliente,
      vencimento: dataVencimento,
      valor: valorFinal,
      status: "Pendente",
      origem: "Sistema Interno"
    });

    // --- 2. CRIA O LANÇAMENTO NO EXTRATO (BANCO) ---
    if (!ehCaos) {
      // Caso Perfeito: Crédito com mesmo valor e ID
      extrato.push({
        data: dataCreditoBanco,
        historico: `LIQ. COBRANÇA - ${cliente.toUpperCase()}`, // Texto de recebimento
        documento: idUnico,
        valor: valorFinal, // POSITIVO (Entrada)
        tipo: "C"          // Crédito
      });
    } else {
      // Caso Caos: Valor diferente (Juros/Multa) ou Nome genérico
      // Cliente pagou com juros, então entrou MAIS dinheiro
      const valorComJuros = parseFloat((valorFinal + (Math.random() * 10)).toFixed(2));
      
      extrato.push({
        data: dataCreditoBanco,
        historico: `CREDITO PIX - CLIENTE FINAL`, // Nome genérico para dificultar
        documento: `PIX-${Math.floor(Math.random()*9999)}`, // ID diferente
        valor: valorComJuros, // Valor diferente
        tipo: "C"
      });
    }
  }

  // Adiciona taxas (Essas sim são negativas/débitos) para confundir
  const hoje = new Date();
  extrato.push({ data: formatarData(hoje), historico: "TAR MANUTENCAO CONTA", documento: "TAR", valor: -45.00, tipo: "D" });
  extrato.push({ data: formatarData(hoje), historico: "IOF DIARIO", documento: "IOF", valor: -1.25, tipo: "D" });

  return { extrato, faturas };
};