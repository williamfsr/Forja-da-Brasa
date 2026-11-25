"""Tabela curada: magia (nome em inglês, SRD 5.1) -> arquétipo de jogo. Classe, círculo, nome pt-BR e texto vêm do SRD/tradução.
Arquétipos (campo `tipo`; `util` = só fora de combate; `ex` = efeito de exploração no Grimório):
  buff  — condição positiva (ef: ca atq dano salv vantSalv res imuB imuCond desvContra contraTags imagens vel refl reflT ward tmpHp acoes smite quebra guia resis contra vantAtq tmp1)
  ctrl  — condição negativa em inimigos (atr=None → sem salvaguarda; so: racional/fera; tiers: [[pv, cond|'morre']]; empurra: casas)
  sono  — como Sono, mas com outra condição  ·  salva — dano com salvaguarda + condição opcional
  invoca — convoca aliado(s)  ·  tele — teletransporte do conjurador  ·  limpa — remove condições ruins  ·  revive — levanta aliado caído
  muro — barreira de casas bloqueadas  ·  dispel — dissipa magias  ·  banir — remove inimigo da luta  ·  dominar — converte inimigo  ·  desejo — Desejo
"""
G = {
    'self': {'f': 'self'}, 'toque': {'f': 'aliado', 'alc': 1}, 'aliado': {'f': 'aliado', 'alc': 6}, 'aliados': {'f': 'aliados', 'alc': 5, 'max': 4},
    'p1': {'f': 'ponto', 'alc': 1}, 'p6': {'f': 'ponto', 'alc': 6}, 'p8': {'f': 'ponto', 'alc': 8},
}
def C2(r, alc=6): return {'f': 'circulo', 'alc': alc, 'raio': r}
def LIN(n): return {'f': 'linha', 'len': n}
def MURO(n): return {'f': 'muro', 'len': n, 'alc': 6}
def B(buff, geo='self', **ef): return dict(tipo='buff', buff=buff, geo=G[geo], ef=ef)
def C(cond, atr, dur=3, geo=None, **k): return dict(tipo='ctrl', cond=cond, atr=atr, dur=dur, geo=geo or G['p6'], **k)
def I(mon, n=1, geo=None, **k): return dict(tipo='invoca', mon=mon, n=n, geo=geo or {'f': 'ponto', 'alc': 4}, **k)
def X(ex, v=None, **k): d = dict(tipo='util', util=1, ex=ex, geo=G['self']); (d.update(v=v) if v is not None else None); d.update(k); return d
def XB(ex, v=None, **k): d = dict(ex=ex); (d.update(v=v) if v is not None else None); d.update(k); return d   # fora de combate, mas também pode ser usada em combate (mescla)
def T(alc, los=True, **k): return dict(tipo='tele', geo={'f': 'livre', 'alc': alc, 'los': los}, **k)
REV = {'f': 'morto', 'alc': 1}
FL = lambda txt: X('flavor', txt=txt)

