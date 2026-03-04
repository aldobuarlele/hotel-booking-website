'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Calendar, Users, Search, Loader2, User, Hotel, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import AdminChatRoom from '@/components/AdminChatRoom';

type ChatSession = {
  room_id: number;
  user_id: string;
  room_name: string;
  room_status: 'AVAILABLE' | 'TEMPORARILY_RESERVED' | 'INQUIRY_ONLY';
  last_message: string;
  last_message_time: string;
  message_count: number;
  is_admin_responded: boolean;
};

type Room = {
  id: number;
  name: string;
  status: 'AVAILABLE' | 'TEMPORARILY_RESERVED' | 'INQUIRY_ONLY';
};

export default function AdminChatsPage() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState<{ roomId: number; userId: string; roomName: string } | null>(null);

  useEffect(() => {
    fetchChatSessions();

    // Subscribe to new chat messages with unique channel name
    const channelName = 'admin_chats_dashboard';
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          fetchChatSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchChatSessions = async () => {
    try {
      setLoading(true);

      // Fetch all chat messages with room information
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select(`
          *,
          rooms (
            name,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Group messages by room_id and user_id
      const sessionsMap = new Map<string, ChatSession>();

      messages?.forEach((msg: any) => {
        const key = `${msg.room_id}-${msg.user_id}`;
        
        if (!sessionsMap.has(key)) {
          sessionsMap.set(key, {
            room_id: msg.room_id,
            user_id: msg.user_id,
            room_name: msg.rooms?.name || `Room #${msg.room_id}`,
            room_status: msg.rooms?.status || 'TEMPORARILY_RESERVED',
            last_message: msg.message,
            last_message_time: msg.created_at,
            message_count: 1,
            is_admin_responded: msg.user_id === 'admin',
          });
        } else {
          const session = sessionsMap.get(key)!;
          session.message_count += 1;
          // Update last message if this message is newer
          if (new Date(msg.created_at) > new Date(session.last_message_time)) {
            session.last_message = msg.message;
            session.last_message_time = msg.created_at;
            session.is_admin_responded = msg.user_id === 'admin';
          }
        }
      });

      // Convert map to array and sort by last message time
      const sessions = Array.from(sessionsMap.values())
        .sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());

      setChatSessions(sessions);
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomReleased = (roomId: number) => {
    // Refresh chat sessions after room is released
    fetchChatSessions();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      return 'Baru saja';
    } else if (diffHours < 24) {
      return `${diffHours} jam lalu`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} hari lalu`;
    }
  };

  const filteredSessions = chatSessions.filter(session =>
    session.room_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSessions = filteredSessions.filter(s => s.room_status === 'TEMPORARILY_RESERVED');
  const inactiveSessions = filteredSessions.filter(s => s.room_status !== 'TEMPORARILY_RESERVED');

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Live Chat Sessions</h1>
        <p className="text-gray-600">Kelola percakapan dengan customer untuk soft booking kamar.</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="search"
            placeholder="Cari berdasarkan nama kamar, user ID, atau pesan..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Sesi Chat</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chatSessions.length}</div>
            <p className="text-sm text-gray-500">Percakapan aktif & selesai</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Chat Aktif</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSessions.length}</div>
            <p className="text-sm text-gray-500">Kamar sementara dipesan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Menunggu Balasan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeSessions.filter(s => !s.is_admin_responded).length}
            </div>
            <p className="text-sm text-gray-500">Belum ada respon admin</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Pesan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {chatSessions.reduce((sum, session) => sum + session.message_count, 0)}
            </div>
            <p className="text-sm text-gray-500">Semua pesan dalam sistem</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Chat Sessions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Chat Aktif</h2>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            {activeSessions.length} kamar sementara dipesan
          </Badge>
        </div>

        {activeSessions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada chat aktif</h3>
              <p className="text-gray-500 text-center max-w-md">
                Semua kamar tersedia atau tidak ada customer yang sedang melakukan soft booking.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSessions.map((session) => (
              <Card 
                key={`${session.room_id}-${session.user_id}`}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  !session.is_admin_responded ? 'border-l-4 border-l-yellow-500' : ''
                }`}
                onClick={() => setSelectedChat({
                  roomId: session.room_id,
                  userId: session.user_id,
                  roomName: session.room_name
                })}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{session.room_name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={session.room_status === 'TEMPORARILY_RESERVED' ? 'secondary' : 'outline'}>
                          {session.room_status === 'TEMPORARILY_RESERVED' ? 'Sementara Dipesan' : session.room_status}
                        </Badge>
                        {!session.is_admin_responded && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Menunggu Balasan
                          </Badge>
                        )}
                      </div>
                    </div>
                    <MessageSquare className="h-5 w-5 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-3 w-3" />
                      <span className="font-mono text-xs">User ID: {session.user_id.substring(0, 12)}...</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p className="font-medium mb-1">Pesan terakhir:</p>
                      <p className="text-gray-600 truncate">{session.last_message}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimeAgo(session.last_message_time)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-3 w-3" />
                        <span>{session.message_count} pesan</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" size="sm">
                    Buka Chat
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Inactive Chat Sessions */}
      {inactiveSessions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Riwayat Chat</h2>
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
              {inactiveSessions.length} chat selesai
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactiveSessions.map((session) => (
              <Card 
                key={`${session.room_id}-${session.user_id}`}
                className="opacity-75 hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => setSelectedChat({
                  roomId: session.room_id,
                  userId: session.user_id,
                  roomName: session.room_name
                })}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{session.room_name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">
                          {session.room_status === 'AVAILABLE' ? 'Tersedia' : 'Inquiry Only'}
                        </Badge>
                      </div>
                    </div>
                    <MessageSquare className="h-5 w-5 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-3 w-3" />
                      <span className="font-mono text-xs">User ID: {session.user_id.substring(0, 12)}...</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p className="font-medium mb-1">Pesan terakhir:</p>
                      <p className="text-gray-600 truncate">{session.last_message}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimeAgo(session.last_message_time)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-3 w-3" />
                        <span>{session.message_count} pesan</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Chat Room Modal */}
      {selectedChat && (
        <AdminChatRoom
          roomId={selectedChat.roomId}
          userId={selectedChat.userId}
          roomName={selectedChat.roomName}
          onClose={() => setSelectedChat(null)}
          onRoomReleased={handleRoomReleased}
        />
      )}
    </div>
  );
}