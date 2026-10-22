// Checks content/*.yml before every build. On a problem the build stops,
// the live website stays unchanged, and the message below tells what to fix.
import fs from "node:fs";
import * as yaml from "js-yaml";

const errors = [];
const fail = (file, message) => errors.push(`✗ ${file}: ${message}`);

function load(file) {
  try {
    return yaml.load(fs.readFileSync(`content/${file}`, "utf8"), { schema: yaml.CORE_SCHEMA });
  } catch (e) {
    const line = e.mark ? ` (Zeile ${e.mark.line + 1})` : "";
    fail(file, `Die Datei ist kein gültiges YAML${line}. Häufige Ursache: falsche Einrückung oder ein Doppelpunkt ohne Anführungszeichen.\n    ${e.reason || e.message}`);
    return null;
  }
}

// de.yml and en.yml must have the same keys; lists of objects the same length
function compare(a, b, path) {
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return fail("de.yml / en.yml", `"${path}" ist in einer Datei eine Liste, in der anderen nicht.`);
    const objects = a.some((x) => x && typeof x === "object") || b.some((x) => x && typeof x === "object");
    if (objects && a.length !== b.length) fail("de.yml / en.yml", `"${path}" hat ${a.length} Einträge auf Deutsch, aber ${b.length} auf Englisch.`);
    if (objects) a.slice(0, b.length).forEach((x, i) => compare(x, b[i], `${path}[${i + 1}]`));
    return;
  }
  if (a && typeof a === "object") {
    if (!b || typeof b !== "object") return fail("de.yml / en.yml", `"${path}" hat unterschiedlichen Aufbau.`);
    for (const k of Object.keys(a)) if (!(k in b)) fail("en.yml", `"${path ? path + "." : ""}${k}" fehlt (ist in de.yml vorhanden).`);
    for (const k of Object.keys(b)) if (!(k in a)) fail("de.yml", `"${path ? path + "." : ""}${k}" fehlt (ist in en.yml vorhanden).`);
    for (const k of Object.keys(a)) if (k in b) compare(a[k], b[k], path ? `${path}.${k}` : k);
    return;
  }
  if (a === null || a === undefined) fail("de.yml", `"${path}" ist leer. Für "kein Text" bitte "" schreiben.`);
  if (b === null || b === undefined) fail("en.yml", `"${path}" ist leer. Für "kein Text" bitte "" schreiben.`);
}

const site = load("site.yml");
const de = load("de.yml");
const en = load("en.yml");
const waves = load("waves.yml");

if (de && en) {
  compare(de, en, "");
  // prices must be the same in both languages
  de.treatments?.items?.forEach((item, i) => item.prices?.forEach((p, j) => {
    const other = en.treatments?.items?.[i]?.prices?.[j]?.price;
    if (other !== undefined && String(p.price) !== String(other))
      fail("de.yml / en.yml", `Preis bei "${item.tab}" unterscheidet sich: ${p.price} (Deutsch) gegen ${other} (Englisch).`);
  }));
  if (de.rhythmen?.qualities?.length !== 5) fail("de.yml", "rhythmen.qualities braucht genau 5 Einträge.");
  if (en.rhythmen?.qualities?.length !== 5) fail("en.yml", "rhythmen.qualities braucht genau 5 Einträge.");
}

if (site) {
  for (const key of ["name", "practice", "url", "email", "maps_query"]) if (!site[key]) fail("site.yml", `"${key}" fehlt.`);
  if (site.booking_url && !/^https:\/\/\S+$/.test(site.booking_url))
    fail("site.yml", `"booking_url" muss mit https:// beginnen (oder leer sein, solange Calendly noch nicht eingerichtet ist).`);
  for (const key of ["phone", "mobile"]) if (!site[key]?.display || !site[key]?.tel) fail("site.yml", `"${key}" braucht "display" und "tel".`);
  if (de && site.treatments?.length !== de.treatments?.items?.length)
    fail("site.yml", `"treatments" hat ${site.treatments?.length} Einträge, de.yml aber ${de.treatments?.items?.length} Behandlungen.`);
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{1,2}[.:]\d{2} ?[–-] ?\d{1,2}[.:]\d{2}$/;
if (waves) {
  if (!Array.isArray(waves.series)) fail("waves.yml", '"series" fehlt oder ist keine Liste.');
  waves.series?.forEach((s, i) => {
    const name = s?.title?.de || `Eintrag ${i + 1}`;
    for (const k of ["title", "info"]) if (!s?.[k]?.de || !s?.[k]?.en) fail("waves.yml", `${name}: "${k}" braucht "de" und "en".`);
    (s?.dates || []).forEach((d, j) => {
      const where = `${name}, Termin ${j + 1}`;
      if (!DATE.test(String(d?.date)) || Number.isNaN(Date.parse(d.date)))
        fail("waves.yml", `${where}: Datum "${d?.date}" bitte als JJJJ-MM-TT schreiben, z. B. 2026-11-22.`);
      if (!TIME.test(String(d?.time)))
        fail("waves.yml", `${where}: Uhrzeit "${d?.time}" bitte wie 15.00 – 17.00 schreiben.`);
    });
  });
  (waves.budget || []).forEach((b, i) => { if (!b?.de || !b?.en) fail("waves.yml", `budget ${i + 1} braucht "de" und "en".`); });
}

if (errors.length) {
  console.error(`\nDie Website wurde NICHT aktualisiert. Bitte korrigieren:\n\n${errors.join("\n")}\n`);
  process.exit(1);
}
console.log("✓ Inhalte geprüft, alles in Ordnung.");
