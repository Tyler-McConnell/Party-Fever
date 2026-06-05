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

const HYPE_LINES = [
  "🔥 LET'S GOOOO 🔥",
  "🎉 IT'S ON 🎉",
  "🚀 PARTY MODE ENGAGED 🚀",
  "💃 SHAKE THE ROOM 💃",
  "🪩 DISCO INFERNO 🪩",
];

function ConfettiLayer() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        dur: 2.5 + Math.random() * 3,
        size: 6 + Math.random() * 10,
        color: ["#ff6b35", "#f7d51d", "#ff3ea5", "#7b2cbf", "#3ad6ff"][Math.floor(Math.random() * 5)],
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.i}
          className="absolute top-0 animate-confetti"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            background: p.color,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

function PartyPage() {
  const { inventory, drinks, drinksMade, toForgetOrders, partyMode, setPartyMode, barIsClosed, logDrink, adjustAmount, pourRecipe } = useStore();
  const t = totals(inventory);
  const status = partyStatus(drinksMade, toForgetOrders);
  const forecast = hangoverForecast(drinksMade, toForgetOrders);

  // popups
  const [showOpenPopup, setShowOpenPopup] = useState(false);
  const [showClosedConfirm, setShowClosedConfirm] = useState(false);
  const [shotAlert, setShotAlert] = useState(false);

  function handleToggleBar() {
    if (partyMode) {
      setShowClosedConfirm(true);
    } else {
      setPartyMode(true);
      setShowOpenPopup(true);
    }
  }

  function handleConfirmClose() {
    barIsClosed();
    setShowClosedConfirm(false);
  }

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
    if (remain <= 0) {
      setRemain(null);
      setShotAlert(true);
      const t = setTimeout(() => setShotAlert(false), 10000);
      return () => clearTimeout(t);
    }
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

  type Tab = "beer" | "shot" | "cocktail";
  const [tab, setTab] = useState<Tab>("beer");
  // auto-switch to a tab with content
  useEffect(() => {
    if (tab === "beer" && beers.length === 0) {
      if (shotsAvail.length) setTab("shot");
      else if (cocktails.length) setTab("cocktail");
    }
  }, [tab, beers.length, shotsAvail.length, cocktails.length]);

  function quickBeer(id: string, name: string) {
    adjustAmount(id, -1);
    logDrink({ name, strength: "normal" });
  }
  function quickShot(id: string, name: string, strength: Strength = "normal") {
    pourRecipe(`Shot of ${name}`, [id], [], strength);
  }
  function quickCocktail(idx: number, strength: Strength = "normal") {
    const c = cocktails[idx];
    if (!c) return;
    pourRecipe(c.recipe.name, c.liquorIds, c.mixerIds, strength);
  }

  const top = Object.entries(
    drinks.reduce<Record<string, number>>((acc, d) => { acc[d.name] = (acc[d.name] ?? 0) + 1; return acc; }, {}),
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const hype = HYPE_LINES[drinksMade % HYPE_LINES.length];

  return (
    <>
      <header className="border-b border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-party opacity-20" aria-hidden />
        <div className="absolute inset-0 scanlines pointer-events-none" aria-hidden />
        <div className="mx-auto max-w-6xl px-4 py-10 relative">
          <p className="font-display text-[10px] text-accent animate-blink">— FINAL STAGE —</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-4xl text-neon text-glow-neon animate-flicker">PARTY MODE</h1>
              <p className="mt-2 font-mono-retro text-xl text-muted-foreground">{partyMode ? hype : "Smash the button. Start the chaos."}</p>
            </div>
            <button
              onClick={handleToggleBar}
              className={`rounded-sm px-6 py-4 font-display text-xs shadow-arcade transition-transform hover:translate-y-0.5 active:translate-y-1 ${
                partyMode
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-neon text-neon-foreground shadow-neon animate-pulse"
              }`}
            >
              {partyMode ? "🔒 BAR IS CLOSED" : "🎉 BAR IS OPEN"}
            </button>
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
        {/* Quick Drink Logger — TOP PRIORITY */}
        <div className="rounded-md border-2 border-neon bg-card p-5 md:col-span-2 lg:col-span-3 shadow-neon">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-display text-base text-neon text-glow-neon">🍻 LOG A DRINK</h2>
            <p className="font-mono-retro text-base text-muted-foreground">Tap. Drink. Repeat.</p>
          </div>

          {/* Tabs */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {([
              ["beer", `🍺 BEER (${beers.length})`],
              ["shot", `🥃 SHOTS (${shotsAvail.length})`],
              ["cocktail", `🍹 MIXED (${cocktails.length})`],
            ] as [Tab, string][]).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`rounded-sm px-2 py-3 font-display text-[11px] transition ${
                  tab === k
                    ? "bg-primary text-primary-foreground shadow-arcade"
                    : "border border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Big tap buttons */}
          <div className="mt-4">
            {tab === "beer" && (
              beers.length === 0 ? (
                <p className="font-mono-retro text-lg text-muted-foreground">No beer in stock. Add some on the Inventory page.</p>
              ) : (
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                  {beers.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => quickBeer(b.id, b.name)}
                      className="rounded-md bg-accent text-accent-foreground p-4 font-display text-xs shadow-arcade transition-transform hover:translate-y-0.5 active:translate-y-1 active:animate-wobble"
                    >
                      <div className="text-3xl">🍺</div>
                      <div className="mt-1 truncate">{b.name}</div>
                      <div className="mt-1 font-mono-retro text-base opacity-70">{b.amount} left</div>
                    </button>
                  ))}
                </div>
              )
            )}

            {tab === "shot" && (
              shotsAvail.length === 0 ? (
                <p className="font-mono-retro text-lg text-muted-foreground">No liquor in stock. Add a bottle on the Inventory page.</p>
              ) : (
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                  {shotsAvail.map((l) => (
                    <div key={l.id} className="rounded-md border border-border bg-muted/40 p-3 text-center">
                      <div className="text-3xl">🥃</div>
                      <div className="mt-1 font-display text-[11px] truncate">{l.name}</div>
                      <div className="font-mono-retro text-base text-muted-foreground">{shotsOf(l).toFixed(1)} shots</div>
                      <div className="mt-2 grid grid-cols-2 gap-1">
                        <button
                          onClick={() => quickShot(l.id, l.name, "normal")}
                          className="rounded-sm bg-primary text-primary-foreground py-2 font-display text-[10px] shadow-arcade active:translate-y-0.5"
                        >
                          SHOT
                        </button>
                        <button
                          onClick={() => quickShot(l.id, l.name, "toForget")}
                          className="rounded-sm bg-destructive text-destructive-foreground py-2 font-display text-[10px] shadow-arcade active:translate-y-0.5"
                        >
                          💀 DOUBLE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {tab === "cocktail" && (
              cocktails.length === 0 ? (
                <p className="font-mono-retro text-lg text-muted-foreground">No mixable cocktails. Add liquor + mixers to unlock recipes.</p>
              ) : (
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                  {cocktails.map((c, idx) => (
                    <button
                      key={c.recipe.name}
                      onClick={() => quickCocktail(idx, "normal")}
                      className="rounded-md bg-secondary text-secondary-foreground p-4 text-left shadow-arcade transition-transform hover:translate-y-0.5 active:translate-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">{c.recipe.emoji}</span>
                        <span className="font-display text-xs">{c.recipe.name}</span>
                      </div>
                      <div className="mt-2 font-mono-retro text-sm opacity-80">{c.recipe.instructions}</div>
                    </button>
                  ))}
                </div>
              )
            )}
          </div>

          {drinks.length > 0 && (
            <div className="mt-5 border-t border-border pt-4">
              <p className="font-mono-retro text-xs uppercase tracking-wider text-muted-foreground">Recent</p>
              <ul className="mt-2 grid sm:grid-cols-2 gap-x-6">
                {drinks.slice(0, 6).map((d) => (
                  <li key={d.id} className="flex justify-between font-mono-retro text-base">
                    <span>{STRENGTH_OPTS[d.strength].label.split(" ")[0]} {d.name}</span>
                    <span className="text-muted-foreground">{new Date(d.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="rounded-md border border-border bg-card p-5">
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

      {/* ========== Bar Is Open popup ========== */}
      {showOpenPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gradient-party opacity-95" aria-hidden />
          <div className="absolute inset-0 scanlines pointer-events-none" aria-hidden />
          <ConfettiLayer />
          <div className="relative z-10 max-w-xl w-full rounded-md border-4 border-accent bg-card/95 p-8 text-center shadow-neon animate-slide-up-bounce">
            <p className="font-display text-[10px] text-accent animate-blink">— LEVEL UNLOCKED —</p>
            <h2 className="mt-4 font-display text-2xl sm:text-3xl text-neon text-glow-neon">
              LET'S GET THIS<br/>PARTY STARTED!
            </h2>
            <p className="mt-4 font-mono-retro text-2xl text-foreground">
              🎉🍻🚀 The bar is officially OPEN 🚀🍻🎉
            </p>
            <p className="mt-2 font-mono-retro text-lg text-muted-foreground">
              Hydrate. Pace yourself. Or don't. We don't judge.
            </p>
            <button
              onClick={() => setShowOpenPopup(false)}
              className="mt-6 rounded-sm bg-neon px-8 py-4 font-display text-sm text-neon-foreground shadow-neon hover:translate-y-0.5 transition-transform"
            >
              POUR ME IN →
            </button>
          </div>
        </div>
      )}

      {/* ========== Bar Is Closed confirm popup ========== */}
      {showClosedConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" aria-hidden />
          <div className="relative z-10 max-w-md w-full rounded-md border-2 border-destructive bg-card p-7 text-center shadow-arcade animate-slide-up-bounce">
            <div className="text-5xl">🚪</div>
            <h2 className="mt-3 font-display text-lg text-destructive text-glow-soft">LAST CALL</h2>
            <p className="mt-4 font-mono-retro text-2xl text-foreground leading-snug">
              "You don't have to leave,<br/>but you can't stay here."
            </p>
            <p className="mt-3 font-mono-retro text-base text-muted-foreground">
              Closing the bar resets tonight's stats.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowClosedConfirm(false)}
                className="rounded-sm border border-border px-4 py-3 font-display text-[11px] hover:bg-muted"
              >
                ONE MORE
              </button>
              <button
                onClick={handleConfirmClose}
                className="rounded-sm bg-destructive px-4 py-3 font-display text-[11px] text-destructive-foreground shadow-arcade hover:translate-y-0.5"
              >
                CLOSE BAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== Shot Clock alert ========== */}
      {shotAlert && (
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center p-4 animate-party-flash">
          <ConfettiLayer />
          <div className="relative text-center">
            <p className="font-display text-sm sm:text-base text-background animate-blink">⏰ TIME'S UP ⏰</p>
            <h2 className="mt-4 font-display text-5xl sm:text-7xl text-background animate-pulse-shot">
              TAKE A SHOT!
            </h2>
            <p className="mt-6 font-mono-retro text-3xl text-background">🥃🥃🥃 GO GO GO 🥃🥃🥃</p>
            <button
              onClick={() => setShotAlert(false)}
              className="mt-8 rounded-sm bg-background text-foreground px-6 py-3 font-display text-xs shadow-arcade"
            >
              DISMISS
            </button>
          </div>
        </div>
      )}
    </>
  );
}
