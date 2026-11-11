/**
 * Données locales de repli, utilisées si l'API est indisponible.
 * Seuls les titres viennent de tes notes ; tout le reste est un placeholder explicite.
 */
export const A_COMPLETER = "[À COMPLÉTER]";

const base = (id: string, titre: string) => ({
	id,
	titre,
	date: null,
	type: [A_COMPLETER],
	img_cover: null,
	img_sec: null,
	img_3: null,
	desc: A_COMPLETER,
	desc2: null,
	desc3: null,
	desc4: null,
	youtube_url: null,
	channelId: null,
	instagram_url: null,
	lien: null,
});

export const PROJETS_REPLI = [
	base("remise-diplome-iut", "Remise de diplôme de l'IUT"),
	base("micro-trottoir-region", "Micro-trottoir région"),
	base("offf", "OFFF"),
	base("chorale", "Chorale"),
	base("inouih", "INOUIH"),
	base("jpo", "JPO"),
	base("dellfest", "Dell'Fest"),
	base("open-pma", "OPEN PMA"),
	base("caps", "CAPS"),
	base("overlay-caps", "Overlay CAPS"),
	base("olympia", "Olympia !"),
	base("gestons", "Gestons !"),
	base("photo-octobre-rose", "Photo Octobre Rose"),
];
