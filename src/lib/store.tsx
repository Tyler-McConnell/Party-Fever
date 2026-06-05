import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const ML_PER_SHOT = 44;

export type ItemKind = "beer" | "liquor" | "mixer";

export const LIQUOR_TYPES = [
  "Vodka", "Rum", "Whiskey", "Tequila", "Gin", "Brandy", "Liqueur", "Unknown",
] as const;
export type LiquorType = (typeof LIQUOR_TYPES)[number];

const liquorTypeKeywords: Record<Exclude<LiquorType, "Unknown">, string[]> = {
  Vodka: ["vodka", "tito", "grey goose", "absolut", "svedka", "smirnoff", "ketel one"],
  Rum: ["rum", "bacardi", "captain morgan", "malibu", "kraken"],
  Whiskey: ["whiskey", "whisky", "bourbon", "jack daniels", "jack", "jameson", "crown royal", "fireball", "jim beam"],
  Tequila: ["tequila", "patron", "cuervo", "don julio", "casamigos", "hornitos"],
  Gin: ["gin", "tanqueray", "bombay", "hendrick"],
  Brandy: ["brandy", "hennessy", "cognac", "courvoisier"],
  Liqueur: ["baileys", "kahlua", "triple sec", "blue curacao", "amaretto", "schnapps"],
};

const liquorBrandKeywords: Record<string, string[]> = {
  "Tito's": ["tito"], "Grey Goose": ["grey goose"], "Absolut": ["absolut"],
  "Svedka": ["svedka"], "Smirnoff": ["smirnoff"], "Ketel One": ["ketel one"],
  "Bacardi": ["bacardi"], "Captain Morgan": ["captain morgan"], "Malibu": ["malibu"], "Kraken": ["kraken"],
  "Jack Daniels": ["jack daniels", "jack"], "Jameson": ["jameson"], "Crown Royal": ["crown royal"],
  "Fireball": ["fireball"], "Jim Beam": ["jim beam"], "Patron": ["patron"], "Jose Cuervo": ["cuervo"],
  "Don Julio": ["don julio"], "Casamigos": ["casamigos"], "Hornitos": ["hornitos"],
  "Tanqueray": ["tanqueray"], "Bombay": ["bombay"], "Hendrick's": ["hendrick"],
  "Hennessy": ["hennessy"], "Courvoisier": ["courvoisier"], "Baileys": ["baileys"],
  "Kahlua": ["kahlua"], "Triple Sec": ["triple sec"], "Blue Curacao": ["blue curacao"], "Amaretto": ["amaretto"],
};

export function detectLiquorType(name: string): LiquorType {
  const n = name.toLowerCase();
  for (const t of Object.keys(liquorTypeKeywords) as Exclude<LiquorType, "Unknown">[]) {
    if (liquorTypeKeywords[t].some((k) => n.includes(k))) return t;
  }
  return "Unknown";
}
export function detectLiquorBrand(name: string): string {
  const n = name.toLowerCase();
  for (const b in liquorBrandKeywords) {
    if (liquorBrandKeywords[b].some((k) => n.includes(k))) return b;
  }
  return "Unknown Brand";
}

export interface InventoryItem {
  id: string;
  name: string;
  kind: ItemKind;
  /** beer/mixer: count; liquor: bottle size (mL) */
  amount: number;
  /** liquor only */
  mlRemaining?: number;
  bottleMl?: number;
  type?: LiquorType;
  brand?: string;
  favorite?: boolean;
}

export type Strength = "light" | "normal" | "strong" | "toForget";
export const STRENGTH_OPTS: Record<Strength, { label: string; mult: number }> = {
  light:    { label: "🧊 Light",    mult: 0.5 },
  normal:   { label: "🍹 Normal",   mult: 1   },
  strong:   { label: "🔥 Strong",   mult: 1.5 },
  toForget: { label: "💀 To Forget", mult: 2.5 },
};

export interface MadeDrink {
  id: string;
  name: string;
  at: number;
  strength: Strength;
}

export interface ShoppingItem { name: string; completed: boolean }

interface State {
  inventory: InventoryItem[];
  drinks: MadeDrink[];
  shopping: ShoppingItem[];
  partyMode: boolean;
  drinksMade: number;
  toForgetOrders: number;
}

