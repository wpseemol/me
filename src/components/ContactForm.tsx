'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import site from '@/data/site.json';
import { ArrowIcon, CheckIcon } from './Icons';

type Status = 'idle' | 'sending' | 'sent' | 'mailto' | 'error';

const SERVICE_LABEL: Record<string, string> = Object.fromEntries(
  site.services.map((s) => [s.slug, s.title]),
);

export default function ContactForm() {
  const params = useSearchParams();
  const preset = params.get('service');

  const [values, setValues] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    company: '', // honeypot
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [note, setNote] = useState('');

  // Deep link from a service card pre-fills the subject.
  useEffect(() => {
    if (preset && SERVICE_LABEL[preset]) {
      setValues((v) => (v.subject ? v : { ...v, subject: SERVICE_LABEL[preset] }));
    }
  }, [preset]);

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    setErrors((prev) => {
      if (!prev[k]) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });
  };

  function validate() {
    const e: Record<string, string> = {};
    if (values.name.trim().length < 2) e.name = 'Enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim()))
      e.email = 'Enter a valid email address.';
    if (values.subject.trim().length < 3) e.subject = 'Enter a subject.';
    if (values.message.trim().length < 20)
      e.message = 'Add a bit more detail — at least 20 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function openMailClient() {
    const subject = encodeURIComponent(values.subject || 'Project enquiry');
    const body = encodeURIComponent(
      `Name: ${values.name}\nEmail: ${values.email}\n\n${values.message}`,
    );
    window.location.href = `mailto:${site.profile.email}?subject=${subject}&body=${body}`;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setStatus('sending');
    setNote('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        setStatus('error');
        setNote(data.error ?? 'Please fix the highlighted fields.');
        return;
      }

      if (data.delivered) {
        setStatus('sent');
        setValues({ name: '', email: '', subject: '', message: '', company: '' });
      } else {
        // Email delivery isn't configured on the server yet.
        setStatus('mailto');
        openMailClient();
      }
    } catch {
      setStatus('mailto');
      setNote("Network hiccup — opening your email app instead.");
      openMailClient();
    }
  }

  if (status === 'sent') {
    return (
      <div className="card p-8 text-center sm:p-10">
        <span
          className="mx-auto grid h-12 w-12 place-items-center rounded-full text-white"
          style={{ background: 'linear-gradient(140deg,#6C4CF5,#E5468B)' }}
        >
          <CheckIcon width={22} height={22} />
        </span>
        <h2 className="mt-5 text-xl">Message sent</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
          Thanks — it&apos;s in my inbox. I reply to everything within one working day, usually
          sooner.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="btn btn-ghost mt-7"
        >
          Send another
        </button>
      </div>
    );
  }

  const field =
    'mt-2 w-full rounded-xl border bg-elev/60 px-4 py-3 text-sm outline-none backdrop-blur transition-colors duration-200 placeholder:text-muted/60 focus:border-violet/60';

  return (
    <form onSubmit={onSubmit} noValidate className="card p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="font-mono text-2xs uppercase tracking-[0.14em] text-muted">
            Your name
          </label>
          <input
            id="name"
            name="name"
            value={values.name}
            onChange={set('name')}
            autoComplete="name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            className={field}
            placeholder="Jane Doe"
          />
          {errors.name && (
            <p id="name-error" className="mt-1.5 text-xs text-magenta">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="font-mono text-2xs uppercase tracking-[0.14em] text-muted">
            Your email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={values.email}
            onChange={set('email')}
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={field}
            placeholder="jane@company.com"
          />
          {errors.email && (
            <p id="email-error" className="mt-1.5 text-xs text-magenta">
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="subject" className="font-mono text-2xs uppercase tracking-[0.14em] text-muted">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          value={values.subject}
          onChange={set('subject')}
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? 'subject-error' : undefined}
          className={field}
          placeholder="Next.js storefront rebuild"
        />
        {errors.subject && (
          <p id="subject-error" className="mt-1.5 text-xs text-magenta">
            {errors.subject}
          </p>
        )}
      </div>

      <div className="mt-5">
        <label htmlFor="message" className="font-mono text-2xs uppercase tracking-[0.14em] text-muted">
          Project details
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          value={values.message}
          onChange={set('message')}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'message-error' : undefined}
          className={`${field} resize-y`}
          placeholder="What are you building, what's the deadline, and where is it stuck right now?"
        />
        {errors.message && (
          <p id="message-error" className="mt-1.5 text-xs text-magenta">
            {errors.message}
          </p>
        )}
      </div>

      {/* Honeypot — hidden from people, irresistible to bots */}
      <div className="absolute h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="company">Company (leave blank)</label>
        <input
          id="company"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          value={values.company}
          onChange={set('company')}
        />
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={status === 'sending'} className="btn btn-primary disabled:opacity-60">
          {status === 'sending' ? 'Sending…' : 'Send message'}
          {status !== 'sending' && <ArrowIcon width={17} height={17} />}
        </button>
        <a href={`mailto:${site.profile.email}`} className="text-sm text-muted transition-colors hover:text-body">
          or email {site.profile.email}
        </a>
      </div>

      <p aria-live="polite" className="sr-only">
        {status === 'sending' ? 'Sending your message' : note}
      </p>

      {note && status !== 'sending' && (
        <p className={`mt-4 text-sm ${status === 'error' ? 'text-magenta' : 'text-muted'}`}>
          {note}
        </p>
      )}

      {status === 'mailto' && !note && (
        <p className="mt-4 text-sm text-muted">
          Your email app should have opened with the message ready to send.
        </p>
      )}
    </form>
  );
}
