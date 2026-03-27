import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { I18N } from '../constants';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmLabel: string;
  cancelLabel: string;
  type?: 'danger' | 'info';
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  onConfirm, 
  confirmLabel, 
  cancelLabel,
  type = 'info'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4 backdrop-blur-sm bg-black/70 animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-2xl p-7 max-w-md w-full shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-250">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            {type === 'danger' && <AlertTriangle className="text-red-400" size={24} />}
            <h3 className="text-lg font-bold">{title}</h3>
          </div>
          <button className="text-text-muted hover:text-white transition-colors cursor-pointer" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <p className="text-sm text-text-muted mb-6 leading-relaxed">{description}</p>
        
        <div className="flex justify-end gap-3">
          <button className="btn btn-ghost py-2 text-xs" onClick={onClose}>
            {cancelLabel}
          </button>
          <button className={`btn py-2 text-xs ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
