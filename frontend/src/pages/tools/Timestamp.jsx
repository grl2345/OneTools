import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
