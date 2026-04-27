import Svg, { Circle, Path, Rect } from "react-native-svg";

type Props = { size?: number; color?: string; strokeWidth?: number };

const make = (paint: (p: { color: string; sw: number }) => React.ReactNode) =>
  function Icon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: Props) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {paint({ color, sw: strokeWidth })}
      </Svg>
    );
  };

const stroke = (color: string, sw: number) => ({
  stroke: color,
  strokeWidth: sw,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none" as const,
});

export const WalkIcon = make(({ color, sw }) => (
  <>
    <Circle cx={13} cy={4.5} r={1.5} {...stroke(color, sw)} />
    <Path d="M10 21l2-6-2-3 3-4 3 2.5 3 1" {...stroke(color, sw)} />
    <Path d="M8 13l-1.5 8" {...stroke(color, sw)} />
    <Path d="M12 15l1 3" {...stroke(color, sw)} />
  </>
));

export const SquashIcon = make(({ color, sw }) => (
  <>
    <Circle cx={12} cy={12} r={9} {...stroke(color, sw)} />
    <Path d="M6 6l12 12M18 6L6 18" {...stroke(color, sw)} />
  </>
));

export const TkdIcon = make(({ color, sw }) => (
  <>
    <Circle cx={11} cy={4.5} r={1.5} {...stroke(color, sw)} />
    <Path d="M11 8l-1 5 4 2 2-3" {...stroke(color, sw)} />
    <Path d="M10 13l-3 3 1 5" {...stroke(color, sw)} />
    <Path d="M14 15v6" {...stroke(color, sw)} />
  </>
));

export const StrengthIcon = make(({ color, sw }) => (
  <>
    <Path d="M6 8v8M4 10v4" {...stroke(color, sw)} />
    <Path d="M18 8v8M20 10v4" {...stroke(color, sw)} />
    <Path d="M6 12h12" {...stroke(color, sw)} />
  </>
));

export const ProteinIcon = make(({ color, sw }) => (
  <Path
    d="M12 3c3 0 5 2 5 5 0 4-5 6-5 13 0-7-5-9-5-13 0-3 2-5 5-5z"
    {...stroke(color, sw)}
  />
));

export const CheckIcon = make(({ color, sw }) => (
  <Path d="M5 12l5 5 9-11" {...stroke(color, sw)} />
));

export const ChevDown = make(({ color, sw }) => (
  <Path d="M6 9l6 6 6-6" {...stroke(color, sw)} />
));

export const FlameIcon = make(({ color, sw }) => (
  <Path
    d="M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-6 1-9z"
    {...stroke(color, sw)}
  />
));

export const NoteIcon = make(({ color, sw }) => (
  <>
    <Path d="M5 4h10l4 4v12H5z" {...stroke(color, sw)} />
    <Path d="M15 4v4h4" {...stroke(color, sw)} />
    <Path d="M8 13h7M8 17h5" {...stroke(color, sw)} />
  </>
));

export const GearIcon = make(({ color, sw }) => (
  <>
    <Circle cx={12} cy={12} r={3} {...stroke(color, sw)} />
    <Path
      d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"
      {...stroke(color, sw)}
    />
  </>
));

export const SparkIcon = make(({ color, sw }) => (
  <Path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" {...stroke(color, sw)} />
));

export const XIcon = make(({ color, sw }) => (
  <Path d="M6 6l12 12M18 6L6 18" {...stroke(color, sw)} />
));

export const LockIcon = make(({ color, sw }) => (
  <>
    <Rect x={5} y={11} width={14} height={9} rx={2} {...stroke(color, sw)} />
    <Path d="M8 11V8a4 4 0 018 0v3" {...stroke(color, sw)} />
  </>
));

export const CalIcon = make(({ color, sw }) => (
  <>
    <Rect x={3.5} y={5} width={17} height={15} rx={2} {...stroke(color, sw)} />
    <Path d="M3.5 10h17M8 3v4M16 3v4" {...stroke(color, sw)} />
  </>
));
