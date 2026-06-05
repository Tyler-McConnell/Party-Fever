import type { InventoryItem, LiquorType } from "./store";
import { shotsOf } from "./store";

export interface Recipe {
  name: string;
  emoji: string;
  glass: string;
  /** required liquor categories (one of) */
  liquor: LiquorType[];
  /** required mixer keywords (all of) */
  mixers: string[];
  instructions: string;
}

export const RECIPES: Recipe[] = [
  { name: "Vodka Cranberry", emoji: "🍸", glass: "Highball", liquor: ["Vodka"], mixers: ["cranberry"], instructions: "Pour vodka over ice, top with cranberry juice, stir." },
  { name: "Rum & Coke", emoji: "🥤", glass: "Highball", liquor: ["Rum"], mixers: ["coke","cola"], instructions: "Pour rum over ice, top with Coke, stir." },
  { name: "Vodka Sprite", emoji: "🥤", glass: "Highball", liquor: ["Vodka"], mixers: ["sprite"], instructions: "Pour vodka over ice, top with Sprite, stir." },
  { name: "Whiskey Ginger", emoji: "🥃", glass: "Highball", liquor: ["Whiskey"], mixers: ["ginger"], instructions: "Pour whiskey over ice, top with ginger ale, stir." },
  { name: "Screwdriver", emoji: "🍊", glass: "Highball", liquor: ["Vodka"], mixers: ["orange"], instructions: "Pour vodka over ice, top with orange juice, stir." },
  { name: "Moscow Mule", emoji: "🥃", glass: "Copper mug", liquor: ["Vodka"], mixers: ["ginger","lime"], instructions: "Vodka and lime juice over ice, top with ginger beer." },
  { name: "Tequila Sunrise", emoji: "🌅", glass: "Highball", liquor: ["Tequila"], mixers: ["orange","grenadine"], instructions: "Tequila + OJ over ice, slowly add grenadine." },
  { name: "Cuba Libre", emoji: "🍋", glass: "Highball", liquor: ["Rum"], mixers: ["coke","cola","lime"], instructions: "Rum + lime juice over ice, top with Coke." },
  { name: "Gin & Tonic", emoji: "🍸", glass: "Highball", liquor: ["Gin"], mixers: ["tonic"], instructions: "Pour gin over ice, top with tonic water." },
  { name: "Jack & Coke", emoji: "🥃", glass: "Highball", liquor: ["Whiskey"], mixers: ["coke","cola"], instructions: "Whiskey over ice, top with Coke." },
  { name: "Vodka Soda", emoji: "🥤", glass: "Highball", liquor: ["Vodka"], mixers: ["soda","club"], instructions: "Vodka over ice, top with club soda." },
  { name: "Cape Cod", emoji: "🍷", glass: "Highball", liquor: ["Vodka"], mixers: ["cranberry"], instructions: "Vodka over ice with cranberry juice." },
  { name: "Greyhound", emoji: "🍹", glass: "Highball", liquor: ["Vodka"], mixers: ["grapefruit"], instructions: "Vodka over ice, top with grapefruit juice." },
  { name: "Sea Breeze", emoji: "🌊", glass: "Highball", liquor: ["Vodka"], mixers: ["cranberry","grapefruit"], instructions: "Vodka, cranberry, grapefruit over ice." },
  { name: "Bay Breeze", emoji: "🏖️", glass: "Highball", liquor: ["Vodka"], mixers: ["cranberry","pineapple"], instructions: "Vodka, cranberry, pineapple over ice." },
  { name: "Malibu Pineapple", emoji: "🍍", glass: "Highball", liquor: ["Rum"], mixers: ["pineapple"], instructions: "Malibu rum over ice, top with pineapple juice." },
  { name: "Vodka Red Bull", emoji: "⚡", glass: "Highball", liquor: ["Vodka"], mixers: ["red bull","energy"], instructions: "Vodka over ice, top with Red Bull." },
  { name: "Tequila Soda", emoji: "🥤", glass: "Highball", liquor: ["Tequila"], mixers: ["soda","club"], instructions: "Tequila over ice, top with club soda." },
  { name: "Whiskey Sour", emoji: "🍋", glass: "Old Fashioned", liquor: ["Whiskey"], mixers: ["lemon","syrup"], instructions: "Shake with ice and strain." },
  { name: "Tom Collins", emoji: "🍸", glass: "Collins", liquor: ["Gin"], mixers: ["lemon","syrup","soda"], instructions: "Build over ice, top with club soda." },
  { name: "Paloma", emoji: "🍹", glass: "Highball", liquor: ["Tequila"], mixers: ["grapefruit","soda"], instructions: "Pour over ice and stir." },
  { name: "Margarita", emoji: "🍹", glass: "Rocks", liquor: ["Tequila"], mixers: ["lime","triple sec"], instructions: "Shake with ice and serve." },
];

function findLiquor(inv: InventoryItem[], type: LiquorType) {
  return inv.find((x) => x.kind === "liquor" && x.type === type && shotsOf(x) > 0);
}
function findMixer(inv: InventoryItem[], keyword: string) {
  return inv.find((x) => x.kind === "mixer" && x.amount > 0 && x.name.toLowerCase().includes(keyword));
}

export interface MatchedRecipe {
  recipe: Recipe;
  liquorIds: string[];
  mixerIds: string[];
  missing: string[];
}

export function matchRecipes(inventory: InventoryItem[]) {
  const possible: MatchedRecipe[] = [];
  const almost: MatchedRecipe[] = [];
  for (const r of RECIPES) {
    const liquorMatches = r.liquor.map((t) => findLiquor(inventory, t)).filter(Boolean) as InventoryItem[];
    const mixerMatches = r.mixers.map((m) => findMixer(inventory, m));
    const missing: string[] = [];
    if (liquorMatches.length < r.liquor.length) {
      r.liquor.forEach((t) => {
        if (!findLiquor(inventory, t)) missing.push(t);
      });
    }
    r.mixers.forEach((m, idx) => { if (!mixerMatches[idx]) missing.push(m); });

    const entry: MatchedRecipe = {
      recipe: r,
      liquorIds: liquorMatches.map((x) => x.id),
      mixerIds: mixerMatches.filter(Boolean).map((x) => x!.id),
      missing,
    };
    if (missing.length === 0) possible.push(entry);
    else if (missing.length <= 2) almost.push(entry);
  }
  return { possible, almost };
}
