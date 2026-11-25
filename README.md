# 🔥 Forja da Brasa

Aventura 2D em **32 bits** de D&D (SRD 5.1) em que **o que você faz na vida real é o que fortalece o personagem**:
treino de força, aeróbico, estudo e alimentação viram XP, ouro, tochas, espaços de magia e recursos de classe.
Vila fixa com lojas, mapa-múndi, **masmorras procedurais** e uma campanha do **nível 1 ao 20** com decisões e consequências.
Combate **tático por turnos no próprio mapa**, herói **totalmente personalizável** e NPCs e inimigos com personalidade.

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

### Personalização do herói

- Na criação (e depois em **Casa → Aparência**): **9 raças do SRD** (humano, elfo, meio-elfo, anão, halfling, gnomo, meio-orc, draconato, tiefling), cada uma com bônus de atributo e traços que valem no jogo
  (visão no escuro nas masmorras, resistências, Sopro do Draconato com a cor da linhagem, Resistência Implacável etc.).
- Corpo, altura (7 níveis), formato do rosto, olhos, sobrancelhas, nariz, boca, marcas, **24 cabelos, 12 barbas, 8 roupas, 10 acessórios, capas**, chifres do tiefling.
- **Armaduras próprias por classe** (leve/média/pesada/vestes, 3 estilos, ornamento que cresce com nível e armadura equipada) e cores livres (paleta + seletor de cor).
- Mais de 10^18 combinações de estilo × cores livres. Botões **Sortear** e **Padrão**.

### Combate tático (estilo D&D)

- Iniciativa, **movimento por casas** (8 direções), ataques de oportunidade, flanco, linha de visão, alcance de armas e magias.
- **Dano em área** com pré-visualização: bola de fogo, cones, linhas, correntes e fogo amigo. Toque no inimigo (ou no **centro da área**) para mirar; o painel mostra quem será atingido e o botão **✦ Lançar** confirma. Tocar fora do alcance não cancela a magia.
- Companheiros convertidos lutam ao seu lado. Arraste o mapa para olhar ao redor; ⌖ recentraliza.
- **Magias do SRD 5.1 — todas as 283 das listas de classe** (20 truques + círculos 1–9), com efeito mecânico no combate:
  dano e salvaguarda, **controle** (Imobilizar, Teia, Lentidão, Sono, Palavra de Poder, Aprisionamento…), **buffs** de verdade (CA, vantagem, resistências, PV temporários, Imagem Espelhada, Escudo de Fogo, Proteção contra a Morte, Aceleração, Voo…), **invocações** (Conjurar Animais/Elementais/Celestiais, Espírito Guardião, Arma Espiritual — entram na iniciativa e lutam por você), **muros** (Fogo, Gelo, Espinhos), **teletransporte** (Passo Nebuloso, Porta Dimensional), **dissipar/banir**, **ressurreição** de aliados caídos na mesma batalha, **Desejo** e a rede de magias sociais.
- **Concentração** como no SRD: uma por vez; ao tomar dano há teste de CON (CD 10 ou metade do dano). Condições novas: maldito, enfraquecido, confuso, silenciado, banido.
- **Grimório** (menu da vila): lista todas as magias da sua classe por círculo, mostra os espaços do dia e deixa conjurar fora de combate — **Alarme, Detectar Magia, Luz, Augúrio, Banquete de Heróis…** dão efeito de exploração ou ficam **prontas** (Armadura Arcana, Turvar, Proteção…) e entram em ação no começo da próxima batalha. No combate, o menu de magias tem filtro por círculo.
- **Magias não dão XP**: o XP vem só de treino, estudo, aeróbico e alimentação. O custo é um espaço de magia, que volta conforme a alimentação do dia.
- **Maestrias de arma (SRD 5.2.1):** Guerreiro, Bárbaro, Ladino e Paladino usam a maestria da arma equipada — **Fender, Esfolar, Entalhar, Empurrar, Minar, Desacelerar, Derrubar e Afligir**. A maestria aparece na descrição de cada arma.

### Inimigos e NPCs com personalidade

