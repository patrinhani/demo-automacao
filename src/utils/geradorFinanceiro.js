// src/utils/geradorFinanceiro.js

export const gerarCenarioFinanceiro = () => {
  const hoje = new Date();
  
  // Formata data YYYY-MM-DD
  const formatarData = (d) => d.toISOString().split('T')[0];
  
  // Datas base
  const dataHoje = formatarData(hoje);
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);
  const dataOntem = formatarData(ontem);

  let extrato = []; // O que vai para o Excel
  let faturas = []; // O que vai para a Tela (Firebase)

  // --- CASO 1: CONFLITO DE NOME (O Clássico) ---
  // Banco: "DOC 4432..." | Sistema: "Padaria do João"
  extrato.push({
    data: dataOntem,
    historico: "DOC 4432 - TRANSF J. SILVA",
    documento: "443200",
    valor: -1250.00,
    tipo: "D"
  });
  faturas.push({
    id: 1,
    cliente: "Padaria do João (Filial Norte)",
    vencimento: dataOntem,
    valor: 1250.00,
    status: "Pendente",
    matchKey: "doc_4432" 
  });

  // --- CASO 2: O RUÍDO (Taxa que só existe no Excel) ---
  extrato.push({
    data: dataHoje,
    historico: "TAR MANUT CTA - PACOTE PREMIUM",
    documento: "000000",
    valor: -15.90,
    tipo: "D"
  });
  // Não criamos fatura para isso, o usuário tem que ignorar manualmente.

  // --- CASO 3: O PESADELO AGRUPADO (1 Entrada paga 2 Faturas) ---
  // Banco: R$ 500,00 (Entrada única)
  extrato.push({
    data: dataHoje,
    historico: "PIX RECEBIDO - CLIENTE FINAL 99",
    documento: "PIX992",
    valor: 500.00,
    tipo: "C"
  });
  // Sistema: Duas faturas de 250 (Usuário precisa somar)
  faturas.push({
    id: 2,
    cliente: "Tech Solutions - Serv. Manutenção",
    vencimento: dataHoje,
    valor: 250.00,
    status: "Pendente",
    matchKey: "pix_agrupado"
  });
  faturas.push({
    id: 3,
    cliente: "Tech Solutions - Hospedagem",
    vencimento: dataHoje,
    valor: 250.00,
    status: "Pendente",
    matchKey: "pix_agrupado"
  });

  // --- CASO 4: O CONTROLE (Fácil) ---
  extrato.push({
    data: dataOntem,
    historico: "PGTO BOLETO - FORNECEDOR PAPEL",
    documento: "889211",
    valor: -890.00,
    tipo: "D"
  });
  faturas.push({
    id: 4,
    cliente: "Papelaria Corporativa Ltda",
    vencimento: dataOntem,
    valor: 890.00,
    status: "Pendente",
    matchKey: "boleto_papel"
  });

  return { extrato, faturas };
};