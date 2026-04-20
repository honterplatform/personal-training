export const Icon = ({ children, size = 20, stroke = 1.8, style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, ...style }}
  >
    {children}
  </svg>
);

export const WalkIcon = (p) => (
  <Icon {...p}>
    <circle cx="13" cy="4.5" r="1.5" />
    <path d="M10 21l2-6-2-3 3-4 3 2.5 3 1" />
    <path d="M8 13l-1.5 8" />
    <path d="M12 15l1 3" />
  </Icon>
);
export const SquashIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);
export const TkdIcon = (p) => (
  <Icon {...p}>
    <circle cx="11" cy="4.5" r="1.5" />
    <path d="M11 8l-1 5 4 2 2-3" />
    <path d="M10 13l-3 3 1 5" />
    <path d="M14 15v6" />
  </Icon>
);
export const StrengthIcon = (p) => (
  <Icon {...p}>
    <path d="M6 8v8M4 10v4" />
    <path d="M18 8v8M20 10v4" />
    <path d="M6 12h12" />
  </Icon>
);
export const ProteinIcon = (p) => (
  <Icon {...p}>
    <path d="M12 3c3 0 5 2 5 5 0 4-5 6-5 13 0-7-5-9-5-13 0-3 2-5 5-5z" />
  </Icon>
);
export const CheckIcon = (p) => (<Icon {...p}><path d="M5 12l5 5 9-11" /></Icon>);
export const ChevDown = (p) => (<Icon {...p}><path d="M6 9l6 6 6-6" /></Icon>);
export const GearIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1" />
  </Icon>
);
export const SparkIcon = (p) => (
  <Icon {...p}>
    <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
  </Icon>
);
export const FlameIcon = (p) => (
  <Icon {...p}>
    <path d="M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-6 1-9z" />
  </Icon>
);
export const NoteIcon = (p) => (
  <Icon {...p}>
    <path d="M5 4h10l4 4v12H5z" />
    <path d="M15 4v4h4" />
    <path d="M8 13h7M8 17h5" />
  </Icon>
);
export const HomeIcon = (p) => (
  <Icon {...p}>
    <path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1z" />
  </Icon>
);
export const ChartIcon = (p) => (
  <Icon {...p}>
    <path d="M4 19h16" />
    <path d="M7 15v-4M12 15V7M17 15v-6" />
  </Icon>
);
export const CalIcon = (p) => (
  <Icon {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Icon>
);
export const BoltIcon = (p) => (
  <Icon {...p}>
    <path d="M13 3L5 14h6l-1 7 8-11h-6z" />
  </Icon>
);
export const XIcon = (p) => (<Icon {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>);
export const LockIcon = (p) => (
  <Icon {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 018 0v3" />
  </Icon>
);
