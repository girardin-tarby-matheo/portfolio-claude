# Dessins des lieux de la carte

Un fichier SVG par lieu. Pour changer un bâtiment, remplace son fichier en **gardant le même nom** :

| Fichier | Lieu | Projets |
|---|---|---|
| `mmi.svg` | Bâtiment MMI | JPO |
| `amphi.svg` | Amphithéâtre de l'IUT | Remise de diplôme |
| `chorale.svg` | Maison du Peuple (Belfort) | Chorale |
| `ordinateur.svg` | Ordinateur à 3 écrans | Overlay CAPS, Olympia !, Gestons ! |
| `dellfest.svg` | Halle des 5 Fontaines | Dell'Fest |
| `offf.svg` | Disseny Hub (Barcelone) | OFFF |
| `inouih.svg` | Campus des Portes du Jura | INOUIH |
| `beach.svg` | Plage de Brognard | OPEN PMA |
| `ligne.svg` | Arrivée du Tour à Belfort | Micro-trottoir |
| `regie.svg` | Régie et plateau | CAPS |
| `appareil.svg` | Appareil photo | Octobre Rose |

## Conseils

- **Format** : exporte en SVG (Illustrator : « Exporter sous… > SVG », styles en attributs de présentation ou CSS interne ; Figma : « Export > SVG », sans contour de texte si tu veux garder la police Monograph).
- **Taille** : le dessin est ajusté automatiquement (sans déformation) à la zone du lieu. Pour un rendu sans marge, garde à peu près les proportions actuelles du `viewBox` du fichier remplacé (ex. `0 0 300 270`).
- **Pied du bâtiment** : la base du dessin doit être en bas du cadre ; c'est elle qui touche le sol sur la carte.
- **Palette** : Crème #F5EEDD, Bleu profond #16587B, Bleu encre #0F425F, Bleu ciel #84B3CE, Blanc cassé #F5F2EB, Ardoise #1E293B, Gris #4A5568 ; contours ~2px bleu encre.
- **Polices** : un texte en `font-family="Monograph"` ou `"Inter Variable"` utilise les polices du site.
- **Sans souci** : `id`, classes (`.st0`, `.cls-1`…), `<style>` internes, dégradés et masques sont isolés automatiquement par lieu.
- **Collision et porte** : si la forme au sol change beaucoup, ajuste `emprise` et `porte` du lieu dans `src/data/lieux.ts`.

Si un fichier manque, le build affiche « dessin manquant » et le lieu reste vide.
