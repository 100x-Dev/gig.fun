'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '~/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/Avatar';
import { Input } from '~/components/ui/Input';
import { 
  MessageSquare, 
  Search, 
  Send, 
  MoreHorizontal, 
  Paperclip, 
  Smile, 
  ChevronLeft,
  CheckCheck,
  Clock
} from 'lucide-react';
import { cn } from '~/lib/utils';

interface Message {
  id: string;
  sender: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  unread: boolean;
  isCurrentUser: boolean;
}

interface Conversation {
  id: string;
  participant: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    isOnline: boolean;
  };
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  service?: {
    id: string;
    title: string;
    price: number;
    currency: string;
  };
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample conversations data
  const conversations: Conversation[] = [
    {
      id: '1',
      participant: {
        id: 'user2',
        name: 'Alex Johnson',
        username: 'alexj',
        avatar: 'https://i.pravatar.cc/150?img=1',
        isOnline: true,
      },
      lastMessage: 'Hey! I\'m interested in your web development service. Are you available next week?',
      timestamp: '10:30 AM',
      unreadCount: 2,
      service: {
        id: 's1',
        title: 'Professional Website Development',
        price: 500,
        currency: 'USD',
      },
    },
    {
      id: '2',
      participant: {
        id: 'user3',
        name: 'Sam Wilson',
        username: 'samw',
        avatar: 'https://i.pravatar.cc/150?img=5',
        isOnline: false,
      },
      lastMessage: 'Thanks for the quick response! I\'ll send the requirements shortly.',
      timestamp: 'Yesterday',
      unreadCount: 0,
      service: {
        id: 's2',
        title: 'Mobile App Design',
        price: 300,
        currency: 'USD',
      },
    },
    {
      id: '3',
      participant: {
        id: 'user4',
        name: 'Taylor Swift',
        username: 'taylorswift',
        avatar: 'https://i.pravatar.cc/150?img=10',
        isOnline: true,
      },
      lastMessage: 'The design looks amazing! Just what I was looking for.',
      timestamp: 'Monday',
      unreadCount: 0,
    },
  ];

  // Sample messages for the selected conversation
  const messages: Message[] = selectedConversation === '1' ? [
    {
      id: 'm1',
      sender: {
        id: 'user2',
        name: 'Alex Johnson',
        username: 'alexj',
        avatar: 'https://i.pravatar.cc/150?img=1',
      },
      content: 'Hey! I\'m interested in your web development service. Are you available next week?',
      timestamp: '10:30 AM',
      unread: false,
      isCurrentUser: false,
    },
    {
      id: 'm2',
      sender: {
        id: session?.user?.fid || 'current',
        name: 'You',
        username: 'you',
        avatar: session?.user?.pfp || '',
      },
      content: 'Hi Alex! Yes, I have availability next week. What kind of project are you working on?',
      timestamp: '10:32 AM',
      unread: false,
      isCurrentUser: true,
    },
    {
      id: 'm3',
      sender: {
        id: 'user2',
        name: 'Alex Johnson',
        username: 'alexj',
        avatar: 'https://i.pravatar.cc/150?img=1',
      },
      content: 'I need a portfolio website with about, work, and contact sections. Do you think we can discuss the details?',
      timestamp: '10:33 AM',
      unread: true,
      isCurrentUser: false,
    },
  ] : [];

  useEffect(() => {
    if (status === 'authenticated') {
      const timer = setTimeout(() => {
        setIsLoading(false);
        // Auto-select first conversation if none selected
        if (conversations.length > 0 && !selectedConversation) {
          setSelectedConversation(conversations[0].id);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      console.log('Sending message:', messageInput);
      setMessageInput('');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Messages</h2>
        <p className="text-gray-600 mb-6">Sign in to view your messages</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center">
          <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
          <div className="ml-auto relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search messages..."
              className="pl-9 w-64 bg-gray-50 border-0 focus-visible:ring-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto bg-white rounded-lg shadow-sm border border-gray-200 my-4">
        {/* Conversations List */}
        <div className="w-80 border-r border-gray-100 flex flex-col">
          <div className="p-3 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider px-2 mb-2">Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  'p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors',
                  selectedConversation === conversation.id && 'bg-blue-50'
                )}
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.participant.avatar} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {conversation.participant.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.participant.isOnline && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {conversation.participant.name}
                      </h3>
                      <span className="text-xs text-gray-400">
                        {conversation.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.lastMessage}
                    </p>
                    {conversation.service && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                          {conversation.service.currency} {conversation.service.price}
                        </span>
                      </div>
                    )}
                  </div>
                  {conversation.unreadCount > 0 && (
                    <span className="flex-shrink-0 ml-2 bg-blue-500 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversations.find(c => c.id === selectedConversation)?.participant.avatar} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {conversations.find(c => c.id === selectedConversation)?.participant.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    {conversations.find(c => c.id === selectedConversation)?.participant.isOnline && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {conversations.find(c => c.id === selectedConversation)?.participant.name}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center">
                      {conversations.find(c => c.id === selectedConversation)?.participant.isOnline 
                        ? <><span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span> Online</> 
                        : <><span className="w-2 h-2 rounded-full bg-gray-300 mr-1"></span> Offline</>}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto bg-[#f8f9fa]">
                <div className="max-w-3xl mx-auto w-full space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex group',
                        message.isCurrentUser ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div className="flex max-w-[80%] sm:max-w-md">
                        {!message.isCurrentUser && (
                          <div className="flex-shrink-0 mr-3 self-end">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={message.sender.avatar} />
                              <AvatarFallback className="text-xs">
                                {message.sender.name[0]}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                        <div className={cn(
                          'relative px-4 py-2 rounded-2xl',
                          message.isCurrentUser
                            ? 'bg-blue-500 text-white rounded-br-sm'
                            : 'bg-white border border-gray-200 rounded-bl-sm',
                          message.unread && 'ring-1 ring-blue-400'
                        )}>
                          <p className="text-sm">{message.content}</p>
                          <div className={cn(
                            'mt-1 text-xs flex items-center justify-end space-x-1',
                            message.isCurrentUser ? 'text-blue-100' : 'text-gray-400'
                          )}>
                            <span>{message.timestamp}</span>
                            {message.isCurrentUser && (
                              <CheckCheck className={cn(
                                'h-3 w-3',
                                message.unread ? 'text-blue-200' : 'text-blue-300'
                              )} />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div className="p-3 border-t border-gray-100 bg-white">
                <form onSubmit={handleSendMessage}>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex space-x-2">
                      <button type="button" className="text-gray-400 hover:text-gray-600">
                        <Smile className="h-5 w-5" />
                      </button>
                      <button type="button" className="text-gray-400 hover:text-gray-600">
                        <Paperclip className="h-5 w-5" />
                      </button>
                    </div>
                    <Input
                      placeholder="Type a message..."
                      className="pl-14 pr-20 py-5 bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-blue-400"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                    />
                    <Button 
                      type="submit" 
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-4"
                      disabled={!messageInput.trim()}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      <span className="text-sm">Send</span>
                    </Button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#f8f9fa]">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-50 mb-4">
                  <MessageSquare className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
                <p className="text-gray-500 mb-6">
                  Select a conversation from the list or start a new one to begin messaging
                </p>
                <Button>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  New Message
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
