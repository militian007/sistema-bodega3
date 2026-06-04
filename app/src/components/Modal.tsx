import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
}

export default function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm">
      <div
        className={`neon-card neon-border w-full ${sizes[size]} max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-ink-700">
          <h2 className="font-display text-base text-neon-cyan tracking-wider">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-neon-red transition">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-ink-700 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
