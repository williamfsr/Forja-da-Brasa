# 🔥 Forja da Brasa

Aventura 8-bit de D&D (SRD 5.1) em que **o que você faz na vida real é o que fortalece o personagem**:
treino de força, aeróbico, estudo e alimentação viram XP, ouro, tochas, espaços de magia e recursos de classe.
Vila fixa com lojas, mapa-múndi, **masmorras procedurais** e uma campanha do **nível 1 ao 20** com decisões e consequências.

Funciona 100% offline, sem conta, sem servidor. O progresso fica no seu aparelho (com exportar/importar).

## Como publicar no GitHub Pages (2 minutos)

1. Crie um repositório (ex.: `forja-da-brasa`) e envie **todos** estes arquivos para a branch `main`.
2. No GitHub: **Settings → Pages → Build and deployment → Source: _GitHub Actions_**.
3. Aguarde o workflow **"Publicar no GitHub Pages"** (aba *Actions*). O endereço será
   `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

Alternativa sem Actions: Source = *Deploy from a branch* → `main` / `(root)`; antes, rode `node tools/build.mjs`
para gerar o `sw.js` (o repositório já vem com um `sw.js` gerado).

## Como instalar no celular / PC

- **Android (Chrome):** abra o endereço → menu ⋮ → *Instalar app* / *Adicionar à tela inicial*.
- **iPhone (Safari):** abra o endereço → Compartilhar → *Adicionar à Tela de Início*.
- **PC (Chrome/Edge):** ícone de instalar na barra de endereço.

Depois da primeira abertura o jogo roda sem internet.

## Como se joga

- **Mover:** setas/WASD ou direcional na tela · **A/Enter/Z:** interagir · **B/Esc/X:** voltar · **M/Tab:** menu.
- Na **vila** ficam os prédios: Arena (treino), Trilha (aeróbico), Biblioteca (estudo), Taverna (comida),
  Forja/Alquimista/Mercador (lojas), Templo, Casa (ficha, equipamentos, configurações) e o **Portal** (campanha e Catacumbas Sem Fim).
- **Placas** na praça: missões do dia e Livro da Aventura.
- Cada **andar de masmorra custa 1 Tocha**. Tochas vêm do que você faz na vida real. Sem tocha, sem aventura.

### Vida real → jogo

| Na vida real | No jogo |
|---|---|
| Supino, terra, agachamento, barra/puxada, remada, desenvolvimento lateral | Únicos que pontuam de verdade. XP por **PR (1RM estimado)**, patentes por carga ÷ peso corporal, atributos de FOR/CON/DES |
| Outros exercícios | Podem ser registrados, mas não pontuam |
| Aeróbico (14 atividades) | XP **por minuto × multiplicador da atividade e intensidade**, com retorno decrescente após 60/120 min |
| Estudo (faculdade, residência, concurso) | XP por minuto/questões, Pomodoro; alimenta INT/SAB e desbloqueia magia e capítulos |
| Alimentação (kcal) | Faixa de ±10% da meta = **banquete**. Comer de menos ou demais gera **exaustão** (SRD) ou perde espaços de magia / recursos de classe no dia seguinte |
| Constância | Sequência (streak) multiplica XP; faltar cria a **Maré da Inércia**; cumprir missões sobe a **Moral** |
| Missões e eventos do dia | Evento aleatório (bênção ou desafio), missões obrigatórias, escolhas com consequências |

> Os dados de treino e alimentação são sugestões de jogo, **não** orientação médica ou nutricional. Respeite seus limites e dias de descanso.

## Estrutura

```
index.html · manifest.webmanifest · sw.js · css/ · js/ · icons/
js/srd.js        regras SRD (classes, magias, monstros, exaustão)
js/rules.js      mapeamento vida real → personagem
js/combat.js     motor de combate (d20, slots, condições)
js/dungeon.js    gerador procedural de masmorras
js/world.js      vila fixa e mapa-múndi
js/game.js       loop, movimento, exploração, batalhas
js/ui*.js, paineis*.js   painéis (arena, trilha, biblioteca, taverna…)
js/story.js      campanha nível 1–20, finais e consequências
tools/           simulações de balanceamento e build do service worker
```

Testes de lógica/balanceamento: `node tools/sim.mjs testes` e `node tools/sim.mjs balanco`.

## Créditos e licenças

- Regras: **System Reference Document 5.1**, © Wizards of the Coast LLC, licença **CC-BY-4.0**.
  *This work includes material taken from the System Reference Document 5.1 by Wizards of the Coast LLC, licensed under CC-BY-4.0.*
- Terminologia em português: tradução comunitária [dnd5e-pt-br](https://github.com/decito/dnd5e-pt-br) (decito, java3040, MagelaCE).
- Código: MIT. História, personagens e arte pixel: originais. Detalhes em `LICENSE`.
- Projeto de fã, sem afiliação com a Wizards of the Coast.
