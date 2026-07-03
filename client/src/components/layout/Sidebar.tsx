import { motion, AnimatePresence } from 'framer-motion';
import { Home, Table, Calendar, FileText, BarChart2, Grid, Users, LogOut, MessageSquare, Target, Menu, AlertTriangle } from 'lucide-react';
import { cn, formatBytes } from '../../lib/utils';
import { Section, Role, User } from '../../types';

interface SidebarProps {
  currentSection: Section;
  setCurrentSection: (section: Section) => void;
  session: { user: User };
  storageUsed: number;
  handleLogout: () => void;
  isMinimized?: boolean;
  toggleMinimize?: () => void;
}

const NAV_ITEMS = [
  { id: Section.HOME, label: 'Home', icon: Home },
  { id: Section.TRACKER, label: 'Tracker', icon: Table },
  { id: Section.INCOMPLETE_TASKS, label: 'Incomplete', icon: AlertTriangle },
  { id: Section.KRAS, label: "KRA's", icon: Target },
  { id: Section.CALENDAR, label: 'Calendar', icon: Calendar },
  { id: Section.MESSAGES, label: 'Messages', icon: MessageSquare },
  { id: Section.MEETINGS, label: 'Meetings', icon: FileText },
  { id: Section.REPORTS, label: 'Reports', icon: BarChart2 },
  { id: Section.TOOLS, label: 'Tools', icon: Grid },
];

const Sidebar = ({ currentSection, setCurrentSection, session, storageUsed, handleLogout, isMinimized = false, toggleMinimize }: SidebarProps) => {
  const items = [
    ...NAV_ITEMS,
    ...(session.user.role === Role.ADMIN ? [{ id: Section.TEAM, label: 'Team Panel', icon: Users }] : []),
  ];

  return (
    <aside className={cn("bg-brand-sidebar text-white fixed h-full flex flex-col z-50 transition-all duration-300", isMinimized ? "w-[5rem]" : "w-[18rem]")}>
      <div className={cn("p-8 border-b border-white/5 flex items-center", isMinimized ? "justify-center px-0 py-8" : "justify-between")}>
        {!isMinimized && (
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            Task Studio <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
          </h2>
        )}
        <button onClick={toggleMinimize} className="text-gray-400 hover:text-white transition-colors">
          <Menu size={24} />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => setCurrentSection(item.id)}
            className={cn("sidebar-item relative", currentSection === item.id && "sidebar-item-active", isMinimized && "justify-center px-0")}
            title={isMinimized ? item.label : undefined}
          >
            <item.icon size={20} className={cn(isMinimized && "mx-auto")} />
            {!isMinimized && <span className="text-xl font-sapphire tracking-wide">{item.label}</span>}
            {currentSection === item.id && <motion.div layoutId="active-pill" className={cn("bg-brand-accent rounded-full", isMinimized ? "absolute left-0 w-1 h-full" : "ml-auto w-1 h-4")} />}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-4">
        {!isMinimized && (
          <div className="px-4 space-y-2">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-gray-500 tracking-wider">
              <span>Storage Used</span>
              <span>{formatBytes(storageUsed)}</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className={cn("h-full transition-all duration-1000", (storageUsed / (50 * 1024 * 1024)) > 0.9 ? 'bg-red-500' : (storageUsed / (50 * 1024 * 1024)) > 0.7 ? 'bg-amber-500' : 'bg-brand-accent')}
                style={{ width: `${Math.min(100, (storageUsed / (50 * 1024 * 1024)) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className={cn("flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group", isMinimized && "justify-center p-2")}>
          {session.user.avatar ? (
            <img src={session.user.avatar} alt="" className={cn("rounded-xl object-cover shrink-0", isMinimized ? "w-8 h-8" : "w-10 h-10")} />
          ) : (
            <div
              className={cn("rounded-xl flex items-center justify-center font-bold text-white uppercase shadow-inner shrink-0", isMinimized ? "w-8 h-8 text-sm" : "w-10 h-10 text-lg")}
              style={{ backgroundColor: session.user.avatarColor }}
              title={isMinimized ? session.user.name : undefined}
            >
              {session.user.name.charAt(0)}
            </div>
          )}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{session.user.name}</p>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">{session.user.role}</p>
              </div>
              <button onClick={handleLogout} className="text-gray-600 group-hover:text-red-400 transition-colors">
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
        
        {isMinimized && (
           <button onClick={handleLogout} className="w-full flex justify-center p-2 text-gray-600 hover:text-red-400 transition-colors" title="Logout">
              <LogOut size={20} />
           </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
