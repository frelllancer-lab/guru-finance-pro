import React from 'react';
import { Sparkles } from 'lucide-react';

interface AiLoaderProps {
  isOpen: boolean;
  title: string;
  subtitle: string;
}

export const AiLoader: React.FC<AiLoaderProps> = ({ isOpen, title, subtitle }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white px-6 text-center space-y-4">
      <div
        className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-2xl"
        style={{
          background: 'var(--accent)',
          animation: 'pulseGlow 1.5s infinite alternate',
        }}
      >
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <div>
        <h3 className="text-base font-bold mb-1">{title || 'ИИ анализирует данные...'}</h3>
        <p className="text-xs text-zinc-300 font-medium">{subtitle || 'Обрабатываем информацию'}</p>
      </div>
    </div>
  );
};
