'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getOrCreateAnonymousUserId } from '@/lib/utils';
import { DEFAULT_LOCALE, DB_TABLES, ERROR_MESSAGES } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, X, Loader2, User } from 'lucide-react';

type ChatMessage = {
  id: number;
  room_id: number;
  user_id: string;
  message: string;
  created_at: string;
};

type ChatRoomProps = {
  roomId: number;
  roomName: string;
  onClose: () => void;
};

export default function ChatRoom({ roomId, roomName, onClose }: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userId] = useState(() => getOrCreateAnonymousUserId());

  // Subscribe to real-time messages
  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`chat_room_${roomId}_user_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: DB_TABLES.CHAT_MESSAGES,
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, userId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from(DB_TABLES.CHAT_MESSAGES)
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageToSend = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const { error } = await supabase
        .from(DB_TABLES.CHAT_MESSAGES)
        .insert({
          room_id: roomId,
          user_id: userId,
          message: messageToSend,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      alert(ERROR_MESSAGES.SEND_MESSAGE_FAILED);
      setNewMessage(messageToSend); // Restore the message
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(DEFAULT_LOCALE, { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Chat Room - {roomName}</span>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg h-[80vh] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Chat Room - {roomName}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            User ID: {userId.substring(0, 8)}...
          </p>
        </CardHeader>

        <CardContent className="flex-grow overflow-hidden p-0">
          {/* Messages Container */}
          <div className="h-full overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="font-medium">Belum ada pesan</p>
                  <p className="text-sm">Mulai percakapan dengan admin</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isCurrentUser = msg.user_id === userId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        isCurrentUser
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-800 rounded-bl-none'
                      }`}
                    >
                      <div className="text-sm">{msg.message}</div>
                      <div
                        className={`text-xs mt-1 ${
                          isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {formatTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Ketik pesan..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={sending}
              className="flex-grow"
            />
            <Button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Tekan Enter untuk mengirim
          </p>
        </div>
      </Card>
    </div>
  );
}