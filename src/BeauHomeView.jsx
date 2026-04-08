import React, { useState, useRef, useEffect, useCallback } from "react";

// ─── Color Constants ───────────────────────────────────────────────────────
const C = {
  flame: "#E8751A",
  fire: "#D4531A",
  amber: "#F5A623",
  gold: "#FFB347",
  copper: "#CC5500",
  warm: "#FFF8F0",
  cream: "#FFF1E6",
  sky: "#4ECDC4",
  teal: "#2AB7CA",
  navy: "#1A535C",
  text: "#2D3436",
  muted: "#636E72",
  light: "#B2BEC3",
  bg: "#FFFAF5",
  card: "#FFFFFF",
  border: "#F0E6DB",
};

const API_URL = "/api/chat-home";

// ─── Breed Lists ───────────────────────────────────────────────────────────
const DOG_BREEDS = [
  "Akita","Alaskan Malamute","American Bulldog","American Pit Bull Terrier","American Staffordshire Terrier",
  "Australian Cattle Dog","Australian Shepherd","Basenji","Basset Hound","Beagle",
  "Belgian Malinois","Bernese Mountain Dog","Bichon Frise","Border Collie","Boston Terrier",
  "Boxer","Brittany","Brussels Griffon","Bulldog","Bullmastiff",
  "Cairn Terrier","Cane Corso","Cavalier King Charles Spaniel","Chihuahua","Chinese Crested",
  "Cocker Spaniel","Collie","Corgi (Pembroke)","Corgi (Cardigan)","Dachshund",
  "Dalmatian","Doberman Pinscher","English Setter","English Springer Spaniel","French Bulldog",
  "German Shepherd","German Shorthaired Pointer","Golden Retriever","Great Dane","Great Pyrenees",
  "Greyhound","Havanese","Irish Setter","Irish Wolfhound","Italian Greyhound",
  "Jack Russell Terrier","Labrador Retriever","Lhasa Apso","Maltese","Mastiff",
  "Miniature Pinscher","Miniature Schnauzer","Newfoundland","Norfolk Terrier","Old English Sheepdog",
  "Papillon","Pekingese","Pomeranian","Poodle (Standard)","Poodle (Miniature)",
  "Poodle (Toy)","Portuguese Water Dog","Pug","Rhodesian Ridgeback","Rottweiler",
  "Saint Bernard","Samoyed","Scottish Terrier","Shetland Sheepdog","Shiba Inu",
  "Shih Tzu","Siberian Husky","Soft Coated Wheaten Terrier","Staffordshire Bull Terrier","Vizsla",
  "Weimaraner","West Highland White Terrier","Whippet","Wire Fox Terrier","Yorkshire Terrier",
  "Mixed Breed / Other",
];

const CAT_BREEDS = [
  "Abyssinian","American Shorthair","Bengal","Birman","British Shorthair",
  "Burmese","Devon Rex","Egyptian Mau","Exotic Shorthair","Himalayan",
  "Maine Coon","Manx","Norwegian Forest Cat","Oriental Shorthair","Persian",
  "Ragdoll","Russian Blue","Scottish Fold","Siamese","Sphynx",
  "Tonkinese","Turkish Angora","Mixed Breed / Other",
];

const CONDITIONS = [
  "Post-TPLO","IVDD","Osteoarthritis","Hip Dysplasia","Luxating Patella",
  "Fracture Recovery","Geriatric Mobility","Sporting/Agility Conditioning",
  "Muscle Building","General Deconditioning","Obesity/Weight Management","Soft Tissue Injury",
];

