'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import ThemeToggle from './ThemeToggle';
import { CloseIcon, MenuIcon } from './Icons';

const LINKS = [
  { href: '/', label: 'Home', route: '/' },
  { href: '/about', label: 'About', route: '/about' },
  { href: '/services', label: 'Services', route: '/services' },
  { href: '/projects', label: 'Projects', route: '/projects' },
  { href: '/contact', label: 'Contact', route: '/contact' },
];

export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the drawer on navigation, and lock body scroll while it's open.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-violet focus:px-5 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-out ${
          scrolled
            ? 'border-b bg-ink/72 backdrop-blur-xl supports-[backdrop-filter]:bg-ink/60'
            : 'border-b border-transparent'
        }`}
      >
        <nav className="shell flex h-[68px] items-center justify-between gap-4" aria-label="Primary">
          <Link
            href="/"
            className="group flex items-center gap-2.5"
            aria-label="Seemol Chakroborti — home"
          >
            <span
              className="grid h-9 w-9 place-items-center rounded-[11px] font-display text-lg font-extrabold text-white shadow-[0_6px_18px_-8px_rgba(108,76,245,0.9)] transition-transform duration-500 ease-out group-hover:rotate-[-8deg] group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#6C4CF5,#E5468B)' }}
            >
              S
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-[15px] font-bold tracking-tight">wpseemol</span>
              <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                Seemol Chakroborti
              </span>
            </span>
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? 'page' : undefined}
                    className={`relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-200 ${
                      active ? 'text-body' : 'text-muted hover:text-body'
                    }`}
                  >
                    {l.label}
                    <span
                      className={`absolute inset-x-3 -bottom-px h-px origin-left transition-transform duration-400 ease-out ${
                        active ? 'scale-x-100' : 'scale-x-0'
                      }`}
                      style={{ background: 'linear-gradient(90deg,#6C4CF5,#E5468B)' }}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/contact" className="btn btn-primary hidden !px-5 !py-2.5 sm:inline-flex">
              Hire me
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="grid h-10 w-10 place-items-center rounded-full border bg-elev/70 backdrop-blur md:hidden"
            >
              {open ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </nav>

        {/* Reading progress — doubles as the header's bottom rule */}
        <div
          className="h-px origin-left"
          style={{
            background: 'linear-gradient(90deg,#6C4CF5,#E5468B)',
            transform: `scaleX(${progress / 100})`,
          }}
        />
      </header>

      {/* Mobile drawer */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-40 md:hidden ${open ? '' : 'pointer-events-none'}`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-ink/70 backdrop-blur-md transition-opacity duration-300 ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <nav
          className={`absolute inset-x-0 top-[68px] border-b bg-elev/95 px-5 pb-7 pt-4 shadow-2xl backdrop-blur-xl transition-all duration-400 ease-out ${
            open ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
          }`}
          aria-label="Mobile"
        >
          <ul className="flex flex-col">
            {LINKS.map((l, i) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="flex items-center justify-between border-b py-3.5 text-lg font-semibold last:border-0"
                  style={{
                    transitionDelay: open ? `${i * 45}ms` : '0ms',
                    opacity: open ? 1 : 0,
                    transform: open ? 'translateX(0)' : 'translateX(-10px)',
                    transition: 'opacity 0.4s ease, transform 0.4s ease',
                  }}
                >
                  {l.label}
                  <span className="font-mono text-2xs text-muted">{l.route}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/contact" className="btn btn-primary mt-6 w-full">
            Hire me
          </Link>
        </nav>
      </div>
    </>
  );
}
