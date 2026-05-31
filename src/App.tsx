/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { Camera, Mic, MicOff, LogOut, Radio, Sun, Moon, Send } from 'lucide-react';
import { Message } from './types';

export default function App() {
  const [serverUrl, setServerUrl] = useState<string>(() => {
    const stored = localStorage.getItem('relay_server_url');
    if (stored) return stored;
    return window.location.origin;
  });
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [userName, setUserName] = useState('');
  const [joined, setJoined] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("All");
  const [isAsideOpen, setIsAsideOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages([]);
  }, [selectedRecipient]);

  // Dynamically manage connection when serverUrl changes
  useEffect(() => {
    const endpoint = serverUrl || window.location.origin;
    
    setConnectionStatus('connecting');
    const customSocket = io(endpoint, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
    });

    customSocket.on('connect', () => {
      setConnectionStatus('connected');
    });

    customSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    customSocket.on('connect_error', () => {
      setConnectionStatus('disconnected');
    });

    setSocket(customSocket);

    return () => {
      customSocket.disconnect();
    };
  }, [serverUrl]);

  // Handle packet subscriptions on active socket changes
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    };
    const handleUserList = (users: string[]) => {
      setOnlineUsers(users);
    };
    const handleJoinError = (err: string) => {
      alert(err);
    };

    socket.on('chat_message', handleChatMessage);
    socket.on('user_list', handleUserList);
    socket.on('join_error', handleJoinError);

    return () => {
      socket.off('chat_message', handleChatMessage);
      socket.off('user_list', handleUserList);
      socket.off('join_error', handleJoinError);
    };
  }, [socket]);

  const handleJoin = () => {
    if (!userName.trim() || !socket) return;
    socket.once('join_success', () => setJoined(true));
    socket.once('join_error', (err) => { alert(err); });
    socket.emit('join', userName);
  };

  const handleLogout = () => {
    if (socket) {
      socket.disconnect();
    }
    window.location.reload();
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (image?: string, audio?: string) => {
    if ((!input.trim() && !image && !audio) || !userName || !socket) return;
    const msg: Message = {
      id: Date.now().toString(),
      text: input,
      image,
      audio,
      sender: userName,
      recipient: selectedRecipient,
      timestamp: Date.now(),
    };
    socket.emit('chat_message', msg);
    setInput('');
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];
    mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
    mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
            sendMessage(undefined, reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
    };
    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        sendMessage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();
  
  const getUserColor = (name: string) => {
    return theme === 'dark' 
      ? 'bg-zinc-900 text-zinc-100 border border-zinc-800' 
      : 'bg-zinc-100 text-zinc-900 border border-zinc-200';
  };
  
  if (!joined) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-[100dvh] bg-black text-white p-6 font-sans"
      >
        <div className="w-full max-w-sm p-8 rounded-3xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col items-center text-center">
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-extrabold mb-2 tracking-wider font-display uppercase"
          >
            EPHEMERAL RELAY
          </motion.h1>
          <p className="text-zinc-500 text-xs tracking-widest font-display mb-10 uppercase">Minimalist Real-Time Chat</p>
          
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="Enter your name..."
            className="px-5 py-3.5 bg-zinc-900 text-zinc-100 rounded-2xl border border-zinc-800 focus:outline-none focus:ring-1 focus:ring-accent w-full mb-4 font-sans text-sm text-center placeholder-zinc-600"
          />
          <button
            onClick={handleJoin}
            className="px-8 py-3 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-all text-xs tracking-wider font-sans uppercase shadow-md active:scale-95 w-full mb-4"
          >
            Start Chat
          </button>

          {/* Collapsible Relay URL config for GitHub Pages deployment */}
          <div className="w-full text-left">
            <details className="group border border-zinc-900 rounded-2xl bg-zinc-950/20 px-3 py-2 text-zinc-500 select-none transition-all duration-300">
              <summary className="list-none flex items-center justify-between text-[11px] font-sans font-semibold tracking-wider cursor-pointer uppercase py-1 group-open:pb-2.5">
                <span>Relay Configuration</span>
                <span className="transition-transform group-open:rotate-180 text-[9px]">▼</span>
              </summary>
              <div className="space-y-2 pt-2 border-t border-zinc-900/60">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-zinc-600 font-sans font-semibold tracking-wider uppercase">Relay Server URL</label>
                  <input
                    type="text"
                    value={serverUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setServerUrl(val);
                      localStorage.setItem('relay_server_url', val);
                    }}
                    placeholder="e.g. http://localhost:3000"
                    className="px-3 py-2 bg-zinc-900/40 text-zinc-300 rounded-xl border border-zinc-900 focus:outline-none focus:ring-1 focus:ring-accent text-xs placeholder-zinc-700 font-mono"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-600">Status:</span>
                  <span className={`font-semibold uppercase tracking-widest text-[9px] ${connectionStatus === 'connected' ? 'text-emerald-500' : 'text-zinc-500 animate-pulse'}`}>
                    ● {connectionStatus}
                  </span>
                </div>
              </div>
            </details>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`flex flex-col h-[100dvh] ${theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'} font-sans antialiased overflow-hidden`}>
      {/* Top App Bar - Flat M3 Outlined Style */}
      <header className={`flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 ${theme === 'dark' ? 'bg-zinc-950 border-b border-zinc-900' : 'bg-white border-b border-zinc-200'} z-20`}>
        <div className="flex items-center gap-3">
          {/* Quick toggle sidebar for mobile */}
          <button 
            className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-accent transition-colors active:scale-95" 
            onClick={() => setIsAsideOpen(!isAsideOpen)}
            title="Toggle user list"
          >
            <Radio size={22} className={isAsideOpen ? "text-accent" : ""} />
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-full ${getUserColor(userName)} flex items-center justify-center font-bold text-xs`}>
              {getInitials(userName)}
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight font-display">{userName}</h1>
              <p className="text-[10px] text-zinc-500 font-sans tracking-wide uppercase">Active Recipient: <span className="text-accent font-semibold">{selectedRecipient}</span></p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 font-medium tracking-wide uppercase">
             <Radio size={14} className="text-emerald-500 mb-0.5" />
             <span>Live • {onlineUsers.length}</span>
          </div>
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
            className="text-zinc-400 hover:text-accent p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            title="Toggle theme"
          >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button 
            onClick={handleLogout} 
            className="text-zinc-400 hover:text-accent p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            title="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Backdrop overlay for mobile drawer */}
        <AnimatePresence>
          {isAsideOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAsideOpen(false)}
              className="md:hidden fixed inset-0 bg-black z-40"
            />
          )}
        </AnimatePresence>

        {/* Sidebar/Aside - Slide-out menu for mobile, static for desktop */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out
          ${isAsideOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
          md:translate-x-0 md:relative md:z-0 md:w-64 md:flex flex-col
          ${theme === 'dark' ? 'bg-zinc-950 border-r border-zinc-900' : 'bg-white border-r border-zinc-200'}
          p-5 space-y-5 flex flex-col h-full
        `}>
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-display">ONLINE USERS</h2>
            <button className="md:hidden text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-bold p-1" onClick={() => setIsAsideOpen(false)}>
              ✕
            </button>
          </div>

          <div 
            onClick={() => { setSelectedRecipient("All"); setIsAsideOpen(false); }}
            className={`cursor-pointer text-sm font-medium flex items-center gap-3 p-2.5 rounded-full transition-colors font-sans ${selectedRecipient === "All" ? 'text-white bg-accent font-bold' : theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-900 hover:text-white' : 'text-zinc-700 hover:bg-zinc-100 hover:text-black'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${selectedRecipient === 'All' ? 'bg-white/20 text-white' : theme === 'dark' ? 'bg-zinc-900 text-zinc-400' : 'bg-zinc-100 text-zinc-600'}`}>
              👥
            </div>
            <span>All Users</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {onlineUsers.filter(u => u !== userName).map((user) => (
              <div 
                key={user} 
                onClick={() => { setSelectedRecipient(user); setIsAsideOpen(false); }}
                className={`cursor-pointer text-sm font-medium flex items-center gap-3 p-2 rounded-full transition-colors font-sans ${selectedRecipient === user ? 'text-white bg-accent font-semibold' : theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-900 hover:text-white' : 'text-zinc-700 hover:bg-zinc-100 hover:text-black'}`}
              >
                <div className={`w-8 h-8 rounded-full ${getUserColor(user)} flex items-center justify-center text-xs font-semibold`}>
                  {getInitials(user)}
                </div>
                <span className="truncate">{user}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-900 space-y-2 font-sans">
             <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium uppercase">
                <span>Live Presence</span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-zinc-400 font-semibold">{onlineUsers.length} online</span>
                </div>
             </div>
             
             {/* Dynamic Relay Server connection display */}
             <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-900 w-full space-y-1">
               <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium uppercase">
                 <span>Relay Server</span>
                 <span className={`font-bold text-[10px] uppercase tracking-wider ${connectionStatus === 'connected' ? 'text-emerald-500' : 'text-accent animate-pulse'}`}>
                   {connectionStatus}
                 </span>
               </div>
               <p className="text-[10px] text-zinc-400 font-mono truncate bg-zinc-100 dark:bg-zinc-900 px-2 py-1.5 rounded-lg border border-zinc-200/40 dark:border-zinc-800" title={serverUrl}>
                 {serverUrl}
               </p>
             </div>
          </div>
        </aside>
        
        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="max-w-4xl mx-auto w-full space-y-4">
            <AnimatePresence>
              {messages.length === 0 ? (
                <div className="h-[40vh] flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                  <span className="text-3xl mb-3 opacity-40">💬</span>
                  <p className="text-sm font-sans">No messages yet with {selectedRecipient === 'All' ? 'everyone' : selectedRecipient}.</p>
                  <p className="text-xs text-zinc-600 mt-1">Start the conversation by sending a direct message.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${msg.sender === userName ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex gap-2.5 max-w-[85%] sm:max-w-[70%] ${
                        msg.sender === userName
                          ? 'flex-row-reverse'
                          : 'flex-row'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full ${getUserColor(msg.sender)} flex-shrink-0 flex items-center justify-center text-xs font-semibold`}>
                        {getInitials(msg.sender)}
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className={`text-[10px] text-zinc-500 font-sans tracking-wide ${msg.sender === userName ? 'text-right' : 'text-left'}`}>
                          {msg.sender === userName ? 'You' : msg.sender} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div
                          className={`p-3.5 rounded-2xl ${
                            msg.sender === userName
                              ? 'bg-accent text-white rounded-tr-none shadow-sm'
                              : theme === 'dark'
                                ? 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-none'
                                : 'bg-white text-zinc-900 rounded-tl-none border border-zinc-200 shadow-sm'
                          }`}
                        >
                          {msg.image && (
                            <img 
                              src={msg.image} 
                              className="rounded-xl mb-2 max-w-full overflow-hidden object-cover border border-zinc-200/10 shadow-inner max-h-60" 
                              alt="Shared media" 
                              referrerPolicy="no-referrer" 
                            />
                          )}
                          {msg.audio && (
                            <div className="my-1.5">
                              <audio src={msg.audio} controls className="max-w-full w-48 sm:w-64 h-8 scale-95" />
                            </div>
                          )}
                          {msg.text && (
                            <p className="font-sans text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      {/* Footer / Input Controller */}
      <footer className={`p-4 sm:p-6 ${theme === 'dark' ? 'bg-zinc-950/60 backdrop-blur-md border-t border-zinc-900' : 'bg-white/85 backdrop-blur-md border-t border-zinc-200'}`}>
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          {/* Outlined M3 container for text inputs and actions */}
          <div className={`flex-1 flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl border ${
            theme === 'dark' 
              ? 'bg-zinc-900/40 border-zinc-800 focus-within:border-accent' 
              : 'bg-zinc-100/40 border-zinc-200 focus-within:border-accent'
          } transition-all duration-200`}>
            
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 sm:p-2 text-zinc-400 hover:text-accent active:scale-90 transition-all flex-shrink-0"
              title="Share Image"
            >
              <Camera size={18} />
            </button>

            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-1.5 sm:p-2 transition-all active:scale-90 flex-shrink-0 ${isRecording ? 'text-accent animate-pulse' : 'text-zinc-400 hover:text-accent'}`}
              title="Voice Note"
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <div className={`h-5 w-[1px] ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-300'} mx-0.5 sm:mx-1`} />

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-sm py-1 font-sans placeholder-zinc-500 text-inherit"
            />
          </div>

          <button
            onClick={() => sendMessage()}
            className="flex-shrink-0 p-3 bg-accent text-white rounded-full font-medium hover:bg-accent-hover active:scale-95 transition-colors shadow-sm flex items-center justify-center min-w-[44px] min-h-[44px]"
            title="Send Message"
          >
            <Send size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
}


