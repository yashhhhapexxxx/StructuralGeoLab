import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/learn", label: "Course" },
  { to: "/descent", label: "Into the Crust" },
  { to: "/lab", label: "Lab" },
  { to: "/glossary", label: "Glossary" },
  { to: "/about", label: "About" },
];

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="StructuralGeoLab home">
      <svg viewBox="0 0 64 64" className="size-8" aria-hidden>
        <rect width="64" height="64" rx="14" fill="#15201a" />
        <path d="M6 40 Q22 14 32 26 T58 18" fill="none" stroke="#E3C78A" strokeWidth="6" strokeLinecap="round" />
        <path d="M6 52 Q22 26 32 38 T58 30" fill="none" stroke="#7FA35B" strokeWidth="6" strokeLinecap="round" />
      </svg>
      <span className="font-display text-xl uppercase tracking-wide">
        Structural<span className="text-lichen">Geo</span>Lab
      </span>
    </Link>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  // Braces matter: newer browsers make scrollTo() return a Promise, which must not
  // be handed back to React as an effect "cleanup".
  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0 });
  }, [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 10);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <div className="min-h-screen bg-night text-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-moss focus:px-4 focus:py-2 focus:text-night">
        Skip to content
      </a>
      <header className={cn("fixed inset-x-0 top-0 z-50 transition-colors duration-300", scrolled || open ? "border-b border-line bg-night/85 backdrop-blur-xl" : "bg-transparent")}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 md:px-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) => cn("rounded-full px-4 py-2 text-[15px] transition-colors", isActive ? "bg-white/10 text-ink" : "text-muted hover:text-ink")}
              >
                {n.label}
              </NavLink>
            ))}
            <Link to="/learn/primary-structures" className="ml-2 rounded-full bg-moss px-5 py-2 text-[15px] font-semibold text-night transition-colors hover:bg-lichen">
              Start learning
            </Link>
          </nav>
          <button type="button" className="rounded-full p-2 md:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <nav className="flex flex-col gap-1 border-t border-line px-5 pb-5 pt-2 md:hidden" aria-label="Mobile">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className="rounded-xl px-3 py-3 text-lg">
                {n.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main id="main">{children}</main>
      <Footer />
      <div className="noise" aria-hidden />
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line bg-forest/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-md text-[15px] text-muted">
            Learn structural geology by moving it — folds, faults and the forces that shape the crust, through interactive simulations.
          </p>
        </div>
        <div>
          <p className="font-display text-sm uppercase tracking-[0.2em] text-lichen">Explore</p>
          <ul className="mt-3 space-y-1.5 text-[15px] text-muted">
            <li><Link className="hover:text-ink" to="/learn">Course map</Link></li>
            <li><Link className="hover:text-ink" to="/lab">Simulation lab</Link></li>
            <li><Link className="hover:text-ink" to="/descent">Into the Crust</Link></li>
            <li><Link className="hover:text-ink" to="/glossary">Glossary</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-display text-sm uppercase tracking-[0.2em] text-lichen">Credits</p>
          <p className="mt-3 text-[15px] text-muted">
            Concepts after H. Fossen, <i>Structural Geology</i> and its e-modules. Interface components adapted from React Bits. Sister project of Campus GeoQuest.
          </p>
          <Link to="/about" className="mt-2 inline-block text-[15px] text-lichen hover:underline">Sources & credits →</Link>
        </div>
      </div>
    </footer>
  );
}
