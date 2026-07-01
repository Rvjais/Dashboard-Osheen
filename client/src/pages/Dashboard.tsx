import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../context/AuthContext';
import { usersAPI, trackerAPI, tasksAPI, meetingsAPI, contentAPI, messagesAPI } from '../services/api';

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
import ReportsSection from "../components/sections/ReportsSection";
import CalendarSection from "../components/sections/CalendarSection";
import TeamSection from "../components/sections/TeamSection";
import MeetingsSection from "../components/sections/MeetingsSection";
import ToolsSection from "../components/sections/ToolsSection";
import MessagesSection from "../components/sections/MessagesSection";
import KrasSection from "../components/sections/KrasSection";

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
  const [syncErrors, setSyncErrors] = useState<string[]>([]);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(() => {
    return localStorage.getItem('taskstudio_sidebar_minimized') === 'true';
  });

  const addSyncError = (msg: string) => {
    setSyncErrors(prev => [...prev, msg]);
    setTimeout(() => setSyncErrors(prev => prev.filter(e => e !== msg)), 5000);
  };

  const toggleSidebar = () => {
    const newState = !isSidebarMinimized;
    setIsSidebarMinimized(newState);
    localStorage.setItem('taskstudio_sidebar_minimized', String(newState));
  };

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
  const team = Array.isArray(teamData) ? teamData : (teamData?.users || teamData?.team || []);
  const teamMutation = useMutation({
    mutationFn: (args: { action: 'add' | 'delete', id?: string, data?: any }) => {
      if (args.action === 'add') return usersAPI.addTeamMember(args.data!);
      return usersAPI.deleteUser(args.id!);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });



  // Tracker
  const { data: trackerData } = useQuery({ queryKey: ['tracker'], queryFn: () => trackerAPI.getAll().then(res => res.data) });
  const tracker = Array.isArray(trackerData) ? trackerData : (trackerData?.items || trackerData?.tracker || []);
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
     const previousTracker = queryClient.getQueryData(['tracker']);
     queryClient.setQueryData(['tracker'], updated);

     const rollback = () => {
       queryClient.setQueryData(['tracker'], previousTracker);
       addSyncError('Tracker sync failed — changes reverted');
     };
     
     const added = updated.filter((t: any) => !tracker.some((old: any) => old.id === t.id));
     const deleted = tracker.filter((t: any) => !updated.some((newT: any) => newT.id === t.id));
     const changed = updated.filter((t: any) => {
        const old = tracker.find((o: any) => o.id === t.id);
        return old && JSON.stringify(old) !== JSON.stringify(t);
     });

     added.forEach((a: any) => trackerMutation.mutate(
       { action: 'create', data: a },
       { onError: rollback }
     ));
     deleted.forEach((d: any) => trackerMutation.mutate(
       { action: 'delete', id: d.id },
       { onError: rollback }
     ));
     changed.forEach((c: any) => trackerMutation.mutate(
       { action: 'update', id: c.id, data: c },
       { onError: rollback }
     ));
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
     const previousTasks = queryClient.getQueryData(['tasks']);
     queryClient.setQueryData(['tasks'], updated);

     const rollback = () => {
       queryClient.setQueryData(['tasks'], previousTasks);
       addSyncError('Tasks sync failed — changes reverted');
     };
     
     const added = updated.filter((t: any) => !tasks.some((old: any) => old.id === t.id));
     const deleted = tasks.filter((t: any) => !updated.some((newT: any) => newT.id === t.id));
     const changed = updated.filter((t: any) => {
        const old = tasks.find((o: any) => o.id === t.id);
        return old && (old.done !== t.done || old.title !== t.title || old.priority !== t.priority);
     });

     added.forEach((a: any) => tasksMutation.mutate(
       { action: 'create', data: a },
       { onError: rollback }
     ));
     deleted.forEach((d: any) => tasksMutation.mutate(
       { action: 'delete', id: d.id },
       { onError: rollback }
     ));
     changed.forEach((c: any) => {
        const old = tasks.find((o: any) => o.id === c.id);
        if (old && old.done !== c.done) {
           tasksMutation.mutate(
             { action: 'toggle', id: c.id },
             { onError: rollback }
           );
        } else {
           tasksMutation.mutate(
             { action: 'update', id: c.id, data: c },
             { onError: rollback }
           );
        }
     });
  };

  // Meetings
  const { data: meetingsData } = useQuery({ queryKey: ['meetings'], queryFn: () => meetingsAPI.getAll().then(res => res.data) });
  const meetingNotes = Array.isArray(meetingsData) ? meetingsData : (meetingsData?.notes || meetingsData?.meetings || []);
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
     const previousMeetings = queryClient.getQueryData(['meetings']);
     queryClient.setQueryData(['meetings'], updated);

     const rollback = () => {
       queryClient.setQueryData(['meetings'], previousMeetings);
       addSyncError('Meetings sync failed — changes reverted');
     };
     
     const added = updated.filter((t: any) => !meetingNotes.some((old: any) => old.id === t.id));
     const deleted = meetingNotes.filter((t: any) => !updated.some((newT: any) => newT.id === t.id));
     const changed = updated.filter((t: any) => {
        const old = meetingNotes.find((o: any) => o.id === t.id);
        return old && JSON.stringify(old) !== JSON.stringify(t);
     });

     added.forEach((a: any) => meetingsMutation.mutate(
       { action: 'create', data: a },
       { onError: rollback }
     ));
     deleted.forEach((d: any) => meetingsMutation.mutate(
       { action: 'delete', id: d.id },
       { onError: rollback }
     ));
     changed.forEach((c: any) => meetingsMutation.mutate(
       { action: 'update', id: c.id, data: c },
       { onError: rollback }
     ));
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
     const previousTools = queryClient.getQueryData(['tools']);
     queryClient.setQueryData(['tools'], updated);

     const rollback = () => {
       queryClient.setQueryData(['tools'], previousTools);
       addSyncError('Tools sync failed — changes reverted');
     };

     const added = updated.filter((t: any) => !tools.some((old: any) => old.id === t.id));
     const deleted = tools.filter((t: any) => !updated.some((newT: any) => newT.id === t.id));

     added.forEach((a: any) => toolsMutation.mutate(
       { action: 'create', data: a },
       { onError: rollback }
     ));
     deleted.forEach((d: any) => toolsMutation.mutate(
       { action: 'delete', id: d.id },
       { onError: rollback }
     ));
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
     const previousIdeas = queryClient.getQueryData(['ideas']);
     queryClient.setQueryData(['ideas'], updated);

     const rollback = () => {
       queryClient.setQueryData(['ideas'], previousIdeas);
       addSyncError('Ideas sync failed — changes reverted');
     };

     const added = updated.filter((t: any) => !ideas.some((old: any) => old.id === t.id));
     const deleted = ideas.filter((t: any) => !updated.some((newT: any) => newT.id === t.id));

     added.forEach((a: any) => ideasMutation.mutate(
       { action: 'create', data: a },
       { onError: rollback }
     ));
     deleted.forEach((d: any) => ideasMutation.mutate(
       { action: 'delete', id: d.id },
       { onError: rollback }
     ));
  };

  // Content
  const { data: contentData } = useQuery({ queryKey: ['contentItems'], queryFn: () => contentAPI.getContentItems().then(res => res.data) });
  const contentCalendar = Array.isArray(contentData) ? contentData : (contentData?.items || contentData?.contentItems || contentData?.content || []);
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
     const previousContent = queryClient.getQueryData(['contentItems']);
     queryClient.setQueryData(['contentItems'], updated);

     const rollback = () => {
       queryClient.setQueryData(['contentItems'], previousContent);
       addSyncError('Content sync failed — changes reverted');
     };
     
     const added = updated.filter((t: any) => !contentCalendar.some((old: any) => old.id === t.id));
     const deleted = contentCalendar.filter((t: any) => !updated.some((newT: any) => newT.id === t.id));
     const changed = updated.filter((t: any) => {
        const old = contentCalendar.find((o: any) => o.id === t.id);
        return old && JSON.stringify(old) !== JSON.stringify(t);
     });

     added.forEach((a: any) => contentMutation.mutate(
       { action: 'create', data: a },
       { onError: rollback }
     ));
     deleted.forEach((d: any) => contentMutation.mutate(
       { action: 'delete', id: d.id },
       { onError: rollback }
     ));
     changed.forEach((c: any) => contentMutation.mutate(
       { action: 'update', id: c.id, data: c },
       { onError: rollback }
     ));
  };

  // Local storage states
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

  // Unread Messages Count
  const { data: unreadData } = useQuery({ 
    queryKey: ['unreadCount'], 
    queryFn: () => messagesAPI.getUnreadCount().then(res => res.data),
    refetchInterval: 10000 
  });
  const unreadCount = unreadData?.count || 0;

  // --- Effects ---
  
  // Clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync state to local storage (debounced to avoid excessive writes — BUG 17 fix)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      localStorage.setItem('taskstudio_home_widgets', JSON.stringify(homeWidgets));
      setStorageUsed(calculateStorageSize());
      setSavedIndicator(true);
      setTimeout(() => setSavedIndicator(false), 1000);
    }, 500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [homeWidgets]);

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

  const dailyBrief = useMemo(() => getDailyBrief(currentTime.getHours()), [currentTime]);


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
          tracker={tracker}
          setTracker={setTracker}
        />
      );
      case Section.TRACKER: return <TrackerSection tracker={tracker} setTracker={setTracker} session={session} team={team} setFocusMode={setFocusMode} setCurrentSection={setCurrentSection} />;
      case Section.CALENDAR: return <CalendarSection contentCalendar={contentCalendar} setContentCalendar={setContentCalendar} tracker={tracker} setTracker={setTracker} meetingNotes={meetingNotes} setMeetingNotes={setMeetingNotes} session={session} />;

      case Section.REPORTS: return <ReportsSection team={team} tasks={tasks} />;
      case Section.TEAM: return (
        <TeamSection 
          team={team} 
          onAddMember={(u) => {
            // BUG 8 FIX: Only send fields the server accepts
            teamMutation.mutate({ action: 'add', data: { name: u.name, email: u.email, password: u.password, role: u.role || 'employee' } });
          }} 
          onDeleteMember={(id) => setDeleteConfirmId(id)}
          onMessageMember={(id) => setCurrentSection(Section.MESSAGES)}
        />
      );
      case Section.MEETINGS: return <MeetingsSection meetingNotes={meetingNotes} setMeetingNotes={setMeetingNotes} />;
      case Section.TOOLS: return <ToolsSection tools={tools} setTools={setTools} />;
      case Section.MESSAGES: return <MessagesSection session={session} team={team} />;
      case Section.KRAS: return <KrasSection session={session} team={team} />;
      default: return null;
    }
  };

  const notifs = useMemo(() => {
    const notificationsList = [];
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    // Tracker Tasks (instead of general Tasks)
    const dueTrackerTasks = tracker.filter((t: any) => t.status !== 'done' && t.date && t.date < todayStr);
    if (dueTrackerTasks.length > 0) notificationsList.push({ id: 'tt1', title: 'Overdue Tasks', time: 'Action Required', msg: `${dueTrackerTasks.length} tracker tasks are overdue.`, type: 'alert' });
    
    const todayTrackerTasks = tracker.filter((t: any) => t.status !== 'done' && t.date === todayStr);
    if (todayTrackerTasks.length > 0) notificationsList.push({ id: 'tt2', title: 'Tasks Due Today', time: 'Today', msg: `You have ${todayTrackerTasks.length} tasks to complete today.`, type: 'alert' });

    // Periodic reminder (e.g. if it's past 12 PM or 3 PM and tasks are still incomplete)
    if (now.getHours() >= 12 && todayTrackerTasks.length > 0) {
      notificationsList.push({ id: 'rem1', title: 'Pending Tasks Reminder', time: 'Just now', msg: `Don't forget! You still have ${todayTrackerTasks.length} tasks to finish today.`, type: 'alert' });
    }

    const todayMeetings = meetingNotes.filter((m: any) => m.date === todayStr || (m.date && m.date.startsWith(todayStr)));
    if (todayMeetings.length > 0) notificationsList.push({ id: 'm1', title: 'Meetings Today', time: 'Today', msg: `You have ${todayMeetings.length} meetings scheduled today.`, type: 'meeting' });
    
    if (unreadCount > 0) notificationsList.push({ id: 'msg1', title: 'Unread Messages', time: 'New', msg: `You have ${unreadCount} unread message(s).`, type: 'alert' });

    if (ideas.length > 0) notificationsList.push({ id: 'i1', title: 'Ideas Captured', time: 'Recent', msg: `You have ${ideas.length} ideas waiting to be reviewed.`, type: 'idea' });
    
    // Check if new task added today
    const tasksCreatedToday = tracker.filter((t: any) => t.date === todayStr);
    if (tasksCreatedToday.length > 0) {
      notificationsList.push({ id: 'tnew', title: 'New Tasks Added', time: 'Today', msg: `${tasksCreatedToday.length} task(s) added to the tracker today.`, type: 'idea' });
    }

    if (notificationsList.length === 0) notificationsList.push({ id: '0', title: 'All Caught Up', time: 'Now', msg: 'No pending alerts or meetings. Great job!', type: 'idea' });
    
    return notificationsList;
  }, [tracker, meetingNotes, ideas, unreadCount, currentTime]);

  // --- App View ---
  return (
    <div className="flex min-h-screen">
      <Sidebar 
        currentSection={currentSection} 
        setCurrentSection={setCurrentSection} 
        session={session} 
        storageUsed={storageUsed} 
        handleLogout={handleLogout} 
        isMinimized={isSidebarMinimized}
        toggleMinimize={toggleSidebar}
      />
      
      {/* Main Content Area */}
      <main className={cn("flex-1 flex flex-col min-h-screen transition-all duration-300", isSidebarMinimized ? "ml-[5rem]" : "ml-[18rem]")}>
        <Topbar 
          currentSection={currentSection} 
          savedIndicator={savedIndicator} 
          showAIAssistant={showAIAssistant} 
          setShowAIAssistant={setShowAIAssistant} 
          setShowNotifications={setShowNotifications} 
          setShowCommandPalette={setShowCommandPalette} 
          onLogout={handleLogout} 
          user={session.user} 
          hasUnreadNotifications={notifs.length > 0 && notifs[0].id !== '0'} 
        />
        
        {/* Sync Error Indicator */}
        {syncErrors.length > 0 && (
          <div className="fixed top-4 right-4 z-[9999] space-y-2">
            {syncErrors.map((err, i) => (
              <div key={i} className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-top-2">
                ⚠️ {err}
              </div>
            ))}
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 p-8 max-w-[1600px] w-full mx-auto overflow-y-auto">
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