- Cada inimigo tem temperamento e uma **frase de abertura**. Os **racionais** abrem diálogo: **Persuadir, Intimidar, Subornar** ou magias (**Enfeitiçar Pessoa, Acalmar Emoções, Medo, Dominar**).
  Feras podem ser **domadas**. Quem é convencido se rende, foge ou passa a lutar com você (e pode virar companheiro).
- Os NPCs da vila têm raça, aparência e voz próprias, falam do seu dia na vida real e criam **afinidade** (+1 por dia de conversa) com recompensas.

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

## v7 — Menu de papiro, diário pessoal, ficha em slots, barra de ações e lojas

- **Menu de pausa em papiro** (botão MENU / tecla M), com marcadores laterais: **🗺️ Mapa** (mapa do Vale com as missões e **minimapa** no jogo mostrando as rastreadas; principais ★ e secundárias ◆), **📜 Missões** (andamento, feitas, a descobrir, com etapas, recompensas e *Rastrear*), **👥 Pessoas** (descrição, história que se desbloqueia com a afinidade, o que você já viveu com cada um e **no que ele vem se tornando**), **📖 Glossário** (monstros, itens, lugares e lore **já encontrados**), **🛡️ Herói**, **📚 Crônica** e **⚙️ Sistema**.
- **Diário pessoal** (marcador *Diário* no menu): caderno de couro com marcadores **Hoje, Treino, Aeróbico, Estudo, Taverna (dieta) e Hábitos**. Ao trocar de marcador ou virar a página (arrastar, ← →) a página **vira com animação**; respeita "reduzir movimento". Treino/dieta/hábitos saíram do menu de missões.
- **Zoom do mapa:** roda do mouse, pinça no celular/tablet, ou as teclas **+ − 0**.
- **Ficha do herói em slots quadrados** com ícone: toque num slot para ver ícone grande + descrição + botões (equipar, usar, voltar); **visão frontal do herói** no meio dos slots de equipamento e na aba de habilidades (classe e magias também em slots).
- **Barra de ações do combate (estilo BG3)**, `js/hotbar.js`: ataques, habilidades de classe, ações padrão (correr, desengajar, esquivar, fugir, falar), **magias por círculo (com espaços restantes)** e consumíveis são **coletados e ordenados automaticamente** a cada turno — nada para configurar. Abas (Tudo / Ações / Habilidades / Magias / Itens) e chips de círculo filtram; marcadores mostram o custo (● ação, ▲ ação bônus, ◆ livre); slots sem recurso ficam apagados com o motivo. **PC:** dock embaixo, dica ao passar o mouse, clique usa, teclas **1–9** acionam os primeiros slots e **F** encerra o turno. **Celular/tablet:** toque seleciona e mostra o cartão (com escolha do círculo da magia), segundo toque (ou *Usar*) executa; no celular deitado vira painel lateral.
- **Lojas** (Forja, Alquimia, Empório), `js/loja.js`: itens em **slots à esquerda**; **comerciante de frente à direita** com o **nível de afinidade de negociação** acima dele (ligado à afinidade com o NPC: melhora o preço que ele cobra e o que ele paga); a descrição traz **Comprar / Voltar**. O herói **só vende a comerciantes**, que **pagam menos do que cobram**, só compram os tipos do seu ramo e têm um **caixa diário** limitado (renova todo dia; suas compras devolvem metade ao caixa).
- O módulo *bg3-hud-dnd5e* (Foundry) enviado serviu **apenas de inspiração** de interface; nenhum código dele foi usado ou executado.

## v6 — Luz, clima, tela cheia, hábitos e dados

