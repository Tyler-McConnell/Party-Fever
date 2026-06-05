import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/shopping")({
  head: () => ({
    meta: [
      { title: "Shopping List — Party Fever" },
      { name: "description", content: "Auto-populated shopping list for everything your bar is missing." },
      { property: "og:title", content: "Shopping List — Party Fever" },
      { property: "og:description", content: "What to buy before the next party." },
    ],
  }),
  component: ShoppingPage,
});

function ShoppingPage() {
  const { shopping, addToShopping, toggleShopping, removeShoppingItem, clearShoppingCompleted, clearShopping } = useStore();
  const [name, setName] = useState("");
  const completed = shopping.filter((x) => x.completed).length;

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    addToShopping([n]);
    setName("");
  };

  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <p className="font-display text-[10px] text-accent">— BONUS LEVEL —</p>
          <h1 className="mt-3 font-display text-2xl sm:text-3xl text-primary text-glow-soft">SHOPPING LIST</h1>
          <p className="mt-2 font-mono-retro text-xl text-muted-foreground">
            Auto-filled from low stock and missing recipe ingredients.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <form onSubmit={add} className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Add item (ex: Lime juice)"
            className="flex-1 rounded-sm border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button className="rounded-sm bg-primary px-4 py-2 font-display text-xs text-primary-foreground shadow-arcade">ADD</button>
        </form>

        {shopping.length === 0 ? (
          <p className="mt-10 rounded-md border border-dashed border-border p-10 text-center font-mono-retro text-xl text-muted-foreground">
            Nothing on the list. Hit "Bar Is Closed" or use the Bartender's "+ SHOP" to auto-fill.
          </p>
        ) : (
          <>
            <ul className="mt-6 space-y-2">
              {shopping.map((it, i) => (
                <li key={i} className={`flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 ${it.completed ? "opacity-60 line-through" : ""}`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={it.completed} onChange={() => toggleShopping(i)} className="h-4 w-4" />
                    <span className="font-display text-xs">{it.name.toUpperCase()}</span>
                  </label>
                  <button onClick={() => removeShoppingItem(i)} className="rounded-sm px-2 py-1 text-xs text-destructive hover:bg-destructive/10">REMOVE</button>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={clearShoppingCompleted}
                disabled={completed === 0}
                className="rounded-sm border border-border px-3 py-1.5 font-display text-[10px] disabled:opacity-40 hover:bg-muted"
              >
                CLEAR COMPLETED ({completed})
              </button>
              <button
                onClick={() => { if (confirm("Clear the whole list?")) clearShopping(); }}
                className="rounded-sm border border-destructive px-3 py-1.5 font-display text-[10px] text-destructive hover:bg-destructive/10"
              >
                CLEAR ALL
              </button>
            </div>
          </>
        )}
      </section>
    </>
  );
}
