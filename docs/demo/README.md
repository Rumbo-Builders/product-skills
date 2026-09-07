# Demo publicada

O artefato que o README aponta sai daqui. Tudo neste diretório é **ficção**: o
time, o produto, as pessoas e todos os números foram inventados para a
demonstração.

**A página publicada não diz isso.** O rodapé saiu por decisão de layout, então
quem receber só o link não tem como saber que os números são inventados. Quem
compartilhar precisa dizer junto.

Ele mora no repositório porque demo que não se regenera apodrece. Para reconstruir:

```bash
node plugins/rumbo-core/scripts/configurar.mjs --casa engajamento --nome "Engajamento" \
  --acento "#1f4f7a" --destaque "#d98324" \
  --fonte-titulo "Fraunces" --fonte-corpo "Inter" \
  --favicon "📈"

node plugins/rumbo-core/skills/rumbo-one-page/scripts/render.mjs \
  --one-page docs/demo/one-page.json \
  --roadmap docs/demo/roadmap.json \
  --saida .rumbo/demo.html
```

E republique **na mesma URL** do artefato que já circula, senão o link do README
quebra. A URL publicada é:

    https://claude.ai/code/artifact/12451f2c-b2a7-40ba-8d4f-806944dbf3d0

**O artefato nasce privado.** Para o link do README funcionar para quem chega de fora,
ele precisa ser compartilhado uma vez, pelo menu da própria página. Enquanto isso não
for feito, quem clicar vê uma página que não pode abrir, e é pior do que não ter link.