- **Tela cheia + controles sobrepostos:** o jogo ocupa a tela inteira; D-pad, **A**, **B** e **MENU** ficam translúcidos por cima. Com o celular **na horizontal**, o D-pad vai para o lado esquerdo e **A/B para o direito**. A câmera considera o que está coberto, então o herói e os alvos ficam sempre na parte livre.
- **Desktop:** sem botões. **WASD** move, **clique esquerdo = A** (interagir/atacar, inclusive **selecionar** o alvo no ataque), **clique direito = B** (voltar/menu). **M** abre o menu.
- **Combate:** **ordem de iniciativa no topo** (retrato frontal de cada um, destaque de quem joga) e **vida, CA, ações, movimento, condições e recursos do herói embaixo**, bem grandes.
- **Dados animados:** toda rolagem mostra os dados girando. Em combate é uma animação **pequena no canto direito**; fora do combate (conversas, testes de perícia, armadilhas) é **grande no centro**, como na abertura de baú. A legenda mostra d20 + modificador, a CD e o resultado; o diálogo espera o dado parar.
- **Hábitos (menu → 🌱 Hábitos):** **aderir** a hábitos de um catálogo (Corpo, Mente, Alma, Rotina) ou **criar o seu**, marcar o que fez no dia (XP uma vez por dia, com **sequência 🔥**) e **retirar** os que não servem mais. Hábitos rendem até **120 XP por dia** (acima disso continuam contando como atividade).
- **Luz e sombras dinâmicas:** sol e lua seguem o **relógio do aparelho**. A direção e o comprimento das sombras mudam ao longo do dia (longas no amanhecer e no entardecer, curtas ao meio-dia, fracas à noite com a lua) e valem para **árvores e objetos, construções, NPCs, monstros e o herói**. Cada fase tem seu **tom e nível de contraste**: amanhecer rosado, manhã dourada, meio-dia de contraste alto, tarde, entardecer laranja, anoitecer roxo e noite azul.
- **Sombras de qualquer fonte de luz:** braseiros, portas acesas, a **lanterna do herói**, **lareiras e fogões** dos interiores e as **tochas das masmorras** também projetam sombra, sempre **apontando para longe da luz**, mais fracas e compridas conforme a distância. Quando você anda, as sombras ao redor giram junto. Paredes e móveis dos interiores e as paredes das masmorras sombreiam o chão ao lado delas.
- **Clima ligado à Inércia:** Inércia baixa = céu aberto e dourado; subindo vêm **nuvens, garoa, chuva, tempestade (com raios e trovões) e neblina**, com sombras de nuvem no chão e a luz esfriando. Com Inércia alta a luz fica **grave e tenebrosa** (cresce a partir da 4 e chega ao máximo na 10): tom roxo doentio, escuridão pesada em que só a lanterna do herói (que encolhe) ilumina, vinheta que respira, **sombras que balançam e se esticam**, cinzas caindo, neblina de fundo, raios mais frequentes e clarões violeta distantes mesmo sem tempestade. Nas masmorras a luz também encolhe e o escuro aperta. O tempo é sorteado por dia e bloco de 3 horas e muda suave quando a Inércia muda. Não chove dentro de casas nem de masmorras.
- **Céu do Vale (menu → Livro):** mostra a fase do dia, o tempo atual, o contraste e as sombras, e deixa **pré-visualizar** outra hora, o **⏩ dia acelerado** (24 h em cerca de 1 minuto, para ver as sombras girarem) ou outro clima, só naquela sessão (não altera o jogo).

## Estrutura

