import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Plus, Sparkles, ChevronDown, LogOut, Camera } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Section, User } from '../../types';
import Button from '../ui/Button';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface TopbarProps {
  currentSection: Section;
  savedIndicator: boolean;
  showAIAssistant: boolean;
  setShowAIAssistant: (v: boolean) => void;
  setShowNotifications: (v: boolean) => void;
  setShowCommandPalette: (v: boolean) => void;
  onLogout?: () => void;
  user?: User;
}

const Topbar = ({ currentSection, savedIndicator, showAIAssistant, setShowAIAssistant, setShowNotifications, setShowCommandPalette, onLogout, user }: TopbarProps) => {
  const { updateUser } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // BUG 15 FIX: Click-outside handler for user menu
  useEffect(() => {
    if (!showUserMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await usersAPI.uploadAvatar(file);
      updateUser(res.data.user);
      setShowUserMenu(false);
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <header className="h-[58px] bg-white border-b border-gray-200 sticky top-0 z-40 px-8 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <h2 className="text-sm font-bold text-gray-900 border-r pr-6 border-gray-100">{currentSection.toUpperCase()}</h2>
        <button className="relative group" onClick={() => setShowCommandPalette(true)}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <div className="pl-8 py-1.5 text-xs w-64 bg-gray-50 rounded-lg text-left text-gray-400 cursor-pointer hover:bg-gray-100 transition-colors">
            Search anything... (/)
          </div>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <AnimatePresence>
          {savedIndicator && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded"
            >
              SAVED ✓
            </motion.div>
          )}
        </AnimatePresence>
        <Button variant="ghost" size="sm" className="relative" onClick={() => setShowNotifications(true)}>
          <Bell size={18} />
          <div className="absolute top-2 right-2 w-2 h-2 bg-brand-accent rounded-full border-2 border-white" />
        </Button>
        <Button size="sm" className="gap-2" onClick={() => setShowCommandPalette(true)}>
          <Plus size={16} /> Quick Add
        </Button>
        <div className="w-[1px] h-4 bg-gray-200 mx-2" />
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-2 text-brand-accent hover:bg-red-50", showAIAssistant && "bg-red-50")}
          onClick={() => setShowAIAssistant(!showAIAssistant)}
        >
          <Sparkles size={18} className={cn(showAIAssistant && "animate-pulse")} />
          <span className="hidden md:inline text-[10px] font-bold uppercase tracking-widest">AI Companion</span>
        </Button>
        <div className="w-[1px] h-4 bg-gray-200 mx-2" />
        <div className="relative" ref={menuRef}>
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-1 hover:bg-gray-100 p-1 px-2 rounded-lg transition-colors">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: user?.avatarColor || '#ccc' }}
              >
                {user?.name?.charAt(0) || '?'}
              </div>
            )}
            <ChevronDown size={14} className="text-gray-400" />
          </button>
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-900 truncate">{user?.name}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">{user?.role}</p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Camera size={14} /> {uploading ? 'Uploading...' : 'Update profile picture'}
              </button>
              <button onClick={() => { setShowUserMenu(false); onLogout?.(); }} className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>
      </div>
    </header>
  );
};

export default Topbar;
