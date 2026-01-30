import React, { useState } from 'react';
import { db } from '../../firebase';
import { ref, push, remove, update, get } from 'firebase/database'; // Importamos get e update

export default function BancoExtrato({ extrato, saldo }) {
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  // Lógica do Robô (RPA) - AGORA PERSISTENTE
  const processarRPA = async () => {
    setLoading(true);
    const hoje = new Date().toISOString().split('T')[0];
    
    // 1. Limpa o ERP (Opcional, para testes limpos)
    await remove(ref(db, 'financeiro/contasReceber')); 

    const clientes = ["Alfa Distribuidora", "Beta Varejo", "Gama Serviços", "Delta Indústria"];
    const transacoesBanco = []; // Para salvar no banco_mock
    const faturasERP = [];      // Para salvar no financeiro do sistema

    let totalCreditos = 0;
    let totalDebitos = 0;

    // A. Gera Tarifa (Débito)
    const tarifa = { 
        data: new Date().toISOString(), 
        desc: "TAR MANUTENCAO CTA", 
        doc: "000000", 
        valor: -45.00, 
        tipo: "D" 
    };
    transacoesBanco.push(tarifa);
    totalDebitos += 45.00;
    
    // B. Gera Recebimentos (Créditos)
    clientes.forEach(cliente => {
        const valor = parseFloat(((Math.random() * 5000) + 1000).toFixed(2));
        const docId = `BOL-${Math.floor(Math.random() * 99999)}`;
        
        // Item para o Extrato Bancário
        const itemBanco = { 
            data: new Date().toISOString(), 
            desc: `LIQ COBRANÇA - ${cliente}`, 
            doc: docId, 
            valor: valor, 
            tipo: "C" 
        };
        transacoesBanco.push(itemBanco);
        totalCreditos += valor;

        // Item para o Sistema de Conciliação (TechPortal)
        faturasERP.push({ 
            id: docId, 
            cliente: cliente, 
            valor: valor.toFixed(2), 
            vencimento: hoje, 
            status: "Aberto", 
            origem: "Horizon CNAB" 
        });
    });

    // 2. SALVAR NO FIREBASE (PERSISTÊNCIA)
    
    // Passo 2.1: Atualizar Saldo do Banco
    // Primeiro pegamos o saldo atual do banco para somar corretamente (se não vier da prop)
    const saldoAtualRef = ref(db, 'banco_mock/saldo');
    const snap = await get(saldoAtualRef);
    const saldoAtual = snap.exists() ? Number(snap.val()) : 0;
    const novoSaldo = saldoAtual + totalCreditos - totalDebitos;

    await update(ref(db, 'banco_mock'), { saldo: novoSaldo });

    // Passo 2.2: Adicionar Transações ao Extrato do Banco
    const transacoesRef = ref(db, 'banco_mock/transacoes');
    const promisesBanco = transacoesBanco.map(t => push(transacoesRef, t));
    await Promise.all(promisesBanco);

    // Passo 2.3: Enviar para o Sistema TechPortal (Conciliação)
    const erpRef = ref(db, 'financeiro/contasReceber');
    const promisesERP = faturasERP.map(f => push(erpRef, f));
    await Promise.all(promisesERP);

    setLoading(false);
    // Não precisamos de setExtrato ou setSaldo aqui, o listener no Banco.jsx fará isso
  };

  // Filtro local
  const filtrados = extrato ? extrato.filter(item => item.desc && item.desc.toLowerCase().includes(busca.toLowerCase())) : [];

  return (
    <div>
      {/* Barra de Ações */}
      <div className="filters-bar">
        <input 
            type="text" 
            placeholder="🔍 Buscar lançamento..." 
            className="search-input-bank"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
        />
        <button className="btn-generate-infinite" style={{width:'auto', marginTop:0, padding:'0 25px'}} onClick={processarRPA} disabled={loading}>
            {loading ? 'Sincronizando...' : '⚡ Simular CNAB (RPA)'}
        </button>
      </div>

      {/* Tabela Glass */}
      <div className="glass-card full-width" style={{padding:0, overflow:'hidden'}}>
        <div className="table-container">
            <table>
            <thead>
                <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Documento</th>
                <th className="text-right">Valor</th>
                <th className="text-center">Tipo</th>
                </tr>
            </thead>
            <tbody>
                {filtrados.length === 0 ? (
                    <tr><td colSpan="5" className="empty-msg">Nenhum lançamento encontrado no servidor.</td></tr>
                ) : (
                    filtrados.map((item, i) => (
                    <tr key={i}>
                        <td>{new Date(item.data).toLocaleDateString()} {new Date(item.data).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                        <td className="desc-infinite">{item.desc}</td>
                        <td className="mono">{item.doc}</td>
                        <td className={`text-right ${item.tipo === 'D' ? 'neg' : 'pos'}`}>
                        R$ {Math.abs(item.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                        <td className="text-center">
                        <span className={`tag-type ${item.tipo}`}>{item.tipo}</span>
                        </td>
                    </tr>
                    ))
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}