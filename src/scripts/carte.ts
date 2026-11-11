/**
 * Comportement de la carte : caméra (glisser, molette, pincement), personnage (clavier ou marche
 * automatique le long des chemins), survol de proximité, panneau projet, lien direct par #id.
 * TypeScript sans dépendance : tout passe par des transformations CSS.
 */
import { WORLD, LIEUX, NOEUDS, ARETES, PONTS, RIVIERE_L, riviereX, DEPART, dansLac, pointsArete } from "../data/lieux";

type Pt = { x: number; y: number };
interface Donnees {
	lieux: Record<string, { id: string; titre: string }[]>;
}

const WW = WORLD.w;
const WH = WORLD.h;
const VITESSE_CLAVIER = 300; // px monde / s
const VITESSE_MARCHE = 340;
const Z_MAX = 1.8;
const Z_MIN_ABS = 0.3;
const PORTEE_PROXIMITE = 130;
const CLE_INDICE = "carte-indice-vu";

const racine = document.querySelector<HTMLElement>("[data-carte]");
if (racine) init(racine);

function init(root: HTMLElement) {
	const q = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
	const vp = q<HTMLElement>(".carte-vp");
	const monde = q<HTMLElement>(".carte-monde");
	const persoEl = q<HTMLElement>(".carte-perso");
	const panneau = q<HTMLElement>(".carte-panneau");
	const contenu = q<HTMLElement>(".carte-contenu");
	const onglets = q<HTMLElement>(".carte-onglets");
	const indice = q<HTMLElement>(".carte-indice");
	const mini = q<SVGSVGElement>(".carte-mini");
	const miniVue = q<SVGRectElement>(".mini-vue");
	const miniPerso = q<SVGCircleElement>(".mini-perso");
	const boutons = [...root.querySelectorAll<HTMLButtonElement>("button.bat")];
	const parSlug = new Map(boutons.map((b) => [b.dataset.lieu!, b]));

	const donnees: Donnees = JSON.parse(root.querySelector("#carte-donnees")?.textContent ?? '{"lieux":{}}');
	const gabarits = new Map<string, HTMLTemplateElement>();
	root.querySelectorAll<HTMLTemplateElement>("template[data-projet]").forEach((t) => gabarits.set(t.dataset.projet!, t));
	const lieuDe = new Map<string, string>();
	for (const [slug, ps] of Object.entries(donnees.lieux)) ps.forEach((p) => lieuDe.set(p.id, slug));
	const lieuxParSlug = new Map(LIEUX.map((l) => [l.slug, l]));

	const mouvementReduit = window.matchMedia("(prefers-reduced-motion: reduce)");
	let reduit = mouvementReduit.matches;
	mouvementReduit.addEventListener("change", (e) => (reduit = e.matches));

	/* ------------------------- Etat ------------------------- */
	let vw = 1;
	let vh = 1;
	const cam = { x: DEPART.x, y: DEPART.y, z: 0.85 };
	let suit = true; // la caméra suit le personnage
	const p = { x: DEPART.x as number, y: DEPART.y as number, gauche: false, marche: false };
	let chemin: Pt[] = [];
	let cible: string | null = null; // lieu à ouvrir en arrivant
	let proche: string | null = null;
	let lieuActif: string | null = null;
	let projetActif: string | null = null;
	let ouvreur: HTMLElement | null = null;
	let dimsPanneau = { w: 0, h: 0 };
	const touches = new Set<"haut" | "bas" | "gauche" | "droite">();
	let raf = 0;
	let dernier = 0;
	let zRendu = -1;
	let bloquerClic = false;

	/* ------------------------- Caméra ------------------------- */
	const zMin = () => Math.max(vw / WW, vh / WH, Z_MIN_ABS);
	const clampZ = (z: number) => Math.min(Z_MAX, Math.max(zMin(), z));
	const zInitial = () => clampZ(vw < 640 ? 0.75 : 0.85);

	function clampCam() {
		const hw = vw / (2 * cam.z);
		const hh = vh / (2 * cam.z);
		cam.x = WW <= 2 * hw ? WW / 2 : Math.min(WW - hw, Math.max(hw, cam.x));
		cam.y = WH <= 2 * hh ? WH / 2 : Math.min(WH - hh, Math.max(hh, cam.y));
	}

	/** Centre de caméra souhaité quand elle suit le personnage (décalé si le panneau est ouvert). */
	function centreCible(): Pt {
		let x = p.x;
		let y = p.y - 24;
		if (panneau.classList.contains("is-open")) {
			if (window.innerWidth >= 768) x += dimsPanneau.w / 2 / cam.z;
			else y += dimsPanneau.h / 2 / cam.z;
		}
		return { x, y };
	}

	function zoomerEn(z: number, cx: number, cy: number) {
		const nz = clampZ(z);
		const wx = cam.x + (cx - vw / 2) / cam.z;
		const wy = cam.y + (cy - vh / 2) / cam.z;
		cam.z = nz;
		cam.x = wx - (cx - vw / 2) / nz;
		cam.y = wy - (cy - vh / 2) / nz;
		clampCam();
		demander();
	}

	/* ------------------------- Collisions ------------------------- */
	function bloque(x: number, y: number) {
		if (x < 50 || x > WW - 50 || y < 90 || y > WH - 50) return true;
		if (Math.abs(x - riviereX(y)) < RIVIERE_L / 2 - 4) {
			const surPont = PONTS.some((b) => Math.abs(y - b.y) < 18 && x > b.x1 - 10 && x < b.x2 + 10);
			if (!surPont) return true;
		}
		if (dansLac(x, y, 8)) return true;
		for (const l of LIEUX) {
			if (Math.abs(x - l.x) < l.emprise.w / 2 && y > l.y - l.emprise.h && y < l.y + 4) return true;
		}
		return false;
	}

	function deplacer(dx: number, dy: number) {
		const nx = p.x + dx;
		if (!bloque(nx, p.y)) p.x = nx;
		const ny = p.y + dy;
		if (!bloque(p.x, ny)) p.y = ny;
		if (dx) p.gauche = dx < 0;
	}

	/* ------------------------- Chemins ------------------------- */
	const adj = new Map<string, [string, number][]>();
	const indexArete = new Map<string, number>();
	ARETES.forEach(([a, b], i) => {
		indexArete.set(`${a}|${b}`, i);
		indexArete.set(`${b}|${a}`, i);
	});
	/** Points du sentier entre deux nœuds voisins, dans le sens a → b (sans le point de départ). */
	function troncon(a: string, b: string): Pt[] {
		const i = indexArete.get(`${a}|${b}`);
		if (i === undefined) return [{ x: NOEUDS[b][0], y: NOEUDS[b][1] }];
		const pts = pointsArete(i);
		if (ARETES[i][0] !== a) pts.reverse();
		return pts.slice(1).map(([x, y]) => ({ x, y }));
	}
	for (const [a, b] of ARETES) {
		const w = Math.hypot(NOEUDS[a][0] - NOEUDS[b][0], NOEUDS[a][1] - NOEUDS[b][1]);
		(adj.get(a) ?? adj.set(a, []).get(a)!).push([b, w]);
		(adj.get(b) ?? adj.set(b, []).get(b)!).push([a, w]);
	}

	/** Vrai si le segment a→b ne traverse ni rivière (hors pont) ni bâtiment. */
	function ligneLibre(a: Pt, b: Pt) {
		const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 16);
		for (let i = 1; i < n; i++) {
			const t = i / n;
			if (bloque(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)) return false;
		}
		return true;
	}

	/**
	 * Itinéraire du personnage vers la porte `vers` : Dijkstra depuis la cible (graphe non orienté),
	 * puis choix du nœud de départ qui minimise « trajet direct libre + chemin restant ».
	 */
	function itineraire(depuis: Pt, vers: string): Pt[] {
		const dist = new Map<string, number>([[vers, 0]]);
		const suivant = new Map<string, string>(); // nœud -> nœud suivant vers la cible
		const restant = new Set(Object.keys(NOEUDS));
		while (restant.size) {
			let u: string | null = null;
			let du = Infinity;
			for (const n of restant) {
				const d = dist.get(n) ?? Infinity;
				if (d < du) {
					du = d;
					u = n;
				}
			}
			if (u === null) break;
			restant.delete(u);
			for (const [v, w] of adj.get(u) ?? []) {
				if (du + w < (dist.get(v) ?? Infinity)) {
					dist.set(v, du + w);
					suivant.set(v, u);
				}
			}
		}
		let depart = "";
		let meilleur = Infinity;
		let secours = "";
		let dSecours = Infinity;
		for (const [id, [x, y]] of Object.entries(NOEUDS)) {
			const droit = Math.hypot(x - depuis.x, y - depuis.y);
			if (droit < dSecours) {
				dSecours = droit;
				secours = id;
			}
			const total = droit + (dist.get(id) ?? Infinity);
			if (total < meilleur && ligneLibre(depuis, { x, y })) {
				meilleur = total;
				depart = id;
			}
		}
		if (!depart) depart = secours;
		const ids = [depart];
		while (ids[ids.length - 1] !== vers) {
			const s = suivant.get(ids[ids.length - 1]);
			if (!s) break;
			ids.push(s);
		}
		const trajet: Pt[] = [{ x: NOEUDS[depart][0], y: NOEUDS[depart][1] }];
		for (let k = 1; k < ids.length; k++) trajet.push(...troncon(ids[k - 1], ids[k]));
		return trajet;
	}

	/* ------------------------- Boucle ------------------------- */
	function demander() {
		if (!raf) {
			dernier = performance.now();
			raf = requestAnimationFrame(tick);
		}
	}

	function tick(t: number) {
		raf = 0;
		const dt = Math.min(0.05, (t - dernier) / 1000);
		dernier = t;
		let bouge = false;

		let dx = 0;
		let dy = 0;
		if (touches.has("gauche")) dx -= 1;
		if (touches.has("droite")) dx += 1;
		if (touches.has("haut")) dy -= 1;
		if (touches.has("bas")) dy += 1;

		if (dx || dy) {
			annulerMarche();
			const n = Math.hypot(dx, dy);
			const pas = VITESSE_CLAVIER * dt;
			deplacer((dx / n) * pas, (dy / n) * pas);
			suit = true;
			bouge = true;
		} else if (chemin.length) {
			marcher(dt);
			bouge = true;
		}

		if (bouge !== p.marche) {
			p.marche = bouge;
			persoEl.classList.toggle("is-walking", bouge);
		}
		persoEl.classList.toggle("is-gauche", p.gauche);
		if (bouge) majProximite();

		// caméra
		let encore = false;
		if (suit) {
			const c = centreCible();
			if (reduit) {
				cam.x = c.x;
				cam.y = c.y;
			} else {
				const k = 1 - Math.exp(-dt * 7);
				cam.x += (c.x - cam.x) * k;
				cam.y += (c.y - cam.y) * k;
				encore = Math.abs(c.x - cam.x) > 0.4 || Math.abs(c.y - cam.y) > 0.4;
			}
		}
		clampCam();
		rendre();

		if (touches.size || chemin.length || encore) demander();
	}

	function rendre() {
		monde.style.transform = `translate3d(${vw / 2 - cam.x * cam.z}px, ${vh / 2 - cam.y * cam.z}px, 0) scale(${cam.z})`;
		if (cam.z !== zRendu) {
			zRendu = cam.z;
			monde.style.setProperty("--inv", (1 / cam.z).toFixed(3));
		}
		persoEl.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
		persoEl.style.zIndex = String(Math.round(p.y));
		const hw = vw / cam.z;
		const hh = vh / cam.z;
		miniVue.setAttribute("x", String(cam.x - hw / 2));
		miniVue.setAttribute("y", String(cam.y - hh / 2));
		miniVue.setAttribute("width", String(hw));
		miniVue.setAttribute("height", String(hh));
		miniPerso.setAttribute("cx", String(p.x));
		miniPerso.setAttribute("cy", String(p.y));
	}

	function marcher(dt: number) {
		const but = chemin[0];
		const dx = but.x - p.x;
		const dy = but.y - p.y;
		const d = Math.hypot(dx, dy);
		const pas = VITESSE_MARCHE * dt;
		if (dx) p.gauche = dx < 0;
		if (d <= pas) {
			p.x = but.x;
			p.y = but.y;
			chemin.shift();
			if (!chemin.length) arrivee();
		} else {
			p.x += (dx / d) * pas;
			p.y += (dy / d) * pas;
		}
	}

	function arrivee() {
		const l = cible;
		cible = null;
		if (l) ouvrir(l);
	}

	function annulerMarche() {
		chemin = [];
		cible = null;
	}

	function teleporter(slug: string) {
		const l = lieuxParSlug.get(slug)!;
		const [x, y] = NOEUDS[l.porte];
		p.x = x;
		p.y = y;
		p.marche = false;
		persoEl.classList.remove("is-walking");
		majProximite();
	}

	/* ------------------------- Proximité ------------------------- */
	function majProximite() {
		let meilleur: string | null = null;
		let dMin = PORTEE_PROXIMITE;
		for (const l of LIEUX) {
			if (!parSlug.has(l.slug)) continue;
			const [x, y] = NOEUDS[l.porte];
			const d = Math.hypot(x - p.x, y - p.y);
			if (d < dMin) {
				dMin = d;
				meilleur = l.slug;
			}
		}
		if (meilleur === proche) return;
		if (proche) parSlug.get(proche)?.classList.remove("is-near");
		proche = meilleur;
		if (proche) parSlug.get(proche)?.classList.add("is-near");
	}

	/* ------------------------- Panneau ------------------------- */
	function mesurerPanneau() {
		const r = panneau.getBoundingClientRect();
		dimsPanneau = { w: r.width, h: r.height };
	}

	function chargerInstagram() {
		if (!contenu.querySelector(".instagram-media")) return;
		const w = window as any;
		if (w.instgrm?.Embeds) {
			w.instgrm.Embeds.process();
		} else if (!document.querySelector("script[data-carte-insta]")) {
			const s = document.createElement("script");
			s.async = true;
			s.src = "https://www.instagram.com/embed.js";
			s.dataset.carteInsta = "1";
			s.onload = () => (window as any).instgrm?.Embeds?.process();
			document.body.append(s);
		}
	}

	function afficherProjet(id: string) {
		const tpl = gabarits.get(id);
		if (!tpl) return;
		projetActif = id;
		contenu.replaceChildren(tpl.content.cloneNode(true));
		contenu.scrollTop = 0;
		onglets.querySelectorAll<HTMLElement>(".carte-onglet").forEach((o) => o.setAttribute("aria-selected", String(o.dataset.id === id)));
		history.replaceState(null, "", `#${encodeURIComponent(id)}`);
		chargerInstagram();
	}

	function construireOnglets(slug: string) {
		const ps = donnees.lieux[slug] ?? [];
		onglets.replaceChildren();
		onglets.hidden = ps.length < 2;
		if (ps.length < 2) return;
		for (const pr of ps) {
			const b = document.createElement("button");
			b.type = "button";
			b.className = "carte-onglet";
			b.role = "tab";
			b.dataset.id = pr.id;
			b.textContent = pr.titre;
			b.setAttribute("aria-selected", "false");
			b.addEventListener("click", () => afficherProjet(pr.id));
			onglets.append(b);
		}
	}

	function ouvrir(slug: string, id?: string) {
		const ps = donnees.lieux[slug];
		if (!ps?.length) return;
		if (lieuActif && lieuActif !== slug) parSlug.get(lieuActif)?.classList.remove("is-active");
		lieuActif = slug;
		parSlug.get(slug)?.classList.add("is-active");
		construireOnglets(slug);
		afficherProjet(id && ps.some((x) => x.id === id) ? id : ps[0].id);
		panneau.classList.add("is-open");
		root.classList.add("has-panel");
		masquerIndice();
		mesurerPanneau();
		suit = true;
		demander();
		requestAnimationFrame(() => panneau.querySelector<HTMLElement>(".cp-titre")?.focus({ preventScroll: true }));
	}

	function fermer(rendreFocus = true) {
		if (!panneau.classList.contains("is-open")) return;
		panneau.classList.remove("is-open");
		root.classList.remove("has-panel");
		if (lieuActif) parSlug.get(lieuActif)?.classList.remove("is-active");
		const dernierLieu = lieuActif;
		lieuActif = null;
		projetActif = null;
		history.replaceState(null, "", location.pathname + location.search);
		window.setTimeout(() => {
			if (!panneau.classList.contains("is-open")) contenu.replaceChildren();
		}, 340);
		if (rendreFocus) (ouvreur ?? (dernierLieu ? parSlug.get(dernierLieu) : null))?.focus({ preventScroll: true });
		suit = true;
		demander();
	}

	/** Ouvre un lieu : marche jusqu'à la porte, ou ouverture directe (mouvement réduit, clavier). */
	function allerVers(slug: string, depuis: HTMLElement | null, direct = false) {
		const l = lieuxParSlug.get(slug);
		if (!l || !donnees.lieux[slug]?.length) return;
		ouvreur = depuis;
		masquerIndice();
		if (lieuActif === slug && panneau.classList.contains("is-open")) {
			panneau.querySelector<HTMLElement>(".cp-titre")?.focus({ preventScroll: true });
			return;
		}
		fermer(false);
		if (reduit || direct) {
			annulerMarche();
			teleporter(slug);
			ouvrir(slug);
			return;
		}
		chemin = itineraire(p, l.porte);
		cible = slug;
		suit = true;
		if (!chemin.length) arrivee();
		demander();
	}

	/* ------------------------- Indication ------------------------- */
	function masquerIndice() {
		if (indice.hidden || indice.classList.contains("is-out")) return;
		indice.classList.add("is-out");
		try {
			localStorage.setItem(CLE_INDICE, "1");
		} catch {
			/* stockage indisponible : l'indication reviendra */
		}
		window.setTimeout(() => (indice.hidden = true), 350);
	}
	try {
		if (!localStorage.getItem(CLE_INDICE)) indice.hidden = false;
	} catch {
		indice.hidden = false;
	}

	/* ------------------------- Entrées ------------------------- */
	// pointeurs : glisser, pincer
	const ptrs = new Map<number, Pt>();
	let glisse = false;
	let depart: Pt = { x: 0, y: 0 };
	let pincement: { d: number; mx: number; my: number } | null = null;
	const rel = (cx: number, cy: number): Pt => {
		const r = vp.getBoundingClientRect();
		return { x: cx - r.left, y: cy - r.top };
	};

	function debutPincement() {
		const [a, b] = [...ptrs.values()];
		const m = rel((a.x + b.x) / 2, (a.y + b.y) / 2);
		pincement = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: m.x, my: m.y };
		glisse = true;
		suit = false;
	}

	vp.addEventListener("pointerdown", (e) => {
		if (e.pointerType === "mouse" && e.button !== 0) return;
		ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
		depart = { x: e.clientX, y: e.clientY };
		if (ptrs.size === 2) debutPincement();
	});

	vp.addEventListener("pointermove", (e) => {
		const prec = ptrs.get(e.pointerId);
		if (!prec) return;
		const cur = { x: e.clientX, y: e.clientY };
		ptrs.set(e.pointerId, cur);
		if (ptrs.size === 2 && pincement) {
			const [a, b] = [...ptrs.values()];
			const d = Math.hypot(a.x - b.x, a.y - b.y);
			const m = rel((a.x + b.x) / 2, (a.y + b.y) / 2);
			cam.x -= (m.x - pincement.mx) / cam.z;
			cam.y -= (m.y - pincement.my) / cam.z;
			zoomerEn(cam.z * (d / pincement.d), m.x, m.y);
			pincement = { d, mx: m.x, my: m.y };
			return;
		}
		if (!glisse) {
			if (Math.hypot(cur.x - depart.x, cur.y - depart.y) < 6) return;
			glisse = true;
			vp.setPointerCapture(e.pointerId);
			vp.classList.add("is-drag");
			suit = false;
			masquerIndice();
		}
		cam.x -= (cur.x - prec.x) / cam.z;
		cam.y -= (cur.y - prec.y) / cam.z;
		clampCam();
		demander();
	});

	const finPointeur = (e: PointerEvent) => {
		if (!ptrs.has(e.pointerId)) return;
		ptrs.delete(e.pointerId);
		if (glisse) {
			bloquerClic = true;
			window.setTimeout(() => (bloquerClic = false), 0);
		}
		if (ptrs.size < 2) pincement = null;
		if (ptrs.size === 0) {
			glisse = false;
			vp.classList.remove("is-drag");
		}
	};
	vp.addEventListener("pointerup", finPointeur);
	vp.addEventListener("pointercancel", finPointeur);
	vp.addEventListener("lostpointercapture", finPointeur);

	vp.addEventListener(
		"wheel",
		(e) => {
			e.preventDefault();
			const c = rel(e.clientX, e.clientY);
			const k = e.ctrlKey ? 0.012 : 0.0016;
			suit = false;
			masquerIndice();
			zoomerEn(cam.z * Math.exp(-e.deltaY * k), c.x, c.y);
		},
		{ passive: false },
	);

	// le navigateur peut faire défiler le conteneur pour montrer un bouton focalisé : on l'annule
	vp.addEventListener("scroll", () => {
		vp.scrollLeft = 0;
		vp.scrollTop = 0;
	});

	// bâtiments
	boutons.forEach((b) => {
		b.addEventListener("click", (e) => {
			if (bloquerClic) return;
			allerVers(b.dataset.lieu!, b, e.detail === 0);
		});
		b.addEventListener("focus", () => {
			const l = lieuxParSlug.get(b.dataset.lieu!);
			if (!l) return;
			vp.scrollLeft = 0;
			vp.scrollTop = 0;
			suit = false;
			cam.x = l.x;
			cam.y = l.y - l.zone.h / 2;
			clampCam();
			demander();
		});
	});

	// clavier
	const CLES: Record<string, "haut" | "bas" | "gauche" | "droite"> = {
		z: "haut", arrowup: "haut",
		s: "bas", arrowdown: "bas",
		q: "gauche", arrowleft: "gauche",
		d: "droite", arrowright: "droite",
	};
	const interactif = (t: EventTarget | null) =>
		t instanceof Element && !!t.closest("input, select, textarea, [contenteditable], .carte-panneau");

	window.addEventListener("keydown", (e) => {
		if (e.ctrlKey || e.metaKey || e.altKey) return;
		if (e.key === "Escape") {
			if (panneau.classList.contains("is-open")) {
				e.preventDefault();
				fermer();
			}
			return;
		}
		if (interactif(e.target)) return;
		const dir = CLES[e.key.toLowerCase()];
		if (dir) {
			e.preventDefault();
			masquerIndice();
			touches.add(dir);
			demander();
			return;
		}
		if (e.key === "Enter" && proche && !(e.target instanceof Element && e.target.closest("a, button, summary"))) {
			e.preventDefault();
			allerVers(proche, parSlug.get(proche) ?? null);
		}
	});
	window.addEventListener("keyup", (e) => {
		const dir = CLES[e.key.toLowerCase()];
		if (dir) touches.delete(dir);
	});
	window.addEventListener("blur", () => touches.clear());

	// interface
	root.addEventListener("click", (e) => {
		const el = (e.target as Element).closest<HTMLElement>("[data-action]");
		if (!el) return;
		switch (el.dataset.action) {
			case "zoom-plus":
				zoomerEn(cam.z * 1.25, vw / 2, vh / 2);
				break;
			case "zoom-moins":
				zoomerEn(cam.z / 1.25, vw / 2, vh / 2);
				break;
			case "recentrer":
				cam.z = zInitial();
				suit = true;
				demander();
				break;
			case "fermer":
				fermer();
				break;
			case "fermer-indice":
				masquerIndice();
				break;
		}
	});

	// minimap : cliquer ou glisser pour déplacer la vue
	const versMonde = (e: PointerEvent): Pt => {
		const r = mini.getBoundingClientRect();
		return { x: ((e.clientX - r.left) / r.width) * WW, y: ((e.clientY - r.top) / r.height) * WH };
	};
	mini.addEventListener("pointerdown", (e) => {
		mini.setPointerCapture(e.pointerId);
		const m = versMonde(e);
		cam.x = m.x;
		cam.y = m.y;
		suit = false;
		clampCam();
		demander();
	});
	mini.addEventListener("pointermove", (e) => {
		if (!mini.hasPointerCapture(e.pointerId)) return;
		const m = versMonde(e);
		cam.x = m.x;
		cam.y = m.y;
		clampCam();
		demander();
	});

	// taille
	let premiereMesure = true;
	new ResizeObserver(() => {
		vw = vp.clientWidth || 1;
		vh = vp.clientHeight || 1;
		if (premiereMesure) {
			premiereMesure = false;
			cam.z = zInitial();
			if (!ouvrirDepuisHash()) {
				cam.x = p.x;
				cam.y = p.y - 24;
			}
		}
		cam.z = clampZ(cam.z);
		mesurerPanneau();
		clampCam();
		demander();
	}).observe(vp);

	/* ------------------------- Lien direct ------------------------- */
	function idDepuisHash() {
		try {
			return decodeURIComponent(location.hash.slice(1));
		} catch {
			return "";
		}
	}
	function ouvrirDepuisHash() {
		const id = idDepuisHash();
		const slug = id ? lieuDe.get(id) : undefined;
		if (!id || !slug) return false;
		fermer(false);
		annulerMarche();
		teleporter(slug);
		cam.x = p.x;
		cam.y = p.y - 24;
		ouvreur = parSlug.get(slug) ?? null;
		ouvrir(slug, id);
		return true;
	}
	window.addEventListener("hashchange", () => {
		const id = idDepuisHash();
		if (!id) {
			fermer(false);
			return;
		}
		if (id !== projetActif) ouvrirDepuisHash();
	});

	majProximite();
	demander();
}
