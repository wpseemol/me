import Link from 'next/link';
import site from '@/data/site.json';
import { SOCIAL_ICONS } from './Icons';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/projects', label: 'Projects' },
  { href: '/contact', label: 'Contact' },
];

export default function Footer() {
  const p = site.profile;
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-28 border-t bg-elev/40 backdrop-blur-sm">
      <div className="shell py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span
                className="grid h-9 w-9 place-items-center rounded-[11px] font-display text-lg font-extrabold text-white"
                style={{ background: 'linear-gradient(135deg,#6C4CF5,#E5468B)' }}
              >
                S
              </span>
              <span className="font-display text-lg font-bold tracking-tight">wpseemol</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              {p.name} — {p.role} building with Next.js, React, Laravel, the MERN stack and
              Shopify. Working remotely from {p.location.city}, {p.location.country}.
            </p>

            <div className="mt-5 flex gap-2">
              {site.socials.map((s) => {
                const Icon = SOCIAL_ICONS[s.icon];
                return (
                  <a
                    key={s.name}
                    href={s.url}
                    target={s.icon === 'mail' ? undefined : '_blank'}
                    rel={s.icon === 'mail' ? undefined : 'noopener noreferrer me'}
                    aria-label={`${p.name} on ${s.name}`}
                    title={`${p.name} on ${s.name}`}
                    className="grid h-10 w-10 place-items-center rounded-full border text-muted transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-violet/50 hover:text-body"
                  >
                    {Icon ? <Icon width={17} height={17} /> : null}
                  </a>
                );
              })}
            </div>
          </div>

          <nav aria-label="Footer">
            <h2 className="font-mono text-2xs uppercase tracking-[0.18em] text-muted">Pages</h2>
            <ul className="mt-4 space-y-2.5">
              {NAV.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted transition-colors hover:text-body"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-mono text-2xs uppercase tracking-[0.18em] text-muted">
              What I build
            </h2>
            <ul className="mt-4 space-y-2.5">
              {site.services.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/services#${s.slug}`}
                    className="text-sm text-muted transition-colors hover:text-body"
                  >
                    {s.stack[0]} development
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="hairline my-9" />

        <div className="flex flex-col items-start justify-between gap-3 text-2xs text-muted sm:flex-row sm:items-center">
          <p className="font-mono">
            © {year} {p.name} · wpseemol.site
          </p>
          <p className="font-mono">
            Built with Next.js, GSAP &amp; three.js
            <span className="mx-2 opacity-40">/</span>
            <a
              href={`mailto:${p.email}`}
              className="transition-colors hover:text-body"
            >
              {p.email}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
