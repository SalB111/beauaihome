import React, { useState, useRef, useEffect, useCallback } from "react";

// ─── Constants ──────────────────────────────────────────────────────────────
const API_URL = "/api/chat-home";

const SIDEBAR_TABS = [
  { key: "plan", label: "Plan", icon: "\ud83d\udccb" },
  { key: "progress", label: "Progress", icon: "\ud83d\udcc8" },
  { key: "guide", label: "Guide", icon: "\ud83d\udcd6" },
  { key: "suggest", label: "Suggest", icon: "\ud83d\udca1" },
];

const SPECIES_OPTIONS = ["Dog", "Cat"];
const SIZE_OPTIONS = ["Small (<20 lbs)", "Medium (20\u201350 lbs)", "Large (50\u201390 lbs)", "Giant (90+ lbs)"];
const CONDITION_OPTIONS = [
  "Post-TPLO / CCL Surgery",
  "IVDD (Intervertebral Disc Disease)",
  "Osteoarthritis",
  "Hip Dysplasia",
  "Luxating Patella (post-op)",
  "Fracture Recovery",
  "Geriatric Mobility",
  "Obesity / Weight Management",
  "General Deconditioning",
  "Soft Tissue Injury",
  "Other",
];
const MOBILITY_OPTIONS = [
  "Normal \u2014 moves freely",
  "Mild \u2014 slight limp, mostly mobile",
  "Moderate \u2014 noticeable limp, avoids some activity",
  "Severe \u2014 reluctant to walk, needs support",
  "Non-ambulatory \u2014 cannot walk unassisted",
];
const PAIN_OPTIONS = ["0 \u2014 No pain", "1\u20132 \u2014 Mild", "3\u20134 \u2014 Moderate", "5\u20136 \u2014 Significant", "7\u20138 \u2014 Severe", "9\u201310 \u2014 Extreme"];
const EQUIPMENT_OPTIONS = [
  "None",
  "Cavaletti rails",
  "Balance disc / wobble board",
  "Physio ball",
  "Resistance band",
  "Ramp / stairs",
  "Underwater treadmill (clinic access)",
  "Therapy pool (clinic access)",
];

const QUICK_REPLIES = [
  "What exercises should we start with?",
  "How long should each session be?",
  "What warning signs should I watch for?",
];

// ─── Logo ───────────────────────────────────────────────────────────────────
function LogoIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" rx="38" fill="#030c18"/>
      <rect width="200" height="200" rx="38" fill="url(#bgG)" />
      <defs>
        <radialGradient id="bgG" cx="50%" cy="52%" r="46%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.14"/>
          <stop offset="100%" stopColor="#020c18" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="sG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0284c7"/><stop offset="45%" stopColor="#38bdf8"/><stop offset="100%" stopColor="#0284c7"/>
        </linearGradient>
        <linearGradient id="snG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8"/><stop offset="100%" stopColor="#0ea5e9"/>
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="197" height="197" rx="36.5" fill="none" stroke="#0ea5e9" strokeWidth="1.2" strokeOpacity="0.22"/>
      <path d="M 91 122 C 40 116, 36 80, 109 76" fill="none" stroke="#0369a1" strokeWidth="6" strokeOpacity="0.65" strokeLinecap="round"/>
      <rect x="95.5" y="24" width="9" height="152" rx="4.5" fill="url(#sG)"/>
      <circle cx="100" cy="22" r="10" fill="#0ea5e9"/><circle cx="100" cy="22" r="5.5" fill="#030c18"/><circle cx="100" cy="22" r="2.5" fill="#38bdf8"/>
      <rect x="82" y="172" width="36" height="5.5" rx="2.75" fill="#0ea5e9"/>
      <path d="M 116 166 C 156 158, 158 118, 91 122" fill="none" stroke="url(#snG)" strokeWidth="6.2" strokeLinecap="round"/>
      <path d="M 109 76 C 152 68, 152 34, 88 26" fill="none" stroke="url(#snG)" strokeWidth="6.2" strokeLinecap="round"/>
      <ellipse cx="84" cy="21" rx="15" ry="10" fill="#051828" stroke="#0ea5e9" strokeWidth="2.2" transform="rotate(-28 84 21)"/>
      <circle cx="77" cy="17" r="3.8" fill="#38bdf8"/><circle cx="77" cy="17" r="1.8" fill="#010810"/>
      <path d="M 69 24 C 63 21, 59 19, 55 17" fill="none" stroke="#0ea5e9" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M 69 24 C 63 25, 59 27, 55 30" fill="none" stroke="#0ea5e9" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

