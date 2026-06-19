/*
 * Hostera — Wine Profile Knowledge Base
 * ------------------------------------------------------------------
 * Sommelier-grade taste profiles keyed by primary grape variety.
 * Each wine's PROFILE (Body / Acidity / Sweetness / Texture / Tannins)
 * is resolved per-wine from its `grape` field — no manual data entry
 * required — yet any value filled in the Google Sheet still overrides.
 *
 * Resolution order (see getWineProfile in index.html):
 *   1. Explicit cell in the sheet  (body / acidity / ... columns)
 *   2. Grape variety match here    (this file)
 *   3. Section preset fallback     (SECTION_PROFILES below)
 *
 * Scale: 0–100 (marker position, left → right).
 * tannins: only rendered for red wines.
 * textureLabel: [leftWord, rightWord] for the Texture axis.
 */
(function () {
  'use strict';

  // Texture word-pairs by family — reds feel "Smooth → Firm",
  // everything else "Crisp → Creamy".
  var TX_RED = ['Smooth', 'Firm'];
  var TX_WHITE = ['Crisp', 'Creamy'];

  // Primary-grape profiles. Blends resolve to their FIRST listed grape.
  var GRAPES = {
    // ---- Whites ------------------------------------------------------
    'chardonnay':        { body: 62, acidity: 55, sweetness: 12, texture: 70, textureLabel: TX_WHITE },
    'sauvignon blanc':   { body: 32, acidity: 80, sweetness: 10, texture: 24, textureLabel: TX_WHITE },
    'riesling':          { body: 34, acidity: 84, sweetness: 42, texture: 28, textureLabel: TX_WHITE },
    'pinot grigio':      { body: 38, acidity: 62, sweetness: 12, texture: 34, textureLabel: TX_WHITE },
    'pinot gris':        { body: 50, acidity: 55, sweetness: 22, texture: 50, textureLabel: TX_WHITE },
    'viognier':          { body: 66, acidity: 44, sweetness: 18, texture: 66, textureLabel: TX_WHITE },
    'chenin blanc':      { body: 48, acidity: 70, sweetness: 28, texture: 46, textureLabel: TX_WHITE },
    'gewurztraminer':    { body: 62, acidity: 38, sweetness: 36, texture: 62, textureLabel: TX_WHITE },
    'gruner veltliner':  { body: 44, acidity: 72, sweetness: 10, texture: 36, textureLabel: TX_WHITE },
    'albarino':          { body: 40, acidity: 76, sweetness: 8,  texture: 30, textureLabel: TX_WHITE },
    'arneis':            { body: 46, acidity: 56, sweetness: 10, texture: 44, textureLabel: TX_WHITE },
    'pinot blanc':       { body: 44, acidity: 58, sweetness: 10, texture: 42, textureLabel: TX_WHITE },
    'pinot bianco':      { body: 44, acidity: 58, sweetness: 10, texture: 42, textureLabel: TX_WHITE },
    'semillon':          { body: 56, acidity: 50, sweetness: 22, texture: 56, textureLabel: TX_WHITE },
    'vermentino':        { body: 42, acidity: 66, sweetness: 10, texture: 36, textureLabel: TX_WHITE },
    'rolle':             { body: 42, acidity: 66, sweetness: 10, texture: 36, textureLabel: TX_WHITE },
    'grechetto':         { body: 46, acidity: 60, sweetness: 10, texture: 42, textureLabel: TX_WHITE },
    'fiano':             { body: 52, acidity: 58, sweetness: 12, texture: 50, textureLabel: TX_WHITE },
    'verdejo':           { body: 44, acidity: 70, sweetness: 10, texture: 36, textureLabel: TX_WHITE },
    'macabeo':           { body: 42, acidity: 62, sweetness: 12, texture: 38, textureLabel: TX_WHITE },
    'xarel·lo':          { body: 46, acidity: 66, sweetness: 10, texture: 40, textureLabel: TX_WHITE },
    'garganega':         { body: 44, acidity: 64, sweetness: 12, texture: 42, textureLabel: TX_WHITE },
    'cortese':           { body: 40, acidity: 70, sweetness: 8,  texture: 34, textureLabel: TX_WHITE },
    'auxerrois':         { body: 44, acidity: 58, sweetness: 12, texture: 42, textureLabel: TX_WHITE },
    'friulano':          { body: 48, acidity: 60, sweetness: 10, texture: 46, textureLabel: TX_WHITE },
    'roussanne':         { body: 58, acidity: 50, sweetness: 12, texture: 58, textureLabel: TX_WHITE },
    'grenache blanc':    { body: 56, acidity: 52, sweetness: 10, texture: 54, textureLabel: TX_WHITE },
    'aligote':           { body: 40, acidity: 74, sweetness: 8,  texture: 34, textureLabel: TX_WHITE },
    'furmint':           { body: 50, acidity: 76, sweetness: 24, texture: 46, textureLabel: TX_WHITE },
    'carricante':        { body: 46, acidity: 72, sweetness: 8,  texture: 42, textureLabel: TX_WHITE },
    'catarratto':        { body: 46, acidity: 60, sweetness: 10, texture: 44, textureLabel: TX_WHITE },
    'kerner':            { body: 42, acidity: 70, sweetness: 14, texture: 38, textureLabel: TX_WHITE },
    'sylvaner':          { body: 40, acidity: 64, sweetness: 12, texture: 38, textureLabel: TX_WHITE },
    'muscadelle':        { body: 48, acidity: 52, sweetness: 30, texture: 48, textureLabel: TX_WHITE },
    'turbiana':          { body: 46, acidity: 66, sweetness: 10, texture: 44, textureLabel: TX_WHITE },
    'trebbiano':         { body: 42, acidity: 66, sweetness: 8,  texture: 38, textureLabel: TX_WHITE },
    'mtsvane kakhuri':   { body: 50, acidity: 62, sweetness: 10, texture: 50, textureLabel: TX_WHITE },
    'goruli mtsvane':    { body: 48, acidity: 62, sweetness: 10, texture: 46, textureLabel: TX_WHITE },
    'zibibbo':           { body: 40, acidity: 50, sweetness: 60, texture: 40, textureLabel: TX_WHITE },

    // ---- Aromatic / sweet whites ------------------------------------
    'moscato bianco':    { body: 34, acidity: 52, sweetness: 76, texture: 36, textureLabel: TX_WHITE },
    'muscat':            { body: 34, acidity: 52, sweetness: 76, texture: 36, textureLabel: TX_WHITE },
    'glera':             { body: 30, acidity: 66, sweetness: 30, texture: 28, textureLabel: TX_WHITE },

    // ---- Reds (tannins active) --------------------------------------
    'pinot noir':        { body: 46, acidity: 66, sweetness: 10, texture: 40, tannins: 36, textureLabel: TX_RED },
    'pinot meunier':     { body: 44, acidity: 64, sweetness: 10, texture: 40, tannins: 38, textureLabel: TX_RED },
    'cabernet sauvignon':{ body: 86, acidity: 50, sweetness: 8,  texture: 80, tannins: 86, textureLabel: TX_RED },
    'merlot':            { body: 64, acidity: 46, sweetness: 12, texture: 64, tannins: 54, textureLabel: TX_RED },
    'cabernet franc':    { body: 60, acidity: 60, sweetness: 10, texture: 58, tannins: 60, textureLabel: TX_RED },
    'petit verdot':      { body: 82, acidity: 52, sweetness: 8,  texture: 78, tannins: 84, textureLabel: TX_RED },
    'sangiovese':        { body: 60, acidity: 76, sweetness: 8,  texture: 62, tannins: 70, textureLabel: TX_RED },
    'nebbiolo':          { body: 64, acidity: 78, sweetness: 6,  texture: 68, tannins: 92, textureLabel: TX_RED },
    'syrah':             { body: 80, acidity: 50, sweetness: 10, texture: 76, tannins: 76, textureLabel: TX_RED },
    'shiraz':            { body: 82, acidity: 48, sweetness: 12, texture: 78, tannins: 74, textureLabel: TX_RED },
    'grenache':          { body: 64, acidity: 48, sweetness: 16, texture: 60, tannins: 50, textureLabel: TX_RED },
    'garnacha':          { body: 64, acidity: 48, sweetness: 16, texture: 60, tannins: 50, textureLabel: TX_RED },
    'tempranillo':       { body: 66, acidity: 56, sweetness: 10, texture: 62, tannins: 64, textureLabel: TX_RED },
    'tinta de toro':     { body: 80, acidity: 54, sweetness: 10, texture: 74, tannins: 80, textureLabel: TX_RED },
    'zinfandel':         { body: 76, acidity: 50, sweetness: 18, texture: 70, tannins: 58, textureLabel: TX_RED },
    'malbec':            { body: 76, acidity: 50, sweetness: 12, texture: 72, tannins: 70, textureLabel: TX_RED },
    'montepulciano':     { body: 66, acidity: 56, sweetness: 10, texture: 62, tannins: 60, textureLabel: TX_RED },
    'barbera':           { body: 56, acidity: 82, sweetness: 8,  texture: 54, tannins: 44, textureLabel: TX_RED },
    'sagrantino':        { body: 82, acidity: 60, sweetness: 8,  texture: 78, tannins: 96, textureLabel: TX_RED },
    'mourvedre':         { body: 76, acidity: 50, sweetness: 10, texture: 72, tannins: 78, textureLabel: TX_RED },
    'cinsault':          { body: 48, acidity: 58, sweetness: 12, texture: 46, tannins: 36, textureLabel: TX_RED },
    'graciano':          { body: 70, acidity: 66, sweetness: 8,  texture: 64, tannins: 76, textureLabel: TX_RED },
    'tavkveri':          { body: 50, acidity: 66, sweetness: 8,  texture: 50, tannins: 44, textureLabel: TX_RED },
    'lambrusco salamino':{ body: 48, acidity: 64, sweetness: 30, texture: 46, tannins: 38, textureLabel: TX_RED },
    'corvina':           { body: 56, acidity: 64, sweetness: 12, texture: 54, tannins: 50, textureLabel: TX_RED },
    'nero d\'avola':      { body: 72, acidity: 56, sweetness: 10, texture: 68, tannins: 66, textureLabel: TX_RED },
    'touriga nacional':  { body: 80, acidity: 58, sweetness: 10, texture: 74, tannins: 80, textureLabel: TX_RED },
    'primitivo':         { body: 76, acidity: 50, sweetness: 18, texture: 70, tannins: 60, textureLabel: TX_RED },
    'negroamaro':        { body: 70, acidity: 56, sweetness: 12, texture: 66, tannins: 64, textureLabel: TX_RED },
    'nerello mascalese': { body: 58, acidity: 70, sweetness: 8,  texture: 56, tannins: 64, textureLabel: TX_RED },
    'petite sirah':      { body: 88, acidity: 52, sweetness: 8,  texture: 82, tannins: 90, textureLabel: TX_RED },
    'gamay':             { body: 42, acidity: 70, sweetness: 10, texture: 40, tannins: 34, textureLabel: TX_RED },
    'saperavi':          { body: 78, acidity: 64, sweetness: 10, texture: 72, tannins: 78, textureLabel: TX_RED },
    'cannonau':          { body: 66, acidity: 50, sweetness: 14, texture: 62, tannins: 54, textureLabel: TX_RED },
    'groppello':         { body: 52, acidity: 60, sweetness: 10, texture: 50, tannins: 46, textureLabel: TX_RED },
    'susumaniello':      { body: 64, acidity: 60, sweetness: 10, texture: 60, tannins: 60, textureLabel: TX_RED },
    'areni':             { body: 56, acidity: 62, sweetness: 10, texture: 54, tannins: 52, textureLabel: TX_RED },
    'brachetto':         { body: 38, acidity: 58, sweetness: 64, texture: 40, tannins: 30, textureLabel: TX_RED }
  };

  // Aliases → canonical key above. Lets the sheet stay free-form.
  var ALIASES = {
    'gewürztraminer': 'gewurztraminer',
    'grüner veltliner': 'gruner veltliner',
    'albariño': 'albarino',
    'alvarinho': 'albarino',
    'mourvèdre': 'mourvedre',
    'sémillon': 'semillon',
    'aligoté': 'aligote',
    'meunier': 'pinot meunier',
    'budeshuri saperavi': 'saperavi',
    'asuretuli shavi': 'saperavi',
    'tinta de toro': 'tinta de toro',
    'pinot grigio / pinot gris': 'pinot grigio',
    'glera (prosecco)': 'glera',
    // Muscat family → shared aromatic-sweet profile
    'muscat blanc à petits grains': 'muscat',
    'muscat de frontignan': 'muscat',
    'muscat d\'alexandrie': 'muscat',
    'muscat ottonel': 'muscat',
    'moscato nero': 'muscat',
    'trebbiano di soave': 'turbiana',
    'trebbiano spoletino': 'trebbiano'
  };

  // Section presets — last-resort fallback when grape is unknown/empty.
  var SECTION_PROFILES = {
    red:       { body: 72, acidity: 55, sweetness: 12, texture: 72, tannins: 62, textureLabel: TX_RED },
    sparkling: { body: 30, acidity: 72, sweetness: 22, texture: 28, textureLabel: TX_WHITE },
    rose:      { body: 42, acidity: 60, sweetness: 18, texture: 40, textureLabel: TX_WHITE },
    dessert:   { body: 62, acidity: 40, sweetness: 82, texture: 60, textureLabel: TX_WHITE },
    white:     { body: 38, acidity: 64, sweetness: 12, texture: 36, textureLabel: TX_WHITE }
  };

  // Normalize a raw grape string → canonical lookup key (first grape of a blend).
  function normalizeGrape(raw) {
    var s = String(raw || '')
      .replace(/ /g, ' ')
      .split(/[,/+]/)[0]   // primary grape of a blend
      .trim()
      .toLowerCase();
    if (!s) return '';
    if (ALIASES[s]) return ALIASES[s];
    return s;
  }

  // Resolve { body, acidity, sweetness, texture, [tannins], textureLabel }.
  function resolveProfile(grape, sectionKey) {
    var key = normalizeGrape(grape);
    if (key && GRAPES[key]) return GRAPES[key];

    var sk = String(sectionKey || '').toLowerCase();
    if (sk.includes('sparkling') || sk.includes('champagne')) return SECTION_PROFILES.sparkling;
    if (sk.includes('rose')) return SECTION_PROFILES.rose;
    if (sk.includes('dessert')) return SECTION_PROFILES.dessert;
    if (sk.includes('red')) return SECTION_PROFILES.red;
    return SECTION_PROFILES.white;
  }

  window.WineProfiles = {
    resolve: resolveProfile,
    normalizeGrape: normalizeGrape,
    GRAPES: GRAPES,
    SECTION_PROFILES: SECTION_PROFILES
  };
})();
