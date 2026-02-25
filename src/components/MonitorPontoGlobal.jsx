import { useEffect } from 'react';
import { db } from '../firebase';
import { ref, get, set } from 'firebase/database';
import { useUser } from '../contexts/UserContext';

export default function MonitorPontoGlobal() {
  const { user } = useUser();

  // ⏱️ TIMER GLOBAL DE PONTO (MODO SILENCIOSO)
  useEffect(() => {
    if (!user?.uid) return;

    // 💡 15000 = 15 segundos. Mude para 300000 (5 minutos) quando for para produção!
    const TEMPO_LIMITE = 15000; 

    console.log("🕵️‍♂️ Vigilante Global do RH iniciado (Modo Furtivo)! Contando o tempo...");

    const timerInconsistencia = setTimeout(async () => {
        const hoje = new Date().toISOString().split('T')[0];
        const pontoRef = ref(db, `ponto/${user.uid}/${hoje}`);
        
        try {
            const snapshot = await get(pontoRef);
            const dadosPonto = snapshot.val();
            
            if (!snapshot.exists() || !dadosPonto?.entrada) {
                console.log("⚠️ O tempo estourou e o usuário não bateu o ponto! Registrando no RH silenciosamente...");

                const erroRef = ref(db, `rh/erros_ponto/${user.uid}`);
                const erroSnap = await get(erroRef);
                const erroData = erroSnap.val();
                
                // Só cria a pendência no RH se ela não existir ou se o RH já resolveu a anterior
                if (!erroSnap.exists() || erroData?.status === 'Concluido') {
                    const userDbSnap = await get(ref(db, `users/${user.uid}`));
                    const userData = userDbSnap.exists() ? userDbSnap.val() : {};

                    await set(erroRef, {
                        nome: userData.nome || user.email,
                        cargo: userData.cargo || 'Colaborador',
                        setor: userData.setor || 'Geral',
                        data: hoje,
                        erro: 'Esquecimento Real',
                        status: 'Pendente',
                        pontos: { e: '---', si: '---', vi: '---', s: '---' },
                        timestamp: Date.now()
                    });
                    
                    console.log("✅ Registro silencioso feito com sucesso na malha fina do RH!");
                }
            }
        } catch (error) {
            console.error("❌ Erro no vigilante global:", error);
        }
    }, TEMPO_LIMITE);

    return () => clearTimeout(timerInconsistencia);
  }, [user?.uid]);

  // Como é um componente 100% invisível agora, ele não renderiza absolutamente nada visual!
  return null;
}