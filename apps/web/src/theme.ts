/** Design tokens — light institutional theme */
export const T = {
  /* Canvas */
  bg:       "#f0f2f5",
  surface:  "#ffffff",
  surface2: "#f8f9fb",
  surface3: "#f0f2f5",

  /* Borders */
  border:   "#e2e6ea",
  borderMd: "#d1d5db",
  borderHi: "#c8293a",

  /* Primary — institutional red (from reference palette) */
  red:      "#c8293a",
  redDk:    "#a31e2b",
  redLt:    "#e04050",
  redBg:    "rgba(200,41,58,0.06)",
  redBg2:   "rgba(200,41,58,0.12)",

  /* Semantic */
  green:    "#059669",
  greenBg:  "rgba(5,150,105,0.08)",
  amber:    "#b45309",
  amberBg:  "rgba(180,83,9,0.08)",

  /* Text */
  text1:    "#111827",
  text2:    "#4b5563",
  text3:    "#9ca3af",
  textInv:  "#ffffff",

  /* Fonts */
  sans:     "'Inter', system-ui, sans-serif",
  mono:     "'DM Mono', monospace",

  /* Radius */
  rSm: "4px",
  rMd: "6px",
  rLg: "10px",
} as const;

export const COURSE_PALETTE: { bg: string; border: string; text: string }[] = [
  { bg: "rgba(200,41,58,0.07)",   border: "#c8293a", text: "#a31e2b" },
  { bg: "rgba(5,150,105,0.07)",   border: "#059669", text: "#065f46" },
  { bg: "rgba(37,99,235,0.07)",   border: "#2563eb", text: "#1d4ed8" },
  { bg: "rgba(124,58,237,0.07)",  border: "#7c3aed", text: "#5b21b6" },
  { bg: "rgba(180,83,9,0.07)",    border: "#b45309", text: "#92400e" },
  { bg: "rgba(0,128,128,0.07)",   border: "#0d9488", text: "#0f766e" },
];