interface Ctx extends State {
  addItem: (input: { name: string; kind: ItemKind; amount: number }) => void;
  removeItem: (id: string) => void;
  adjustAmount: (id: string, delta: number) => void;
  adjustShots: (id: string, deltaShots: number) => void;
  setLiquorType: (id: string, type: LiquorType) => void;
  setLiquorBrand: (id: string, brand: string) => void;
  toggleFav: (id: string) => void;
  logDrink: (d: { name: string; strength: Strength }) => void;
  /** consume liquor (shots) + mixer (1 each) for a recipe */
  pourRecipe: (name: string, liquorIds: string[], mixerIds: string[], strength: Strength) => void;
  addToShopping: (names: string[]) => number;
  toggleShopping: (i: number) => void;
  removeShoppingItem: (i: number) => void;
  clearShoppingCompleted: () => void;
  clearShopping: () => void;
  barIsClosed: () => void;
  setPartyMode: (on: boolean) => void;
  reset: () => void;
}

const KEY = "partyfever:v2";
const StoreCtx = createContext<Ctx | null>(null);

const initial: State = {
  inventory: [], drinks: [], shopping: [],
  partyMode: false, drinksMade: 0, toForgetOrders: 0,
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...initial, ...JSON.parse(raw) });
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  useEffect(() => {
    setState((s) => {
      const low = s.inventory.filter(isLowStock);
      const next = [...s.shopping];
      let changed = false;
      for (const item of low) {
        const name = item.name;
        if (!next.some((y) => y.name.toLowerCase() === name.toLowerCase())) {
          next.push({ name, completed: false });
          changed = true;
        }
      }
      return changed ? { ...s, shopping: next } : s;
    });
  }, [state.inventory]);

  const value: Ctx = {
    ...state,

    addItem: ({ name, kind, amount }) =>
      setState((s) => {
        const base: InventoryItem = {
          id: crypto.randomUUID(),
          name: name.trim(),
          kind,
          amount,
        };
        if (kind === "liquor") {
          base.bottleMl = amount;
          base.mlRemaining = amount;
          base.type = detectLiquorType(name);
          base.brand = detectLiquorBrand(name);
        }
        return { ...s, inventory: [...s.inventory, base] };
      }),

    removeItem: (id) =>
      setState((s) => ({ ...s, inventory: s.inventory.filter((x) => x.id !== id) })),

    adjustAmount: (id, delta) =>
      setState((s) => ({
        ...s,
        inventory: s.inventory.map((x) =>
          x.id === id ? { ...x, amount: Math.max(0, x.amount + delta) } : x
        ),
      })),

    adjustShots: (id, deltaShots) =>
      setState((s) => ({
        ...s,
        inventory: s.inventory.map((x) => {
          if (x.id !== id || x.kind !== "liquor") return x;
          const newMl = Math.max(0, (x.mlRemaining ?? 0) + deltaShots * ML_PER_SHOT);
          return { ...x, mlRemaining: newMl };
        }),
      })),

    setLiquorType: (id, type) =>
      setState((s) => ({
        ...s,
        inventory: s.inventory.map((x) => (x.id === id ? { ...x, type } : x)),
      })),

    setLiquorBrand: (id, brand) =>
      setState((s) => ({
        ...s,
        inventory: s.inventory.map((x) => (x.id === id ? { ...x, brand } : x)),
      })),

    toggleFav: (id) =>
      setState((s) => ({
        ...s,
        inventory: s.inventory.map((x) => (x.id === id ? { ...x, favorite: !x.favorite } : x)),
      })),

    logDrink: (d) =>
      setState((s) => ({
        ...s,
        drinks: [{ ...d, id: crypto.randomUUID(), at: Date.now() }, ...s.drinks].slice(0, 100),
        drinksMade: s.drinksMade + 1,
        toForgetOrders: s.toForgetOrders + (d.strength === "toForget" ? 1 : 0),
      })),

    pourRecipe: (name, liquorIds, mixerIds, strength) =>
      setState((s) => {
        const mult = STRENGTH_OPTS[strength].mult;
        const shotsPerLiquor = liquorIds.length > 0 ? (1.5 * mult) / liquorIds.length : 0;
        const inv = s.inventory.map((x) => {
          if (liquorIds.includes(x.id) && x.kind === "liquor") {
            return { ...x, mlRemaining: Math.max(0, (x.mlRemaining ?? 0) - shotsPerLiquor * ML_PER_SHOT) };
          }
          if (mixerIds.includes(x.id) && x.kind === "mixer") {
            return { ...x, amount: Math.max(0, x.amount - 1) };
          }
          return x;
        });
        return {
          ...s,
          inventory: inv,
          drinks: [{ id: crypto.randomUUID(), name, at: Date.now(), strength }, ...s.drinks].slice(0, 100),
          drinksMade: s.drinksMade + 1,
          toForgetOrders: s.toForgetOrders + (strength === "toForget" ? 1 : 0),
        };
      }),

    addToShopping: (names) => {
      let added = 0;
      setState((s) => {
        const next = [...s.shopping];
        for (const raw of names) {
          const formatted = raw.charAt(0).toUpperCase() + raw.slice(1);
          if (!next.some((x) => x.name.toLowerCase() === formatted.toLowerCase())) {
            next.push({ name: formatted, completed: false });
            added++;
          }
        }
        return { ...s, shopping: next };
      });
      return added;
    },

    toggleShopping: (i) =>
      setState((s) => ({
        ...s,
        shopping: s.shopping.map((x, idx) => (idx === i ? { ...x, completed: !x.completed } : x)),
      })),

    removeShoppingItem: (i) =>
      setState((s) => ({ ...s, shopping: s.shopping.filter((_, idx) => idx !== i) })),

    clearShoppingCompleted: () =>
      setState((s) => ({ ...s, shopping: s.shopping.filter((x) => !x.completed) })),

    clearShopping: () =>
      setState((s) => ({ ...s, shopping: [] })),

    barIsClosed: () =>
      setState((s) => {
        const low = s.inventory.filter((x) => isLowStock(x)).map((x) => x.name);
        const next = [...s.shopping];
        for (const name of low) {
          if (!next.some((y) => y.name.toLowerCase() === name.toLowerCase())) {
            next.push({ name, completed: false });
          }
        }
        return {
          ...s,
          shopping: next,
          drinks: [],
          drinksMade: 0,
          toForgetOrders: 0,
          partyMode: false,
        };
      }),

    setPartyMode: (on) => setState((s) => ({ ...s, partyMode: on })),
    reset: () => setState(initial),
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function shotsOf(item: InventoryItem) {
  if (item.kind !== "liquor") return 0;
  return (item.mlRemaining ?? 0) / ML_PER_SHOT;
}

export function isLowStock(item: InventoryItem) {
  if (item.kind === "beer" || item.kind === "mixer") return item.amount > 0 && item.amount <= 6;
  if (item.kind === "liquor") return shotsOf(item) > 0 && shotsOf(item) <= 6;
  return false;
}

export function totals(items: InventoryItem[]) {
  return {
    beer: items.filter((i) => i.kind === "beer").reduce((a, b) => a + b.amount, 0),
    liquorShots: items.filter((i) => i.kind === "liquor").reduce((a, b) => a + shotsOf(b), 0),
    mixers: items.filter((i) => i.kind === "mixer").reduce((a, b) => a + b.amount, 0),
    lowStock: items.filter(isLowStock).length,
    favorites: items.filter((i) => i.favorite).length,
  };
}

export function partyStatus(drinksMade: number, toForget: number) {
  const score = drinksMade + toForget * 5;
  if (score >= 76) return { emoji: "💀", title: "LEGENDARY NIGHT", message: "Party Fever has lost control." };
  if (score >= 51) return { emoji: "🚀", title: "ABSOLUTE CHAOS", message: "This party has left Earth." };
  if (score >= 26) return { emoji: "🔥", title: "GOOD VIBES", message: "The room is alive." };
  if (score >= 11) return { emoji: "🙂", title: "GETTING STARTED", message: "Things are warming up." };
  return { emoji: "😴", title: "DEAD PARTY", message: "Somebody needs to pour a drink." };
}

export function hangoverForecast(drinksMade: number, toForget: number) {
  const dmg = drinksMade + toForget * 8;
  if (dmg >= 61) return { emoji: "💀", title: "CALL OUT OF WORK", message: "Tomorrow is not happening." };
  if (dmg >= 41) return { emoji: "🤕", title: "RAGING HANGOVER", message: "Stock up on water and regret." };
  if (dmg >= 21) return { emoji: "😵", title: "ROUGH MORNING", message: "You'll survive. Barely." };
  if (dmg >= 6)  return { emoji: "🌤️", title: "MILD AFTERMATH", message: "Coffee will fix this." };
  return { emoji: "☀️", title: "CLEAR SKIES", message: "You'll wake up fine." };
}
