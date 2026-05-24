import { TaskPriority, TaskStatus } from './types';

export const INITIAL_TOOLS = [
  { id: 'tool-1', name: 'Google Docs', url: 'https://docs.google.com', icon: '📝', category: 'Google Workspace' },
  { id: 'tool-2', name: 'Google Sheets', url: 'https://sheets.google.com', icon: '📊', category: 'Google Workspace' },
  { id: 'tool-3', name: 'Google Slides', url: 'https://slides.google.com', icon: '🎨', category: 'Google Workspace' },
  { id: 'tool-4', name: 'Google Drive', url: 'https://drive.google.com', icon: '📁', category: 'Google Workspace' },
  { id: 'tool-5', name: 'Google Meet', url: 'https://meet.google.com', icon: '📹', category: 'Communication' },
  { id: 'tool-6', name: 'Gmail', url: 'https://mail.google.com', icon: '📧', category: 'Communication' },
  { id: 'tool-7', name: 'Slack', url: 'https://slack.com', icon: '💬', category: 'Communication' },
  { id: 'tool-8', name: 'Figma', url: 'https://figma.com', icon: '🎨', category: 'Design' },
  { id: 'tool-9', name: 'GitHub', url: 'https://github.com', icon: '🐙', category: 'Dev' },
  { id: 'tool-10', name: 'Notion', url: 'https://notion.so', icon: '📓', category: 'My Links' },
  { id: 'tool-11', name: 'Loom', url: 'https://loom.com', icon: '🎥', category: 'Communication' },
  { id: 'tool-12', name: 'Linear', url: 'https://linear.app', icon: '📉', category: 'Dev' },
  { id: 'tool-ai-1', name: 'ChatGPT', url: 'https://chat.openai.com', icon: '🤖', category: 'AI Platforms' },
  { id: 'tool-ai-2', name: 'Claude', url: 'https://claude.ai', icon: '🧠', category: 'AI Platforms' },
  { id: 'tool-ai-3', name: 'Gemini', url: 'https://gemini.google.com', icon: '✨', category: 'AI Platforms' },
];

export function getDailyBrief(hour: number): string {
  if (hour < 12) return "Good morning! Focus on your top-priority tracker items first.";
  if (hour < 17) return "Good afternoon. Keep pushing through your task list.";
  return "Good evening. Wrap up and plan for tomorrow.";
}
