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
  if (date.includes('-')) {
    const [y, m, d] = date.split('-');
    if (y.length === 4) return `${d}/${m}/${y}`;
  }
  return date;
};

export const calcAge = (dateStr: string) => {
  if (!dateStr || String(dateStr).length < 10) return 0;
  const [d, m, y] = dateStr.split('/').map(Number);
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
  let dateStr = lead.dataUltimoStatus;

  if (!dateStr) {
    const lastLog = lead.historico?.find(log => log.includes('→'));
    dateStr = lastLog ? (lastLog.match(/em (\d{1,2}\/\d{1,2}\/\d{4})/) || [])[1] : lead.criadoEm;
  }

  if (!dateStr) return 0;

  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let targetDate: Date;
    if (String(dateStr).includes('T')) {
      targetDate = new Date(dateStr);
    } else {
      const parts = String(dateStr).split(' ')[0].split(/[\/\-]/);
      targetDate = parts[0].length === 4
        ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
        : new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    }
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = now.getTime() - targetDate.getTime();
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  } catch { return 0; }
};

export const checkSLA = (lead: Lead) => {
  const days = getDaysInStage(lead);
  const maxDays = STAGE_SLAS[lead.status];
  if (maxDays === undefined) return { isBreached: false, days, maxDays: 0 };
  return { isBreached: days > maxDays, days, maxDays };
};

export const checkFastTrack = (lead: Lead): string => {
  const isQualified = lead.nome && lead.celular && lead.profissao && (Number(lead.renda) || 0) > 0;
  if (isQualified && lead.status === 'Lead') return 'Planejamento';
  return lead.status;
};

export const getSnippets = (lead: Lead) => {
  const consultor = lead?.consultor ? lead.consultor.split(' ')[0] : 'Consultor';
  const cliente = (lead?.nome || 'o cliente').split(' ')[0];

  return {
    formLead: `Fala ${consultor}, tudo bem? Vi que temos uma nova oportunidade mapeada (${cliente}). Consegue me passar as infos iniciais pra gente dar start na esteira?`,
    cobrancaInfos: `${consultor}, beleza? Para eu desenhar um planejamento impecável para o ${cliente}, ainda faltam alguns dados. Consegue dar um toque nele hoje pra não esfriarmos o lead?`,
    cobrarPlanejamento: `Fala, ${consultor}! O estudo do ${cliente} já tá no gatilho aqui comigo. Já conseguiu alinhar com ele a data para a nossa call de apresentação?`,
    cobrarFechamento: `${consultor}, planejamento entregue! Qual o status do agendamento para o fechamento com o ${cliente}? Bora trazer esse contrato pra casa!`,
    followUpConsultor: `${consultor}, passando pra fazer um follow-up sobre o ${cliente}. Como estamos de próximos passos? Ele retornou?`,
    pendenciaDocs: `Olá ${cliente}, tudo bem? A seguradora solicitou um pequeno complemento na documentação para a emissão da sua apólice. Pode me enviar [DOCUMENTO_AQUI] quando tiver um tempinho?`,
    confirmacaoReuniao: `Olá ${cliente}, tudo bem? Passando só pra confirmar nossa reunião. Recomendo que separe uns 45 minutinhos num ambiente tranquilo para passarmos pelos cenários. Até lá!`,
    noShowRemarcacao: `Olá ${cliente}, tudo bem? Tentei te ligar para nossa call mas acho que rolou algum imprevisto. Como as condições que eu estruturei têm um prazo, qual o melhor horário pra gente reagendar?`,
    ganho: `${cliente}, tudo bem?\n\nSua apólice de seguro foi emitida com sucesso! Estou enviando o PDF aqui para facilitar, mas você também deve tê-la recebido por e-mail. Ressalto que estou à disposição para quaisquer dúvidas que possam surgir e quero que realmente conte comigo para o que precisar, incluindo o acompanhamento a cada 12-24 meses. Afinal, temos que garantir que suas coberturas permaneçam alinhadas às suas necessidades.\n\nAgradeço pela confiança e desejo muito sucesso!`,
    
    // Novas mensagens profissionais de Follow-up
    msg01: `${cliente}, tudo bem?\n\nAcabei de te enviar a proposta detalhada que conversamos. Estou à disposição para sanar quaisquer dúvidas que você ainda tenha ou fazer os ajustes que você julgar necessário, combinado?`,
    msg02: `${cliente}, tudo bem?\n\nNotei que ainda não avançamos na nossa conversa e quero garantir que você tenha todas as informações para tomar a melhor decisão.\n\nPodemos marcar um horário para revisar juntos e ajustar o que for necessário ou, caso precise de mais tempo para pensar, é só me avisar para que eu saiba como seguir daqui em diante.\n\nO que me diz?`,
    msg03: `${cliente}, sei que essa decisão é importante e merece reflexão.\n\nSe precisar de mais alguma informação ou quiser conversar novamente para ter certeza de que está fazendo a melhor escolha, conte comigo!\n\nCaso prefira deixar para outro momento, está tudo certo também. Apenas me fale para que eu possa te acompanhar da melhor forma possível.\n\nComo gostaria de seguir?`,
    msg04: `${cliente}, tudo certo?\n\nComo você não me deu meu retorno, estou partindo do princípio que, por agora, o seguro não é prioridade pra você. E está tudo bem!\n\nVou dar baixa aqui no seu nome para não ficar te incomodando, mas espero que a gente se encontre numa próxima oportunidade.\n\nGrande abraço!`,
    msg05: `${cliente}, tudo certo? Imagino que você esteja focado em outras prioridades no momento.\n\nComo não tive nenhum retorno até aqui, devo entender o silêncio como um "não é minha prioridade por enquanto" e considerar nosso papo encerrado? Se for o caso, sem problemas. Eu tiro o seu nome aqui da minha lista de acompanhamento.\n\nSe for só correria, me chama aqui...`
  };
};

export const getCadenceFlow = (lead: Lead) => {
  const days = getDaysInStage(lead);
  const snippets = getSnippets(lead);

  const isContatoCliente = ['Pendência', 'Ganho', 'Perdido', 'Cancelou'].includes(lead.status);
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
    'Pendência': [
      { day: 0, title: 'Exigência', action: 'Solicitar Docs (Cliente)', msg: snippets.pendenciaDocs }
    ],
    'Ganho': [
      { day: 0, title: 'Emissão', action: 'Enviar Apólice (Cliente)', msg: snippets.ganho }
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
  'Salesforce URL': lead.salesforceUrl, 'Celular': lead.celular, 'CPF': lead.cpf, 'E-mail': lead.email,
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