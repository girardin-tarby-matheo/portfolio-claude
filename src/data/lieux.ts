/**
 * Données de la carte : monde, chemins, lieux et décor.
 * Tout est en coordonnées « monde » (px). Retouche ici les positions sans toucher au reste.
 */

export const WORLD = { w: 2400, h: 1700 } as const;

/** Point de départ du personnage. */
export const DEPART = { x: 700, y: 650 } as const;

/* ------------------------------ Rivière ------------------------------ */

export const RIVIERE_L = 112;
/** Abscisse du centre de la rivière à la hauteur y. */
export const riviereX = (y: number) => 1130 + 45 * Math.sin(y / 230);

/* ------------------------------ Chemins ------------------------------ */

/** Nœuds du réseau de chemins [x, y]. Les portes des lieux sont aussi des nœuds. */
export const NOEUDS: Record<string, [number, number]> = {
	// portes (devant chaque bâtiment)
	mmi: [400, 516],
	amphi: [800, 466],
	dellfest: [1500, 466],
	offf: [1900, 556],
	chorale: [520, 896],
	ordinateur: [840, 1046],
	inouih: [1780, 936],
	beach: [520, 1516],
	ligne: [880, 1516],
	regie: [1480, 1516],
	appareil: [1900, 1516],
	// allée nord
	wN: [280, 580],
	aA1: [400, 580],
	aA2: [800, 580],
	aW: [1000, 580],
	aE: [1240, 580],
	aD: [1500, 580],
	eN: [1560, 580],
	aO: [1900, 580],
	// allée centrale
	wM: [280, 1130],
	bC: [520, 1130],
	bO: [840, 1130],
	bW: [960, 1130],
	bE: [1260, 1130],
	eM: [1560, 1130],
	e2: [1700, 1130],
	bI: [1780, 1130],
	// allée sud
	wS: [280, 1610],
	sB: [520, 1610],
	sL: [880, 1610],
	sW: [1060, 1610],
	sE: [1260, 1610],
	sR: [1480, 1610],
	eS: [1700, 1610],
	sA: [1900, 1610],
};

export const ARETES: [string, string][] = [
	// allée nord
	["wN", "aA1"], ["aA1", "aA2"], ["aA2", "aW"], ["aW", "aE"], ["aE", "aD"], ["aD", "eN"], ["eN", "aO"],
	["mmi", "aA1"], ["amphi", "aA2"], ["dellfest", "aD"], ["offf", "aO"],
	// allée centrale
	["wM", "bC"], ["bC", "bO"], ["bO", "bW"], ["bW", "bE"], ["bE", "eM"], ["eM", "e2"], ["e2", "bI"],
	["chorale", "bC"], ["ordinateur", "bO"], ["inouih", "bI"],
	// allée sud
	["wS", "sB"], ["sB", "sL"], ["sL", "sW"], ["sW", "sE"], ["sE", "sR"], ["sR", "eS"], ["eS", "sA"],
	["beach", "sB"], ["ligne", "sL"], ["regie", "sR"], ["appareil", "sA"],
	// liaisons nord-sud
	["wN", "wM"], ["wM", "wS"], ["eN", "eM"], ["e2", "eS"],
];

/** Ponts : l'allée y franchit la rivière entre x1 et x2. */
export const PONTS = [
	{ y: 580, x1: 1000, x2: 1240 },
	{ y: 1130, x1: 960, x2: 1260 },
	{ y: 1610, x1: 1060, x2: 1260 },
] as const;

/* ------------------------------ Zones ------------------------------ */

export const ZONES = [
	// label : [x, y, ancrage] du nom de la zone, placé hors des sentiers
	{ id: "campus", nom: "Campus", x: 230, y: 330, w: 770, h: 620, label: [330, 918, "start"] },
	{ id: "numerique", nom: "Numérique", x: 660, y: 950, w: 380, h: 160, label: [872, 1092, "start"] },
	{ id: "festivals", nom: "Festivals et scènes", x: 1340, y: 330, w: 800, h: 680, label: [2110, 982, "end"] },
	{ id: "sport", nom: "Sport et rue", x: 270, y: 1370, w: 790, h: 220, label: [700, 1566, "middle"] },
	{ id: "medias", nom: "Médias", x: 1340, y: 1370, w: 800, h: 220, label: [1590, 1566, "middle"] },
] as const;

/* ------------------------------ Lieux ------------------------------ */