const HOW_TO_STEPS = [
  { step: 1, title: "Enter Your Pet's Info", desc: "Start by selecting your pet's species (dog or cat), breed, name, age, weight, and condition. This helps B.E.A.U. personalize every exercise recommendation." },
  { step: 2, title: "Describe Your Situation", desc: "Tell B.E.A.U. about your pet's condition, how far along they are in recovery, and what you have available at home \u2014 furniture, yard space, stairs, pillows, towels, etc." },
  { step: 3, title: "Ask for Exercises", desc: "Ask B.E.A.U. for specific exercises. Be specific: 'indoor exercises for post-TPLO week 4' or 'backyard obstacle course for my arthritic Lab' gets better results than 'what should I do?'" },
  { step: 4, title: "Save & Track", desc: "When B.E.A.U. gives you exercises you like, tap 'Save this exercise' to add it to your saved list. Check your Progress Tracker to see how your pet is advancing." },
  { step: 5, title: "Follow the Plan", desc: "Consistency is key. Do the exercises daily as recommended. Tell B.E.A.U. how your pet responded so it can adjust difficulty \u2014 harder, easier, or different." },
  { step: 6, title: "Know When to Stop", desc: "If your pet shows pain, limping, or reluctance \u2014 stop immediately. B.E.A.U. will always remind you: consult your veterinarian for any concerns." },
];

// ─── Logo Component ────────────────────────────────────────────────────────
const LogoIcon = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" rx="38" fill="#1A535C"/>
    <defs>
      <linearGradient id="sG" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#E8751A"/><stop offset="45%" stopColor="#FFB347"/><stop offset="100%" stopColor="#E8751A"/>
      </linearGradient>
      <linearGradient id="snG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFB347"/><stop offset="100%" stopColor="#E8751A"/>
      </linearGradient>
    </defs>
    <rect x="1.5" y="1.5" width="197" height="197" rx="36.5" fill="none" stroke="#E8751A" strokeWidth="1.2" strokeOpacity="0.3"/>
    <path d="M 91 122 C 40 116, 36 80, 109 76" fill="none" stroke="#C44D1A" strokeWidth="6" strokeOpacity="0.5" strokeLinecap="round"/>
    <rect x="95.5" y="24" width="9" height="152" rx="4.5" fill="url(#sG)"/>
    <circle cx="100" cy="22" r="10" fill="#E8751A"/><circle cx="100" cy="22" r="5.5" fill="#1A535C"/><circle cx="100" cy="22" r="2.5" fill="#FFB347"/>
    <rect x="82" y="172" width="36" height="5.5" rx="2.75" fill="#E8751A"/>
    <path d="M 116 166 C 156 158, 158 118, 91 122" fill="none" stroke="url(#snG)" strokeWidth="6.2" strokeLinecap="round"/>
    <path d="M 109 76 C 152 68, 152 34, 88 26" fill="none" stroke="url(#snG)" strokeWidth="6.2" strokeLinecap="round"/>
    <ellipse cx="84" cy="21" rx="15" ry="10" fill="#0F3D45" stroke="#E8751A" strokeWidth="2.2" transform="rotate(-28 84 21)"/>
    <circle cx="77" cy="17" r="3.8" fill="#FFB347"/><circle cx="77" cy="17" r="1.8" fill="#0F3D45"/>
    <path d="M 69 24 C 63 21, 59 19, 55 17" fill="none" stroke="#E8751A" strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M 69 24 C 63 25, 59 27, 55 30" fill="none" stroke="#E8751A" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

