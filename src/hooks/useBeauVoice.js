import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * B.E.A.U. text-to-speech hook (consumer / Home edition).
 * Uses the browser's free SpeechSynthesis API — works offline on most devices,
 * zero per-request cost. Picks a deep male voice across locales when possible.
 *
 * Returned `supported` will be false on:
 *   • Firefox without OS speech engine
 *   • Locked-down corporate / kiosk browsers
 *   • Some embedded webviews
 *
 * The voice toggle persists across sessions in localStorage.
 */

const VOICE_PREF_KEY = 'beau_home_voice_enabled';
const VOICE_URI_KEY = 'beau_home_voice_uri';

// B.E.A.U. is male — prefer deep male voices across all locales.
const MALE_VOICE_PATTERNS = [
  // Microsoft (Windows / Edge)
  /Davis/i, /Guy/i, /Brandon/i, /Christopher/i, /Eric/i, /Roger/i, /Tony/i,
  /Mark/i, /David/i, /Andrew/i, /Brian/i,
  // Apple (macOS / iOS)
  /Daniel/i, /Alex(?!a)/i, /Aaron/i, /Fred/i, /Tom/i, /Arthur/i, /Reed/i,
  // Spanish
  /Jorge/i, /Juan/i, /Bernardo/i, /Pablo/i, /Diego/i, /Carlos/i, /Alvaro/i,
  // Chinese
  /Yunfeng/i, /Yunxi/i, /Yunyang/i, /Kangkang/i, /Yunjian/i,
  // Vietnamese (limited male voices in OS engines, falls through)
  /An\b/i, /Nam/i,
  // Tagalog (Filipino) — Apple has Angelo
  /Angelo/i,
];

/**
 * Strip markdown, emoji-only lines, and other artifacts so TTS reads naturally.
 * Consumer copy is friendlier than clinical, so this stripper can stay light.
 */
function sanitizeForSpeech(text) {
  if (!text) return '';
  return text
    // Inline backticks: keep content, drop backticks
    .replace(/`([^`]+)`/g, '$1')
    // Markdown horizontal rules
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    // Headers: drop hashes
    .replace(/^#{1,6}\s+/gm, '')
    // Bold / italic
    .replace(/\*{1,3}([^*\n]+)\*{1,3}/g, '$1')
    .replace(/_{1,3}([^_\n]+)_{1,3}/g, '$1')
    // Links: read text only
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Bullet markers
    .replace(/^\s*[-*•]\s+/gm, '')
    // Numbered list markers
    .replace(/^\s*\d+\.\s+/gm, '')
    // Pipes (tables) → space
    .replace(/\s*\|\s*/g, ' ')
    // URLs
    .replace(/https?:\/\/\S+/g, '')
    // Em-dash → comma
    .replace(/—/g, ',')
    // Multiple hyphens → comma
    .replace(/-{2,}/g, ',')
    // Emoji-only lines like "🌅" disappear (TTS reads them awkwardly)
    .replace(/^[^\w\s.,!?]+$/gm, '')
    // Inline emoji surrounded by space — drop them; keep readable copy
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    // Stray quotes
    .replace(/"\s*"/g, '')
    // Multiple newlines → sentence break
    .replace(/\n{2,}/g, '. ')
    // Single newlines → space
    .replace(/\n/g, ' ')
    // Collapse repeated punctuation
    .replace(/,(\s*,)+/g, ',')
    .replace(/\.(\s*\.)+/g, '.')
    // Collapse whitespace
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function pickPreferredVoice(voices, langCode) {
  if (!voices?.length) return null;
  const prefix = (langCode || 'en').slice(0, 2).toLowerCase();
  const langMatches = voices.filter((v) => v.lang?.toLowerCase().startsWith(prefix));
  const pool = langMatches.length > 0 ? langMatches : voices;

  // Pass 1: prefer male voices in the target language
  for (const pattern of MALE_VOICE_PATTERNS) {
    const match = pool.find((v) => pattern.test(v.name));
    if (match) return match;
  }

  // Pass 2: any local-system voice in the target language
  return pool.find((v) => v.localService) || pool[0];
}

export function useBeauVoice({ lang = 'en-US' } = {}) {
  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  const [enabled, setEnabled] = useState(() => {
    if (!supported) return false;
    return localStorage.getItem(VOICE_PREF_KEY) === '1';
  });
  const [speaking, setSpeaking] = useState(false);
  const [voice, setVoice] = useState(null);
  const [allVoices, setAllVoices] = useState([]);
  const [voiceURI, setVoiceURIState] = useState(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(VOICE_URI_KEY);
  });
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (!supported) return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;
      setAllVoices(voices);
      const prefix = (lang || 'en').slice(0, 2).toLowerCase();
      const saved = voiceURI && voices.find(
        (v) => v.voiceURI === voiceURI && v.lang?.toLowerCase().startsWith(prefix)
      );
      setVoice(saved || pickPreferredVoice(voices, lang));
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [supported, lang, voiceURI]);

  const setVoiceURI = useCallback((uri) => {
    setVoiceURIState(uri);
    if (typeof window !== 'undefined') {
      if (uri) localStorage.setItem(VOICE_URI_KEY, uri);
      else localStorage.removeItem(VOICE_URI_KEY);
    }
  }, []);

  useEffect(() => {
    if (!supported) return;
    localStorage.setItem(VOICE_PREF_KEY, enabled ? '1' : '0');
  }, [enabled, supported]);

  const speak = useCallback(
    (text) => {
      if (!supported || !text) return;
      const cleaned = sanitizeForSpeech(text);
      if (!cleaned) return;
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(cleaned);
      if (voice) utt.voice = voice;
      utt.lang = lang;
      utt.rate = 0.95;   // slightly deliberate, friendly pace
      utt.pitch = 0.9;   // a touch lower than default — B.E.A.U.'s warmth
      utt.volume = 1.0;
      utt.onstart = () => setSpeaking(true);
      utt.onend = () => setSpeaking(false);
      utt.onerror = () => setSpeaking(false);
      utteranceRef.current = utt;
      window.speechSynthesis.speak(utt);
    },
    [supported, voice, lang]
  );

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const toggleEnabled = useCallback(() => {
    setEnabled((prev) => {
      if (prev) {
        if (supported) window.speechSynthesis.cancel();
        setSpeaking(false);
      }
      return !prev;
    });
  }, [supported]);

  return {
    supported,
    enabled,
    speaking,
    voice,
    allVoices,
    voiceURI,
    setVoiceURI,
    speak,
    stop,
    toggleEnabled,
  };
}
