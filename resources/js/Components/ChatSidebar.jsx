import React, { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';

export default function ChatSidebar({ targetUser, auth, isOpen, onClose, onMessageSent, conversations = [], onConversationSelect, loadingConversations = false }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedConvUser, setSelectedConvUser] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get auth user ID - handle multiple field possibilities
  const getAuthUserId = () => {
    return auth?.user?.idUser || auth?.user?.id;
  };

  // Get target user ID - handle multiple field possibilities
  const selectedUser = selectedConvUser || targetUser;
  const getTargetUserId = () => {
    return selectedUser?.idUser || selectedUser?.id || selectedUser?.user_id;
  };

  useEffect(() => {
    if (targetUser && !selectedConvUser) {
      setSelectedConvUser(targetUser);
    }
  }, [targetUser, selectedConvUser]);

  useEffect(() => {
    if (!selectedConvUser && conversations && conversations.length > 0) {
      setSelectedConvUser(conversations[0].other_user);
    }
  }, [conversations, selectedConvUser]);

  // Fetch existing messages
  useEffect(() => {
    const authUserId = getAuthUserId();
    const targetUserId = getTargetUserId();
    
    if (!isOpen || !authUserId || !targetUserId) {
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages/conversation/${targetUserId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(Array.isArray(data) ? data : []);
          // Mark messages as read
          await fetch(`/api/messages/read/${targetUserId}`, {
            method: 'PUT',
            headers: {
              'Accept': 'application/json',
              'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
            credentials: 'include',
          });
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [auth?.user?.idUser, auth?.user?.id, selectedConvUser?.idUser, selectedConvUser?.id, targetUser?.idUser, targetUser?.id, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setSending(true);
    const messageText = inputMessage;
    setInputMessage('');

    // Optimistic UI update
    const newMessage = {
      idmessages: Date.now(),
      sender_id: getAuthUserId(),
      sender: auth.user,
      receiver_id: getTargetUserId(),
      messages_text: messageText,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setMessages([...messages, newMessage]);

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        credentials: 'include',
        body: JSON.stringify({
          receiver_id: getTargetUserId(),
          messages_text: messageText,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update with server response
        setMessages(prev => prev.map(msg => 
          msg.idmessages === newMessage.idmessages ? data.message : msg
        ));
        onMessageSent && onMessageSent(data.message);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages(prev => prev.filter(msg => msg.idmessages !== newMessage.idmessages));
      alert('Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />
      
      {/* Chat Overlay */}
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl text-white shadow-2xl z-50 flex flex-col border border-white/10">
        
        {/* Header */}
        <div className="bg-linear-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-md text-white p-4 flex justify-between items-center shrink-0 border-b border-white/10">
          <div>
            <h2 className="font-black text-sm uppercase">💬 Chat Konsultasi</h2>
            <p className="text-[10px] text-slate-300">
              {selectedConvUser?.name || targetUser?.name || 'Loading...'}
            </p>
          </div>
          <button 
            onClick={() => {
              if (selectedConvUser) {
                setSelectedConvUser(null);
                setMessages([]);
              } else {
                onClose && onClose();
              }
            }}
            className="bg-white/10 hover:bg-white/20 text-white p-2 border border-white/20 rounded-lg transition backdrop-blur-sm"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-900/40 backdrop-blur-sm">
          <div className="lg:w-80 w-full border-r-0 lg:border-r border-white/10 overflow-y-auto bg-slate-800/40 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-4 gap-3">
              <div>
                <h3 className="font-black uppercase text-xs text-white">Daftar Chat</h3>
                <p className="text-[10px] text-slate-400">Pilih pengguna untuk obrolan</p>
              </div>
              <button
                onClick={() => {
                  setSelectedConvUser(null);
                  setMessages([]);
                }}
                className="text-[10px] uppercase tracking-widest text-slate-400 hover:text-emerald-300 transition"
              >
                Bersihkan
              </button>
            </div>

            <div className="space-y-3">
              {loadingConversations ? (
                <div className="flex items-center justify-center py-12 text-slate-400 text-[10px]">Memuat percakapan...</div>
              ) : conversations && conversations.length > 0 ? (
                conversations.map((conv) => (
                  <button
                    key={conv.other_user_id}
                    onClick={() => {
                      setSelectedConvUser(conv.other_user);
                      setLoading(true);
                      onConversationSelect && onConversationSelect(conv.other_user);
                    }}
                    className={`w-full text-left p-3 border rounded-lg backdrop-blur-sm transition ${selectedConvUser?.idUser === conv.other_user?.idUser || selectedConvUser?.id === conv.other_user?.id ? 'border-emerald-400 bg-emerald-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:border-emerald-400'}`}
                  >
                    <div className="flex justify-between gap-3 items-start">
                      <div className="flex-1">
                        <p className="font-black text-xs uppercase truncate">{conv.other_user?.name || 'Unknown'}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-1">
                          {conv.last_message ? conv.last_message.substring(0, 35) + '...' : 'Tidak ada pesan'}
                        </p>
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[9px] font-black">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-12 text-slate-400 text-[10px]">Belum ada percakapan aktif.</div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-linear-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-md text-white p-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="font-black text-sm uppercase">💬 Obrolan Langsung</h2>
                <p className="text-[10px] text-slate-300">
                  {selectedUser?.name ? `Chatting dengan ${selectedUser.name}` : 'Pilih pengguna untuk memulai obrolan.'}
                </p>
              </div>
              <button
                onClick={() => onClose && onClose()}
                className="bg-white/10 hover:bg-white/20 text-white p-2 border border-white/20 rounded-lg transition backdrop-blur-sm"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-linear-to-b from-slate-900/20 to-slate-800/20 backdrop-blur-sm">
              {loading ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-[10px]">Memuat pesan...</div>
              ) : !selectedUser ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-[10px]">Pilih pengguna di panel kiri.</div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-[10px]">Belum ada pesan di percakapan ini.</div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender_id === (auth?.user?.idUser || auth?.user?.id);
                  const senderName = msg.sender?.name || (isOwn ? 'Anda' : selectedUser?.name || 'Unknown');

                  return (
                    <div key={msg.idmessages} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                      <p className="text-[9px] text-slate-400 mb-1 px-2">{senderName}</p>
                      <div className={`max-w-[85%] p-3 rounded-2xl border backdrop-blur-sm ${isOwn ? 'bg-emerald-500/30 text-white border-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.2)]' : 'bg-white/10 text-slate-200 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]'}`}>
                        <p className="text-xs font-mono wrap-break-word">{msg.messages_text}</p>
                        <p className="text-[9px] text-slate-400 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="border-t border-white/10 p-3 bg-slate-800/40 backdrop-blur-md flex gap-2 shrink-0">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ketik pesan..."
                className="flex-1 border border-white/20 px-3 py-2 font-mono text-xs focus:outline-none bg-white/10 backdrop-blur-sm placeholder-slate-400 text-white rounded-lg focus:border-emerald-400 focus:bg-white/15 transition"
                disabled={sending || !selectedUser}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || sending || !selectedUser}
                className="bg-emerald-500/80 hover:bg-emerald-500 disabled:bg-slate-600 text-white border border-emerald-400 p-2 font-black uppercase transition cursor-pointer flex items-center gap-1 text-xs rounded-lg shadow-[0_0_20px_rgba(52,211,153,0.3)] disabled:shadow-none"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
