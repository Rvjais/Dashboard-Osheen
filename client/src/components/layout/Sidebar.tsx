import { motion } from 'framer-motion';
import { Home, Table, Calendar, FileText, BarChart2, Grid, Users, LogOut, MessageSquare, Target } from 'lucide-react';
import { cn, formatBytes } from '../../lib/utils';
import { Section, Role, User } from '../../types';

interface SidebarProps {
  currentSection: Section;
  setCurrentSection: (section: Section) => void;
  session: { user: User };
  storageUsed: number;
  handleLogout: () => void;
}

const NAV_ITEMS = [
  { id: Section.HOME, label: 'Home', icon: Home },
  { id: Section.TRACKER, label: 'Tracker', icon: Table },
  { id: Section.KRAS, label: "KRA's", icon: Target },
  { id: Section.CALENDAR, label: 'Calendar', icon: Calendar },
  { id: Section.MESSAGES, label: 'Messages', icon: MessageSquare },
  { id: Section.MEETINGS, label: 'Meetings', icon: FileText },
  { id: Section.REPORTS, label: 'Reports', icon: BarChart2 },
  { id: Section.TOOLS, label: 'Tools', icon: Grid },
];

const Sidebar = ({ currentSection, setCurrentSection, session, storageUsed, handleLogout }: SidebarProps) => {
  const items = [
    ...NAV_ITEMS,
    ...(session.user.role === Role.ADMIN ? [{ id: Section.TEAM, label: 'Team Panel', icon: Users }] : []),
  ];

  return (
    <aside className="w-[18rem] bg-brand-sidebar text-white fixed h-full flex flex-col z-50">
      <div className="p-8 border-b border-white/5">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          Task Studio <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
        </h2>
      </div>

      <nav className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => setCurrentSection(item.id)}
            className={cn("sidebar-item", currentSection === item.id && "sidebar-item-active")}
          >
            <item.icon size={18} />
            <span className="text-xl font-sapphire tracking-wide">{item.label}</span>
            {currentSection === item.id && <motion.div layoutId="active-pill" className="ml-auto w-1 h-4 bg-brand-accent rounded-full" />}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-4">
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

        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group">
          {session.user.avatar ? (
            <img src={session.user.avatar} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white uppercase text-lg shadow-inner shrink-0"
              style={{ backgroundColor: session.user.avatarColor }}
            >
              {session.user.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-white truncate">{session.user.name}</p>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">{session.user.role}</p>
          </div>
          <button onClick={handleLogout} className="text-gray-600 group-hover:text-red-400 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
