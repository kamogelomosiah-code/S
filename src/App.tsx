/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { Camera } from 'lucide-react';
import { Message } from './types';

const socket: Socket = io();

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [userName, setUserName] = useState('');
  const [joined, setJoined] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    socket.on('chat_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });
    socket.on('user_list', (users: string[]) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off('chat_message');
      socket.off('user_list');
    };
  }, []);

  const handleJoin = () => {
    if (!userName.trim()) return;
    socket.emit('join', userName);
    setJoined(true);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (image?: string) => {
    if ((!input.trim() && !image) || !userName) return;
    const msg: Message = {
      id: Date.now().toString(),
      text: input,
      image,
      sender: userName,
      timestamp: Date.now(),
    };
    socket.emit('chat_message', msg);
    setInput('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        sendMessage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-4 font-sans">
        <h1 className="text-4xl font-semibold mb-12 tracking-tight">Ephemeral Relay</h1>
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
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 font-sans">
      <header className="flex items-center justify-between p-6 bg-zinc-950">
        <h1 className="text-xl font-semibold tracking-tight">Chatting as {userName}</h1>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-zinc-400 font-mono tracking-wider uppercase">Live • {onlineUsers.length} Online</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden md:flex w-64 flex-col border-r border-zinc-900 p-6 space-y-4">
          <h2 className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Online Users</h2>
          {onlineUsers.map((user) => (
            <div key={user} className="text-sm text-zinc-400 font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
              {user}
            </div>
          ))}
        </aside>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex ${msg.sender === userName ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-4 rounded-3xl ${
                    msg.sender === userName
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-zinc-900 text-zinc-100 rounded-bl-none'
                  }`}
                >
                  <p className="text-[10px] font-semibold mb-1 opacity-60 uppercase tracking-tighter">{msg.sender}</p>
                  {msg.image && <img src={msg.image} className="rounded-lg mb-2 max-w-full" alt="chat" />}
                  <p className="font-sans text-sm">{msg.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>
      </div>

      <footer className="p-6 bg-zinc-950">
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
            className="p-3 text-zinc-500 hover:text-blue-400 transition"
          >
            <Camera size={20} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-5 py-3 bg-zinc-900 rounded-full border border-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          />
          <button
            onClick={() => sendMessage()}
            className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-500 transition text-sm"
          >
            Send
          </button>
        </div>
      </footer>
    </div>
  );
}