```
index.html · manifest.webmanifest · sw.js · css/ · js/ · icons/
js/srd.js          regras SRD (classes, magias, monstros, exaustão)
js/romance.js · festa.js · minigames.js · safira.js · paineis4.js   v5: afinidade/romance/inimizade, festa do 0/10, minigames, Safira, painel Relações
js/rules.js        mapeamento vida real → personagem, raças, escala de dificuldade
js/tatico.js       motor de combate tático (iniciativa, mapa, áreas, IA, persuasão e magias sociais), sem DOM
js/batalha.js      controle de batalha na tela (toque, menus, animações) · js/hotbar.js  barra de ações automática (estilo BG3)
js/pausa.js · js/diario.js · js/loja.js · js/ficha.js · js/zoom.js · js/minimapa.js · js/mapaq.js   v7: menu de papiro, diário pessoal, lojas, ficha em slots, zoom, minimapa
js/render.js       renderização 32 bits (tiles de 32 px, luz, partículas, câmera, zoom inteiro)
js/pessoa.js       gerador procedural de pessoas, retratos e armaduras · js/cosmeticos.js  dados de aparência
js/monstros.js · objetos.js · arte.js · gfx.js   arte procedural (monstros, objetos, terrenos)
js/personalidade.js  temperamentos, frases e perfis de NPCs · js/encontros.js  grupos de inimigos
js/criador.js      editor de aparência
js/dungeon.js      gerador procedural de masmorras · js/world.js  fachada dos mapas
js/locais.js       biblioteca de construção de mapas (vista de cima), 23 interiores e registro de mapas · js/mundo.js  Forjaluz, vilas, Cidadela e o Vale de 104×80 casas
js/luz.js · clima.js · relogio.js   v6: sol/lua, sombras projetadas, contraste por hora, luzes da noite · clima pela Inércia (chuva, raios, neblina)
js/dados.js · habitos.js   v6: dados animados em toda rolagem · aba Hábitos
js/vida.js         mundo vivo/morto (cor, árvores secas, cinzas, vagalumes) conforme a sua rotina
js/conversa.js · js/historia2.js  cena de diálogo, árvores de conversa, falas de missão, visitas do Rei, sonhos, dádivas e Teo
js/interacoes.js · js/paineis3.js  móveis/placas interativos · viagem rápida e Mapa do Vale
js/game.js         loop, exploração, NPCs, masmorras e integração das batalhas
js/ui*.js, paineis*.js   painéis (arena, trilha, biblioteca, taverna…)
js/story.js        campanha nível 1–20, finais e consequências
js/campanha.js     missões (principais/secundárias), Diário de Nhor, Baralho do Hábito, relíquias e aliados · js/efeitos.js  animações JB2A em sprite
js/maestrias.js    maestrias de arma (SRD 5.2.1) · js/bf.js  efeitos de buff/condição · js/grimorio.js  painel do Grimório
js/dados/          itens, monstros e magias importados (gerados por tools/dados; magias_srd2.js = 203 magias com efeitos descritos em tools/dados/magias_spec.py)
assets/            tokens (heróis, 340 criaturas), animações (fx), ícones de dano/condição (ic) e 48 ícones de item (ic/items)
tools/             simulações (simtat, simsrd, simouro, simcampanha, simmagias, simmagias2, simmagias3, simmaestrias), importadores (tools/dados), geradores de arte (tools/arte) e build do service worker
```

Testes de balanceamento do combate: `node tools/simtat.mjs`. Para regenerar o `sw.js` depois de mudar arquivos: `node tools/build.mjs`.

## Mapa-múndi, interiores e viagem

- Tudo em **vista de cima** (tiles de 32 px, sombras ao pé, telhados e fachadas). Tokens **sem moldura**: só o personagem.
- **O Vale da Inércia** (104×80 casas): biomas com neblina que se dissipa conforme os capítulos, estradas, lagos, montanhas, aldeias, a **Cidadela do Trono Imóvel**, a Fortaleza Dracoprata, o Moinho dos Doces Sonhos, o Vinhedo do Brinde Eterno, o Templo Âmbar, o Brejo de Berez e as entradas de cada capítulo.
  Mais **7 entradas de catacumbas aleatórias** espalhadas pelo mapa e baús diários. Toda masmorra devolve você ao ponto de onde saiu.
- **Interiores interativos:** camas (descansar e *sonhar* com o Diário), espelho (aparência), baús, estantes, mesas, altares, placas e móveis com texto próprio. Aperte A em frente ao objeto.
- **Teletransporte:** Marco das Viagens na praça e botões no menu levam para **sua casa**, a **vila** e qualquer lugar já visitado. **Mapa do Vale** no menu mostra neblina, capítulos, catacumbas e os pins das missões.
- **Mundo vivo/morto:** quanto mais você treina, estuda, come bem e mantém a sequência, mais cor, folhas e vagalumes; parado, a Inércia sobe: tudo cinza, árvores secas, cinzas no ar. A mudança chega em **onda** a partir de onde você está.

