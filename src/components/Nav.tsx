import { Link, useRouterState } from "@tanstack/react-router";
import { useStore } from "@/lib/store";

const links = [
  { to: "/", label: "Home" },
  { to: "/inventory", label: "Inventory" },
  { to: "/bartender", label: "Bartender" },
  { to: "/party", label: "Party" },
  { to: "/shopping", label: "Shopping" },
] as const;

export function Nav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { partyMode } = useStore();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl" aria-hidden>🕹️</span>
          <span className="font-display text-sm text-primary text-glow-soft">PARTY<span className="text-accent">FEVER</span></span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const active = l.to === "/" ? pathname === "/" : pathname.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground shadow-arcade"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden sm:flex items-center gap-2 font-mono-retro text-sm">
          <span className={`h-2 w-2 rounded-full ${partyMode ? "bg-neon animate-pulse" : "bg-muted-foreground"}`} />
          <span className="text-muted-foreground">{partyMode ? "PARTY LIVE" : "BAR CLOSED"}</span>
        </div>
      </div>
    </header>
  );
}
