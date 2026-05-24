import { useState } from 'react';
import Button from './Button';
import Modal from './Modal';

interface PromptDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
}

export default function PromptDialog({
  open, onClose, onSubmit, title, message, defaultValue = '', placeholder = ''
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
      setValue('');
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        {message && <p className="text-sm text-gray-500">{message}</p>}
        <input
          autoFocus
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ring-brand-accent/20 focus:outline-none transition-all"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        />
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={!value.trim()}>Submit</Button>
        </div>
      </div>
    </Modal>
  );
}
