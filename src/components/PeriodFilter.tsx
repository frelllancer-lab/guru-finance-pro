import React from 'react';
import { Period } from '../types';
import { Language, translations } from '../i18n/translations';

interface PeriodFilterProps {
  selectedPeriod: Period;
  onSelectPeriod: (period: Period) => void;
  currentLanguage?: Language;
}

export const PeriodFilter: React.FC<PeriodFilterProps> = ({
  selectedPeriod,
  onSelectPeriod,
  currentLanguage = 'uk',
}) => {
  const t = translations[currentLanguage] || translations.uk;

  const periods: { id: Period; label: string }[] = [
    { id: 'day', label: t.periodDay },
    { id: 'week', label: t.periodWeek },
    { id: 'month', label: t.periodMonth },
    { id: 'year', label: t.periodYear },
    { id: 'all', label: t.periodAll },
  ];

  return (
    <div className="surface p-1 rounded-2xl flex items-center justify-between text-[11px] sm:text-xs font-bold overflow-x-auto no-scrollbar">
      {periods.map((p) => {
        const isActive = p.id === selectedPeriod;
        return (
          <button
            key={p.id}
            onClick={() => onSelectPeriod(p.id)}
            className={`flex-1 py-1.5 px-2 rounded-xl transition-all whitespace-nowrap ${
              isActive ? 'chip-active shadow-sm' : 'txt-sub hover:text-current'
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
};

