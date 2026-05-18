// Fallback ingredient table for /api/nutrition/estimate when the
// Anthropic API key is missing or the call fails. Per-100g macros.
//
// Matching is keyword-based: longest substring match wins. Parses
// `(\d+)g\s+<name>` patterns first, then optional bare ingredient
// names without explicit grams. For matches without grams, the
// item's `defaultG` is used.
//
// Sources: USDA + Colombian nutrition references, rounded.

const TABLE = [
  // proteins
  { keys: ["chicken breast", "pechuga"],          kcal:165, p:31, c:0,  f:4,  defaultG: 150 },
  { keys: ["beef sirloin", "sirloin"],            kcal:158, p:27, c:0,  f:5,  defaultG: 150 },
  { keys: ["ground beef", "lean ground beef"],    kcal:217, p:26, c:0,  f:12, defaultG: 150 },
  { keys: ["pork loin", "lomo de cerdo"],         kcal:143, p:26, c:0,  f:4,  defaultG: 150 },
  { keys: ["whole eggs", "eggs", "huevos"],       kcal:155, p:13, c:1,  f:11, defaultG: 100 },
  { keys: ["egg whites", "claras"],               kcal:52,  p:11, c:1,  f:0,  defaultG: 100 },
  { keys: ["salmon", "salmón"],                   kcal:206, p:22, c:0,  f:13, defaultG: 150 },
  { keys: ["tuna canned", "tuna", "atún"],        kcal:116, p:26, c:0,  f:1,  defaultG: 100 },
  { keys: ["greek yogurt", "yogurt griego"],      kcal:59,  p:10, c:4,  f:0,  defaultG: 170 },
  { keys: ["cottage cheese", "queso cottage"],    kcal:84,  p:11, c:5,  f:2,  defaultG: 100 },
  { keys: ["whey protein", "whey", "suero"],      kcal:380, p:80, c:8,  f:3,  defaultG: 30  },

  // carbs
  { keys: ["brown rice", "arroz integral"],        kcal:111, p:3,  c:23, f:1,  defaultG: 150 },
  { keys: ["white rice", "arroz blanco", "arroz", "rice"], kcal:130, p:3, c:28, f:0, defaultG: 150 },
  { keys: ["oats", "avena", "oatmeal"],            kcal:379, p:13, c:67, f:7,  defaultG: 50  },
  { keys: ["sweet potato", "batata", "boniato"],   kcal:90,  p:2,  c:21, f:0,  defaultG: 200 },
  { keys: ["potato", "papa"],                      kcal:87,  p:2,  c:20, f:0,  defaultG: 200 },
  { keys: ["pasta"],                               kcal:158, p:6,  c:31, f:1,  defaultG: 200 },
  { keys: ["whole wheat bread", "bread", "pan"],   kcal:247, p:13, c:41, f:4,  defaultG: 30  },
  { keys: ["black beans", "frijoles"],             kcal:132, p:9,  c:24, f:1,  defaultG: 150 },
  { keys: ["lentils", "lentejas"],                 kcal:116, p:9,  c:20, f:0,  defaultG: 150 },

  // Colombian
  { keys: ["arepa"],                               kcal:220, p:5,  c:40, f:4,  defaultG: 80  },
  { keys: ["plantain ripe", "maduro", "plátano maduro"],       kcal:122, p:1, c:32, f:0,  defaultG: 120 },
  { keys: ["plantain green", "patacón", "patacones", "plantain"], kcal:215, p:1.5, c:32, f:9, defaultG: 100 },
  { keys: ["yuca", "cassava"],                     kcal:191, p:1,  c:46, f:0,  defaultG: 150 },
  { keys: ["sobrebarriga"],                        kcal:220, p:25, c:0,  f:13, defaultG: 150 },
  { keys: ["bocadillo"],                           kcal:343, p:1,  c:87, f:0,  defaultG: 25  },
  { keys: ["pandebono"],                           kcal:350, p:10, c:35, f:18, defaultG: 50  },
  { keys: ["empanada"],                            kcal:350, p:12, c:30, f:20, defaultG: 50  },

  // fats
  { keys: ["avocado", "aguacate"],                 kcal:160, p:2,  c:9,  f:15, defaultG: 100 },
  { keys: ["olive oil", "aceite de oliva"],        kcal:884, p:0,  c:0,  f:100, defaultG: 14 },
  { keys: ["almonds", "almendras"],                kcal:579, p:21, c:22, f:50, defaultG: 30  },
  { keys: ["peanut butter", "mantequilla de maní"],kcal:588, p:25, c:20, f:50, defaultG: 32  },
  { keys: ["cheese", "queso"],                     kcal:350, p:25, c:3,  f:27, defaultG: 30  },

  // misc
  { keys: ["banana", "banano"],                    kcal:89,  p:1,  c:23, f:0,  defaultG: 120 },
  { keys: ["apple", "manzana"],                    kcal:52,  p:0,  c:14, f:0,  defaultG: 150 },
  { keys: ["salad", "lettuce", "spinach", "kale", "ensalada"], kcal:15, p:1, c:2, f:0, defaultG: 100 },
  { keys: ["tomato", "tomate"],                    kcal:18,  p:1,  c:4,  f:0,  defaultG: 100 },
  { keys: ["broccoli", "brócoli"],                 kcal:35,  p:2,  c:7,  f:0,  defaultG: 100 },
];

