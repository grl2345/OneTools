/**
 * Sidebar navigation icons — all stroke SVG, no emoji.
 * Same style as Aloom: 2px stroke, round caps, 18x18 viewbox.
 */

const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 18 18",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const HomeIcon = () => (
  <svg {...base}>
    <rect x="2.5" y="2.5" width="5" height="5" rx="1" />
    <rect x="10.5" y="2.5" width="5" height="5" rx="1" />
    <rect x="2.5" y="10.5" width="5" height="5" rx="1" />
    <rect x="10.5" y="10.5" width="5" height="5" rx="1" />
  </svg>
);

export const ToolsIcon = () => (
  <svg {...base}>
    <path d="M4 4h10M4 9h10M4 14h6" />
  </svg>
);

export const PrivacyIcon = () => (
  <svg {...base}>
    <rect x="4" y="8" width="10" height="7" rx="1.5" />
    <path d="M6 8V5.5a3 3 0 016 0V8" />
  </svg>
);

export const DocIcon = () => (
  <svg {...base}>
    <path d="M5 2.5h5l3 3V15a1 1 0 01-1 1H5a1 1 0 01-1-1V3.5a1 1 0 011-1z" />
    <path d="M10 2.5v3h3M6.5 10h5M6.5 12.5h3" />
  </svg>
);

export const ImageIcon = () => (
  <svg {...base}>
    <rect x="2.5" y="3.5" width="13" height="11" rx="1.5" />
    <circle cx="6" cy="7" r="1.2" />
    <path d="M3 13l4-4 3 3 2-2 3 3" />
  </svg>
);

export const PlayIcon = () => (
  <svg {...base}>
    <circle cx="9" cy="9" r="6.5" />
    <path d="M7.5 6l4 3-4 3V6z" fill="currentColor" stroke="none" />
  </svg>
);

export const CodeIcon = () => (
  <svg {...base}>
    <path d="M6 5l-3.5 4L6 13M12 5l3.5 4L12 13M10.5 3.5L7.5 14.5" />
  </svg>
);

export const InfoIcon = () => (
  <svg {...base}>
    <circle cx="9" cy="9" r="6.5" />
    <path d="M9 8.5v4M9 6.5h.01" />
  </svg>
);

export const GithubIcon = () => (
  <svg {...base} strokeWidth="0" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.5 2 2 6.5 2 12c0 4.4 2.9 8.2 6.8 9.5.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8.1-.7.3-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1 .8-.2 1.7-.3 2.5-.3s1.7.1 2.5.3c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.8v2.7c0 .3.2.6.7.5C19.1 20.2 22 16.4 22 12c0-5.5-4.5-10-10-10z" />
  </svg>
);

export const SparkleIcon = () => (
  <svg {...base}>
    <path d="M9 2v3M9 13v3M2 9h3M13 9h3M4 4l2 2M12 12l2 2M14 4l-2 2M6 12l-2 2" />
  </svg>
);
