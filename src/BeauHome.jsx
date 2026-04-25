import { useState, useRef, useEffect } from "react";
import { useBeauListen } from "./hooks/useBeauListen.js";
import { useBeauVoice } from "./hooks/useBeauVoice.js";
import AnatomyViewer3D from "./components/AnatomyViewer3D.jsx";
import WeightCalculator from "./components/WeightCalculator.jsx";

// ── TOKENS ──────────────────────────────────────────────────────────
// Typography lightened per brand direction: near-white text, lighter weights
// across the board, cyan as primary accent on dark. Sunrise gradient kept
// as action/CTA treatment only.
const C = {
  bg:           "#141417",   // -10% from #18181C
  sidebar:      "#1A1A1E",   // -10%
  surface:      "#1E1E22",   // -10%
  surfaceHigh:  "#242428",   // -10%
  border:       "#2E2E32",   // -10%
  borderSub:    "#242428",   // -10%
  text:         "#F8F8F8",
  textSub:      "#CECECE",
  textMuted:    "#909098",
  glow:         "0 0 0 1px rgba(255,72,10,0.45), 0 0 16px rgba(255,72,10,0.18)",  // red-orange ember
  sunrise:      "linear-gradient(135deg, #FF3B3B 0%, #FF8C00 50%, #FFE600 100%)",
  sunriseSolid: "#FF8C00",
  dog:          "#39FF14",
  cat:          "#00F0FF",
};

const DOG_BREEDS = ["Mixed Breed","Labrador Retriever","Golden Retriever","German Shepherd","French Bulldog","Bulldog","Poodle","Beagle","Rottweiler","Dachshund","German Shorthaired Pointer","Pembroke Welsh Corgi","Australian Shepherd","Yorkshire Terrier","Cavalier King Charles Spaniel","Doberman Pinscher","Boxer","Miniature Schnauzer","Cane Corso","Shih Tzu","Great Dane","Border Collie","Siberian Husky","Bernese Mountain Dog","Pomeranian","Brittany","English Springer Spaniel","Havanese","Shetland Sheepdog","Weimaraner","Belgian Malinois","Maltese","Boston Terrier","Chihuahua","Basset Hound","Mastiff","Cocker Spaniel","Vizsla","Akita","Rhodesian Ridgeback"];
const CAT_BREEDS = ["Domestic Shorthair","Domestic Longhair","Domestic Medium Hair","Maine Coon","Persian","Ragdoll","Siamese","Bengal","Abyssinian","Russian Blue","Sphynx","Scottish Fold","British Shorthair","Burmese","American Shorthair","Norwegian Forest Cat","Birman","Oriental Shorthair","Devon Rex","Cornish Rex","Tonkinese","Himalayan","Turkish Angora","Manx","Exotic Shorthair","Savannah","Balinese","Chartreux","Egyptian Mau","Somali"];
const CONDITIONS = ["Post-surgery (TPLO / CCL repair)","Arthritis / Osteoarthritis","Hip dysplasia","IVDD / Back / Disc issue","Limping / Lameness","Weight management","Neurological issue","Fracture recovery","Post-FHO surgery","Geriatric wellness","Sports conditioning","General fitness","Patella luxation","Elbow dysplasia","Other"];

// ── SYSTEM PROMPT ────────────────────────────────────────────────────
function buildPrompt(pd) {
  const dog = pd.species === "dog";
  const age = parseInt(pd.age) || 0;
  const wt  = parseInt(pd.weight) || 0;
  const geriatric = dog ? age >= 8 : age >= 10;
  const giant     = dog && wt >= 80;
  const small     = dog && wt <= 20;
  const n = pd.petName || (dog ? "the dog" : "the cat");

  return `You are B.E.A.U. (Biomedical Evidence-based Analytical Unit), the AI rehabilitation engine powering B.E.A.U. Home — an evidence-based home exercise platform for pets. Built by a Canine Rehabilitation Nurse with 30 years of veterinary experience including 8 years running a solo rehabilitation department at a specialty hospital.

PATIENT PROFILE:
• Name: ${n}
• Species: ${dog ? "Canine" : "Feline"} | Breed: ${pd.breed || "Not specified"}
• Age: ${pd.age || "?"} years${geriatric ? " ⚠️ GERIATRIC — reduce intensity, shorten sessions" : ""}
• Weight: ${pd.weight || "?"} lbs${giant ? " ⚠️ GIANT BREED — monitor joint stress" : ""}${small ? " ⚠️ SMALL BREED — scale intensity proportionally" : ""}
• Condition: ${pd.condition || "Not specified"}
• Owner Notes: ${pd.conditionDetail || "None"}

NON-NEGOTIABLE RULES:
1. NEVER diagnose or confirm diagnoses
2. NEVER recommend medications or supplements
3. ALWAYS defer to the attending veterinarian
4. ALWAYS tag every exercise: 🏠 INDOOR or 🌿 OUTDOOR
5. ALWAYS include reps, sets, duration, and frequency
6. ALWAYS end plans with a 🚨 RED FLAGS section
7. Build ONLY around equipment the owner describes
8. ALWAYS pair equipment suggestions with free household alternatives
9. Use ${n}'s name throughout — make it personal
10. Plain language only — no medical jargon
11. Omit exercises conflicting with vet instructions and explain why

${dog ? `CANINE PROTOCOLS (Millis & Levine; CCRP standards):
PHASES: Acute 0–2wk (passive ROM, 5-min leash only) → Subacute 2–6wk (active ROM, proprioception, no jumping) → Remodeling 6+wk (progressive loading, balance, conditioning)
TPLO/CCL: Sit-to-stands gold standard. No stairs without ramp. Cavaletti at 6+wks with clearance.
OA: Warm up 5 min. Two short sessions > one long. Avoid cold floors.
IVDD: Zero jumping, no stairs without ramp, no twisting. Core stability priority. Stop if knuckling develops.
Hip Dysplasia: Avoid deep hip flexion. Strengthen gluteals, hamstrings, core.
Neurological: Watch for toe-dragging, knuckling. Stop if symptoms worsen.
Geriatric: 10–15 min max. Joint-friendly surfaces. Muscle mass maintenance is the goal.
Giant breeds: Monitor fatigue, reduce reps, longer rest.
Small breeds: Scale duration and intensity proportionally.`
: `FELINE PROTOCOLS (Drum, Bockstahler & Levine 2015; Feline Grimace Scale):
Sessions: 5–10 minutes MAXIMUM. Food motivation only — never force movement.
FGS: Monitor orbital tightening, ear rotation, muzzle tension, whisker change.
Plantigrade stance = veterinary emergency — no exercise, call vet immediately.
HCM: No strenuous exercise without cardiology clearance.
OA: Up to 90% of cats >12 yrs affected. Short warm-up, food-motivated only.
Non-slip mats on all surfaces — hardwood/tile are hazardous.
Stop immediately: flat ears, tail tuck, hiding, hissing.`}

EQUIPMENT: Build from what owner describes.
Rolled towel → balance/passive ROM | Cushion → proprioception | Yoga mat → safe surface
Books/basket → cavaletti | Chair/stool → supported standing | Treats → motivation
Ramp (board on sofa) → furniture access without jumping
🏠 INDOOR: carpet preferred, tile/hardwood need non-slip mat
🌿 OUTDOOR: flat grass ideal, leash required

PLAN FORMAT:
---
**${n}'s [Condition] Plan — [Phase]**

**🌅 MORNING ROUTINE** (~[X] min)
**1. [Exercise Name]** | 🏠 INDOOR or 🌿 OUTDOOR
[Sets × Reps or Duration] | [Frequency]
[Step-by-step plain-language instructions]
*Why this helps:* [1-sentence rationale]
*Watch for:* [monitoring cue]

**🌙 EVENING ROUTINE** (~[X] min)
[same format]

**🚨 STOP IMMEDIATELY AND CALL YOUR VET IF:**
• [red flag 1]
• [red flag 2]
• [red flag 3]

**📅 NEXT STEP:** [progression guidance]
---

PERSONALITY: Warm, knowledgeable friend. Use ${n}'s name constantly. Celebrate small wins.`;
}

