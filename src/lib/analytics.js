// Safely send GA4 events. No-ops if gtag isn't loaded (dev, ad blockers,
// CSP-restricted environments) so callers never need to guard the call.
export function track(eventName, params = {}) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;
  try {
    window.gtag('event', eventName, params);
  } catch {
    // Analytics failures must never break the app.
  }
}
