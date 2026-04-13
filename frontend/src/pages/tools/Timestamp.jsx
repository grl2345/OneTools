import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import * as chrono from "chrono-node";

const pad = (n) => String(n).padStart(2, "0");

function toLocalInputValue(date) {
  // yyyy-MM-ddTHH:mm:ss for <input type="datetime-local" step="1">
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds())
  );
}

function formatLocal(date) {
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    " " +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds())
  );
}

function formatUTC(date) {
  return (
    date.getUTCFullYear() +
    "-" +
    pad(date.getUTCMonth() + 1) +
    "-" +
    pad(date.getUTCDate()) +
    " " +
    pad(date.getUTCHours()) +
    ":" +
    pad(date.getUTCMinutes()) +
    ":" +
    pad(date.getUTCSeconds()) +
    " UTC"
  );
}

function relativeTime(ms, t) {
  const diff = ms - Date.now();
  const abs = Math.abs(diff);
  const future = diff > 0;
  const units = [
    [1000 * 60 * 60 * 24 * 365, "year"],
    [1000 * 60 * 60 * 24 * 30, "month"],
    [1000 * 60 * 60 * 24, "day"],
    [1000 * 60 * 60, "hour"],
    [1000 * 60, "minute"],
    [1000, "second"],
  ];
  for (const [u, name] of units) {
    if (abs >= u) {
      const n = Math.floor(abs / u);
      return future
        ? t("tools.timestamp.inFuture", { n, unit: t("tools.timestamp." + name + (n > 1 ? "s" : "")) })
        : t("tools.timestamp.ago", { n, unit: t("tools.timestamp." + name + (n > 1 ? "s" : "")) });
    }
  }
  return t("tools.timestamp.justNow");
}

function CopyField({ label, value, mono }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 14px",
        borderBottom: "1px solid var(--border-light)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10.5,
            color: "var(--text-muted)",
            fontWeight: 600,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            marginBottom: 2,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 13.5,
            fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
            color: "var(--text-primary)",
            wordBreak: "break-all",
          }}
        >
          {value}
        </div>
      </div>
      <button
        onClick={copy}
        style={{
          padding: "5px 10px",
          borderRadius: 999,
          border: "1px solid var(--border)",
          background: copied ? "rgba(16,185,129,0.1)" : "#ffffff",
          color: copied ? "var(--green)" : "var(--text-secondary)",
          fontSize: 11,
          fontWeight: 500,
          flexShrink: 0,
        }}
      >
        {copied ? "✓" : "⎘"}
      </button>
    </div>
  );
}

