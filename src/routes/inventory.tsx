import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  useStore, totals, shotsOf, isLowStock, LIQUOR_TYPES,
  type ItemKind, type LiquorType,
} from "@/lib/store";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — Party Fever" },
      { name: "description", content: "Track every beer, liquor mL, and mixer in your bar." },
      { property: "og:title", content: "Inventory — Party Fever" },
      { property: "og:description", content: "Track every bottle in your bar." },
    ],
  }),
  component: InventoryPage,
});

function StatCard({ emoji, label, value, accent }: { emoji: string; label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-4 text-center">
      <div className="text-2xl">{emoji}</div>
      <div className="mt-1 font-mono-retro text-base uppercase text-muted-foreground tracking-wider">{label}</div>
      <div className={`mt-1 font-display text-lg ${accent ?? "text-accent"} text-glow-soft`}>{value}</div>
    </div>
  );
}

const helpFor: Record<ItemKind, { placeholder: string; help: string }> = {
  beer: { placeholder: "Number of cans/bottles", help: "Beer: number of cans/bottles." },
  liquor: { placeholder: "Bottle size in mL (ex: 750)", help: "Liquor: bottle size in mL. We auto-detect type, brand, and convert to shots." },
  mixer: { placeholder: "Servings (ex: 10)", help: "Mixers: estimated servings." },
};

