/**
 * Dessins SVG modifiables à la main (Illustrator, Figma, Inkscape…) :
 *   - src/assets/carte/fond.svg : le fond de la carte ;
 *   - src/assets/lieux/<slug>.svg : un fichier par lieu ;
 *   - src/assets/icones/<nom>.svg : décor (arbre, sapin, buisson, banc, souche), personnage, rose des vents.
 * Chaque SVG est inséré tel quel dans la page (carte, cartes projet, fiches…).
 */
const fichiersLieux = import.meta.glob<string>("../assets/lieux/*.svg", { query: "?raw", import: "default", eager: true });
const fichiersIcones = import.meta.glob<string>("../assets/icones/*.svg", { query: "?raw", import: "default", eager: true });
const fichierFond = import.meta.glob<string>("../assets/carte/fond.svg", { query: "?raw", import: "default", eager: true });

// Préfixe ids et classes par fichier : les exports d'Illustrator/Figma réutilisent .st0, clip0…
// d'un fichier à l'autre, ce qui entrerait en conflit une fois plusieurs SVG dans la même page.
// `garder` : classes laissées telles quelles (celles que le site anime, comme les jambes du personnage).
const isoler = (svg: string, pre: string, garder?: RegExp) =>
	svg
		.replace(/\bid="([^"]+)"/g, `id="${pre}-$1"`)
		.replace(/url\(\s*['"]?#([^)'"]+)['"]?\s*\)/g, `url(#${pre}-$1)`)
		.replace(/\b(xlink:)?href="#([^"]+)"/g, `$1href="#${pre}-$2"`)
		.replace(/\bclass="([^"]+)"/g, (_, c: string) => `class="${c.trim().split(/\s+/).map((n) => (garder?.test(n) ? n : `${pre}-${n}`)).join(" ")}"`)
		.replace(/<style([^>]*)>([\s\S]*?)<\/style>/g, (_, a, css: string) =>
			`<style${a}>${css.replace(/([.#])(-?[_a-zA-Z][\w-]*)(?=[^{}]*\{)/g, (m: string, s: string, n: string) => (s === "." && garder?.test(n) ? m : `${s}${pre}-${n}`))}</style>`);

/** Nettoie un fichier SVG et lui donne la classe voulue (la taille est gérée en CSS). */
const nettoyer = (contenu: string) => contenu.replace(/<\?xml[\s\S]*?\?>|<!DOCTYPE[\s\S]*?>|<!--[\s\S]*?-->/gi, "");

const preparer = (contenu: string, pre: string, classe: string, garder?: RegExp) =>
	isoler(nettoyer(contenu), pre, garder).replace(/<svg\b([^>]*)>/, (_, a: string) => {
		// sans viewBox, on le déduit de width/height pour que le dessin s'adapte à son cadre
		const w = a.match(/\swidth="([\d.]+)/)?.[1];
		const h = a.match(/\sheight="([\d.]+)/)?.[1];
		const vb = /viewBox=/.test(a) || !w || !h ? "" : ` viewBox="0 0 ${w} ${h}"`;
		return `<svg class="${classe}" aria-hidden="true" focusable="false"${vb}${a.replace(/\s(class|width|height|aria-hidden|focusable)="[^"]*"/g, "")}>`;
	});

const bruts: Record<string, string> = {};
for (const [chemin, contenu] of Object.entries(fichiersLieux)) {
	bruts[chemin.split("/").pop()!.replace(/\.svg$/, "")] = contenu;
}

/**
 * Dessin d'un lieu, prêt à être inséré avec set:html.
 * `cle` distingue plusieurs exemplaires du même dessin dans une page (ids uniques).
 */
export function dessinLieu(slug: string | null | undefined, classe = "bat-art", cle = ""): string {
	if (!slug || !bruts[slug]) return "";
	return preparer(bruts[slug], `l-${slug}${cle ? `-${cle}` : ""}`, classe);
}

export const aDessin = (slug: string) => Boolean(bruts[slug]);

/** Fond de la carte (chaîne vide si le fichier manque). */
export function dessinFond(classe = "carte-fond"): string {
	const brut = Object.values(fichierFond)[0];
	return brut ? preparer(brut, "fond", classe) : "";
}

/* ---------- Icônes : décor, personnage, rose des vents ---------- */
const icones: Record<string, string> = {};
for (const [chemin, contenu] of Object.entries(fichiersIcones)) {
	icones[chemin.split("/").pop()!.replace(/\.svg$/, "")] = contenu;
}

/** Cadre (viewBox) d'un fichier SVG : [minX, minY, largeur, hauteur]. */
function cadre(brut: string): [number, number, number, number] {
	const racine = nettoyer(brut).match(/<svg\b[^>]*>/)?.[0] ?? "";
	const vb = racine.match(/viewBox="([^"]+)"/)?.[1].trim().split(/[\s,]+/).map(Number);
	if (vb?.length === 4 && vb.every((n) => Number.isFinite(n))) return vb as [number, number, number, number];
	const w = Number(racine.match(/\swidth="([\d.]+)/)?.[1]);
	const h = Number(racine.match(/\sheight="([\d.]+)/)?.[1]);
	return [0, 0, w || 50, h || 50];
}

/** Taille d'origine d'une icône, en pixels de carte : [largeur, hauteur]. */
export function tailleIcone(nom: string): [number, number] {
	const [, , w, h] = cadre(icones[nom] ?? "");
	return [w, h];
}

/**
 * Icône insérée telle quelle (personnage, rose des vents…).
 * Les classes du personnage animées par le site (perso-…, jambe…) sont conservées.
 */
export function dessinIcone(nom: string, classe = "", cle = ""): string {
	if (!icones[nom]) {
		console.warn(`[icones] fichier manquant : src/assets/icones/${nom}.svg`);
		return "";
	}
	return preparer(icones[nom], `i-${nom}${cle ? `-${cle}` : ""}`, classe, /^(perso-|jambe)/);
}

/**
 * Éléments de décor (arbre, sapin, buisson, banc, souche) : définis une seule fois par page comme
 * symboles « d-<nom> », puis réutilisés avec <use href="#d-<nom>">.
 */
export function symbolesDecor(noms: readonly string[]): string {
	const symboles = noms.map((nom) => {
		if (!icones[nom]) {
			console.warn(`[icones] fichier manquant : src/assets/icones/${nom}.svg`);
			return "";
		}
		const propre = isoler(nettoyer(icones[nom]), `d-${nom}`);
		const interieur = propre.replace(/^[\s\S]*?<svg\b[^>]*>/, "").replace(/<\/svg>\s*$/, "");
		return `<symbol id="d-${nom}" viewBox="${cadre(icones[nom]).join(" ")}">${interieur}</symbol>`;
	});
	return `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${symboles.join("")}</defs></svg>`;
}