// ─── System Prompt Builder ─────────────────────────────────────────────────
function buildSystemPrompt(pet) {
  return `You are B.E.A.U. (Biomedical Evidence-Based Assessment Utility) \u2014 Home Edition.

Created by Salvatore Bonanno, CCRN, with 30 years of veterinary rehabilitation experience. Your knowledge base follows the clinical protocols from Millis & Levine's "Canine Rehabilitation and Physical Therapy" and the K9 Rehab Pro document of truth.

CRITICAL SPECIES RULE:
- If the patient is a DOG, ONLY give canine-specific exercises and protocols.
- If the patient is a CAT, ONLY give feline-specific exercises and protocols.
- NEVER mix species protocols. Cat anatomy, recovery patterns, and exercise tolerances are fundamentally different from dogs.

YOUR PURPOSE:
You help pet parents who cannot afford professional rehabilitation centers. You provide evidence-based, safe, at-home exercises using common household items and outdoor environments.

WHAT YOU DO:
- Generate exercise protocols for: post-surgical recovery (TPLO, IVDD, luxating patella, fractures), osteoarthritis, hip dysplasia, geriatric mobility, sporting/agility conditioning, muscle building, weight management, general deconditioning
- Use REAL household items: pillows, couch cushions, stairs, ramps, towels, broomsticks, chairs, yoga mats, carpet vs hardwood differences
- Outdoor exercises: zig-zag walking (stabilizer muscles), sand walking (full-body workout), hill walking, curb step-ups, figure-8 patterns around trees, cavaletti with sticks/brooms
- Create full exercise courses: indoor courses using furniture, outdoor courses using yard/park features
- Progressive protocols: start gentle, build over weeks, track progression
- Fun exercises: make rehab enjoyable for both pet and owner

EXERCISE ACCURACY RULES:
- Every exercise must be evidence-based \u2014 traceable to Millis & Levine or established veterinary rehabilitation literature
- When asked "what do you have at home?" \u2014 use ONLY what they list. Never suggest items they don't have.
- Include: exercise name, target muscles/joints, duration, repetitions, frequency, difficulty level, safety cues
- Tag exercises as INDOOR or OUTDOOR
- Note if exercise needs supervision

SAFETY RULES:
- If pain >= 7/10, advise veterinary consultation before continuing
- Post-surgical: always ask how many weeks post-op before recommending
- Never diagnose, never prescribe medication
- Always include "when to stop" cues for each exercise
- Emergency signs \u2192 tell them to contact their vet IMMEDIATELY

COMMUNICATION STYLE:
- Warm, encouraging, like a trusted friend who happens to be a rehab expert
- Use plain language, no heavy jargon
- Celebrate progress, motivate consistency
- Use emojis sparingly but warmly
- Structure exercises clearly with bullet points
- Always end with encouragement

PATIENT PROFILE:
- Name: ${pet.name || "Not provided"}
- Species: ${pet.species || "Dog"}
- Breed: ${pet.breed || "Not specified"}
- Age: ${pet.age || "Unknown"}
- Weight: ${pet.weight || "Unknown"}
- Condition: ${pet.condition || "Not specified"}

RESPONSE STRUCTURE (when providing exercise plans):
1. Warm greeting referencing the pet by name
2. Brief context acknowledgment
3. Exercise recommendations (with clear instructions)
4. Safety reminders
5. Encouragement and next-step suggestion

If this is the first message, introduce yourself warmly, acknowledge the patient profile, and ask if the owner is ready to get started with a home exercise plan.`;
}

// ─── Markdown-lite renderer ────────────────────────────────────────────────
function renderMessageText(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("### ")) {
      elements.push(<h4 key={i} style={{ fontWeight: 700, fontSize: 15, margin: "12px 0 4px", color: C.navy }}>{line.slice(4)}</h4>);
    } else if (line.startsWith("## ")) {
      elements.push(<h3 key={i} style={{ fontWeight: 700, fontSize: 16, margin: "14px 0 6px", color: C.navy }}>{line.slice(3)}</h3>);
    } else if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(<p key={i} style={{ fontWeight: 700, margin: "10px 0 2px" }}>{line.slice(2, -2)}</p>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 2, paddingLeft: 4 }}>
          <span style={{ color: C.flame, flexShrink: 0 }}>{"\u2022"}</span>
          <span>{formatInline(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\.\s/)[1];
      elements.push(
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 2, paddingLeft: 4 }}>
          <span style={{ color: C.flame, fontWeight: 600, flexShrink: 0 }}>{num}.</span>
          <span>{formatInline(line.replace(/^\d+\.\s/, ""))}</span>
        </div>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} style={{ height: 8 }} />);
    } else {
      elements.push(<p key={i} style={{ margin: "2px 0" }}>{formatInline(line)}</p>);
    }
    i++;
  }
  return elements;
}