function InventoryPage() {
  const {
    inventory, addItem, removeItem, adjustAmount, adjustShots,
    setLiquorType, setLiquorBrand, toggleFav, shopping,
  } = useStore();
  const t = totals(inventory);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<ItemKind>("liquor");
  const [search, setSearch] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    const q = Number(amount);
    if (!n || !Number.isFinite(q) || q <= 0) return;
    addItem({ name: n, kind, amount: q });
    setName(""); setAmount("");
  };

  const groups: { kind: ItemKind; label: string; emoji: string }[] = [
    { kind: "beer", label: "Beer", emoji: "🍺" },
    { kind: "liquor", label: "Liquor", emoji: "🥃" },
    { kind: "mixer", label: "Mixer", emoji: "🥤" },
  ];

  const q = search.trim().toLowerCase();

  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <p className="font-display text-[10px] text-accent">— STAGE 01 —</p>
          <h1 className="mt-3 font-display text-2xl sm:text-3xl text-primary text-glow-soft">INVENTORY</h1>
          <p className="mt-2 font-mono-retro text-xl text-muted-foreground">Stock your bar. Liquor tracked in mL.</p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
          <StatCard emoji="🍺" label="Beer" value={String(t.beer)} />
          <StatCard emoji="🥃" label="Shots" value={t.liquorShots.toFixed(1)} />
          <StatCard emoji="🥤" label="Mixers" value={String(t.mixers)} />
          <StatCard emoji="⚠️" label="Low" value={String(t.lowStock)} accent="text-destructive" />
          <StatCard emoji="⭐" label="Favs" value={String(t.favorites)} accent="text-gold" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <div className="rounded-md border border-border bg-card p-6">
          <h2 className="font-display text-sm text-primary">+ ADD ITEM</h2>
          <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Item name (ex: Tito's Vodka)"
              className="rounded-sm border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number" min="0"
              placeholder={helpFor[kind].placeholder}
              className="rounded-sm border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as ItemKind)}
              className="rounded-sm border border-input bg-background px-3 py-2"
            >
              <option value="beer">🍺 Beer</option>
              <option value="liquor">🥃 Liquor</option>
              <option value="mixer">🥤 Mixer</option>
            </select>
            <button className="rounded-sm bg-primary px-4 py-2 font-display text-xs text-primary-foreground shadow-arcade hover:translate-y-0.5">
              ADD
            </button>
          </form>
          <p className="mt-2 font-mono-retro text-base text-muted-foreground">{helpFor[kind].help}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-8">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search inventory (vodka, coke, beer…)"
          className="w-full rounded-sm border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        {groups.map((g) => {
          let items = inventory.filter((i) => i.kind === g.kind);
          if (q) items = items.filter((i) =>
            i.name.toLowerCase().includes(q) ||
            (i.brand ?? "").toLowerCase().includes(q) ||
            (i.type ?? "").toLowerCase().includes(q)
          );
          return (
            <div key={g.kind}>
              <h3 className="font-display text-sm text-accent mb-3">
                {g.emoji} {g.label.toUpperCase()} <span className="text-muted-foreground">({items.length})</span>
              </h3>
              {items.length === 0 ? (
                <p className="rounded-md border border-dashed border-border p-6 font-mono-retro text-lg text-muted-foreground text-center">
                  {q ? `No matching ${g.label.toLowerCase()}.` : `No ${g.label.toLowerCase()} added yet.`}
                </p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {items.map((item) => {
                    const low = isLowStock(item);
                    const empty = item.kind === "liquor" ? shotsOf(item) <= 0 : item.amount <= 0;
                    return (
                      <li key={item.id} className={`rounded-md border bg-card px-4 py-3 ${empty ? "border-destructive/50" : low ? "border-accent/50" : "border-border"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3 min-w-0">
                            <button onClick={() => toggleFav(item.id)} className="text-xl shrink-0" aria-label="favorite">
                              {item.favorite ? "⭐" : "☆"}
                            </button>
                            <div className="min-w-0">
                              <div className="font-display text-xs text-foreground break-words">{item.name.toUpperCase()}</div>
                              {item.kind === "liquor" ? (
                                <div className="font-mono-retro text-base text-muted-foreground">
                                  {Math.round(item.mlRemaining ?? 0)} mL · {shotsOf(item).toFixed(1)} shots
                                  {item.bottleMl ? <> · bottle {item.bottleMl}mL</> : null}
                                  <br />
                                  <span className="text-foreground/70">{item.brand} · {item.type}</span>
                                  {low && !empty && " · LOW"} {empty && " · OUT"}
                                </div>
                              ) : (
                                <div className="font-mono-retro text-base text-muted-foreground">
                                  {item.amount} {item.kind === "beer" ? "cans/bottles" : "servings"}
                                  {low && !empty && " · LOW"} {empty && " · OUT"}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {item.kind === "liquor" ? (
                              <>
                                <button onClick={() => adjustShots(item.id, -1)} className="h-8 px-2 rounded-sm border border-border hover:bg-muted text-xs">−1 SHOT</button>
                                <button onClick={() => adjustShots(item.id, 1)} className="h-8 w-8 rounded-sm border border-border hover:bg-muted">+</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => adjustAmount(item.id, -1)} className="h-8 w-8 rounded-sm border border-border hover:bg-muted">−</button>
                                <button onClick={() => adjustAmount(item.id, 1)} className="h-8 w-8 rounded-sm border border-border hover:bg-muted">+</button>
                              </>
                            )}
                            <button onClick={() => removeItem(item.id)} className="ml-2 rounded-sm px-2 py-1 text-xs text-destructive hover:bg-destructive/10">✕</button>
                          </div>
                        </div>

                        {item.kind === "liquor" && (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-border pt-3">
                            <label className="font-mono-retro text-sm text-muted-foreground">
                              Type
                              <select
                                value={item.type ?? "Unknown"}
                                onChange={(e) => setLiquorType(item.id, e.target.value as LiquorType)}
                                className="mt-1 w-full rounded-sm border border-input bg-background px-2 py-1 text-foreground"
                              >
                                {LIQUOR_TYPES.map((t2) => <option key={t2} value={t2}>{t2}</option>)}
                              </select>
                            </label>
                            <label className="font-mono-retro text-sm text-muted-foreground">
                              Brand
                              <input
                                defaultValue={item.brand}
                                onBlur={(e) => setLiquorBrand(item.id, e.target.value || "Unknown Brand")}
                                className="mt-1 w-full rounded-sm border border-input bg-background px-2 py-1 text-foreground"
                              />
                            </label>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-md border border-border bg-card p-5">
          <h2 className="font-display text-sm text-accent">🛒 SHOPPING LIST</h2>
          <p className="mt-2 font-mono-retro text-base text-muted-foreground">
            Low-stock items sync automatically.
          </p>
          <p className="mt-4 font-mono-retro text-lg text-foreground">
            {shopping.length === 0 ? "Nothing on the list." : `${shopping.length} item${shopping.length === 1 ? "" : "s"} to buy.`}
          </p>
          <Link to="/shopping" className="mt-4 inline-block rounded-sm border border-border px-3 py-1.5 font-display text-[10px] hover:bg-muted">
            OPEN LIST
          </Link>
        </div>
      </section>
    </>
  );
}
