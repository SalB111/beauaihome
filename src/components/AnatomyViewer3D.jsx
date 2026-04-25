// ============================================================================
// ANATOMY VIEWER 3D — Three.js Rotatable Canine/Feline Anatomy
// Ported from K9 Rehab Pro™ — adapted for B.E.A.U. Home dark theme
// © 2025 Salvatore Bonanno. All rights reserved.
// ============================================================================
// Stylized 3D schematic using Three.js primitives.
// Anatomically proportioned — clinically readable.
// Drag to rotate | Scroll to zoom | Hover to inspect
// Species-aware: canine vs feline proportions
// ============================================================================

import React, { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { FiRotateCw, FiEye, FiX } from "react-icons/fi";

// ── Clinical atlas (origin / insertion / action / nerve / plain-language) ──
const ATLAS = {
  quad_l:       { label:"Quadriceps Femoris (L)", plain:"Front thigh — the #1 muscle lost post-TPLO", action:"Stifle extension", nerve:"Femoral n. (L4-L6)" },
  quad_r:       { label:"Quadriceps Femoris (R)", plain:"Front thigh — the #1 muscle lost post-TPLO", action:"Stifle extension", nerve:"Femoral n. (L4-L6)" },
  hamstring_l:  { label:"Hamstrings (L)", plain:"Back thigh — primary propulsive engine", action:"Hip extension + stifle flexion", nerve:"Sciatic n. (L6-S2)" },
  hamstring_r:  { label:"Hamstrings (R)", plain:"Back thigh — primary propulsive engine", action:"Hip extension + stifle flexion", nerve:"Sciatic n. (L6-S2)" },
  glute_l:      { label:"Gluteals (L)", plain:"Hip muscles — power for sitting, climbing, lateral balance", action:"Hip abduction + extension", nerve:"Cranial/caudal gluteal n. (L6-S1)" },
  glute_r:      { label:"Gluteals (R)", plain:"Hip muscles — power for sitting, climbing, lateral balance", action:"Hip abduction + extension", nerve:"Cranial/caudal gluteal n. (L6-S1)" },
  hip_flexor_l: { label:"Iliopsoas (L)", plain:"Hip flexor — most commonly strained in canine athletes", action:"Hip flexion + external rotation", nerve:"Femoral n. (L4-L5)" },
  hip_flexor_r: { label:"Iliopsoas (R)", plain:"Hip flexor — most commonly strained in canine athletes", action:"Hip flexion + external rotation", nerve:"Femoral n. (L4-L5)" },
  hip_adduct_l: { label:"Hip Adductors (L)", plain:"Inner thigh — lateral stifle stabilizers", action:"Hip adduction", nerve:"Obturator n. (L4-L6)" },
  hip_adduct_r: { label:"Hip Adductors (R)", plain:"Inner thigh — lateral stifle stabilizers", action:"Hip adduction", nerve:"Obturator n. (L4-L6)" },
  hip_l:        { label:"Hip Joint (L)", plain:"Hip joint — most mobile joint in the hindlimb", action:"Ball-and-socket: flexion, extension, rotation", nerve:"Obturator + femoral nerve branches" },
  hip_r:        { label:"Hip Joint (R)", plain:"Hip joint — most mobile joint in the hindlimb", action:"Ball-and-socket: flexion, extension, rotation", nerve:"Obturator + femoral nerve branches" },
  stifle_l:     { label:"Stifle Joint (L)", plain:"Knee — most-injured joint in veterinary medicine", action:"Hinge: flex 35-45°, ext 155-165° (dog)", nerve:"Femoral + sciatic nerve branches" },
  stifle_r:     { label:"Stifle Joint (R)", plain:"Knee — most-injured joint in veterinary medicine", action:"Hinge: flex 35-45°, ext 155-165° (dog)", nerve:"Femoral + sciatic nerve branches" },
  ccl:          { label:"Cranial Cruciate Lig.", plain:"ACL equivalent — when ruptured, causes TPLO/TTA surgery", action:"Resists cranial tibial thrust + internal tibial rotation", nerve:"Mechanoreceptors (proprioceptive role)" },
  calf_l:       { label:"Gastrocnemius (L)", plain:"Calf muscle — push-off power, hock extension", action:"Hock extension + stifle flexion", nerve:"Tibial n. (L6-S1)" },
  calf_r:       { label:"Gastrocnemius (R)", plain:"Calf muscle — push-off power, hock extension", action:"Hock extension + stifle flexion", nerve:"Tibial n. (L6-S1)" },
  hock_l:       { label:"Hock Joint (L)", plain:"Ankle — absorbs landing impact, push-off lever", action:"Hinge: ext 160-165°, flex 35-40°", nerve:"Tibial + peroneal nerve branches" },
  hock_r:       { label:"Hock Joint (R)", plain:"Ankle — absorbs landing impact, push-off lever", action:"Hinge: ext 160-165°, flex 35-40°", nerve:"Tibial + peroneal nerve branches" },
  shoulder_l:   { label:"Shoulder Joint (L)", plain:"Shoulder — forelimb shock absorber, bears 60% bodyweight", action:"Ball-and-socket: flex 30-35°, ext 165-170°", nerve:"Suprascapular + musculocutaneous n." },
  shoulder_r:   { label:"Shoulder Joint (R)", plain:"Shoulder — forelimb shock absorber, bears 60% bodyweight", action:"Ball-and-socket: flex 30-35°, ext 165-170°", nerve:"Suprascapular + musculocutaneous n." },
  elbow_l:      { label:"Elbow Joint (L)", plain:"Elbow — #1 forelimb OA location in dogs and cats", action:"Hinge: ext 165-170°, flex 20-25°", nerve:"Radial + musculocutaneous n." },
  elbow_r:      { label:"Elbow Joint (R)", plain:"Elbow — #1 forelimb OA location in dogs and cats", action:"Hinge: ext 165-170°, flex 20-25°", nerve:"Radial + musculocutaneous n." },
  tricep_l:     { label:"Triceps Brachii (L)", plain:"Back of upper arm — prevents elbow collapse under bodyweight", action:"Elbow extension", nerve:"Radial n. (C7-T1)" },
  tricep_r:     { label:"Triceps Brachii (R)", plain:"Back of upper arm — prevents elbow collapse under bodyweight", action:"Elbow extension", nerve:"Radial n. (C7-T1)" },
  spine:        { label:"Vertebral Column", plain:"Backbone — transmits hindquarter drive to forelimbs", action:"Structural support; transmits locomotor forces", nerve:"31 pairs of spinal nerves" },
  core:         { label:"Core Musculature", plain:"Core = the foundation every limb movement depends on", action:"Spinal stability; resist bending and torsion", nerve:"Segmental dorsal branches of spinal nerves" },
  paraspinal_l: { label:"Epaxial Muscles (L)", plain:"Back muscles alongside spine — guarding here signals pain", action:"Spine extension + lateral bending", nerve:"Dorsal branches of spinal nerves" },
  paraspinal_r: { label:"Epaxial Muscles (R)", plain:"Back muscles alongside spine — guarding here signals pain", action:"Spine extension + lateral bending", nerve:"Dorsal branches of spinal nerves" },
};

// ── 3D colour palette — dark B.E.A.U. theme ─────────────────────────────
const COL = {
  body:      0x0d2a44,   // deep navy — body silhouette
  bone:      0x0e3a55,   // slightly brighter for bones
  default:   0x1a4060,   // dim blue — inactive muscle
  primary:   0x00b8d4,   // cyan teal — primary
  secondary: 0xf59e0b,   // amber — secondary
  surgical:  0xef4444,   // red — surgical site
  joint:     0x0891b2,   // bright teal — joints
  hover:     0x00f0ff,   // bright cyan — hover
};

// ── Canine body builder ──────────────────────────────────────────────────
function buildCanineBody(scene, meshMap) {
  const mats = {};
  Object.entries(COL).forEach(([k, v]) => {
    mats[k] = new THREE.MeshPhongMaterial({
      color: v, transparent: true,
      opacity: k === "body" ? 0.3 : k === "bone" ? 0.55 : 0.85,
      shininess: k === "body" ? 15 : 70,
    });
  });

  const add = (geo, mat, pos, rot, ids) => {
    const m = new THREE.Mesh(geo, mat.clone());
    m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    m.castShadow = true;
    m.userData.ids = ids || [];
    scene.add(m);
    if (ids) ids.forEach(id => {
      if (!meshMap[id]) meshMap[id] = [];
      meshMap[id].push(m);
    });
    return m;
  };

  // TORSO
  add(new THREE.CapsuleGeometry(0.38, 1.4, 8, 16), mats.body,    [0, 0.35, 0],    [0,0,Math.PI/2], ["core"]);
  add(new THREE.CapsuleGeometry(0.1,  1.3, 6,  8),  mats.default, [0, 0.55, 0.16], [0,0,Math.PI/2], ["paraspinal_l"]);
  add(new THREE.CapsuleGeometry(0.1,  1.3, 6,  8),  mats.default, [0, 0.55,-0.16], [0,0,Math.PI/2], ["paraspinal_r"]);
  add(new THREE.CapsuleGeometry(0.045,1.5, 4,  8),  mats.bone,    [0, 0.62, 0],    [0,0,Math.PI/2], ["spine"]);

  // HEAD & NECK
  add(new THREE.SphereGeometry(0.22, 16, 12), mats.body, [1.1, 0.7,  0], null,          []);
  add(new THREE.CapsuleGeometry(0.1, 0.22, 4, 8), mats.body, [1.38,0.6, 0], [0,0,Math.PI/2], []);
  add(new THREE.CapsuleGeometry(0.14,0.38, 6, 8), mats.body, [0.82,0.56,0], [0,0,-Math.PI/5],[]);

  // TAIL
  add(new THREE.CapsuleGeometry(0.06,0.5,4,8), mats.body, [-1.05,0.55,0], [0,0,Math.PI/4], []);

  // LEFT HINDLIMB
  const HZ = 0.22;
  add(new THREE.CapsuleGeometry(0.14,0.28,8,10), mats.default, [-0.52,0.42, HZ],         [0.2,0,0],    ["glute_l"]);
  add(new THREE.CapsuleGeometry(0.09,0.28,6, 8), mats.default, [-0.42,0.35, HZ+0.05],    [0.5,0,0],    ["hip_flexor_l"]);
  add(new THREE.CapsuleGeometry(0.08,0.26,6, 8), mats.default, [-0.52,0.3,  HZ-0.07],    [0.4,0,0.1],  ["hip_adduct_l"]);
  add(new THREE.SphereGeometry(0.1,12,10),       mats.joint,   [-0.58,0.28, HZ],         null,          ["hip_l"]);
  add(new THREE.CapsuleGeometry(0.04,0.44,4, 8), mats.bone,    [-0.6, 0.06, HZ],         [0.15,0,0],   []);
  add(new THREE.CapsuleGeometry(0.11,0.42,8,10), mats.default, [-0.6, 0.08, HZ+0.09],    [0.15,0,0],   ["hamstring_l"]);
  add(new THREE.CapsuleGeometry(0.11,0.42,8,10), mats.default, [-0.6, 0.08, HZ-0.05],    [0.15,0,0],   ["quad_l"]);
  add(new THREE.SphereGeometry(0.09,12,10),      mats.joint,   [-0.65,-0.18,HZ],         null,          ["stifle_l"]);
  add(new THREE.CylinderGeometry(0.025,0.025,0.1,6), mats.default, [-0.65,-0.15,HZ], null, ["ccl"]);
  add(new THREE.CapsuleGeometry(0.08,0.32,6, 8), mats.default, [-0.65,-0.36,HZ+0.04],    [0.2,0,0],    ["calf_l"]);
  add(new THREE.CapsuleGeometry(0.03,0.3, 4,  6), mats.bone,   [-0.67,-0.36,HZ],         [0.2,0,0],    []);
  add(new THREE.SphereGeometry(0.065,10, 8),     mats.joint,   [-0.68,-0.56,HZ],         null,          ["hock_l"]);
  add(new THREE.SphereGeometry(0.07, 10, 8),     mats.body,    [-0.68,-0.68,HZ],         null,          []);

  // RIGHT HINDLIMB
  const HZR = -0.22;
  add(new THREE.CapsuleGeometry(0.14,0.28,8,10), mats.default, [-0.52,0.42, HZR],        [0.2,0,0],    ["glute_r"]);
  add(new THREE.CapsuleGeometry(0.09,0.28,6, 8), mats.default, [-0.42,0.35, HZR-0.05],   [0.5,0,0],    ["hip_flexor_r"]);
  add(new THREE.CapsuleGeometry(0.08,0.26,6, 8), mats.default, [-0.52,0.3,  HZR+0.07],   [0.4,0,-0.1], ["hip_adduct_r"]);
  add(new THREE.SphereGeometry(0.1,12,10),       mats.joint,   [-0.58,0.28, HZR],        null,          ["hip_r"]);
  add(new THREE.CapsuleGeometry(0.04,0.44,4, 8), mats.bone,    [-0.6, 0.06, HZR],        [0.15,0,0],   []);
  add(new THREE.CapsuleGeometry(0.11,0.42,8,10), mats.default, [-0.6, 0.08, HZR-0.09],   [0.15,0,0],   ["hamstring_r"]);
  add(new THREE.CapsuleGeometry(0.11,0.42,8,10), mats.default, [-0.6, 0.08, HZR+0.05],   [0.15,0,0],   ["quad_r"]);
  add(new THREE.SphereGeometry(0.09,12,10),      mats.joint,   [-0.65,-0.18,HZR],        null,          ["stifle_r"]);
  add(new THREE.CapsuleGeometry(0.08,0.32,6, 8), mats.default, [-0.65,-0.36,HZR-0.04],   [0.2,0,0],    ["calf_r"]);
  add(new THREE.CapsuleGeometry(0.03,0.3, 4,  6), mats.bone,   [-0.67,-0.36,HZR],        [0.2,0,0],    []);
  add(new THREE.SphereGeometry(0.065,10, 8),     mats.joint,   [-0.68,-0.56,HZR],        null,          ["hock_r"]);
  add(new THREE.SphereGeometry(0.07, 10, 8),     mats.body,    [-0.68,-0.68,HZR],        null,          []);

  // LEFT FORELIMB
  const FZ = 0.2;
  add(new THREE.SphereGeometry(0.1,12,10),       mats.joint,   [0.68, 0.28, FZ],        null,          ["shoulder_l"]);
  add(new THREE.CapsuleGeometry(0.1, 0.28,8,10), mats.default, [0.65, 0.28, FZ+0.06],   [0.1,0,0],    ["shoulder_l"]);
  add(new THREE.CapsuleGeometry(0.035,0.38,4, 8), mats.bone,   [0.68, 0.06, FZ],        [0.1,0,0],    []);
  add(new THREE.CapsuleGeometry(0.09,0.36,6, 8), mats.default, [0.68, 0.06, FZ+0.08],   [0.1,0,0],    ["tricep_l"]);
  add(new THREE.SphereGeometry(0.075,10, 8),     mats.joint,   [0.72,-0.14, FZ],        null,          ["elbow_l"]);
  add(new THREE.CapsuleGeometry(0.025,0.3, 4,  6), mats.bone,  [0.74,-0.32, FZ],        [0.05,0,0],   []);
  add(new THREE.SphereGeometry(0.055,8,  8),     mats.joint,   [0.75,-0.5,  FZ],        null,          []);
  add(new THREE.SphereGeometry(0.065,10, 8),     mats.body,    [0.75,-0.62, FZ],        null,          []);

  // RIGHT FORELIMB
  const FZR = -0.2;
  add(new THREE.SphereGeometry(0.1,12,10),       mats.joint,   [0.68, 0.28, FZR],       null,          ["shoulder_r"]);
  add(new THREE.CapsuleGeometry(0.1, 0.28,8,10), mats.default, [0.65, 0.28, FZR-0.06],  [0.1,0,0],    ["shoulder_r"]);
  add(new THREE.CapsuleGeometry(0.035,0.38,4, 8), mats.bone,   [0.68, 0.06, FZR],       [0.1,0,0],    []);
  add(new THREE.CapsuleGeometry(0.09,0.36,6, 8), mats.default, [0.68, 0.06, FZR-0.08],  [0.1,0,0],    ["tricep_r"]);
  add(new THREE.SphereGeometry(0.075,10, 8),     mats.joint,   [0.72,-0.14, FZR],       null,          ["elbow_r"]);
  add(new THREE.CapsuleGeometry(0.025,0.3, 4,  6), mats.bone,  [0.74,-0.32, FZR],       [0.05,0,0],   []);
  add(new THREE.SphereGeometry(0.055,8,  8),     mats.joint,   [0.75,-0.5,  FZR],       null,          []);
  add(new THREE.SphereGeometry(0.065,10, 8),     mats.body,    [0.75,-0.62, FZR],       null,          []);
}

// ── Feline builder ───────────────────────────────────────────────────────
function buildFelineBody(scene, meshMap) {
  const mats = {};
  Object.entries(COL).forEach(([k, v]) => {
    mats[k] = new THREE.MeshPhongMaterial({
      color: v, transparent: true,
      opacity: k === "body" ? 0.3 : k === "bone" ? 0.55 : 0.85,
      shininess: k === "body" ? 15 : 70,
    });
  });
  const add = (geo, mat, pos, rot, ids) => {
    const m = new THREE.Mesh(geo, mat.clone());
    m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    m.castShadow = true;
    m.userData.ids = ids || [];
    scene.add(m);
    if (ids) ids.forEach(id => {
      if (!meshMap[id]) meshMap[id] = [];
      meshMap[id].push(m);
    });
    return m;
  };

  // TORSO
  add(new THREE.CapsuleGeometry(0.3, 1.6, 8, 16), mats.body,    [0, 0.28, 0],    [0,0,Math.PI/2], ["core"]);
  add(new THREE.CapsuleGeometry(0.08,1.5, 6,  8),  mats.default, [0, 0.46, 0.14], [0,0,Math.PI/2], ["paraspinal_l"]);
  add(new THREE.CapsuleGeometry(0.08,1.5, 6,  8),  mats.default, [0, 0.46,-0.14], [0,0,Math.PI/2], ["paraspinal_r"]);
  add(new THREE.CapsuleGeometry(0.035,1.6,4,  8),  mats.bone,    [0, 0.52, 0],    [0,0,Math.PI/2], ["spine"]);

  // HEAD
  add(new THREE.SphereGeometry(0.18,16,12),      mats.body, [1.06,0.56, 0], null,          []);
  add(new THREE.ConeGeometry(0.06,0.14,4),        mats.body, [1.09,0.79, 0.08],null,        []);
  add(new THREE.ConeGeometry(0.06,0.14,4),        mats.body, [1.09,0.79,-0.08],null,        []);
  add(new THREE.CapsuleGeometry(0.07,0.1,4,8),    mats.body, [1.26,0.5,  0], [0,0,Math.PI/2],[]);
  add(new THREE.CapsuleGeometry(0.11,0.28,6,8),   mats.body, [0.82,0.44, 0], [0,0,-Math.PI/4],[]);
  add(new THREE.CapsuleGeometry(0.045,0.7,4,8),   mats.body, [-1.15,0.5, 0], [0,0,-Math.PI/5],[]);

  // LEFT HINDLIMB
  const HZ = 0.19;
  add(new THREE.CapsuleGeometry(0.11,0.24,8,10), mats.default, [-0.5,  0.34, HZ],        [0.2,0,0],   ["glute_l"]);
  add(new THREE.CapsuleGeometry(0.07,0.22,6, 8), mats.default, [-0.4,  0.28, HZ+0.04],   [0.5,0,0],   ["hip_flexor_l"]);
  add(new THREE.CapsuleGeometry(0.065,0.2,6, 8), mats.default, [-0.5,  0.24, HZ-0.06],   [0.4,0,0.1], ["hip_adduct_l"]);
  add(new THREE.SphereGeometry(0.08,12,10),      mats.joint,   [-0.56, 0.22, HZ],        null,         ["hip_l"]);
  add(new THREE.CapsuleGeometry(0.032,0.36,4, 8),mats.bone,    [-0.58, 0.04, HZ],        [0.15,0,0],  []);
  add(new THREE.CapsuleGeometry(0.09,0.34,8,10), mats.default, [-0.58, 0.04, HZ+0.07],   [0.15,0,0],  ["hamstring_l"]);
  add(new THREE.CapsuleGeometry(0.09,0.34,8,10), mats.default, [-0.58, 0.04, HZ-0.04],   [0.15,0,0],  ["quad_l"]);
  add(new THREE.SphereGeometry(0.072,12,10),     mats.joint,   [-0.62,-0.14, HZ],        null,         ["stifle_l"]);
  add(new THREE.CapsuleGeometry(0.065,0.26,6, 8),mats.default, [-0.62,-0.3,  HZ+0.03],   [0.2,0,0],   ["calf_l"]);
  add(new THREE.SphereGeometry(0.052,10, 8),     mats.joint,   [-0.64,-0.48, HZ],        null,         ["hock_l"]);
  add(new THREE.SphereGeometry(0.055,10, 8),     mats.body,    [-0.64,-0.58, HZ],        null,         []);

  // RIGHT HINDLIMB
  const HZR = -0.19;
  add(new THREE.CapsuleGeometry(0.11,0.24,8,10), mats.default, [-0.5,  0.34, HZR],       [0.2,0,0],    ["glute_r"]);
  add(new THREE.CapsuleGeometry(0.07,0.22,6, 8), mats.default, [-0.4,  0.28, HZR-0.04],  [0.5,0,0],    ["hip_flexor_r"]);
  add(new THREE.CapsuleGeometry(0.065,0.2,6, 8), mats.default, [-0.5,  0.24, HZR+0.06],  [0.4,0,-0.1], ["hip_adduct_r"]);
  add(new THREE.SphereGeometry(0.08,12,10),      mats.joint,   [-0.56, 0.22, HZR],       null,          ["hip_r"]);
  add(new THREE.CapsuleGeometry(0.032,0.36,4, 8),mats.bone,    [-0.58, 0.04, HZR],       [0.15,0,0],   []);
  add(new THREE.CapsuleGeometry(0.09,0.34,8,10), mats.default, [-0.58, 0.04, HZR-0.07],  [0.15,0,0],   ["hamstring_r"]);
  add(new THREE.CapsuleGeometry(0.09,0.34,8,10), mats.default, [-0.58, 0.04, HZR+0.04],  [0.15,0,0],   ["quad_r"]);
  add(new THREE.SphereGeometry(0.072,12,10),     mats.joint,   [-0.62,-0.14, HZR],       null,          ["stifle_r"]);
  add(new THREE.CapsuleGeometry(0.065,0.26,6, 8),mats.default, [-0.62,-0.3,  HZR-0.03],  [0.2,0,0],    ["calf_r"]);
  add(new THREE.SphereGeometry(0.052,10, 8),     mats.joint,   [-0.64,-0.48, HZR],       null,          ["hock_r"]);
  add(new THREE.SphereGeometry(0.055,10, 8),     mats.body,    [-0.64,-0.58, HZR],       null,          []);

  // FORELIMBS
  const FZ = 0.17;
  add(new THREE.SphereGeometry(0.08,12,10),      mats.joint,   [0.65, 0.22, FZ],        null,          ["shoulder_l"]);
  add(new THREE.CapsuleGeometry(0.08,0.24,8,10), mats.default, [0.62, 0.22, FZ+0.05],   [0.1,0,0],    ["shoulder_l"]);
  add(new THREE.CapsuleGeometry(0.028,0.32,4, 8),mats.bone,    [0.65, 0.04, FZ],        [0.1,0,0],    []);
  add(new THREE.CapsuleGeometry(0.072,0.3,6, 8), mats.default, [0.65, 0.04, FZ+0.06],   [0.1,0,0],    ["tricep_l"]);
  add(new THREE.SphereGeometry(0.06,10, 8),      mats.joint,   [0.68,-0.12, FZ],        null,          ["elbow_l"]);
  add(new THREE.CapsuleGeometry(0.022,0.26,4, 6),mats.bone,    [0.7, -0.28, FZ],        [0.05,0,0],   []);
  add(new THREE.SphereGeometry(0.05, 8,  8),     mats.body,    [0.72,-0.52, FZ],        null,          []);

  const FZR = -0.17;
  add(new THREE.SphereGeometry(0.08,12,10),      mats.joint,   [0.65, 0.22, FZR],       null,          ["shoulder_r"]);
  add(new THREE.CapsuleGeometry(0.08,0.24,8,10), mats.default, [0.62, 0.22, FZR-0.05],  [0.1,0,0],    ["shoulder_r"]);
  add(new THREE.CapsuleGeometry(0.028,0.32,4, 8),mats.bone,    [0.65, 0.04, FZR],       [0.1,0,0],    []);
  add(new THREE.CapsuleGeometry(0.072,0.3,6, 8), mats.default, [0.65, 0.04, FZR-0.06],  [0.1,0,0],    ["tricep_r"]);
  add(new THREE.SphereGeometry(0.06,10, 8),      mats.joint,   [0.68,-0.12, FZR],       null,          ["elbow_r"]);
  add(new THREE.CapsuleGeometry(0.022,0.26,4, 6),mats.bone,    [0.7, -0.28, FZR],       [0.05,0,0],   []);
  add(new THREE.SphereGeometry(0.05, 8,  8),     mats.body,    [0.72,-0.52, FZR],       null,          []);
}

// ── Main component ────────────────────────────────────────────────────────
export default function AnatomyViewer3D({ species = "dog", height = 380 }) {
  const mountRef    = useRef(null);
  const sceneRef    = useRef(null);
  const rendRef     = useRef(null);
  const camRef      = useRef(null);
  const frameRef    = useRef(null);
  const meshMapRef  = useRef({});
  const isDrag      = useRef(false);
  const lastPos     = useRef({ x: 0, y: 0 });
  const rotRef      = useRef({ y: 0.3, x: -0.1 });
  const groupRef    = useRef(null);
  const mouseInside = useRef(false);
  const autoRotRef  = useRef(true);

  const [hovered, setHovered]       = useState(null);
  const [plainMode, setPlainMode]   = useState(true);   // plain lang by default for consumer
  const [autoRot, setAutoRot]       = useState(true);
  const [webglErr, setWebglErr]     = useState(null);

  const isFeline = species === "cat";
  const label    = isFeline ? "Feline" : "Canine";

  // ── Colour helper ────────────────────────────────────────────────────
  const applyColors = (meshMap) => {
    Object.values(meshMap).flat().forEach(m => {
      m.material.color.setHex(COL.default);
      m.material.emissive.setHex(0x000000);
      m.material.opacity = 0.85;
    });
  };

  // ── Raycasting ───────────────────────────────────────────────────────
  const onMouseMove = (e) => {
    if (!rendRef.current || !sceneRef.current || !camRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(mouse, camRef.current);
    const hits = ray.intersectObjects(Object.values(meshMapRef.current).flat());
    if (hits.length > 0) {
      const ids = hits[0].object.userData.ids || [];
      if (ids.length) {
        setHovered(ids[0]);
        hits[0].object.material.color.setHex(COL.hover);
        hits[0].object.material.emissive.setHex(0x002244);
        return;
      }
    }
    // Reset colours when not hitting
    applyColors(meshMapRef.current);
    setHovered(null);
  };

  // ── Drag ─────────────────────────────────────────────────────────────
  const onPointerDown = (e) => {
    isDrag.current = true;
    autoRotRef.current = false;
    setAutoRot(false);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e) => {
    if (!isDrag.current || !groupRef.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    rotRef.current.y += dx * 0.008;
    rotRef.current.x += dy * 0.005;
    rotRef.current.x = Math.max(-0.6, Math.min(0.6, rotRef.current.x));
    groupRef.current.rotation.y = rotRef.current.y;
    groupRef.current.rotation.x = rotRef.current.x;
    lastPos.current = { x: e.clientX, y: e.clientY };
    onMouseMove(e);
  };
  const onPointerUp = () => { isDrag.current = false; };

  // ── Scroll zoom ──────────────────────────────────────────────────────
  const onWheel = (e) => {
    if (!camRef.current) return;
    camRef.current.position.z = Math.max(1.5, Math.min(4.5,
      camRef.current.position.z + e.deltaY * 0.003));
  };

  // ── Touch support ────────────────────────────────────────────────────
  const touchStart = useRef(null);
  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      isDrag.current = true;
      autoRotRef.current = false;
      setAutoRot(false);
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };
  const onTouchMove = (e) => {
    if (!isDrag.current || !groupRef.current || !e.touches[0]) return;
    const dx = e.touches[0].clientX - lastPos.current.x;
    const dy = e.touches[0].clientY - lastPos.current.y;
    rotRef.current.y += dx * 0.008;
    rotRef.current.x += dy * 0.005;
    rotRef.current.x = Math.max(-0.6, Math.min(0.6, rotRef.current.x));
    groupRef.current.rotation.y = rotRef.current.y;
    groupRef.current.rotation.x = rotRef.current.x;
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = () => { isDrag.current = false; };

  // ── Scene setup ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mountRef.current) return;
    setWebglErr(null);
    const W = mountRef.current.clientWidth || 480;
    const H = height;

    let renderer;
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!ctx) throw new Error("WebGL not available");
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, failIfMajorPerformanceCaveat: false });
    } catch (err) {
      setWebglErr("WebGL unavailable on this device. Try Chrome or Safari.");
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050a14);
    scene.fog = new THREE.FogExp2(0x050a14, 0.15);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0.1, 2.8);
    camRef.current = camera;

    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);
    rendRef.current = renderer;

    // Lights — cooler, bluer for dark theme
    scene.add(new THREE.AmbientLight(0x0a1a2e, 0.8));
    const key = new THREE.DirectionalLight(0x4488ff, 1.1);
    key.position.set(2, 3, 2); key.castShadow = true;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x00b8d4, 0.5);
    fill.position.set(-2, 1, -1);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0x00f0ff, 0.3);
    rim.position.set(0, -2, -2);
    scene.add(rim);

    // Grid
    const grid = new THREE.GridHelper(4, 20, 0x0a2030, 0x060f1a);
    grid.position.y = -0.75;
    scene.add(grid);

    // Build anatomy group
    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    const meshMap = {};
    meshMapRef.current = meshMap;

    // Intercept add() so geometry meshes go into group
    const origAdd = scene.add.bind(scene);
    let building = true;
    scene.add = (obj) => {
      if (building && obj instanceof THREE.Mesh) group.add(obj);
      else origAdd(obj);
    };

    if (isFeline) buildFelineBody(scene, meshMap);
    else buildCanineBody(scene, meshMap);

    building = false;
    scene.add = origAdd;

    group.rotation.y = rotRef.current.y;
    group.rotation.x = rotRef.current.x;

    applyColors(meshMap);

    // Animate
    let angle = rotRef.current.y;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      if (autoRotRef.current && !isDrag.current && !mouseInside.current && groupRef.current) {
        angle += 0.005;
        groupRef.current.rotation.y = angle;
        rotRef.current.y = angle;
      }
      renderer.render(scene, camera);
    };
    animate();

    // WebGL context lost handler
    renderer.domElement.addEventListener("webglcontextlost", () => {
      setWebglErr("WebGL context lost. Please reload.");
    });

    return () => {
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      if (mountRef.current) mountRef.current.innerHTML = "";
    };
  }, [isFeline, height]);

  // ── Fallback ─────────────────────────────────────────────────────────
  if (webglErr) {
    return (
      <div style={{
        background:"linear-gradient(135deg,#0F1828 0%,#050A14 100%)",
        border:"1px solid #1C1C1F", borderRadius:12, padding:"20px 22px", margin:"8px 0",
      }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#00F0FF", letterSpacing:"1px",
          textTransform:"uppercase", marginBottom:8 }}>🩻 3D Anatomy · {label}</div>
        <p style={{ color:"#BFBFC4", fontSize:13, marginBottom:14 }}>{webglErr}</p>
        <button onClick={() => setWebglErr(null)} style={{
          background:"#00F0FF22", border:"1px solid #00F0FF66", color:"#00F0FF",
          fontSize:12, fontWeight:500, padding:"8px 16px", borderRadius:6, cursor:"pointer"
        }}>Retry</button>
      </div>
    );
  }

  const hoveredInfo = hovered ? ATLAS[hovered] : null;

  return (
    <div style={{ background:"#050a14", border:"1px solid #0d2236", borderRadius:12,
      margin:"8px 0", overflow:"hidden" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"10px 14px", borderBottom:"1px solid #0d2236",
        background:"rgba(0,5,15,0.6)" }}>
        <span style={{ fontSize:11, fontWeight:700, color:"#00F0FF",
          letterSpacing:"1px", textTransform:"uppercase" }}>
          🩻 3D Anatomy · {label}
        </span>
        <div style={{ display:"flex", gap:6 }}>
          <button
            onClick={() => { autoRotRef.current = !autoRot; setAutoRot(r => !r); }}
            style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px",
              borderRadius:6, fontSize:10, fontWeight:600, cursor:"pointer",
              background: autoRot ? "#00F0FF22" : "transparent",
              border:`1px solid ${autoRot ? "#00F0FF66" : "#1a3a4a"}`,
              color: autoRot ? "#00F0FF" : "#4a7a8a" }}>
            <FiRotateCw size={10}/> Rotate
          </button>
          <button
            onClick={() => setPlainMode(m => !m)}
            style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px",
              borderRadius:6, fontSize:10, fontWeight:600, cursor:"pointer",
              background: !plainMode ? "#00F0FF22" : "transparent",
              border:`1px solid ${!plainMode ? "#00F0FF66" : "#1a3a4a"}`,
              color: !plainMode ? "#00F0FF" : "#4a7a8a" }}>
            <FiEye size={10}/> {plainMode ? "Plain" : "Clinical"}
          </button>
        </div>
      </div>

      {/* 3D canvas */}
      <div
        style={{ position:"relative", cursor: isDrag.current ? "grabbing" : "grab" }}
        onMouseEnter={() => { mouseInside.current = true; }}
        onMouseLeave={() => { mouseInside.current = false; setHovered(null); applyColors(meshMapRef.current); }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onMouseMove={onMouseMove}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div ref={mountRef} style={{ width:"100%", height }} />

        {/* Hint */}
        {!hoveredInfo && (
          <div style={{ position:"absolute", bottom:10, left:0, right:0, textAlign:"center",
            color:"#1a4a5a", fontSize:10, pointerEvents:"none" }}>
            Drag to rotate · Scroll to zoom · Hover to inspect
          </div>
        )}

        {/* Hover tooltip */}
        {hoveredInfo && (
          <div style={{ position:"absolute", bottom:10, left:10, right:10,
            padding:"12px 16px", background:"rgba(2,8,20,0.97)",
            borderRadius:10, border:"1px solid #00b8d4", pointerEvents:"none",
            boxShadow:"0 4px 24px rgba(0,0,0,0.8), 0 0 12px rgba(0,240,255,0.08)" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#00F0FF", marginBottom:6 }}>
              {hoveredInfo.label}
            </div>
            {plainMode ? (
              <div style={{ fontSize:12, color:"#b0d8e8", lineHeight:1.7 }}>
                {hoveredInfo.plain}
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"64px 1fr",
                gap:"3px 10px", fontSize:11, lineHeight:1.7 }}>
                <span style={{ color:"#2a5a6a", fontWeight:700, textTransform:"uppercase", fontSize:9 }}>Action</span>
                <span style={{ color:"#c8e8f0" }}>{hoveredInfo.action}</span>
                <span style={{ color:"#2a5a6a", fontWeight:700, textTransform:"uppercase", fontSize:9 }}>Nerve</span>
                <span style={{ color:"#a0c0e0" }}>{hoveredInfo.nerve}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
