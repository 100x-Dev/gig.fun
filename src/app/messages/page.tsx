'use client';

import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/Avatar';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Camera, Check, MessageSquarePlus, MoreVertical, Search } from 'lucide-react';
import { cn } from '~/lib/utils';

type Chat = {
  id: string;
  avatar: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  isMuted?: boolean;
  isPinned?: boolean;
  isTyping?: boolean;
  isYou?: boolean;
};

const chats: Chat[] = [
  {
    id: '1',
    avatar: 'https://i.pravatar.cc/150?img=1',
    name: 'John Doe',
    lastMessage: 'Hey, are you available for a call?',
    timestamp: '10:42 AM',
    unreadCount: 3,
    isPinned: true,
  },
  {
    id: '2',
    avatar: 'https://i.pravatar.cc/150?img=2',
    name: 'Jane Smith',
    lastMessage: 'Sounds good! I will send the files over.',
    timestamp: '9:30 AM',
    unreadCount: 1,
  },
  {
    id: '3',
    avatar: 'https://i.pravatar.cc/150?img=3',
    name: 'Project Team',
    lastMessage: 'Alice: Let\'s sync up at 3 PM today.',
    timestamp: 'Yesterday',
  },
  {
    id: '4',
    avatar: 'https://i.pravatar.cc/150?img=4',
    name: 'Bob Johnson',
    lastMessage: 'You: Perfect, thanks!',
    timestamp: 'Yesterday',
    isYou: true,
  },
  {
    id: '5',
    avatar: 'https://i.pravatar.cc/150?img=5',
    name: 'Marketing Group',
    lastMessage: 'New campaign details are in the drive.',
    timestamp: 'Monday',
  },
  {
    id: '6',
    avatar: 'https://i.pravatar.cc/150?img=6',
    name: 'Emily White',
    lastMessage: 'Can you check the latest designs?',
    timestamp: 'Monday',
  },
];

const FilterChip = ({ label, isActive, onClick }: { label: string; isActive?: boolean; onClick?: () => void; }) => (
  <Button
    onClick={onClick}
    variant={isActive ? 'primary' : 'outline'}
    className={cn(
      'rounded-full h-8 px-4 text-sm',
      'cursor-pointer',
      isActive
        ? 'bg-[var(--primary)] text-white'
        : 'bg-gray-100 text-gray-700 border-gray-100 hover:bg-gray-200'
    )}
  >
    {label}
  </Button>
);

const ChatListItem = ({ chat }: { chat: Chat }) => (
  <div className="flex items-center space-x-4 p-3 hover:bg-gray-50 cursor-pointer">
    <Avatar className="h-12 w-12">
      <AvatarImage src={chat.avatar} alt={chat.name} />
      <AvatarFallback>{chat.name[0]}</AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center">
        <p className="text-base font-medium text-gray-900 truncate">{chat.name}</p>
        <p className={cn(
          'text-xs',
          chat.unreadCount ? 'text-[var(--primary)] font-bold' : 'text-gray-500'
        )}>
          {chat.timestamp}
        </p>
      </div>
      <div className="flex justify-between items-center mt-1">
        <div className="flex items-center space-x-1 text-sm text-gray-500 truncate">
          {chat.isYou && <Check className="h-4 w-4 text-blue-500" />}
          <p className="truncate">{chat.lastMessage}</p>
        </div>
        {chat.unreadCount && (
          <div className="bg-[var(--primary)] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
          </div>
        )}
      </div>
    </div>
  </div>
);

export default function MessagesPage() {
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <div className="h-screen w-full flex flex-col bg-white font-sans">
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-gray-800">Chat</h1>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Camera className="h-5 w-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Search className="h-5 w-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVertical className="h-5 w-5 text-gray-600" />
            </Button>
          </div>
        </div>
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search"
              className="w-full bg-gray-100 border-transparent rounded-full pl-10 pr-4 py-2"
            />
          </div>
        </div>
        <div className="flex space-x-2 px-4 pb-3 overflow-x-auto">
          {['All', 'Read', 'Unread'].map((filter) => (
            <FilterChip
              key={filter}
              label={filter}
              isActive={activeFilter === filter}
              onClick={() => setActiveFilter(filter)}
            />
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto relative">
        <div className="divide-y divide-gray-100">
          {chats.map((chat) => (
            <ChatListItem key={chat.id} chat={chat} />
          ))}
        </div>
        <Button
          size="lg"
          className="absolute bottom-6 right-6 rounded-full h-14 w-14 bg-[var(--primary)] hover:bg-[var(--primary-light)] shadow-lg"
        >
          <MessageSquarePlus className="h-6 w-6" />
        </Button>
      </main>
    </div>
  );
}
