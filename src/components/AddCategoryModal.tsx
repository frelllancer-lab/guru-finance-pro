import React from 'react';
import { X } from 'lucide-react';
import { Category, TransactionType } from '../types';
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from '../data/categories';
import { renderCategoryIcon } from './TransactionsList';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCategory: (type: TransactionType, category: Category) => void;
  currentType: TransactionType;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onAddCategory,
  currentType,
}) => {
  const [name, setName] = React.useState('');
  const [icon, setIcon] = React.useState(AVAILABLE_ICONS[0].name);
  const [color, setColor] = React.useState(AVAILABLE_COLORS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCategory: Category = {
      id: 'custom_' + Date.now(),
      name: name.trim(),
      icon,
      color,
    };

    onAddCategory(currentType, newCategory);

    setName('');
    setIcon(AVAILABLE_ICONS[0].name);
    setColor(AVAILABLE_COLORS[0]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="surface w-full sm:max-w-sm rounded-t-4xl sm:rounded-4xl p-6 space-y-4 modal-enter max-h-[92dvh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center border-b pb-3 border-hair">
          <h3 className="font-display font-bold text-base">Новая категория ({currentType === 'expense' ? 'Расход' : 'Доход'})</h3>
          <button onClick={onClose} className="txt-sub font-bold text-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider txt-sub mb-1">
              Название
            </label>
            <input
              type="text"
              placeholder="Например: Питомцы"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full surface-soft rounded-2xl p-3 text-sm font-semibold outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider txt-sub mb-1">
              Иконка
            </label>
            <div className="grid grid-cols-6 gap-2 text-center max-h-32 overflow-y-auto no-scrollbar p-1">
              {AVAILABLE_ICONS.map((item) => {
                const isSel = icon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIcon(item.name)}
                    className={`p-2 rounded-xl flex items-center justify-center text-lg transition ${
                      isSel ? 'text-white' : 'surface-soft txt-sub'
                    }`}
                    style={isSel ? { background: 'var(--accent)' } : undefined}
                  >
                    {renderCategoryIcon(item.name, 'w-5 h-5')}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider txt-sub mb-1">
              Цвет
            </label>
            <div className="flex flex-wrap gap-2 px-1">
              {AVAILABLE_COLORS.map((c) => {
                const isSel = color === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full ${c} ${isSel ? 'ring-4 ring-offset-2' : ''}`}
                    style={isSel ? { ringColor: 'var(--accent)' } : undefined}
                  ></button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 text-white font-bold rounded-2xl text-sm active:scale-98 transition btn-primary"
          >
            Создать категорию
          </button>
        </form>
      </div>
    </div>
  );
};
