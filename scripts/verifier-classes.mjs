/**
 * Vérifie que CHAQUE classe Tailwind écrite dans src/ produit réellement du
 * CSS.
 *
 * Pourquoi ce script existe : une classe Tailwind qui n'existe pas ne
 * provoque AUCUNE erreur. Ni `tsc`, ni `next build`, ni le navigateur ne
 * signalent quoi que ce soit — le style disparaît simplement, en silence.
 * C'est ainsi que `border-6` (une largeur de bordure qui n'existe pas dans
 * Tailwind) est resté des semaines sur l'écran d'inscription sans que la
 * pastille sélectionnée ne s'affiche jamais.
 *
 * Depuis que les tokens définissent un vocabulaire fermé (`gap-hair`,
 * `px-gutter`, `size-mark`…), le risque augmente : une faute de frappe dans
 * un nom produit exactement le même silence. Ce script le rompt.
 *
 *     node scripts/verifier-classes.mjs
 *
 * Il sort en code 1 si une classe est introuvable, ce qui permet de le
 * brancher un jour sur l'intégration continue.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

const RACINE = resolve(import.meta.dirname, "..");

/** Classes gérées par Tailwind sans qu'aucune règle ne porte leur nom. */
const IGNORER = new Set(["group", "peer", "dark", "container"]);

/**
 * Racines d'utilitaires Tailwind. Un mot dont la racine n'est pas dans
 * cette liste n'est pas considéré comme une classe : c'est ainsi qu'on
 * écarte `lucide-react`, `current-password` ou « inscrivez-vous », qui sont
 * des chaînes de caractères ordinaires et non du style.
 */
const RACINES = new Set(
  `p px py pt pb pl pr ps pe m mx my mt mb ml mr gap space size w h min max
   text bg border rounded ring shadow font leading tracking truncate uppercase
   lowercase capitalize italic flex grid col row items justify content self
   place order top right bottom left inset absolute relative sticky fixed static
   overflow opacity aspect animate block inline hidden cursor transition duration
   ease resize tabular object z basis grow shrink whitespace break list divide
   outline select underline line decoration appearance backdrop blur scale rotate
   translate touch scroll snap caret placeholder from via to`
    .split(/\s+/)
    .filter(Boolean),
);

function fichiersTsx(dossier) {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiersTsx(chemin);
    return chemin.endsWith(".tsx") || chemin.endsWith(".ts") ? [chemin] : [];
  });
}

/**
 * Récupère les classes candidates. On lit toutes les chaînes de caractères
 * des fichiers plutôt que les seuls attributs `className` : depuis la
 * refonte, l'essentiel des classes vit dans des tables `const STYLE = {…}`
 * en haut des composants, hors de tout attribut.
 */
function classesCandidates(texte, nomsDeTokens) {
  const trouvees = new Set();
  for (const [, contenu] of texte.matchAll(/["'`]([^"'`\n]*)["'`]/g)) {
    const mots = contenu.trim().split(/\s+/).filter(Boolean);
    for (const brut of mots) {
      /* Les chaînes de l'application contiennent aussi du français, et
         une phrase qui cite une classe l'accompagne d'une ponctuation :
         « … py-section. » ou « gap-, p-, m- ». On la retire, et on écarte
         ce qui reste ouvert sur un tiret : ce n'est pas une classe. */
      const mot = brut.trim().replace(/[.,;:!?)»]+$/, "");
      if (!mot || mot.length > 60 || mot.endsWith("-")) continue;
      // Une classe utilitaire : lettres, chiffres, et les signes que
      // Tailwind autorise. On exclut tout ce qui ressemble à du texte.
      if (!/^-?[a-z][-a-z0-9:/.[\]()%#_]*$/.test(mot)) continue;
      if (!/[-/]/.test(mot)) continue;
      // La racine est le premier segment, variantes et signe négatif retirés.
      const nu = mot.replace(/^-/, "").replace(/^((?:[a-z-]+:)+)/, "");
      const racine = nu.split("-")[0];
      if (!RACINES.has(racine)) continue;
      /* Une chaîne d'un seul mot est ambiguë : « p-gutter » est une classe,
         « p-riz » est l'identifiant d'un produit de démonstration. On ne la
         retient que si son suffixe est un nom déclaré dans tokens.css, ou
         si elle porte un chiffre, une variante ou une fraction — trois
         choses qu'un identifiant de données n'a jamais. */
      if (mots.length === 1) {
        const suffixe = nu.slice(racine.length + 1);
        const reconnaissable = /[0-9:[\]/.]/.test(mot) || nomsDeTokens.has(suffixe);
        if (!reconnaissable) continue;
      }
      trouvees.add(mot);
    }
  }
  return trouvees;
}

/** Tailwind échappe les caractères spéciaux dans les sélecteurs. */
function selecteur(classe) {
  return "." + classe.replace(/[.\/:%[\]()#,]/g, (c) => "\\" + c);
}

const css = await postcss([tailwind()]).process(
  readFileSync(join(RACINE, "src/styles/index.css"), "utf8"),
  { from: join(RACINE, "src/styles/index.css") },
);

/* Les noms déclarés dans tokens.css : hair, gutter, mark, accent, paper… */
const nomsDeTokens = new Set(
  [...readFileSync(join(RACINE, "src/styles/tokens.css"), "utf8").matchAll(
    /--(?:spacing|color|text|radius|leading|font|shadow|container)-([a-z0-9-]+)\s*:/g,
  )].map(([, nom]) => nom),
);

const fichiers = fichiersTsx(join(RACINE, "src"));
const manquantes = new Map();

for (const fichier of fichiers) {
  for (const classe of classesCandidates(readFileSync(fichier, "utf8"), nomsDeTokens)) {
    if (IGNORER.has(classe)) continue;
    // Les variantes (hover:, last:, md:…) sont retirées pour la recherche :
    // seule la base produit un sélecteur nommé.
    const base = classe.replace(/^((?:[a-z-]+:)+)/, "");
    if (css.css.includes(selecteur(base))) continue;
    // Une variante seule (`hover:bg-accent`) apparaît telle quelle.
    if (css.css.includes(selecteur(classe))) continue;
    if (!manquantes.has(classe)) manquantes.set(classe, []);
    manquantes.get(classe).push(fichier.slice(RACINE.length + 1));
  }
}

if (manquantes.size === 0) {
  console.log(`✓ ${fichiers.length} fichiers vérifiés, aucune classe fantôme.`);
  process.exit(0);
}

console.error(`✗ ${manquantes.size} classe(s) ne produisent aucun CSS :\n`);
for (const [classe, ou] of [...manquantes].sort()) {
  console.error(`  ${classe}`);
  for (const f of [...new Set(ou)]) console.error(`      ${f}`);
}
console.error(
  "\nUne classe absente ne casse rien : elle ne fait rien. Vérifie le nom, ou\najoute le token manquant dans src/styles/tokens.css.",
);
process.exit(1);