// ─── System Prompt Builder ──────────────────────────────────────────────────
function buildSystemPrompt(intake) {
  const {
    petName, species, breed, age, weight, size,
    condition, conditionOther, surgery, surgeryDate, surgeryWeeksAgo,
    mobility, painLevel, vetName, medications,
    equipment, goals, additionalNotes,
  } = intake;

  const conditionText = condition === "Other" ? conditionOther : condition;
  const surgeryInfo = surgery
    ? `Surgery: Yes \u2014 ${surgeryDate ? `Date: ${surgeryDate}` : "date not provided"}${surgeryWeeksAgo ? `, approximately ${surgeryWeeksAgo} weeks ago` : ""}.`
    : "Surgery: No recent surgery reported.";
  const equipmentList = (equipment || []).filter(Boolean).join(", ") || "None specified";
  const goalsList = goals || "General recovery and improved mobility";

  return `You are B.E.A.U. (Biomedical Evidence-Based Assessment Utility) \u2014 Home Edition.

You are a warm, knowledgeable, and encouraging virtual rehabilitation guide for pet owners managing their pet's recovery at home. You were created by Salvatore Bonanno, a Certified Canine Rehabilitation Nurse with 30 years of veterinary experience.

IMPORTANT SCOPE RULES \u2014 you MUST follow these:
- You are a HOME REHABILITATION GUIDE, not a veterinarian.
- You NEVER diagnose conditions, prescribe medications, or replace veterinary care.
- You provide gentle at-home exercises, lifestyle modifications, and recovery guidance.
- If the owner describes symptoms that suggest an emergency (sudden paralysis, uncontrolled bleeding, seizures, respiratory distress, extreme pain), you MUST tell them to contact their veterinarian or emergency clinic IMMEDIATELY and stop providing exercise guidance.
- If pain is reported as 7+ out of 10, advise the owner to consult their veterinarian before continuing exercises.
- Always remind the owner that your suggestions should be confirmed by their veterinarian.

PATIENT PROFILE:
- Name: ${petName || "Not provided"}
- Species: ${species || "Dog"}
- Breed: ${breed || "Not specified"}
- Age: ${age || "Unknown"}
- Weight: ${weight || "Unknown"}${size ? ` (${size})` : ""}
- Condition: ${conditionText || "Not specified"}
- ${surgeryInfo}
- Current Mobility: ${mobility || "Not assessed"}
- Pain Level: ${painLevel || "Not assessed"}
- Veterinarian: ${vetName || "Not specified"}
- Current Medications: ${medications || "None reported"}
- Available Equipment: ${equipmentList}
- Owner Goals: ${goalsList}
- Additional Notes: ${additionalNotes || "None"}

COMMUNICATION STYLE:
- Speak warmly and encouragingly, like a trusted rehabilitation nurse talking to a pet parent.
- Use plain language \u2014 avoid heavy medical jargon unless asked.
- Be specific with exercises: describe body position, duration, repetitions, and frequency.
- Organize responses with clear sections and bullet points when listing exercises.
- Always include safety cues (what to watch for, when to stop).
- When suggesting exercises, note the difficulty level (gentle / moderate / active).
- Celebrate small wins and encourage consistency.

RESPONSE STRUCTURE (when providing exercise plans):
1. Warm greeting referencing the pet by name
2. Brief context acknowledgment
3. Exercise recommendations (with clear instructions)
4. Safety reminders
5. Encouragement and next-step suggestion

If this is the first message, introduce yourself warmly, acknowledge the patient profile, and ask if the owner is ready to get started with a home exercise plan.`;
}

