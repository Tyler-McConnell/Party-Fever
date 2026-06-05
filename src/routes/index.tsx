import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Party Fever — Your Digital Bartender" },
      { name: "description", content: "The arcade-style party manager: track your bar, get drink ideas, and run party mode all night." },
      { property: "og:title", content: "Party Fever" },
      { property: "og:description", content: "The arcade-style party manager." },
    ],
  }),
  component: Home,
});

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-md border border-border bg-card/60 p-4 text-center">
      <div className="font-display text-2xl text-accent text-glow-soft">{value}</div>
      <div className="mt-1 font-mono-retro text-base text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}

function Feature({ emoji, title, desc, to }: { emoji: string; title: string; desc: string; to: "/inventory" | "/bartender" | "/party" }) {
  return (
    <Link
      to={to}
      className="group block rounded-md border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary hover:shadow-arcade"
    >
      <div className="text-4xl">{emoji}</div>
      <h3 className="mt-4 font-display text-sm text-primary">{title}</h3>
      <p className="mt-2 font-mono-retro text-lg text-muted-foreground">{desc}</p>
      <div className="mt-4 font-display text-[10px] text-accent opacity-0 transition-opacity group-hover:opacity-100">PRESS START ▶</div>
    </Link>
  );
}

function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-party opacity-10" aria-hidden />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28 text-center relative">
          <p className="font-display text-[10px] text-accent animate-blink">★ INSERT COIN ★</p>
          <h1 className="mt-6 font-display text-3xl sm:text-5xl md:text-6xl leading-tight">
            <span className="text-primary text-glow-soft">PARTY</span>
            <span className="text-neon text-glow-neon">FEVER</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl font-mono-retro text-2xl text-foreground/90">
            Your digital bartender and party system. Track the bar, mix the drinks, run the night.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/inventory" className="rounded-sm bg-primary px-6 py-3 font-display text-xs text-primary-foreground shadow-arcade transition-transform hover:translate-y-0.5">
              ▶ START GAME
            </Link>
            <Link to="/party" className="rounded-sm border border-neon bg-card px-6 py-3 font-display text-xs text-neon text-glow-neon hover:bg-neon/10">
              PARTY MODE
            </Link>
          </div>
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <Stat value="∞" label="Drinks" />
            <Stat value="24/7" label="Open Bar" />
            <Stat value="100%" label="Vibe" />
            <Stat value="0" label="Sober" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center">
          <p className="font-display text-[10px] text-accent">— LEVEL SELECT —</p>
          <h2 className="mt-3 font-display text-xl sm:text-2xl text-foreground">CHOOSE YOUR MODE</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <Feature
            emoji="🍻"
            title="INVENTORY"
            desc="Track every beer, bottle, and mixer. Auto low-stock alerts so the bar never runs dry."
            to="/inventory"
          />
          <Feature
            emoji="🍹"
            title="BARTENDER"
            desc="Tell it what you've got, get drink ideas you can actually make. Strength selector included."
            to="/bartender"
          />
          <Feature
            emoji="🎉"
            title="PARTY MODE"
            desc="Random drinks, challenges, shot clock, hangover forecast. Pure chaos, organized."
            to="/party"
          />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="text-center">
            <p className="font-display text-[10px] text-accent">— HOW IT WORKS —</p>
            <h2 className="mt-3 font-display text-xl sm:text-2xl">3 STEPS TO CHAOS</h2>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              ["01", "STOCK THE BAR", "Add beers, liquors, and mixers to your inventory."],
              ["02", "FLIP THE SWITCH", "Open the bar. Party Mode goes live."],
              ["03", "LET IT RIP", "Pour drinks, log them, hit the shot clock, repeat."],
            ].map(([n, t, d]) => (
              <li key={n} className="rounded-md border border-border bg-background/50 p-6">
                <div className="font-display text-3xl text-secondary text-glow-soft">{n}</div>
                <h3 className="mt-3 font-display text-sm text-primary">{t}</h3>
                <p className="mt-2 font-mono-retro text-lg text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center font-mono-retro text-base text-muted-foreground">
          © {new Date().getFullYear()} PARTY FEVER · DRINK RESPONSIBLY · HIGH SCORE: YOU
        </div>
      </footer>
    </main>
  );
}
