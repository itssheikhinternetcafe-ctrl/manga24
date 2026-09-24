import React, { useEffect, useRef } from 'react';

const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

export async function verifyTurnstileToken(token: string): Promise<void> {
  if (!siteKey) return;
  if (!token) throw new Error('Please complete the CAPTCHA check.');
  const response = await fetch('/api/security/verify-turnstile', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) throw new Error('CAPTCHA verification failed. Please try again.');
}

type TurnstileApi = {
  render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void; 'error-callback': () => void }) => string;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;
function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-turnstile]');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Turnstile failed to load.')));
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.turnstile = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Turnstile failed to load.'));
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export const TurnstileWidget: React.FC<{ onToken: (token: string) => void; resetKey?: number }> = ({ onToken, resetKey }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let cancelled = false;
    void loadTurnstile().then(() => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      containerRef.current.innerHTML = '';
      widgetId.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onToken,
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
      });
    }).catch(() => onToken(''));
    return () => { cancelled = true; };
  }, [onToken, resetKey]);

  if (!siteKey) return null;
  return <div ref={containerRef} className="min-h-[65px]" aria-label="Bot protection" />;
};
