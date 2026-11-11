/**
 * Palette de la carte. Les 7 couleurs de la DA + quelques variations de luminosité
 * (jamais de teinte nouvelle).
 */
export const K = {
	// Crème #F5EEDD et variations
	creme: "#F5EEDD",
	cremeFonce: "#E9DEC4",
	cremeProfond: "#DCCDA9",
	// Blanc cassé #F5F2EB et variation plus claire
	blanc: "#F5F2EB",
	papier: "#FBF9F3",
	// Bleu ciel #84B3CE et variations
	ciel: "#84B3CE",
	cielClair: "#B5D1E1",
	cielPale: "#D9E7EF",
	cielFonce: "#5E93B3",
	// Bleu profond #16587B, bleu encre #0F425F
	bleu: "#16587B",
	encre: "#0F425F",
	// Ardoise #1E293B, gris #4A5568
	ardoise: "#1E293B",
	gris: "#4A5568",
	// Ombre portée douce
	ombre: "rgba(15,66,95,.13)",
} as const;