## Diálogos e o Rei da Inércia

- **Cena de diálogo estilo RPG de turno clássico:** você à esquerda, o interlocutor à direita (sem moldura), caixa de texto e lista de opções com cursor ▶ (setas/WASD + Enter, ou toque). Só opções de fala.
- **Sua personalização importa:** raça, marcas, acessórios, altura, classe e capa geram falas próprias em *Falar de mim…*, mudam como cada NPC reage e rendem **afinidade** (recompensas aos 3, 6 e 10 pontos).
- Cada NPC tem tópicos (rumores do mapa, o passado do Rei, relações entre eles) e **falas de missão** que mudam entre ativa e concluída. NPCs com missão ativa ganham um **!** dourado.
- **Visitas do Rei:** de tempos em tempos Nhor-Kaal aparece para conversar (6 encontros, de acordo com o seu nível) — recusar, perguntar ou ceder mexe com moral e Inércia. Os **sonhos** ao dormir em casa revelam as páginas do Diário. O **Templo Âmbar** oferece dádivas sem esforço; recusar três vezes abre o altar escondido. **Teo** só levanta se você se mexeu hoje.
- A estrutura espelha, de forma original, a de um gótico-vampírico clássico: um mal que **conversa e observa**, vilas que negam o medo (Marcha-Lenta e sua festa), uma leitora de cartas (Ordália e o Baralho), caçadores de monstros (Rictus, Calíope), uma fortaleza de cavaleiros amaldiçoados (Hornfel), um templo de dádivas, e o confronto no trono. Tudo gira em torno de **Nhor-Kaal** como o original gira em torno de seu vilão.

## v5 — Maré, Festa, Relações e Safira

- **A Maré da Inércia começa em 9/10** e o mundo nasce devastado (cinzento, morto). A **primeira atividade do dia** (série, aeróbico, estudo ou hábito) baixa 1 ponto; dia perfeito e Tríplice Coroa baixam mais 1; dia sem atividade sobe 1. Quanto menor, mais cor e vida volta ao Vale e à vila. Jogos já salvos mantêm a Maré atual; novos jogos e novos ciclos começam em 9.
- **Chegou em 0/10 → Festa da Brasa (24 h).** Mestra Brasa vem até você, parabeniza e avisa que o esforço não pode parar: o Rei da Inércia ainda está de pé e, sem as atividades, tudo volta a piorar. A praça ganha bandeirolas, lanternas e confete; os 12 moradores vão para lá. Em cada um você pode **curtir a festa** (+1 afinidade) e jogar **minigames opcionais** (queda de braço, tiro ao alvo, receita da Tavi, quiz da Eruvim, dança) que rendem afinidade extra e ouro. Falou com todos → **Capa do Herói** (equipada automaticamente). Depois das 24 h tudo volta ao normal; a festa acontece uma vez por ciclo.
- **Relações (menu → 💞 Relações):** barras de afinidade (−10 a 12), romance (0–15) e inimizade (0–10). Com **afinidade 5** surge *Romance…* para quem combina com o seu **interesse romântico** (padrão: sexo oposto ao do herói; dá para mudar no painel). Flertar (teste de Carisma, 1 por dia), presentear e treinar juntos enchem a barra. **Romance 10 → namoro. Romance 15 → casamento** (Aliança de Brasa +8 PV, cônjuge mora na casa e dá bom-dia).
- **Consequências:** dar em cima de outra pessoa pede confirmação — sem par, o romance e parte da afinidade da primeira se perdem; **com par, o namoro/casamento termina, a afinidade fica negativa e nasce uma barra de inimizade**. Opções grosseiras (zombar, ameaçar, furtar) reduzem afinidade; em **−5** começa uma inimizade (o NPC passa a evitar, só aceita pedido de desculpas ou provocação). O Rei da Inércia fica sabendo: comenta o seu par e **se oferece para "calar" inimigos** (eles são levados pela Névoa, com custo em moral e Maré).
- **Safira** (cabelo e túnica roxos): só aparece na vila **às quintas-feiras**; não é romanceável nem gera inimizade antes do Rei cair. Quatro conversas (uma por quinta, sem afinidade) contam a sua história; ao fim você compra um **Sino da Aurora** (zera a Maré *efetiva* por 1 dia — caro: cerca de 30 dias de ouro do seu nível; o Maior dura 3 dias e custa ~70). Ela então critica você por não lidar sozinho com a Inércia e fica **sem nada a oferecer até o Rei da Inércia cair**. Depois da vitória há um diálogo especial de parabéns, ela passa a ser **romanceável** e vende **cura e vida máxima** (Elixir do Alvorecer, Bênção de Cura, Tônico da Vitalidade, Medalhão de Safira).
- A antiga leitora de cartas agora se chama **Dona Ordália** (a Safira é outra personagem); saves antigos são migrados sozinhos.