// ── API CALL (SSE streaming) ─────────────────────────────────────────
// Streams chunks from /api/chat-home. Caller passes `onChunk(fullTextSoFar)`
// which fires on every text_delta so the UI can render word-by-word.
// Returns the final assembled text.
async function callBEAUStream(systemPrompt, messages, onChunk) {
  const res = await fetch("/api/chat-home", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, systemPrompt }),
  });

  if (!res.ok) {
    // Server sent JSON error (e.g. 429 rate limit) not a stream
    let msg = "Connection issue. Please try again.";
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  if (!res.body) throw new Error("No response body from server.");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by double newlines
    const frames = buffer.split("\n\n");
    buffer = frames.pop() || "";

    for (const frame of frames) {
      const line = frame.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") return full;
      try {
        const data = JSON.parse(payload);
        if (data.error) throw new Error(data.error);
        if (typeof data.text === "string") {
          full += data.text;
          onChunk?.(full);
        }
      } catch (e) {
        // Re-throw real errors; swallow partial-JSON parse errors
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }
  return full;
}

// ── SUB-COMPONENTS ───────────────────────────────────────────────────
function BEAUMark({ size = 28 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: C.sunrise, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 12px rgba(255,120,0,0.35)", overflow: "hidden" }}>
      <img src="/caduceus.png" alt="B.E.A.U." style={{ width: size * 0.75, height: size * 0.75, objectFit: "contain", filter: "drop-shadow(0 0 2px rgba(0,0,0,0.3))" }} />
    </div>
  );
}

function RichText({ text }) {
  return (
    <>{text.split("\n").map((line, i, a) => (
      <span key={i}>
        {line.split("**").map((p, pi) => pi % 2 === 1 ? <strong key={pi}>{p}</strong> : p)}
        {i < a.length - 1 && <br />}
      </span>
    ))}</>
  );
}

function PlanBlock({ text }) {
  const isPlan = text.includes("MORNING ROUTINE") || text.includes("EVENING ROUTINE");
  if (!isPlan) return <RichText text={text} />;
  return (
    <div>
      {text.split("\n").map((line, i) => {
        const isHeader = line.startsWith("**🌅") || line.startsWith("**🌙") || line.startsWith("**🚨") || line.startsWith("**📅");
        const isExName = /^\*\*\d+\./.test(line);
        const isItalic = line.startsWith("*") && line.endsWith("*") && !line.startsWith("**");
        return (
          <span key={i}>
            {isHeader
              ? <span style={{ display: "block", marginTop: 18, marginBottom: 6, fontSize: 13, fontWeight: 700, color: C.sunriseSolid }}><RichText text={line} /></span>
              : isExName
              ? <span style={{ display: "block", marginTop: 12, fontWeight: 700 }}><RichText text={line} /></span>
              : isItalic
              ? <span style={{ display: "block", color: C.textSub, fontSize: 13, marginTop: 3 }}>{line.replace(/\*/g, "")}</span>
              : <span style={{ display: "block", lineHeight: "1.75" }}><RichText text={line} /></span>
            }
          </span>
        );
      })}
    </div>
  );
}

// ── MAIN COMPONENT ───────────────────────────────────────────────────
export default function BeauHome() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab]   = useState("exercises");
  const [showAuth, setShowAuth]       = useState(false);
  const [authMode, setAuthMode]       = useState("signup");
  const [authName, setAuthName]       = useState("");
  const [authEmail, setAuthEmail]     = useState("");
  const [authPass, setAuthPass]       = useState("");
  const [isSignedIn, setIsSignedIn]   = useState(false);

  const [petName,         setPetName]         = useState("");
  const [species,         setSpecies]         = useState("dog");
  const [breed,           setBreed]           = useState("");
  const [age,             setAge]             = useState("");
  const [weight,          setWeight]          = useState("");
  const [condition,       setCondition]       = useState("");
  const [conditionDetail, setConditionDetail] = useState("");
  const [intakeDone,      setIntakeDone]      = useState(false);

  const pd = { petName, species, breed, age, weight, condition, conditionDetail };
  const accent  = species === "cat" ? C.cat : C.dog;
  const breeds  = species === "dog" ? DOG_BREEDS : CAT_BREEDS;
  const dn      = petName || (species === "dog" ? "your dog" : "your cat");
  const userBg  = species === "cat" ? "#0E1A1D" : "#101A0E";
  const userBdr = species === "cat" ? "rgba(0,240,255,0.12)" : "rgba(57,255,20,0.12)";

  const [msgs,      setMsgs]      = useState([]);
  const [apiMsgs,   setApiMsgs]   = useState([]);
  const [input,     setInput]     = useState("");
  const [typing,    setTyping]    = useState(false);
  const [phase,     setPhase]     = useState("intake");

  const [exercises, setExercises] = useState([]);
  const [planSaved, setPlanSaved] = useState(false);
  const [suggestion,setSuggestion]= useState("");
  const [sugDone,   setSugDone]   = useState(false);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // ── Voice I/O (free Web Speech API — no API keys, no per-call cost) ───
  // Listen: tap mic → speak → transcript fills the input
  // Speak: when enabled, B.E.A.U.'s final reply is read aloud after streaming
  const {
    supported:  micSupported,
    listening,
    transcript,
    start: startMic,
    stop:  stopMic,
    reset: resetMic,
  } = useBeauListen();
  const {
    supported:  voiceSupported,
    enabled:    voiceOn,
    speaking,
    speak,
    stop: stopSpeak,
    toggleEnabled: toggleVoice,
  } = useBeauVoice();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);
  useEffect(() => { setBreed(""); }, [species]);

  // Live transcript → input field while the user is dictating
  useEffect(() => {
    if (listening && transcript) setInput(transcript);
  }, [listening, transcript]);

  function addMsg(m) { setMsgs(p => [...p, { id: Date.now() + Math.random(), ...m }]); }

  async function sendToAPI(userText, base) {
    const next = [...base, { role: "user", content: userText }];
    setApiMsgs(next);
    setTyping(true);

    // Placeholder message we'll mutate as chunks arrive
    const placeholderId = Date.now() + Math.random();
    let started = false;
    let finalReply = "";

    try {
      finalReply = await callBEAUStream(buildPrompt(pd), next, (textSoFar) => {
        if (!started) {
          setTyping(false);
          setMsgs(p => [...p, { id: placeholderId, role: "beau", text: textSoFar }]);
          started = true;
        } else {
          setMsgs(p => p.map(m => m.id === placeholderId ? { ...m, text: textSoFar } : m));
        }
      });
    } catch (err) {
      setTyping(false);
      const errMsg = err?.message || "Connection issue. Please try again.";
      if (!started) {
        setMsgs(p => [...p, { id: placeholderId, role: "beau", text: errMsg }]);
      } else {
        setMsgs(p => p.map(m => m.id === placeholderId ? { ...m, text: (finalReply || m.text) + `\n\n*[${errMsg}]*` } : m));
      }
      return;
    }

    const full = [...next, { role: "assistant", content: finalReply }];
    setApiMsgs(full);

    // If B.E.A.U.'s voice is enabled, speak the reply after streaming completes
    if (voiceOn && finalReply) speak(finalReply);

    if (finalReply.includes("MORNING ROUTINE") || finalReply.includes("EVENING ROUTINE")) {
      const exs = [];
      finalReply.split("\n").forEach(line => {
        const m = line.match(/^\*\*\d+\.\s(.+?)\*\*/);
        if (m) exs.push({ id: Date.now() + Math.random(), name: m[1].split("|")[0].trim(), env: line.includes("🌿") ? "🌿 Outdoor" : "🏠 Indoor", tag: condition.split(" ")[0] || "Rehab" });
      });
      if (exs.length) setExercises(exs);
    }
  }

  async function handleStart() {
    if (!petName.trim() || !condition) return;
    setIntakeDone(true);
    setPhase("equip");
    addMsg({ role: "user", text: `${species === "dog" ? "🐕" : "🐈"} **${petName}** · ${breed || "Mixed"} · ${age ? age+"yr" : "?"} · ${weight ? weight+"lbs" : "?"}\n${condition}${conditionDetail ? " — " + conditionDetail : ""}` });
    await new Promise(r => setTimeout(r, 400));
    addMsg({ role: "beau", text: `Hi ${petName}! 🐾 I'm excited to help.\n\nBefore I build the plan — what do you have at home we can work with? Anything goes: a yoga mat, towels, stairs, a backyard, couch cushions — just describe what's around.\n\n*(Tip: check the Guide in the side panel for ideas on what to mention.)*` });
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function handleSend() {
    if (!input.trim() || phase === "intake") return;
    const txt = input.trim();
    // Cleanly reset voice state on every send: stop dictation, stop B.E.A.U.
    // mid-sentence if the user is interrupting, clear the transcript buffer.
    if (listening) stopMic();
    if (speaking) stopSpeak();
    resetMic();
    setInput("");
    addMsg({ role: "user", text: txt });
    if (phase === "equip") {
      setPhase("open");
      await sendToAPI(`Owner described their home setup: "${txt}". Now generate ${petName}'s complete exercise plan tailored to this equipment and environment.`, []);
    } else {
      await sendToAPI(txt, apiMsgs);
    }
  }

  const canStart = petName.trim() && condition;

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, color: C.text, fontFamily: "'Lora', Georgia, serif", overflow: "hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 0px; }
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:.25;transform:scale(.85);} 50%{opacity:1;transform:scale(1);} }
        .msg-in { animation: fadeSlideUp .32s cubic-bezier(.22,1,.36,1) forwards; }
        .dot { display:inline-block; width:7px; height:7px; border-radius:50%; background:${C.textMuted}; animation:pulse 1.4s ease-in-out infinite; }
        .dot:nth-child(2){animation-delay:.2s;} .dot:nth-child(3){animation-delay:.4s;}
        .fi { width:100%; background:${C.surfaceHigh}; border:1px solid rgba(255,72,10,0.35); border-radius:8px; color:${C.text}; font-family:'DM Sans',sans-serif; font-size:14px; padding:10px 12px; transition:border-color .2s, box-shadow .2s; outline:none; box-shadow:0 0 0 1px rgba(255,72,10,0.22), 0 0 8px rgba(255,72,10,0.08); }
        .fi:focus { border-color:rgba(255,100,20,0.75); box-shadow:0 0 0 1px rgba(255,100,20,0.55), 0 0 14px rgba(255,72,10,0.22); }
        .fi::placeholder { color:${C.textMuted}; }
        .fi option { background:#1C1C1F; }
        .fi-select { width:100%; background:${C.surfaceHigh}; border:1px solid rgba(255,72,10,0.35); border-radius:10px; color:${C.text}; font-family:'DM Sans',sans-serif; font-size:14px; padding:11px 14px; outline:none; appearance:none; -webkit-appearance:none; transition:border-color .2s, box-shadow .2s; cursor:pointer; box-shadow:0 0 0 1px rgba(255,72,10,0.22), 0 0 8px rgba(255,72,10,0.08); }
        .fi-select:focus { border-color:rgba(255,100,20,0.75); box-shadow:0 0 0 1px rgba(255,100,20,0.55), 0 0 14px rgba(255,72,10,0.22); }
        .fi-select option { background:#1C1C1F; }
        .sp-btn { flex:1; padding:11px 0; border-radius:10px; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600; border:1px solid rgba(255,72,10,0.3); background:${C.surfaceHigh}; color:${C.textSub}; transition:all .18s ease; box-shadow:0 0 0 1px rgba(255,72,10,0.18), 0 0 8px rgba(255,72,10,0.07); }
        .sp-btn.active-dog { border-color:${C.dog}44; background:${C.dog}0D; color:${C.dog}; box-shadow:none; }
        .sp-btn.active-cat { border-color:${C.cat}44; background:${C.cat}0D; color:${C.cat}; box-shadow:none; }
        .stab { flex:1; padding:10px 4px 9px; background:none; border:none; font-family:'DM Sans',sans-serif; font-size:9px; font-weight:600; letter-spacing:.8px; text-transform:uppercase; cursor:pointer; transition:color .15s; line-height:1.5; }
        .input-pill { display:flex; align-items:center; gap:10px; background:${C.surface}; border:1px solid ${C.border}; border-radius:32px; padding:10px 14px 10px 18px; transition:border-color .2s; box-shadow:0 0 0 1px rgba(255,72,10,0.42), 0 0 18px rgba(255,72,10,0.14); }
        .input-pill:focus-within { border-color:#38383E; }
        .send-btn { width:36px; height:36px; border-radius:50%; border:none; display:flex; align-items:center; justify-content:center; font-size:16px; cursor:pointer; flex-shrink:0; transition:all .18s ease; }
        .send-btn.ready { background:${C.sunrise}; color:#0C0C0E; box-shadow:0 0 14px rgba(255,120,0,.35); }
        .send-btn.idle  { background:${C.surfaceHigh}; color:${C.textMuted}; cursor:default; }
        .ex-card { padding:11px 13px; border-radius:10px; background:${C.surface}; margin-bottom:6px; transition:background .15s; box-shadow:0 0 0 1px rgba(255,72,10,0.35), 0 0 12px rgba(255,72,10,0.10); }
        .ex-card:hover { background:${C.surfaceHigh}; }
        .hint-tag { display:inline-block; padding:3px 9px; background:rgba(255,140,0,.07); border:1px solid rgba(255,140,0,.14); border-radius:20px; font-size:11px; color:#CC8800; margin:3px; font-family:'DM Sans',sans-serif; }
        .ai-inp { width:100%; background:${C.surfaceHigh}; border:1px solid rgba(255,72,10,0.35); border-radius:10px; color:${C.text}; font-family:'DM Sans',sans-serif; font-size:14px; padding:11px 14px; outline:none; margin-bottom:10px; box-shadow:0 0 0 1px rgba(255,72,10,0.22), 0 0 8px rgba(255,72,10,0.08); transition:border-color .2s, box-shadow .2s; }
        .ai-inp:focus { border-color:rgba(255,100,20,0.75); box-shadow:0 0 0 1px rgba(255,100,20,0.55), 0 0 14px rgba(255,72,10,0.22); }
        .ai-inp::placeholder { color:${C.textMuted}; }
      `}</style>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position:"fixed", inset:0, zIndex:40, background:"rgba(0,0,0,.6)", backdropFilter:"blur(3px)" }} />}

      {/* ── SIDEBAR ── */}
      <aside className="beau-box" style={{ position:"fixed", top:0, bottom:0, left:sidebarOpen ? 0 : -300, width:272, background:C.sidebar, zIndex:50, display:"flex", flexDirection:"column", borderRight:`1px solid ${C.border}`, transition:"left .28s cubic-bezier(.4,0,.2,1)" }}>
        <div style={{ padding:"20px 16px 16px", borderBottom:`1px solid ${C.borderSub}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <BEAUMark size={30} />
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Lora',serif", fontSize:15, fontWeight:600 }}>B.E.A.U. Home</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.textMuted, letterSpacing:"1.2px", textTransform:"uppercase", marginTop:1 }}>Rehab Companion</div>
            </div>
            <button onClick={() => setSidebarOpen(false)} style={{ background:"none", border:"none", color:C.textMuted, cursor:"pointer", fontSize:17, padding:4, lineHeight:1 }}>✕</button>
          </div>
          {intakeDone && petName && (
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:C.surfaceHigh, borderRadius:10 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:accent, boxShadow:`0 0 8px ${accent}88`, flexShrink:0 }} />
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, flex:1 }}>{petName}</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.textMuted }}>{species==="dog"?"🐕":"🐈"}{age?" · "+age+"yr":""}</span>
            </div>
          )}
        </div>

        <div style={{ display:"flex", borderBottom:`1px solid ${C.borderSub}` }}>
          {[{id:"exercises",icon:"💪",label:"Plan"},{id:"progress",icon:"📈",label:"Progress"},{id:"anatomy",icon:"🩻",label:"3D"},{id:"weight",icon:"⚖️",label:"Weight"},{id:"guide",icon:"❓",label:"Guide"},{id:"suggest",icon:"💡",label:"Suggest"}].map(t => (
            <button key={t.id} className="stab" onClick={() => setSidebarTab(t.id)} style={{ color:sidebarTab===t.id ? accent : C.textMuted, borderBottom:sidebarTab===t.id ? `2px solid ${accent}` : "2px solid transparent" }}>
              <div style={{ fontSize:14, marginBottom:3 }}>{t.icon}</div>{t.label}
            </button>
          ))}
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"16px 14px" }}>
          {sidebarTab === "exercises" && <>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.textMuted, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:12 }}>{petName ? `${petName}'s Current Plan` : "Current Plan"}</div>
            {exercises.length === 0
              ? <div style={{ textAlign:"center", padding:"32px 0", color:C.textMuted }}>
                  <div style={{ fontSize:34, marginBottom:12 }}>🐾</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, lineHeight:1.8 }}>{petName ? `${petName}'s plan` : "Your plan"} will appear here once B.E.A.U. generates it.</div>
                </div>
              : exercises.map(ex => (
                <div key={ex.id} className="ex-card">
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, marginBottom:5 }}>{ex.name}</div>
                  <div style={{ display:"flex", gap:6 }}>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, padding:"2px 8px", borderRadius:20, background:`${accent}14`, color:accent, fontWeight:700 }}>{ex.tag}</span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:ex.env.includes("Indoor") ? "#7799CC" : "#77AA77" }}>{ex.env}</span>
                  </div>
                </div>
              ))
            }
            <button onClick={() => { if (!isSignedIn) { setShowAuth(true); return; } setPlanSaved(true); }} style={{ width:"100%", marginTop:10, padding:"11px", background:planSaved ? `${C.dog}14` : C.sunrise, border:planSaved ? `1px solid ${C.dog}44` : "none", borderRadius:10, color:planSaved ? C.dog : "#0C0C0E", fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer" }}>
              {planSaved ? "✓ Saved" : "💾 Save Today's Plan"}
            </button>
          </>}

          {sidebarTab === "progress" && <>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.textMuted, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:14 }}>{petName ? `${petName}'s Progress` : "Mobility Progress"}</div>
            {[{w:"Week 1",s:2},{w:"Week 2",s:4},{w:"Week 3",s:6},{w:"Week 4",s:7}].map((d,i) => (
              <div key={i} style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.textSub }}>{d.w}</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:accent, fontWeight:600 }}>{d.s}/10</span>
                </div>
                <div style={{ height:3, background:C.surfaceHigh, borderRadius:2 }}>
                  <div style={{ height:"100%", width:`${d.s*10}%`, background:accent, borderRadius:2, boxShadow:`0 0 6px ${accent}55`, transition:"width .8s cubic-bezier(.4,0,.2,1)" }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop:16, padding:"12px 14px", background:C.surface, borderRadius:10 }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.textMuted, marginBottom:4 }}>Overall</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:24, fontWeight:700, color:accent }}>↑ Improving</div>
            </div>
            {!isSignedIn && (
              <div style={{ marginTop:12, padding:"12px", background:"rgba(255,140,0,.06)", borderRadius:10, textAlign:"center" }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.sunriseSolid, marginBottom:8 }}>Sign in to track real progress</div>
                <button onClick={() => setShowAuth(true)} style={{ padding:"7px 18px", background:C.sunrise, border:"none", borderRadius:20, color:"#0C0C0E", fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12, cursor:"pointer" }}>Sign In →</button>
              </div>
            )}
          </>}

          {sidebarTab === "anatomy" && <>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.textMuted, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:12 }}>
              {petName ? `${petName}'s Anatomy` : "3D Anatomy Viewer"}
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.textSub, lineHeight:1.7, marginBottom:14 }}>
              Rotate, zoom, and explore the {species === "cat" ? "feline" : "canine"} skeleton. Useful for understanding which joints and structures B.E.A.U. is targeting in {petName ? `${petName}'s` : "your pet's"} plan.
            </div>
            <AnatomyViewer3D species={species} height={340} />
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.textMuted, lineHeight:1.6, marginTop:10, padding:"10px 12px", background:"rgba(0,240,255,0.04)", borderRadius:8 }}>
              💡 <strong style={{color:C.cat}}>Tip:</strong> drag with one finger to rotate, pinch with two to zoom. The model is hosted by veterinary anatomy educators — what you see is anatomically accurate.
            </div>
          </>}

          {sidebarTab === "weight" && (
            <WeightCalculator petName={petName} species={species} />
          )}

          {sidebarTab === "guide" && <>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.textMuted, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:14 }}>How to Use</div>
            {[["1️⃣","Fill in your pet's profile — name, species, breed, age, weight, and condition."],["2️⃣","B.E.A.U. asks what you have at home. Describe it naturally."],["3️⃣","Every exercise is tagged 🏠 Indoor or 🌿 Outdoor and saved to your Plan tab."],["4️⃣","Come back after exercises and tell B.E.A.U. how it went — the plan adapts."],["5️⃣","Use the Save button to lock in today's plan."]].map(([icon,text],i) => (
              <div key={i} style={{ display:"flex", gap:10, marginBottom:13, alignItems:"flex-start" }}>
                <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>{icon}</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.textSub, lineHeight:"1.65" }}>{text}</span>
              </div>
            ))}
            <div style={{ marginTop:8, padding:"13px", background:"rgba(255,140,0,.05)", borderRadius:10, marginBottom:12 }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700, color:C.sunriseSolid, letterSpacing:"1px", textTransform:"uppercase", marginBottom:8 }}>💬 What to mention to B.E.A.U.</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.textMuted, lineHeight:"1.7", marginBottom:8 }}>When asked about your home, you can mention:</div>
              <div style={{ lineHeight:2.2 }}>
                {["Yoga / non-slip mat","Rolled towels","Couch cushions","Stairs","Backyard / grass","Books","Chair / stool","Leash + harness","Treats","Pool / tub","Ramp","Blankets"].map(item => (
                  <span key={item} className="hint-tag">{item}</span>
                ))}
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.textMuted, marginTop:10, lineHeight:"1.7" }}>Nothing special? Just say <em>"I don't have much"</em> — B.E.A.U. will make it work.</div>
            </div>
            <div style={{ padding:"13px", background:"rgba(255,200,0,.04)", borderRadius:10 }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700, color:"#CC9900", letterSpacing:"1px", textTransform:"uppercase", marginBottom:7 }}>⚠️ Disclaimer</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#AA8800", lineHeight:"1.7" }}>B.E.A.U. Home provides <strong>general exercise guidance only</strong>. It does not diagnose conditions or replace veterinary care. <strong>Always follow your veterinarian's instructions.</strong> Stop any exercise that causes increased pain or distress.</div>
            </div>
            <div style={{ marginTop:10, fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.textMuted, textAlign:"center", lineHeight:"1.7" }}>
              Supports <strong style={{ color:C.dog }}>dogs 🐕</strong> and <strong style={{ color:C.cat }}>cats 🐈</strong>
            </div>
          </>}

          {sidebarTab === "suggest" && <>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.textMuted, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:12 }}>Suggest an Improvement</div>
            {sugDone
              ? <div style={{ textAlign:"center", padding:"32px 0" }}>
                  <div style={{ fontSize:34, marginBottom:12 }}>🐾</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:15, marginBottom:6 }}>Thank you!</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.textSub, lineHeight:1.7 }}>We read every suggestion.</div>
                  <button onClick={() => { setSuggestion(""); setSugDone(false); }} style={{ marginTop:16, padding:"8px 18px", background:C.surfaceHigh, border:`1px solid ${C.border}`, borderRadius:20, color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:12, cursor:"pointer" }}>Submit another</button>
                </div>
              : <>
                  {[["🐕 New exercise idea","Add an exercise I'm not seeing"],["🐛 Something's wrong","Flag an incorrect or unsafe response"],["💬 Tone / wording","Improve how B.E.A.U. communicates"],["⭐ Feature request","Something I wish B.E.A.U. could do"],["Other","Anything on your mind"]].map(([lbl,sub]) => (
                    <button key={lbl} onClick={() => setSuggestion(p => p || lbl + ": ")} style={{ width:"100%", textAlign:"left", padding:"10px 12px", background:C.surface, border:"none", borderRadius:10, marginBottom:7, cursor:"pointer" }}>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color:C.text }}>{lbl}</div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.textMuted, marginTop:2 }}>{sub}</div>
                    </button>
                  ))}
                  <textarea value={suggestion} onChange={e => setSuggestion(e.target.value)} placeholder="Type your suggestion..." rows={4} style={{ width:"100%", marginTop:8, padding:"11px 13px", background:C.surfaceHigh, border:"1px solid rgba(255,72,10,0.35)", borderRadius:10, color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:13, resize:"none", lineHeight:"1.6", outline:"none", boxShadow:"0 0 0 1px rgba(255,72,10,0.22), 0 0 8px rgba(255,72,10,0.08)" }} />
                  <button onClick={() => { if (suggestion.trim()) setSugDone(true); }} disabled={!suggestion.trim()} style={{ width:"100%", marginTop:8, padding:"11px", background:suggestion.trim() ? C.sunrise : C.surfaceHigh, border:"none", borderRadius:10, color:suggestion.trim() ? "#0C0C0E" : C.textMuted, fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13, cursor:suggestion.trim() ? "pointer" : "default" }}>Submit →</button>
                </>
            }
          </>}
        </div>

        <div style={{ padding:"12px 14px", borderTop:`1px solid ${C.borderSub}` }}>
          {isSignedIn
            ? <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:C.sunrise, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#0C0C0E", flexShrink:0 }}>{authName[0]?.toUpperCase()||"S"}</div>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500, flex:1 }}>{authName}</span>
                <button onClick={() => setIsSignedIn(false)} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.textMuted, background:"none", border:"none", cursor:"pointer" }}>Sign out</button>
              </div>
            : <button onClick={() => setShowAuth(true)} style={{ width:"100%", padding:"10px", background:C.surfaceHigh, border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500, cursor:"pointer" }}>Sign in / Create account →</button>
          }
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", height:"100vh", minWidth:0 }}>
        <nav style={{ display:"flex", alignItems:"center", padding:"12px 20px", borderBottom:`1px solid ${C.borderSub}`, flexShrink:0 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background:"none", border:"none", color:C.textMuted, cursor:"pointer", fontSize:19, padding:"4px 8px 4px 0", lineHeight:1, marginRight:8 }}>☰</button>
          <div style={{ display:"flex", alignItems:"center", gap:8, flex:1 }}>
            <img src="/caduceus.png" alt="" style={{ width:24, height:24, objectFit:"contain" }} />
            <span style={{ fontFamily:"'Lora',serif", fontSize:18, fontWeight:600, background:C.sunrise, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>B.E.A.U.</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.textMuted }}>Home Edition</span>
            {intakeDone && petName && <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, padding:"3px 10px", background:`${accent}12`, color:accent, borderRadius:20, fontWeight:600 }}>{species==="dog"?"🐕":"🐈"} {petName}</span>}
          </div>
          {/* ── Voice toggle: speaker on/off (read B.E.A.U.'s replies aloud) ── */}
          {voiceSupported && (
            <button
              onClick={toggleVoice}
              aria-label={voiceOn ? "Mute B.E.A.U. voice" : "Read replies aloud"}
              title={voiceOn ? "Mute B.E.A.U." : "Read replies aloud"}
              style={{
                width:36, height:36, borderRadius:"50%", border:"none",
                background: voiceOn ? `${C.cat}33` : C.surfaceHigh,
                color: voiceOn ? C.cat : C.textMuted,
                display:"flex", alignItems:"center", justifyContent:"center",
                cursor:"pointer", marginRight:8,
                transition:"all .15s",
                boxShadow: voiceOn && !speaking ? `0 0 12px ${C.cat}66` : "none",
                animation: speaking ? "beau-ring-cyan 1.5s ease-out infinite" : "none",
              }}
            >
              {voiceOn ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <line x1="23" y1="9" x2="17" y2="15"/>
                  <line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
              )}
            </button>
          )}
          {!isSignedIn
            ? <button onClick={() => setShowAuth(true)} style={{ padding:"7px 16px", background:C.sunrise, border:"none", borderRadius:20, color:"#0C0C0E", fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12, cursor:"pointer" }}>Sign in</button>
            : <div onClick={() => setSidebarOpen(true)} style={{ width:28, height:28, borderRadius:"50%", background:C.sunrise, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#0C0C0E", cursor:"pointer" }}>{authName[0]?.toUpperCase()||"S"}</div>
          }
        </nav>

        <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>
          <div style={{ maxWidth:720, width:"100%", margin:"0 auto", padding:"32px 24px 16px", flex:1 }}>

            {!intakeDone && (
              <>
                <div style={{ display:"flex", gap:14, marginBottom:28, alignItems:"flex-start" }}>
                  <BEAUMark size={28} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.textMuted, marginBottom:6, letterSpacing:"0.5px" }}>B.E.A.U.</div>
                    <div style={{ fontSize:15.5, lineHeight:"1.75", color:C.text }}>
                      Hey! I'm <strong>B.E.A.U.</strong> 🐾 — your pet's home rehabilitation guide.<br /><br />
                      Tell me about your pet below and I'll build a personalized, evidence-based exercise plan using whatever you have at home.
                    </div>
                  </div>
                </div>

                <div className="beau-box" style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"24px", marginBottom:24, marginLeft:42 }}>
                  <div style={{ marginBottom:20 }}>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.textMuted, letterSpacing:"1px", textTransform:"uppercase", marginBottom:10 }}>Species</div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button className={`sp-btn ${species==="dog"?"active-dog":""}`} onClick={() => setSpecies("dog")}>🐕 Dog</button>
                      <button className={`sp-btn ${species==="cat"?"active-cat":""}`} onClick={() => setSpecies("cat")}>🐈 Cat</button>
                    </div>
                  </div>
                  <div style={{ marginBottom:20 }}>
                    <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.textMuted, letterSpacing:"1px", textTransform:"uppercase", display:"block", marginBottom:6 }}>Pet's Name *</label>
                    <input className="fi" type="text" placeholder={species==="dog" ? "e.g. Bella, Max, Luna..." : "e.g. Mochi, Luna, Simba..."} value={petName} onChange={e => setPetName(e.target.value)} />
                  </div>
                  <div style={{ marginBottom:20 }}>
                    <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.textMuted, letterSpacing:"1px", textTransform:"uppercase", display:"block", marginBottom:8 }}>Breed</label>
                    <select className="fi-select" value={breed} onChange={e => setBreed(e.target.value)}>
                      <option value="">Select breed...</option>
                      {breeds.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
                    <div>
                      <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.textMuted, letterSpacing:"1px", textTransform:"uppercase", display:"block", marginBottom:6 }}>Age (years)</label>
                      <input className="fi" type="number" min="0" max="30" placeholder="e.g. 7" value={age} onChange={e => setAge(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.textMuted, letterSpacing:"1px", textTransform:"uppercase", display:"block", marginBottom:6 }}>Weight (lbs)</label>
                      <input className="fi" type="number" min="1" max="300" placeholder="e.g. 65" value={weight} onChange={e => setWeight(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ marginBottom:20 }}>
                    <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.textMuted, letterSpacing:"1px", textTransform:"uppercase", display:"block", marginBottom:8 }}>
                      What's going on with {petName || (species==="dog" ? "your dog" : "your cat")}? *
                    </label>
                    <select className="fi-select" value={condition} onChange={e => setCondition(e.target.value)}>
                      <option value="">Select a condition...</option>
                      {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:24 }}>
                    <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.textMuted, letterSpacing:"1px", textTransform:"uppercase", display:"block", marginBottom:6 }}>Tell us more (optional)</label>
                    <textarea className="fi" rows={2} placeholder="e.g. Had TPLO surgery 4 weeks ago, still limping slightly on left back leg..." value={conditionDetail} onChange={e => setConditionDetail(e.target.value)} style={{ resize:"none", lineHeight:"1.6" }} />
                  </div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#886600", lineHeight:"1.65", marginBottom:20, padding:"10px 12px", background:"rgba(255,200,0,.04)", borderRadius:8 }}>
                    ⚠️ B.E.A.U. provides general exercise guidance only — not veterinary advice. Always follow your vet's instructions.
                  </div>
                  <button disabled={!canStart} onClick={handleStart} style={{ width:"100%", padding:"13px", fontFamily:"'DM Sans',sans-serif", background:canStart ? C.sunrise : C.surfaceHigh, border:"none", borderRadius:12, color:canStart ? "#0C0C0E" : C.textMuted, fontWeight:700, fontSize:15, cursor:canStart ? "pointer" : "default", transition:"all .18s" }}>
                    {canStart ? `Start chatting with B.E.A.U. about ${petName} →` : "Start chatting with B.E.A.U. →"}
                  </button>
                </div>
              </>
            )}

            {msgs.map(msg => (
              <div key={msg.id} className="msg-in" style={{ display:"flex", gap:14, marginBottom:28, flexDirection:msg.role==="user"?"row-reverse":"row", alignItems:"flex-start" }}>
                {msg.role==="beau" && <BEAUMark size={28} />}
                <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:msg.role==="user"?"flex-end":"flex-start", maxWidth:"100%" }}>
                  {msg.role==="beau" && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.textMuted, marginBottom:7, letterSpacing:"0.5px" }}>B.E.A.U.</div>}
                  <div className={msg.role==="user"?"beau-box":""} style={{ maxWidth:msg.role==="user"?"72%":"100%", padding:msg.role==="user"?"11px 16px":"0", background:msg.role==="user"?userBg:"transparent", border:msg.role==="user"?`1px solid ${userBdr}`:"none", borderRadius:msg.role==="user"?"18px 18px 4px 18px":0, fontSize:15.5, lineHeight:"1.75", color:C.text, fontFamily:msg.role==="user"?"'DM Sans',sans-serif":"'Lora',serif", wordBreak:"break-word" }}>
                    {msg.role==="beau" ? <PlanBlock text={msg.text} /> : <RichText text={msg.text} />}
                  </div>
                </div>
              </div>
            ))}

            {typing && (
              <div style={{ display:"flex", gap:14, marginBottom:28, alignItems:"flex-start" }}>
                <BEAUMark size={28} />
                <div style={{ paddingTop:6 }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.textMuted, marginBottom:10, letterSpacing:"0.5px" }}>B.E.A.U.</div>
                  <div style={{ display:"flex", gap:5, alignItems:"center" }}><span className="dot"/><span className="dot"/><span className="dot"/></div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <div style={{ padding:"12px 24px 24px", flexShrink:0 }}>
          <div style={{ maxWidth:720, margin:"0 auto" }}>
            <div className="input-pill">
              {/* ── Tap-to-talk mic — only shown if browser supports SpeechRecognition ── */}
              {micSupported && (
                <button
                  onClick={() => {
                    if (phase === "intake") return;
                    if (listening) { stopMic(); }
                    else { if (speaking) stopSpeak(); startMic(); }
                  }}
                  disabled={phase === "intake"}
                  aria-label={listening ? "Stop dictation" : "Speak to B.E.A.U."}
                  title={listening ? "Stop" : "Tap and speak"}
                  style={{
                    width:36, height:36, borderRadius:"50%", flexShrink:0, border:"none",
                    background: listening ? "#FF3B3B" : C.surfaceHigh,
                    color: listening ? "#fff" : C.textSub,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    cursor: phase === "intake" ? "default" : "pointer",
                    opacity: phase === "intake" ? 0.4 : 1,
                    animation: listening ? "beau-ring-red 1.5s ease-out infinite" : "none",
                    transition: "background-color .15s",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                </button>
              )}
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend();}}} disabled={phase==="intake"} placeholder={phase==="intake"?"Fill in your pet's details above to get started...":listening?"Listening — speak now…":phase==="equip"?`Tell B.E.A.U. what you have at home for ${dn}...`:`Ask B.E.A.U. a follow-up about ${dn}...`} style={{ flex:1, background:"none", border:"none", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:15, outline:"none", opacity:phase==="intake"?.4:1 }} />
              <button className={`send-btn ${input.trim()&&phase!=="intake"?"ready":"idle"}`} onClick={handleSend} disabled={!input.trim()||phase==="intake"}>↑</button>
            </div>
            <div style={{ textAlign:"center", marginTop:8, fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.textMuted }}>
              B.E.A.U. Home · AI-powered exercise guidance · Not a substitute for veterinary care
              {!isSignedIn && <span> · <span onClick={() => setShowAuth(true)} style={{ color:C.sunriseSolid, cursor:"pointer" }}>Sign in to save</span></span>}
            </div>
          </div>
        </div>
      </div>

      {showAuth && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20, backdropFilter:"blur(6px)" }}>
          <div className="beau-box" style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:"32px 28px", width:"100%", maxWidth:360, position:"relative" }}>
            <button onClick={() => setShowAuth(false)} style={{ position:"absolute", top:16, right:16, background:"none", border:"none", color:C.textMuted, cursor:"pointer", fontSize:19 }}>✕</button>
            <div style={{ textAlign:"center", marginBottom:24 }}>
              <div style={{ width:52, height:52, borderRadius:"50%", background:C.sunrise, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", boxShadow:"0 0 20px rgba(255,120,0,.4)", overflow:"hidden" }}>
                <img src="/caduceus.png" alt="B.E.A.U." style={{ width:36, height:36, objectFit:"contain" }} />
              </div>
              <div style={{ fontFamily:"'Lora',serif", fontSize:22, fontWeight:600, marginBottom:5 }}>{authMode==="signin"?"Welcome back":"Create account"}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.textSub }}>{authMode==="signin"?"Sign in to save plans and track progress":"Save exercises and track your pet's progress"}</div>
            </div>
            {authMode==="signup" && <input className="ai-inp" placeholder="Your name" value={authName} onChange={e => setAuthName(e.target.value)} />}
            <input className="ai-inp" type="email" placeholder="Email address" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
            <input className="ai-inp" type="password" placeholder="Password" value={authPass} onChange={e => setAuthPass(e.target.value)} style={{ marginBottom:18 }} />
            <button onClick={() => { setIsSignedIn(true); if(!authName) setAuthName("Sal"); setShowAuth(false); }} style={{ width:"100%", padding:"13px", background:C.sunrise, border:"none", borderRadius:12, color:"#0C0C0E", fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:15, cursor:"pointer", marginBottom:14 }}>
              {authMode==="signin"?"Sign In":"Create Account"}
            </button>
            <div style={{ textAlign:"center", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.textSub }}>
              {authMode==="signin"?"Don't have an account? ":"Already have an account? "}
              <span onClick={() => setAuthMode(authMode==="signin"?"signup":"signin")} style={{ color:C.sunriseSolid, cursor:"pointer", fontWeight:600 }}>{authMode==="signin"?"Sign up free":"Sign in"}</span>
            </div>
            <div style={{ marginTop:18, fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.textMuted, textAlign:"center", lineHeight:"1.7" }}>
              B.E.A.U. Home provides general exercise guidance only. Not a substitute for veterinary care.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
