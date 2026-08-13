import { NavLink, Outlet } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Receitas", end: true },
  { to: "/semana", label: "Minha semana" },
  { to: "/historico", label: "Histórico" },
  { to: "/favoritos", label: "Favoritos" },
];

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
        <div className="mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto px-4 py-3">
          <span className="mr-4 shrink-0 font-semibold text-emerald-700 dark:text-emerald-400">
            Receitas PPP01P
          </span>
          <nav className="flex gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-emerald-600 text-white"
                      : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
