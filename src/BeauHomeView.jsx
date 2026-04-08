import React, { useState, useRef, useEffect, useCallback } from "react";

// ─── Constants ──────────────────────────────────────────────────────────────
const API_URL = "/api/chat-home";

const SIDEBAR_TABS = [
  { key: "plan", label: "Plan", icon: "📋" },
  { key: "progress", label: "Progress", icon: "📈" },
  { key: "guide", label: "Guide", icon: "📖" },
  { key: "suggest", label: "Suggest", icon: "💡" },
];

const SPECIES_OPTIONS = ["Dog", "Cat"];
const SIZE_OPTIONS = ["Small (<20 lbs)", "Medium (20–50 lbs)", "Large (50–90 lbs)", "Giant (90+ lbs)"];
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
  "Normal — moves freely",
  "Mild — slight limp, mostly mobile",
  "Moderate — noticeable limp, avoids some activity",
  "Severe — reluctant to walk, needs support",
  "Non-ambulatory — cannot walk unassisted",
];
const PAIN_OPTIONS = ["0 — No pain", "1–2 — Mild", "3–4 — Moderate", "5–6 — Significant", "7–8 — Severe", "9–10 — Extreme"];
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

// ─── Theme ──────────────────────────────────────────────────────────────────
const T = {
  navy: "#0C2340",
  blue: "#0F4C81",
  teal: "#0EA5E9",
  green: "#10B981",
  gold: "#F59E0B",
  bg: "#F0F4F8",
  card: "#FFFFFF",
  text: "#1E293B",
  muted: "#64748B",
  light: "#94A3B8",
  border: "#E2E8F0",
  tealBg: "#F0F9FF",
  greenBg: "#ECFDF5",
  amberBg: "#FFFBEB",
};

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
    ? `Surgery: Yes — ${surgeryDate ? `Date: ${surgeryDate}` : "date not provided"}${surgeryWeeksAgo ? `, approximately ${surgeryWeeksAgo} weeks ago` : ""}.`
    : "Surgery: No recent surgery reported.";
  const equipmentList = (equipment || []).filter(Boolean).join(", ") || "None specified";
  const goalsList = goals || "General recovery and improved mobility";

  return `You are B.E.A.U. (Biomedical Evidence-Based Assessment Utility) — Home Edition.

You are a warm, knowledgeable, and encouraging virtual rehabilitation guide for pet owners managing their pet's recovery at home. You were created by Salvatore Bonanno, a Certified Canine Rehabilitation Nurse with 30 years of veterinary experience.

IMPORTANT SCOPE RULES — you MUST follow these:
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
- Use plain language — avoid heavy medical jargon unless asked.
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="rounded-2xl shadow-2xl w-full max-w-md p-8 relative" style={{ background: T.card }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-xl" style={{ color: T.light }}>
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-1" style={{ color: T.blue }}>
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </h2>
        <p className="text-sm mb-6" style={{ color: T.muted }}>
          {mode === "login" ? "Sign in to save your pet's progress" : "Join B.E.A.U. Home to track recovery"}
        </p>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: T.text }}>Your Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2" style={{ border: `1px solid ${T.border}`, focusRingColor: T.teal }} placeholder="Your name" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: T.text }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-400" style={{ border: `1px solid ${T.border}` }} placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: T.text }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-400" style={{ border: `1px solid ${T.border}` }} placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full text-white font-semibold py-2.5 rounded-lg transition-colors" style={{ background: T.blue }}>
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
        <p className="text-center text-sm mt-4" style={{ color: T.muted }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={onSwitch} className="font-medium hover:underline" style={{ color: T.teal }}>
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── Intake Form ────────────────────────────────────────────────────────────
function IntakeForm({ onSubmit }) {
  const [form, setForm] = useState({
    petName: "", species: "Dog", breed: "", age: "", weight: "", size: "",
    condition: "", conditionOther: "", surgery: false, surgeryDate: "", surgeryWeeksAgo: "",
    mobility: "", painLevel: "", vetName: "", medications: "",
    equipment: [], goals: "", additionalNotes: "",
  });

  function update(field, value) { setForm((p) => ({ ...p, [field]: value })); }
  function toggleEquipment(item) {
    setForm((p) => ({ ...p, equipment: p.equipment.includes(item) ? p.equipment.filter((e) => e !== item) : [...p.equipment, item] }));
  }
  function handleSubmit(e) { e.preventDefault(); if (!form.petName.trim()) return; onSubmit(form); }

  const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-400 bg-white";
  const inputStyle = { border: `1px solid ${T.border}`, color: T.text };
  const labelCls = "block text-sm font-semibold mb-1.5";

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4" style={{ background: `linear-gradient(135deg, ${T.navy}, ${T.blue})` }}>
          <span className="text-4xl">🐾</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: T.navy }}>B.E.A.U. Home</h1>
        <p className="mt-2 text-lg" style={{ color: T.muted }}>
          Your pet's personalized rehabilitation guide
        </p>
        <p className="text-sm mt-1" style={{ color: T.light }}>Powered by 30 years of clinical expertise</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl shadow-lg p-8 space-y-7" style={{ background: T.card, border: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-3 pb-4" style={{ borderBottom: `2px solid ${T.teal}` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold" style={{ background: T.blue }}>
            1
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: T.navy }}>Patient Intake</h2>
            <p className="text-xs" style={{ color: T.muted }}>Tell us about your pet so B.E.A.U. can personalize their plan</p>
          </div>
        </div>

        {/* Name, Species, Breed */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls} style={{ color: T.text }}>Pet Name <span style={{ color: "#EF4444" }}>*</span></label>
            <input className={inputCls} style={inputStyle} value={form.petName} onChange={(e) => update("petName", e.target.value)} placeholder="e.g. Beau" required />
          </div>
          <div>
            <label className={labelCls} style={{ color: T.text }}>Species</label>
            <select className={inputCls} style={inputStyle} value={form.species} onChange={(e) => update("species", e.target.value)}>
              {SPECIES_OPTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} style={{ color: T.text }}>Breed</label>
            <input className={inputCls} style={inputStyle} value={form.breed} onChange={(e) => update("breed", e.target.value)} placeholder="e.g. Golden Retriever" />
          </div>
        </div>

        {/* Age, Weight, Size */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls} style={{ color: T.text }}>Age</label>
            <input className={inputCls} style={inputStyle} value={form.age} onChange={(e) => update("age", e.target.value)} placeholder="e.g. 7 years" />
          </div>
          <div>
            <label className={labelCls} style={{ color: T.text }}>Weight</label>
            <input className={inputCls} style={inputStyle} value={form.weight} onChange={(e) => update("weight", e.target.value)} placeholder="e.g. 65 lbs" />
          </div>
          <div>
            <label className={labelCls} style={{ color: T.text }}>Size</label>
            <select className={inputCls} style={inputStyle} value={form.size} onChange={(e) => update("size", e.target.value)}>
              <option value="">Select size...</option>
              {SIZE_OPTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className={labelCls} style={{ color: T.text }}>Primary Condition</label>
          <select className={inputCls} style={inputStyle} value={form.condition} onChange={(e) => update("condition", e.target.value)}>
            <option value="">Select condition...</option>
            {CONDITION_OPTIONS.map((c) => <option key={c}>{c}</option>)}
          </select>
          {form.condition === "Other" && (
            <input className={`${inputCls} mt-2`} style={inputStyle} value={form.conditionOther} onChange={(e) => update("conditionOther", e.target.value)} placeholder="Describe the condition..." />
          )}
        </div>

        {/* Surgery */}
        <div className="space-y-3">
          <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer" style={{ color: T.text }}>
            <input type="checkbox" checked={form.surgery} onChange={(e) => update("surgery", e.target.checked)} className="rounded w-4 h-4 accent-sky-500" />
            Recent surgery
          </label>
          {form.surgery && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
              <div>
                <label className={labelCls} style={{ color: T.text }}>Surgery Date</label>
                <input type="date" className={inputCls} style={inputStyle} value={form.surgeryDate} onChange={(e) => update("surgeryDate", e.target.value)} />
              </div>
              <div>
                <label className={labelCls} style={{ color: T.text }}>Weeks Since Surgery</label>
                <input type="number" className={inputCls} style={inputStyle} value={form.surgeryWeeksAgo} onChange={(e) => update("surgeryWeeksAgo", e.target.value)} placeholder="e.g. 4" />
              </div>
            </div>
          )}
        </div>

        {/* Mobility & Pain */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls} style={{ color: T.text }}>Current Mobility</label>
            <select className={inputCls} style={inputStyle} value={form.mobility} onChange={(e) => update("mobility", e.target.value)}>
              <option value="">Select...</option>
              {MOBILITY_OPTIONS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} style={{ color: T.text }}>Pain Level</label>
            <select className={inputCls} style={inputStyle} value={form.painLevel} onChange={(e) => update("painLevel", e.target.value)}>
              <option value="">Select...</option>
              {PAIN_OPTIONS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Vet & Meds */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls} style={{ color: T.text }}>Veterinarian Name</label>
            <input className={inputCls} style={inputStyle} value={form.vetName} onChange={(e) => update("vetName", e.target.value)} placeholder="e.g. Dr. Smith" />
          </div>
          <div>
            <label className={labelCls} style={{ color: T.text }}>Current Medications</label>
            <input className={inputCls} style={inputStyle} value={form.medications} onChange={(e) => update("medications", e.target.value)} placeholder="e.g. Carprofen, Gabapentin" />
          </div>
        </div>

        {/* Equipment */}
        <div>
          <label className={labelCls} style={{ color: T.text }}>Available Equipment</label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {EQUIPMENT_OPTIONS.map((eq) => (
              <button key={eq} type="button" onClick={() => toggleEquipment(eq)}
                className="px-3.5 py-2 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: form.equipment.includes(eq) ? T.teal : "#F8FAFC",
                  color: form.equipment.includes(eq) ? "#FFF" : T.muted,
                  border: `1.5px solid ${form.equipment.includes(eq) ? T.teal : T.border}`,
                }}>
                {eq}
              </button>
            ))}
          </div>
        </div>

        {/* Goals & Notes */}
        <div>
          <label className={labelCls} style={{ color: T.text }}>Recovery Goals</label>
          <textarea className={`${inputCls} h-20 resize-none`} style={inputStyle} value={form.goals} onChange={(e) => update("goals", e.target.value)} placeholder="e.g. Return to walking 30 minutes daily, climb stairs again..." />
        </div>
        <div>
          <label className={labelCls} style={{ color: T.text }}>Additional Notes</label>
          <textarea className={`${inputCls} h-20 resize-none`} style={inputStyle} value={form.additionalNotes} onChange={(e) => update("additionalNotes", e.target.value)} placeholder="Anything else B.E.A.U. should know..." />
        </div>

        <button type="submit" className="w-full text-white font-bold py-3.5 rounded-xl text-base transition-all hover:shadow-lg"
          style={{ background: `linear-gradient(135deg, ${T.navy}, ${T.blue})` }}>
          Start B.E.A.U. Home Session
        </button>

        <p className="text-xs text-center" style={{ color: T.light }}>
          B.E.A.U. Home is a rehabilitation guide — not a substitute for veterinary care.
        </p>
      </form>
    </div>
  );
}

// ─── Chat Message ───────────────────────────────────────────────────────────
function ChatMessage({ role, text }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      {!isUser && (
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold mr-3 flex-shrink-0 mt-1"
          style={{ background: `linear-gradient(135deg, ${T.navy}, ${T.blue})` }}>
          B
        </div>
      )}
      <div className={`max-w-[75%] px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap ${isUser ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-bl-md"}`}
        style={{
          background: isUser ? T.blue : "#F1F5F9",
          color: isUser ? "#FFF" : T.text,
        }}>
        {text}
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
        <h3 className="font-bold text-sm" style={{ color: T.navy }}>Recovery Plan</h3>
        {intake?.condition ? (
          <div className="space-y-3">
            <div className="rounded-xl p-4" style={{ background: T.tealBg, border: `1px solid ${T.teal}22` }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: T.teal }}>Patient</p>
              <p className="text-sm font-semibold" style={{ color: T.navy }}>{petName}</p>
              <p className="text-xs mt-0.5" style={{ color: T.muted }}>{intake.breed || intake.species} · {intake.age || "Age unknown"}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: T.greenBg, border: `1px solid ${T.green}22` }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: T.green }}>Condition</p>
              <p className="text-sm" style={{ color: T.text }}>{intake.condition === "Other" ? intake.conditionOther : intake.condition}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: T.amberBg, border: `1px solid ${T.gold}22` }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: T.gold }}>Phase</p>
              <p className="text-sm" style={{ color: T.text }}>Home Recovery — Active</p>
            </div>
            {intake.mobility && (
              <div className="rounded-xl p-4" style={{ background: "#F8FAFC", border: `1px solid ${T.border}` }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: T.muted }}>Mobility</p>
                <p className="text-sm" style={{ color: T.text }}>{intake.mobility}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm" style={{ color: T.muted }}>Complete the intake form to generate a plan.</p>
        )}
      </div>
    );
  }

  if (activeTab === "progress") {
    const questionCount = messages.filter((m) => m.role === "user").length;
    const responseCount = messages.filter((m) => m.role === "assistant").length;
    return (
      <div className="p-5 space-y-4">
        <h3 className="font-bold text-sm" style={{ color: T.navy }}>Progress</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-4 text-center" style={{ background: T.tealBg }}>
            <p className="text-2xl font-extrabold" style={{ color: T.blue }}>{questionCount}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: T.muted }}>Questions</p>
          </div>
          <div className="rounded-xl p-4 text-center" style={{ background: T.greenBg }}>
            <p className="text-2xl font-extrabold" style={{ color: T.green }}>{responseCount}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: T.muted }}>Responses</p>
          </div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#F8FAFC", border: `1px solid ${T.border}` }}>
          <p className="text-xs" style={{ color: T.muted }}>
            Sign in to save progress across sessions and track {petName}'s recovery over time.
          </p>
        </div>
      </div>
    );
  }

  if (activeTab === "guide") {
    const tips = [
      { icon: "🐾", title: "Getting Started", desc: "Ask B.E.A.U. for a daily exercise plan based on your pet's condition." },
      { icon: "⏱️", title: "Session Length", desc: "Start with 5–10 minute sessions. Gradually increase as your pet builds stamina." },
      { icon: "👀", title: "Watch For", desc: "Limping, whining, panting, or reluctance to continue means it's time to stop." },
      { icon: "🚨", title: "Call Your Vet", desc: "For sudden changes, worsening symptoms, or any concerns — always consult your vet." },
    ];
    return (
      <div className="p-5 space-y-4">
        <h3 className="font-bold text-sm" style={{ color: T.navy }}>Quick Guide</h3>
        <div className="space-y-3">
          {tips.map((t, i) => (
            <div key={i} className="flex gap-3 rounded-xl p-3" style={{ background: "#F8FAFC" }}>
              <span className="text-xl flex-shrink-0">{t.icon}</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: T.text }}>{t.title}</p>
                <p className="text-xs mt-0.5" style={{ color: T.muted }}>{t.desc}</p>
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
        <h3 className="font-bold text-sm" style={{ color: T.navy }}>Suggested Questions</h3>
        <div className="space-y-2">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => onSuggest(s)}
              className="w-full text-left text-sm px-4 py-3 rounded-xl transition-all hover:shadow-sm"
              style={{ background: "#F8FAFC", color: T.text, border: `1px solid ${T.border}` }}>
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
  const [intake, setIntake] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("plan");
  const [showAuth, setShowAuth] = useState(null);
  const [user, setUser] = useState(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (intake && inputRef.current) inputRef.current.focus(); }, [intake]);

  const handleIntakeSubmit = useCallback(async (formData) => {
    setIntake(formData);
    const systemPrompt = buildSystemPrompt(formData);
    const initialMessages = [{ role: "user", content: `Hi B.E.A.U.! I just filled out ${formData.petName}'s intake form. Can you introduce yourself and help us get started?` }];
    setMessages([{ role: "user", text: initialMessages[0].content }]);
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: initialMessages, systemPrompt }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages((prev) => [...prev, { role: "assistant", text: data.text }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "I'm sorry — I'm having trouble connecting right now. Please try again in a moment." }]);
    } finally { setLoading(false); }
  }, []);

  async function handleSend(e) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
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
      setMessages((prev) => [...prev, { role: "assistant", text: "I'm sorry — something went wrong. Please try again." }]);
    } finally { setLoading(false); }
  }

  function handleSuggest(text) { setInput(text); inputRef.current?.focus(); }
  function handleAuth({ email, name }) { setUser({ email, name }); setShowAuth(null); }

  // ─── Intake Screen ──────────────────────────────────────────────
  if (!intake) {
    return (
      <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${T.bg} 0%, #FFFFFF 100%)` }}>
        <div className="flex items-center justify-end px-6 py-3" style={{ borderBottom: `1px solid ${T.border}`, background: "rgba(255,255,255,0.8)", backdropFilter: "blur(8px)" }}>
          {user ? (
            <span className="text-sm" style={{ color: T.muted }}>Hi, <strong style={{ color: T.text }}>{user.name}</strong></span>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={() => setShowAuth("login")} className="text-sm font-medium hover:underline" style={{ color: T.teal }}>Sign In</button>
              <button onClick={() => setShowAuth("signup")} className="text-sm text-white px-4 py-1.5 rounded-lg" style={{ background: T.blue }}>Sign Up</button>
            </div>
          )}
        </div>
        <IntakeForm onSubmit={handleIntakeSubmit} />
        {showAuth && <AuthModal mode={showAuth} onClose={() => setShowAuth(null)} onSwitch={() => setShowAuth(showAuth === "login" ? "signup" : "login")} onAuth={handleAuth} />}
      </div>
    );
  }

  // ─── Chat Screen ────────────────────────────────────────────────
  return (
    <div className="flex h-screen" style={{ background: T.bg }}>
      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3" style={{ background: T.card, borderBottom: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ background: `linear-gradient(135deg, ${T.navy}, ${T.blue})` }}>
              B
            </div>
            <div>
              <h1 className="font-bold text-sm" style={{ color: T.navy }}>B.E.A.U. Home</h1>
              <p className="text-xs" style={{ color: T.muted }}>
                {intake.petName}{intake.condition ? ` · ${intake.condition === "Other" ? intake.conditionOther : intake.condition}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => { setIntake(null); setMessages([]); }}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors" style={{ color: T.muted, background: "#F8FAFC", border: `1px solid ${T.border}` }}>
              New Session
            </button>
            {user ? (
              <span className="text-xs" style={{ color: T.muted }}>{user.name}</span>
            ) : (
              <button onClick={() => setShowAuth("login")} className="text-xs font-medium hover:underline" style={{ color: T.teal }}>Sign In</button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {messages.map((m, i) => <ChatMessage key={i} role={m.role} text={m.text} />)}
          {loading && (
            <div className="flex justify-start mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold mr-3 flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${T.navy}, ${T.blue})` }}>B</div>
              <div className="px-5 py-4 rounded-2xl rounded-bl-md" style={{ background: "#F1F5F9" }}>
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: T.light, animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: T.light, animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: T.light, animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="px-6 py-4" style={{ background: T.card, borderTop: `1px solid ${T.border}` }}>
          <div className="flex gap-3 items-center">
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask B.E.A.U. about ${intake.petName}'s recovery...`} disabled={loading}
              className="flex-1 rounded-xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-400"
              style={{ border: `1px solid ${T.border}`, color: T.text }} />
            <button type="submit" disabled={loading || !input.trim()}
              className="text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg"
              style={{ background: `linear-gradient(135deg, ${T.navy}, ${T.blue})` }}>
              Send
            </button>
          </div>
          <p className="text-xs text-center mt-2.5" style={{ color: T.light }}>
            B.E.A.U. Home is a guide, not a veterinarian. Always confirm recommendations with your vet.
          </p>
        </form>
      </div>

      {/* Sidebar */}
      <div className="w-80 hidden lg:flex flex-col" style={{ background: T.card, borderLeft: `1px solid ${T.border}` }}>
        <div className="flex" style={{ borderBottom: `1px solid ${T.border}` }}>
          {SIDEBAR_TABS.map((tab) => (
            <button key={tab.key} onClick={() => setSidebarTab(tab.key)}
              className="flex-1 py-3.5 text-center text-xs font-semibold transition-all"
              style={{
                color: sidebarTab === tab.key ? T.blue : T.light,
                borderBottom: sidebarTab === tab.key ? `2px solid ${T.blue}` : "2px solid transparent",
                background: sidebarTab === tab.key ? T.tealBg : "transparent",
              }}>
              <span className="block text-base mb-0.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarPanel activeTab={sidebarTab} intake={intake} messages={messages} onSuggest={handleSuggest} />
        </div>
      </div>

      {showAuth && <AuthModal mode={showAuth} onClose={() => setShowAuth(null)} onSwitch={() => setShowAuth(showAuth === "login" ? "signup" : "login")} onAuth={handleAuth} />}
    </div>
  );
}