export interface Lieu {
	slug: string;
	nom: string;
	univers: string;
	/** Position du bâtiment : milieu du bas de l'illustration. */
	x: number;
	y: number;
	/** Zone de clic = taille de l'illustration SVG. */
	zone: { w: number; h: number };
	/** Emprise au sol (collisions du personnage), centrée sur x, au-dessus de y. */
	emprise: { w: number; h: number };
	/** Nœud de chemin devant la porte. */
	porte: string;
	/** Mots-clés (titre normalisé) qui rattachent un projet à ce lieu. */
	mots: string[];
}

export const LIEUX: Lieu[] = [
	{ slug: "mmi", nom: "Bâtiment MMI", univers: "campus", x: 400, y: 480, zone: { w: 340, h: 300 }, emprise: { w: 250, h: 90 }, porte: "mmi", mots: ["jpo", "journee portes ouvertes", "portes ouvertes"] },
	{ slug: "amphi", nom: "Amphithéâtre de l'IUT", univers: "campus", x: 800, y: 430, zone: { w: 340, h: 290 }, emprise: { w: 260, h: 90 }, porte: "amphi", mots: ["remise de diplome", "remise des diplomes", "diplome"] },
	{ slug: "chorale", nom: "Maison du Peuple", univers: "campus", x: 520, y: 860, zone: { w: 320, h: 290 }, emprise: { w: 220, h: 80 }, porte: "chorale", mots: ["chorale"] },
	{ slug: "ordinateur", nom: "Ordinateur", univers: "numerique", x: 840, y: 1010, zone: { w: 400, h: 330 }, emprise: { w: 300, h: 70 }, porte: "ordinateur", mots: ["overlay caps", "olympia", "gestons"] },
	{ slug: "dellfest", nom: "Halle des 5 Fontaines", univers: "festivals", x: 1500, y: 430, zone: { w: 300, h: 270 }, emprise: { w: 210, h: 80 }, porte: "dellfest", mots: ["dell fest", "dellfest"] },
	{ slug: "offf", nom: "Disseny Hub", univers: "festivals", x: 1900, y: 520, zone: { w: 330, h: 270 }, emprise: { w: 250, h: 80 }, porte: "offf", mots: ["offf"] },
	{ slug: "inouih", nom: "Campus des Portes du Jura", univers: "festivals", x: 1780, y: 900, zone: { w: 320, h: 300 }, emprise: { w: 250, h: 80 }, porte: "inouih", mots: ["inouih"] },
	{ slug: "beach", nom: "Plage de Brognard", univers: "sport", x: 520, y: 1480, zone: { w: 360, h: 220 }, emprise: { w: 260, h: 70 }, porte: "beach", mots: ["open pma", "pma"] },
	{ slug: "ligne", nom: "Arrivée du Tour à Belfort", univers: "sport", x: 880, y: 1480, zone: { w: 340, h: 230 }, emprise: { w: 240, h: 60 }, porte: "ligne", mots: ["micro trottoir"] },
	{ slug: "regie", nom: "Régie et plateau", univers: "medias", x: 1480, y: 1480, zone: { w: 340, h: 260 }, emprise: { w: 250, h: 80 }, porte: "regie", mots: ["plateau lambda", "caps"] },
	{ slug: "appareil", nom: "Appareil photo", univers: "medias", x: 1900, y: 1480, zone: { w: 300, h: 230 }, emprise: { w: 220, h: 70 }, porte: "appareil", mots: ["octobre rose"] },
];

/* ------------------------------ Lac ------------------------------ */

/** Lac de la base de loisirs, derrière la plage. */
export const LAC = { cx: 560, cy: 1238, rx: 205, ry: 50 } as const;
export const dansLac = (x: number, y: number, marge = 0) =>
	((x - LAC.cx) / (LAC.rx + marge)) ** 2 + ((y - LAC.cy) / (LAC.ry + marge)) ** 2 < 1;

/* ------------------------------ Sentiers courbes ------------------------------ */

const estPontArete = (a: string, b: string) => {
	const [ax, ay] = NOEUDS[a];
	const [bx, by] = NOEUDS[b];
	return ay === by && PONTS.some((p) => p.y === ay && Math.min(ax, bx) === p.x1 && Math.max(ax, bx) === p.x2);
};

/**
 * Points d'un sentier (arête i, de son premier nœud vers le second). Les sentiers ondulent
 * légèrement pour éviter le quadrillage « ville » ; ponts et courtes allées restent droits.
 * Le rendu et la marche du personnage utilisent ces mêmes points.
 */
