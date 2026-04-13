import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import SEO, { schema } from "../../components/SEO";

// K-means color clustering in JS (no deps).
// Samples pixels (stride) to keep it snappy on large images.
function extractPalette(imageData, k = 6, iters = 12) {
  const { data, width, height } = imageData;
  const stride = Math.max(1, Math.floor(Math.sqrt((width * height) / 20000)));
  const samples = [];
  for (let y = 0; y < height; y += stride) {
    for (let x = 0; x < width; x += stride) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < 200) continue; // skip transparent
      samples.push([data[i], data[i + 1], data[i + 2]]);
    }
  }
  if (!samples.length) return [];

  // Seed: pick k random, well-separated samples
  const seen = new Set();
  const centroids = [];
  while (centroids.length < k && seen.size < samples.length) {
    const idx = Math.floor(Math.random() * samples.length);
    if (seen.has(idx)) continue;
    seen.add(idx);
    centroids.push([...samples[idx]]);
  }
  while (centroids.length < k) centroids.push([0, 0, 0]);

  const assign = new Int32Array(samples.length);
  for (let it = 0; it < iters; it++) {
    // Assign
    for (let i = 0; i < samples.length; i++) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const dr = samples[i][0] - centroids[c][0];
        const dg = samples[i][1] - centroids[c][1];
        const db = samples[i][2] - centroids[c][2];
        const d = dr * dr + dg * dg + db * db;
        if (d < bestD) { bestD = d; best = c; }
      }
      assign[i] = best;
    }
    // Update
    const sums = Array.from({ length: k }, () => [0, 0, 0, 0]);
    for (let i = 0; i < samples.length; i++) {
      const a = assign[i];
      sums[a][0] += samples[i][0];
      sums[a][1] += samples[i][1];
      sums[a][2] += samples[i][2];
      sums[a][3]++;
    }
    for (let c = 0; c < k; c++) {
      if (sums[c][3] > 0) {
        centroids[c][0] = Math.round(sums[c][0] / sums[c][3]);
        centroids[c][1] = Math.round(sums[c][1] / sums[c][3]);
        centroids[c][2] = Math.round(sums[c][2] / sums[c][3]);
      }
    }
  }

  // Count final membership and sort by prominence
  const counts = new Int32Array(k);
  for (let i = 0; i < samples.length; i++) counts[assign[i]]++;
  const total = samples.length;
  return centroids
    .map((c, i) => ({
      rgb: c,
      share: counts[i] / total,
      hex: rgbToHex(c[0], c[1], c[2]),
      rgbStr: `rgb(${c[0]}, ${c[1]}, ${c[2]})`,
      hsl: rgbToHsl(c[0], c[1], c[2]),
    }))
    .sort((a, b) => b.share - a.share);
}

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()
  );
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h *= 60;
  }
  return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

