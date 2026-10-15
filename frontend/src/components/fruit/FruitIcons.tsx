import React from 'react';
import type { FruitKind } from './fruitBusinessTypes';

const LEAF = '#2F9E44';
const LEAF_DARK = '#237A35';
const LEAF_LIGHT = '#3FB950';
const STEM = '#6B4423';
const SEED = '#1C1917';

const Shine: React.FC<{ cx: number; cy: number; rx: number; ry: number; rotate?: number; fill?: string }> = ({
  cx, cy, rx, ry, rotate = 0, fill = '#FFFFFF',
}) => <ellipse cx={cx} cy={cy} rx={rx} ry={ry} transform={`rotate(${rotate} ${cx} ${cy})`} fill={fill} opacity={0.55} />;

const TopLeaf: React.FC<{ x: number; y: number; flip?: boolean }> = ({ x, y, flip }) => (
  <g transform={`translate(${x} ${y})${flip ? ' scale(-1 1)' : ''}`}>
    <path d="M0 0c3-6 10-8.5 15-6.5C12.4-1.1 6 1.5 0 0z" fill={LEAF} />
    <path d="M1.5-.6C5.6-2.6 9.6-4.4 13.4-5.6" stroke={LEAF_DARK} strokeWidth={1} strokeLinecap="round" fill="none" />
  </g>
);

const Citrus: React.FC<{ body: string; shade: string; cx?: number; cy?: number; rx: number; ry: number; dots: string }> = ({
  body, shade, cx = 32, cy = 37, rx, ry, dots,
}) => (
  <>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={body} />
    <path d={`M${cx} ${cy - ry}A${rx} ${ry} 0 0 1 ${cx} ${cy + ry}A${rx * 1.3} ${ry} 0 0 0 ${cx} ${cy - ry}z`} fill={shade} opacity={0.5} />
    {[[-7, -4], [5, -8], [9, 4], [-3, 7], [-10, 6], [2, 1]].map(([dx, dy], i) => (
      <circle key={i} cx={cx + dx * (rx / 18)} cy={cy + dy * (ry / 18)} r={0.9} fill={dots} opacity={0.45} />
    ))}
    <Shine cx={cx - rx * 0.42} cy={cy - ry * 0.4} rx={rx * 0.18} ry={ry * 0.3} rotate={-30} />
    <circle cx={cx} cy={cy - ry + 0.6} r={1.9} fill="#4D7C0F" />
  </>
);

const Half: React.FC<{ skin: string; flesh: string; core?: string; coreR?: number; r?: number }> = ({
  skin, flesh, core, coreR = 7, r = 19,
}) => (
  <>
    <circle cx={32} cy={35} r={r} fill={skin} />
    <circle cx={32} cy={35} r={r - 2.8} fill={flesh} />
    {core && <circle cx={32} cy={35} r={coreR} fill={core} />}
  </>
);

const radial = (n: number, radius: number, cx = 32, cy = 35, offset = 0) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + offset;
    return { x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius, deg: (a * 180) / Math.PI };
  });

