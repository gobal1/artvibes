import React, { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';

export default function ChatModal({ targetUser, auth, onClose, onMessageSent }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
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
  const getTargetUserId = () => {
    return targetUser?.idUser || targetUser?.id || targetUser?.user_id;
  };

  // Fetch existing messages
  useEffect(() => {
    if (!getAuthUserId() || !getTargetUserId()) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages/conversation/${getTargetUserId()}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          credentials: 'include', // Include cookies for Sanctum
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(Array.isArray(data) ? data : []);
          // Mark messages as read
          await fetch(`/api/messages/read/${getTargetUserId()}`, {
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
  }, [getAuthUserId()]);

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
        credentials: 'include', // Include cookies for Sanctum
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
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.idmessages !== newMessage.idmessages));
      alert('Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
      <div className="bg-white text-neutral-900 border-4 border-neutral-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg h-[600px] flex flex-col">
        
        {/* Header */}
        <div className="bg-neutral-950 text-white p-4 border-b-4 border-neutral-950 flex justify-between items-center">
          <div>
            <h2 className="font-black text-sm uppercase">Chat dengan {targetUser?.name}</h2>
            <p className="text-[10px] text-neutral-400">@{targetUser?.email?.split('@')[0]}</p>
          </div>
          <button 
            onClick={onClose}
            className="bg-neutral-800 hover:bg-neutral-700 text-white p-2 border border-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-neutral-400 font-mono text-xs">Memuat pesan...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-neutral-400 font-mono text-xs mb-2">Belum ada pesan</p>
                <p className="text-neutral-300 font-mono text-[10px]">Mulai percakapan dengan mengirim pesan pertama</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === auth?.user?.id;
              const senderName = msg.sender?.name || (isOwn ? 'Anda' : targetUser?.name || 'Unknown');
              
              return (
                <div
                  key={msg.idmessages}
                  className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                >
                  <p className="text-[9px] text-neutral-500 mb-1 px-2">
                    {senderName}
                  </p>
                  <div
                    className={`max-w-[80%] p-3 border-2 border-neutral-950 ${
                      isOwn
                        ? 'bg-emerald-100 text-neutral-900 shadow-[2px_2px_0px_0px_rgba(16,185,129,0.5)]'
                        : 'bg-white text-neutral-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]'
                    }`}
                  >
                    <p className="text-xs font-mono break-words">{msg.messages_text}</p>
                    <p className="text-[9px] text-neutral-500 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="border-t-4 border-neutral-950 p-3 bg-white flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ketik pesan..."
            className="flex-1 border-2 border-neutral-950 px-3 py-2 font-mono text-xs focus:outline-none bg-neutral-50 placeholder-neutral-400"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || sending}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-300 text-white border-2 border-neutral-950 p-2 font-black uppercase transition cursor-pointer flex items-center gap-1 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
          >
            <Send size={14} />
            {sending ? 'Kirim...' : 'Kirim'}
          </button>
        </form>
      </div>
    </div>
  );
}