function luminance(r, g, b) {
  const [R, G, B] = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export default function Palette() {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [colors, setColors] = useState([]);
  const [k, setK] = useState(6);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(null);
  const inputRef = useRef(null);

  const run = async (f, count) => {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = URL.createObjectURL(f);
    });
    // Downscale for speed
    const maxDim = 600;
    let w = img.width, h = img.height;
    if (Math.max(w, h) > maxDim) {
      const s = maxDim / Math.max(w, h);
      w = Math.round(w * s); h = Math.round(h * s);
    }
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    return extractPalette(imgData, count);
  };

  const handleFile = async (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) { setError(t("tools.palette.notImage")); return; }
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setColors([]);
    try {
      setColors(await run(f, k));
    } catch (e) {
      setError(e?.message || "Extraction failed");
    }
  };

  const onChangeK = async (n) => {
    setK(n);
    if (!file) return;
    try { setColors(await run(file, n)); } catch {}
  };

  const copyColor = (fmt, color) => {
    const text = fmt === "hex" ? color.hex : fmt === "rgb" ? color.rgbStr : color.hsl;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(color.hex + fmt);
      setTimeout(() => setCopied(null), 1300);
    });
  };

  const copyAllHex = () => {
    if (!colors.length) return;
    const text = colors.map((c) => c.hex).join(", ");
    navigator.clipboard.writeText(text).then(() => {
      setCopied("all-hex");
      setTimeout(() => setCopied(null), 1300);
    });
  };

  const downloadSwatch = async () => {
    if (!colors.length) return;
    const w = 1200, h = 180 + colors.length * 72;
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.fillStyle = "#0a0b10";
    ctx.font = "700 36px -apple-system,Inter,sans-serif";
    ctx.fillText("Color Palette", 40, 70);
    ctx.font = "400 18px -apple-system,Inter,sans-serif";
    ctx.fillStyle = "#6e6e73";
    ctx.fillText("onetools.dev", 40, 108);

    // Swatches
    colors.forEach((c, i) => {
      const y = 140 + i * 72;
      ctx.fillStyle = c.hex;
      ctx.fillRect(40, y, 64, 64);
      ctx.fillStyle = "#0a0b10";
      ctx.font = "600 18px -apple-system,Inter,sans-serif";
      ctx.fillText(c.hex, 128, y + 28);
      ctx.font = "400 14px 'SF Mono',Menlo,monospace";
      ctx.fillStyle = "#6e6e73";
      ctx.fillText(c.rgbStr, 128, y + 52);
      ctx.fillText(`${(c.share * 100).toFixed(1)}%`, 1100, y + 40);
    });

    canvas.toBlob((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "palette.png";
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null); setPreview(null); setColors([]); setError(null);
  };

  const panel = { background: "#ffffff", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "var(--shadow-md)" };
  const panelHeader = { padding: "10px 14px", fontSize: 12, color: "var(--text-secondary)", fontWeight: 500, borderBottom: "1px solid var(--border-light)", background: "#fafbfc", display: "flex", justifyContent: "space-between", alignItems: "center", letterSpacing: -0.1 };

  return (
    <>
      <SEO
        title={t("tools.palette.name")}
        description={t("tools.palette.desc")}
        path="/tools/palette"
        structuredData={schema.softwareApp({
          name: "OneTools Palette",
          description: t("tools.palette.desc"),
          url: "https://onetools.dev/tools/palette",
        })}
      />
      <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ padding: "56px 0 0" }}>
          <h1 style={{ fontSize: 42, fontWeight: 700, letterSpacing: -1.4, lineHeight: 1.08 }}>
            {t("tools.palette.name")}
            <span style={{ background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}> · k-means</span>
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", marginTop: 8, fontWeight: 450 }}>
            {t("tools.palette.desc")}
          </p>
        </div>

        <input ref={inputRef} type="file" accept="image/*"
          onChange={(e) => handleFile(e.target.files?.[0])} style={{ display: "none" }} />

        {!file ? (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
            style={{
              marginTop: 28, padding: "80px 24px", textAlign: "center",
              borderRadius: "var(--radius)",
              border: `2px dashed ${dragging ? "var(--brand)" : "var(--border-strong)"}`,
              background: dragging ? "rgba(91,91,245,0.06)" : "#ffffff",
              cursor: "pointer", boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎨</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{t("tools.palette.dropHere")}</div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{t("tools.palette.hint")}</div>
          </div>
        ) : (
          <>
            <div style={{ padding: "24px 0 14px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t("tools.palette.count")}:</span>
              {[4, 5, 6, 8, 10].map((n) => (
                <button key={n} onClick={() => onChangeK(n)}
                  style={{
                    padding: "5px 12px", borderRadius: 999,
                    border: k === n ? "1px solid var(--text-primary)" : "1px solid var(--border)",
                    background: k === n ? "var(--text-primary)" : "#ffffff",
                    color: k === n ? "#fff" : "var(--text-secondary)",
                    fontSize: 11.5, fontWeight: 500,
                  }}>
                  {n}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <button onClick={copyAllHex}
                style={{ padding: "7px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: copied === "all-hex" ? "rgba(16,185,129,0.1)" : "#ffffff", color: copied === "all-hex" ? "var(--green)" : "var(--text-secondary)", fontSize: 12.5, fontWeight: 500 }}>
                {copied === "all-hex" ? "✓" : "⎘"} {t("tools.palette.copyAll")}
              </button>
              <button onClick={downloadSwatch}
                style={{ padding: "7px 14px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--text-primary)", color: "#fff", fontSize: 12.5, fontWeight: 600 }}>
                ⬇ PNG
              </button>
              <button onClick={reset}
                style={{ padding: "7px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-strong)", background: "#ffffff", color: "var(--text-primary)", fontSize: 12.5, fontWeight: 500 }}>
                {t("tools.palette.replace")}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 14, paddingBottom: 30 }}>
              <div style={panel}>
                <div style={panelHeader}>{t("tools.palette.source")}</div>
                <div style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f7", minHeight: 360 }}>
                  <img src={preview} alt="" style={{ maxWidth: "100%", maxHeight: 480, objectFit: "contain" }} />
                </div>
              </div>

              <div style={panel}>
                <div style={panelHeader}>
                  <span>{t("tools.palette.palette")}</span>
                  <span style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
                    {colors.length} {t("tools.palette.colors")}
                  </span>
                </div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {colors.map((c, i) => {
                    const textColor = luminance(c.rgb[0], c.rgb[1], c.rgb[2]) > 0.55 ? "#0a0b10" : "#ffffff";
                    return (
                      <li key={i} style={{
                        display: "flex", alignItems: "stretch",
                        borderBottom: "1px solid var(--border-light)",
                      }}>
                        <div style={{
                          width: 120, background: c.hex, color: textColor,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 600, letterSpacing: 0.3,
                          fontFamily: "var(--font-mono)",
                        }}>
                          {(c.share * 100).toFixed(0)}%
                        </div>
                        <div style={{ flex: 1, padding: "10px 14px" }}>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12.5 }}>
                            <span style={{ flex: 1, fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>{c.hex}</span>
                            <button onClick={() => copyColor("hex", c)}
                              style={{ padding: "2px 8px", borderRadius: 999, border: "1px solid var(--border)", background: copied === c.hex + "hex" ? "rgba(16,185,129,0.1)" : "#ffffff", color: copied === c.hex + "hex" ? "var(--green)" : "var(--text-secondary)", fontSize: 10 }}>
                              {copied === c.hex + "hex" ? "✓" : "⎘"}
                            </button>
                          </div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 11, marginTop: 4, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                            <span style={{ flex: 1 }}>{c.rgbStr}</span>
                            <button onClick={() => copyColor("rgb", c)}
                              style={{ padding: "1px 6px", borderRadius: 999, border: "1px solid var(--border)", background: copied === c.hex + "rgb" ? "rgba(16,185,129,0.1)" : "#ffffff", color: copied === c.hex + "rgb" ? "var(--green)" : "var(--text-muted)", fontSize: 9 }}>
                              {copied === c.hex + "rgb" ? "✓" : "⎘"}
                            </button>
                          </div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 11, marginTop: 2, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                            <span style={{ flex: 1 }}>{c.hsl}</span>
                            <button onClick={() => copyColor("hsl", c)}
                              style={{ padding: "1px 6px", borderRadius: 999, border: "1px solid var(--border)", background: copied === c.hex + "hsl" ? "rgba(16,185,129,0.1)" : "#ffffff", color: copied === c.hex + "hsl" ? "var(--green)" : "var(--text-muted)", fontSize: 9 }}>
                              {copied === c.hex + "hsl" ? "✓" : "⎘"}
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                  {!colors.length && (
                    <li style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                      {t("tools.palette.processing")}...
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {error && (
              <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", fontSize: 12.5, color: "var(--red)" }}>
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