// Default macros by meal slot when nothing parseable is found.
const SLOT_DEFAULTS = {
  breakfast:   { calories: 400, proteinG: 25, carbsG: 45, fatG: 12 },
  preTraining: { calories: 200, proteinG: 10, carbsG: 30, fatG: 4  },
  lunch:       { calories: 600, proteinG: 40, carbsG: 60, fatG: 15 },
  snack:       { calories: 250, proteinG: 15, carbsG: 25, fatG: 8  },
  dinner:      { calories: 550, proteinG: 40, carbsG: 50, fatG: 15 },
  optional:    { calories: 300, proteinG: 15, carbsG: 30, fatG: 10 },
};

function normalize(text) {
  return (text || "").toString().toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Find the best ingredient match for a substring. Longest matching key wins.
 * Returns the item record or null.
 */
function findIngredient(fragment) {
  const f = normalize(fragment);
  let best = null;
  let bestLen = 0;
  for (const item of TABLE) {
    for (const key of item.keys) {
      if (f.includes(key) && key.length > bestLen) {
        best = item;
        bestLen = key.length;
      }
    }
  }
  return best;
}

/**
 * Parse text into list of { item, grams }. Handles:
 *   "200g chicken breast"
 *   "200 g chicken breast"
 *   "chicken breast"            ← no grams, uses item.defaultG
 *   comma-separated items
 */
function parseItems(text) {
  const t = normalize(text);
  if (!t) return [];

  const fragments = t.split(/,|\band\b|\+|\bwith\b/i).map((s) => s.trim()).filter(Boolean);
  const items = [];

  for (const frag of fragments) {
    // Try to extract grams from the fragment.
    const gMatch = frag.match(/(\d+(?:\.\d+)?)\s*g\b/);
    const grams = gMatch ? Number(gMatch[1]) : null;
    // Strip the gram clause for ingredient matching.
    const cleaned = frag.replace(/(\d+(?:\.\d+)?)\s*g\b/, "").trim();

    const item = findIngredient(cleaned);
    if (item) {
      items.push({ item, grams: grams != null ? grams : item.defaultG, gramsExplicit: grams != null });
    }
  }

  return items;
}

export function estimateFromText({ text, mealSlot }) {
  const items = parseItems(text);

  if (items.length === 0) {
    const def = SLOT_DEFAULTS[mealSlot] || SLOT_DEFAULTS.lunch;
    return { ...def, confidence: "low" };
  }

  let calories = 0, proteinG = 0, carbsG = 0, fatG = 0;
  let allGramsExplicit = true;

  for (const { item, grams, gramsExplicit } of items) {
    const factor = grams / 100;
    calories += item.kcal * factor;
    proteinG += item.p    * factor;
    carbsG   += item.c    * factor;
    fatG     += item.f    * factor;
    if (!gramsExplicit) allGramsExplicit = false;
  }

  // Fallback never goes "high" — that's reserved for the AI path. "med" if we
  // identified at least one ingredient (with or without explicit grams),
  // "low" only when we matched nothing.
  const confidence = items.length >= 1 ? "med" : "low";

  return {
    calories: Math.round(calories / 10) * 10,
    proteinG: Math.round(proteinG),
    carbsG:   Math.round(carbsG),
    fatG:     Math.round(fatG),
    confidence,
  };
}
