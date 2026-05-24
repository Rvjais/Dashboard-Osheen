import { useState, useEffect, useRef } from 'react';
import { Send, Search, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { messagesAPI, usersAPI } from '../../services/api';
import { User, Message, Conversation } from '../../types';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';

const GROUP_CHAT_ID = 'group-general';

interface MessagesSectionProps {
  session: { user: User };
  team: User[];
}

const MessagesSection = ({ session, team }: MessagesSectionProps) => {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversationsData } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesAPI.getConversations().then(r => r.data.conversations),
    refetchInterval: 5000,
  });
  const conversations: Conversation[] = conversationsData || [];

  const { data: messagesData } = useQuery({
    queryKey: ['messages', selectedUser?.id],
    queryFn: () => messagesAPI.getMessages(selectedUser!.id).then(r => r.data.messages),
    enabled: !!selectedUser && !isGroupChat,
    refetchInterval: 3000,
  });
  const messages: Message[] = messagesData || [];

  const { data: roomMessagesData } = useQuery({
    queryKey: ['roomMessages', GROUP_CHAT_ID],
    queryFn: () => messagesAPI.getRoomMessages(GROUP_CHAT_ID).then(r => r.data.messages),
    enabled: isGroupChat,
    refetchInterval: 3000,
  });
  const roomMessages: Message[] = roomMessagesData || [];

  const { data: allUsersData } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => usersAPI.getAll().then(r => r.data.users),
  });
  const allUsers: User[] = allUsersData || [];

  const activeMessages = isGroupChat ? roomMessages : messages;

  const sendMutation = useMutation({
    mutationFn: (data: { receiverId: string; content: string }) =>
      messagesAPI.send(data.receiverId, data.content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const sendRoomMutation = useMutation({
    mutationFn: (data: { roomId: string; content: string }) =>
      messagesAPI.sendRoomMessage(data.roomId, data.content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roomMessages', GROUP_CHAT_ID] });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages]);

  const handleSend = () => {
    if (!messageInput.trim()) return;
    if (isGroupChat) {
      sendRoomMutation.mutate({ roomId: GROUP_CHAT_ID, content: messageInput.trim() });
    } else if (selectedUser) {
      sendMutation.mutate({ receiverId: selectedUser.id, content: messageInput.trim() });
    }
    setMessageInput('');
  };

  const conversationUsers = conversations.map(c => c.user);
  const availableUsers: User[] = [];
  for (const u of allUsers) {
    if (u.id !== session.user.id && !availableUsers.some(au => au.id === u.id)) {
      availableUsers.push(u);
    }
  }
  for (const u of team) {
    if (u.id !== session.user.id && !availableUsers.some(au => au.id === u.id)) {
      availableUsers.push(u);
    }
  }

  const filteredUsers = availableUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSender = (senderId: string) => {
    if (senderId === session.user.id) return session.user;
    return allUsers.find(u => u.id === senderId) || team.find(u => u.id === senderId);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] -m-[28px] overflow-hidden">
      <div className="w-[320px] bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-display font-bold mb-3">Messages</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 rounded-lg focus:outline-none focus:ring-1 ring-gray-200"
              placeholder="Search people..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <button
            onClick={() => { setIsGroupChat(true); setSelectedUser(null); }}
            className={cn(
              "w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100",
              isGroupChat && "bg-brand-accent/5 border-l-2 border-l-brand-accent"
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center shrink-0">
              <Users size={20} className="text-brand-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">Group Chat</p>
              <p className="text-[11px] text-gray-500 truncate mt-0.5">Everyone in the workspace</p>
            </div>
          </button>

          <div className="px-4 py-2 text-[10px] uppercase font-bold text-gray-400 tracking-widest">Direct Messages</div>

          {filteredUsers.map(u => (
            <button
              key={u.id}
              onClick={() => { setSelectedUser(u); setIsGroupChat(false); }}
              className={cn(
                "w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-50",
                selectedUser?.id === u.id && !isGroupChat && "bg-brand-accent/5 border-l-2 border-l-brand-accent"
              )}
            >
              <div className="relative shrink-0">
                {u.avatar ? (
                  <img src={u.avatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                    style={{ backgroundColor: u.avatarColor }}
                  >
                    {u.name.charAt(0)}
                  </div>
                )}
                {conversations.find(c => c.user.id === u.id)?.lastMessage?.read === false &&
                  conversations.find(c => c.user.id === u.id)?.lastMessage?.senderId !== session.user.id && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-accent rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-md">1</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-bold text-gray-900 truncate">{u.name}</p>
                  {conversations.find(c => c.user.id === u.id)?.lastMessage && (
                    <span className="text-[9px] text-gray-400 font-mono shrink-0 ml-2">
                      {format(new Date(conversations.find(c => c.user.id === u.id)!.lastMessage.createdAt), 'HH:mm')}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 truncate mt-0.5">
                  {conversations.find(c => c.user.id === u.id)?.lastMessage?.content || 'No messages yet'}
                </p>
              </div>
            </button>
          ))}
          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-xs text-gray-400">No users found</div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-50/50">
        {isGroupChat ? (
          <>
            <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-accent/10 flex items-center justify-center shrink-0">
                <Users size={18} className="text-brand-accent" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Group Chat</p>
                <p className="text-[10px] text-gray-500">{allUsers.length + 1} members</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {roomMessages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Users size={24} className="text-gray-300" />
                    </div>
                    <p className="text-sm font-bold text-gray-500">No messages yet</p>
                    <p className="text-xs text-gray-400 mt-1">Be the first to say something</p>
                  </div>
                </div>
              )}
              {roomMessages.map((msg, i) => {
                const isMine = msg.senderId === session.user.id;
                const sender = getSender(msg.senderId);
                const showSender = i === 0 || roomMessages[i - 1]?.senderId !== msg.senderId;
                return (
                  <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                    <div className={cn("flex gap-2 max-w-[70%]", isMine && "flex-row-reverse")}>
                      {showSender && (
                        sender?.avatar ? (
                          <img src={sender.avatar} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0 mt-1" />
                        ) : (
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-[10px] shrink-0 mt-1"
                            style={{ backgroundColor: sender?.avatarColor || '#ccc' }}
                          >
                            {sender?.name?.charAt(0) || '?'}
                          </div>
                        )
                      )}
                      {!showSender && <div className="w-7 shrink-0" />}
                      <div>
                        {showSender && !isMine && (
                          <p className="text-[10px] font-bold text-gray-500 mb-1 ml-1">{sender?.name}</p>
                        )}
                        <div className={cn(
                          "px-4 py-2.5 text-sm leading-relaxed rounded-2xl",
                          isMine
                            ? "bg-brand-accent text-white rounded-br-none"
                            : "bg-white border border-gray-100 text-gray-800 rounded-bl-none shadow-sm"
                        )}>
                          {msg.content}
                        </div>
                        <div className={cn("flex items-center gap-1.5 mt-1", isMine && "justify-end")}>
                          <span className="text-[9px] text-gray-400 font-mono">
                            {format(new Date(msg.createdAt), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-end gap-2">
                <input
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 ring-brand-accent/10 focus:bg-white transition-all"
                  placeholder="Type a message to everyone..."
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                />
                <Button
                  onClick={handleSend}
                  disabled={!messageInput.trim() || sendRoomMutation.isPending}
                  className="h-[44px] px-4 rounded-xl"
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
          </>
        ) : selectedUser ? (
          <>
            <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-3">
              {selectedUser.avatar ? (
                <img src={selectedUser.avatar} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0" />
              ) : (
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0"
                  style={{ backgroundColor: selectedUser.avatarColor }}
                >
                  {selectedUser.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-gray-900">{selectedUser.name}</p>
                <p className="text-[10px] text-gray-500">{selectedUser.email}</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-gray-400 font-medium">{selectedUser.status || 'Active'}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Send size={24} className="text-gray-300" />
                    </div>
                    <p className="text-sm font-bold text-gray-500">No messages yet</p>
                    <p className="text-xs text-gray-400 mt-1">Send a message to start the conversation</p>
                  </div>
                </div>
              )}
              {messages.map((msg, i) => {
                const isMine = msg.senderId === session.user.id;
                const showAvatar = i === 0 || messages[i - 1]?.senderId !== msg.senderId;
                return (
                  <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                    <div className={cn("flex gap-2 max-w-[70%]", isMine && "flex-row-reverse")}>
                      {showAvatar && (
                        isMine && session.user.avatar ? (
                          <img src={session.user.avatar} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0 mt-1" />
                        ) : !isMine && selectedUser.avatar ? (
                          <img src={selectedUser.avatar} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0 mt-1" />
                        ) : (
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-[10px] shrink-0 mt-1"
                            style={{ backgroundColor: isMine ? session.user.avatarColor : selectedUser.avatarColor }}
                          >
                            {(isMine ? session.user.name : selectedUser.name).charAt(0)}
                          </div>
                        )
                      )}
                      {!showAvatar && <div className="w-7 shrink-0" />}
                      <div>
                        <div className={cn(
                          "px-4 py-2.5 text-sm leading-relaxed rounded-2xl",
                          isMine
                            ? "bg-brand-accent text-white rounded-br-none"
                            : "bg-white border border-gray-100 text-gray-800 rounded-bl-none shadow-sm"
                        )}>
                          {msg.content}
                        </div>
                        <div className={cn("flex items-center gap-1.5 mt-1", isMine && "justify-end")}>
                          <span className="text-[9px] text-gray-400 font-mono">
                            {format(new Date(msg.createdAt), 'HH:mm')}
                          </span>
                          {isMine && (
                            <span className={cn("text-[9px]", msg.read ? "text-blue-500" : "text-gray-300")}>
                              ✓✓
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-end gap-2">
                <input
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 ring-brand-accent/10 focus:bg-white transition-all"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                />
                <Button
                  onClick={handleSend}
                  disabled={!messageInput.trim() || sendMutation.isPending}
                  className="h-[44px] px-4 rounded-xl"
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-[28px] bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <Send size={32} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-display font-bold text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-sm text-gray-500">Choose someone or join the group chat</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesSection;
