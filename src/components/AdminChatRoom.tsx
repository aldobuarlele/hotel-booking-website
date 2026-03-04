'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, X, Loader2, User, CheckCircle, AlertCircle } from 'lucide-react';

type ChatMessage = {
  id: number;
  room_id: number;
  user_id: string;
  message: string;
  created_at: string;
};

type Room = {
  id: number;
  name: string;
  status: 'AVAILABLE' | 'TEMPORARILY_RESERVED' | 'INQUIRY_ONLY';
};

type AdminChatRoomProps = {
  roomId: number;
  userId: string;
  roomName: string;
  onClose: () => void;
  onRoomReleased: (roomId: number) => void;
};

export default function AdminChatRoom({ roomId, userId, roomName, onClose, onRoomReleased }: AdminChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [roomStatus, setRoomStatus] = useState<'AVAILABLE' | 'TEMPORARILY_RESERVED' | 'INQUIRY_ONLY'>('TEMPORARILY_RESERVED');
  const [releasing, setReleasing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time messages
  useEffect(() => {
    fetchMessages();
    fetchRoomStatus();

    const channelName = `admin_chat_room_${roomId}_user_${userId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
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
        .from('chat_messages')
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

  const fetchRoomStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('status')
        .eq('id', roomId)
        .single();

      if (error) throw error;
      setRoomStatus(data.status);
    } catch (error) {
      console.error('Error fetching room status:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageToSend = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          user_id: 'admin',
          message: messageToSend,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Gagal mengirim pesan. Silakan coba lagi.');
      setNewMessage(messageToSend); // Restore the message
    } finally {
      setSending(false);
    }
  };

  const releaseRoom = async () => {
    if (!confirm('Apakah Anda yakin ingin menyelesaikan chat dan melepas kamar? Kamar akan kembali tersedia untuk booking.')) {
      return;
    }

    setReleasing(true);
    try {
      // Update room status to AVAILABLE
      const { error } = await supabase
        .from('rooms')
        .update({ status: 'AVAILABLE' })
        .eq('id', roomId);

      if (error) throw error;

      setRoomStatus('AVAILABLE');
      onRoomReleased(roomId);
      
      alert('Kamar berhasil dilepas dan sekarang tersedia untuk booking.');
    } catch (error) {
      console.error('Error releasing room:', error);
      alert('Gagal melepas kamar. Silakan coba lagi.');
    } finally {
      setReleasing(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl">
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
      <Card className="w-full max-w-2xl h-[80vh] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Chat Room - {roomName}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  roomStatus === 'TEMPORARILY_RESERVED' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : roomStatus === 'AVAILABLE'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {roomStatus === 'TEMPORARILY_RESERVED' ? 'Sementara Dipesan' : 
                   roomStatus === 'AVAILABLE' ? 'Tersedia' : 'Inquiry Only'}
                </div>
                <span className="text-sm text-gray-500">
                  User ID: {userId.substring(0, 8)}...
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
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
                  <p className="text-sm">Mulai percakapan dengan customer</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isAdmin = msg.user_id === 'admin';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        isAdmin
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-800 rounded-bl-none'
                      }`}
                    >
                      <div className="text-sm">{msg.message}</div>
                      <div className="flex items-center justify-between mt-1">
                        <div
                          className={`text-xs ${
                            isAdmin ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {formatTime(msg.created_at)}
                        </div>
                        <div className="text-xs opacity-75 ml-2">
                          {isAdmin ? 'Admin' : 'Customer'}
                        </div>
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
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              placeholder="Ketik balasan..."
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
          
          {/* Release Room Button */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {roomStatus === 'TEMPORARILY_RESERVED' ? (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span>Kamar sementara dipesan oleh customer ini.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Kamar tersedia untuk booking.</span>
                  </div>
                )}
              </div>
              <Button
                onClick={releaseRoom}
                disabled={releasing || roomStatus === 'AVAILABLE'}
                variant={roomStatus === 'TEMPORARILY_RESERVED' ? 'default' : 'outline'}
                className={`${
                  roomStatus === 'TEMPORARILY_RESERVED' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : ''
                }`}
              >
                {releasing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : roomStatus === 'TEMPORARILY_RESERVED' ? (
                  <CheckCircle className="mr-2 h-4 w-4" />
                ) : null}
                {roomStatus === 'TEMPORARILY_RESERVED' 
                  ? 'Selesaikan Chat & Bebaskan Kamar' 
                  : 'Kamar Sudah Tersedia'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}