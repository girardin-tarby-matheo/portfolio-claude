import { LIEUX } from "./lieux";
import { A_COMPLETER, PROJETS_REPLI } from "./projets-repli";

export interface ProjetCarte {
	id: string;
	titre: string;
	date: string | null;
	dateTexte: string | null;
	categories: string[];
	cover: string | null;
	/** desc + desc2 (résumé, aussi affiché dans le panneau de la carte) */
	descriptions: string[];
	/** desc3 + desc4 (suite de la fiche projet) */
	descriptionsSuite: string[];
	imageSecondaire: string | null;
	image3: string | null;
	channelId: string | null;
	youtube: string | null;
	instagram: string | null;
	lien: string | null;
	repli: boolean;
	lieu: string | null;
}

/** Titre normalisé : minuscules, sans accents ni ponctuation. */
export const normaliser = (s: unknown) =>
	String(s ?? "")
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.trim();

/** Lieu d'un projet : champ `lieu` de l'API s'il existe, sinon mot-clé le plus long trouvé dans le titre. */
export function trouverLieu(projet: { titre?: unknown; lieu?: unknown }): string | null {
	if (typeof projet.lieu === "string") {
		const direct = LIEUX.find((l) => l.slug === normaliser(projet.lieu).replace(/ /g, ""));
		if (direct) return direct.slug;
		const parNom = LIEUX.find((l) => normaliser(l.nom) === normaliser(projet.lieu));
		if (parNom) return parNom.slug;
	}
	const titre = ` ${normaliser(projet.titre)} `;
	let meilleur: { slug: string; len: number } | null = null;
	for (const lieu of LIEUX) {
		for (const mot of lieu.mots) {
			if (titre.includes(` ${mot} `) && (!meilleur || mot.length > meilleur.len)) {
				meilleur = { slug: lieu.slug, len: mot.length };
			}
		}
	}
	return meilleur?.slug ?? null;
}

const estAbsolue = (v: string) => /^https?:\/\//i.test(v);

/** Même logique de résolution d'image que la fiche projet. */
function resoudreImage(valeur: unknown, base: string | null): string | null {
	if (typeof valeur !== "string") return null;
	const v = valeur.trim();
	if (!v) return null;
	if (estAbsolue(v) || v.startsWith("/")) return v;
	return base ? `${base}${v}` : v;
}

function normaliserProjet(p: any, repli: boolean): ProjetCarte {
	const coverBrute = p.img_cover ?? null;
	const base =
		typeof coverBrute === "string" && coverBrute.includes("/api/files/projets/")
			? coverBrute.slice(0, coverBrute.lastIndexOf("/") + 1)
			: null;

	const categories: string[] = Array.isArray(p.type)
		? p.type.filter((t: unknown) => typeof t === "string")
		: typeof p.type === "string"
			? [p.type]
			: [];

	const dateBrute = typeof p.date === "string" && p.date ? p.date : null;
	const d = dateBrute ? new Date(dateBrute) : null;
	const dateTexte =
		d && !Number.isNaN(d.getTime())
			? d.toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "2-digit" })
			: repli
				? A_COMPLETER
				: null;

	const descriptions = [p.desc, p.desc2]
		.filter((x): x is string => typeof x === "string" && x.trim().length > 0);

	const insta = p.instagram_url ?? p.instagramUrl ?? p.instagram ?? null;

	return {
		id: String(p.id),
		titre: String(p.titre ?? ""),
		date: dateBrute,
		dateTexte,
		categories,
		cover: resoudreImage(coverBrute, base),
		descriptions,
		descriptionsSuite: [p.desc3, p.desc4].filter((x): x is string => typeof x === "string" && x.trim().length > 0),
		imageSecondaire: resoudreImage(p.img_sec, base),
		image3: resoudreImage(p.img_3, base),
		channelId: typeof p.channelId === "string" && p.channelId.trim() ? p.channelId.trim() : null,
		youtube: p.youtube_url || null,
		instagram: typeof insta === "string" && insta.trim() ? insta : null,
		lien: p.lien || null,
		repli,
		lieu: trouverLieu(p),
	};
}

type Resultat = { projets: ProjetCarte[]; repli: boolean };
let enCours: Promise<Resultat> | null = null;

/** Récupère les projets (API puis repli local), une seule fois par build. Ne lève jamais d'erreur. */
export function chargerProjets(): Promise<Resultat> {
	return (enCours ??= recuperer());
}

/** Projets triés du plus récent au plus ancien (les projets sans date à la fin). */
export const parDateDecroissante = (a: ProjetCarte, b: ProjetCarte) =>
	new Date(b.date || "2000-01-01").getTime() - new Date(a.date || "2000-01-01").getTime();

async function recuperer(): Promise<Resultat> {
	const url =
		import.meta.env.PUBLIC_API_URL ?? "http://localhost:8888/.netlify/functions/projets";
	try {
		const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const data = await res.json();
		if (Array.isArray(data) && data.length > 0) {
			return { projets: data.map((p) => normaliserProjet(p, false)), repli: false };
		}
		throw new Error("réponse vide");
	} catch (err) {
		console.warn(`[projets] API indisponible, données de repli utilisées (${(err as Error).message})`);
		return { projets: PROJETS_REPLI.map((p) => normaliserProjet(p, true)), repli: true };
	}
}
