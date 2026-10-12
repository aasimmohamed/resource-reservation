export type Tone = { chip: string; block: string; bar: string };

const indigo: Tone = { chip: "bg-indigo-100 text-indigo-700", block: "bg-indigo-600", bar: "bg-indigo-500" };
const amber: Tone = { chip: "bg-amber-100 text-amber-800", block: "bg-amber-600", bar: "bg-amber-500" };
const emerald: Tone = { chip: "bg-emerald-100 text-emerald-700", block: "bg-emerald-600", bar: "bg-emerald-500" };
const rose: Tone = { chip: "bg-rose-100 text-rose-700", block: "bg-rose-600", bar: "bg-rose-500" };
const sky: Tone = { chip: "bg-sky-100 text-sky-700", block: "bg-sky-600", bar: "bg-sky-500" };
const fuchsia: Tone = { chip: "bg-fuchsia-100 text-fuchsia-700", block: "bg-fuchsia-600", bar: "bg-fuchsia-500" };

const known: Record<string, Tone> = {
  "meeting room": indigo,
  hall: amber,
  vehicle: emerald,
  equipment: rose,
};

const fallbacks = [sky, fuchsia, indigo, amber, emerald, rose];

// Known types get a fixed color; any new type gets a stable color from its name.
export function toneFor(type: string): Tone {
  const key = type.trim().toLowerCase();
  if (known[key]) return known[key];
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return fallbacks[hash % fallbacks.length];
}