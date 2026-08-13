# compras-sob-pressão

Receitas vegetarianas/veganas adaptadas para a panela de pressão elétrica
Philco PPP01P, com um app pra montar a lista de compras da semana.

- [`receitas_ppp01p.md`](./receitas_ppp01p.md) — o caderno de receitas
  (58 receitas), fonte canônica e legível por humanos.
- [`web/`](./web) — o app (Vite + React + TypeScript), publicado no GitHub
  Pages: buscar receitas por nome/ingrediente, montar a semana, gerar lista
  de compras consolidada (somando ingredientes repetidos, em gramas quando
  possível), histórico e favoritos — tudo salvo localmente no navegador.

Site publicado: https://chuves.github.io/compras-sob-pressao/

Ver [`CLAUDE.md`](./CLAUDE.md) para detalhes de como o app é gerado a
partir do caderno de receitas.
