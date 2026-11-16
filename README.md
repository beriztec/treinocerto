# Treino Certo — Landing page de vendas (VSL)

Página de vendas para onde o anúncio leva o clique. **Só HTML, CSS e JavaScript**, sem build e sem dependências:
abra `index.html` com duplo clique para ver no navegador (Chrome ou Edge).

## Estrutura

```
treino-certo-vsl/
├─ index.html            a página (textos de venda)
├─ css/style.css         visual (cores da marca, celular primeiro)
├─ js/config.js          ← PREÇO, CUPOM, RELÓGIO, CHECKOUT, VÍDEO: edite aqui
├─ js/depoimentos.js     ← DEPOIMENTOS REAIS (carrossel): edite aqui
├─ js/app.js             relógio, pop-up do cupom, VSL animada, prévia do app, animação do glúteo, UTMs
├─ js/pose-player.js     motor do tutorial animado (o mesmo da plataforma)
├─ js/demos.js           dados das animações (gerado a partir da plataforma)
├─ assets/               logo e fontes (Inter e Montserrat, licença SIL OFL)
└─ tools/gerar-demos.mjs (opcional) atualiza js/demos.js a partir do projeto treino-certo
```

## O que editar antes de anunciar (`js/config.js`)

| Campo | O que é |
|---|---|
| `checkoutUrl` | Link do checkout. Vazio = os botões só rolam até a oferta. As UTMs do anúncio vão junto automaticamente. |
| `price.from` / `price.now` | "De R$ 249,90 por R$ 29,90". O preço "de" precisa ter sido praticado de verdade (CDC). |
| `coupon.code` / `coupon.urlParam` | Código do cupom do pop-up e o nome do parâmetro na sua plataforma (Hotmart `offDiscount`, Kiwify `coupon`…). O cupom precisa existir lá também. |
| `coupon.popupAfterSeconds` | Quando o pop-up aparece (também aparece se a pessoa for fechar a aba, no computador). Uma vez por visita. |
| `timer.hours` | Relógio de 3 horas por visitante, contado da primeira visita. **Ao zerar, o desconto acaba de verdade** e a página mostra `priceAfterExpire`. |
| `timer.deadline` | Alternativa: data/hora limite igual para todos (ex.: fim do lançamento). |
| `videoUrl` | VSL gravada (YouTube, Vimeo ou `.mp4` em `assets/`). Vazio = VSL animada com a personagem. |
| `legal` | CNPJ/CPF, responsável técnico (CREF), e-mail. |

## Depoimentos (carrossel)

Cole os depoimentos **reais e autorizados** em `js/depoimentos.js` (o formato está explicado no próprio arquivo).
Aceita texto, nome, detalhe (idade/cidade) e, se quiser, o print do WhatsApp/Instagram em `assets/depoimentos/`.
Enquanto a lista estiver vazia, a seção não aparece. Funciona com quantos depoimentos você tiver (20 ou mais).

## Publicar

Qualquer hospedagem de site estático serve: **GitHub Pages**, Netlify, Vercel, Cloudflare Pages, Hostinger.
No GitHub: crie um repositório, envie esta pasta e ative *Settings → Pages → Deploy from branch → main / (root)*.

```bash
git add .
git commit -m "Landing page VSL do Treino Certo"
git remote add origin https://github.com/SEU-USUARIO/treino-certo-vsl.git
git push -u origin main
```

## Boas práticas já aplicadas
- Celular primeiro: a VSL aparece inteira na primeira tela; barra de compra fixa após o vídeo.
- Relógio real (sem "reiniciar sozinho"), sem depoimentos inventados e sem promessa de resultado garantido.
  O prazo de "menos de 1 mês" fala do que é realista nesse período (ativação, força, firmeza), o que reduz o risco de reprovação no Meta Ads.
- Acessibilidade: contraste AA, foco visível, pop-up com Esc e foco preso, respeito a "reduzir movimento".
