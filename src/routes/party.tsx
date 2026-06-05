import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useStore, totals, partyStatus, hangoverForecast, shotsOf, STRENGTH_OPTS, type Strength } from "@/lib/store";
import { matchRecipes } from "@/lib/recipes";

export const Route = createFileRoute("/party")({
  head: () => ({
    meta: [
      { title: "Party Mode — Party Fever" },
      { name: "description", content: "Smart party host: chaos meter, challenges, shot clock, hangover forecast." },
      { property: "og:title", content: "Party Mode — Party Fever" },
      { property: "og:description", content: "Smart party host mode." },
    ],
  }),
  component: PartyPage,
});

const CHALLENGES = [
  "Take a sip if you are wearing black.",
  "Take a sip if you have unread texts right now.",
  "Take a sip if you are the loudest person here.",
  "Take a sip if you have ever texted your ex.",
  "Take a sip if you drove here. Water counts.",
  "Take a sip if you know every word to Mr. Brightside.",
  "Everyone point to the best-dressed person here.",
  "Everyone point to the person most likely to lose something tonight.",
  "Take a sip if you came for one drink and lied.",
  "Take a sip if you are going to regret tomorrow.",
];

function PartyPage() {
  const { inventory, drinks, drinksMade, toForgetOrders, partyMode, setPartyMode, barIsClosed, logDrink, adjustAmount, pourRecipe } = useStore();
  const t = totals(inventory);
  const status = partyStatus(drinksMade, toForgetOrders);
  const forecast = hangoverForecast(drinksMade, toForgetOrders);

  const [challenge, setChallenge] = useState(CHALLENGES[0]);
  useEffect(() => {
    if (!partyMode) return;
    const id = setInterval(() => setChallenge(CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)]), 30000);
    return () => clearInterval(id);
  }, [partyMode]);

  // shot clock
  const [mins, setMins] = useState(15);
  const [remain, setRemain] = useState<number | null>(null);
  useEffect(() => {
    if (remain === null) return;
    if (remain <= 0) { setRemain(null); return; }
    const id = setTimeout(() => setRemain((r) => (r ?? 1) - 1), 1000);
    return () => clearTimeout(id);
  }, [remain]);

  // quick drink logger — built from what you can actually make
  const beers = useMemo(() => inventory.filter((i) => i.kind === "beer" && i.amount > 0), [inventory]);
  const shotsAvail = useMemo(
    () => inventory.filter((i) => i.kind === "liquor" && shotsOf(i) > 0),
    [inventory],
  );
  const { possible: cocktails } = useMemo(() => matchRecipes(inventory), [inventory]);

  // option encoding: "beer:<id>" | "shot:<id>" | "cocktail:<recipeName>"
  type Option =
    | { kind: "beer"; id: string; label: string }
    | { kind: "shot"; id: string; label: string }
    | { kind: "cocktail"; recipeIndex: number; label: string };

  const options = useMemo<Option[]>(() => {
    const out: Option[] = [];
    beers.forEach((b) => out.push({ kind: "beer", id: b.id, label: `🍺 ${b.name} (${b.amount} left)` }));
    shotsAvail.forEach((l) => out.push({ kind: "shot", id: l.id, label: `🥃 Shot of ${l.name} (${shotsOf(l).toFixed(1)} left)` }));
    cocktails.forEach((c, idx) => out.push({ kind: "cocktail", recipeIndex: idx, label: `${c.recipe.emoji} ${c.recipe.name}` }));
    return out;
  }, [beers, shotsAvail, cocktails]);

  const [selectedKey, setSelectedKey] = useState<string>("");
  const [strength, setStrength] = useState<Strength>("normal");
  const selected = useMemo(() => {
    if (!selectedKey) return null;
    const [k, rest] = selectedKey.split(":");
    if (k === "beer") return options.find((o) => o.kind === "beer" && o.id === rest) ?? null;
    if (k === "shot") return options.find((o) => o.kind === "shot" && o.id === rest) ?? null;
    if (k === "cocktail") return options.find((o) => o.kind === "cocktail" && String(o.recipeIndex) === rest) ?? null;
    return null;
  }, [selectedKey, options]);

  function handleLogDrink() {
    if (!selected) return;
    if (selected.kind === "beer") {
      adjustAmount(selected.id, -1);
      logDrink({ name: options.find((o) => o === selected)!.label.replace(/^🍺 /, "").replace(/ \(\d+ left\)$/, ""), strength: "normal" });
    } else if (selected.kind === "shot") {
      // straight shot: 1 shot * strength multiplier
      const liquor = shotsAvail.find((x) => x.id === selected.id);
      if (!liquor) return;
      pourRecipe(`Shot of ${liquor.name}`, [liquor.id], [], strength);
    } else {
      const c = cocktails[selected.recipeIndex];
      if (!c) return;
      pourRecipe(c.recipe.name, c.liquorIds, c.mixerIds, strength);
    }
    setSelectedKey("");
    setStrength("normal");
  }

  const top = Object.entries(
    drinks.reduce<Record<string, number>>((acc, d) => { acc[d.name] = (acc[d.name] ?? 0) + 1; return acc; }, {}),
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <>
      <header className="border-b border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-party opacity-10" aria-hidden />
        <div className="mx-auto max-w-6xl px-4 py-10 relative">
          <p className="font-display text-[10px] text-accent animate-blink">— FINAL STAGE —</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl text-neon text-glow-neon">PARTY MODE</h1>
              <p className="mt-2 font-mono-retro text-xl text-muted-foreground">After dark. Smart host. Pure chaos.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setPartyMode(!partyMode)}
                className={`rounded-sm px-6 py-3 font-display text-xs shadow-arcade transition-transform hover:translate-y-0.5 ${
                  partyMode ? "bg-neon text-neon-foreground shadow-neon" : "bg-primary text-primary-foreground"
                }`}
              >
                {partyMode ? "🔓 BAR IS OPEN" : "🔒 OPEN THE BAR"}
              </button>
              <button
                onClick={() => {
                  if (confirm("Close the bar? This resets tonight's stats and adds low-stock items to your shopping list.")) barIsClosed();
                }}
                className="rounded-sm border border-destructive px-4 py-3 font-display text-xs text-destructive hover:bg-destructive/10"
              >
                🔒 BAR IS CLOSED
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {[
            ["🍺 BEER LEFT", String(t.beer), "text-accent"],
            ["🥃 SHOTS LEFT", t.liquorShots.toFixed(1), "text-primary"],
            ["🥤 MIXERS", String(t.mixers), "text-secondary-foreground"],
            ["🍹 POURED", String(drinksMade), "text-neon"],
          ].map(([l, v, c]) => (
            <div key={l} className="rounded-md border border-border bg-card p-4 text-center">
              <div className="font-mono-retro text-base uppercase tracking-wider text-muted-foreground">{l}</div>
              <div className={`mt-2 font-display text-xl ${c} text-glow-soft`}>{v}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3 pb-16">
        {/* Status */}
        <div className="rounded-md border border-border bg-card p-5 md:col-span-2 lg:col-span-1">
          <h2 className="font-display text-sm text-accent">🚀 PARTY STATUS</h2>
          <p className="mt-4 font-display text-base text-primary text-glow-soft">{status.emoji} {status.title}</p>
          <p className="mt-2 font-mono-retro text-base text-muted-foreground">{status.message}</p>
          <p className="mt-3 font-mono-retro text-sm text-muted-foreground/70">
            {drinksMade} drinks · {toForgetOrders} 💀 to-forget
          </p>
        </div>

        {/* Hangover Forecast */}
        <div className="rounded-md border border-border bg-card p-5">
          <h2 className="font-display text-sm text-accent">💀 HANGOVER FORECAST</h2>
          <p className="mt-4 font-display text-base text-primary text-glow-soft">{forecast.emoji} {forecast.title}</p>
          <p className="mt-2 font-mono-retro text-base text-muted-foreground">{forecast.message}</p>
        </div>

        {/* Challenge */}
        <div className="rounded-md border border-border bg-card p-5">
          <h2 className="font-display text-sm text-accent">🍻 CHALLENGE</h2>
          <p className="mt-4 font-mono-retro text-xl text-foreground">{challenge}</p>
          <button
            onClick={() => setChallenge(CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)])}
            className="mt-4 rounded-sm border border-border px-3 py-1.5 font-display text-[10px] hover:bg-muted"
          >
            NEXT
          </button>
        </div>

        {/* Shot Clock */}
        <div className="rounded-md border border-border bg-card p-5">
          <h2 className="font-display text-sm text-accent">⏰ SHOT CLOCK</h2>
          {remain === null ? (
            <>
              <div className="mt-4 flex items-center gap-2">
                <input
                  type="number" min={1} value={mins}
                  onChange={(e) => setMins(Number(e.target.value))}
                  className="w-20 rounded-sm border border-input bg-background px-2 py-1 text-center"
                />
                <span className="font-mono-retro text-lg text-muted-foreground">MIN</span>
              </div>
              <button
                onClick={() => setRemain(Math.max(1, mins) * 60)}
                className="mt-4 rounded-sm bg-primary px-3 py-1.5 font-display text-[10px] text-primary-foreground shadow-arcade"
              >
                START
              </button>
            </>
          ) : (
            <>
              <div className="mt-4 font-display text-3xl text-neon text-glow-neon">
                {String(Math.floor(remain / 60)).padStart(2, "0")}:{String(remain % 60).padStart(2, "0")}
              </div>
              <button onClick={() => setRemain(null)} className="mt-4 rounded-sm border border-destructive px-3 py-1.5 font-display text-[10px] text-destructive hover:bg-destructive/10">
                STOP
              </button>
            </>
          )}
        </div>

        {/* Quick Drink Logger */}
        <div className="rounded-md border border-border bg-card p-5 md:col-span-2">
          <h2 className="font-display text-sm text-accent">🍻 LOG A DRINK</h2>
          <p className="mt-2 font-mono-retro text-sm text-muted-foreground">
            Track what you actually drink. Deducts from inventory automatically.
          </p>
          {options.length === 0 ? (
            <p className="mt-4 font-mono-retro text-lg text-muted-foreground">Nothing pourable. Add beer, liquor, or mixers first.</p>
          ) : (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="font-mono-retro text-xs uppercase tracking-wider text-muted-foreground">Drink</span>
                  <select
                    value={selectedKey}
                    onChange={(e) => setSelectedKey(e.target.value)}
                    className="mt-1 w-full rounded-sm border border-input bg-background px-2 py-2 font-mono-retro text-base"
                  >
                    <option value="">— Pick one —</option>
                    {beers.length > 0 && (
                      <optgroup label="🍺 Beers">
                        {options.filter((o) => o.kind === "beer").map((o) => (
                          <option key={`beer:${(o as { id: string }).id}`} value={`beer:${(o as { id: string }).id}`}>{o.label}</option>
                        ))}
                      </optgroup>
                    )}
                    {shotsAvail.length > 0 && (
                      <optgroup label="🥃 Shots">
                        {options.filter((o) => o.kind === "shot").map((o) => (
                          <option key={`shot:${(o as { id: string }).id}`} value={`shot:${(o as { id: string }).id}`}>{o.label}</option>
                        ))}
                      </optgroup>
                    )}
                    {cocktails.length > 0 && (
                      <optgroup label="🍹 Cocktails">
                        {options.filter((o) => o.kind === "cocktail").map((o) => {
                          const idx = (o as { recipeIndex: number }).recipeIndex;
                          return <option key={`cocktail:${idx}`} value={`cocktail:${idx}`}>{o.label}</option>;
                        })}
                      </optgroup>
                    )}
                  </select>
                </label>
                {selected && (selected.kind === "shot" || selected.kind === "cocktail") && (
                  <label className="block">
                    <span className="font-mono-retro text-xs uppercase tracking-wider text-muted-foreground">Strength</span>
                    <select
                      value={strength}
                      onChange={(e) => setStrength(e.target.value as Strength)}
                      className="mt-1 w-full rounded-sm border border-input bg-background px-2 py-2 font-mono-retro text-base"
                    >
                      {(Object.keys(STRENGTH_OPTS) as Strength[]).map((k) => (
                        <option key={k} value={k}>{STRENGTH_OPTS[k].label} ({STRENGTH_OPTS[k].mult}x)</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              {selected?.kind === "cocktail" && (
                <p className="mt-3 font-mono-retro text-sm text-muted-foreground">
                  {cocktails[selected.recipeIndex]?.recipe.instructions}
                </p>
              )}
              <button
                onClick={handleLogDrink}
                disabled={!selected}
                className="mt-4 rounded-sm bg-neon px-4 py-2 font-display text-xs text-neon-foreground shadow-neon transition-transform hover:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                + LOG DRINK
              </button>
            </>
          )}
          {drinks.length > 0 && (
            <div className="mt-5 border-t border-border pt-4">
              <p className="font-mono-retro text-xs uppercase tracking-wider text-muted-foreground">Recent</p>
              <ul className="mt-2 space-y-1">
                {drinks.slice(0, 5).map((d) => (
                  <li key={d.id} className="flex justify-between font-mono-retro text-sm">
                    <span>{STRENGTH_OPTS[d.strength].label.split(" ")[0]} {d.name}</span>
                    <span className="text-muted-foreground">{new Date(d.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Top Drinks */}
        <div className="rounded-md border border-border bg-card p-5">
          <h2 className="font-display text-sm text-accent">🏆 TOP DRINKS TONIGHT</h2>
          {top.length === 0 ? (
            <p className="mt-4 font-mono-retro text-lg text-muted-foreground">Pour something first.</p>
          ) : (
            <ol className="mt-4 space-y-2">
              {top.map(([name, n], i) => (
                <li key={name} className="flex justify-between font-mono-retro text-lg">
                  <span><span className="text-accent">{i + 1}.</span> {name}</span>
                  <span className="text-muted-foreground">×{n}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

      </section>
    </>
  );
}
