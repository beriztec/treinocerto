/*
 * ═══════════════════════════════════════════════════════════════════
 *  DEPOIMENTOS — somente depoimentos REAIS e AUTORIZADOS
 * ═══════════════════════════════════════════════════════════════════
 * Enquanto a lista estiver vazia, a seção de depoimentos NÃO aparece na página.
 * Depoimento inventado é propaganda enganosa (CDC art. 37 / CONAR) e motivo de reprovação no Meta Ads.
 *
 * Cada item:
 *   nome:     como a aluna autorizou aparecer (ex.: 'Juliana M.')
 *   detalhe:  opcional (ex.: '29 anos · Belo Horizonte' ou 'Treina há 2 meses')
 *   texto:    o depoimento, com as palavras dela
 *   foto:     opcional — print do WhatsApp/Instagram ou foto, salvo em assets/depoimentos/
 *   estrelas: opcional (1 a 5) — só se ela mesma deu a nota
 *
 * Exemplo (apague as barras // para ativar):
 *
 * window.TC_DEPOIMENTOS = [
 *   {
 *     nome: 'Juliana M.',
 *     detalhe: '29 anos · Belo Horizonte',
 *     texto: 'Pela primeira vez senti o glúteo trabalhar no leg press. O passo a passo das máquinas mudou meu treino.',
 *     foto: 'assets/depoimentos/juliana.jpg',
 *     estrelas: 5,
 *   },
 * ];
 */
window.TC_DEPOIMENTOS = [];
