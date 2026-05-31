/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { Camera, Mic, MicOff, LogOut, Radio, Sun, Moon, Send, Users, X, Bell, BellOff, Volume2, VolumeX, Menu, MoreVertical, Share2, Mail, Link as LinkIcon, Check, ArrowLeft, ChevronRight } from 'lucide-react';
import { Message } from './types';

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // Tone 1: E5 (659.25 Hz) - crisp resonant chime tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.12, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    // Tone 2: A5 (880.00 Hz) - slightly delayed higher octave tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.08);
    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.08, now + 0.13);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.4);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.5);
  } catch (error) {
    console.error("Audio playback error:", error);
  }
}

interface UserAvatarProps {
  name: string;
  className?: string;
  theme?: 'light' | 'dark';
}

function UserAvatar({ name, className = "w-8 h-8", theme = "dark" }: UserAvatarProps) {
  const hash = hashCode(name || "User");
  const initials = (name || "U").substring(0, 2).toUpperCase();

  // Background style based on theme & hash
  const bgClasses = theme === 'dark'
    ? 'bg-zinc-900 text-zinc-100 border border-zinc-900'
    : 'bg-zinc-100 text-zinc-900 border border-zinc-200';

  // Beautiful geometric variations matching our premium minimalist aesthetic
  const patternType = hash % 6; 
  const shapeType = (hash >> 2) % 6; 
  const accentType = (hash >> 4) % 6; 

  const strokeColor = theme === 'dark' ? 'stroke-zinc-800' : 'stroke-zinc-200';
  const fillColor = theme === 'dark' ? 'fill-zinc-900' : 'fill-zinc-100';

  return (
    <div className={`relative rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center ${className} ${bgClasses}`}>
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Patterns */}
        {patternType === 0 && (
          <g opacity="0.12">
            <line x1="0" y1="20" x2="100" y2="20" className={strokeColor} strokeWidth="2" />
            <line x1="0" y1="40" x2="100" y2="40" className={strokeColor} strokeWidth="2" />
            <line x1="0" y1="60" x2="100" y2="60" className={strokeColor} strokeWidth="2" />
            <line x1="0" y1="80" x2="100" y2="80" className={strokeColor} strokeWidth="2" />
          </g>
        )}
        {patternType === 1 && (
          <g opacity="0.12">
            <line x1="20" y1="0" x2="20" y2="100" className={strokeColor} strokeWidth="2" />
            <line x1="40" y1="0" x2="40" y2="100" className={strokeColor} strokeWidth="2" />
            <line x1="60" y1="0" x2="60" y2="100" className={strokeColor} strokeWidth="2" />
            <line x1="80" y1="0" x2="80" y2="100" className={strokeColor} strokeWidth="2" />
          </g>
        )}
        {patternType === 2 && (
          <g opacity="0.1" fill="none" className={strokeColor}>
            <circle cx="50" cy="50" r="15" strokeWidth="2" />
            <circle cx="50" cy="50" r="30" strokeWidth="2" />
            <circle cx="50" cy="50" r="45" strokeWidth="2" />
          </g>
        )}
        {patternType === 3 && (
          <g opacity="0.12" className={strokeColor} strokeWidth="2">
            <line x1="0" y1="0" x2="100" y2="100" />
            <line x1="100" y1="0" x2="0" y2="100" />
          </g>
        )}
        {patternType === 4 && (
          <g opacity="0.12" className={fillColor}>
            <rect x="10" y="10" width="15" height="15" />
            <rect x="75" y="10" width="15" height="15" />
            <rect x="10" y="75" width="15" height="15" />
            <rect x="75" y="75" width="15" height="15" />
          </g>
        )}
        {patternType === 5 && (
          <g opacity="0.12" fill="none" className={strokeColor} strokeWidth="2" strokeDasharray="3 3">
            <path d="M10,50 Q50,0 90,50 T10,50" />
          </g>
        )}

        {/* Foreground Structures */}
        {shapeType === 0 && (
          <rect x="25" y="25" width="50" height="50" className={`${theme === 'dark' ? 'fill-zinc-900/40' : 'fill-zinc-100/40'} ${strokeColor}`} strokeWidth="2" rx="8" transform="rotate(45 50 50)" opacity="0.3" />
        )}
        {shapeType === 1 && (
          <circle cx="50" cy="50" r="28" className={`${theme === 'dark' ? 'fill-zinc-900/30' : 'fill-zinc-100/30'} ${strokeColor}`} strokeWidth="2" opacity="0.4" />
        )}
        {shapeType === 2 && (
          <path d="M50,15 L85,75 L15,75 Z" className={`${theme === 'dark' ? 'fill-zinc-900/30' : 'fill-zinc-100/30'} ${strokeColor}`} strokeWidth="2" rx="4" opacity="0.3" transform="rotate(15 50 50)" />
        )}
        {shapeType === 3 && (
          <g opacity="0.25" className={strokeColor} strokeWidth="2.5">
            <path d="M20,50 L80,50" />
            <path d="M50,20 L50,80" />
          </g>
        )}
        {shapeType === 4 && (
          <g opacity="0.3" className={fillColor}>
            <circle cx="25" cy="50" r="6" />
            <circle cx="50" cy="50" r="10" />
            <circle cx="75" cy="50" r="6" />
          </g>
        )}
        {shapeType === 5 && (
          <path d="M30,30 Q50,0 70,30 T70,70" fill="none" className={strokeColor} strokeWidth="3" opacity="0.25" />
        )}

        {/* Dynamic Micro-Accent highlights based on theme color */}
        {accentType === 0 && (
          <circle cx="80" cy="20" r="8" className="fill-accent" opacity="0.45" />
        )}
        {accentType === 1 && (
          <path d="M0,0 L40,0 L0,40 Z" className="fill-accent" opacity="0.3" />
        )}
        {accentType === 2 && (
          <rect x="42" y="10" width="16" height="16" className="fill-accent" rx="4" transform="rotate(45 50 18)" opacity="0.4" />
        )}
        {accentType === 3 && (
          <g opacity="0.45" className="stroke-accent" strokeWidth="2.5">
            <circle cx="50" cy="50" r="38" fill="none" strokeDasharray="6 30" />
          </g>
        )}
        {accentType === 4 && (
          <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="none" className="stroke-accent" strokeWidth="1.5" opacity="0.3" />
        )}
        {accentType === 5 && (
          <path d="M15,85 C35,65 65,65 85,85" fill="none" className="stroke-accent" strokeWidth="5" strokeLinecap="round" opacity="0.3" />
        )}
      </svg>

      {/* Clean elegant high-contrast display typography initials */}
      <span className="relative z-10 font-bold tracking-tight select-none uppercase font-sans">
        {initials}
      </span>
    </div>
  );
}

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

  // Sound and Desktop push notification states
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('pref_sound') !== 'false';
  });
  const [desktopNotificationEnabled, setDesktopNotificationEnabled] = useState<boolean>(() => {
    return localStorage.getItem('pref_desktop_notification') === 'true';
  });
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });
  const [toasts, setToasts] = useState<Array<{ id: string; sender: string; text: string; recipient: string; avatarName: string }>>([]);

  // States for Email Invite System and Landing Page Stages
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSenderName, setInviteSenderName] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSendingSimulated, setIsSendingSimulated] = useState(false);

  // Landing page stages:
  // 'welcome' - shows active users, "Start Chat" CTA, and "Invite Friends"
  // 'input_name' - shows user icon, name input field, and "Join" button
  const [landingStage, setLandingStage] = useState<'welcome' | 'input_name'>('welcome');

  // Nav menu state
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Maintain active state configurations for use inside event listener closure without causing re-registrations
  const selectedRecipientRef = useRef(selectedRecipient);
  selectedRecipientRef.current = selectedRecipient;

  const userNameRef = useRef(userName);
  userNameRef.current = userName;

  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const desktopNotificationEnabledRef = useRef(desktopNotificationEnabled);
  desktopNotificationEnabledRef.current = desktopNotificationEnabled;

  const notificationPermissionStatusRef = useRef(notificationPermissionStatus);
  notificationPermissionStatusRef.current = notificationPermissionStatus;

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

      // If message is sent by someone else, handle audio and visual notifications
      if (msg.sender !== userNameRef.current) {
        const activeRecipient = selectedRecipientRef.current;
        const currentUserName = userNameRef.current;

        // Check if user is currently viewing the conversation room this message belongs to
        const isCurrentlyInConversation = 
          (activeRecipient === 'All' && msg.recipient === 'All') || 
          (activeRecipient === msg.sender && msg.recipient === currentUserName);

        // 1. Play harmonic warm chime sound
        if (soundEnabledRef.current) {
          playNotificationSound();
        }

        // 2. Trigger native desktop push notification if tab is hidden OR user is looking at another screen
        const isTabHidden = typeof document !== 'undefined' && document.hidden;
        if (
          desktopNotificationEnabledRef.current && 
          notificationPermissionStatusRef.current === 'granted' && 
          (isTabHidden || !isCurrentlyInConversation) &&
          ('Notification' in window)
        ) {
          try {
            const title = `${msg.sender} (${msg.recipient === 'All' ? 'All Users' : 'Direct Message'})`;
            const textBody = msg.text || (msg.image ? '📷 Shared an image' : msg.audio ? '🎙️ Sent a voice note' : 'New message');
            const n = new Notification(title, {
              body: textBody,
              icon: '/favicon.ico',
              tag: msg.sender,
            });
            n.onclick = () => {
              window.focus();
              if (msg.recipient === 'All') {
                setSelectedRecipient('All');
              } else {
                setSelectedRecipient(msg.sender);
              }
              n.close();
            };
          } catch (err) {
            console.warn("Desktop notification trigger failed inside iframe sandbox:", err);
          }
        }

        // 3. Trigger beautifully animated in-app toast if the conversation is not the active one
        if (!isCurrentlyInConversation) {
          const toastId = `${msg.id || Date.now()}-toast`;
          const textBody = msg.text || (msg.image ? '📷 Shared an image' : msg.audio ? '🎙️ Sent a voice note' : 'New message');
          const newToast = {
            id: toastId,
            sender: msg.sender,
            text: textBody,
            recipient: msg.recipient,
            avatarName: msg.sender
          };
          setToasts((prev) => [...prev, newToast]);
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== toastId));
          }, 5000);
        }
      }
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

  const handleDesktopNotificationToggle = async () => {
    if (!('Notification' in window)) {
      alert("Push notifications are not supported in this browser.");
      return;
    }

    if (Notification.permission === 'denied') {
      alert("Desktop notifications are blocked by your browser settings. Please enable them in your address bar/browser settings.");
      return;
    }

    if (Notification.permission === 'default') {
      try {
        const res = await Notification.requestPermission();
        setNotificationPermissionStatus(res);
        if (res === 'granted') {
          setDesktopNotificationEnabled(true);
          localStorage.setItem('pref_desktop_notification', 'true');
          new Notification("Notifications Enabled", {
            body: "You will now receive alerts when someone sends a message!",
          });
        }
      } catch (err) {
        console.warn("Failed to request push permission in iframe:", err);
      }
    } else if (Notification.permission === 'granted') {
      const newVal = !desktopNotificationEnabled;
      setDesktopNotificationEnabled(newVal);
      localStorage.setItem('pref_desktop_notification', String(newVal));
    }
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

  const renderInviteModal = () => {
    return (
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop glass blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowInviteModal(false);
                setInviteEmail('');
                setIsSendingSimulated(false);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            {/* Modal Sheet Container */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className={`relative w-full max-w-md rounded-3xl border p-6 overflow-hidden shadow-2xl ${
                theme === 'dark' 
                  ? 'bg-zinc-950 border-zinc-900 text-zinc-100' 
                  : 'bg-white border-zinc-200 text-zinc-900'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <Share2 size={15} />
                  </div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider font-display">Invite Peers</h3>
                </div>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setIsSendingSimulated(false);
                  }}
                  className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 font-sans text-left">
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Invite friends to sync up onto this same channel frequency instantly! Enter their email to spawn an email draft with your signature or copy the connection link.
                </p>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-wider font-bold text-zinc-400">Recipient Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="e.g. friend@example.com"
                      className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-xs font-sans focus:outline-none focus:ring-1 focus:ring-accent border ${
                        theme === 'dark' 
                          ? 'bg-zinc-905 border-zinc-850 text-white placeholder-zinc-700' 
                          : 'bg-zinc-100 border-zinc-200 text-black placeholder-zinc-400'
                      }`}
                    />
                    <Mail size={13} className="absolute left-3 top-3.5 text-zinc-500" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-wider font-bold text-zinc-400">Your Signature Name</label>
                  <input
                    type="text"
                    value={inviteSenderName}
                    onChange={(e) => setInviteSenderName(e.target.value)}
                    placeholder={userName || "Your Pseudonym"}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs font-sans focus:outline-none focus:ring-1 focus:ring-accent border ${
                      theme === 'dark' 
                        ? 'bg-zinc-905 border-zinc-850 text-white placeholder-zinc-700' 
                        : 'bg-zinc-100 border-zinc-200 text-black placeholder-zinc-400'
                    }`}
                  />
                </div>

                {/* Simulated Compose Preview Box */}
                <div className={`p-3.5 rounded-2xl border text-[10px] space-y-1 block ${
                  theme === 'dark' ? 'bg-zinc-950/50 border-zinc-900/80 text-zinc-400' : 'bg-zinc-50 border-zinc-200/50 text-zinc-650'
                }`}>
                  <div className="flex justify-between border-b border-zinc-800/40 pb-1.5 mb-1.5 font-bold uppercase tracking-wider text-[8px] text-zinc-505 dark:text-zinc-500">
                    <span>Email Template Preview</span>
                    <span className="text-accent text-[8px]">● High Fidelity</span>
                  </div>
                  <p className="font-semibold text-zinc-350 dark:text-zinc-300">Subject: <span className="font-normal">Connect with me on Ephemeral Relay!</span></p>
                  <p className="leading-relaxed pt-1 font-mono">
                    "Hi there! Connect with me on Ephemeral Relay for a minimalist secure instant conversation of files and voice notes. Join the frequency here: {window.location.origin}"
                  </p>
                </div>

                {/* Actions list */}
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => {
                      if (!inviteEmail.trim()) {
                        alert("Please specify a recipient email address to spawn the invitation.");
                        return;
                      }
                      
                      const sender = inviteSenderName.trim() || userName.trim() || "A Peer";
                      const subject = encodeURIComponent("Sync up with me on Ephemeral Relay!");
                      const body = encodeURIComponent(`Hi there,\n\n${sender} wants to invite you to join them on Ephemeral Relay, a minimalist real-time chat application.\n\nSync up and chat instantly here:\n${window.location.origin}\n\nHope to see you on stream!`);
                      
                      // Trigger mailto client
                      window.location.href = `mailto:${inviteEmail}?subject=${subject}&body=${body}`;
                      
                      // Run animated simulated sequence
                      setIsSendingSimulated(true);
                      setTimeout(() => {
                        setIsSendingSimulated(false);
                        setShowInviteModal(false);
                        setInviteEmail('');
                        
                        // Show temporary confirmation toast
                        const tempId = `toast-success-invite-${Date.now()}`;
                        setToasts((prev) => [...prev, {
                          id: tempId,
                          sender: "System",
                          text: `✉️ Opened email client invitation for ${inviteEmail}`,
                          recipient: "You",
                          avatarName: "System"
                        }]);
                        setTimeout(() => {
                          setToasts((prev) => prev.filter(t => t.id !== tempId));
                        }, 5000);

                      }, 1000);
                    }}
                    disabled={isSendingSimulated}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:bg-accent/90 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSendingSimulated ? (
                      <span className="animate-pulse">Launching Email Client...</span>
                    ) : (
                      <>
                        <Mail size={14} />
                        <span>Open National Mail Draft</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                      
                      const tempId = `toast-copied-${Date.now()}`;
                      setToasts((prev) => [...prev, {
                        id: tempId,
                        sender: "System",
                        text: "📋 Frequency link copied to clipboard!",
                        recipient: "You",
                        avatarName: "System"
                      }]);
                      setTimeout(() => {
                        setToasts((prev) => prev.filter(t => t.id !== tempId));
                      }, 5000);
                    }}
                    type="button"
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer active:scale-95 ${
                      theme === 'dark' 
                        ? 'hover:bg-zinc-900 border-zinc-800 text-zinc-305 hover:text-white' 
                        : 'hover:bg-zinc-100 border-zinc-200 text-zinc-700'
                    }`}
                  >
                    {copiedLink ? <Check size={14} className="text-emerald-500" /> : <LinkIcon size={14} />}
                    <span>{copiedLink ? "Link Copied!" : "Copy Share Link"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  };
  
  if (!joined) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-[100dvh] bg-black text-white p-6 font-sans relative overflow-hidden"
      >
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-accent/5 rounded-full blur-[110px] pointer-events-none" />

        <div className="w-full max-w-sm p-8 rounded-3xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col items-center text-center relative z-10 shadow-2xl">
          
          <AnimatePresence mode="wait">
            {landingStage === 'welcome' ? (
              <motion.div
                key="welcome-stage"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="w-full flex flex-col items-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xl mb-4 font-mono select-none">
                  📶
                </div>
                <h1 className="text-2xl font-extrabold mb-1 tracking-wider font-display uppercase">
                  EPHEMERAL RELAY
                </h1>
                <p className="text-zinc-500 text-xs tracking-widest font-display mb-8 uppercase">Minimalist Real-Time Chat</p>

                {/* ACTIVE PEERS CONTAINER */}
                <div className="w-full text-left mb-6">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block mb-2.5">
                    Live Channel Status
                  </span>
                  
                  {onlineUsers.length > 0 ? (
                    <div className="w-full bg-zinc-900/40 border border-zinc-900/85 px-4 py-3 rounded-2xl space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[11px] text-zinc-405 font-sans font-semibold">
                          {onlineUsers.length} Peer{onlineUsers.length > 1 ? 's' : ''} Online Now
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {onlineUsers.map((user) => (
                          <div 
                            key={user}
                            className="flex items-center gap-1 bg-zinc-950/80 border border-zinc-900/60 px-2.5 py-1 rounded-full text-[11px] text-zinc-300 max-w-full"
                          >
                            <UserAvatar name={user} className="w-4 h-4 text-[7px]" theme="dark" />
                            <span className="truncate max-w-[80px] font-sans font-medium">{user}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full bg-zinc-900/20 border border-zinc-900/60 px-4 py-4 rounded-2xl flex flex-col items-center text-center">
                      <div className="w-6 h-6 rounded-full bg-zinc-900/60 border border-zinc-800/40 flex items-center justify-center text-xs opacity-50 mb-1.5">📡</div>
                      <p className="text-zinc-500 text-xs font-sans font-medium">Frequency is quiet</p>
                      <p className="text-[9px] text-zinc-650 max-w-[180px] leading-relaxed mt-0.5">Be the first to join and establish the stream!</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setLandingStage('input_name')}
                  className="px-8 py-3.5 bg-accent hover:bg-accent-hover text-white rounded-2xl font-bold transition-all text-xs tracking-wider font-sans uppercase shadow-md active:scale-95 w-full mb-3 cursor-pointer"
                >
                  Start Chat
                </button>

                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-8 py-3 border border-zinc-850 hover:bg-zinc-900 text-zinc-305 hover:text-white rounded-2xl font-semibold transition-all text-xs tracking-wider font-sans uppercase active:scale-95 w-full mb-6 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 size={13} />
                  <span>Invite Friends</span>
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="input-name-stage"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full flex flex-col items-center relative"
              >
                {/* Back button */}
                <button
                  onClick={() => setLandingStage('welcome')}
                  className="absolute left-0 top-0 p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 rounded-full transition-all flex items-center justify-center cursor-pointer"
                  title="Back to Welcome"
                >
                  <ArrowLeft size={16} />
                </button>

                <h2 className="text-xs font-extrabold text-zinc-400 font-display tracking-widest uppercase mb-1 mt-8">
                  Create Pseudonym
                </h2>
                <p className="text-[10px] text-zinc-505 font-sans tracking-wide mb-6">Choose how peers identify your node on stream</p>

                {/* Real-time Dynamic Avatar profile preview */}
                <div className="mb-6 flex flex-col items-center gap-2">
                  <UserAvatar 
                    name={userName.trim() || "?"} 
                    className="w-20 h-20 text-base font-extrabold shadow-md border-0 ring-4 ring-zinc-900/40"
                    theme="dark"
                  />
                  <span className="text-[11px] font-bold text-zinc-400 tracking-wide font-sans mt-1">
                    {userName.trim() ? userName.trim() : "Avatar Preview"}
                  </span>
                </div>
                
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
                  placeholder="Enter your name..."
                  className="px-5 py-3.5 bg-zinc-900 text-zinc-100 rounded-2xl border border-zinc-850 focus:outline-none focus:ring-1 focus:ring-accent w-full mb-4 font-sans text-sm text-center placeholder-zinc-650 focus:border-accent font-medium text-inherit"
                  autoFocus
                />
                
                <button
                  onClick={handleJoin}
                  disabled={!userName.trim()}
                  className="px-8 py-3.5 bg-accent text-white rounded-2xl font-bold hover:bg-accent-hover transition-all text-xs tracking-wider font-sans uppercase shadow-md active:scale-95 w-full disabled:opacity-40 disabled:cursor-not-allowed mb-6 cursor-pointer"
                >
                  Confirm & Join Stream
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsible Relay URL config for GitHub Pages deployment */}
          <div className="w-full text-left">
            <details className="group border border-zinc-900 rounded-2xl bg-zinc-950/20 px-3 py-2 text-zinc-500 select-none transition-all duration-300">
              <summary className="list-none flex items-center justify-between text-[11px] font-sans font-semibold tracking-wider cursor-pointer uppercase py-1 group-open:pb-2.5">
                <span>Relay Configuration</span>
                <span className="transition-transform group-open:rotate-180 text-[9px]">▼</span>
              </summary>
              <div className="space-y-2 pt-2 border-t border-zinc-900/60">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-zinc-605 font-sans font-semibold tracking-wider uppercase">Relay Server URL</label>
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

        {/* Dynamic Invitation Modal overlay */}
        {showInviteModal && renderInviteModal()}

      </motion.div>
    );
  }

  const displayedMessages = messages.filter((msg) => {
    if (selectedRecipient === "All") {
      return msg.recipient === "All";
    }
    return (
      (msg.sender === userName && msg.recipient === selectedRecipient) ||
      (msg.sender === selectedRecipient && msg.recipient === userName)
    );
  });

  return (
    <div className={`flex flex-col h-[100dvh] ${theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'} font-sans antialiased overflow-hidden`}>
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-[90vw] sm:w-[320px] pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className={`pointer-events-auto cursor-pointer flex gap-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all active:scale-[0.98] ${
                theme === 'dark'
                  ? 'bg-zinc-900/95 text-zinc-100 border-zinc-800'
                  : 'bg-white/95 text-zinc-900 border-zinc-200'
              }`}
              onClick={() => {
                if (toast.recipient === 'All') {
                  setSelectedRecipient('All');
                } else {
                  setSelectedRecipient(toast.sender);
                }
                setToasts((prev) => prev.filter((t) => t.id !== toast.id));
              }}
            >
              <UserAvatar name={toast.avatarName} className="w-8 h-8 text-[11px] font-bold" theme={theme} />
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-xs font-bold font-display truncate">Incoming from {toast.sender}</p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-sans tracking-wide truncate mt-0.5">{toast.text}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                }}
                className="text-zinc-400 hover:text-zinc-205 dark:hover:text-white p-1 self-start transition-colors"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {/* Top App Bar - Flat M3 Outlined Style */}
      <header className={`flex items-center justify-between px-4 py-2.5 sm:px-6 sm:py-4 ${theme === 'dark' ? 'bg-zinc-950 border-b border-zinc-900' : 'bg-white border-b border-zinc-200'} z-20`}>
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Quick toggle sidebar for mobile */}
          <button 
            className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-accent transition-colors active:scale-95 relative" 
            onClick={() => setIsAsideOpen(!isAsideOpen)}
            title="Toggle user list"
          >
            <Users size={20} className={isAsideOpen ? "text-accent" : ""} />
            {onlineUsers.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full ring-2 ring-zinc-950" />
            )}
          </button>
          
          <div className="flex items-center gap-2 sm:gap-2.5">
            <UserAvatar 
              name={userName} 
              className="w-8 h-8 sm:w-9 sm:h-9 text-[10px] sm:text-xs font-bold" 
              theme={theme}
            />
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-bold tracking-tight font-display truncate max-w-[100px] xs:max-w-[130px] sm:max-w-none">{userName}</h1>
              <p className="text-[9px] sm:text-[10px] text-zinc-500 font-sans tracking-wide uppercase truncate max-w-[120px] xs:max-w-[150px] sm:max-w-none">
                <span className="hidden xs:inline">Active Recipient: </span>
                <span className="xs:hidden">To: </span>
                <span className="text-accent font-semibold">{selectedRecipient}</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 relative">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 font-medium tracking-wide uppercase">
             <Radio size={14} className="text-emerald-500 mb-0.5" />
             <span>Live • {onlineUsers.length}</span>
          </div>

          {/* Connected Multi-Option Menu Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
              className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                isNavMenuOpen 
                  ? 'bg-accent border-accent text-white font-bold shadow-md shadow-accent/20' 
                  : theme === 'dark' 
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-305 hover:bg-zinc-850 hover:text-white' 
                    : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200/80 hover:text-black'
              }`}
              title="Menu Options & Peers"
            >
              <Menu size={16} />
              <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Menu</span>
            </button>

            {/* Float Dropdown Popover */}
            <AnimatePresence>
              {isNavMenuOpen && (
                <>
                  {/* Backdrop for closing */}
                  <div 
                    className="fixed inset-0 z-40 cursor-default" 
                    onClick={() => setIsNavMenuOpen(false)} 
                  />
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute right-0 mt-2.5 w-72 rounded-2xl shadow-2xl border p-4 z-50 text-left ${
                      theme === 'dark' 
                        ? 'bg-zinc-950 border-zinc-900 text-zinc-100' 
                        : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Section 1: Email Referral CTA */}
                      <div className="pb-3 border-b border-zinc-200 dark:border-zinc-900/80">
                        <button
                          onClick={() => {
                            setIsNavMenuOpen(false);
                            setShowInviteModal(true);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-accent text-white text-xs font-bold uppercase tracking-wider hover:bg-accent/90 transition-all active:scale-95 cursor-pointer shadow-md"
                        >
                          <div className="flex items-center gap-2">
                            <Mail size={13} />
                            <span>Invite Friends by Email</span>
                          </div>
                          <ChevronRight size={13} className="text-white/80" />
                        </button>
                      </div>

                      {/* Section 2: Online Users inside Menu */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest px-0.5">
                          <span>Frequency Peers</span>
                          <span className="flex items-center gap-1 text-emerald-500 font-sans font-bold text-[9px]">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            {onlineUsers.length} active
                          </span>
                        </div>
                        
                        <div className="max-h-40 overflow-y-auto space-y-1.5 pr-0.5 scrollbar-thin">
                          {/* All Users public channel */}
                          <div 
                            onClick={() => { 
                              setSelectedRecipient("All"); 
                              setIsNavMenuOpen(false); 
                            }}
                            className={`cursor-pointer text-xs font-semibold flex items-center gap-2.5 p-1.5 rounded-xl transition-all ${
                              selectedRecipient === "All" 
                                ? 'text-white bg-accent font-semibold' 
                                : theme === 'dark' 
                                  ? 'text-zinc-400 hover:bg-zinc-900 hover:text-white' 
                                  : 'text-zinc-700 hover:bg-zinc-100 hover:text-black'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              selectedRecipient === "All" ? 'bg-white/20' : 'bg-accent/10 text-accent'
                            }`}>
                              👥
                            </div>
                            <span className="truncate">Public Room (All)</span>
                          </div>

                          {/* Individual Users list */}
                          {onlineUsers.filter(u => u !== userName).length === 0 ? (
                            <p className="text-[10px] text-zinc-500 italic pl-1.5 py-1">Frequency is clear. Open system invite to bring others!</p>
                          ) : (
                            onlineUsers.filter(u => u !== userName).map((user) => (
                              <div 
                                key={user} 
                                onClick={() => { 
                                  setSelectedRecipient(user); 
                                  setIsNavMenuOpen(false); 
                                }}
                                className={`cursor-pointer text-xs font-semibold flex items-center gap-2.5 p-1.5 rounded-xl transition-all ${
                                  selectedRecipient === user 
                                    ? 'text-white bg-accent font-semibold' 
                                    : theme === 'dark' 
                                      ? 'text-zinc-400 hover:bg-zinc-900 hover:text-white' 
                                      : 'text-zinc-700 hover:bg-zinc-100 hover:text-black'
                                }`}
                              >
                                <UserAvatar 
                                  name={user} 
                                  className="w-6 h-6 text-[9px] font-bold" 
                                  theme={theme}
                                />
                                <span className="truncate">{user}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Section 3: Options / Custom System Preferences */}
                      <div className="pt-3 border-t border-zinc-200 dark:border-zinc-900/80 space-y-1.5 text-xs">
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest px-0.5 mb-1">
                          Options & Settings
                        </div>

                        {/* Theme Toggle option */}
                        <div 
                          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all border font-semibold cursor-pointer ${
                            theme === 'dark' 
                              ? 'bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300 border-zinc-900' 
                              : 'bg-zinc-150 hover:bg-zinc-100/80 text-zinc-700 border-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {theme === 'dark' ? <Sun size={13} className="text-amber-500" /> : <Moon size={13} className="text-zinc-650" />}
                            <span>Aesthetic Theme</span>
                          </div>
                          <span className="text-[9px] font-bold uppercase text-zinc-505 tracking-wider">
                            {theme}
                          </span>
                        </div>

                        {/* Sound Chimes switch */}
                        <div
                          onClick={() => {
                            const newVal = !soundEnabled;
                            setSoundEnabled(newVal);
                            localStorage.setItem('pref_sound', String(newVal));
                            if (newVal) playNotificationSound();
                          }}
                          className={`flex items-center justify-between w-full px-3 py-2 rounded-xl transition-all border font-semibold cursor-pointer ${
                            theme === 'dark' 
                              ? 'bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300 border-zinc-900' 
                              : 'bg-zinc-150 hover:bg-zinc-100/80 text-zinc-700 border-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {soundEnabled ? <Volume2 size={13} className="text-accent" /> : <VolumeX size={13} className="text-zinc-500" />}
                            <span>Sound Chimes</span>
                          </div>
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${soundEnabled ? 'text-accent' : 'text-zinc-500'}`}>
                            {soundEnabled ? 'ON' : 'OFF'}
                          </span>
                        </div>

                        {/* Push Alerts switch */}
                        <div
                          onClick={handleDesktopNotificationToggle}
                          className={`flex items-center justify-between w-full px-3 py-2 rounded-xl transition-all border font-semibold cursor-pointer ${
                            theme === 'dark' 
                              ? 'bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300 border-zinc-900' 
                              : 'bg-zinc-150 hover:bg-zinc-100/80 text-zinc-700 border-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {desktopNotificationEnabled && notificationPermissionStatus === 'granted' ? (
                              <Bell size={13} className="text-accent" />
                            ) : (
                              <BellOff size={13} className="text-zinc-500" />
                            )}
                            <span>Push Alerts</span>
                          </div>
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${
                            desktopNotificationEnabled && notificationPermissionStatus === 'granted' ? 'text-accent' : 'text-zinc-500'
                          }`}>
                            {desktopNotificationEnabled && notificationPermissionStatus === 'granted' ? 'ACTIVE' : 'OFF'}
                          </span>
                        </div>

                        {/* Logout Trigger */}
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors font-bold mt-2 cursor-pointer border border-transparent"
                        >
                          <LogOut size={13} />
                          <span>Disconnect Node</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
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
            <button className="md:hidden text-zinc-400 hover:text-zinc-500 font-bold p-1" onClick={() => setIsAsideOpen(false)}>
              <X size={18} />
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
            {onlineUsers.filter(u => u !== userName).length === 0 ? (
              <div className="flex flex-col items-center justify-center p-4 h-32 text-center">
                <p className="text-xs text-zinc-550 dark:text-zinc-500 font-sans">Wait mode</p>
                <p className="text-[10px] text-zinc-600 dark:text-zinc-600 mt-1">Waiting for other peers to align to this channel...</p>
              </div>
            ) : (
              onlineUsers.filter(u => u !== userName).map((user) => (
                <div 
                  key={user} 
                  onClick={() => { setSelectedRecipient(user); setIsAsideOpen(false); }}
                  className={`cursor-pointer text-sm font-medium flex items-center gap-3 p-2 rounded-full transition-colors font-sans ${selectedRecipient === user ? 'text-white bg-accent font-semibold' : theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-900 hover:text-white' : 'text-zinc-700 hover:bg-zinc-100 hover:text-black'}`}
                >
                  <UserAvatar 
                    name={user} 
                    className="w-8 h-8 text-[11px] font-bold" 
                    theme={theme}
                  />
                  <span className="truncate">{user}</span>
                </div>
              ))
            )}
          </div>

          {/* Notification & Sound Preferences */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-900 space-y-2 font-sans text-left">
            <h3 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">PREFERENCES</h3>
            <div className="flex flex-col gap-2">
              {/* Sound toggle button */}
              <button
                onClick={() => {
                  const newVal = !soundEnabled;
                  setSoundEnabled(newVal);
                  localStorage.setItem('pref_sound', String(newVal));
                  if (newVal) playNotificationSound();
                }}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-xl transition-all border text-xs font-semibold cursor-pointer ${
                  theme === 'dark' 
                    ? 'bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300 border-zinc-900' 
                    : 'bg-zinc-100 hover:bg-zinc-100/80 text-zinc-700 border-zinc-200'
                }`}
                title="Toggle audio notification sound chimes"
              >
                <div className="flex items-center gap-1.5">
                  {soundEnabled ? <Volume2 size={13} className="text-accent" /> : <VolumeX size={13} className="text-zinc-500" />}
                  <span>Sound Chime</span>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${soundEnabled ? 'text-accent' : 'text-zinc-500'}`}>
                  {soundEnabled ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Push alert settings */}
              <button
                onClick={handleDesktopNotificationToggle}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-xl transition-all border text-xs font-semibold cursor-pointer ${
                  theme === 'dark' 
                    ? 'bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300 border-zinc-900' 
                    : 'bg-zinc-100 hover:bg-zinc-100/80 text-zinc-700 border-zinc-200'
                }`}
                title="Toggle native standard desktop push notifications"
              >
                <div className="flex items-center gap-1.5">
                  {desktopNotificationEnabled && notificationPermissionStatus === 'granted' ? (
                    <Bell size={13} className="text-accent" />
                  ) : (
                    <BellOff size={13} className="text-zinc-500" />
                  )}
                  <span>Push Alerts</span>
                </div>
                <div className="flex items-center gap-1">
                  {notificationPermissionStatus === 'default' && (
                    <span className="text-[8px] text-accent font-bold underline uppercase animate-pulse pr-0.5">Request</span>
                  )}
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${
                    desktopNotificationEnabled && notificationPermissionStatus === 'granted' ? 'text-accent' : 'text-zinc-500'
                  }`}>
                    {desktopNotificationEnabled && notificationPermissionStatus === 'granted' ? 'ACTIVE' : 'OFF'}
                  </span>
                </div>
              </button>
            </div>
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
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
          <div className="max-w-4xl mx-auto w-full space-y-3">
            <AnimatePresence>
              {displayedMessages.length === 0 ? (
                <div className="h-[40vh] flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                  <span className="text-2xl mb-2 opacity-50">✉️</span>
                  <p className="text-xs sm:text-sm font-sans font-medium text-zinc-400 dark:text-zinc-500">No messages yet with {selectedRecipient === 'All' ? 'everyone' : selectedRecipient}.</p>
                  <p className="text-[11px] text-zinc-550 dark:text-zinc-650 mt-1 max-w-[240px] leading-relaxed">Start the conversation by sending a direct message.</p>
                </div>
              ) : (
                displayedMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${msg.sender === userName ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex gap-1.5 sm:gap-2.5 max-w-[90%] sm:max-w-[70%] ${
                        msg.sender === userName
                          ? 'flex-row-reverse'
                          : 'flex-row'
                      }`}
                    >
                      <UserAvatar 
                        name={msg.sender} 
                        className="w-7 h-7 sm:w-8 sm:h-8 text-[10px] sm:text-xs font-bold" 
                        theme={theme}
                      />
                      <div className="flex flex-col space-y-1 min-w-0">
                        <span className={`text-[10px] text-zinc-500 font-sans tracking-wide ${msg.sender === userName ? 'text-right' : 'text-left'} truncate max-w-[150px] sm:max-w-none`}>
                          {msg.sender === userName ? 'You' : msg.sender} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div
                          className={`px-3.5 py-2.5 sm:p-3.5 rounded-2xl ${
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
                              className="rounded-xl mb-1.5 max-w-full overflow-hidden object-cover border border-zinc-200/10 shadow-inner max-h-60" 
                              alt="Shared media" 
                              referrerPolicy="no-referrer" 
                            />
                          )}
                          {msg.audio && (
                            <div className="my-1 max-w-full overflow-hidden">
                              <audio src={msg.audio} controls className="max-w-full w-40 xs:w-48 sm:w-64 h-8 scale-95 origin-left" />
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
      <footer className={`px-2.5 py-2 sm:p-6 ${theme === 'dark' ? 'bg-zinc-950/60 backdrop-blur-md border-t border-zinc-900' : 'bg-white/85 backdrop-blur-md border-t border-zinc-200'} safe-bottom z-10`}>
        <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-3">
          {/* Outlined M3 container for text inputs and actions */}
          <div className={`flex-1 flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-4 sm:py-2 rounded-2xl border ${
            theme === 'dark' 
              ? 'bg-zinc-900/40 border-zinc-800 focus-within:border-accent' 
              : 'bg-zinc-100/40 border-zinc-200 focus-within:border-accent'
          } transition-all duration-200 min-w-0`}>
            
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1 sm:p-2 text-zinc-400 hover:text-accent active:scale-90 transition-all flex-shrink-0"
              title="Share Image"
            >
              <Camera size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>

            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-1 sm:p-2 transition-all active:scale-90 flex-shrink-0 ${isRecording ? 'text-accent animate-pulse' : 'text-zinc-400 hover:text-accent'}`}
              title="Voice Note"
            >
              {isRecording ? <MicOff size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Mic size={16} className="sm:w-[18px] sm:h-[18px]" />}
            </button>

            {!isRecording && (
              <div className={`h-4 w-[1px] ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-300'} mx-0.5`} />
            )}

            {isRecording ? (
              <div className="flex-1 flex items-center gap-1.5 text-[11px] text-accent font-semibold tracking-wider uppercase animate-pulse py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                <span>Recording Voice Note...</span>
              </div>
            ) : (
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-base sm:text-sm py-1 font-sans placeholder-zinc-500 text-inherit min-w-0"
              />
            )}
          </div>

          <button
            onClick={() => sendMessage()}
            className="flex-shrink-0 p-2 sm:p-3 bg-accent text-white rounded-full font-medium hover:bg-accent-hover active:scale-95 transition-colors shadow-sm flex items-center justify-center min-w-[38px] min-h-[38px] sm:min-w-[44px] sm:min-h-[44px]"
            title="Send Message"
          >
            <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>
      </footer>

      {/* Dynamic Invitation Modal overlay when chatting */}
      {showInviteModal && renderInviteModal()}

    </div>
  );
}


