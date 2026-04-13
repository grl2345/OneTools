import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { marked } from "marked";

const SAMPLE_MD = `# Welcome to OneTools

**Markdown Preview** — real-time rendering with GitHub-flavored syntax.

## Features

- ✦ Live preview as you type
- ⚡ Synchronized scroll
- ◈ Copy rendered HTML
- Supports **bold**, *italic*, ~~strike~~, \`inline code\`

## Code Block

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`;
}
console.log(greet("OneTools"));
\`\`\`

## List

1. First item
2. Second item
   - Nested
   - Item
3. Third item

## Quote

> "The best tool is the one that gets out of your way."

## Table

| Tool | Status |
|------|--------|
| JSON Formatter | ✅ Live |
| Markdown Preview | ✅ Live |
| Regex Tester | 🚧 Soon |

## Link & Image

[Visit OneTools](https://example.com) · Inline math-looking formulas work too.
`;

marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: false,
  mangle: false,
});

function useDebounced(value, delay = 80) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

export default function MarkdownPreview() {
  const { t } = useTranslation();
  const [input, setInput] = useState(SAMPLE_MD);
  const [copied, setCopied] = useState(null);
  const textareaRef = useRef(null);
  const previewRef = useRef(null);

  const debouncedInput = useDebounced(input, 50);

  const html = useMemo(() => {
    try {
      return marked.parse(debouncedInput || "");
    } catch (e) {
      return `<pre style="color:var(--red)">${e.message}</pre>`;
    }
  }, [debouncedInput]);

  const stats = useMemo(() => {
    const chars = input.length;
    const words = (input.trim().match(/\S+/g) || []).length;
    const lines = input ? input.split("\n").length : 0;
    const readMin = Math.max(1, Math.round(words / 220));
    return { chars, words, lines, readMin };
  }, [input]);

  const handleCopy = async (kind) => {
    const text = kind === "html" ? html : input;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1800);
    } catch {}
  };

  const handleClear = () => setInput("");
  const handleSample = () => setInput(SAMPLE_MD);

  const handleScrollEditor = () => {
    const ta = textareaRef.current;
    const pv = previewRef.current;
    if (!ta || !pv) return;
    const ratio = ta.scrollTop / (ta.scrollHeight - ta.clientHeight || 1);
    pv.scrollTop = ratio * (pv.scrollHeight - pv.clientHeight);
  };

  const btn = (active) => ({
    padding: "6px 12px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
    background: active ? "var(--text-primary)" : "#ffffff",
    color: active ? "#fff" : "var(--text-secondary)",
    fontSize: 12.5,
    fontWeight: 500,
    letterSpacing: -0.1,
    transition: "all 0.15s ease",
    boxShadow: active
      ? "0 1px 2px rgba(10,11,16,0.2)"
      : "0 1px 2px rgba(10,11,16,0.03)",
  });

  const panel = {
    background: "#ffffff",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    overflow: "hidden",
    boxShadow: "var(--shadow-md)",
  };

  const panelHeader = {
    padding: "10px 14px",
    fontSize: 12,
    color: "var(--text-secondary)",
    fontWeight: 500,
    borderBottom: "1px solid var(--border-light)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fafbfc",
    letterSpacing: -0.1,
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
            {t("tools.markdownPreview.name")}
            <span
              style={{
                background: "var(--gradient-brand)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {" "}Live
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
            {t("tools.markdownPreview.desc")}
          </p>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            background: "rgba(16,185,129,0.1)",
            color: "var(--green)",
            border: "1px solid rgba(16,185,129,0.25)",
            letterSpacing: -0.1,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--green)",
            }}
          />
          GFM · {stats.words} {t("tools.markdownPreview.words")}
        </span>
      </div>

      {/* Toolbar */}
      <div
        style={{
          padding: "28px 0 14px",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => handleCopy("markdown")} style={btn(copied === "markdown")}>
            {copied === "markdown"
              ? "✓ " + t("tools.markdownPreview.copied")
              : t("tools.markdownPreview.copyMd")}
          </button>
          <button onClick={() => handleCopy("html")} style={btn(copied === "html")}>
            {copied === "html"
              ? "✓ " + t("tools.markdownPreview.copied")
              : t("tools.markdownPreview.copyHtml")}
          </button>
          <div style={{ width: 1, height: 18, background: "var(--border)", margin: "0 6px" }} />
          <button onClick={handleClear} style={btn(false)}>
            {t("tools.markdownPreview.clear")}
          </button>
        </div>
        <button
          onClick={handleSample}
          style={{
            padding: "6px 12px",
            borderRadius: "var(--radius-sm)",
            border: "1px dashed var(--border-strong)",
            background: "transparent",
            color: "var(--text-muted)",
            fontSize: 12.5,
            fontWeight: 500,
          }}
        >
          ↻ {t("tools.markdownPreview.sample")}
        </button>
      </div>

      {/* Split editor */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          paddingBottom: 20,
        }}
      >
        {/* Editor */}
        <div style={panel}>
          <div style={panelHeader}>
            <span>{t("tools.markdownPreview.editorLabel")}</span>
            <span style={{ color: "var(--text-faint)" }}>
              {stats.lines} {t("tools.markdownPreview.lines")} · {stats.chars}{" "}
              {t("tools.markdownPreview.chars")}
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onScroll={handleScrollEditor}
            placeholder={t("tools.markdownPreview.placeholder")}
            spellCheck={false}
            style={{
              width: "100%",
              height: 540,
              padding: "16px 18px",
              background: "transparent",
              border: "none",
              color: "var(--text-primary)",
              fontSize: 13,
              lineHeight: "20px",
              resize: "none",
              display: "block",
            }}
          />
        </div>

        {/* Preview */}
        <div style={panel}>
          <div style={panelHeader}>
            <span>{t("tools.markdownPreview.previewLabel")}</span>
            <span style={{ color: "var(--text-faint)" }}>
              {stats.words} {t("tools.markdownPreview.words")} ·{" "}
              {t("tools.markdownPreview.readMin", { min: stats.readMin })}
            </span>
          </div>
          <div
            ref={previewRef}
            className="md-preview"
            style={{
              height: 540,
              overflow: "auto",
              padding: "20px 24px",
              background: "#ffffff",
              color: "var(--text-primary)",
              fontSize: 14.5,
              lineHeight: 1.7,
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>

      {/* Features */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          padding: "24px 0 72px",
        }}
      >
        {[
          {
            icon: "⚡",
            color: "var(--orange)",
            titleKey: "tools.markdownPreview.f1",
            descKey: "tools.markdownPreview.f1Desc",
          },
          {
            icon: "✦",
            color: "var(--purple)",
            titleKey: "tools.markdownPreview.f2",
            descKey: "tools.markdownPreview.f2Desc",
          },
          {
            icon: "◈",
            color: "var(--cyan)",
            titleKey: "tools.markdownPreview.f3",
            descKey: "tools.markdownPreview.f3Desc",
          },
          {
            icon: "∞",
            color: "var(--pink)",
            titleKey: "tools.markdownPreview.f4",
            descKey: "tools.markdownPreview.f4Desc",
          },
        ].map((f, i) => (
          <div
            key={i}
            style={{
              padding: 18,
              borderRadius: "var(--radius)",
              background: "#ffffff",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "var(--shadow-lg)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 10, color: f.color }}>
              {f.icon}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 3,
                letterSpacing: -0.2,
              }}
            >
              {t(f.titleKey)}
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--text-muted)",
                lineHeight: 1.55,
                letterSpacing: -0.1,
              }}
            >
              {t(f.descKey)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
