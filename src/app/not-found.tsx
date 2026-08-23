import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowIcon } from '@/components/Icons';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

const LINKS = [
  { href: '/', label: 'Home', hint: 'Start here' },
  { href: '/services', label: 'Services', hint: 'What I build' },
  { href: '/projects', label: 'Projects', hint: 'Recent work' },
  { href: '/contact', label: 'Contact', hint: 'Send a brief' },
];

export default function NotFound() {
  return (
    <section className="shell grid min-h-[78vh] place-items-center py-32">
      <div className="w-full max-w-lg text-center">
        <p className="route-label justify-center">
          <span className="verb">404</span>
          <span>Not found</span>
        </p>

        <h1 className="mt-6 text-[clamp(3.5rem,14vw,7rem)] leading-none grad-text">404</h1>

        <p className="mt-5 text-[15px] leading-relaxed text-muted">
          That route doesn&apos;t exist. It may have moved, or the link that brought you here
          was mistyped. Here&apos;s where everything else lives.
        </p>

        <ul className="mt-9 grid gap-2 text-left sm:grid-cols-2">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="card flex items-center justify-between p-4"
              >
                <span>
                  <span className="block text-sm font-semibold">{l.label}</span>
                  <span className="mt-0.5 block font-mono text-2xs text-muted">{l.hint}</span>
                </span>
                <ArrowIcon width={16} height={16} className="text-brand-ink" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
