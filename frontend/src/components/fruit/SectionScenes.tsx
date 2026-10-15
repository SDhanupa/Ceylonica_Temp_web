import React from 'react';
import type { SectionId } from './fruitBusinessTypes';

const SKY = '#DDF1F8';
const SUN = '#FDE68A';
const WOOD = '#C26A1B';
const WOOD_DARK = '#9A4F10';

const Tree: React.FC<{ x: number; base: number; scale?: number }> = ({ x, base, scale = 1 }) => (
  <g transform={`translate(${x} ${base}) scale(${scale})`}>
    <rect x={-3.5} y={-30} width={7} height={30} rx={2} fill="#7C4A1E" />
    <circle cx={-12} cy={-38} r={16} fill="#15803D" />
    <circle cx={12} cy={-40} r={17} fill="#16A34A" />
    <circle cx={0} cy={-54} r={18} fill="#22A355" />
    {[[-16, -40], [-4, -58], [10, -48], [16, -34], [-6, -34], [4, -42], [-14, -54]].map(([fx, fy], i) => (
      <circle key={i} cx={fx} cy={fy} r={3.6} fill={i % 3 === 0 ? '#FACC15' : '#FB923C'} />
    ))}
  </g>
);

const Crate: React.FC<{ x: number; y: number; w?: number; fruit?: string[] }> = ({ x, y, w = 62, fruit }) => (
  <g transform={`translate(${x} ${y})`}>
    {fruit?.map((c, i) => (
      <circle key={i} cx={8 + i * ((w - 16) / Math.max(fruit.length - 1, 1))} cy={-2} r={7} fill={c} />
    ))}
    <rect x={0} y={0} width={w} height={30} rx={3} fill={WOOD} />
    <path d={`M0 10H${w}M0 20H${w}`} stroke={WOOD_DARK} strokeWidth={2} />
    <rect x={4} y={3} width={5} height={24} rx={1.5} fill={WOOD_DARK} opacity={0.6} />
    <rect x={w - 9} y={3} width={5} height={24} rx={1.5} fill={WOOD_DARK} opacity={0.6} />
  </g>
);

const Bottle: React.FC<{ x: number; y: number; fill: string }> = ({ x, y, fill }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-2.5} y={-30} width={5} height={5} rx={1} fill="#334155" />
    <path d="M-3 -25h6v5c3.5 1.5 5 4 5 7.5V0h-16v-12.5c0-3.5 1.5-6 5-7.5z" fill={fill} />
    <rect x={-6} y={-10} width={12} height={6} rx={1} fill="#FFFFFF" opacity={0.85} />
  </g>
);

const Jar: React.FC<{ x: number; y: number; fill: string }> = ({ x, y, fill }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-9} y={-24} width={18} height={6} rx={2} fill="#B91C1C" />
    <rect x={-10} y={-19} width={20} height={19} rx={4} fill={fill} />
    <rect x={-7} y={-13} width={14} height={7} rx={1.5} fill="#FFFBEB" opacity={0.9} />
  </g>
);

const Cup: React.FC<{ x: number; y: number; fill: string }> = ({ x, y, fill }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M3 -30l4 -10" stroke="#F43F5E" strokeWidth={2} strokeLinecap="round" />
    <path d="M-8 -30h16l-2.5 30h-11z" fill="#FFFFFF" opacity={0.9} />
    <path d="M-7.2 -24h14.4l-2 24h-10.4z" fill={fill} />
  </g>
);

const Wheel: React.FC<{ x: number; y: number; r?: number }> = ({ x, y, r = 9 }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="#1F2937" />
    <circle cx={x} cy={y} r={r * 0.42} fill="#CBD5E1" />
  </g>
);

