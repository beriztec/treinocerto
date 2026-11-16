/*
 * ═══════════════════════════════════════════════════════════════════
 *  CONFIGURAÇÃO DA OFERTA — edite só este arquivo
 * ═══════════════════════════════════════════════════════════════════
 */
window.TC_CONFIG = {
  /* Link do checkout (Hotmart, Kiwify, Eduzz…). Vazio = os botões rolam até a oferta.
     As UTMs do anúncio (utm_*, fbclid, gclid) são repassadas automaticamente. */
  checkoutUrl: 'https://pay.kiwify.com.br/2rOArau',

  price: {
    /* Preço "de" — precisa ter sido praticado de verdade (Código de Defesa do Consumidor). */
    from: 'R$ 249,90',
    /* Preço com o cupom. */
    now: 'R$ 29,90',
    /* Linha abaixo do preço (deixe vazio para esconder). */
    note: 'pagamento único · acesso imediato',
  },

  coupon: {
    code: 'CERTO29',
    /* Nome do parâmetro do cupom na URL do checkout (Hotmart: "offDiscount", Kiwify: "coupon", Eduzz: "cupom"). */
    urlParam: 'coupon', // Kiwify

    /* Mostrar o pop-up do cupom após X segundos na página (também aparece ao tentar sair, no computador). */
    popupAfterSeconds: 12,
  },

  timer: {
    /* Duração da oferta para cada visitante, contada a partir da primeira visita (fica salva no navegador). */
    hours: 3,
    /* Data/hora limite fixa para TODOS (ex.: '2026-12-01T23:59:00-03:00'). Se preenchida, substitui o modo de 3 horas. */
    deadline: '',
    /* Ao zerar o relógio, o desconto acaba de verdade: a página passa a mostrar o preço cheio abaixo. */
    priceAfterExpire: 'R$ 249,90',
  },

  guaranteeDays: 7,

  /* VSL: cole a URL do vídeo (YouTube, Vimeo ou arquivo .mp4 na pasta assets/).
     Vazio = mostra a VSL animada com a personagem do Treino Certo. */
  videoUrl: '',

  legal: {
    company: 'Treino Certo',
    document: '', // CNPJ/CPF
    responsible: '', // Responsável técnico — Nome, CREF
    email: '',
  },
};