function formatInline(text) {
  // Bold
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function BeauHomeView() {
  // App state: "splash" | "auth" | "chat"
  const [screen, setScreen] = useState("splash");
  const [authTab, setAuthTab] = useState("signin"); // "signin" | "create"
  const [user, setUser] = useState(() => {
    try { const u = localStorage.getItem("beau_user"); return u ? JSON.parse(u) : null; } catch { return null; }
  });

  // Auth form
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authError, setAuthError] = useState("");

  // Pet info
  const [petInfoOpen, setPetInfoOpen] = useState(true);
  const [pet, setPet] = useState({ species: "dog", breed: "", name: "", age: "", weight: "", condition: "" });
  const [sessionStarted, setSessionStarted] = useState(false);

  // Chat
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedExercises, setSavedExercises] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll chat to bottom
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  // Auto-focus input after session starts
  useEffect(() => { if (sessionStarted && inputRef.current) inputRef.current.focus(); }, [sessionStarted]);

  // Restore user from localStorage on mount
  useEffect(() => {
    if (user) setScreen("chat");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Auth handlers ────────────────────────────────────────────
  function handleAuthSubmit(e) {
    e.preventDefault();
    setAuthError("");
    if (!authEmail.trim() || !authPass.trim()) { setAuthError("Email and password are required."); return; }
    if (authTab === "create" && !authName.trim()) { setAuthError("Name is required."); return; }
    const userData = { name: authTab === "create" ? authName.trim() : authEmail.split("@")[0], email: authEmail.trim() };
    localStorage.setItem("beau_user", JSON.stringify(userData));
    setUser(userData);
    setScreen("chat");
    setAuthError("");
  }

  function handleSignOut() {
    localStorage.removeItem("beau_user");
    setUser(null);
    setSessionStarted(false);
    setMessages([]);
    setPet({ species: "dog", breed: "", name: "", age: "", weight: "", condition: "" });
    setPetInfoOpen(true);
    setSavedExercises([]);
    setScreen("splash");
  }

  // ─── Pet / Chat handlers ──────────────────────────────────────
  function updatePet(field, value) { setPet(p => ({ ...p, [field]: value })); }

  const handleStartSession = useCallback(async () => {
    if (!pet.name.trim()) return;
    setSessionStarted(true);
    setPetInfoOpen(false);
    const systemPrompt = buildSystemPrompt(pet);
    const firstMsg = [{ role: "user", content: `Hi B.E.A.U.! I'm here with ${pet.name}. Can you introduce yourself and help us get started?` }];
    setMessages([{ role: "user", text: firstMsg[0].content }]);
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: firstMsg, systemPrompt }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages(prev => [...prev, { role: "assistant", text: data.text }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "I'm sorry \u2014 I'm having trouble connecting right now. Please try again in a moment." }]);
    } finally { setLoading(false); }
  }, [pet]);

  async function handleSend(e) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    const userMsg = { role: "user", text: trimmed };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    const apiMessages = updated.map(m => ({ role: m.role, content: m.text }));
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, systemPrompt: buildSystemPrompt(pet) }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages(prev => [...prev, { role: "assistant", text: data.text }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "I'm sorry \u2014 something went wrong. Please try again." }]);
    } finally { setLoading(false); }
  }

  function handleQuickAction(action, msgIndex) {
    if (action === "save") {
      const msg = messages[msgIndex];
      if (msg) setSavedExercises(prev => [...prev, { text: msg.text.slice(0, 120) + "...", savedAt: new Date().toLocaleTimeString() }]);
    } else if (action === "another") {
      setInput("Show me another option");
      inputRef.current?.focus();
    } else if (action === "easier") {
      setInput("Make it easier");
      inputRef.current?.focus();
    }
  }

  function handleNewChat() {
    setMessages([]);
    setSessionStarted(false);
    setPetInfoOpen(true);
    setPet({ species: "dog", breed: "", name: "", age: "", weight: "", condition: "" });
  }

  const breeds = pet.species === "dog" ? DOG_BREEDS : CAT_BREEDS;
  const speciesEmoji = pet.species === "dog" ? "\uD83D\uDC15" : "\uD83D\uDC31";

  // ═════════════════════════════════════════════════════════════════
  //  SCREEN 1: SPLASH
  // ═════════════════════════════════════════════════════════════════
  if (screen === "splash") {
    return (
      <div className="mesh-warm fade-in" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ filter: "drop-shadow(0 0 60px rgba(232,117,26,0.2))", marginBottom: 32 }}>
          <LogoIcon size={120} />
        </div>
        <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 48, fontWeight: 800, color: C.navy, marginBottom: 8, textAlign: "center" }}>
          B.E.A.U. Home
        </h1>
        <p style={{ fontSize: 20, color: C.muted, marginBottom: 4, textAlign: "center" }}>
          Your Pet's Recovery Companion
        </p>
        <p style={{ fontSize: 14, color: C.light, marginBottom: 48, textAlign: "center" }}>
          Evidence-Based Exercises for Every Pet Parent
        </p>
        <button
          className="btn-sunrise"
          onClick={() => setScreen(user ? "chat" : "auth")}
          style={{ padding: "16px 56px", borderRadius: 16, fontSize: 18, fontWeight: 700, cursor: "pointer", border: "none" }}
        >
          Enter
        </button>
        <p style={{ fontSize: 12, color: C.light, marginTop: 48, textAlign: "center" }}>
          &copy; 2025 Salvatore Bonanno. All rights reserved.
        </p>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════
  //  SCREEN 2: SIGN IN / CREATE ACCOUNT
  // ═════════════════════════════════════════════════════════════════
  if (screen === "auth") {
    const inputStyle = {
      width: "100%", borderRadius: 12, padding: "12px 16px", fontSize: 14, outline: "none",
      border: `1px solid ${C.border}`, color: C.text, background: C.card,
      transition: "border-color 0.2s",
    };
    return (
      <div className="mesh-warm fade-in" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="glass slide-up" style={{ borderRadius: 24, padding: 40, width: "100%", maxWidth: 420 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <LogoIcon size={36} />
            <div>
              <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 700, color: C.navy }}>B.E.A.U. Home</h2>
              <p style={{ fontSize: 13, color: C.muted }}>Welcome</p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", marginBottom: 24, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }}>
            {["signin", "create"].map(tab => (
              <button key={tab} onClick={() => { setAuthTab(tab); setAuthError(""); }}
                style={{
                  flex: 1, padding: "10px 0", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer",
                  background: authTab === tab ? C.flame : C.card,
                  color: authTab === tab ? "#fff" : C.muted,
                  transition: "all 0.2s",
                }}>
                {tab === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {authError && (
            <div style={{ padding: 12, borderRadius: 10, background: "#FEF2F2", color: "#DC2626", fontSize: 13, marginBottom: 16 }}>{authError}</div>
          )}

          <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {authTab === "create" && (
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>Name</label>
                <input style={inputStyle} value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Your name" />
              </div>
            )}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>Email</label>
              <input type="email" style={inputStyle} value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>Password</label>
              <input type="password" style={inputStyle} value={authPass} onChange={e => setAuthPass(e.target.value)} placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"} />
            </div>
            <button type="submit" className="btn-sunrise" style={{ padding: "14px 0", borderRadius: 12, fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", marginTop: 4 }}>
              {authTab === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: 13, color: C.muted, marginTop: 20 }}>
            {authTab === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setAuthTab(authTab === "signin" ? "create" : "signin"); setAuthError(""); }}
              style={{ background: "none", border: "none", color: C.flame, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
              {authTab === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════
  //  SCREEN 3: MAIN CHAT
  // ═════════════════════════════════════════════════════════════════
  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg }}>

      {/* ─── Side Panel ─────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="slide-up" style={{
          width: 280, flexShrink: 0, display: "flex", flexDirection: "column",
          background: C.card, borderRight: `1px solid ${C.border}`,
          overflowY: "auto",
        }}>
          {/* Sidebar header */}
          <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <LogoIcon size={32} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 16, color: C.navy }}>B.E.A.U. Home</span>
            </div>
            <button onClick={handleNewChat}
              style={{
                width: "100%", padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 600,
                border: `1px solid ${C.border}`, background: C.warm, color: C.navy, cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.cream; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.warm; }}
            >
              + New Chat
            </button>
          </div>

          {/* Sidebar sections */}
          <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Progress Tracker */}
            <div style={{ padding: "12px 14px", borderRadius: 10, background: C.warm }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span>{"\uD83D\uDCCA"}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>Progress Tracker</span>
              </div>
              <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
                {messages.filter(m => m.role === "user").length} questions asked &middot; {messages.filter(m => m.role === "assistant").length} responses
              </p>
            </div>

            {/* Saved Exercises */}
            <div style={{ padding: "12px 14px", borderRadius: 10, background: C.warm }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span>{"\uD83D\uDCBE"}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>Saved Exercises</span>
              </div>
              {savedExercises.length === 0 ? (
                <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Save exercises from chat to see them here</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {savedExercises.map((ex, i) => (
                    <div key={i} style={{ fontSize: 11, color: C.text, padding: "6px 8px", background: C.card, borderRadius: 6, border: `1px solid ${C.border}` }}>
                      {ex.text}
                      <span style={{ display: "block", fontSize: 10, color: C.light, marginTop: 2 }}>{ex.savedAt}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* How to Use */}
            <div style={{ borderRadius: 10, background: C.warm, overflow: "hidden" }}>
              <button onClick={() => setHelpOpen(!helpOpen)}
                style={{
                  width: "100%", padding: "12px 14px", display: "flex", alignItems: "center", gap: 8,
                  border: "none", background: "transparent", cursor: "pointer", textAlign: "left",
                }}>
                <span>{"\u2753"}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.navy, flex: 1 }}>How to Use B.E.A.U.</span>
                <span style={{ color: C.muted, fontSize: 12 }}>{helpOpen ? "\u25B2" : "\u25BC"}</span>
              </button>
              {helpOpen && (
                <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {HOW_TO_STEPS.map((item) => (
                    <div key={item.step} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                        background: `linear-gradient(135deg, ${C.flame}, ${C.amber})`,
                        color: "#fff", fontSize: 12, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginTop: 1,
                      }}>
                        {item.step}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 2 }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* User info at bottom */}
          <div style={{ padding: "16px 20px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{user?.name || "Guest"}</span>
            <button onClick={handleSignOut}
              style={{ fontSize: 12, color: C.muted, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ─── Chat Area ──────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Mobile sidebar toggle */}
        <div style={{ display: "flex", alignItems: "center", padding: "8px 16px", borderBottom: `1px solid ${C.border}`, background: C.card }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.navy, marginRight: 12 }}>
            {sidebarOpen ? "\u2630" : "\u2630"}
          </button>
          <LogoIcon size={24} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14, color: C.navy, marginLeft: 8 }}>B.E.A.U. Home</span>
        </div>

        {/* Disclaimer banner */}
        <div style={{
          padding: "10px 20px", fontSize: 12, color: C.muted, textAlign: "center",
          background: C.cream, borderBottom: `1px solid ${C.border}`,
        }}>
          B.E.A.U. Home provides evidence-based exercise guidance &mdash; not veterinary diagnosis. Always consult your veterinarian before starting any exercise program.
        </div>

        {/* Chat messages area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

          {/* Pet info pill (collapsed) */}
          {sessionStarted && !petInfoOpen && (
            <div className="fade-in" style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px",
              borderRadius: 20, background: C.warm, border: `1px solid ${C.border}`,
              marginBottom: 16, cursor: "pointer", fontSize: 13, color: C.navy, fontWeight: 500,
            }}
              onClick={() => setPetInfoOpen(true)}
            >
              <span>{speciesEmoji}</span>
              <span>{pet.name}</span>
              <span style={{ color: C.light }}>&middot;</span>
              <span style={{ color: C.muted }}>{pet.breed || pet.species}</span>
              {pet.condition && <>
                <span style={{ color: C.light }}>&middot;</span>
                <span style={{ color: C.flame, fontWeight: 600 }}>{pet.condition}</span>
              </>}
              <span style={{ fontSize: 10, color: C.light, marginLeft: 4 }}>{"\u25BC"}</span>
            </div>
          )}

          {/* Pet info bar (expanded) — above chat when no session yet, or toggled open */}
          {petInfoOpen && (
            <div className="glass slide-up" style={{
              borderRadius: 16, padding: 24, marginBottom: 20,
              border: `1px solid ${C.border}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 17, color: C.navy, margin: 0 }}>
                  Tell us about your pet
                </h3>
                {sessionStarted && (
                  <button onClick={() => setPetInfoOpen(false)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.muted }}>&times;</button>
                )}
              </div>

              {/* Species toggle */}
              <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                {[{ key: "dog", emoji: "\uD83D\uDC15", label: "Dog" }, { key: "cat", emoji: "\uD83D\uDC31", label: "Cat" }].map(s => (
                  <button key={s.key}
                    onClick={() => updatePet("species", s.key)}
                    style={{
                      flex: 1, padding: "14px 0", borderRadius: 12, fontSize: 15, fontWeight: 600,
                      border: `2px solid ${pet.species === s.key ? C.flame : C.border}`,
                      background: pet.species === s.key ? C.warm : C.card,
                      color: pet.species === s.key ? C.flame : C.muted,
                      cursor: "pointer", transition: "all 0.2s",
                    }}>
                    <span style={{ fontSize: 24, display: "block", marginBottom: 4 }}>{s.emoji}</span>
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Breed + Name row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>Breed</label>
                  <select value={pet.breed} onChange={e => updatePet("breed", e.target.value)}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 13,
                      border: `1px solid ${C.border}`, background: C.card, color: C.text, outline: "none",
                    }}>
                    <option value="">Select breed...</option>
                    {breeds.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>Pet Name</label>
                  <input value={pet.name} onChange={e => updatePet("name", e.target.value)}
                    placeholder="e.g. Beau"
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 13,
                      border: `1px solid ${C.border}`, background: C.card, color: C.text, outline: "none",
                    }} />
                </div>
              </div>

              {/* Age + Weight row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>Age</label>
                  <input value={pet.age} onChange={e => updatePet("age", e.target.value)}
                    placeholder="e.g. 7 years"
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 13,
                      border: `1px solid ${C.border}`, background: C.card, color: C.text, outline: "none",
                    }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>Weight</label>
                  <input value={pet.weight} onChange={e => updatePet("weight", e.target.value)}
                    placeholder="e.g. 65 lbs"
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 13,
                      border: `1px solid ${C.border}`, background: C.card, color: C.text, outline: "none",
                    }} />
                </div>
              </div>

              {/* Condition */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>Condition</label>
                <select value={pet.condition} onChange={e => updatePet("condition", e.target.value)}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 13,
                    border: `1px solid ${C.border}`, background: C.card, color: C.text, outline: "none",
                  }}>
                  <option value="">Select condition (optional)...</option>
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Start Session */}
              <button onClick={handleStartSession}
                className="btn-sunrise"
                disabled={!pet.name.trim()}
                style={{
                  width: "100%", padding: "14px 0", borderRadius: 12, fontSize: 15, fontWeight: 700,
                  border: "none", cursor: pet.name.trim() ? "pointer" : "not-allowed",
                  opacity: pet.name.trim() ? 1 : 0.4,
                }}>
                Start Session
              </button>
            </div>
          )}

          {/* Welcome message when session not started */}
          {!sessionStarted && !petInfoOpen && (
            <div className="fade-in" style={{ textAlign: "center", paddingTop: 60 }}>
              <LogoIcon size={64} />
              <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 700, color: C.navy, marginTop: 16 }}>
                Welcome to B.E.A.U. Home
              </h2>
              <p style={{ fontSize: 14, color: C.muted, marginTop: 8 }}>Fill in your pet's info above to get started.</p>
            </div>
          )}

          {/* Chat messages */}
          {messages.map((m, i) => {
            const isUser = m.role === "user";
            const isAssistant = m.role === "assistant";
            return (
              <div key={i} className="fade-in" style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 16 }}>
                {/* B.E.A.U. avatar */}
                {isAssistant && (
                  <div style={{ marginRight: 10, flexShrink: 0, marginTop: 4 }}>
                    <LogoIcon size={28} />
                  </div>
                )}
                <div style={{
                  maxWidth: "75%",
                  padding: "14px 18px",
                  fontSize: 14,
                  lineHeight: 1.6,
                  borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  ...(isUser ? {
                    background: `linear-gradient(135deg, ${C.flame}, ${C.fire})`,
                    color: "#fff",
                  } : {
                    background: C.card,
                    color: C.text,
                    border: `1px solid ${C.border}`,
                    borderLeft: `3px solid ${C.flame}`,
                  }),
                }}>
                  {isAssistant ? renderMessageText(m.text) : m.text}
                </div>
              </div>
            );
          })}

          {/* Quick actions after assistant messages */}
          {messages.length > 0 && messages[messages.length - 1].role === "assistant" && !loading && (
            <div className="fade-in" style={{ display: "flex", gap: 8, marginLeft: 38, marginBottom: 16, flexWrap: "wrap" }}>
              <button onClick={() => handleQuickAction("save", messages.length - 1)}
                style={{
                  padding: "8px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  border: `1px solid ${C.border}`, background: C.warm, color: C.navy,
                  cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.flame; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}
              >
                Save this exercise
              </button>
              <button onClick={() => handleQuickAction("another")}
                style={{
                  padding: "8px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  border: `1px solid ${C.border}`, background: C.warm, color: C.navy,
                  cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.flame; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}
              >
                Show me another option
              </button>
              <button onClick={() => handleQuickAction("easier")}
                style={{
                  padding: "8px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  border: `1px solid ${C.border}`, background: C.warm, color: C.navy,
                  cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.flame; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}
              >
                Make it easier
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
              <div style={{ marginRight: 10, flexShrink: 0 }}>
                <LogoIcon size={28} />
              </div>
              <div style={{
                padding: "14px 20px", borderRadius: "18px 18px 18px 4px",
                background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.flame}`,
              }}>
                <span className="paw-pulse" style={{ fontSize: 24, display: "inline-block" }}>{"\uD83D\uDC3E"}</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* ─── Chat Input ─────────────────────────────────────── */}
        {sessionStarted && (
          <div style={{ padding: "12px 24px 20px", borderTop: `1px solid ${C.border}`, background: C.card }}>
            <form onSubmit={handleSend} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                flex: 1, display: "flex", alignItems: "center", gap: 10,
                padding: "4px 6px 4px 18px", borderRadius: 24,
                border: `1px solid ${C.border}`, background: C.bg,
                transition: "border-color 0.2s",
              }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={`Ask B.E.A.U. about ${pet.name || "your pet"}...`}
                  disabled={loading}
                  style={{
                    flex: 1, border: "none", background: "transparent", outline: "none",
                    padding: "10px 0", fontSize: 14, color: C.text,
                  }}
                />
                <button type="submit" disabled={loading || !input.trim()}
                  className="btn-sunrise"
                  style={{
                    width: 38, height: 38, borderRadius: "50%", border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                    opacity: loading || !input.trim() ? 0.3 : 1,
                    flexShrink: 0,
                  }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
