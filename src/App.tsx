/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { Camera, Mic, MicOff, LogOut, Radio, Sun, Moon } from 'lucide-react';
import { Message } from './types';

const socket: Socket = io();

export default function App() {
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

  useEffect(() => {
    socket.on('chat_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });
    socket.on('user_list', (users: string[]) => {
      setOnlineUsers(users);
    });
    socket.on('join_error', (err) => { alert(err); });

    return () => {
      socket.off('chat_message');
      socket.off('user_list');
      socket.off('join_error');
    };
  }, []);

  const handleJoin = () => {
    if (!userName.trim()) return;
    socket.once('join_success', () => setJoined(true));
    socket.once('join_error', (err) => { alert(err); });
    socket.emit('join', userName);
  };

  const handleLogout = () => {
    socket.disconnect();
    window.location.reload();
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (image?: string, audio?: string) => {
    if ((!input.trim() && !image && !audio) || !userName) return;
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
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
    return colors[name.length % colors.length];
  };
  
  if (!joined) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-screen bg-black text-white p-4 font-sans bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black"
      >
        <motion.h1 
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-4xl font-semibold mb-12 tracking-tight"
        >
          Ephemeral Relay
        </motion.h1>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Enter your name..."
          className="px-6 py-4 bg-zinc-900 rounded-2xl border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-sm mb-6"
        />
        <button
          onClick={handleJoin}
          className="px-8 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-500 transition text-sm font-semibold"
        >
          Start Chat
        </button>
      </motion.div>
    );
  }

  return (
    <div className={`flex flex-col h-screen ${theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'} font-sans`}>
      <header className={`flex items-center justify-between p-4 sm:p-6 ${theme === 'dark' ? 'bg-zinc-950' : 'bg-white border-b border-zinc-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${getUserColor(userName)} flex items-center justify-center font-semibold text-white`}>
            {getInitials(userName)}
          </div>
          <h1 className="text-lg font-semibold tracking-tight">{userName}</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button className="md:hidden" onClick={() => setIsAsideOpen(!isAsideOpen)}>
            <Radio size={20} />
          </button>
          <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-400 font-medium tracking-wide uppercase">
             <Radio size={14} className="text-emerald-500 mb-0.5" />
             <span>Live • {onlineUsers.length}</span>
          </div>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="text-zinc-500 hover:text-blue-500 p-1">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={handleLogout} className="text-zinc-500 hover:text-red-400 p-1">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className={`${isAsideOpen ? 'absolute inset-0 z-10 w-full bg-inherit' : 'hidden'} md:flex md:w-64 flex-col ${theme === 'dark' ? 'border-r border-zinc-900' : 'border-r border-zinc-200'} p-4 sm:p-6 space-y-4`}>
          <h2 className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Online Users</h2>
          <div 
            onClick={() => { setSelectedRecipient("All"); setIsAsideOpen(false); }}
            className={`cursor-pointer text-sm font-medium flex items-center gap-3 ${selectedRecipient === "All" ? 'text-blue-500' : theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}
          >
            All Users
          </div>
          {onlineUsers.filter(u => u !== userName).map((user) => (
            <div 
              key={user} 
              onClick={() => { setSelectedRecipient(user); setIsAsideOpen(false); }}
              className={`cursor-pointer text-sm font-medium flex items-center gap-3 ${selectedRecipient === user ? 'text-blue-500' : theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}
            >
              <div className={`w-8 h-8 rounded-full ${getUserColor(user)} flex items-center justify-center text-xs font-semibold text-white`}>
                {getInitials(user)}
              </div>
              {user}
            </div>
          ))}
        </aside>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="max-w-4xl mx-auto w-full space-y-6">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex ${msg.sender === userName ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`flex gap-3 max-w-[85%] sm:max-w-[70%]  ${
                    msg.sender === userName
                      ? 'flex-row-reverse'
                      : 'flex-row'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full ${getUserColor(msg.sender)} flex-shrink-0 flex items-center justify-center text-xs font-semibold text-white`}>
                    {getInitials(msg.sender)}
                  </div>
                  <div
                    className={`p-3 sm:p-4 rounded-3xl ${
                      msg.sender === userName
                        ? 'bg-blue-600 text-white rounded-bl-none shadow-md'
                        : theme === 'dark'
                          ? 'bg-zinc-800 text-zinc-100 rounded-br-none'
                          : 'bg-white text-zinc-900 rounded-br-none border border-zinc-200 shadow-sm'
                    }`}
                  >
                    {msg.image && <img src={msg.image} className="rounded-lg mb-2 max-w-full" alt="chat" />}
                    {msg.audio && <audio src={msg.audio} controls className="my-2" />}
                    <p className="font-sans text-sm">{msg.text}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={chatEndRef} />
          </div>
        </div>
      </div>


      <footer className={`p-4 sm:p-6 ${theme === 'dark' ? 'bg-zinc-950' : 'bg-white border-t border-zinc-200'}`}>
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 sm:p-3 text-zinc-500 hover:text-blue-400 transition"
          >
            <Camera size={20} />
          </button>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-2 sm:p-3 transition ${isRecording ? 'text-red-500 animate-pulse' : 'text-zinc-500 hover:text-blue-400'}`}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className={`flex-1 px-4 sm:px-5 py-2 sm:py-3 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'} rounded-full border focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm`}
          />
          <button
            onClick={() => sendMessage()}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-500 transition text-sm"
          >
            Send
          </button>
        </div>
      </footer>
    </div>
  );
}


