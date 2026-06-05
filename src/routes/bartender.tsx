import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, STRENGTH_OPTS, type Strength } from "@/lib/store";
import { matchRecipes, type MatchedRecipe } from "@/lib/recipes";

export const Route = createFileRoute("/bartender")({
  head: () => ({
    meta: [
      { title: "Digital Bartender — Party Fever" },
      { name: "description", content: "Find cocktails you can make from your inventory. Auto-deducts shots." },
      { property: "og:title", content: "Digital Bartender — Party Fever" },
      { property: "og:description", content: "Drink ideas from your inventory." },
    ],
  }),
  component: BartenderPage,
});

function BartenderPage() {
  const { inventory, drinks, pourRecipe, addToShopping } = useStore();
  const [strength, setStrength] = useState<Strength>("normal");
  const [pending, setPending] = useState<MatchedRecipe | null>(null);

  const { possible, almost } = useMemo(() => matchRecipes(inventory), [inventory]);

  const liquorCount = inventory.filter((i) => i.kind === "liquor" && (i.mlRemaining ?? 0) > 0).length;
  const mixerCount = inventory.filter((i) => i.kind === "mixer" && i.amount > 0).length;

  const pour = (m: MatchedRecipe) => {
    if (strength === "toForget") { setPending(m); return; }
    pourRecipe(m.recipe.name, m.liquorIds, m.mixerIds, strength);
  };

  const confirmToForget = () => {
    if (!pending) return;
    pourRecipe(pending.recipe.name, pending.liquorIds, pending.mixerIds, "toForget");
    setPending(null);
  };

  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <p className="font-display text-[10px] text-accent">— STAGE 02 —</p>
          <h1 className="mt-3 font-display text-2xl sm:text-3xl text-primary text-glow-soft">DIGITAL BARTENDER</h1>
          <p className="mt-2 font-mono-retro text-xl text-muted-foreground">Real recipes matched to your real bottles.</p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-sm text-accent">DRINKS YOU CAN MAKE</h2>
            <p className="mt-1 font-mono-retro text-lg text-muted-foreground">
              {possible.length} match{possible.length === 1 ? "" : "es"} · {liquorCount} liquor · {mixerCount} mixer
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono-retro text-lg text-muted-foreground">STRENGTH:</span>
            {(Object.keys(STRENGTH_OPTS) as Strength[]).map((s) => (
              <button
                key={s}
                onClick={() => setStrength(s)}
                className={`rounded-sm px-3 py-1.5 font-display text-[10px] ${
                  strength === s ? "bg-neon text-neon-foreground shadow-neon" : "border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {STRENGTH_OPTS[s].label.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {liquorCount === 0 && (
          <div className="mt-6 rounded-md border border-dashed border-border p-8 text-center">
            <p className="font-mono-retro text-xl text-muted-foreground">No liquor in stock.</p>
            <Link to="/inventory" className="mt-4 inline-block rounded-sm bg-primary px-4 py-2 font-display text-xs text-primary-foreground shadow-arcade">
              ADD TO INVENTORY
            </Link>
          </div>
        )}

        {possible.length === 0 && liquorCount > 0 && (
          <p className="mt-6 rounded-md border border-dashed border-border p-8 text-center font-mono-retro text-xl text-muted-foreground">
            No full matches. Add mixers like cola, tonic, ginger ale, or lime.
          </p>
        )}

        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {possible.map((m) => (
            <li key={m.recipe.name} className="rounded-md border border-border bg-card p-5 hover:border-primary transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-3xl">{m.recipe.emoji}</div>
                  <h3 className="mt-3 font-display text-xs text-foreground">{m.recipe.name.toUpperCase()}</h3>
                </div>
                <button
                  onClick={() => pour(m)}
                  className="rounded-sm bg-primary px-3 py-1.5 font-display text-[10px] text-primary-foreground shadow-arcade hover:translate-y-0.5"
                >
                  POUR
                </button>
              </div>
              <p className="mt-3 font-mono-retro text-base text-muted-foreground">
                {m.recipe.liquor.join(" / ")}{m.recipe.mixers.length ? " + " + m.recipe.mixers.join(" / ") : ""}
              </p>
              <p className="mt-2 font-mono-retro text-sm text-muted-foreground/70">{m.recipe.glass} · {m.recipe.instructions}</p>
            </li>
          ))}
        </ul>

        {almost.length > 0 && (
          <>
            <h2 className="mt-12 font-display text-sm text-accent">ALMOST AVAILABLE</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {almost.map((m) => (
                <li key={m.recipe.name} className="rounded-md border border-dashed border-border bg-card/60 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-3xl opacity-60">{m.recipe.emoji}</div>
                      <h3 className="mt-3 font-display text-xs text-foreground/80">{m.recipe.name.toUpperCase()}</h3>
                    </div>
                    <button
                      onClick={() => {
                        const added = addToShopping(m.missing);
                        alert(added ? `🛒 Added ${added} item(s) to shopping list.` : "Already on shopping list.");
                      }}
                      className="rounded-sm border border-accent px-3 py-1.5 font-display text-[10px] text-accent hover:bg-accent/10"
                    >
                      + SHOP
                    </button>
                  </div>
                  <p className="mt-3 font-mono-retro text-base text-destructive">Missing: {m.missing.join(", ")}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="font-display text-sm text-accent">RECENTLY POURED</h2>
        {drinks.length === 0 ? (
          <p className="mt-3 font-mono-retro text-lg text-muted-foreground">No drinks made yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {drinks.slice(0, 12).map((d) => (
              <li key={d.id} className="flex items-center justify-between rounded-md border border-border bg-card/60 px-4 py-2">
                <span className="font-display text-xs">{d.name.toUpperCase()}</span>
                <span className="font-mono-retro text-base text-muted-foreground">
                  {STRENGTH_OPTS[d.strength].label} · {new Date(d.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4">
          <div className="max-w-md rounded-md border border-destructive bg-card p-6 shadow-arcade">
            <h2 className="font-display text-base text-destructive">💀 TO FORGET WARNING</h2>
            <p className="mt-3 font-mono-retro text-lg text-foreground">
              This pours <strong>2.5×</strong> the liquor for <strong>{pending.recipe.name}</strong>.
            </p>
            <p className="mt-2 font-mono-retro text-base text-muted-foreground">Are we doing this?</p>
            <div className="mt-5 flex gap-2">
              <button onClick={confirmToForget} className="rounded-sm bg-destructive px-4 py-2 font-display text-xs text-destructive-foreground">
                LET'S FORGET
              </button>
              <button onClick={() => setPending(null)} className="rounded-sm border border-border px-4 py-2 font-display text-xs">
                SAVE MY LIVER
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
