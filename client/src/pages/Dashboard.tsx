import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { usersAPI, trackerAPI, tasksAPI, meetingsAPI, contentAPI } from '../services/api';

import { Role, Section, User } from '../types';
import { INITIAL_TOOLS, getDailyBrief } from '../constants';
import { cn, calculateStorageSize } from '../lib/utils';
import ConfirmDialog from "../components/ui/ConfirmDialog";
import AlertDialog from "../components/ui/AlertDialog";
import AIAssistant from "../components/AIAssistant";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import AppFooter from "../components/layout/AppFooter";
import FocusModeOverlay from "../components/layout/FocusModeOverlay";
import NotificationsPanel from "../components/layout/NotificationsPanel";
import CommandPalette from "../components/layout/CommandPalette";
import HomeSection from "../components/sections/HomeSection";
import TrackerSection from "../components/sections/TrackerSection";
import BrainDumpSection from "../components/sections/BrainDumpSection";
import ReportsSection from "../components/sections/ReportsSection";
import CalendarSection from "../components/sections/CalendarSection";
import TeamSection from "../components/sections/TeamSection";
import MeetingsSection from "../components/sections/MeetingsSection";
import ToolsSection from "../components/sections/ToolsSection";
import MessagesSection from "../components/sections/MessagesSection";

