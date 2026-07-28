import React from 'react';
import { UploadCloud, Sparkles, FileText, Image, PenLine } from 'lucide-react';

interface AiActionsProps {
  onUploadFiles: () => void;
  onAddManual?: () => void;
}

export const AiActions: React.FC<AiActionsProps> = ({ onUploadFiles, onAddManual }) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={onAddManual}
        className="surface rounded-3xl p-4 sm:p-5 flex flex-col items-center gap-2.5 group active:scale-[0.99] transition hover:border-green-500/40 relative overflow-hidden text-center"
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition group-hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: '#ffffff',
          }}
        >
          <PenLine className="w-6 h-6" />
        </div>
        <div>
          <span className="font-display font-black text-sm sm:text-base tracking-tight block">
            Ввести вручную
          </span>
          <p className="text-[11px] sm:text-xs txt-sub font-medium mt-0.5">
            Без чека и выписки
          </p>
        </div>
      </button>

      <button
        onClick={onUploadFiles}
        className="surface rounded-3xl p-4 sm:p-5 flex flex-col items-center gap-2.5 group active:scale-[0.99] transition hover:border-blue-500/40 relative overflow-hidden text-center"
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition group-hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            color: '#ffffff',
          }}
        >
          <UploadCloud className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2 justify-center">
            <span className="font-display font-black text-sm sm:text-base tracking-tight">
              Загрузить выписки
            </span>
            <span className="pro-chip text-[9px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0">
              <Sparkles className="w-2.5 h-2.5" /> ИИ
            </span>
          </div>
          <p className="text-[11px] sm:text-xs txt-sub font-medium mt-0.5 flex items-center gap-1.5 justify-center">
            <FileText className="w-3 h-3" /> PDF
            <span>•</span>
            <Image className="w-3 h-3" /> Скриншоты
          </p>
        </div>
      </button>
    </div>
  );
};

