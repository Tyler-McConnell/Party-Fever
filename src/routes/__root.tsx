import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { StoreProvider } from "@/lib/store";
import { Nav } from "@/components/Nav";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-6xl text-primary text-glow-soft">404</h1>
        <h2 className="mt-6 font-display text-sm text-foreground">GAME OVER</h2>
        <p className="mt-2 font-mono-retro text-xl text-muted-foreground">This page doesn't exist in the arcade.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center rounded-sm bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-arcade hover:translate-y-px">
            ◀ INSERT COIN
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-base text-destructive">SYSTEM CRASH</h1>
        <p className="mt-2 font-mono-retro text-lg text-muted-foreground">Something went wrong. Try again.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-sm bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-arcade"
          >
            RETRY
          </button>
          <a href="/" className="rounded-sm border border-border bg-card px-4 py-2 text-sm font-bold text-foreground">HOME</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Party Fever — Your Digital Bartender & Party System" },
      { name: "description", content: "Track your bar, suggest drinks, and run party mode. Retro arcade party manager." },
      { property: "og:title", content: "Party Fever" },
      { property: "og:description", content: "Your digital bartender and party system." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <div className="min-h-screen scanlines">
          <Nav />
          <Outlet />
        </div>
      </StoreProvider>
    </QueryClientProvider>
  );
}
