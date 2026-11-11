# Icônes : décor, personnage, rose des vents

Un fichier SVG par élément. Pour en changer un, remplace son fichier en **gardant le même nom**.

| Fichier | Rôle | Où il apparaît |
|---|---|---|
| `arbre.svg` | Arbre feuillu | Forêt de la carte, en-têtes et pied de page |
| `sapin.svg` | Sapin | Forêt de la carte, en-têtes et pied de page |
| `buisson.svg` | Buisson | Forêt de la carte, en-têtes et pied de page |
| `souche.svg` | Souche | Forêt de la carte, pied de page, page 404 |
| `banc.svg` | Banc | Le long des sentiers, en-têtes |
| `personnage.svg` | Le personnage qui se déplace | Carte, page À propos, page 404 |
| `rose.svg` | Rose des vents | Logo du menu |

## Conseils

- **Taille** : la taille affichée sur la carte est celle du `viewBox` du fichier, en pixels (ex. `0 0 60 80` = 60 de large, 80 de haut). Un `viewBox` plus grand donne un élément plus grand.
- **Pied** : le bas du dessin, au milieu, est le point posé sur le sol. Garde l'ombre et le tronc centrés en bas du cadre.
- **Un seul dessin par type** : tous les arbres de la forêt utilisent `arbre.svg`, tous les sapins `sapin.svg`, etc. Leur position et leur échelle sont dans `src/data/lieux.ts` (`genererForet`, `DECOR`).
- **Personnage** : pour garder l'animation de marche, les deux jambes doivent être deux éléments portant `class="jambe jambe-a"` et `class="jambe jambe-b"`. Sans ces classes, le personnage se déplace quand même, mais sans bouger les jambes. Il doit regarder vers la droite : le site le retourne quand il va à gauche.
- **Palette** : Crème #F5EEDD, Bleu profond #16587B, Bleu encre #0F425F, Bleu ciel #84B3CE, Blanc cassé #F5F2EB, Ardoise #1E293B, Gris #4A5568 ; contours ~2px bleu encre.
- `id`, classes (`.st0`, `.cls-1`…) et `<style>` internes sont isolés automatiquement par fichier.

## Ce qui n'est pas ici

- Les bâtiments : `src/assets/lieux/`. Les petits personnages dessinés dans un bâtiment (public, chorale, coureurs) font partie du fichier de ce bâtiment.
- Le fond de carte (avec sa rose des vents et son voilier) : `src/assets/carte/fond.svg`.
- L'icône de l'onglet du navigateur : `public/favicon.svg`.
- Les petits pictogrammes de l'interface (+, −, ×, flèches) : ils sont dans le code des pages.