export default function Timestamp() {
  const { t, i18n } = useTranslation();
  const [now, setNow] = useState(() => new Date());
  const [unit, setUnit] = useState("s"); // 's' or 'ms'

  // Date → Timestamp
  const [dateInput, setDateInput] = useState(() =>
    toLocalInputValue(new Date())
  );

  // Timestamp → Date
  const [tsInput, setTsInput] = useState(() =>
    String(Math.floor(Date.now() / 1000))
  );

  // AI parser
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null); // { iso, explanation, confidence, alternatives, typed }
  const [aiError, setAiError] = useState(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const tz = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    []
  );
  const tzOffset = useMemo(() => {
    const m = -new Date().getTimezoneOffset();
    const sign = m >= 0 ? "+" : "-";
    return `UTC${sign}${pad(Math.floor(Math.abs(m) / 60))}:${pad(
      Math.abs(m) % 60
    )}`;
  }, []);

  // Parse date input to Date
  const dateFromInput = useMemo(() => {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
  }, [dateInput]);

  // Parse ts input (respect unit)
  const dateFromTs = useMemo(() => {
    const raw = tsInput.trim();
    if (!raw) return null;
    if (!/^-?\d+$/.test(raw)) return null;
    const n = Number(raw);
    const ms = unit === "s" ? n * 1000 : n;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }, [tsInput, unit]);

  const handleUseNowForDate = () => setDateInput(toLocalInputValue(new Date()));
  const handleUseNowForTs = () =>
    setTsInput(
      unit === "s"
        ? String(Math.floor(Date.now() / 1000))
        : String(Date.now())
    );

  const animateExplanation = (text) => {
    if (typingTimer.current) clearInterval(typingTimer.current);
    let i = 0;
    const step = Math.max(1, Math.floor(text.length / 60));
    typingTimer.current = setInterval(() => {
      i = Math.min(text.length, i + step);
      setAiResult((prev) => (prev ? { ...prev, typed: text.slice(0, i) } : prev));
      if (i >= text.length) {
        clearInterval(typingTimer.current);
        typingTimer.current = null;
      }
    }, 18);
  };

  const handleAiParse = async () => {
    const q = aiQuery.trim();
    if (!q || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);

    // Brief async tick so the spinner actually shows — chrono is synchronous
    await new Promise((r) => setTimeout(r, 120));

    try {
      const lang = i18n.language || "zh";
      const zhFirst = lang === "zh";
      const primary = zhFirst ? chrono.zh : chrono;
      const fallback = zhFirst ? chrono : chrono.zh;

      // 1) Try natural-language parsing with the user's language first.
      let results = primary.parse(q, new Date(), { forwardDate: true });
      if (!results.length) {
        results = fallback.parse(q, new Date(), { forwardDate: true });
      }

      // 2) If still nothing, try a numeric-only timestamp interpretation.
      if (!results.length && /^-?\d{9,14}$/.test(q)) {
        const n = Number(q);
        const ms = Math.abs(n) >= 1e12 ? n : n * 1000;
        const d = new Date(ms);
        if (!isNaN(d.getTime())) {
          setDateInput(toLocalInputValue(d));
          setTsInput(
            unit === "s" ? String(Math.floor(d.getTime() / 1000)) : String(d.getTime())
          );
          const explanation = zhFirst
            ? `把 ${q} 当作 Unix 时间戳 → ${formatLocal(d)}`
            : `Interpreted ${q} as Unix timestamp → ${formatLocal(d)}`;
          setAiResult({
            iso: d.toISOString(),
            confidence: 0.9,
            explanation,
            alternatives: [],
            typed: "",
          });
          animateExplanation(explanation);
          return;
        }
      }

      // 3) Epoch-offset phrases like "纪元后 10 亿秒" / "1 billion seconds after epoch"
      if (!results.length) {
        const m = q.match(/(\d+(?:[.,]\d+)?)\s*(亿|万|million|billion|thousand)?\s*(秒|second|seconds|sec)/i);
        if (m) {
          let n = parseFloat(m[1].replace(",", ""));
          const unit2 = (m[2] || "").toLowerCase();
          if (unit2 === "亿") n *= 1e8;
          else if (unit2 === "万") n *= 1e4;
          else if (unit2 === "billion") n *= 1e9;
          else if (unit2 === "million") n *= 1e6;
          else if (unit2 === "thousand") n *= 1e3;
          const d = new Date(n * 1000);
          if (!isNaN(d.getTime())) {
            setDateInput(toLocalInputValue(d));
            setTsInput(
              unit === "s" ? String(Math.floor(d.getTime() / 1000)) : String(d.getTime())
            );
            const explanation = zhFirst
              ? `Unix 纪元 + ${n} 秒 → ${formatLocal(d)}`
              : `Unix epoch + ${n} seconds → ${formatLocal(d)}`;
            setAiResult({
              iso: d.toISOString(),
              confidence: 0.85,
              explanation,
              alternatives: [],
              typed: "",
            });
            animateExplanation(explanation);
            return;
          }
        }
      }

      if (!results.length) {
        throw new Error(
          zhFirst
            ? "无法解析这句时间描述，换个说法试试？"
            : "Couldn't parse this expression — try rephrasing?"
        );
      }

      // Use the first result as primary, the rest as alternatives
      const first = results[0];
      const date = first.start.date();
      setDateInput(toLocalInputValue(date));
      setTsInput(
        unit === "s"
          ? String(Math.floor(date.getTime() / 1000))
          : String(date.getTime())
      );

      const matched = first.text || q;
      const explanation = zhFirst
        ? `识别为 "${matched}" → ${formatLocal(date)}（${tz}）`
        : `Matched "${matched}" → ${formatLocal(date)} (${tz})`;
      const alternatives = results
        .slice(1, 4)
        .map((r) => r.start.date().toISOString());

      setAiResult({
        iso: date.toISOString(),
        confidence: results.length > 1 ? 0.75 : 0.95,
        explanation,
        alternatives,
        typed: "",
      });
      animateExplanation(explanation);
    } catch (e) {
      setAiError(e?.message || "Parse failed");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimer.current) clearInterval(typingTimer.current);
    };
  }, []);

  const switchUnit = (u) => {
    if (u === unit) return;
    // Convert current value
    const raw = tsInput.trim();
    if (/^-?\d+$/.test(raw)) {
      const n = Number(raw);
      setTsInput(
        u === "s" ? String(Math.floor(n / 1000)) : String(n * 1000)
      );
    }
    setUnit(u);
  };

  const panel = {
    background: "#ffffff",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    overflow: "hidden",
    boxShadow: "var(--shadow-md)",
  };

  const panelHeader = {
    padding: "12px 16px",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-primary)",
    borderBottom: "1px solid var(--border-light)",
    background: "#fafbfc",
    letterSpacing: -0.2,
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
    background: "#ffffff",
    fontSize: 14,
    fontFamily: "var(--font-mono)",
    color: "var(--text-primary)",
    outline: "none",
  };

  return (
    <div
      style={{
        maxWidth: "var(--max-width)",
        margin: "0 auto",
        padding: "0 24px",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "56px 0 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 42,
              fontWeight: 700,
              letterSpacing: -1.4,
              lineHeight: 1.08,
              color: "var(--text-primary)",
            }}
          >
            {t("tools.timestamp.name")}
            <span
              style={{
                background: "var(--gradient-brand)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {" "}⇄
            </span>
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "var(--text-secondary)",
              marginTop: 8,
              fontWeight: 450,
              letterSpacing: -0.15,
            }}
          >
            {t("tools.timestamp.desc")}
          </p>
        </div>

        <div style={{ display: "flex", gap: 4 }}>
          {["s", "ms"].map((u) => (
            <button
              key={u}
              onClick={() => switchUnit(u)}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: unit === u ? "var(--text-primary)" : "#ffffff",
                color: unit === u ? "#fff" : "var(--text-secondary)",
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                letterSpacing: 0.3,
              }}
            >
              {u === "s" ? t("tools.timestamp.seconds") : t("tools.timestamp.millis")}
            </button>
          ))}
        </div>
      </div>

      {/* Live clock */}
      <div
        style={{
          marginTop: 28,
          padding: "22px 26px",
          borderRadius: "var(--radius-lg)",
          background: "var(--gradient-brand)",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
          boxShadow:
            "0 10px 30px -6px rgba(91,91,245,0.4), inset 0 1px 0 rgba(255,255,255,0.18)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              opacity: 0.9,
              letterSpacing: 2,
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            {t("tools.timestamp.localNow")} · {tz} · {tzOffset}
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              letterSpacing: -0.5,
              lineHeight: 1.1,
            }}
          >
            {formatLocal(now)}
          </div>
          <div
            style={{
              fontSize: 12.5,
              opacity: 0.88,
              marginTop: 6,
              fontFamily: "var(--font-mono)",
            }}
          >
            {formatUTC(now)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 11,
              opacity: 0.9,
              letterSpacing: 2,
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            {t("tools.timestamp.currentTs")}
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              letterSpacing: -0.3,
            }}
          >
            {unit === "s"
              ? Math.floor(now.getTime() / 1000)
              : now.getTime()}
          </div>
          <div
            style={{
              fontSize: 11,
              opacity: 0.85,
              marginTop: 6,
              fontFamily: "var(--font-mono)",
            }}
          >
            {unit}
          </div>
        </div>
      </div>

      {/* ── AI Natural-language parser ───────────── */}
      <div
        style={{
          marginTop: 20,
          padding: 18,
          borderRadius: "var(--radius)",
          background: "#ffffff",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-md)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* accent corner glow */}
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 180,
            height: 180,
            background:
              "radial-gradient(closest-side, rgba(139,92,246,0.22), transparent)",
            pointerEvents: "none",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, position: "relative" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              height: 24,
              borderRadius: 7,
              background: "var(--gradient-brand)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            ✦
          </span>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: "var(--text-primary)",
                letterSpacing: -0.2,
              }}
            >
              {t("tools.timestamp.ai.title")}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginTop: 1,
                letterSpacing: -0.1,
              }}
            >
              {t("tools.timestamp.ai.subtitle")}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            position: "relative",
          }}
        >
          <input
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAiParse();
            }}
            placeholder={t("tools.timestamp.ai.placeholder")}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-strong)",
              background: "#ffffff",
              fontSize: 14,
              color: "var(--text-primary)",
              outline: "none",
            }}
          />
          <button
            onClick={handleAiParse}
            disabled={aiLoading || !aiQuery.trim()}
            style={{
              padding: "10px 18px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background:
                aiLoading || !aiQuery.trim()
                  ? "#d8d8e0"
                  : "var(--gradient-brand)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: -0.1,
              boxShadow:
                aiLoading || !aiQuery.trim()
                  ? "none"
                  : "0 4px 14px rgba(91,91,245,0.35)",
              cursor:
                aiLoading || !aiQuery.trim() ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {aiLoading ? t("tools.timestamp.ai.parsing") : t("tools.timestamp.ai.parse")}
          </button>
        </div>

        {/* Suggestion chips */}
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginTop: 10,
            position: "relative",
          }}
        >
          {[
            t("tools.timestamp.ai.s1"),
            t("tools.timestamp.ai.s2"),
            t("tools.timestamp.ai.s3"),
            t("tools.timestamp.ai.s4"),
          ].map((s, i) => (
            <button
              key={i}
              onClick={() => setAiQuery(s)}
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: "rgba(91,91,245,0.04)",
                color: "var(--text-secondary)",
                fontSize: 11.5,
                fontWeight: 500,
                letterSpacing: -0.1,
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Result */}
        {aiError && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              fontSize: 12.5,
              color: "var(--red)",
              position: "relative",
            }}
          >
            {aiError}
          </div>
        )}

        {aiResult && !aiError && (
          <div
            style={{
              marginTop: 12,
              padding: "12px 14px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(91,91,245,0.06)",
              border: "1px solid rgba(91,91,245,0.2)",
              position: "relative",
              animation: "fadeIn 0.25s ease both",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--brand)",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                {aiResult.iso}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {t("tools.timestamp.ai.confidence")}:{" "}
                {Math.round(aiResult.confidence * 100)}%
              </span>
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-primary)",
                lineHeight: 1.55,
                letterSpacing: -0.1,
                minHeight: 20,
              }}
            >
              {aiResult.typed}
              {typingTimer.current && (
                <span
                  style={{
                    display: "inline-block",
                    width: 7,
                    height: 14,
                    background: "var(--brand)",
                    marginLeft: 2,
                    verticalAlign: "-2px",
                    animation: "pulse 0.9s ease infinite",
                  }}
                />
              )}
            </div>
            {aiResult.alternatives && aiResult.alternatives.length > 0 && (
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginRight: 2,
                  }}
                >
                  {t("tools.timestamp.ai.alts")}:
                </span>
                {aiResult.alternatives.map((alt, i) => {
                  const d = new Date(alt);
                  const valid = !isNaN(d.getTime());
                  return (
                    <button
                      key={i}
                      disabled={!valid}
                      onClick={() => {
                        setDateInput(toLocalInputValue(d));
                        setTsInput(
                          unit === "s"
                            ? String(Math.floor(d.getTime() / 1000))
                            : String(d.getTime())
                        );
                      }}
                      style={{
                        padding: "3px 8px",
                        borderRadius: 999,
                        border: "1px solid var(--border)",
                        background: "#ffffff",
                        color: "var(--text-secondary)",
                        fontSize: 11,
                        fontFamily: "var(--font-mono)",
                        cursor: valid ? "pointer" : "not-allowed",
                      }}
                    >
                      {alt}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Converters */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          padding: "28px 0 20px",
        }}
      >
        {/* Date → Timestamp */}
        <div style={panel}>
          <div style={panelHeader}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--brand)",
              }}
            />
            {t("tools.timestamp.dateToTs")}
            <button
              onClick={handleUseNowForDate}
              style={{
                marginLeft: "auto",
                padding: "3px 10px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: "#ffffff",
                color: "var(--text-secondary)",
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              {t("tools.timestamp.useNow")}
            </button>
          </div>
          <div style={{ padding: "14px 14px 0" }}>
            <input
              type="datetime-local"
              step="1"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ padding: "14px 0 0" }}>
            {dateFromInput ? (
              <>
                <CopyField
                  label={t("tools.timestamp.seconds")}
                  value={String(Math.floor(dateFromInput.getTime() / 1000))}
                  mono
                />
                <CopyField
                  label={t("tools.timestamp.millis")}
                  value={String(dateFromInput.getTime())}
                  mono
                />
                <CopyField
                  label="ISO 8601"
                  value={dateFromInput.toISOString()}
                  mono
                />
                <CopyField
                  label={t("tools.timestamp.local")}
                  value={formatLocal(dateFromInput)}
                  mono
                />
              </>
            ) : (
              <div
                style={{
                  padding: "20px 14px",
                  fontSize: 12.5,
                  color: "var(--text-muted)",
                }}
              >
                {t("tools.timestamp.invalidDate")}
              </div>
            )}
          </div>
        </div>

        {/* Timestamp → Date */}
        <div style={panel}>
          <div style={panelHeader}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--purple)",
              }}
            />
            {t("tools.timestamp.tsToDate")}
            <button
              onClick={handleUseNowForTs}
              style={{
                marginLeft: "auto",
                padding: "3px 10px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: "#ffffff",
                color: "var(--text-secondary)",
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              {t("tools.timestamp.useNow")}
            </button>
          </div>
          <div style={{ padding: "14px 14px 0" }}>
            <input
              type="text"
              inputMode="numeric"
              placeholder={unit === "s" ? "1700000000" : "1700000000000"}
              value={tsInput}
              onChange={(e) => setTsInput(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ padding: "14px 0 0" }}>
            {dateFromTs ? (
              <>
                <CopyField
                  label={t("tools.timestamp.local")}
                  value={formatLocal(dateFromTs)}
                  mono
                />
                <CopyField
                  label="UTC"
                  value={formatUTC(dateFromTs)}
                  mono
                />
                <CopyField
                  label="ISO 8601"
                  value={dateFromTs.toISOString()}
                  mono
                />
                <CopyField
                  label={t("tools.timestamp.relative")}
                  value={relativeTime(dateFromTs.getTime(), t)}
                />
              </>
            ) : (
              <div
                style={{
                  padding: "20px 14px",
                  fontSize: 12.5,
                  color: "var(--text-muted)",
                }}
              >
                {t("tools.timestamp.invalidTs")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Presets */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          paddingBottom: 72,
        }}
      >
        {[
          { label: t("tools.timestamp.p.now"), fn: () => new Date() },
          {
            label: t("tools.timestamp.p.startOfDay"),
            fn: () => {
              const d = new Date();
              d.setHours(0, 0, 0, 0);
              return d;
            },
          },
          {
            label: t("tools.timestamp.p.endOfDay"),
            fn: () => {
              const d = new Date();
              d.setHours(23, 59, 59, 0);
              return d;
            },
          },
          {
            label: "-1h",
            fn: () => new Date(Date.now() - 3600 * 1000),
          },
          {
            label: "+1h",
            fn: () => new Date(Date.now() + 3600 * 1000),
          },
          {
            label: "-1d",
            fn: () => new Date(Date.now() - 86400 * 1000),
          },
          {
            label: "+1d",
            fn: () => new Date(Date.now() + 86400 * 1000),
          },
          {
            label: "-7d",
            fn: () => new Date(Date.now() - 7 * 86400 * 1000),
          },
        ].map((p) => (
          <button
            key={p.label}
            onClick={() => {
              const d = p.fn();
              setDateInput(toLocalInputValue(d));
              setTsInput(
                unit === "s"
                  ? String(Math.floor(d.getTime() / 1000))
                  : String(d.getTime())
              );
            }}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid var(--border)",
              background: "#ffffff",
              color: "var(--text-secondary)",
              fontSize: 12,
              fontWeight: 500,
              fontFamily: "var(--font-mono)",
              letterSpacing: -0.1,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
