/**
 * Weight Management Calculator — B.E.A.U. Home
 * ============================================================================
 * Body Condition Score (BCS) → Ideal Weight, % to goal, and caloric targets.
 *
 * Clinical basis:
 *   Millis, D.L. & Levine, D. (2014). Canine Rehabilitation and Physical
 *   Therapy, 2nd ed. Elsevier. Chapter 9 — Patient Assessment; Chapter 19 —
 *   Weight Management in Canine Rehabilitation.
 *
 *   BCS 9-point Purina scale (Laflamme, 1997):
 *     BCS 5/9 = ideal body condition (~20% body fat)
 *     Each BCS unit ≈ 5% body fat change
 *     % excess body fat = (BCS − 5) × 10  [simplified clinical rule]
 *
 *   Ideal weight from BCS (Butterwick & Hawthorne, WALTHAM):
 *     Ideal BW = Current BW × (1 − % body fat / 100) / 0.80
 *     (lean body mass / ideal lean fraction for dogs)
 *     For cats: ideal lean fraction = 0.80 (same)
 *
 *   RER (Resting Energy Requirement):
 *     RER = 70 × (BW_kg ^ 0.75)  [NRC 2006 / Millis & Levine, Ch.19]
 *
 *   MER (Maintenance Energy Requirement) multipliers:
 *     Weight loss:     MER = RER × 1.0  (feed to lean BW target)
 *     Weight gain:     MER = RER × 1.8
 *     Maintenance:     MER = RER × 1.6 (neutered dog) / 1.4 (neutered cat)
 *
 *   Rate of loss: Millis & Levine recommend 1–2% BW/week max (no more than
 *   0.5 kg/week for most dogs). Faster loss causes muscle catabolism — critical
 *   in rehab patients where lean mass must be preserved.
 * ============================================================================
 */

import { useState, useMemo } from "react";

// ── BCS descriptors (Purina 9-point) ────────────────────────────────────────
const BCS_DATA = [
  { score: 1, label: "Emaciated",       color: "#ef4444", icon: "🔴", description: "Ribs, spine, and pelvis visible from a distance. No body fat. Severe muscle loss." },
  { score: 2, label: "Very Thin",        color: "#f97316", icon: "🟠", description: "Ribs easily visible. Obvious waist. No palpable fat. Some muscle loss." },
  { score: 3, label: "Thin",             color: "#f59e0b", icon: "🟡", description: "Ribs easily felt with minimal fat cover. Minimal waist. Abdominal tuck visible." },
  { score: 4, label: "Underweight",      color: "#eab308", icon: "🟡", description: "Ribs easily felt. Waist visible from above. Slight abdominal tuck." },
  { score: 5, label: "Ideal ✓",          color: "#22c55e", icon: "🟢", description: "Ribs felt without excess fat cover. Waist visible. Abdominal tuck present. (Millis & Levine target)" },
  { score: 6, label: "Overweight",       color: "#eab308", icon: "🟡", description: "Ribs felt with slight fat cover. Waist discernible but not prominent. Slight abdominal tuck." },
  { score: 7, label: "Heavy",            color: "#f59e0b", icon: "🟡", description: "Ribs felt with difficulty. Waist absent or barely visible. Abdominal tuck may be absent." },
  { score: 8, label: "Obese",            color: "#f97316", icon: "🟠", description: "Ribs not palpable under heavy fat. No waist. Obvious abdominal rounding. Fat deposits on neck and limbs." },
  { score: 9, label: "Severely Obese",   color: "#ef4444", icon: "🔴", description: "Massive fat deposits. No waist. Abdominal distension. Fat deposits on neck, chest, spine, and tail base." },
];

// ── Ideal weight calculation (Millis & Levine / Laflamme) ────────────────────
function calcIdealWeight(currentKg, bcs) {
  if (!currentKg || bcs === 5) return currentKg;
  // % excess body fat (simplified): each BCS point from 5 = 10% fat change
  // For BCS > 5: body fat % = 20 + (bcs - 5) × 10
  // For BCS < 5: lean-deficit % = (5 - bcs) × 10
  const fatPct = 20 + (bcs - 5) * 10;           // e.g. BCS 7 → 40% body fat
  const leanFraction = 1 - fatPct / 100;
  const idealLeanFraction = 0.80;               // target lean fraction at BCS 5
  const idealKg = currentKg * (leanFraction / idealLeanFraction);
  return Math.max(idealKg, 0.5);
}