SPEC = {
 # ---------------- truques ----------------
 'Dancing Lights': X('luz', 1), 'Light': X('luz', 2), 'Mage Hand': FL('Uma mão espectral carrega pequenos objetos por você.'),
 'Mending': FL('Pequenos reparos: nada precisa de remendo agora.'), 'Message': FL('Você sussurra uma mensagem — ninguém por perto responde.'),
 'Minor Illusion': I('s_mage_hand', 1, hp=6, isca=1, dur=3, geo={'f': 'ponto', 'alc': 5}), 'Prestidigitation': FL('Pequenos truques: sua roupa fica limpa e o ar, perfumado.'),
 'Guidance': B('guia', 'toque', guia=1), 'Resistance': B('resis', 'toque', resis=1), 'Spare the Dying': dict(tipo='cura', dado='1d4', fixo=1, geo=G['toque']),
 'Thaumaturgy': X('social', 2), 'True Strike': B('previsao', 'self', vantAtq=1, uso1=1),
 # ---------------- 1º círculo ----------------
 'Alarm': X('alarme'), 'Bane': C('maldito', 'CAR', 4, C2(2)), 'Color Spray': dict(tipo='sono', dado='6d10', up='2d10', cond='cego', geo={'f': 'cone', 'len': 3}),
 'Comprehend Languages': X('social', 1), 'Create or Destroy Water': FL('Você enche um odre com água fresca.'),
 'Detect Evil and Good': X('revela_mon', 8), 'Detect Magic': X('revela_bau', 10), 'Detect Poison and Disease': X('revela_arm', 8),
 'Disguise Self': X('social', 2), 'Expeditious Retreat': B('retirada', 'self', vel=3, bonus=1), 'Feather Fall': FL('Você flutua como uma pena — sem quedas por aqui.'),
 'Find Familiar': I('s_owl', 1, hp=14, dur=None, geo={'f': 'ponto', 'alc': 3}), 'Floating Disk': FL('Um disco flutuante carrega suas coisas.'),
 'Fog Cloud': C('cego', None, 2, C2(2)), 'Grease': C('caido', 'DES', 1, C2(1)), 'Identify': X('identifica'), 'Illusory Script': FL('Um texto secreto some do pergaminho.'),
 'Jump': B('salto', 'toque', vel=2), 'Longstrider': B('passolongo', 'toque', vel=2),
 'Protection from Evil and Good': B('protmal', 'toque', contraTags=['morto', 'infero', 'elemental', 'aberracao', 'celestial', 'feerico'], imuCond=['amedrontado', 'dominado']),
 'Purify Food and Drink': FL('A comida e a bebida ficam limpas e seguras.'), 'Sanctuary': B('santuario', 'toque', desvContra=1),
 'Shield': B('escudo_arc', 'self', ca=5, tmp1=1, bonus=1), 'Silent Image': I('s_mage_hand', 1, hp=12, isca=1, dur=4, geo={'f': 'ponto', 'alc': 6}),
 'Unseen Servant': FL('Um servo invisível arruma o acampamento.'),
 # ---------------- 2º círculo ----------------
 'Alter Self': X('social', 2), 'Arcane Lock': FL('Você tranca a porta com um selo arcano.'), "Arcanist's Magic Aura": FL('Suas auras mágicas ficam disfarçadas.'),
 'Augury': X('dica'), 'Blur': B('borrao', 'self', desvContra=1), 'Branding Smite': B('marca_radiante', 'self', smite='2d6', smiteT='radiante', bonus=1),
 'Continual Flame': X('luz', 2), 'Darkness': C('cego', None, 2, C2(2)), 'Darkvision': X('luz', 1), 'Detect Thoughts': X('social', 2),
 'Enhance Ability': B('aprimorar', 'toque', salv=2, atq=1), 'Enlarge/Reduce': B('aumentar', 'toque', dano=2, atq=1),
 'Enthrall': C('pacificado', 'SAB', 2, C2(3)), 'Find Steed': I('s_warhorse', 1, dur=None, geo={'f': 'ponto', 'alc': 3}), 'Find Traps': X('revela_arm', 12),
 'Gentle Repose': FL('O corpo ficará intacto por muito tempo.'), 'Gust of Wind': C('caido', 'FOR', 1, LIN(6), empurra=2),
 'Invisibility': B('invisivel', 'toque', desvContra=1, vantAtq=1, quebra=1), 'Knock': X('knock'), 'Lesser Restoration': dict(tipo='limpa', geo=G['toque']),
 'Levitate': FL('Você flutua um palmo acima do chão.'), 'Locate Object': X('revela_bau', 14), 'Magic Mouth': FL('Uma boca mágica guarda sua mensagem.'),
 'Magic Weapon': B('arma_magica', 'toque', atq=1, dano=1), 'Mirror Image': B('imagens', 'self', imagens=3), 'Misty Step': T(6, True, bonus=1),
 'Protection from Poison': B('antiveneno', 'toque', res=['veneno'], imuCond=['envenenado']), 'Ray of Enfeeblement': C('enfraquecido', 'CON', 3),
 'Rope Trick': X('descanso', 0.5), 'See Invisibility': X('revela_mon', 8), 'Silence': C('silenciado', None, 3, C2(2)), 'Spider Climb': FL('Você anda pelas paredes por um instante.'),
 'Suggestion': C('pacificado', 'SAB', 4, so='racional'), 'Warding Bond': B('vinculo', 'toque', ca=1, salv=1, res=['fis']), 'Zone of Truth': X('social', 2),
 # ---------------- 3º círculo ----------------
 'Animate Dead': I('s_skeleton', 1, dur=None, geo={'f': 'ponto', 'alc': 4}, mais=1), 'Beacon of Hope': B('farol', 'aliados', salv=2, vantSalv=1),
 'Bestow Curse': C('maldito', 'SAB', 5, G['p1']), 'Blink': B('piscar', 'self', desvContra=1), 'Clairvoyance': X('revela_mon', 16),
 'Counterspell': B('contra', 'self', contra=1, bonus=1), 'Create Food and Water': X('banquete', 1), 'Daylight': X('luz', 4),
 'Dispel Magic': dict(tipo='dispel', geo={'f': 'circulo', 'alc': 6, 'raio': 2}), 'Fly': B('voo', 'toque', vel=3), 'Gaseous Form': B('gasoso', 'toque', res=['fis'], vel=1),
 'Glyph of Warding': FL('Um glifo protege o local.'), 'Magic Circle': B('circulo_magico', 'toque', contraTags=['morto', 'infero', 'elemental', 'aberracao', 'celestial', 'feerico']),
 'Major Image': I('s_mage_hand', 1, hp=30, isca=1, dur=5, geo={'f': 'ponto', 'alc': 7}), 'Meld into Stone': X('descanso', 0.5), 'Nondetection': FL('Você some de adivinhações.'),
 'Phantom Steed': B('corcel', 'self', vel=4), 'Protection from Energy': B('protenergia', 'toque', res=['fogo', 'gelo', 'elétrico']),
 'Remove Curse': dict(tipo='limpa', geo=G['toque'], maldicao=1), 'Revivify': dict(tipo='revive', geo=REV, hp=1), 'Sending': FL('Sua mensagem curta chega a quem você pensou.'),
 'Sleet Storm': C('caido', 'DES', 1, C2(3, 8)), 'Speak with Dead': X('dica'), 'Stinking Cloud': C('perde', 'CON', 1, C2(2, 8)), 'Tiny Hut': X('descanso', 0.5), 'Tongues': X('social', 3),
 'Water Breathing': FL('Você respira debaixo d\'água.'), 'Water Walk': FL('Você caminha sobre a água.'),
 # ---------------- 4º círculo ----------------
 'Arcane Eye': X('revela_mon', 20), 'Confusion': C('confuso', 'SAB', 3, C2(3, 8)), 'Conjure Minor Elementals': I('s_steam_mephit', 2, dur=None, geo={'f': 'ponto', 'alc': 5}),
 'Control Water': FL('As águas obedecem ao seu comando.'), 'Death Ward': B('protecao_morte', 'toque', ward=1), 'Dimension Door': T(10, False),
 'Divination': X('dica'), 'Dominate Beast': dict(tipo='dominar', atr='SAB', so='fera', geo=G['p6']), 'Fabricate': FL('Você fabrica objetos a partir de matéria-prima.'),
 'Faithful Hound': I('s_mastiff', 1, hp=40, dur=None, geo={'f': 'ponto', 'alc': 3}), 'Fire Shield': B('escudo_fogo', 'self', refl='2d8', reflT='fogo', res=['gelo']),
 'Freedom of Movement': B('liberdade', 'toque', imuCond=['contido', 'lento', 'paralisado', 'caido']), 'Greater Invisibility': B('invisivel_maior', 'toque', desvContra=1, vantAtq=1),
 'Guardian of Faith': I('s_animated_armor', 1, hp=60, dur=None, geo={'f': 'ponto', 'alc': 4}), 'Hallucinatory Terrain': FL('O terreno parece outra coisa.'),
 'Locate Creature': X('revela_mon', 14), 'Polymorph': B('forma', 'toque', tmpHp=40, atq=2, dano=4), 'Private Sanctum': FL('O local fica protegido de olhares.'),
 'Resilient Sphere': C('banido', 'DES', 3), 'Secret Chest': FL('Seu baú secreto repousa em outro plano.'), 'Stone Shape': FL('A pedra se molda como argila.'),
 'Stoneskin': B('pele_pedra', 'toque', res=['fis']),
 # ---------------- 5º círculo ----------------
 'Animate Objects': I('s_flying_sword', 3, hp=17, dur=None, geo={'f': 'ponto', 'alc': 5}, mais=2), 'Arcane Hand': I('s_arcane_hand', 1, hp=60, dur=None, geo={'f': 'ponto', 'alc': 5}),
 'Commune': X('dica'), 'Contact Other Plane': X('dica'), 'Contagion': C('enfraquecido', 'CON', 4, G['p1']), 'Creation': FL('Um objeto de matéria sombria surge diante de você.'),
 'Dispel Evil and Good': dict(tipo='dispel', geo={'f': 'circulo', 'alc': 6, 'raio': 2}, banirTags=['morto', 'infero', 'elemental', 'celestial', 'feerico']), 'Dream': FL('Sua mensagem encontra quem dorme.'), 'Geas': C('pacificado', 'SAB', 6, so='racional'),
 'Greater Restoration': dict(tipo='limpa', geo=G['toque'], ex='restaura', tudo=1), 'Hallow': FL('O local é consagrado e protegido.'),
 'Insect Plague': dict(tipo='salva', atr='CON', dado='4d10', up='1d10', dano='fis', metade=True, geo=C2(2, 8)), 'Legend Lore': X('dica'),
 'Mislead': I('s_mage_hand', 1, hp=30, isca=1, dur=5, geo={'f': 'ponto', 'alc': 7}), 'Modify Memory': C('pacificado', 'SAB', 5, so='racional'), 'Passwall': FL('A parede abre uma passagem.'),
 'Planar Binding': C('pacificado', 'CAR', 6), 'Raise Dead': dict(tipo='revive', geo=REV, hpF=0.5), 'Scrying': X('revela_mon', 30), 'Seeming': X('social', 3),
 'Telekinesis': C('caido', 'FOR', 2, G['p8'], empurra=3), 'Telepathic Bond': X('social', 2), 'Teleportation Circle': X('viajar'),
 'Wall of Force': dict(tipo='muro', geo=MURO(6), dur=6, mur='forca'), 'Wall of Stone': dict(tipo='muro', geo=MURO(6), dur=None, mur='pedra'), 'Conjure Elemental': I('s_fire_elemental', 1, dur=None, geo={'f': 'ponto', 'alc': 5}),
 # ---------------- 6º círculo ----------------
 'Conjure Fey': I('s_dryad', 1, dur=None, geo={'f': 'ponto', 'alc': 5}), 'Contingency': X('pronto_ward', 0.3), 'Create Undead': I('s_ghoul', 3, dur=None, geo={'f': 'ponto', 'alc': 5}),
 'Eyebite': C('amedrontado', 'SAB', 3), 'Find the Path': X('revela_tudo'), 'Flesh to Stone': C('paralisado', 'CON', 3), 'Forbiddance': FL('O local fica protegido contra viagens e intrusos.'),
 'Globe of Invulnerability': B('globo', 'self', imuB=['fogo', 'gelo', 'elétrico', 'ácido', 'trovão', 'necrótico', 'radiante', 'força', 'psíquico', 'arcano', 'energia']),
 'Guards and Wards': FL('A fortaleza fica protegida por muitos selos.'), "Heroes' Feast": X('banquete', 2), 'Instant Summons': FL('Seu objeto reaparece em sua mão.'),
 'Irresistible Dance': C('perde', 'SAB', 2), 'Magic Jar': FL('Sua alma repousa num receptáculo.'), 'Mass Suggestion': C('pacificado', 'SAB', 5, C2(3), so='racional'),
 'Move Earth': FL('A terra se move conforme sua vontade.'), 'Planar Ally': I('s_couatl', 1, dur=None, geo={'f': 'ponto', 'alc': 5}), 'Programmed Illusion': FL('Uma ilusão aguarda o gatilho.'),
 'True Seeing': dict(ex=['revela_arm', 'revela_mon', 'revela_bau'], v=12, tipo='util', util=1, geo=G['self']), 'Word of Recall': X('viajar'),
 # ---------------- 7º círculo ----------------
 'Arcane Sword': I('s_arcane_sword', 1, hp=40, dur=None, geo={'f': 'ponto', 'alc': 5}, dano='3d10'), 'Conjure Celestial': I('s_couatl', 1, dur=None, geo={'f': 'ponto', 'alc': 5}),
 'Delayed Blast Fireball': dict(tipo='salva', atr='DES', dado='12d6', up='1d6', dano='fogo', metade=True, geo=C2(4, 10)),
 'Divine Word': C(None, 'CAR', 3, C2(4, 6), tiers=[[20, 'morre'], [30, 'atordoado'], [40, 'cego'], [50, 'amedrontado']]),
 'Etherealness': B('etereo', 'self', res=['fis'], desvContra=1, vel=2), 'Forcecage': C('paralisado', None, 5), 'Magnificent Mansion': X('descanso', 1.0), 'Mirage Arcane': FL('A paisagem inteira ilude os sentidos.'),
 'Plane Shift': dict(tipo='banir', atr='CAR', geo=G['p1'], ex='viajar'), 'Project Image': I('s_mage_hand', 1, hp=40, isca=1, dur=None, geo={'f': 'ponto', 'alc': 8}),
 'Resurrection': dict(tipo='revive', geo=REV, hpF=1), 'Reverse Gravity': dict(tipo='salva', atr='DES', dado='4d6', dano='fis', cond='caido', condDur=1, geo=C2(4, 10)),
 'Sequester': FL('O alvo fica escondido de todo olhar.'), 'Simulacrum': I('s_veteran', 1, hp=70, clone=1, dur=None, geo={'f': 'ponto', 'alc': 3}), 'Symbol': FL('Um símbolo protege o local.'), 'Teleport': X('viajar'),
 # ---------------- 8º círculo ----------------
 'Antimagic Field': B('antimagia', 'self', imuB=['fogo', 'gelo', 'elétrico', 'ácido', 'trovão', 'necrótico', 'radiante', 'força', 'psíquico', 'arcano', 'energia'], imuCond=['amedrontado', 'dominado', 'confuso', 'paralisado']),
 'Antipathy/Sympathy': C('amedrontado', 'SAB', 5, C2(4, 8)), 'Clone': X('pronto_ward', 0.5), 'Control Weather': FL('O clima obedece à sua vontade.'), 'Demiplane': X('descanso', 1.0),
 'Dominate Monster': dict(tipo='dominar', atr='SAB', geo=G['p6']), 'Glibness': X('social', 5), 'Holy Aura': B('aura_sagrada', 'aliados', desvContra=1, vantSalv=1),
 'Maze': C('banido', 'INT', 5), 'Mind Blank': B('mente_vazia', 'toque', imuB=['psíquico'], imuCond=['amedrontado', 'pacificado', 'dominado', 'confuso', 'perde']),
 # ---------------- 9º círculo ----------------
 'Astral Projection': X('viajar'), 'Foresight': B('prescienca', 'toque', vantAtq=1, vantSalv=1, desvContra=1), 'Gate': dict(tipo='invoca', mon='s_deva', n=1, dur=None, geo={'f': 'ponto', 'alc': 5}, ex='viajar'),
 'Imprisonment': dict(tipo='banir', atr='SAB', geo=G['p6'], tiers=None), 'Prismatic Wall': dict(tipo='muro', geo=MURO(8), dur=None, mur='prisma'), 'Shapechange': B('forma_verdadeira', 'self', tmpHp=60, atq=4, dano=6, res=['fis']),
 'Time Stop': B('tempo_parado', 'self', acoes=3, tmp1=1), 'True Polymorph': B('forma_perfeita', 'toque', tmpHp=80, atq=4, dano=8, res=['fis']), 'True Resurrection': dict(tipo='revive', geo=REV, hpF=1),
 'Wish': dict(tipo='desejo', geo=G['self'], ex='desejo'),
}
