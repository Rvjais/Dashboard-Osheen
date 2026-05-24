import { motion } from 'framer-motion';
import { Info, CheckCircle2 } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';

interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: 'success' | 'info' | 'error';
}

export default function AlertDialog({ open, onClose, title, message, variant = 'info' }: AlertDialogProps) {
  const iconMap = {
    success: { Icon: CheckCircle2, bg: 'bg-emerald-50', color: 'text-emerald-500' },
    info: { Icon: Info, bg: 'bg-blue-50', color: 'text-blue-500' },
    error: { Icon: Info, bg: 'bg-red-50', color: 'text-red-500' },
  };
  const { Icon, bg, color } = iconMap[variant];

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col items-center text-center space-y-4">
        <div className={`w-16 h-16 rounded-2xl ${bg} ${color} flex items-center justify-center`}>
          <Icon size={32} />
        </div>
        <div>
          <h3 className="text-xl font-display font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-2 whitespace-pre-wrap">{message}</p>
        </div>
        <div className="pt-4 w-full">
          <Button className="w-full rounded-xl py-3" onClick={onClose}>OK</Button>
        </div>
      </div>
    </Modal>
  );
}