// ── RER (Resting Energy Requirement) ────────────────────────────────────────
function calcRER(kg) {
  return Math.round(70 * Math.pow(kg, 0.75));
}

// ── Calorie target per Millis & Levine ──────────────────────────────────────
function calcCalories(rer, bcs) {
  if (bcs > 5) return Math.round(rer * 1.0);     // weight loss: feed to lean BW RER
  if (bcs < 5) return Math.round(rer * 1.8);     // weight gain
  return Math.round(rer * 1.6);                   // maintenance (neutered average)
}

// ── Weeks to goal ────────────────────────────────────────────────────────────
function weeksToGoal(currentKg, idealKg) {
  const diff = Math.abs(currentKg - idealKg);
  if (diff < 0.1) return 0;
  // Millis & Levine: max 1% BW/week loss to preserve lean mass
  const weeklyRate = currentKg * 0.01;
  return Math.ceil(diff / weeklyRate);
}

// ── Pill badge ───────────────────────────────────────────────────────────────
function Badge({ children, color }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 9px", borderRadius: 20,
      fontSize: 10, fontWeight: 700, letterSpacing: "0.4px",
      background: color + "22", border: `1px solid ${color}55`,
      color,
    }}>{children}</span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function WeightCalculator({ petName = "", species = "dog" }) {
  const [unit, setUnit]         = useState("lbs");
  const [weight, setWeight]     = useState("");
  const [bcs, setBcs]           = useState(null);
  const [neutered, setNeutered] = useState(true);

  const isCat = species === "cat";
  const unitLabel = unit === "lbs" ? "lbs" : "kg";

  // Convert to kg internally
  const currentKg = useMemo(() => {
    const n = parseFloat(weight);
    if (!n || n <= 0) return null;
    return unit === "lbs" ? n * 0.453592 : n;
  }, [weight, unit]);

  const results = useMemo(() => {
    if (!currentKg || !bcs) return null;
    const idealKg  = calcIdealWeight(currentKg, bcs);
    const rer      = calcRER(idealKg);   // RER based on TARGET weight per M&L
    const calories = calcCalories(rer, bcs);
    const pctDiff  = ((idealKg - currentKg) / currentKg) * 100;
    const weeks    = weeksToGoal(currentKg, idealKg);
    const toDisplay = (kg) => unit === "lbs"
      ? (kg * 2.20462).toFixed(1)
      : kg.toFixed(1);
    return { idealKg, rer, calories, pctDiff, weeks, toDisplay };
  }, [currentKg, bcs, unit]);

  const bcsEntry = bcs ? BCS_DATA[bcs - 1] : null;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#e2e8f0" }}>

      {/* Section title */}
      <div style={{ fontSize: 10, fontWeight: 700, color: "#00F0FF",
        letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 14 }}>
        ⚖️ {petName ? `${petName}'s` : "Pet"} Weight Management
      </div>

      {/* Clinical source note */}
      <div style={{ fontSize: 10, color: "#2a6a7a", lineHeight: 1.6, marginBottom: 14,
        padding: "8px 10px", background: "#001520", borderRadius: 6,
        border: "1px solid #0a3040" }}>
        Based on <strong style={{ color: "#3a8a9a" }}>Millis & Levine</strong> (2014) —
        Canine Rehabilitation & Physical Therapy, 2nd ed. BCS: Purina 9-point scale.
      </div>

      {/* Unit + Neutered toggles */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {["lbs","kg"].map(u => (
          <button key={u} onClick={() => setUnit(u)} style={{
            flex: 1, padding: "7px 0", borderRadius: 7, fontSize: 11, fontWeight: 600,
            cursor: "pointer", border: "1px solid",
            borderColor: unit === u ? "#00F0FF66" : "#1a3a4a",
            background: unit === u ? "#00F0FF18" : "transparent",
            color: unit === u ? "#00F0FF" : "#4a7a8a",
          }}>{u.toUpperCase()}</button>
        ))}
        <button onClick={() => setNeutered(n => !n)} style={{
          flex: 2, padding: "7px 0", borderRadius: 7, fontSize: 11, fontWeight: 600,
          cursor: "pointer", border: "1px solid",
          borderColor: neutered ? "#00F0FF66" : "#1a3a4a",
          background: neutered ? "#00F0FF18" : "transparent",
          color: neutered ? "#00F0FF" : "#4a7a8a",
        }}>{neutered ? "✓ Neutered/Spayed" : "Intact"}</button>
      </div>

      {/* Weight input */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 10, fontWeight: 600, color: "#4a9aaa",
          textTransform: "uppercase", letterSpacing: "0.8px", display: "block", marginBottom: 5 }}>
          Current Weight ({unitLabel})
        </label>
        <input
          type="number"
          min="0.5" max={unit === "lbs" ? "300" : "140"}
          step="0.1"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          placeholder={unit === "lbs" ? "e.g. 65" : "e.g. 29.5"}
          style={{
            width: "100%", padding: "9px 12px", borderRadius: 8, fontSize: 13,
            background: "#0d1a28", border: "1px solid rgba(255,72,10,0.38)", color: "#e2e8f0",
            outline: "none", boxSizing: "border-box",
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: "0 0 0 1px rgba(255,72,10,0.22), 0 0 10px rgba(255,72,10,0.10)",
          }}
        />
      </div>

      {/* BCS selector */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 10, fontWeight: 600, color: "#4a9aaa",
          textTransform: "uppercase", letterSpacing: "0.8px", display: "block", marginBottom: 8 }}>
          Body Condition Score (BCS 1–9)
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(9,1fr)", gap: 3 }}>
          {BCS_DATA.map(b => (
            <button
              key={b.score}
              onClick={() => setBcs(b.score)}
              title={b.label}
              style={{
                padding: "8px 0", borderRadius: 6, fontSize: 11, fontWeight: 700,
                cursor: "pointer", border: "1px solid",
                borderColor: bcs === b.score ? b.color : "#0d2a3a",
                background: bcs === b.score ? b.color + "33" : "#050f1a",
                color: bcs === b.score ? b.color : "#2a5a6a",
                transition: "all 0.15s",
              }}
            >{b.score}</button>
          ))}
        </div>
        {/* BCS description */}
        {bcsEntry && (
          <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 7,
            background: bcsEntry.color + "11", border: `1px solid ${bcsEntry.color}33`,
            fontSize: 11, color: "#b0d0e0", lineHeight: 1.6 }}>
            <span style={{ fontWeight: 700, color: bcsEntry.color }}>{bcsEntry.score}/9 · {bcsEntry.label}</span>
            <br/>{bcsEntry.description}
          </div>
        )}
      </div>

      {/* Results */}
      {results && bcs && (
        <div style={{ marginTop: 4 }}>
          {/* Ideal weight card */}
          <div style={{ padding: "12px 14px", borderRadius: 9,
            background: "linear-gradient(135deg, #001a2e 0%, #002a40 100%)",
            border: "1px solid #0d3a50", marginBottom: 10 }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#4a9aaa",
                textTransform: "uppercase", letterSpacing: "0.8px" }}>Ideal Weight</span>
              <Badge color={bcs === 5 ? "#22c55e" : bcs > 5 ? "#f59e0b" : "#60a5fa"}>
                {bcs === 5 ? "At Goal" : bcs > 5 ? `Lose ${Math.abs(results.pctDiff).toFixed(0)}%` : `Gain ${Math.abs(results.pctDiff).toFixed(0)}%`}
              </Badge>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: "#00F0FF" }}>
                {results.toDisplay(results.idealKg)}
              </span>
              <span style={{ fontSize: 13, color: "#4a9aaa" }}>{unitLabel}</span>
              {bcs !== 5 && (
                <span style={{ fontSize: 11, color: "#3a6a7a", marginLeft: 4 }}>
                  (currently {parseFloat(weight)} {unitLabel})
                </span>
              )}
            </div>

            {bcs !== 5 && results.weeks > 0 && (
              <div style={{ fontSize: 11, color: "#4a8a9a", marginTop: 2 }}>
                🗓 Target timeline: <strong style={{ color: "#a0d8e8" }}>
                  {results.weeks} weeks
                </strong> at 1% BW/week
                <span style={{ color: "#2a5a6a" }}> (Millis & Levine safe rate)</span>
              </div>
            )}
          </div>

          {/* Calorie card */}
          <div style={{ padding: "12px 14px", borderRadius: 9,
            background: "#001520", border: "1px solid #0a3040", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#4a9aaa",
              textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>
              Daily Calorie Target
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#00F0FF" }}>
                  {results.calories}
                </div>
                <div style={{ fontSize: 10, color: "#3a6a7a" }}>kcal/day</div>
              </div>
              <div style={{ borderLeft: "1px solid #0a3040", paddingLeft: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#60a5fa" }}>
                  {results.rer}
                </div>
                <div style={{ fontSize: 10, color: "#3a6a7a" }}>RER (kcal/day)</div>
              </div>
            </div>
            <div style={{ fontSize: 10, color: "#2a5060", marginTop: 6, lineHeight: 1.6 }}>
              RER = 70 × (ideal BW<sup>0.75</sup>) · MER =
              RER × {bcs > 5 ? "1.0 (weight loss)" : bcs < 5 ? "1.8 (weight gain)" : "1.6 (maintenance)"}
            </div>
          </div>

          {/* M&L Rehab guidance */}
          <div style={{ padding: "11px 13px", borderRadius: 8,
            background: "#001520", border: "1px solid #0a3040", marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#4a9aaa",
              textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>
              Millis & Levine Rehab Notes
            </div>
            {bcs > 6 && (
              <div style={{ fontSize: 11, color: "#b0c8d0", lineHeight: 1.8 }}>
                • <strong style={{ color: "#f59e0b" }}>Obesity increases joint load 1.3–1.5×</strong> — address weight BEFORE intensifying exercise program<br/>
                • Aquatic therapy (UWTM / pool) preferred early — reduces effective BW by 40–62%<br/>
                • Avoid repetitive impact (jumping, stairs) until BCS ≤ 6<br/>
                • Weigh every 2 weeks — plateau triggers re-assessment<br/>
                • Lean mass preservation critical: <strong style={{ color: "#00F0FF" }}>never exceed 2% BW loss/week</strong>
              </div>
            )}
            {bcs === 5 && (
              <div style={{ fontSize: 11, color: "#b0c8d0", lineHeight: 1.8 }}>
                ✅ <strong style={{ color: "#22c55e" }}>Ideal condition</strong> — all exercise phases appropriate<br/>
                • Maintain with RER × 1.6 (neutered) or RER × 1.8 (intact)<br/>
                • Reassess BCS every 4 weeks during active rehab protocol
              </div>
            )}
            {bcs === 6 && (
              <div style={{ fontSize: 11, color: "#b0c8d0", lineHeight: 1.8 }}>
                • Mildly overweight — proceed with exercise but monitor joints<br/>
                • Caloric restriction alone yields 70% of weight loss goal<br/>
                • Add 20–30 min brisk leash walking daily if cleared by vet
              </div>
            )}
            {bcs < 5 && (
              <div style={{ fontSize: 11, color: "#b0c8d0", lineHeight: 1.8 }}>
                • <strong style={{ color: "#60a5fa" }}>Underweight</strong> — muscle wasting risk during rehab<br/>
                • Prioritise high-quality protein: ≥25% DM protein (dog), ≥30% (cat)<br/>
                • Delay high-intensity strengthening until BCS ≥ 4<br/>
                • Recheck weight weekly — target 0.5–1% BW gain/week max
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div style={{ fontSize: 10, color: "#1a4050", lineHeight: 1.6, padding: "8px 10px",
            background: "#000d18", borderRadius: 6, border: "1px solid #0a2530" }}>
            This calculator is a <strong style={{ color: "#2a6a7a" }}>clinical decision-support tool only</strong>.
            Dietary changes must be approved by your veterinarian. Caloric needs vary by breed,
            activity level, and health status. Not a substitute for professional veterinary nutritional assessment.
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!weight || !bcs) && (
        <div style={{ textAlign: "center", padding: "20px 0", color: "#1a4050", fontSize: 12 }}>
          Enter weight and select a BCS score to calculate
        </div>
      )}
    </div>
  );
}