## Campanha, Diário e fim de jogo

- **22 missões** (10 principais + 12 secundárias) que pedem esforço real: séries, aeróbico, estudo, refeições na meta, dias perfeitos, PRs, além de masmorras. Veja tudo no menu **Diário**.
- **Baralho do Hábito:** depois da missão de Dona Ordália, a leitura (muda a cada ciclo) revela em que capítulos estão a **Lâmina Solar**, o **Símbolo do Alvorecer**, o **Diário de Nhor** e um **aliado**. Cada relíquia enfraquece o Rei da Inércia no capítulo 20.
- **20 páginas do Diário de Nhor-Kaal** contam a tragédia do vilão (e por que a constância é a fraqueza dele).
- **XP só vem da vida real:** treino, aeróbico, estudo e alimentação (mais missões diárias/hábitos). Combate, chefes e masmorras dão ouro, itens e história, **não XP**.
- Ao zerar a campanha você escolhe: **Laço do Tempo** (recomeça com monstros +12%) ou **Explorador de Catacumbas** (andares infinitos com todo o bestiário, até ND 30).
- Itens: os **623 itens do SRD 5.1** (armas, armaduras, poções, itens mágicos) com preços por raridade, para o ouro não quebrar a progressão.
- Combate com **animações** para cada ataque e magia (as 283 magias são classificadas por elemento e forma: projétil→explosão, cone, linha, corrente, muro, cura, escudos e condições) e tokens de herói e de **340 criaturas** do SRD. Cada item tem **ícone por categoria** (espada, machado, poção, anel, armadura…).

## Créditos e licenças

- Regras: **System Reference Document 5.1** e, para as maestrias de arma, **SRD 5.2.1**, © Wizards of the Coast LLC, licença **CC-BY-4.0**.
  *This work includes material taken from the System Reference Document 5.1 and 5.2.1 by Wizards of the Coast LLC, licensed under CC-BY-4.0.*
- Terminologia em português: tradução comunitária [dnd5e-pt-br](https://github.com/decito/dnd5e-pt-br) (decito, java3040, MagelaCE).
- Código: MIT. História, personagens e arte pixel: originais. Detalhes em `LICENSE`.
- Ícones de dano/itens/condições: **game-icons.net** e **The Noun Project**, licença **CC BY 3.0**, copiados do sistema dnd5e para Foundry VTT (MIT). Lista de autores em `assets/ic/CREDITOS.txt`.
- Animações de combate (`assets/fx`): **JB2A — Jules & Ben's Animations** (versão gratuita), **CC BY-NC-SA 4.0** — https://www.jb2a.com. Uso **não comercial**; mantenha esta atribuição e a mesma licença para esses arquivos.
- Tokens de heróis e monstros e **ícones de item por categoria**: **gerados proceduralmente por este projeto** (`tools/arte`). Os tokens da Forgotten Adventures/Caeora que acompanham o sistema dnd5e **não foram incluídos**: a licença deles restringe o uso ao Foundry VTT.
- A campanha é uma **adaptação livre e original** inspirada na estrutura de um gótico-vampírico clássico; nenhum nome, texto ou mapa de obra protegida foi copiado.
- Projeto de fã, sem afiliação com a Wizards of the Coast.
