# Fond de carte

`fond.svg` est le sol de la carte : papier crème, cadre, sous-bois, clairières et leurs noms, touffes d'herbe, lac et voilier, rivière, sentiers, passerelles, rose des vents. Tu peux le modifier ou le remplacer en **gardant le nom `fond.svg`**.

## À savoir

- **Dimensions** : garde 2400 × 1700 (`viewBox="0 0 2400 1700"`). Les bâtiments, les arbres et le personnage sont placés en pixels sur ce repère.
- **Ce qui n'est pas dans ce fichier** : les arbres, buissons, souches et bancs (ils passent devant ou derrière le personnage selon sa position), les bâtiments (`src/assets/lieux/`) et le personnage.
- **Les sentiers dessinés sont du décor** : le personnage suit les tracés, la rivière, les ponts et le lac définis dans `src/data/lieux.ts` (`NOEUDS`, `ARETES`, `PONTS`, `riviereX`, `LAC`). Si tu déplaces un sentier, un pont ou le lac sur le dessin, reporte le changement dans ce fichier, sinon le personnage marchera à côté.
- **Minicarte** : elle est générée depuis `src/data/lieux.ts`, pas depuis ce dessin.
- **Polices** : un texte en `font-family="Monograph"` utilise la police du site. Dans Illustrator ou Figma, elle doit être installée pour s'afficher correctement.
- **Palette** : Crème #F5EEDD, Bleu profond #16587B, Bleu encre #0F425F, Bleu ciel #84B3CE, Blanc cassé #F5F2EB, Ardoise #1E293B, Gris #4A5568.
- `id`, classes et `<style>` internes sont isolés automatiquement.
