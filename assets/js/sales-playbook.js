/* TAJO TAP Sales Playbook V1
 * Conteúdo comercial interno. Sem dados sensíveis e sem dependências externas.
 */
window.TAJO_TAP_SALES_PLAYBOOK = Object.freeze({
  version: '1.0',
  promise: 'Transformar pontos físicos de atendimento em atalhos simples para avaliações, WhatsApp, cardápios, redes sociais e outros destinos digitais, sem reimprimir a plaquinha quando o link mudar.',
  guardrails: [
    'Use apenas prova social verdadeira. Nunca invente clientes, números, avaliações ou resultados.',
    'Não use urgência ou escassez falsa. Crie urgência pela dor real e pelo custo de continuar perdendo oportunidades.',
    'Fale de benefício antes de tecnologia. QR e NFC são o meio; conveniência, avaliações e conversão são o resultado percebido.',
    'Peça microcompromissos simples: analisar, demonstrar, testar e só depois propor fechamento.',
    'Se o cliente não tiver perfil, necessidade ou momento, não force a venda. Registre e retome no tempo certo.'
  ],
  prospecting: [
    {
      id: 'lead-ideal',
      title: 'Cliente ideal para TAJO TAP',
      text: 'Priorize negócios com atendimento presencial, balcão, recepção, mesa, caixa ou pós-venda. Exemplos: restaurantes, mercados, hortifrutis, barbearias, salões, clínicas, óticas, oficinas, lojas, academias, pousadas e prestadores locais. Quanto mais o negócio depender de Google, WhatsApp, cardápio, Instagram ou avaliações, maior a aderência.'
    },
    {
      id: 'score',
      title: 'Pontuação rápida do lead',
      text: 'Dê 1 ponto para cada sinal: recebe clientes presencialmente; usa WhatsApp; possui Google Business; pede avaliações manualmente; tem cardápio/link importante; Instagram ativo; equipe pergunta “qual é o link?”; QR impresso apontando direto para um link; endereço físico visível. Leads com 5+ pontos merecem abordagem prioritária.'
    },
    {
      id: 'onde',
      title: 'Onde encontrar leads',
      text: 'Google Maps: pesquise categorias locais e veja avaliações, fotos e links. Instagram: procure empresas da cidade/região e observe bio, destaques e CTA. Rua: liste estabelecimentos com fluxo físico. Clientes atuais: peça indicação de dois negócios próximos. Fornecedores e parceiros: busque empresas que atendem a mesma base sem competir diretamente.'
    },
    {
      id: 'auditoria-5',
      title: 'Auditoria de 5 minutos antes de chamar',
      text: '1) Abra Google e Instagram. 2) Identifique o principal destino que faria sentido: avaliações, WhatsApp, cardápio, catálogo ou localização. 3) Veja se já existe QR e para onde ele leva. 4) Anote uma oportunidade concreta. 5) Personalize a primeira frase com algo real observado. Evite mensagens genéricas em massa.'
    }
  ],
  principles: [
    {
      title: 'Fluência cognitiva',
      application: 'Explique em uma frase simples: “A pessoa encosta o celular ou escaneia e vai direto para onde você quiser.” Quanto menor o esforço mental para entender, maior a chance de avanço.'
    },
    {
      title: 'Redução de fricção',
      application: 'Mostre o antes e depois. Antes: procurar perfil, digitar número, pedir link. Depois: aproximar ou escanear. O produto deve parecer uma retirada de passos, não uma tecnologia a mais.'
    },
    {
      title: 'Aversão à perda — uso ético',
      application: 'Fale do que pode estar sendo perdido hoje sem exagerar: “Todo cliente satisfeito que vai embora sem avaliar é uma oportunidade que talvez não volte.” Não invente percentuais ou prejuízos.'
    },
    {
      title: 'Prova concreta',
      application: 'Demonstre uma plaquinha real, uma ativação real ou um QR de teste. Uma experiência de 15 segundos reduz mais incerteza do que um texto longo.'
    },
    {
      title: 'Ancoragem de valor',
      application: 'Compare o valor com a utilidade contínua: uma peça física que permanece e cujo destino pode ser alterado pelo painel. Evite ancorar com preços falsos ou descontos inventados.'
    },
    {
      title: 'Microcompromisso',
      application: 'Em vez de pedir compra logo no início, pergunte: “Posso te mostrar em 20 segundos como ficaria para o seu negócio?” Um pequeno sim facilita a próxima decisão.'
    }
  ],
  scripts: [
    {
      id: 'whatsapp-first',
      category: 'abordagem',
      title: 'WhatsApp — primeira abordagem',
      context: 'Lead local ou indicado, após uma análise rápida do negócio.',
      text: 'Olá, [NOME]! Tudo bem? Sou João, da TAJO Digital. Dei uma olhada rápida na presença digital da [EMPRESA] e vi uma oportunidade simples de facilitar o caminho dos clientes até [AVALIAÇÕES/WHATSAPP/CARDÁPIO]. A gente criou a TAJO TAP: uma plaquinha com QR + aproximação NFC que abre exatamente o destino que vocês escolherem, e esse destino pode ser alterado depois sem trocar a peça. Posso te mostrar em 20 segundos como isso ficaria aí no negócio?'
    },
    {
      id: 'instagram-first',
      category: 'abordagem',
      title: 'Instagram DM — curta e natural',
      context: 'Primeiro contato pelo Instagram.',
      text: 'Oi, pessoal da [EMPRESA]! Vi o perfil de vocês e tive uma ideia bem prática para o atendimento presencial: transformar um ponto do balcão/recepção em um atalho para [DESTINO]. É uma plaquinha QR + NFC que o cliente só escaneia ou aproxima o celular. Posso mandar uma demonstração rápida?'
    },
    {
      id: 'audio',
      category: 'abordagem',
      title: 'Áudio de 25–35 segundos',
      context: 'Quando o contato parece receptivo a áudio.',
      text: 'Fala, [NOME], tudo bem? Dei uma olhada aqui na [EMPRESA] e pensei numa aplicação bem simples. A TAJO TAP é uma plaquinha que fica no balcão, mesa ou recepção; a pessoa aproxima o celular ou lê o QR e vai direto para o link que vocês definirem — pode ser Google, WhatsApp, cardápio ou Instagram. O legal é que a peça continua a mesma e o destino pode ser atualizado depois. Se quiser, eu te mostro um exemplo aplicado ao seu negócio e você vê se faz sentido.'
    },
    {
      id: 'in-person',
      category: 'abordagem',
      title: 'Abordagem presencial',
      context: 'Visita rápida sem interromper a operação.',
      text: 'Oi, tudo bem? Eu trabalho com soluções digitais aqui na região. Não quero tomar seu tempo; vi que vocês atendem bastante gente presencialmente e queria te mostrar uma solução em 20 segundos. Essa plaquinha permite que o cliente encoste o celular ou escaneie e vá direto para avaliações, WhatsApp, cardápio ou outro link. Se você achar útil, depois eu explico com calma. Posso te mostrar?'
    },
    {
      id: 'demo-transition',
      category: 'demonstração',
      title: 'Transição para demonstração',
      context: 'Depois que o lead aceita ver.',
      text: 'Pensa no ponto onde hoje vocês mais pedem alguma ação do cliente: “avalia a gente”, “chama no WhatsApp”, “abre o cardápio”, “segue o Instagram”. A ideia é reduzir isso a um toque. Aqui, por exemplo, eu configurei para [DESTINO]. Encosta ou escaneia para você ver.'
    },
    {
      id: 'proposal-transition',
      category: 'fechamento',
      title: 'Do interesse para a proposta',
      context: 'O lead entendeu e demonstrou interesse.',
      text: 'Pelo que você me falou, eu montaria a sua para [LOCAL DE USO] levando direto para [DESTINO]. Assim vocês não dependem de explicar o caminho toda vez. Se fizer sentido, eu te passo agora o formato, o que vem incluso e o investimento para deixar funcionando.'
    },
    {
      id: 'close-direct',
      category: 'fechamento',
      title: 'Fechamento sem pressão',
      context: 'Depois de apresentar valor e preço.',
      text: 'Faz sentido para a rotina de vocês? Se sim, eu já posso separar a configuração da [EMPRESA], gerar a unidade e preparar a arte/ativação. Se ainda tiver alguma dúvida antes de decidir, me fala qual ponto você quer entender melhor.'
    },
    {
      id: 'followup-1',
      category: 'followup',
      title: 'Follow-up 1 — 24/48h',
      context: 'Após proposta ou demonstração sem resposta.',
      text: 'Oi, [NOME]! Passando só para saber se você conseguiu olhar a ideia da TAJO TAP para a [EMPRESA]. Pensei especialmente no uso em [LOCAL] levando para [DESTINO], porque é onde vejo mais ganho de praticidade. Ficou alguma dúvida que eu possa esclarecer?'
    },
    {
      id: 'followup-2',
      category: 'followup',
      title: 'Follow-up 2 — encerramento elegante',
      context: 'Última tentativa sem insistência.',
      text: 'Oi, [NOME]! Vou encerrar por aqui para não ficar insistindo. Se em algum momento vocês quiserem facilitar [AVALIAÇÕES/WHATSAPP/CARDÁPIO] no atendimento presencial, pode me chamar que eu retomo a proposta da TAJO TAP. Obrigado pela atenção!'
    },
    {
      id: 'referral',
      category: 'indicação',
      title: 'Pedido de indicação',
      context: 'Cliente satisfeito ou contato próximo.',
      text: 'Que bom que ficou legal! Posso te pedir uma ajuda? Você conhece um ou dois negócios que atendem bastante gente presencialmente e que poderiam usar algo assim para avaliações, WhatsApp ou cardápio? Se você me indicar, eu faço a abordagem de forma tranquila e digo que cheguei por você.'
    }
  ],
  objections: [
    {
      id: 'already-qr',
      objection: '“Eu já tenho QR Code.”',
      answer: 'Perfeito — então você já sabe que o cliente entende o gesto de escanear. A diferença da TAJO TAP é que o QR da peça fica permanente e o destino pode ser alterado depois pelo sistema, além da opção NFC por aproximação. O ponto é evitar ter que refazer material toda vez que o link mudar.'
    },
    {
      id: 'expensive',
      objection: '“Achei caro.”',
      answer: 'Entendo. Antes de falar só do valor da peça, eu gosto de olhar o uso: ela fica no atendimento todos os dias e pode levar para diferentes destinos sem precisar ser reimpressa. Se isso não resolver uma rotina real aí, não vale comprar. Mas se hoje vocês perdem tempo explicando link, pedindo avaliação ou direcionando cliente, aí ela passa a ser uma ferramenta de operação e marketing.'
    },
    {
      id: 'no-need',
      objection: '“Não vejo necessidade.”',
      answer: 'Sem problema. Posso só entender uma coisa? Hoje, quando vocês querem que um cliente avalie, chame no WhatsApp ou abra o cardápio, como fazem? Se o processo atual já é simples e funciona bem, talvez realmente não seja prioridade. Se tiver atrito, eu te mostro como reduzir esses passos.'
    },
    {
      id: 'think',
      objection: '“Vou pensar.”',
      answer: 'Claro. Para eu não ficar te cobrando sem necessidade: o que você quer avaliar melhor — utilidade, valor, onde usar ou como funciona? Se eu souber o ponto, te mando só a informação que falta e você decide com calma.'
    },
    {
      id: 'send-price',
      objection: '“Só me manda o preço.”',
      answer: 'Mando sim. Só quero te passar a opção certa: você imagina usar principalmente para avaliações, WhatsApp, cardápio ou outro destino? É uma pergunta rápida para eu não te mandar uma proposta genérica.'
    },
    {
      id: 'later',
      objection: '“Agora não, quem sabe mais para frente.”',
      answer: 'Tranquilo. Tem algum período que faça mais sentido para eu te procurar de novo? Assim eu respeito seu momento e não fico insistindo fora de hora.'
    },
    {
      id: 'nfc-fear',
      objection: '“Meu cliente não sabe usar NFC.”',
      answer: 'Por isso a peça usa os dois caminhos. Quem conhece NFC aproxima; quem não conhece escaneia o QR normalmente. A experiência não depende de uma única tecnologia.'
    },
    {
      id: 'monthly',
      objection: '“Tem mensalidade?”',
      answer: 'Explique exatamente o modelo comercial vigente da TAJO, sem improvisar. Se houver plano vitalício, mensal ou serviço opcional, apresente com clareza o que está incluso e o que não está. Nunca esconda cobrança recorrente.'
    },
    {
      id: 'security',
      objection: '“E se alguém trocar meu link?”',
      answer: 'A ativação inicial é protegida e concluída uma única vez. Depois, alterações exigem acesso autenticado ao painel do cliente ou atuação administrativa autorizada da TAJO. O QR físico não dá permissão para editar o destino.'
    }
  ],
  routine: [
    'Separar 15 leads qualificados por dia e pontuar aderência.',
    'Fazer 5 abordagens altamente personalizadas antes de enviar mensagens em volume.',
    'Buscar pelo menos 2 demonstrações por dia, presenciais ou por vídeo curto.',
    'Registrar status: novo, contatado, respondeu, demonstração, proposta, follow-up, ganho ou perdido.',
    'Revisar no fim do dia: respostas / abordagens, demonstrações / respostas, propostas / demonstrações e vendas / propostas.',
    'Melhorar primeiro a etapa com menor conversão, em vez de simplesmente aumentar o volume.'
  ]
});
