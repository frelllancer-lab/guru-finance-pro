import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Transaction, Category, Currency } from '../types';
import { convertAmount, formatCurrency } from '../utils/currency';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ExpenseChartProps {
  transactions: Transaction[];
  categories: Category[];
  currency: Currency;
  exchangeRate: number;
  periodText: string;
  isDark: boolean;
}

const defaultColorMap: Record<string, string> = {
  food: '#F97316',
  transport: '#3B82F6',
  shopping: '#A855F7',
  home: '#6366F1',
  fun: '#EC4899',
  health: '#EF4444',
  services: '#14B8A6',
  cash: '#EAB308',
  other: '#6B7280',
};

const tailwindToHex: Record<string, string> = {
  'bg-red-500': '#EF4444',
  'bg-orange-500': '#F97316',
  'bg-amber-500': '#F59E0B',
  'bg-green-500': '#22C55E',
  'bg-emerald-500': '#10B981',
  'bg-teal-500': '#14B8A6',
  'bg-cyan-500': '#06B6D4',
  'bg-blue-500': '#3B82F6',
  'bg-indigo-500': '#6366F1',
  'bg-purple-500': '#A855F7',
  'bg-pink-500': '#EC4899',
  'bg-rose-500': '#F43F5E',
  'bg-gray-500': '#6B7280',
  'bg-slate-500': '#64748B',
  'bg-blue-600': '#2563EB',
  'bg-yellow-500': '#EAB308',
};

export const ExpenseChart: React.FC<ExpenseChartProps> = ({
  transactions,
  categories,
  currency,
  exchangeRate,
  periodText,
  isDark,
}) => {
  const expenseTxs = React.useMemo(() => {
    return transactions.filter((t) => t.type === 'expense');
  }, [transactions]);

  const chartData = React.useMemo(() => {
    const categoryTotals: Record<string, number> = {};

    expenseTxs.forEach((t) => {
      const origCurr = t.currency || 'UAH';
      const converted = convertAmount(t.amount, origCurr, currency, exchangeRate);
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + converted;
    });

    const labels: string[] = [];
    const data: number[] = [];
    const backgroundColors: string[] = [];

    Object.keys(categoryTotals).forEach((catId) => {
      const catObj = categories.find((c) => c.id === catId);
      labels.push(catObj ? catObj.name : catId);
      data.push(categoryTotals[catId]);

      if (catObj && catObj.color && tailwindToHex[catObj.color]) {
        backgroundColors.push(tailwindToHex[catObj.color]);
      } else {
        backgroundColors.push(defaultColorMap[catId] || '#3D6BFF');
      }
    });

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    };
  }, [expenseTxs, categories, currency, exchangeRate]);

  const options = React.useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right' as const,
          labels: {
            color: isDark ? '#F5F6FA' : '#12141C',
            font: { family: 'Inter', size: 11, weight: 'bold' as const },
            boxWidth: 12,
            padding: 10,
          },
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const val = context.raw || 0;
              return ` ${context.label}: ${formatCurrency(val, currency, 2)}`;
            },
          },
        },
      },
      cutout: '72%',
    };
  }, [isDark, currency]);

  return (
    <div className="surface rounded-4xl p-5 space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="font-display font-bold text-base tracking-tight">Структура расходов</h2>
        <span className="text-xs txt-sub font-medium">{periodText}</span>
      </div>

      <div className="relative h-48 w-full flex items-center justify-center">
        {expenseTxs.length === 0 ? (
          <div className="text-center text-xs txt-sub font-medium px-4">
            Нет расходов <br />
            <span className="text-[10px] opacity-70">За выбранный период нет записей</span>
          </div>
        ) : (
          <Doughnut data={chartData} options={options} />
        )}
      </div>
    </div>
  );
};