const SCENES: Record<SectionId, React.ReactNode> = {
  cultivation: (
    <>
      <defs>
        <linearGradient id="farm-scene-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EBF6E8" />
          <stop offset="100%" stopColor="#D8EFD4" />
        </linearGradient>
      </defs>
      <rect width={360} height={160} fill="url(#farm-scene-bg)" />
      <image
        href="/Farm.png"
        x={30}
        y={-10}
        width={300}
        height={180}
        preserveAspectRatio="xMidYMid meet"
      />
    </>
  ),
  postharvest: (
    <>
      <rect width={360} height={160} fill="#EEF6EA" />
      <rect y={118} width={360} height={42} fill="#D6D3C4" />
      <rect x={18} y={26} width={124} height={62} rx={6} fill="#FFFFFF" />
      <path d="M18 46h124M60 26v62M100 26v62" stroke="#DCE9D6" strokeWidth={2} />
      <Crate x={24} y={118 - 30} fruit={['#FB923C', '#FACC15', '#FB923C', '#FACC15']} />
      <Crate x={24} y={118 - 62} fruit={['#84CC16', '#65A30D', '#84CC16']} />
      <Crate x={94} y={118 - 30} fruit={['#DC2626', '#F43F5E', '#DC2626', '#F43F5E']} />
      <g>
        <rect x={170} y={84} width={112} height={8} rx={3} fill="#64748B" />
        <rect x={178} y={92} width={6} height={26} fill="#64748B" />
        <rect x={268} y={92} width={6} height={26} fill="#64748B" />
        {['#FFB020', '#F97316', '#FFB020', '#FACC15', '#F97316', '#FFB020'].map((c, i) => (
          <ellipse key={i} cx={184 + i * 17} cy={76} rx={8} ry={8.5} fill={c} />
        ))}
      </g>
      <g transform="translate(300 64)">
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${(i % 2) * 22} ${i * 18})`}>
            <rect x={0} y={0} width={20} height={26} rx={3} fill={i === 1 ? '#FDE68A' : '#BBF7D0'} />
            <circle cx={10} cy={13} r={4} fill="#7C4A1E" />
          </g>
        ))}
      </g>
    </>
  ),
  processing: (
    <>
      <rect width={360} height={160} fill="#E6F2F8" />
      <rect y={124} width={360} height={36} fill="#CBD5E1" />
      <g>
        <ellipse cx={56} cy={34} rx={30} ry={10} fill="#E2E8F0" />
        <rect x={26} y={34} width={60} height={68} fill="#CBD5E1" />
        <rect x={34} y={40} width={8} height={56} rx={4} fill="#F8FAFC" opacity={0.85} />
        <ellipse cx={56} cy={102} rx={30} ry={8} fill="#94A3B8" />
        <rect x={32} y={104} width={6} height={20} fill="#64748B" />
        <rect x={74} y={104} width={6} height={20} fill="#64748B" />
        <circle cx={56} cy={66} r={7} fill="#FB923C" />
        <path d="M86 70h26v20" stroke="#94A3B8" strokeWidth={6} fill="none" strokeLinejoin="round" />
      </g>
      <rect x={100} y={108} width={130} height={9} rx={4.5} fill="#475569" />
      {Array.from({ length: 6 }, (_, i) => <circle key={i} cx={108 + i * 23} cy={112.5} r={2.6} fill="#94A3B8" />)}
      {['#F97316', '#FACC15', '#EA580C', '#F59E0B'].map((c, i) => <Bottle key={i} x={124 + i * 28} y={108} fill={c} />)}
      <rect x={244} y={56} width={104} height={6} rx={2} fill="#94A3B8" />
      <rect x={244} y={100} width={104} height={6} rx={2} fill="#94A3B8" />
      {['#DC2626', '#F97316', '#FACC15', '#65A30D'].map((c, i) => <Jar key={i} x={258 + i * 26} y={56} fill={c} />)}
      {['#F97316', '#BE123C', '#65A30D', '#F59E0B'].map((c, i) => <Jar key={i} x={258 + i * 26} y={100} fill={c} />)}
    </>
  ),
  trade: (
    <>
      <rect width={360} height={160} fill={SKY} />
      <rect x={250} y={22} width={30} height={70} fill="#C7DDE8" />
      <rect x={284} y={8} width={40} height={84} fill="#B6D2E0" />
      <rect y={128} width={360} height={32} fill="#94A3B8" />
      <path d="M0 144h360" stroke="#F8FAFC" strokeWidth={3} strokeDasharray="16 12" />
      <g>
        <rect x={20} y={56} width={6} height={72} fill="#7C4A1E" />
        <rect x={150} y={56} width={6} height={72} fill="#7C4A1E" />
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d={`M${12 + i * 19} 40h19v20a9.5 9.5 0 0 1-19 0z`} fill={i % 2 ? '#FFFFFF' : '#DC2626'} />
        ))}
        <rect x={10} y={30} width={152} height={12} rx={3} fill="#B91C1C" />
        <rect x={16} y={100} width={146} height={28} rx={3} fill={WOOD} />
        {['#FB923C', '#FACC15', '#84CC16', '#DC2626', '#FB923C', '#FACC15', '#84CC16'].map((c, i) => (
          <g key={i}>
            <circle cx={30 + i * 20} cy={94} r={8} fill={c} />
            <circle cx={40 + i * 20} cy={86} r={i < 6 ? 7 : 0} fill={['#F59E0B', '#22C55E', '#EA580C'][i % 3]} />
          </g>
        ))}
      </g>
      <g>
        <rect x={196} y={66} width={96} height={52} rx={4} fill="#F59E0B" />
        <path d="M292 80h26l18 18v20h-44z" fill="#FB923C" />
        <path d="M298 86h17l11 12h-28z" fill="#E0F2FE" />
        <rect x={204} y={76} width={58} height={20} rx={3} fill="#FFFBEB" opacity={0.9} />
        <circle cx={218} cy={86} r={5} fill="#16A34A" />
        <circle cx={233} cy={86} r={5} fill="#FB923C" />
        <circle cx={248} cy={86} r={5} fill="#DC2626" />
        <Wheel x={224} y={120} />
        <Wheel x={312} y={120} />
      </g>
    </>
  ),
  services: (
    <>
      <rect width={360} height={160} fill="#FDF2F8" />
      <rect y={126} width={360} height={34} fill="#E7E5E4" />
      <g>
        <path d="M14 46l14-22h140l14 22z" fill="#15803D" />
        <path d="M14 46h168v8H14z" fill="#166534" />
        <rect x={26} y={54} width={6} height={42} fill="#7C4A1E" />
        <rect x={164} y={54} width={6} height={42} fill="#7C4A1E" />
        <rect x={52} y={62} width={92} height={20} rx={4} fill="#FFFBEB" />
        <path d="M66 72h64" stroke="#15803D" strokeWidth={4} strokeLinecap="round" />
        <rect x={16} y={96} width={164} height={30} rx={4} fill={WOOD} />
        {['#F97316', '#F472B6', '#84CC16', '#FACC15'].map((c, i) => <Cup key={i} x={52 + i * 32} y={96} fill={c} />)}
      </g>
      <g>
        <path d="M270 34c-40 0-62 18-62 22h124c0-4-22-22-62-22z" fill="#F472B6" />
        <path d="M250 37l-12 19M290 37l12 19M270 34v22" stroke="#FFFFFF" strokeWidth={6} />
        <rect x={268} y={56} width={4} height={30} fill="#64748B" />
        <rect x={222} y={86} width={96} height={30} rx={6} fill="#38BDF8" />
        <rect x={232} y={92} width={76} height={14} rx={3} fill="#FFFFFF" opacity={0.9} />
        {['#F9A8D4', '#FDE68A', '#86EFAC'].map((c, i) => (
          <g key={i} transform={`translate(${252 + i * 18} 104)`}>
            <path d="M-4 0l4 9 4-9z" fill="#D97706" />
            <circle cx={0} cy={-2} r={4.6} fill={c} />
          </g>
        ))}
        <Wheel x={244} y={122} r={8} />
        <Wheel x={300} y={122} r={8} />
        <path d="M318 96h14" stroke="#64748B" strokeWidth={4} strokeLinecap="round" />
      </g>
    </>
  ),
};

export const SectionScene: React.FC<{ id: SectionId; title?: string }> = ({ id, title }) => (
  <svg
    viewBox="0 0 360 160"
    preserveAspectRatio="xMidYMid slice"
    width="100%"
    height="100%"
    role={title ? 'img' : undefined}
    aria-hidden={title ? undefined : true}
    focusable="false"
    style={{ display: 'block' }}
  >
    {title && <title>{title}</title>}
    {SCENES[id]}
  </svg>
);

export default SectionScene;
