import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Tap-to-talk speech-to-text hook for B.E.A.U. Home.
 * Uses the browser's free Web Speech API — no API keys, no per-request cost.
 *
 * Browser support:
 *  • Chrome / Edge / Safari (desktop + iOS 14.5+)        — full support
 *  • Firefox                                             — not supported (returns supported: false)
 *  • Older / corp-locked browsers                        — gracefully unavailable
 *
 * Caller is expected to feature-detect via the returned `supported` flag
 * and hide the mic button when false.
 */
export function useBeauListen({ lang = 'en-US' } = {}) {
  const supported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!supported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      let finalText = '';
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += piece;
        } else {
          interim += piece;
        }
      }
      setTranscript((finalText + ' ' + interim).trim());
    };

    rec.onerror = (event) => {
      const code = event.error || 'unknown';
      // 'no-speech' and 'aborted' are normal lifecycle events, not real errors
      if (code !== 'no-speech' && code !== 'aborted') {
        setError(code);
      }
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
    };

    recognitionRef.current = rec;
    return () => {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.abort();
      } catch {
        /* noop */
      }
      recognitionRef.current = null;
    };
  }, [supported, lang]);

  const start = useCallback(() => {
    if (!supported || !recognitionRef.current) return;
    setError(null);
    setTranscript('');
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch {
      // already running — ignore
    }
  }, [supported]);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      /* noop */
    }
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return { supported, listening, transcript, error, start, stop, reset };
}