const DRAWINGS: Record<FruitKind, React.ReactNode> = {
  mango: (
    <>
      <path d="M16 41c-3.5-11 3.5-24 17-25.5 10-1 18 5.5 18 15 0 12-10 21.5-21.5 21.5C23 52 18 48 16 41z" fill="#FFB020" />
      <path d="M33 15.5c10-1 18 5.5 18 15 0 9-5.6 16.6-13.4 19.8 4.6-5.2 6.4-11.8 5.4-18-1.2-7.6-4.8-13.5-10-16.8z" fill="#F97316" opacity={0.6} />
      <Shine cx={24.5} cy={30} rx={3.2} ry={7} rotate={28} fill="#FFF7D6" />
      <path d="M33 16c.4-3.4 1.8-6 4-8" stroke={STEM} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <TopLeaf x={37} y={9} />
    </>
  ),
  banana: (
    <>
      <path d="M18 11c2.5 17 16 27.5 35 23.5 2.6-.6 3.6-2.6 3-4.4-.5-1.3-1.9-1.8-3.3-1.5C37 31.5 26 23 24.3 11z" fill="#EAB308" />
      <path d="M11 15c1 19 16 33 38 30 3-.4 4.5-2.4 4-4.4-.4-1.4-1.8-2-3.4-1.8C32 41 20 31 17.5 15.6z" fill="#FACC15" />
      <path d="M14.5 19c2 12 9.5 20.5 20.5 23.5" stroke="#FEF08A" strokeWidth={2.2} strokeLinecap="round" fill="none" />
      <path d="M9.5 7.5h10l-1.6 9h-6.6z" fill="#65A30D" />
      <circle cx={52.6} cy={42.4} r={1.7} fill="#57351F" />
      <circle cx={55.8} cy={31.4} r={1.7} fill="#57351F" />
    </>
  ),
  papaya: (
    <>
      <path d="M30 6.6c.4-2 1-3.4 2-4.6 1 1.2 1.6 2.6 2 4.6" fill="#4D7C0F" />
      <path d="M32 6c11 0 19 11.5 19 27S42.5 59 32 59 13 48.5 13 33 21 6 32 6z" fill="#4D7C0F" />
      <path d="M32 9.5c9 0 15.6 10.4 15.6 23.5S41 55.5 32 55.5 16.4 46 16.4 33 23 9.5 32 9.5z" fill="#FB923C" />
      <path d="M32 21c4.4 0 7.2 6.4 7.2 14S36.4 49.5 32 49.5s-7.2-6.9-7.2-14.5S27.6 21 32 21z" fill="#FDBA74" />
      {[[29.5, 27], [34, 26.8], [31.6, 31], [28.4, 35.4], [35.2, 34.8], [31.8, 39.4], [28.8, 43], [34.8, 42.6], [31.8, 46.4]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.8} fill={SEED} />
      ))}
      <Shine cx={21.5} cy={26} rx={2} ry={6.5} fill="#FED7AA" />
    </>
  ),
  pineapple: (
    <>
      <path d="M30.5 25c-5-4-8-9-9-15 5 3 8 8 9 15z" fill={LEAF_DARK} />
      <path d="M33.5 25c5-4 8-9 9-15-5 3-8 8-9 15z" fill={LEAF_DARK} />
      <path d="M29 26c-6-1.5-10-5-12.5-9.5 5.5 0 9.6 3.4 12.5 9.5z" fill={LEAF_LIGHT} />
      <path d="M35 26c6-1.5 10-5 12.5-9.5-5.5 0-9.6 3.4-12.5 9.5z" fill={LEAF_LIGHT} />
      <path d="M32 25c-2.2-6.4-2.2-13 0-20 2.2 7 2.2 13.6 0 20z" fill={LEAF} />
      <ellipse cx={32} cy={42} rx={14} ry={17.5} fill="#F59E0B" />
      <path d="M32 24.5c7.7 0 14 7.8 14 17.5S39.7 59.5 32 59.5c4.5-3.5 7.4-10 7.4-17.5S36.5 28 32 24.5z" fill="#D97706" opacity={0.55} />
      {[[28.5, 31], [35.5, 31], [25, 37], [32, 37], [39, 37], [21.5, 43], [28.5, 43], [35.5, 43], [42.5, 43], [25, 49], [32, 49], [39, 49], [28.5, 55], [35.5, 55]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y - 3.2}l3.2 3.2-3.2 3.2-3.2-3.2z`} stroke="#92400E" strokeWidth={1.1} fill="none" opacity={0.7} />
      ))}
    </>
  ),
  orange: (
    <>
      <Citrus body="#FB923C" shade="#EA580C" rx={20} ry={20} cy={36} dots="#C2410C" />
      <TopLeaf x={33} y={16.5} />
    </>
  ),
  mandarin: (
    <>
      <Citrus body="#F97316" shade="#C2410C" rx={21} ry={16.5} cy={39} dots="#9A3412" />
      <path d="M22 30c2 6 2 12 0 18M32 23v32M42 30c-2 6-2 12 0 18" stroke="#C2410C" strokeWidth={1} opacity={0.35} fill="none" />
      <TopLeaf x={33} y={23} />
      <TopLeaf x={31} y={23} flip />
    </>
  ),
  lime: (
    <>
      <Citrus body="#84CC16" shade="#4D7C0F" rx={17} ry={17} cy={38} dots="#365314" />
      <TopLeaf x={33} y={21.5} />
    </>
  ),
  lemon: (
    <>
      <path d="M8 37l3.4-2.4v4.8zM56 37l-3.4-2.4v4.8z" fill="#EAB308" />
      <path d="M10.5 37c2-9 11-15 21.5-15s19.5 6 21.5 15c-2 9-11 15-21.5 15S12.5 46 10.5 37z" fill="#FDE047" />
      <path d="M32 22c10.5 0 19.5 6 21.5 15-2 9-11 15-21.5 15 6-3.5 9-9 9-15s-3-11.5-9-15z" fill="#EAB308" opacity={0.5} />
      <Shine cx={22} cy={31} rx={2.4} ry={6} rotate={60} fill="#FEFCE8" />
      <TopLeaf x={32} y={22.5} />
    </>
  ),
  rambutan: (
    <>
      {radial(26, 14.5, 32, 37).map((p, i) => {
        const tip = radial(26, 21, 32, 37, 0.14)[i];
        return (
          <path key={i} d={`M${p.x.toFixed(1)} ${p.y.toFixed(1)}Q${((p.x + tip.x) / 2 + 1).toFixed(1)} ${((p.y + tip.y) / 2 - 1).toFixed(1)} ${tip.x.toFixed(1)} ${tip.y.toFixed(1)}`}
            stroke={i % 3 === 0 ? '#65A30D' : '#B91C1C'} strokeWidth={2} strokeLinecap="round" fill="none" />
        );
      })}
      <circle cx={32} cy={37} r={15.5} fill="#DC2626" />
      <path d="M32 21.5a15.5 15.5 0 0 1 0 31 20 20 0 0 0 0-31z" fill="#991B1B" opacity={0.5} />
      <Shine cx={25.5} cy={31} rx={2.6} ry={5} rotate={-30} fill="#FECACA" />
    </>
  ),
  avocado: (
    <>
      <path d="M32 7c-6 0-9.5 6-11 13-1.4 6.5-6 10-6 20 0 10.5 7.6 19 17 19s17-8.5 17-19c0-10-4.6-13.5-6-20C41.5 13 38 7 32 7z" fill="#166534" />
      <path d="M32 7c-6 0-9.5 6-11 13-1.4 6.5-6 10-6 20 0 10.5 7.6 19 17 19s17-8.5 17-19c0-10-4.6-13.5-6-20C41.5 13 38 7 32 7z" fill="#D9F99D" transform="translate(32 38) scale(.82) translate(-32 -38)" />
      <circle cx={32} cy={43} r={10.5} fill="#ECFCCB" />
      <circle cx={32} cy={43} r={8.5} fill="#92400E" />
      <Shine cx={28.6} cy={39.6} rx={2} ry={3} rotate={-30} fill="#FDE68A" />
    </>
  ),
  pear: (
    <>
      <path d="M32 11c-5 0-7.5 4-8 9-.5 5-4 8-7 13-3.5 6-3 14 2 19.5 3.5 4 8 5.5 13 5.5s9.5-1.5 13-5.5c5-5.5 5.5-13.5 2-19.5-3-5-6.5-8-7-13-.5-5-3-9-8-9z" fill="#A3E635" />
      <path d="M32 11c5 0 7.5 4 8 9 .5 5 4 8 7 13 3.5 6 3 14-2 19.5-3.5 4-8 5.5-13 5.5 5-3 8-9.5 8-17 0-6-2.6-9.5-4-14.6-1.2-4.6-1.6-10.4-4-15.4z" fill="#65A30D" opacity={0.45} />
      <Shine cx={23} cy={38} rx={2.4} ry={6} rotate={10} fill="#F7FEE7" />
      <path d="M32 11.5c0-3 .8-5.4 2.4-7.4" stroke={STEM} strokeWidth={2.2} strokeLinecap="round" fill="none" />
      <TopLeaf x={34} y={6} />
    </>
  ),
  grapes: (
    <>
      <path d="M32 21c0-4 1-7 3-10" stroke={STEM} strokeWidth={2.2} strokeLinecap="round" fill="none" />
      <path d="M35 11.5c5-5 13-5 17 0-3 1-4 3-3 6-3 0-5 1-6 4-3-2-6-4-8-10z" fill={LEAF} />
      <path d="M30 14c-4-1.5-6.5 1.6-4.4 4" stroke={LEAF_DARK} strokeWidth={1.4} strokeLinecap="round" fill="none" />
      {[[20, 28], [32, 27], [44, 28], [26, 38.5], [38, 38.5], [32, 49]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={6.6} fill={i % 2 ? '#6D28D9' : '#7C3AED'} />
          <circle cx={x - 2} cy={y - 2.2} r={1.5} fill="#EDE9FE" opacity={0.7} />
        </g>
      ))}
    </>
  ),
  passion: (
    <>
      <Half skin="#581C87" flesh="#FEF3C7" core="#FACC15" coreR={12.6} />
      {radial(9, 8.4, 32, 35, 0.3).concat(radial(4, 3.4, 32, 35, 1)).map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={2.4} fill="#F59E0B" />
          <circle cx={p.x} cy={p.y} r={1.3} fill={SEED} />
        </g>
      ))}
      <path d="M17 26a19 19 0 0 1 9-8" stroke="#A78BFA" strokeWidth={1.6} strokeLinecap="round" fill="none" />
    </>
  ),
  kiwi: (
    <>
      <Half skin="#7C4A1E" flesh="#84CC16" core="#ECFCCB" coreR={5.8} />
      {radial(14, 10, 32, 35).map((p, i) => (
        <ellipse key={i} cx={p.x} cy={p.y} rx={0.9} ry={2} transform={`rotate(${p.deg + 90} ${p.x} ${p.y})`} fill={SEED} />
      ))}
    </>
  ),
  guava: (
    <>
      <Half skin="#65A30D" flesh="#FDA4AF" core="#FB7185" coreR={9} />
      {radial(8, 5.6, 32, 35, 0.4).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={1.3} fill="#FEF3C7" />)}
      <TopLeaf x={33} y={15.6} />
    </>
  ),
  woodapple: (
    <>
      <circle cx={32} cy={37} r={19} fill="#A16207" />
      <path d="M32 18a19 19 0 0 1 0 38 24 24 0 0 0 0-38z" fill="#713F12" opacity={0.5} />
      {[[24, 30], [34, 26], [40, 34], [28, 40], [37, 45], [22, 45], [30, 51]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.4} fill="#FEF3C7" opacity={0.45} />
      ))}
      <Shine cx={24.5} cy={29} rx={2.8} ry={5} rotate={-30} fill="#FDE68A" />
      <path d="M32 18.5v-4" stroke={STEM} strokeWidth={2.4} strokeLinecap="round" />
    </>
  ),
  pomegranate: (
    <>
      <path d="M26.5 21l1.6-6.4 2.6 3.6L32 12.6l1.3 5.6 2.6-3.6 1.6 6.4z" fill="#9F1239" />
      <circle cx={32} cy={38} r={18.5} fill="#BE123C" />
      <path d="M32 19.5a18.5 18.5 0 0 1 0 37 24 24 0 0 0 0-37z" fill="#881337" opacity={0.5} />
      <Shine cx={24} cy={31} rx={3} ry={6} rotate={-30} fill="#FECDD3" />
    </>
  ),
  strawberry: (
    <>
      <path d="M32 58c-10-6-18-17-18-27 0-6 4.5-9 10-9 3.4 0 6 1 8 2.4 2-1.4 4.6-2.4 8-2.4 5.5 0 10 3 10 9 0 10-8 21-18 27z" fill="#E11D48" />
      <path d="M40 22c5.5 0 10 3 10 9 0 10-8 21-18 27 5-6 9-15 9-23 0-5-.4-9-1-13z" fill="#9F1239" opacity={0.45} />
      {[[22, 31], [30, 30], [38, 31], [45, 32], [26, 38], [34, 38], [42, 39], [29, 45], [37, 46], [33, 52]].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx={0.9} ry={1.5} fill="#FDE68A" />
      ))}
      {[-150, -115, -65, -30].map((deg) => (
        <ellipse key={deg} cx={32} cy={21} rx={8} ry={3} transform={`rotate(${deg + 180} 32 21) translate(6 0)`} fill={LEAF} />
      ))}
      <path d="M32 21v-8" stroke={LEAF_DARK} strokeWidth={2.4} strokeLinecap="round" />
    </>
  ),
  cashew: (
    <>
      <path d="M22 13c3.6-3 16.4-3 20 0 4 4 5 14 2 22-2 6-6 9-12 9s-10-3-12-9c-3-8-2-18 2-22z" fill="#F59E0B" />
      <path d="M19 27c1 4 1.6 6 3 8.6 2 6 6 8.4 10 8.4s8-2.4 10-8.4c1.4-2.6 2-4.6 3-8.6-4 3-8.4 4.4-13 4.4s-9-1.4-13-4.4z" fill="#EA580C" opacity={0.75} />
      <Shine cx={26} cy={21} rx={2.2} ry={5} fill="#FEF3C7" />
      <path d="M26 44.5c-5 1-7 7-4 11.5 3.5 5 12 5 16-1 1.5-2.4 1.6-5 .6-7-1.4 1.6-3.6 2.4-5.8 2-3.4-.6-5.4-3.4-6.8-5.5z" fill="#A68A64" />
      <path d="M32 11V6" stroke={STEM} strokeWidth={2.2} strokeLinecap="round" />
      <TopLeaf x={33} y={7} />
    </>
  ),
  coconut: (
    <>
      <circle cx={32} cy={36} r={20} fill="#7C4A1E" />
      <circle cx={32} cy={36} r={16.6} fill="#FFFBEB" />
      <circle cx={32} cy={36} r={12} fill="#F5F0E1" />
      {radial(16, 18.3, 32, 36).map((p, i) => (
        <path key={i} d={`M${p.x.toFixed(1)} ${p.y.toFixed(1)}l${(Math.cos((p.deg * Math.PI) / 180) * 1.6).toFixed(1)} ${(Math.sin((p.deg * Math.PI) / 180) * 1.6).toFixed(1)}`}
          stroke="#A16207" strokeWidth={1} strokeLinecap="round" />
      ))}
      <Shine cx={26} cy={30} rx={2.4} ry={4} rotate={-30} />
    </>
  ),
  sapling: (
    <>
      <path d="M32 41V17" stroke="#4D7C0F" strokeWidth={3} strokeLinecap="round" />
      <path d="M32 31c-8 0-13-5-14-12 8 0 13 5 14 12z" fill={LEAF_LIGHT} />
      <path d="M32 25c7-1 12-6 12-13-7 1-12 6-12 13z" fill={LEAF} />
      <path d="M32 18c-3.4-.6-5.6-3-6-6.4 3.4.4 5.6 2.6 6 6.4z" fill={LEAF_DARK} />
      <path d="M20 44h24l-3 15H23z" fill="#C2410C" />
      <rect x={17.5} y={39} width={29} height={6.5} rx={2.4} fill="#EA580C" />
      <path d="M23.5 50h17" stroke="#9A3412" strokeWidth={1.2} opacity={0.5} />
    </>
  ),
  basket: (
    <>
      <circle cx={21.5} cy={31} r={7.6} fill="#FB923C" />
      <circle cx={42.5} cy={31.5} r={7} fill="#DC2626" />
      <circle cx={32} cy={27} r={8} fill="#84CC16" />
      <path d="M24 22.6c3.6-7 12.6-9.6 18-6" stroke="#FACC15" strokeWidth={4.4} strokeLinecap="round" fill="none" />
      <path d="M12 36h40l-5 21H17z" fill="#B45309" />
      <path d="M14.5 43h35M16 50h32M24 36l1.5 21M32 36v21M40 36l-1.5 21" stroke="#92400E" strokeWidth={1.3} opacity={0.75} />
      <rect x={10} y={33} width={44} height={5.5} rx={2.75} fill="#D97706" />
    </>
  ),
};

interface FruitIconProps {
  kind: FruitKind;
  size?: number | string;
  title?: string;
  style?: React.CSSProperties;
}

/** Decorative by default; pass `title` when the drawing carries meaning on its own. */
export const FruitIcon: React.FC<FruitIconProps> = ({ kind, size = 56, title, style }) => (
  <svg
    viewBox="0 0 64 64"
    width={size}
    height={size}
    role={title ? 'img' : undefined}
    aria-hidden={title ? undefined : true}
    focusable="false"
    style={{ display: 'block', overflow: 'visible', ...style }}
  >
    {title && <title>{title}</title>}
    {DRAWINGS[kind]}
  </svg>
);

export default FruitIcon;
