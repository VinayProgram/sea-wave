// controls/sea-panel.tsx

import { useSeaControls } from "../context/sea-control";

export function SeaPanel() {
  const { schema, values, setValue, reset } = useSeaControls();

  return (
    <div style={{
      position: "absolute", top: 12, right: 12, width: 260, maxHeight: "90vh",
      overflowY: "auto", padding: 12, borderRadius: 8, zIndex: 10,
      background: "rgba(0,0,0,0.65)", color: "#fff", font: "12px system-ui",
    }}>
      <button onClick={reset} style={{ marginBottom: 8 }}>Reset all</button>

      {Object.entries(schema).map(([group, fields]) => (
        <fieldset key={group} style={{ border: "1px solid #555", marginBottom: 8 }}>
          <legend>{group}</legend>
          {Object.entries(fields).map(([key, f]) => (
            <label key={key} style={{ display: "block", marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{key}</span>
                <span>{String(values[group][key])}</span>
              </div>
              {f.type === "number" ? (
                <input
                  type="range" min={f.min} max={f.max} step={f.step}
                  value={values[group][key] as number}
                  onChange={(e) => setValue(group, key, parseFloat(e.target.value))}
                  style={{ width: "100%" }}
                />
              ) : (
                <input
                  type="color"
                  value={values[group][key] as string}
                  onChange={(e) => setValue(group, key, e.target.value)}
                />
              )}
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
}