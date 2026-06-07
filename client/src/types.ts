export enum Role {
  ADMIN = 'admin',
  EMPLOYEE = 'employee'
}

export enum Section {
  HOME = 'home',
  TRACKER = 'tracker',
  CALENDAR = 'calendar',
  BRAINDUMP = 'braindump',
  TEAM = 'team',
  MEETINGS = 'meetings',
  REPORTS = 'reports',
  TOOLS = 'tools',
  MESSAGES = 'messages'
}

export enum TaskPriority {
  EMERGENCY = 'emergency',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  CREATIVE = 'creative'
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  DONE = 'done',
  BLOCKED = 'blocked'
}

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  avatarColor: string;
  avatar?: string;
  mood?: string;
  capacity?: number; // 0-100
  status?: string;
  tasks?: string[];
}

export interface TrackerItem {
  id: string;
  name: string;
  date: string;
  type: string;
  priority: TaskPriority;
  status: TaskStatus;
  deliverable: string;
  assigneeId: string;
  link: string;
  attachment?: {
    name: string;
    size: number;
    data?: string;
    type: string;
    path?: string;
  };
  notes: string;
  timeSlot?: number;
  archived?: boolean;
  completedAt?: string;
}

export interface ContentItem {
  id: string;
  title: string;
  platform: string;
  type: string;
  publishDate: string;
  stage: string;
  creatorId: string;
  link: string;
  goal: string;
  caption: string;
  notes: string;
}

export interface MeetingNote {
  id: string;
  title: string;
  date: string;
  type: string;
  attendees: string[];
  notes: string;
  actionItems: string;
  link: string;
}

export interface Task {
  id: string;
  title: string;
  priority: TaskPriority;
  assigneeId: string;
  done: boolean;
  dueDate: string;
  createdById?: string;
}

export interface Tool {
  id: string;
  name: string;
  url: string;
  icon: string;
  category: string;
}

export interface Idea {
  id: string;
  text: string;
  category: string;
  date: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  user: User;
  lastMessage: {
    messageId: string;
    content: string;
    senderId: string;
    createdAt: string;
    read: boolean;
  };
}