export default function Dashboard() {
  // --- States ---
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  
  const [currentSection, setCurrentSection] = useState<Section>(Section.HOME);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [focusMode, setFocusMode] = useState<{ active: boolean, taskName: string, duration: number, timeLeft: number, timerActive: boolean } | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Data States connected to Backend
  const queryClient = useQueryClient();
  const { user, login, logout, updateUser: updateAuthUser } = useAuth();
  const session = { user: user || { id: '1', name: 'Admin', role: Role.ADMIN, avatarColor: '#000', email: 'admin@taskstudio.com' } as User };

  const handleLogin = async (email: string, pass: string, isAdmin: boolean) => {
    try {
      await login(email, pass);
    } catch (e: any) {
      setLoginError(e.response?.data?.error || "Login failed");
    }
  };

  // Team

  const { data: teamData } = useQuery({ 
    queryKey: ['users'], 
    queryFn: () => usersAPI.getTeam().then(res => res.data),
  });
  const team = Array.isArray(teamData) ? teamData : (teamData?.team || teamData?.users || []);
  const teamMutation = useMutation({
    mutationFn: (args: { action: 'add' | 'delete', id?: string, data?: any }) => {
      if (args.action === 'add') return usersAPI.addTeamMember(args.data!);
      return usersAPI.deleteUser(args.id!);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });



  // Tracker
  const { data: trackerData } = useQuery({ queryKey: ['tracker'], queryFn: () => trackerAPI.getAll().then(res => res.data) });
  const tracker = Array.isArray(trackerData) ? trackerData : (trackerData?.tracker || trackerData?.items || []);
  const trackerMutation = useMutation({
    mutationFn: (args: { action: 'create' | 'update' | 'delete', id?: string, data?: any }) => {
      if (args.action === 'create') return trackerAPI.create(args.data!);
      if (args.action === 'update') return trackerAPI.update(args.id!, args.data!);
      return trackerAPI.delete(args.id!);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tracker'] })
  });
  const setTracker = (newTracker: any) => {
     const updated = typeof newTracker === 'function' ? newTracker(tracker) : newTracker;
     queryClient.setQueryData(['tracker'], updated);
     
     if (updated.length > tracker.length) {
        const added = updated.find((t: any) => !tracker.some((old: any) => old.id === t.id));
        if (added) trackerMutation.mutate({ action: 'create', data: added });
     } else if (updated.length < tracker.length) {
        const deleted = tracker.find((t: any) => !updated.some((newT: any) => newT.id === t.id));
        if (deleted) trackerMutation.mutate({ action: 'delete', id: deleted.id });
     } else {
        const changed = updated.find((t: any) => {
           const old = tracker.find((o: any) => o.id === t.id);
           return old && JSON.stringify(old) !== JSON.stringify(t);
        });
        if (changed) trackerMutation.mutate({ action: 'update', id: changed.id, data: changed });
     }
  };

  // Tasks
  const { data: tasksData } = useQuery({ queryKey: ['tasks'], queryFn: () => tasksAPI.getAll().then(res => res.data) });
  const tasks = Array.isArray(tasksData) ? tasksData : (tasksData?.tasks || []);
  const tasksMutation = useMutation({
    mutationFn: (args: { action: 'create' | 'update' | 'toggle' | 'delete', id?: string, data?: any }) => {
      if (args.action === 'create') return tasksAPI.create(args.data!);
      if (args.action === 'update') return tasksAPI.update(args.id!, args.data!);
      if (args.action === 'toggle') return tasksAPI.toggle(args.id!);
      return tasksAPI.delete(args.id!);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });
  const setTasks = (newTasks: any) => {
     const updated = typeof newTasks === 'function' ? newTasks(tasks) : newTasks;
     queryClient.setQueryData(['tasks'], updated);
     
     if (updated.length > tasks.length) {
        const added = updated.find((t: any) => !tasks.some((old: any) => old.id === t.id));
        if (added) tasksMutation.mutate({ action: 'create', data: added });
     } else if (updated.length < tasks.length) {
        const deleted = tasks.find((t: any) => !updated.some((newT: any) => newT.id === t.id));
        if (deleted) tasksMutation.mutate({ action: 'delete', id: deleted.id });
     } else {
        const changed = updated.find((t: any) => {
           const old = tasks.find((o: any) => o.id === t.id);
           return old && (old.done !== t.done || old.title !== t.title);
        });
        if (changed) {
           const old = tasks.find((o: any) => o.id === changed.id);
           if (old && old.done !== changed.done) {
              tasksMutation.mutate({ action: 'toggle', id: changed.id });
           } else {
              tasksMutation.mutate({ action: 'update', id: changed.id, data: changed });
           }
        }
     }
  };

  // Meetings
  const { data: meetingsData } = useQuery({ queryKey: ['meetings'], queryFn: () => meetingsAPI.getAll().then(res => res.data) });
  const meetingNotes = Array.isArray(meetingsData) ? meetingsData : (meetingsData?.meetings || meetingsData?.notes || []);
  const meetingsMutation = useMutation({
    mutationFn: (args: { action: 'create' | 'update' | 'delete', id?: string, data?: any }) => {
      if (args.action === 'create') return meetingsAPI.create(args.data!);
      if (args.action === 'update') return meetingsAPI.update(args.id!, args.data!);
      return meetingsAPI.delete(args.id!);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] })
  });
  const setMeetingNotes = (newMeetings: any) => {
     const updated = typeof newMeetings === 'function' ? newMeetings(meetingNotes) : newMeetings;
     queryClient.setQueryData(['meetings'], updated);
     
     if (updated.length > meetingNotes.length) {
        const added = updated.find((t: any) => !meetingNotes.some((old: any) => old.id === t.id));
        if (added) meetingsMutation.mutate({ action: 'create', data: added });
     } else if (updated.length < meetingNotes.length) {
        const deleted = meetingNotes.find((t: any) => !updated.some((newT: any) => newT.id === t.id));
        if (deleted) meetingsMutation.mutate({ action: 'delete', id: deleted.id });
     } else {
        const changed = updated.find((t: any) => {
           const old = meetingNotes.find((o: any) => o.id === t.id);
           return old && JSON.stringify(old) !== JSON.stringify(t);
        });
        if (changed) meetingsMutation.mutate({ action: 'update', id: changed.id, data: changed });
     }
  };

  // Tools
  const { data: toolsData } = useQuery({ queryKey: ['tools'], queryFn: () => contentAPI.getTools().then(res => res.data) });
  const tools = Array.isArray(toolsData) ? toolsData : (toolsData?.tools || INITIAL_TOOLS);
  const toolsMutation = useMutation({
    mutationFn: (args: { action: 'create' | 'delete', id?: string, data?: any }) => {
      if (args.action === 'create') return contentAPI.createTool(args.data!);
      return contentAPI.deleteTool(args.id!);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tools'] })
  });
  const setTools = (newTools: any) => {
     const updated = typeof newTools === 'function' ? newTools(tools) : newTools;
     queryClient.setQueryData(['tools'], updated);
     if (updated.length > tools.length) {
        const added = updated.find((t: any) => !tools.some((old: any) => old.id === t.id));
        if (added) toolsMutation.mutate({ action: 'create', data: added });
     } else if (updated.length < tools.length) {
        const deleted = tools.find((t: any) => !updated.some((newT: any) => newT.id === t.id));
        if (deleted) toolsMutation.mutate({ action: 'delete', id: deleted.id });
     }
  };

  // Ideas
  const { data: ideasData } = useQuery({ queryKey: ['ideas'], queryFn: () => contentAPI.getIdeas().then(res => res.data) });
  const ideas = Array.isArray(ideasData) ? ideasData : (ideasData?.ideas || []);
  const ideasMutation = useMutation({
    mutationFn: (args: { action: 'create' | 'delete', id?: string, data?: any }) => {
      if (args.action === 'create') return contentAPI.createIdea(args.data!);
      return contentAPI.deleteIdea(args.id!);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ideas'] })
  });
  const setIdeas = (newIdeas: any) => {
     const updated = typeof newIdeas === 'function' ? newIdeas(ideas) : newIdeas;
     queryClient.setQueryData(['ideas'], updated);
     if (updated.length > ideas.length) {
        const added = updated.find((t: any) => !ideas.some((old: any) => old.id === t.id));
        if (added) ideasMutation.mutate({ action: 'create', data: added });
     } else if (updated.length < ideas.length) {
        const deleted = ideas.find((t: any) => !updated.some((newT: any) => newT.id === t.id));
        if (deleted) ideasMutation.mutate({ action: 'delete', id: deleted.id });
     }
  };

  // Content
  const { data: contentData } = useQuery({ queryKey: ['contentItems'], queryFn: () => contentAPI.getContentItems().then(res => res.data) });
  const contentCalendar = Array.isArray(contentData) ? contentData : (contentData?.contentItems || contentData?.content || []);
  const contentMutation = useMutation({
    mutationFn: (args: { action: 'create' | 'update' | 'delete', id?: string, data?: any }) => {
      if (args.action === 'create') return contentAPI.createContentItem(args.data!);
      if (args.action === 'update') return contentAPI.updateContentItem(args.id!, args.data!);
      return contentAPI.deleteContentItem(args.id!);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contentItems'] })
  });
  const setContentCalendar = (newContent: any) => {
     const updated = typeof newContent === 'function' ? newContent(contentCalendar) : newContent;
     queryClient.setQueryData(['contentItems'], updated);
     if (updated.length > contentCalendar.length) {
        const added = updated.find((t: any) => !contentCalendar.some((old: any) => old.id === t.id));
        if (added) contentMutation.mutate({ action: 'create', data: added });
     } else if (updated.length < contentCalendar.length) {
        const deleted = contentCalendar.find((t: any) => !updated.some((newT: any) => newT.id === t.id));
        if (deleted) contentMutation.mutate({ action: 'delete', id: deleted.id });
     } else {
        const changed = updated.find((t: any) => {
           const old = contentCalendar.find((o: any) => o.id === t.id);
           return old && JSON.stringify(old) !== JSON.stringify(t);
        });
        if (changed) contentMutation.mutate({ action: 'update', id: changed.id, data: changed });
     }
  };

  // Local storage states
  const [brainDump, setBrainDump] = useState(() => localStorage.getItem('taskstudio_braindump') || '');
  const [homeWidgets, setHomeWidgets]
 = useState(() => {
    const saved = localStorage.getItem('taskstudio_home_widgets');
    return saved ? JSON.parse(saved) : [
      { id: 'welcome', span: 'lg:col-span-9', visible: true },
      { id: 'clock', span: 'lg:col-span-3', visible: true },
      { id: 'stats', span: 'lg:col-span-12', visible: true },
      { id: 'schedule', span: 'lg:col-span-4', visible: true },
      { id: 'tasks', span: 'lg:col-span-4', visible: true },
      { id: 'ideas', span: 'lg:col-span-4', visible: true },
    ];
  });
  
  const [storageUsed, setStorageUsed] = useState(calculateStorageSize());
  const [savedIndicator, setSavedIndicator] = useState(false);

  // --- Effects ---
  
  // Clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // Auto-clear brain dump at midnight
      if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0) {
        setBrainDump('');
        localStorage.setItem('taskstudio_braindump', '');
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('taskstudio_team', JSON.stringify(team));
    localStorage.setItem('taskstudio_tracker', JSON.stringify(tracker));
    localStorage.setItem('taskstudio_tasks', JSON.stringify(tasks));
    localStorage.setItem('taskstudio_tools', JSON.stringify(tools));
    localStorage.setItem('taskstudio_meetings', JSON.stringify(meetingNotes));
    localStorage.setItem('taskstudio_content', JSON.stringify(contentCalendar));
    localStorage.setItem('taskstudio_ideas', JSON.stringify(ideas));
    localStorage.setItem('taskstudio_home_widgets', JSON.stringify(homeWidgets));
    setStorageUsed(calculateStorageSize());
    
    // Pulse saved indicator
    setSavedIndicator(true);
    const timeout = setTimeout(() => setSavedIndicator(false), 1000);
    return () => clearTimeout(timeout);
  }, [team, tracker, tasks, tools, meetingNotes, contentCalendar, ideas, homeWidgets]);

  // Focus Timer
  useEffect(() => {
    let focusTimer: any;
    if (focusMode?.active && focusMode.timerActive && focusMode.timeLeft > 0) {
      focusTimer = setInterval(() => {
        setFocusMode(prev => prev ? { ...prev, timeLeft: prev.timeLeft - 1 } : null);
      }, 1000);
    } else if (focusMode?.timeLeft === 0) {
      if (Notification.permission === 'granted') {
        new Notification('Focus Session Complete!', { body: `You finished your session: ${focusMode.taskName}` });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Focus Session Complete!', { body: `You finished your session: ${focusMode.taskName}` });
          }
        });
      }
    }
    return () => clearInterval(focusTimer);
  }, [focusMode?.active, focusMode?.timerActive, focusMode?.timeLeft]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setFocusMode(prev => prev?.active ? { ...prev, active: false } : prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Calculations ---
  
  const dayScore = useMemo(() => {
    const tasksDonePoints = Math.min(60, (tasks.filter((t: any) => t.done).length / (tasks.length || 1)) * 60);
    const moodPoints = session?.user.mood ? 15 : 0;
    const contentPoints = contentCalendar.length > 0 ? 10 : 0;
    const ideaPoints = ideas.length > 0 ? 15 : 0;
    return Math.round(tasksDonePoints + moodPoints + contentPoints + ideaPoints);
  }, [tasks, session?.user, contentCalendar, ideas]);

  const dailyBrief = useMemo(() => getDailyBrief(currentTime.getHours()), []);


  // --- Handlers ---
  
  const handleLogout = () => {
    logout();
  };

  const updateMoodMutation = useMutation({
    mutationFn: (mood: string) => usersAPI.updateProfile({ mood }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  const updateMood = (mood: string) => {
    if (!session?.user) return;
    updateMoodMutation.mutate(mood);
    // Optimistic local update
    const newUser = { ...session.user, mood };
    updateAuthUser(newUser);
  };

  const renderCurrentSection = () => {
    switch (currentSection) {
      case Section.HOME: return (
        <HomeSection 
          session={session} 
          tasks={tasks} 
          meetingNotes={meetingNotes} 
          ideas={ideas} 
          team={team} 
          dayScore={dayScore} 
          dailyBrief={dailyBrief} 
          currentTime={currentTime} 
          updateMood={updateMood} 
          setCurrentSection={setCurrentSection}
          homeWidgets={homeWidgets}
          setHomeWidgets={setHomeWidgets}
          setIdeas={setIdeas}
          setTasks={setTasks}
        />
      );
      case Section.TRACKER: return <TrackerSection tracker={tracker} setTracker={setTracker} session={session} team={team} setFocusMode={setFocusMode} setCurrentSection={setCurrentSection} />;

      case Section.CALENDAR: return <CalendarSection contentCalendar={contentCalendar} setContentCalendar={setContentCalendar} tasks={tasks} meetingNotes={meetingNotes} />;

      case Section.BRAINDUMP: return <BrainDumpSection brainDump={brainDump} setBrainDump={setBrainDump} currentTime={currentTime} setTasks={setTasks} tasks={tasks} session={session} />;
      case Section.REPORTS: return <ReportsSection team={team} tasks={tasks} />;
      case Section.TEAM: return (
        <TeamSection 
          team={team} 
          onAddMember={(u) => {
            const newUser: User = {
              id: Date.now().toString(),
              name: u.name || '',
              role: u.role || Role.EMPLOYEE,
              email: u.email || '',
              password: u.password || '',
              avatarColor: ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][Math.floor(Math.random() * 5)],
              capacity: 0,
              status: 'Active'
            };
            teamMutation.mutate({ action: 'add', data: newUser });
          }} 
          onDeleteMember={(id) => setDeleteConfirmId(id)}
          onMessageMember={(id) => setCurrentSection(Section.MESSAGES)}
        />
      );
      case Section.MEETINGS: return <MeetingsSection meetingNotes={meetingNotes} setMeetingNotes={setMeetingNotes} />;
      case Section.TOOLS: return <ToolsSection tools={tools} setTools={setTools} />;
      case Section.MESSAGES: return <MessagesSection session={session} team={team} />;
      default: return null;
    }
  };

  const notifs = useMemo(() => {
    const notificationsList = [];
    const now = new Date();
    
    const dueTasks = tasks.filter((t: any) => !t.done && t.dueDate && new Date(t.dueDate) < now);
    if (dueTasks.length > 0) notificationsList.push({ id: 't1', title: 'Overdue Tasks', time: 'Action Required', msg: `${dueTasks.length} tasks are overdue.`, type: 'alert' });
    
    const todayMeetings = meetingNotes.filter((m: any) => m.date && new Date(m.date).toDateString() === now.toDateString());
    if (todayMeetings.length > 0) notificationsList.push({ id: 'm1', title: 'Meetings Today', time: 'Today', msg: `You have ${todayMeetings.length} meetings scheduled today.`, type: 'meeting' });
    
    if (ideas.length > 0) notificationsList.push({ id: 'i1', title: 'Ideas Captured', time: 'Recent', msg: `You have ${ideas.length} ideas waiting to be reviewed.`, type: 'idea' });
    
    if (notificationsList.length === 0) notificationsList.push({ id: '0', title: 'All Caught Up', time: 'Now', msg: 'No pending alerts or meetings. Great job!', type: 'idea' });
    
    return notificationsList;
  }, [tasks, meetingNotes, ideas]);

  // --- App View ---
  return (
    <div className="flex min-h-screen">
      <Sidebar currentSection={currentSection} setCurrentSection={setCurrentSection} session={session} storageUsed={storageUsed} handleLogout={handleLogout} />
      
      {/* Main Content Area */}
      <main className="flex-1 ml-[240px] flex flex-col min-h-screen">
        <Topbar currentSection={currentSection} savedIndicator={savedIndicator} showAIAssistant={showAIAssistant} setShowAIAssistant={setShowAIAssistant} setShowNotifications={setShowNotifications} setShowCommandPalette={setShowCommandPalette} onLogout={handleLogout} user={session.user} />
        
        {/* Page Content */}
        <div className="flex-1 p-[28px] max-w-[1400px] w-full mx-auto overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSection}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderCurrentSection()}
            </motion.div>
          </AnimatePresence>
        </div>

        <AppFooter />
      </main>

      {/* AI Assistant Overlay */}
      <AnimatePresence>
        {showAIAssistant && <AIAssistant onClose={() => setShowAIAssistant(false)} currentSection={currentSection} />}
      </AnimatePresence>

      <FocusModeOverlay focusMode={focusMode} setFocusMode={setFocusMode} />

      <NotificationsPanel showNotifications={showNotifications} setShowNotifications={setShowNotifications} notifs={notifs} />

      <CommandPalette showCommandPalette={showCommandPalette} setShowCommandPalette={setShowCommandPalette} setCurrentSection={setCurrentSection} onStartFocus={() => setFocusMode({ active: true, taskName: 'Focused Work', duration: 25, timeLeft: 25 * 60, timerActive: false })} onLogout={handleLogout} />

      <ConfirmDialog
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) teamMutation.mutate({ action: 'delete', id: deleteConfirmId });
          setDeleteConfirmId(null);
        }}
        title="Delete Member?"
        message="This team member will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />

      <AlertDialog
        open={!!loginError}
        onClose={() => setLoginError(null)}
        title="Login Failed"
        message={loginError || 'An error occurred'}
        variant="error"
      />
    </div>
  );
}
