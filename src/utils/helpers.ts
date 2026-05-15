import { Lead, STAGE_SLAS } from '../types';

export const normalizeKey = (k: string) => k ? String(k).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "") : '';

export const getVal = (obj: any, possibleKeys: string[]) => {
  if (!obj || typeof obj !== 'object') return '';
  const objKeys = Object.keys(obj);
  for (const pk of possibleKeys) {
    const normPk = normalizeKey(pk);
    if (obj[pk] !== undefined && obj[pk] !== '') return obj[pk];
    const match = objKeys.find(k => normalizeKey(k) === normPk);
    if (match && obj[match] !== undefined && obj[match] !== '') return obj[match];
  }
  return '';
};

export const getElapsedDays = (startDate: Date, endDate: Date) => {
  // Usamos o meio-dia (12:00) para evitar problemas de fuso horário e horário de verão
  const start = new Date(startDate);
  start.setHours(12, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(12, 0, 0, 0);
  
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

export const formatMoney = (v: number | string | null | undefined) => {
  if (v === null || v === undefined || v === '') return "";
  let value = typeof v === 'string' ? parseInt(v.replace(/\D/g, '')) : v;
  if (isNaN(value)) return "";
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
};

export const parseDateInput = (v: string) => {
  const digits = String(v || '').replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
};

export const formatDate = (date?: string | null) => {
  if (!date) return '--/--/----';
  const raw = String(date).trim().split('T')[0].split(' ')[0];

  if (raw.includes('-')) {
    const [y, m, d] = raw.split('-');
    if (y?.length === 4 && m && d) return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  if (raw.includes('/')) {
    const [a, b, y] = raw.split('/');
    if (a && b && y?.length === 4) {
      const first = Number(a);
      const second = Number(b);
      if (first > 12) return `${a.padStart(2, '0')}/${b.padStart(2, '0')}/${y}`;
      if (second > 12) return `${b.padStart(2, '0')}/${a.padStart(2, '0')}/${y}`;
      return `${a.padStart(2, '0')}/${b.padStart(2, '0')}/${y}`;
    }
  }

  return raw;
};

export const parseLocalDate = (date?: string | null) => {
  if (!date) return null;
  const formatted = formatDate(date);
  const [d, m, y] = formatted.split('/').map(Number);
  if (!d || !m || !y) return null;
  const parsed = new Date(y, m - 1, d);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

export const calcAge = (dateStr: string) => {
  if (!dateStr || String(dateStr).length < 10) return 0;
  const [d, m, y] = formatDate(dateStr).split('/').map(Number);
  const birth = new Date(y, m - 1, d);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age > 0 && age < 120 ? age : 0;
};

export const formatPhone = (v: string) => {
  const d = String(v || '').replace(/\D/g, '');
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
};

export const getWhatsAppLink = (phone: string, msg: string) => {
  let cleanPhone = String(phone || '').replace(/\D/g, '');
  if (!cleanPhone) return '';
  if (cleanPhone.length === 10 || cleanPhone.length === 11) cleanPhone = '55' + cleanPhone;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
};

export const calcIMC = (peso: number, altura: number) => {
  if (!peso || !altura) return 0;
  const h = altura / 100;
  return parseFloat((peso / (h * h)).toFixed(1));
};

export const getLastUpdateDate = (lead: Lead) => {
  if (lead.historico && lead.historico.length > 0) {
    const lastLog = lead.historico[0];
    const match = String(lastLog).match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    if (match) return match[1];
  }
  return lead.criadoEm ? String(lead.criadoEm).split(' ')[0] : '--/--/----';
};

export const getDaysInStage = (lead: Lead) => {
  // 1. Prioridade: tag de reinício de SLA gravado no historico
  const slaResetLog = lead.historico?.find(log => log.includes('[SLA') && log.includes('reiniciado'));
  if (slaResetLog) {
    // Formato: "[SLA ⏱️] Contador reiniciado manualmente em DD/MM/AAAA, HH:MM:SS"
    const match = slaResetLog.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (match) {
      const [d, m, y] = match[1].split('/');
      const resetDate = new Date(Number(y), Number(m) - 1, Number(d));
      resetDate.setHours(0, 0, 0, 0);
      const now = new Date(); now.setHours(0, 0, 0, 0);
      return getElapsedDays(resetDate, now);
    }
  }

  // 2. Campo dataUltimoStatus (se preenchido localmente)
  let dateStr = lead.dataUltimoStatus;

  // 3. Fallback: última mudança de status no histórico
  if (!dateStr) {
    const lastLog = lead.historico?.find(log => log.includes('→'));
    dateStr = lastLog ? (lastLog.match(/em (\d{1,2}\/\d{1,2}\/\d{4})/) || [])[1] : lead.criadoEm;
  }

  if (!dateStr) return 0;

  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let targetDate: Date;
    // Forçamos o parsing para tratar strings ISO (YYYY-MM-DD) como data LOCAL, não UTC
    const parts = String(dateStr).split(' ')[0].split(/[\/\-]/);
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      targetDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      // DD/MM/YYYY
      targetDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    }
    targetDate.setHours(0, 0, 0, 0);

    return getElapsedDays(targetDate, now);
  } catch { return 0; }
};

export const checkSLA = (lead: Lead) => {
  const days = getDaysInStage(lead);
  const maxDays = STAGE_SLAS[lead.status];
  
  if (maxDays === undefined) return { isBreached: false, days, maxDays: 0 };
  
  // No Show nunca é protegido por dataAcao — a reunião não aconteceu
  if (lead.acao === 'No Show') {
    return { isBreached: days > maxDays, days, maxDays };
  }

  // Se há uma data de agendamento futura (hoje inclusive), o SLA fica protegido
  let isProtected = false;
  if (lead.dataAcao && lead.dataAcao.trim()) {
    try {
      const now = new Date(); now.setHours(0, 0, 0, 0);
      let acaoDate: Date;
      if (String(lead.dataAcao).includes('T') || String(lead.dataAcao).includes('-')) {
        acaoDate = new Date(lead.dataAcao);
      } else {
        const parts = String(lead.dataAcao).split('/');
        if (parts.length === 3) {
          acaoDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        } else {
          acaoDate = new Date();
        }
      }
      acaoDate.setHours(0, 0, 0, 0);
      
      // SLA protegido SE a data for hoje ou no futuro
      if (acaoDate >= now) isProtected = true;
    } catch {
      isProtected = false;
    }
  }

  return { isBreached: !isProtected && days > maxDays, days, maxDays };
};

export const checkFastTrack = (lead: Lead): string => {
  const isQualified = lead.nome && lead.celular && lead.profissao && (Number(lead.renda) || 0) > 0;
  if (isQualified && lead.status === 'Lead') return 'Planejamento';
  return lead.status;
};

// ─── Mensagens automáticas por Status+Ação ────────────────────────────────────

/** Retorna a mensagem contextual para o LEAD (WhatsApp) baseada em status+ação */
export const getClientWhatsAppMessage = (lead: Lead) => {
  const lead_nome = (lead?.nome || 'o cliente').split(' ')[0];
  const consultor_nome = lead?.consultor ? lead.consultor.split(' ')[0] : 'Consultor';
  const data = lead.dataAcao ? formatDate(lead.dataAcao) : '[data]';
  const snippets = getSnippets(lead);

  // ── FOLLOW-UP ─────────────────────────────────────────────────────────────
  if (lead.status === 'Follow-up') {
    if (lead.acao === 'Agendar') {
      return `Olá, ${lead_nome}! Aqui é o ${consultor_nome}. Sei que uma decisão como essa exige cuidado, por isso estou passando para saber se surgiram novos pontos na sua análise. Vamos marcar um papo rápido para eu te dar o suporte necessário e garantirmos que o plano faça total sentido para você?`;
    }
    if (lead.acao === 'Agendado') {
      return `Combinado, ${lead_nome}! No dia ${data} vamos repassar os pontos principais. Esse cuidado agora é o que garante que seu planejamento seja sólido e seguro. Até lá!`;
    }
    if (lead.acao === 'No Show') {
      return `Oi, ${lead_nome}! Imaginei que pudesse ter surgido algum imprevisto hoje. Como esse alinhamento é fundamental para não perdermos o prazo das condições que desenhamos, me avise assim que puder falar para reagendarmos.`;
    }
  }

  // ── EM ANÁLISE ────────────────────────────────────────────────────────────
  if (lead.status === 'Em Análise') {
    if (lead.acao === 'Aguardando Documentação') {
      return `Olá, ${lead_nome}! A seguradora está precisando daqueles documentos que conversamos para continuar a análise do seu risco. Consegue me enviar por aqui?`;
    }
    if (lead.acao === 'Documentação Enviada') {
      return `Vou enviar os documentos para a seguradora e vou te atualizando por aqui, ok?`;
    }
  }

  // ── GANHO ─────────────────────────────────────────────────────────────────
  if (lead.status === 'Ganho') {
    if (lead.acao === 'Enviar Documentos') {
      return `${lead_nome}, tudo bem?\n\nA documentação final do seu planejamento foi concluída. Estou enviando o material por aqui para facilitar, mas também fico à disposição para revisar qualquer ponto e acompanhar futuras atualizações da sua proteção financeira.\n\nAgradeço pela confiança e desejo muito sucesso!`;
    }
    if (lead.acao === 'Criar Lead') return snippets.boasVindas;
    return snippets.documentosCliente;
  }

  // ── Fallback genérico ──────────────────────────────────────────────────────
  if (lead.acao === 'Acompanhamento (Cliente)') return snippets.msg02;
  return `Olá ${lead_nome}, como você está? Gostaria de dar continuidade ao nosso planejamento financeiro. Podemos falar?`;
};

/** Retorna a mensagem contextual para o CONSULTOR (WhatsApp/Teams) baseada em status+ação */
export const getConsultantWhatsAppMessage = (lead: Lead) => {
  const consultor_nome = lead?.consultor ? lead.consultor.split(' ')[0] : 'Consultor';
  const lead_nome = lead?.nome || 'o cliente';
  const data = lead.dataAcao ? formatDate(lead.dataAcao) : '[data]';
  const snippets = getSnippets(lead);

  // ── LEAD ──────────────────────────────────────────────────────────────────
  if (lead.status === 'Lead') {
    return `Olá, ${consultor_nome}! Passando para avisar que recebemos o interesse de ${lead_nome}. No momento, estamos aguardando a chegada das informações detalhadas para que você possa fazer uma abordagem assertiva. Fique atento, te aviso assim que os dados estiverem prontos!`;
  }

  // ── PLANEJAMENTO ──────────────────────────────────────────────────────────
  if (lead.status === 'Planejamento') {
    if (lead.acao === 'Aguardando Informações') {
      return `Olá, ${consultor_nome}! Para darmos o próximo passo no plano do ${lead_nome}, ainda precisamos de algumas informações. Consegue verificar com ele? Se precisar de alguma ajuda, basta me acionar aqui.`;
    }
    if (lead.acao === 'Agendar') {
      return `${consultor_nome}, tudo bem? O próximo passo para montarmos o planejamento do lead ${lead_nome} é o agendamento da reunião de planejamento. Vamos garantir esse horário na agenda?`;
    }
    if (lead.acao === 'Agendado') {
      return `Agenda atualizada! O nosso planejamento para tratarmos do lead ${lead_nome} está marcado para o dia ${data}.`;
    }
  }

  // ── FECHAMENTO ────────────────────────────────────────────────────────────
  if (lead.status === 'Fechamento') {
    if (lead.acao === 'Agendar') {
      return `${consultor_nome}, tudo bem? O próximo passo para o ${lead_nome} é o agendamento da reunião de fechamento. Vamos garantir esse horário na agenda?`;
    }
    if (lead.acao === 'Agendado') {
      return `Agenda atualizada! O nosso compromisso com o ${lead_nome} está marcado para o dia ${data}. Para evitarmos o no-show, é importante lembrá-lo.`;
    }
    if (lead.acao === 'No Show') {
      return `Vamos tentar reagendar esse fechamento com o lead ${lead_nome}?`;
    }
  }

  // ── FOLLOW-UP ─────────────────────────────────────────────────────────────
  if (lead.status === 'Follow-up') {
    if (lead.acao === 'Agendar') {
      return `${consultor_nome}, o ${lead_nome} ainda está pensando, mas não podemos deixar esfriar. Vamos agendar uma nova reunião para tirar as dúvidas remanescentes?`;
    }
    if (lead.acao === 'Agendado') {
      return `O follow-up com o ${lead_nome} está marcado para o dia ${data}.`;
    }
    if (lead.acao === 'No Show') {
      return `Estou com dificuldades em contactar o lead ${lead_nome}. Consegue seguir com o follow-up por aí?`;
    }
  }

  // ── EM ANÁLISE ────────────────────────────────────────────────────────────
  if (lead.status === 'Em Análise') {
    if (lead.acao === 'Aguardando Documentação') {
      return `${consultor_nome}, o processo do ${lead_nome} está parado na análise. Consegue dar um check com ele sobre os documentos pendentes?`;
    }
    if (lead.acao === 'Documentação Enviada') {
      return `O lead ${lead_nome} já me enviou a documentação que a seguradora solicitou. Estou acompanhando.`;
    }
  }

  // ── GANHO ─────────────────────────────────────────────────────────────────
  if (lead.status === 'Ganho') {
    if (lead.acao === 'Criar Lead') {
      return `${consultor_nome}, o lead ${lead_nome} foi concluído. Consegue criar o registro no Salesforce e colocar na descrição que é para me enviar?`;
    }
    if (lead.acao === 'Concluído') {
      return `${consultor_nome}, tudo bem? Passando para te atualizar sobre o lead ${lead_nome}:\n\n✅ Documentos finais enviados ao cliente;\n✅ Registro atualizado no Salesforce;\n✅ Processo comercial concluído.\n\nBora pra cima!`;
    }
    if (lead.acao === 'Enviar Documentos') return snippets.documentosConsultor;
    return snippets.documentosConsultor;
  }

  // ── Fallback genérico ──────────────────────────────────────────────────────
  const cadence = getCadenceFlow(lead);
  let msg = `Fala ${consultor_nome}, tudo bem? Passando para cobrar o lead ${lead_nome}.\n\n📌 Status: ${lead.status}\n⚡ Ação: ${lead.acao || 'A definir'}`;
  if (lead.dataAcao) msg += `\n📅 Data Agendada: ${formatDate(lead.dataAcao)}`;
  msg += `\n\n💡 Sugestão: ${cadence.currentStep.msg}`;
  return msg;
};


export const getSnippets = (lead: Lead) => {
  const consultor = lead?.consultor ? lead.consultor.split(' ')[0] : 'Consultor';
  const cliente = (lead?.nome || 'o cliente').split(' ')[0];
  const nomeCompleto = lead?.nome || 'Cliente';

  return {
    // ── Mensagens de pipeline ────────────────────────────────────────────────
    formLead:           `Fala ${consultor}, tudo bem? Vi que temos uma nova oportunidade mapeada (${cliente}). Consegue me passar as infos iniciais pra gente dar start na esteira?`,
    cobrancaInfos:      `Fala ${consultor}! Precisamos alinhar os detalhes do lead ${cliente}. Vamos marcar 15 minutinhos para estruturarmos o planejamento do seguro e garantir que a estratégia atenda 100% às necessidades dele?`,
    cobrarPlanejamento: `Fala, ${consultor}! O estudo do ${cliente} já tá no gatilho aqui comigo. Já conseguiu alinhar com ele a data para a nossa call de apresentação?`,
    cobrarFechamento:   `${consultor}, o planejamento do ${cliente} ficou excelente! Quando conseguimos apresentar pra ele? Precisamos sanar as dúvidas finais e já partir para a formalização da proposta.`,
    followUpConsultor:  `${consultor}, passando pra fazer um follow-up sobre o ${cliente}. Como estamos de próximos passos? Ele retornou?`,
    pendenciaDocs:      `Olá ${cliente}, tudo bem? A seguradora solicitou um pequeno complemento na documentação para seguir com a análise. Pode me enviar [DOCUMENTO_AQUI] quando tiver um tempinho?`,
    confirmacaoReuniao: `Olá ${cliente}, tudo bem? Passando só pra confirmar nossa reunião. Recomendo que separe uns 45 minutinhos num ambiente tranquilo para passarmos pelos cenários. Até lá!`,
    noShowRemarcacao:   `Olá ${cliente}, tudo bem? Tentei te ligar para nossa call mas acho que rolou algum imprevisto. Como as condições que eu estruturei têm um prazo, qual o melhor horário pra gente reagendar?`,
    ganho: `${cliente}, tudo bem?\n\nA documentação final do seu planejamento foi concluída. Estou enviando o material por aqui para facilitar, mas também fico à disposição para revisar qualquer ponto e acompanhar futuras atualizações da sua proteção financeira.\n\nAgradeço pela confiança e desejo muito sucesso!`,

    // ── Mensagens ao CLIENTE com títulos claros ──────────────────────────────
    /** MSG 01 — Apresentação */
    msg_apresentacao: `Breno Schmidt, Portfel.\n${nomeCompleto}`,

    /** MSG 02 — Proposta Detalhada */
    msg01: `${cliente}, tudo bem?\n\nAcabei de te enviar a proposta detalhada que conversamos. Estou à disposição para sanar quaisquer dúvidas que você ainda tenha ou fazer os ajustes que você julgar necessário, combinado?`,

    /** MSG 03 — Acompanhamento 1 */
    msg02: `${cliente}, tudo bem?\n\nNotei que ainda não avançamos na nossa conversa e quero garantir que você tenha todas as informações para tomar a melhor decisão.\n\nPodemos marcar um horário para revisar juntos e ajustar o que for necessário ou, caso precise de mais tempo para pensar, é só me avisar para que eu saiba como seguir daqui em diante.\n\nO que me diz?`,

    /** MSG 04 — Acompanhamento 2 */
    msg03: `${cliente}, sei que essa decisão é importante e merece reflexão.\n\nSe precisar de mais alguma informação ou quiser conversar novamente para ter certeza de que está fazendo a melhor escolha, conte comigo!\n\nCaso prefira deixar para outro momento, está tudo certo também. Apenas me fale para que eu possa te acompanhar da melhor forma possível.\n\nComo gostaria de seguir?`,

    /** MSG 05 — Prioridade Atual */
    msg04: `${cliente}, tudo certo?\n\nComo você não me deu meu retorno, estou partindo do princípio que, por agora, o seguro não é prioridade pra você. E está tudo bem!\n\nVou dar baixa aqui no seu nome para não ficar te incomodando, mas espero que a gente se encontre numa próxima oportunidade.\n\nGrande abraço!`,

    /** MSG 06 — Encerrar Contato */
    msg05: `${cliente}, tudo certo? Imagino que você esteja focado em outras prioridades no momento.\n\nComo não tive nenhum retorno até aqui, devo entender o silêncio como um "não é minha prioridade por enquanto" e considerar nosso papo encerrado? Se for o caso, sem problemas. Eu tiro o seu nome aqui da minha lista de acompanhamento.\n\nSe for só correria, me chama aqui...`,

    /** MSG — Documentos finais (para o CLIENTE) */
    documentosCliente: `${cliente}, tudo bem?\n\nA documentação final do seu planejamento foi concluída. Estou enviando o material por aqui para facilitar, mas também fico à disposição para revisar qualquer ponto e acompanhar futuras atualizações da sua proteção financeira.\n\nAgradeço pela confiança e desejo muito sucesso!`,

    /** MSG — Documentos finais (para o CONSULTOR) */
    documentosConsultor: `${consultor}, tudo bem?\n\nPassando para te atualizar sobre o lead ${nomeCompleto}:\n\n✅ Documentos finais enviados ao cliente;\n✅ Registro atualizado no Salesforce;\n✅ Processo comercial concluído.\n\nBora pra cima!`,

    /** Boas-vindas (para CLIENTE ao Criar Lead) */
    boasVindas: `Olá ${cliente}! Seja muito bem-vindo ao ecossistema Portfel. É uma honra ter você conosco. Agora você conta com um acompanhamento contínuo para garantir que sua blindagem financeira esteja sempre atualizada. Conte comigo!`,

    /** Criar Lead (para CONSULTOR) */
    criarLeadConsultor: `Parabéns pelo fechamento do ${cliente}, ${consultor}! 🚀 Negócio concluído. Agora, vamos rodar o processo de indicações ou abrir um novo lead de revisão para mantermos a roda girando?`,
  };
};

export const getCadenceFlow = (lead: Lead) => {
  const days = getDaysInStage(lead);
  const snippets = getSnippets(lead);

  const isContatoCliente = ['Em Análise', 'Ganho', 'Perdido', 'Cancelou'].includes(lead.status);
  const targetType = isContatoCliente ? 'cliente' : 'consultor';

  const flows: Record<string, any[]> = {
    'Lead': [
      { day: 0, title: 'Formulário Inicial', action: 'Acionar Consultor', msg: snippets.formLead },
    ],
    'Planejamento': [
      { day: 0, title: 'Aguardando Reunião', action: 'Cobrar Agendamento', msg: snippets.cobrarPlanejamento },
    ],
    'Fechamento': [
      { day: 0, title: 'Pronto para Fechar', action: 'Cobrar Agendamento', msg: snippets.cobrarFechamento },
    ],
    'Follow-up': [
      { day: 0, title: 'Pós-Apresentação', action: 'Acionar Consultor', msg: snippets.followUpConsultor },
    ],
    'Em Análise': [
      { day: 0, title: 'Exigência', action: 'Solicitar Docs (Cliente)', msg: snippets.pendenciaDocs }
    ],
    'Ganho': [
      { day: 0, title: 'Conclusão', action: 'Enviar Documentos (Cliente)', msg: snippets.ganho }
    ]
  };

  const defaultFlow = [{ day: 0, title: 'Acompanhamento', action: 'Verificar Status', msg: `Verificar situação do lead.` }];
  const flow = flows[lead.status] || defaultFlow;

  let currentStepIndex = 0;
  for (let i = flow.length - 1; i >= 0; i--) {
    if (days >= flow[i].day) { currentStepIndex = i; break; }
  }

  const currentStep = { ...flow[currentStepIndex], target: targetType };
  const isDelayed = checkSLA(lead).isBreached;
  const isToday = days === currentStep.day;
  const actionRequired = (isToday || isDelayed) && !['Ganho', 'Perdido', 'Cancelou'].includes(lead.status);

  return { flow, currentStep, currentStepIndex, days, isDelayed, actionRequired };
};

export const exportLeadToSheet = (lead: Lead) => ({
  'Carimbo de data/hora': lead.criadoEm, 'Status CRM': lead.status, 'Consultor Financeiro Responsável': lead.consultor,
  'Salesforce URL': lead.salesforceUrl, 'Celular': lead.celular, 'E-mail': lead.email,
  'Nome do Cliente': lead.nome, 'Profissão exercida atualmente': lead.profissao, 'Data de nascimento': lead.nascimento,
  'Altura': lead.altura, 'Peso': lead.peso, 'Sexo': lead.sexo, 'Estado Civil': lead.estadoCivil,
  'Remuneração': lead.renda, 'Tipo de renda': lead.tipoRenda, 'Despesa Mensal': lead.despesas, 'Custos Educacionais': lead.educacaoFilhos,
  'Patrimônio Total (R$)': lead.patrimonio, 'Qual o montante em previdência privada?': lead.previdencia,
  'Quantos filhos?': lead.quantosFilhos, 'Pilar Financeiro': lead.pilarFinanceiro, 'Histórico de Saúde': lead.problemasSaude,
  'Na sua opinião, por que o cliente precisa de um seguro?': lead.necessidadeSeguro,
  'Receita Esperada': lead.receitaEsperada, 'Probabilidade (%)': lead.probabilidade,
  'Gostaria de adicionar alguma informação relevante?': lead.infosRelevantes, 'Motivo Perda': lead.motivoPerda,
  'Reunioes': JSON.stringify(lead.reunioes || []), 'Historico CRM': JSON.stringify(lead.historico || [])
});