// ─── Progress Dots ──────────────────────────────────────────────────────────
function ProgressDots({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === current ? 32 : 8,
            height: 8,
            background: i === current
              ? "linear-gradient(90deg, #0EA5E9, #10B981)"
              : i < current ? "#0EA5E9" : "rgba(255,255,255,0.15)",
          }}
        />
      ))}
    </div>
  );
}

// ─── Auth Modal ─────────────────────────────────────────────────────────────
function AuthModal({ mode, onClose, onSwitch, onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { setError("Email and password are required."); return; }
    if (mode === "signup" && !name) { setError("Name is required."); return; }
    onAuth({ email, name: name || email.split("@")[0], mode });
  }

  const inputCls = "w-full rounded-xl px-4 py-3 text-sm outline-none bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md fade-in">
      <div className="glass-light rounded-2xl shadow-2xl w-full max-w-md p-8 relative slide-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-xl text-gray-400 hover:text-gray-600 transition-colors">
          &times;
        </button>
        <div className="flex items-center gap-3 mb-6">
          <LogoIcon size={36} />
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-xs text-gray-500">
              {mode === "login" ? "Sign in to save your pet's progress" : "Join B.E.A.U. Home to track recovery"}
            </p>
          </div>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">Your Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30 transition-all"
                placeholder="Your name" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30 transition-all"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30 transition-all"
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" />
          </div>
          <button type="submit"
            className="w-full text-white font-semibold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-sky-500/20"
            style={{ background: "linear-gradient(135deg, #0EA5E9, #10B981)" }}>
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
        <p className="text-center text-sm mt-5 text-gray-500">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={onSwitch} className="font-medium hover:underline" style={{ color: "#0EA5E9" }}>
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── Sidebar Panel ──────────────────────────────────────────────────────────
function SidebarPanel({ activeTab, intake, messages, onSuggest }) {
  const petName = intake?.petName || "your pet";

  if (activeTab === "plan") {
    return (
      <div className="p-5 space-y-4">
        <h3 className="font-bold text-sm text-white/90">Recovery Plan</h3>
        {intake?.condition ? (
          <div className="space-y-3">
            <div className="glass rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#0EA5E9" }}>Patient</p>
              <p className="text-sm font-semibold text-white">{petName}</p>
              <p className="text-xs mt-0.5 text-white/50">{intake.breed || intake.species} &middot; {intake.age || "Age unknown"}</p>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#10B981" }}>Condition</p>
              <p className="text-sm text-white/80">{intake.condition === "Other" ? intake.conditionOther : intake.condition}</p>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#F59E0B" }}>Phase</p>
              <p className="text-sm text-white/80">Home Recovery &mdash; Active</p>
            </div>
            {intake.mobility && (
              <div className="glass rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-white/40">Mobility</p>
                <p className="text-sm text-white/80">{intake.mobility}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-white/40">Complete the intake form to generate a plan.</p>
        )}
      </div>
    );
  }

  if (activeTab === "progress") {
    const questionCount = messages.filter((m) => m.role === "user").length;
    const responseCount = messages.filter((m) => m.role === "assistant").length;
    return (
      <div className="p-5 space-y-4">
        <h3 className="font-bold text-sm text-white/90">Progress</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold" style={{ color: "#0EA5E9", textShadow: "0 0 20px rgba(14,165,233,0.3)" }}>{questionCount}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider mt-1 text-white/40">Questions</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold" style={{ color: "#10B981", textShadow: "0 0 20px rgba(16,185,129,0.3)" }}>{responseCount}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider mt-1 text-white/40">Responses</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-white/40">
            Sign in to save progress across sessions and track {petName}'s recovery over time.
          </p>
        </div>
      </div>
    );
  }

  if (activeTab === "guide") {
    const tips = [
      { icon: "\ud83d\udc3e", title: "Getting Started", desc: "Ask B.E.A.U. for a daily exercise plan based on your pet's condition." },
      { icon: "\u23f1\ufe0f", title: "Session Length", desc: "Start with 5\u201310 minute sessions. Gradually increase as your pet builds stamina." },
      { icon: "\ud83d\udc40", title: "Watch For", desc: "Limping, whining, panting, or reluctance to continue means it's time to stop." },
      { icon: "\ud83d\udea8", title: "Call Your Vet", desc: "For sudden changes, worsening symptoms, or any concerns \u2014 always consult your vet." },
    ];
    return (
      <div className="p-5 space-y-4">
        <h3 className="font-bold text-sm text-white/90">Quick Guide</h3>
        <div className="space-y-3">
          {tips.map((t, i) => (
            <div key={i} className="glass rounded-xl p-3 flex gap-3">
              <span className="text-xl flex-shrink-0">{t.icon}</span>
              <div>
                <p className="text-sm font-semibold text-white/90">{t.title}</p>
                <p className="text-xs mt-0.5 text-white/50">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === "suggest") {
    const suggestions = [
      `What gentle exercises can I do with ${petName} today?`,
      `How do I know if ${petName} is in too much pain to exercise?`,
      `Can you give me a weekly schedule for ${petName}?`,
      `What signs of improvement should I look for?`,
      `How should I modify exercises if ${petName} seems tired?`,
      `What warm-up should I do before exercises?`,
    ];
    return (
      <div className="p-5 space-y-4">
        <h3 className="font-bold text-sm text-white/90">Suggested Questions</h3>
        <div className="space-y-2">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => onSuggest(s)}
              className="w-full text-left text-sm px-4 py-3 rounded-xl transition-all glass hover:border-sky-400/30 text-white/70 hover:text-white">
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function BeauHomeView() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    petName: "", species: "Dog", breed: "", age: "", weight: "", size: "",
    condition: "", conditionOther: "", surgery: false, surgeryDate: "", surgeryWeeksAgo: "",
    mobility: "", painLevel: "", vetName: "", medications: "",
    equipment: [], goals: "", additionalNotes: "",
  });
  const [intake, setIntake] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("plan");
  const [showAuth, setShowAuth] = useState(null);
  const [user, setUser] = useState(null);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (intake && inputRef.current) inputRef.current.focus(); }, [intake]);

  function updateForm(field, value) { setForm((p) => ({ ...p, [field]: value })); }
  function toggleEquipment(item) {
    setForm((p) => ({ ...p, equipment: p.equipment.includes(item) ? p.equipment.filter((e) => e !== item) : [...p.equipment, item] }));
  }

  function canAdvance() {
    if (step === 1) return form.petName.trim().length > 0;
    return true;
  }

  const handleStartSession = useCallback(async () => {
    setIntake(form);
    const systemPrompt = buildSystemPrompt(form);
    const initialMessages = [{ role: "user", content: `Hi B.E.A.U.! I just filled out ${form.petName}'s intake form. Can you introduce yourself and help us get started?` }];
    setMessages([{ role: "user", text: initialMessages[0].content }]);
    setLoading(true);
    setShowQuickReplies(false);
    try {
      const res = await fetch(API_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: initialMessages, systemPrompt }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages((prev) => [...prev, { role: "assistant", text: data.text }]);
      setShowQuickReplies(true);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "I'm sorry \u2014 I'm having trouble connecting right now. Please try again in a moment." }]);
    } finally { setLoading(false); }
  }, [form]);

  async function handleSend(e) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setShowQuickReplies(false);
    const userMsg = { role: "user", text: trimmed };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    const apiMessages = updated.map((m) => ({ role: m.role, content: m.text }));
    try {
      const res = await fetch(API_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, systemPrompt: buildSystemPrompt(intake) }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages((prev) => [...prev, { role: "assistant", text: data.text }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "I'm sorry \u2014 something went wrong. Please try again." }]);
    } finally { setLoading(false); }
  }

  function handleSuggest(text) { setInput(text); inputRef.current?.focus(); }
  function handleAuth({ email, name }) { setUser({ email, name }); setShowAuth(null); }

  function handleNewSession() {
    setIntake(null);
    setMessages([]);
    setStep(0);
    setForm({
      petName: "", species: "Dog", breed: "", age: "", weight: "", size: "",
      condition: "", conditionOther: "", surgery: false, surgeryDate: "", surgeryWeeksAgo: "",
      mobility: "", painLevel: "", vetName: "", medications: "",
      equipment: [], goals: "", additionalNotes: "",
    });
    setShowQuickReplies(false);
  }

  // Shared styles
  const inputCls = "w-full rounded-xl px-4 py-3 text-sm outline-none bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-sky-400/50 focus:ring-1 focus:ring-sky-400/20 transition-all";
  const labelCls = "block text-sm font-semibold mb-1.5 text-white/70";

  // ─── INTAKE: Multi-Step Wizard ─────────────────────────────────
  if (!intake) {
    return (
      <div className="min-h-screen mesh-bg flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 opacity-60">
            <LogoIcon size={24} />
            <span className="text-xs font-medium text-white/50">B.E.A.U. Home</span>
          </div>
          {user ? (
            <span className="text-sm text-white/50">Hi, <strong className="text-white/80">{user.name}</strong></span>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={() => setShowAuth("login")} className="text-sm font-medium hover:underline" style={{ color: "#0EA5E9" }}>Sign In</button>
              <button onClick={() => setShowAuth("signup")} className="text-sm text-white px-4 py-1.5 rounded-lg transition-all hover:shadow-lg hover:shadow-sky-500/20" style={{ background: "linear-gradient(135deg, #0EA5E9, #0F4C81)" }}>Sign Up</button>
            </div>
          )}
        </div>

        {/* Wizard Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">

          {/* Step 0: Hero */}
          {step === 0 && (
            <div className="text-center fade-in max-w-lg">
              <div className="inline-block mb-8" style={{ filter: "drop-shadow(0 0 40px rgba(14,165,233,0.25))" }}>
                <LogoIcon size={120} />
              </div>
              <h1 className="text-5xl font-bold tracking-tight text-white mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                B.E.A.U. Home
              </h1>
              <p className="text-lg text-white/60 mb-2">AI-Powered Pet Rehabilitation Guide</p>
              <p className="text-sm text-white/30 mb-10">Powered by 30 years of clinical expertise</p>
              <button
                onClick={() => setStep(1)}
                className="px-10 py-4 rounded-2xl text-white font-semibold text-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #0EA5E9, #10B981)",
                  boxShadow: "0 0 40px rgba(14,165,233,0.25), 0 4px 20px rgba(0,0,0,0.3)",
                }}>
                Get Started
              </button>
              <p className="text-xs text-white/20 mt-8">
                B.E.A.U. Home is a rehabilitation guide &mdash; not a substitute for veterinary care.
              </p>
            </div>
          )}

          {/* Step 1: Pet Info */}
          {step === 1 && (
            <div className="w-full max-w-xl slide-up">
              <ProgressDots current={0} total={4} />
              <div className="glass rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <LogoIcon size={32} />
                  <div>
                    <h2 className="text-xl font-bold text-white">Tell us about your pet</h2>
                    <p className="text-xs text-white/40">Step 1 of 4</p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Pet Name <span className="text-red-400">*</span></label>
                    <input className={inputCls} value={form.petName} onChange={(e) => updateForm("petName", e.target.value)} placeholder="e.g. Beau" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Species</label>
                      <select className={inputCls} value={form.species} onChange={(e) => updateForm("species", e.target.value)}>
                        {SPECIES_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Breed</label>
                      <input className={inputCls} value={form.breed} onChange={(e) => updateForm("breed", e.target.value)} placeholder="e.g. Golden Retriever" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={labelCls}>Age</label>
                      <input className={inputCls} value={form.age} onChange={(e) => updateForm("age", e.target.value)} placeholder="e.g. 7 years" />
                    </div>
                    <div>
                      <label className={labelCls}>Weight</label>
                      <input className={inputCls} value={form.weight} onChange={(e) => updateForm("weight", e.target.value)} placeholder="e.g. 65 lbs" />
                    </div>
                    <div>
                      <label className={labelCls}>Size</label>
                      <select className={inputCls} value={form.size} onChange={(e) => updateForm("size", e.target.value)}>
                        <option value="">Select...</option>
                        {SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between mt-8">
                  <button onClick={() => setStep(0)} className="px-6 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 transition-colors">
                    Back
                  </button>
                  <button
                    onClick={() => canAdvance() && setStep(2)}
                    disabled={!canAdvance()}
                    className="px-8 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-sky-500/20"
                    style={{ background: "linear-gradient(135deg, #0EA5E9, #10B981)" }}>
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Condition */}
          {step === 2 && (
            <div className="w-full max-w-xl slide-up">
              <ProgressDots current={1} total={4} />
              <div className="glass rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <LogoIcon size={32} />
                  <div>
                    <h2 className="text-xl font-bold text-white">What's the condition?</h2>
                    <p className="text-xs text-white/40">Step 2 of 4</p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Primary Condition</label>
                    <select className={inputCls} value={form.condition} onChange={(e) => updateForm("condition", e.target.value)}>
                      <option value="">Select condition...</option>
                      {CONDITION_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {form.condition === "Other" && (
                      <input className={`${inputCls} mt-3`} value={form.conditionOther} onChange={(e) => updateForm("conditionOther", e.target.value)} placeholder="Describe the condition..." />
                    )}
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer text-white/70">
                      <input type="checkbox" checked={form.surgery} onChange={(e) => updateForm("surgery", e.target.checked)} className="rounded w-4 h-4 accent-sky-500" />
                      Recent surgery
                    </label>
                    {form.surgery && (
                      <div className="grid grid-cols-2 gap-4 pl-7">
                        <div>
                          <label className={labelCls}>Surgery Date</label>
                          <input type="date" className={inputCls} value={form.surgeryDate} onChange={(e) => updateForm("surgeryDate", e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>Weeks Since Surgery</label>
                          <input type="number" className={inputCls} value={form.surgeryWeeksAgo} onChange={(e) => updateForm("surgeryWeeksAgo", e.target.value)} placeholder="e.g. 4" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Current Mobility</label>
                      <select className={inputCls} value={form.mobility} onChange={(e) => updateForm("mobility", e.target.value)}>
                        <option value="">Select...</option>
                        {MOBILITY_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Pain Level</label>
                      <select className={inputCls} value={form.painLevel} onChange={(e) => updateForm("painLevel", e.target.value)}>
                        <option value="">Select...</option>
                        {PAIN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between mt-8">
                  <button onClick={() => setStep(1)} className="px-6 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 transition-colors">Back</button>
                  <button onClick={() => setStep(3)} className="px-8 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-sky-500/20" style={{ background: "linear-gradient(135deg, #0EA5E9, #10B981)" }}>Next</button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Setup */}
          {step === 3 && (
            <div className="w-full max-w-xl slide-up">
              <ProgressDots current={2} total={4} />
              <div className="glass rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <LogoIcon size={32} />
                  <div>
                    <h2 className="text-xl font-bold text-white">Your setup</h2>
                    <p className="text-xs text-white/40">Step 3 of 4</p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Veterinarian Name</label>
                      <input className={inputCls} value={form.vetName} onChange={(e) => updateForm("vetName", e.target.value)} placeholder="e.g. Dr. Smith" />
                    </div>
                    <div>
                      <label className={labelCls}>Current Medications</label>
                      <input className={inputCls} value={form.medications} onChange={(e) => updateForm("medications", e.target.value)} placeholder="e.g. Carprofen" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Available Equipment</label>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {EQUIPMENT_OPTIONS.map((eq) => {
                        const selected = form.equipment.includes(eq);
                        return (
                          <button key={eq} type="button" onClick={() => toggleEquipment(eq)}
                            className="px-3.5 py-2 rounded-full text-xs font-semibold transition-all border"
                            style={{
                              background: selected ? "rgba(14,165,233,0.2)" : "rgba(255,255,255,0.03)",
                              color: selected ? "#38bdf8" : "rgba(255,255,255,0.4)",
                              borderColor: selected ? "rgba(14,165,233,0.5)" : "rgba(255,255,255,0.08)",
                              boxShadow: selected ? "0 0 12px rgba(14,165,233,0.15)" : "none",
                            }}>
                            {eq}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Recovery Goals</label>
                    <textarea className={`${inputCls} h-20 resize-none`} value={form.goals} onChange={(e) => updateForm("goals", e.target.value)} placeholder="e.g. Return to walking 30 minutes daily..." />
                  </div>
                  <div>
                    <label className={labelCls}>Additional Notes</label>
                    <textarea className={`${inputCls} h-16 resize-none`} value={form.additionalNotes} onChange={(e) => updateForm("additionalNotes", e.target.value)} placeholder="Anything else B.E.A.U. should know..." />
                  </div>
                </div>
                <div className="flex justify-between mt-8">
                  <button onClick={() => setStep(2)} className="px-6 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 transition-colors">Back</button>
                  <button onClick={() => setStep(4)} className="px-8 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-sky-500/20" style={{ background: "linear-gradient(135deg, #0EA5E9, #10B981)" }}>Next</button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Summary / Launch */}
          {step === 4 && (
            <div className="w-full max-w-xl slide-up">
              <ProgressDots current={3} total={4} />
              <div className="glass rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <LogoIcon size={32} />
                  <div>
                    <h2 className="text-xl font-bold text-white">Ready to begin</h2>
                    <p className="text-xs text-white/40">Step 4 of 4 &mdash; Review and start</p>
                  </div>
                </div>
                <div className="glass rounded-xl p-5 space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/40">Patient</span>
                    <span className="text-sm font-semibold text-white">{form.petName || "Not set"}</span>
                  </div>
                  <div className="border-t border-white/5" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/40">Species</span>
                    <span className="text-sm text-white/70">{form.species}{form.breed ? ` \u2014 ${form.breed}` : ""}</span>
                  </div>
                  {form.age && (<><div className="border-t border-white/5" /><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-white/40">Age</span><span className="text-sm text-white/70">{form.age}</span></div></>)}
                  {form.condition && (
                    <>
                      <div className="border-t border-white/5" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-white/40">Condition</span>
                        <span className="text-sm font-medium" style={{ color: "#0EA5E9" }}>{form.condition === "Other" ? form.conditionOther : form.condition}</span>
                      </div>
                    </>
                  )}
                  {form.mobility && (<><div className="border-t border-white/5" /><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-white/40">Mobility</span><span className="text-sm text-white/70">{form.mobility}</span></div></>)}
                  {form.painLevel && (<><div className="border-t border-white/5" /><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-white/40">Pain Level</span><span className="text-sm text-white/70">{form.painLevel}</span></div></>)}
                  {form.equipment.length > 0 && (<><div className="border-t border-white/5" /><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-white/40">Equipment</span><span className="text-sm text-white/50">{form.equipment.join(", ")}</span></div></>)}
                </div>
                <button
                  onClick={handleStartSession}
                  className="w-full py-4 rounded-xl text-white font-bold text-base transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background: "linear-gradient(135deg, #0EA5E9, #10B981)",
                    boxShadow: "0 0 30px rgba(14,165,233,0.2), 0 4px 15px rgba(0,0,0,0.3)",
                  }}>
                  Start Session with B.E.A.U.
                </button>
                <div className="flex justify-between mt-4">
                  <button onClick={() => setStep(3)} className="px-6 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 transition-colors">Back</button>
                </div>
                <p className="text-xs text-center mt-4 text-white/20">
                  B.E.A.U. Home is a rehabilitation guide &mdash; not a substitute for veterinary care.
                </p>
              </div>
            </div>
          )}
        </div>

        {showAuth && <AuthModal mode={showAuth} onClose={() => setShowAuth(null)} onSwitch={() => setShowAuth(showAuth === "login" ? "signup" : "login")} onAuth={handleAuth} />}
      </div>
    );
  }

  // ─── CHAT SCREEN ───────────────────────────────────────────────
  return (
    <div className="flex h-screen mesh-bg">
      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 glass" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3">
            <LogoIcon size={36} />
            <div>
              <h1 className="font-bold text-sm text-white">B.E.A.U. Home</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "rgba(14,165,233,0.15)", color: "#38bdf8" }}>
                  {intake.petName}
                </span>
                {intake.condition && intake.condition !== "Other" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "rgba(16,185,129,0.15)", color: "#34d399" }}>
                    {intake.condition}
                  </span>
                )}
                {intake.condition === "Other" && intake.conditionOther && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "rgba(16,185,129,0.15)", color: "#34d399" }}>
                    {intake.conditionOther}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleNewSession}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all glass hover:border-white/20 text-white/50 hover:text-white/80">
              New Session
            </button>
            {user ? (
              <span className="text-xs text-white/50">{user.name}</span>
            ) : (
              <button onClick={() => setShowAuth("login")} className="text-xs font-medium hover:underline" style={{ color: "#0EA5E9" }}>Sign In</button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {messages.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 fade-in`}>
                {!isUser && (
                  <div className="mr-3 flex-shrink-0 mt-1">
                    <LogoIcon size={32} />
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap ${isUser ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-bl-md"}`}
                  style={isUser
                    ? { background: "linear-gradient(135deg, #0EA5E9, #0F4C81)", color: "#fff" }
                    : { background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)", borderLeft: "3px solid #0EA5E9", color: "rgba(255,255,255,0.85)" }
                  }>
                  {m.text}
                </div>
              </div>
            );
          })}

          {/* Quick Reply Chips */}
          {showQuickReplies && !loading && messages.length >= 2 && (
            <div className="flex flex-wrap gap-2 mb-4 ml-11 fade-in">
              {QUICK_REPLIES.map((qr, i) => (
                <button key={i} onClick={() => { setInput(qr); setShowQuickReplies(false); inputRef.current?.focus(); }}
                  className="px-4 py-2 rounded-full text-xs font-medium transition-all hover:scale-[1.03]"
                  style={{
                    background: "rgba(14,165,233,0.1)",
                    border: "1px solid rgba(14,165,233,0.25)",
                    color: "#38bdf8",
                  }}>
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start mb-4">
              <div className="mr-3 flex-shrink-0">
                <LogoIcon size={32} />
              </div>
              <div className="glass px-5 py-4 rounded-2xl rounded-bl-md" style={{ borderLeft: "3px solid #0EA5E9" }}>
                <span className="paw-pulse text-2xl inline-block">{"\ud83d\udc3e"}</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4">
          <form onSubmit={handleSend} className="relative">
            <div
              className="flex items-center gap-3 rounded-full px-5 py-1 transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask B.E.A.U. about ${intake.petName}'s recovery...`}
                disabled={loading}
                className="flex-1 bg-transparent py-3 text-sm text-white placeholder-white/30 outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg"
                style={{ background: "linear-gradient(135deg, #0EA5E9, #10B981)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </form>
          <p className="text-xs text-center mt-3 text-white/20">
            B.E.A.U. Home is a guide, not a veterinarian. Always confirm recommendations with your vet.
          </p>
        </div>
      </div>

      {/* Sidebar (desktop only) */}
      <div className="w-80 hidden lg:flex flex-col glass" style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {SIDEBAR_TABS.map((tab) => {
            const active = sidebarTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setSidebarTab(tab.key)}
                className="flex-1 py-3.5 text-center text-xs font-semibold transition-all"
                style={{
                  color: active ? "#38bdf8" : "rgba(255,255,255,0.3)",
                  borderBottom: active ? "2px solid #0EA5E9" : "2px solid transparent",
                  background: active ? "rgba(14,165,233,0.06)" : "transparent",
                }}>
                <span className="block text-base mb-0.5">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarPanel activeTab={sidebarTab} intake={intake} messages={messages} onSuggest={handleSuggest} />
        </div>
      </div>

      {showAuth && <AuthModal mode={showAuth} onClose={() => setShowAuth(null)} onSwitch={() => setShowAuth(showAuth === "login" ? "signup" : "login")} onAuth={handleAuth} />}
    </div>
  );
}