export function pointsArete(i: number, n = 10): [number, number][] {
	const [a, b] = ARETES[i];
	const [ax, ay] = NOEUDS[a];
	const [bx, by] = NOEUDS[b];
	const len = Math.hypot(bx - ax, by - ay) || 1;
	const fleche = estPontArete(a, b) || len < 140 ? 0 : Math.min(30, len * 0.09) * (i % 2 ? 1 : -1);
	const cx = (ax + bx) / 2 - ((by - ay) / len) * fleche;
	const cy = (ay + by) / 2 + ((bx - ax) / len) * fleche;
	const pts: [number, number][] = [];
	for (let k = 0; k <= n; k++) {
		const t = k / n;
		pts.push([
			Math.round(((1 - t) ** 2 * ax + 2 * t * (1 - t) * cx + t * t * bx) * 10) / 10,
			Math.round(((1 - t) ** 2 * ay + 2 * t * (1 - t) * cy + t * t * by) * 10) / 10,
		]);
	}
	return pts;
}
export const estPont = (i: number) => estPontArete(ARETES[i][0], ARETES[i][1]);

/* ------------------------------ Décor ------------------------------ */

/** Éléments de décor : un fichier src/assets/icones/<nom>.svg par type. */
export const TYPES_DECOR = ["arbre", "sapin", "buisson", "banc", "souche"] as const;
export type TypeDecor = (typeof TYPES_DECOR)[number];
export interface ElementDecor { t: TypeDecor; x: number; y: number; s?: number }

/** Éléments posés à la main. (x, y) = pied de l'élément. */
export const DECOR: ElementDecor[] = [
	{ t: "banc", x: 700, y: 640 }, { t: "banc", x: 1330, y: 640 }, { t: "banc", x: 1330, y: 1190 },
	{ t: "banc", x: 330, y: 840 }, { t: "banc", x: 1620, y: 640 }, { t: "banc", x: 860, y: 1195 },
];

/* ------------------------------ Forêt ------------------------------ */

const distSegment = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
	const dx = bx - ax;
	const dy = by - ay;
	const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
	return Math.hypot(px - ax - t * dx, py - ay - t * dy);
};

/** Vrai si un arbre planté en (x, y) gênerait un sentier, un bâtiment, l'eau ou un banc. */
function gene(x: number, y: number) {
	// le feuillage monte d'environ 90 px au-dessus du pied : on teste le pied et la cime
	for (const [px, py] of [[x, y], [x, y - 50]] as const) {
		for (const [a, b] of ARETES) {
			if (distSegment(px, py, NOEUDS[a][0], NOEUDS[a][1], NOEUDS[b][0], NOEUDS[b][1]) < 64) return true;
		}
		if (Math.abs(px - riviereX(py)) < RIVIERE_L / 2 + 30) return true;
		if (dansLac(px, py, 34)) return true;
		for (const l of LIEUX) {
			if (Math.abs(px - l.x) < l.zone.w / 2 + 6 && py > l.y - l.zone.h + 6 && py < l.y + 86) return true;
		}
		for (const d of DECOR) if (Math.hypot(px - d.x, py - d.y) < 50) return true;
	}
	if (Math.hypot(x - DEPART.x, y - DEPART.y) < 110) return true;
	return false;
}

/**
 * Forêt générée de façon déterministe (même carte à chaque build) : grille perturbée,
 * bosquets denses hors des clairières, lisière clairsemée dedans.
 */
export function genererForet(): ElementDecor[] {
	let graine = 20261110;
	const alea = () => {
		graine = (graine + 0x6d2b79f5) | 0;
		let t = Math.imul(graine ^ (graine >>> 15), 1 | graine);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
	const foret: ElementDecor[] = [];
	const PAS = 82;
	for (let gy = 70; gy < WORLD.h - 30; gy += PAS) {
		for (let gx = 60; gx < WORLD.w - 40; gx += PAS) {
			const x = Math.round(gx + (alea() - 0.5) * 60);
			const y = Math.round(gy + (alea() - 0.5) * 60);
			const tirage = alea();
			const type = alea();
			const s = 0.8 + alea() * 0.5;
			if (x < 60 || x > WORLD.w - 60 || y < 120 || y > WORLD.h - 50) continue;
			const clairiere = ZONES.some((z) => x > z.x + 30 && x < z.x + z.w - 30 && y > z.y + 30 && y < z.y + z.h - 30);
			const bosquet = Math.sin(x * 0.011 + 1.3) * Math.cos(y * 0.013 + 0.7) + Math.sin((x + y) * 0.006);
			const proba = clairiere ? 0.16 : bosquet > -0.5 ? 0.92 : 0.5;
			if (tirage > proba || gene(x, y)) continue;
			foret.push({ t: type < 0.52 ? "sapin" : type < 0.88 ? "arbre" : type < 0.95 ? "buisson" : "souche", x, y, s: Math.round(s * 100) / 100 });
		}
	}
	return foret;
}
