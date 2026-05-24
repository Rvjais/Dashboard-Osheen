import { motion } from 'framer-motion';
import { Trash2, AlertCircle } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'info';
}

export default function ConfirmDialog({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  variant = 'danger'
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col items-center text-center space-y-4">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
          variant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
        }`}>
          {variant === 'danger' ? <Trash2 size={32} /> : <AlertCircle size={32} />}
        </div>
        <div>
          <h3 className="text-xl font-display font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-2">{message}</p>
        </div>
        <div className="flex gap-3 w-full pt-4">
          <Button variant="secondary" className="flex-1 rounded-xl py-3" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            className={`flex-1 rounded-xl py-3 shadow-lg font-bold ${
              variant === 'danger'
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20 text-white'
                : 'bg-brand-accent hover:bg-red-600 shadow-brand-accent/20 text-white'
            }`}
            onClick={() => { onConfirm(); onClose(); }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
