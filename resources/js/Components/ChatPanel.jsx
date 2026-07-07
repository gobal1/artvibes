import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User, ArrowLeft } from 'lucide-react';

/**
 * ChatPanel - Integrated chat for header
 * Shows: Conversations List → Chat with person → View profile
 */
const ChatPanel = ({ auth = {}, isOpen, onClose, navigateTo }) => {
  const [view, setView] = useState('conversations'); // 'conversations', 'chat', 'profile'
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
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

  // Load conversations
  useEffect(() => {
    if (!isOpen || !auth?.user?.idUser) {
      setLoading(false);
      return;
    }

    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/messages/conversations', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setConversations(data.conversations || data || []);
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [isOpen, auth?.user?.idUser]);

  // Load messages when user selected
  useEffect(() => {
    if (view !== 'chat' || !selectedUser) return;

    const fetchMessages = async () => {
      try {
        const userId = selectedUser.idUser || selectedUser.id;
        const response = await fetch(`/api/messages/conversation/${userId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(Array.isArray(data) ? data : []);

          // Mark as read
          await fetch(`/api/messages/read/${userId}`, {
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
      }
    };

    fetchMessages();
  }, [view, selectedUser]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedUser) return;

    setSending(true);
    const messageText = inputMessage;
    setInputMessage('');

    const userId = selectedUser.idUser || selectedUser.id;

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
          receiver_id: userId,
          messages_text: messageText,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data.message]);
      } else {
        alert('Gagal mengirim pesan');
        setInputMessage(messageText);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Error: ' + err.message);
      setInputMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white text-neutral-900 border-l-4 border-neutral-950 shadow-lg z-50 flex flex-col max-h-screen">
        
        {/* Header */}
        <div className="bg-neutral-950 text-white p-4 border-b-4 border-neutral-950 flex justify-between items-center shrink-0">
          <h2 className="font-black text-sm uppercase">
            {view === 'conversations' && '💬 Chat Pesanan'}
            {view === 'chat' && `💬 ${selectedUser?.name || 'Chat'}`}
          </h2>
          <button 
            onClick={() => {
              if (view === 'chat') {
                setView('conversations');
                setSelectedUser(null);
                setMessages([]);
              } else {
                onClose();
              }
            }}
            className="bg-neutral-800 hover:bg-neutral-700 text-white p-2 border border-white transition"
          >
            {view === 'conversations' ? <X size={18} /> : <ArrowLeft size={18} />}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          
          {/* CONVERSATIONS LIST VIEW */}
          {view === 'conversations' && (
            <div className="p-4 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-neutral-400 font-mono text-xs">Loading...</p>
                </div>
              ) : conversations && conversations.length > 0 ? (
                conversations.map((conv) => (
                  <button
                    key={conv.other_user_id || conv.other_user?.id}
                    onClick={() => {
                      setSelectedUser(conv.other_user);
                      setView('chat');
                    }}
                    className="w-full bg-white border-2 border-neutral-950 p-3 text-left hover:bg-amber-50 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-xs uppercase truncate">
                          {conv.other_user?.name || 'Unknown'}
                        </p>
                        <p className="text-[10px] text-neutral-600 truncate mt-1">
                          {conv.last_message ? conv.last_message.substring(0, 50) + '...' : 'No messages'}
                        </p>
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[9px] font-black shrink-0">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-6 text-center text-neutral-400 font-mono text-xs">
                  Belum ada percakapan
                </div>
              )}
            </div>
          )}

          {/* CHAT VIEW */}
          {view === 'chat' && selectedUser && (
            <div className="flex flex-col h-full">
              {/* Profile card */}
              <div className="bg-amber-50 border-b-2 border-neutral-200 p-3 flex justify-between items-center">
                <div>
                  <p className="font-black text-xs uppercase">{selectedUser.name}</p>
                  <p className="text-[10px] text-neutral-600 font-mono">{selectedUser.email}</p>
                </div>
                <button
                  onClick={() => {
                    // Navigate to user profile page like explore popup does
                    window.location.href = `/user/${selectedUser.idUser || selectedUser.id}`;
                  }}
                  className="bg-neutral-950 text-white p-2 rounded hover:bg-neutral-800 transition"
                >
                  <User size={16} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-neutral-50">
                {messages.map((msg, idx) => {
                  const isOwn = msg.sender_id === (auth?.user?.idUser || auth?.user?.id);
                  return (
                    <div key={msg.idmessages || idx} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-3 py-2 rounded-lg text-xs ${
                        isOwn 
                          ? 'bg-neutral-950 text-white border border-neutral-950' 
                          : 'bg-white border-2 border-neutral-200'
                      }`}>
                        <p className="break-words">{msg.messages_text}</p>
                        <p className={`text-[9px] mt-1 ${isOwn ? 'text-neutral-400' : 'text-neutral-500'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('id-ID', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="border-t-2 border-neutral-200 p-3 bg-white flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ketik pesan..."
                  className="flex-1 border-2 border-neutral-200 px-3 py-2 text-xs rounded focus:border-neutral-950 outline-none"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !inputMessage.trim()}
                  className="bg-neutral-950 text-white p-2 rounded hover:bg-neutral-800 transition disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatPanel;
