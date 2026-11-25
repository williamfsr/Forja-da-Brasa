// Maestrias de arma — SRD 5.2.1 (CC-BY-4.0, https://www.dndbeyond.com/srd). Nomes em pt-BR conforme o módulo dnd5e-pt-br.
// Guerreiro, Bárbaro, Ladino e Paladino ganham a maestria da arma equipada; as demais classes não.
export const CLASSES_MAESTRIA = ['guerreiro', 'barbaro', 'ladino', 'paladino'];
export const MAESTRIAS = {
  cleave: { nome: 'Fender', desc: 'Ao acertar um ataque corpo a corpo, faz um ataque extra contra outra criatura adjacente ao alvo (sem modificador de atributo no dano). 1×/turno.' },
  graze: { nome: 'Esfolar', desc: 'Se errar o ataque, o alvo ainda sofre dano igual ao seu modificador de atributo.' },
  nick: { nome: 'Entalhar', desc: 'Faz o ataque extra da propriedade Leve junto da ação Atacar (sem modificador no dano). 1×/turno.' },
  push: { nome: 'Empurrar', desc: 'Ao acertar, empurra o alvo até 10 pés (2 casas) para longe, se for Grande ou menor.' },
  sap: { nome: 'Minar', desc: 'Ao acertar, o alvo faz o próximo ataque com desvantagem, até o início do seu próximo turno.' },
  slow: { nome: 'Desacelerar', desc: 'Ao acertar e causar dano, reduz o deslocamento do alvo em 10 pés até o início do seu próximo turno.' },
  topple: { nome: 'Derrubar', desc: 'Ao acertar, o alvo faz um teste de CON (CD 8 + seu modificador + proficiência) ou fica caído.' },
  vex: { nome: 'Afligir', desc: 'Ao acertar e causar dano, você tem vantagem no próximo ataque contra o alvo, até o fim do seu próximo turno.' },
};
// tabela "Weapons" do SRD 5.2.1 (nome em inglês → maestria)
const POR_NOME = {
  'club': 'slow', 'dagger': 'nick', 'greatclub': 'push', 'handaxe': 'vex', 'javelin': 'slow', 'light hammer': 'nick', 'mace': 'sap', 'quarterstaff': 'topple', 'sickle': 'nick', 'spear': 'sap',
  'dart': 'vex', 'light crossbow': 'slow', 'shortbow': 'vex', 'sling': 'slow', 'battleaxe': 'topple', 'flail': 'sap', 'glaive': 'graze', 'greataxe': 'cleave', 'greatsword': 'graze', 'halberd': 'cleave',
  'lance': 'topple', 'longsword': 'sap', 'maul': 'topple', 'morningstar': 'sap', 'pike': 'push', 'rapier': 'vex', 'scimitar': 'nick', 'shortsword': 'vex', 'trident': 'topple', 'warhammer': 'push',
  'war pick': 'sap', 'whip': 'slow', 'blowgun': 'vex', 'hand crossbow': 'vex', 'heavy crossbow': 'push', 'longbow': 'slow', 'musket': 'slow', 'pistol': 'vex',
};
const NOMES = Object.keys(POR_NOME).sort((a, b) => b.length - a.length);
// itens-base do jogo (ids próprios) → arma equivalente do SRD
const POR_ID = { cajado: 'topple', adaga: 'nick', maca: 'sap', cimitarra: 'nick', espadaCurta: 'vex', machadinha: 'vex', rapieira: 'vex', machadoBatalha: 'topple', martelo: 'push', espadaLonga: 'sap', arcoCurto: 'vex', arcoLongo: 'slow',
  espadaGrande: 'graze', machadoGrande: 'cleave', lamina_brasa: 'sap', lamina_solar: 'nick', cajado_poder: 'topple', maca_disrupcao: 'sap',
  i_hammer_of_thunderbolts: 'topple', i_oathbow: 'slow', i_staff_of_charming: 'topple', i_staff_of_withering: 'topple' };
export function maestriaDe(it) {
  if (!it || it.tipo !== 'arma') return null;
  const base = String(it.id || '').replace(/_\d+$/, ''); if (POR_ID[base]) return POR_ID[base];
  const en = String(it.en || '').toLowerCase(); for (const n of NOMES) if (new RegExp(`\\b${n}s?\\b`).test(en)) return POR_NOME[n];
  return null;
}
