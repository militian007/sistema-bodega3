import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  color?: 'cyan' | 'magenta' | 'green' | 'yellow' | 'red' | 'purple';
  icon?: ReactNode;
}

const COLOR_MAP = {
  cyan: 'text-neon-cyan border-neon-cyan/40',
  magenta: 'text-neon-magenta border-neon-magenta/40',
  green: 'text-neon-green border-neon-green/40',
  yellow: 'text-neon-yellow border-neon-yellow/40',
  red: 'text-neon-red border-neon-red/40',
  purple: 'text-neon-purple border-neon-purple/40',
};

export default function StatCard({ label, value, sub, color = 'cyan', icon }: StatCardProps) {
  return (
    <div className={`neon-card border ${COLOR_MAP[color]} p-4 relative overflow-hidden`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400">{label}</p>
          <p className={`mt-2 font-display text-2xl ${COLOR_MAP[color].split(' ')[0]}`}>
            {value}
          </p>
          {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
        </div>
        {icon && <div className={`p-2 rounded ${COLOR_MAP[color].split(' ')[0]} opacity-70`}>{icon}</div>}
      </div>
      <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-current opacity-[0.04]" />
    </div>
  );
}
