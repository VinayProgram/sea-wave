// controls/sea-controls.tsx
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import * as THREE from "three";
import { uniform } from "three/tsl";

export type NumberField = { type: "number"; value: number; min: number; max: number; step: number };
export type ColorField = { type: "color"; value: string };
export type Field = NumberField | ColorField;
export type Schema = Record<string, Record<string, Field>>;

// Group names and keys must match the effect option names exactly.
export const defaultSchema: Schema = {
  noise: {
    swellAmp:   { type: "number", value: 0.55,  min: 0, max: 3,   step: 0.01 },
    swellScale: { type: "number", value: 0,     min: 0, max: 0.3, step: 0.005 },
    chopAmp:    { type: "number", value: 0.025, min: 0, max: 0.5, step: 0.005 },
    chopScale:  { type: "number", value: 5,     min: 0, max: 8,   step: 0.05 },
    seaSpeed:   { type: "number", value: 0.6,   min: 0, max: 4,   step: 0.05 },
  },
  ripple: {
    impactedRows: { type: "number", value: 6,    min: 1,    max: 20, step: 1 },
    speed:        { type: "number", value: 6,    min: 0,    max: 30, step: 0.5 },
    period:       { type: "number", value: 4,    min: 0.5,  max: 15, step: 0.5 },
    maxHeight:    { type: "number", value: 2.5,  min: 0,    max: 8,  step: 0.1 },
    distDecay:    { type: "number", value: 0.04, min: 0,    max: 0.3, step: 0.005 },
  },
  heightColor: {
    deep:      { type: "color",  value: "#06214f" },
    shallow:   { type: "color",  value: "#1f9fd8" },
    foam:      { type: "color",  value: "#ffffff" },
    lowH:      { type: "number", value: -0.4, min: -3, max: 3, step: 0.05 },
    highH:     { type: "number", value: 1.4,  min: -3, max: 6, step: 0.05 },
    foamStart: { type: "number", value: 1.2,  min: -3, max: 6, step: 0.05 },
    foamEnd:   { type: "number", value: 2.2,  min: -3, max: 8, step: 0.05 },
  },
  // in defaultSchema (controls/sea-controls.tsx)
bubbles: {
  bubbleColor:    { type: "color",  value: "#ffffff" },
  scale:          { type: "number", value: 1.5,  min: 0.2,  max: 6,   step: 0.05 },
  size:           { type: "number", value: 0.1,  min: 0.01, max: 0.4, step: 0.01 },
  softness:       { type: "number", value: 0.06, min: 0.005, max: 0.3, step: 0.005 },
  drift:          { type: "number", value: 0.4,  min: 0,    max: 3,   step: 0.05 },
  activityMin:    { type: "number", value: 0.25, min: 0,    max: 2,   step: 0.01 },
  activityMax:    { type: "number", value: 0.9,  min: 0.1,  max: 3,   step: 0.01 },
  impactRadius:   { type: "number", value: 6,    min: 1,    max: 20,  step: 0.5 },
  impactSpeed:    { type: "number", value: 5,    min: 0.5,  max: 20,  step: 0.5 },
  impactDuration: { type: "number", value: 2.5,  min: 0.5,  max: 8,   step: 0.1 },
  opacity:        { type: "number", value: 0.85, min: 0,    max: 1,   step: 0.01 },
},
};

type Value = number | string;
type Values = Record<string, Record<string, Value>>;
type Uniforms = Record<string, Record<string, any>>;

interface SeaControlsCtx {
  schema: Schema;
  values: Values;                                   // for the UI
  uniforms: Uniforms;                               // for the effects
  setValue: (group: string, key: string, v: Value) => void;
  reset: () => void;
}

export const SeaControlsContext = createContext<SeaControlsCtx | null>(null);

const initialValues = (schema: Schema): Values =>
  Object.fromEntries(
    Object.entries(schema).map(([g, fields]) => [
      g,
      Object.fromEntries(Object.entries(fields).map(([k, f]) => [k, f.value])),
    ])
  );

export function SeaControlsProvider({
  schema = defaultSchema,
  children,
}: { schema?: Schema; children: ReactNode }) {
  // Created once. These exact nodes are shared by every tile.
  const uniforms = useMemo<Uniforms>(() => {
    const out: Uniforms = {};
    for (const [g, fields] of Object.entries(schema)) {
      out[g] = {};
      for (const [k, f] of Object.entries(fields)) {
        out[g][k] = f.type === "color" ? uniform(new THREE.Color(f.value)) : uniform(f.value);
      }
    }
    return out;
  }, [schema]);

  const [values, setValues] = useState<Values>(() => initialValues(schema));

  const apply = useCallback(
    (g: string, k: string, v: Value) => {
      const u = uniforms[g][k];
      if (typeof v === "string") u.value.set(v); // color
      else u.value = v;                          // number
    },
    [uniforms]
  );

  const setValue = useCallback(
    (g: string, k: string, v: Value) => {
      apply(g, k, v);
      setValues((prev) => ({ ...prev, [g]: { ...prev[g], [k]: v } }));
    },
    [apply]
  );

  const reset = useCallback(() => {
    const init = initialValues(schema);
    for (const g in init) for (const k in init[g]) apply(g, k, init[g][k]);
    setValues(init);
  }, [schema, apply]);

  const ctx = useMemo(
    () => ({ schema, values, uniforms, setValue, reset }),
    [schema, values, uniforms, setValue, reset]
  );

  return <SeaControlsContext.Provider value={ctx}>{children}</SeaControlsContext.Provider>;
}

export function useSeaControls() {
  const ctx = useContext(SeaControlsContext);
  if (!ctx) throw new Error("useSeaControls must be used inside <SeaControlsProvider>");
  return ctx;
}