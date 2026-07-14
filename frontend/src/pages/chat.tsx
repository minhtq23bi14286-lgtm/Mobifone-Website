import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Phone, Video, Info, Send, Paperclip, Smile,
  MoreHorizontal, Check, CheckCheck, X, Reply, File, Trash2,
  ArrowLeft, Users,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import VideoCall from "../components/VideoCall";
import { useSearchParams } from "react-router-dom";

const GIPHY_API_KEY = "LcDK349I5nP9QQbiMb6kFChTbFMJzJkU";

interface Contact {
  id: number; email: string; displayName: string; role: string; department: string;
}
interface ReplyTo { id: number; content: string; senderId: number; }
interface Message {
  id: number; senderId: number; receiverId: number; content: string; createdAt: string;
  mine: boolean; isRead?: boolean; replyToId?: number; replyTo?: ReplyTo;
  fileUrl?: string; fileName?: string; fileType?: string; reactions?: Record<string, string>;
}
interface LastMessageInfo { lastMessage: Message | null; unreadCount: number; }
interface GiphyResult { id: string; images: { fixed_height_small: { url: string }; original: { url: string } }; title: string; }

const EMOJIS = ["😀","😂","❤️","👍","👎","😮","😢","😡","🔥","🎉","👏","🙏"];
const REACTION_EMOJIS = ["❤️","😂","😮","😢","😡","👍"];

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

const formatLastTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return "Vừa xong";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} phút`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ`;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

function MessageBubble({ msg, prevMsg, nextMsg, currentUserId, activeContact, onReact, onReply }: {
  msg: Message; prevMsg?: Message; nextMsg?: Message;
  currentUserId: number; activeContact: Contact | null;
  onReact: (id: number, emoji: string) => void; onReply: (msg: Message) => void;
}) {
  const [showReactions, setShowReactions] = useState(false);
  const isSamePrev = prevMsg?.senderId === msg.senderId;
  const isSameNext = nextMsg?.senderId === msg.senderId;
  const showAvatar = !msg.mine && !isSameNext;
  const reactionSummary: Record<string, number> = {};
  if (msg.reactions) Object.values(msg.reactions).forEach(e => { reactionSummary[e] = (reactionSummary[e] || 0) + 1; });
  const hasReactions = Object.keys(reactionSummary).length > 0;
  const myReaction = msg.reactions?.[currentUserId];
  const isGif = msg.fileType === "gif";

  return (
    <div className={`flex ${msg.mine ? "justify-end" : "justify-start"} ${isSamePrev ? "mt-0.5" : "mt-3"}`}>
      <div className={`flex items-end gap-2 max-w-[80%] sm:max-w-[70%] group ${msg.mine ? "flex-row-reverse" : ""}`}>
        <div className="w-8 flex-shrink-0 self-end">
          {showAvatar && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1F4E79] to-[#2E75B6] flex items-center justify-center text-white text-xs font-bold">
              {activeContact?.displayName.charAt(0)}
            </div>
          )}
        </div>
        <div className="relative">
          {msg.replyTo && (
            <div className={`mb-1 px-3 py-1.5 rounded-xl text-xs border-l-2 border-[#2E75B6] bg-gray-100 text-gray-500 max-w-xs truncate ${msg.mine ? "ml-auto" : ""}`}>
              <span className="font-medium text-[#1F4E79]">{msg.replyTo.senderId === currentUserId ? "Bạn" : activeContact?.displayName}:</span>{" "}{msg.replyTo.content}
            </div>
          )}
          <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 ${msg.mine ? "right-full mr-2" : "left-full ml-2"}`}>
            <button onClick={() => onReply(msg)} className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 text-gray-500 hover:text-[#1F4E79] transition-colors"><Reply className="w-3.5 h-3.5" /></button>
            <button onClick={() => setShowReactions(v => !v)} className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 text-gray-500 hover:text-[#1F4E79] transition-colors"><Smile className="w-3.5 h-3.5" /></button>
          </div>
          {showReactions && (
            <div className={`absolute bottom-full mb-2 z-20 bg-white rounded-full shadow-xl border border-gray-100 px-2 py-1.5 flex gap-1 ${msg.mine ? "right-0" : "left-0"}`}>
              {REACTION_EMOJIS.map(emoji => (
                <button key={emoji} onClick={() => { onReact(msg.id, emoji); setShowReactions(false); }}
                  className={`text-lg hover:scale-125 transition-transform ${myReaction === emoji ? "scale-125" : ""}`}>{emoji}</button>
              ))}
            </div>
          )}
          {isGif ? (
            <div className={`rounded-2xl overflow-hidden ${msg.mine ? "rounded-br-sm" : "rounded-bl-sm"}`}>
              <img src={msg.fileUrl} alt="GIF" className="max-w-xs max-h-48 object-cover" />
              <div className="absolute top-1 left-1 bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">GIF</div>
            </div>
          ) : (
            <div className={`px-4 py-2.5 text-sm leading-relaxed ${msg.mine
              ? `bg-gradient-to-br from-[#1F4E79] to-[#2E75B6] text-white ${isSamePrev && isSameNext ? "rounded-2xl rounded-tr-sm" : isSamePrev ? "rounded-2xl rounded-tr-sm rounded-br-sm" : isSameNext ? "rounded-2xl rounded-tr-sm" : "rounded-2xl rounded-br-sm"}`
              : `bg-white text-gray-800 shadow-sm ${isSamePrev && isSameNext ? "rounded-2xl rounded-tl-sm" : isSamePrev ? "rounded-2xl rounded-tl-sm rounded-bl-sm" : isSameNext ? "rounded-2xl rounded-tl-sm" : "rounded-2xl rounded-bl-sm"}`
            }`}>
              {msg.fileUrl && msg.fileType === "image" && (
                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                  <img src={msg.fileUrl} alt={msg.fileName} className="max-w-xs max-h-48 rounded-xl mb-1 object-cover" />
                </a>
              )}
              {msg.fileUrl && msg.fileType === "file" && (
                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-2 mb-1 text-xs underline ${msg.mine ? "text-blue-200" : "text-[#1F4E79]"}`}>
                  <File className="w-4 h-4" />{msg.fileName}
                </a>
              )}
              {msg.content && <span>{msg.content}</span>}
            </div>
          )}
          {hasReactions && (
            <div className={`flex mt-1 ${msg.mine ? "justify-end" : "justify-start"}`}>
              <div className="bg-white rounded-full shadow-sm px-1.5 py-0.5 flex items-center gap-0.5 text-xs border border-gray-100">
                {Object.entries(reactionSummary).map(([emoji, count]) => <span key={emoji}>{emoji}{count > 1 ? count : ""}</span>)}
              </div>
            </div>
          )}
          {!isSameNext && (
            <div className={`flex items-center gap-1 mt-1 ${msg.mine ? "justify-end" : "justify-start"}`}>
              <span className="text-xs text-gray-400">{msg.createdAt ? formatTime(msg.createdAt) : ""}</span>
              {msg.mine && (msg.isRead ? <CheckCheck className="w-3 h-3 text-[#2E75B6]" /> : <Check className="w-3 h-3 text-gray-400" />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GiphyPicker({ onSelect, onClose }: { onSelect: (url: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<GiphyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); fetchTrending(); }, []);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=18&rating=g`);
      const data = await res.json();
      setGifs(data.data || []);
    } catch { } finally { setLoading(false); }
  };

  const searchGifs = async (q: string) => {
    if (!q.trim()) { fetchTrending(); return; }
    setLoading(true);
    try {
      const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=18&rating=g`);
      const data = await res.json();
      setGifs(data.data || []);
    } catch { } finally { setLoading(false); }
  };

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (val: string) => {
    setQuery(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchGifs(val), 500);
  };

  return (
    <div className="absolute bottom-full right-0 mb-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-30">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-800">GIF</span>
          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md font-medium">via GIPHY</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"><X className="w-4 h-4" /></button>
      </div>
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
          <input ref={inputRef} type="text" placeholder="Tìm GIF..." value={query}
            onChange={e => handleSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:bg-gray-200 transition-colors" />
        </div>
      </div>
      <div className="px-3 pt-2 pb-1">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          {query ? "Kết quả tìm kiếm" : "Đang thịnh hành"}
        </p>
      </div>
      <div className="h-56 overflow-y-auto px-2 pb-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-[#1F4E79] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : gifs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">Không tìm thấy GIF</div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {gifs.map(gif => (
              <button key={gif.id} onClick={() => { onSelect(gif.images.original.url); onClose(); }}
                className="relative aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity group">
                <img src={gif.images.fixed_height_small.url} alt={gif.title} className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="px-3 py-1.5 border-t border-gray-100 flex justify-end">
        <span className="text-[10px] text-gray-300 font-medium">Powered by GIPHY</span>
      </div>
    </div>
  );
}

export default function Chat() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [lastMessages, setLastMessages] = useState<Record<number, LastMessageInfo>>({});
  const [uploadingFile, setUploadingFile] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ callerId: number; callerName: string; signal: any } | null>(null);
  const [showContactList, setShowContactList] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<Contact | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const socketInitialized = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");

  const [searchParams, setSearchParams] = useSearchParams();
  const targetUserId = searchParams.get("userId");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = sessionStorage.getItem("accessToken");
        if (!token) return;
        const res = await fetch("/api/users/contacts", { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        const filtered = (Array.isArray(data) ? data : []).filter((u: Contact) => 
  u.id !== currentUser.id && u.role !== 'admin'
);
        setContacts(filtered);
        if (filtered.length > 0 && !targetUserId) setActiveContact(filtered[0]);
      } catch (err) { console.error(err); }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!targetUserId || contacts.length === 0) return;
    const target = contacts.find(c => c.id === Number(targetUserId));
    if (target) {
      setActiveContact(target);
      setShowContactList(false);
      setSearchParams({}, { replace: true });
    }
  }, [targetUserId, contacts]);

  useEffect(() => {
    if (socketInitialized.current) return;
    socketInitialized.current = true;
    const token = sessionStorage.getItem("accessToken");
    if (!token) return;
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', { 
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;
    socket.on("connect", () => socket.emit("getOnlineUsers"));
    socket.on("onlineUsers", (users: number[]) => setOnlineUsers(users));
    socket.on("userOnline", ({ userId }: { userId: number }) => setOnlineUsers(prev => [...new Set([...prev, userId])]));
    socket.on("userOffline", ({ userId }: { userId: number }) => setOnlineUsers(prev => prev.filter(id => id !== userId)));
    socket.on("receiveMessage", (msg: Message) => {
      setMessages(prev => [...prev, { ...msg, mine: false }]);
      setLastMessages(prev => ({ ...prev, [msg.senderId]: { lastMessage: msg, unreadCount: (prev[msg.senderId]?.unreadCount || 0) + 1 } }));
    });
    socket.on("messageSent", (msg: Message) => {
      setMessages(prev => [...prev, { ...msg, mine: true, isRead: false }]);
      setLastMessages(prev => ({ ...prev, [msg.receiverId]: { lastMessage: msg, unreadCount: prev[msg.receiverId]?.unreadCount || 0 } }));
    });
    socket.on("messageHistory", (history: Message[]) => {
      setMessages(history.map(msg => ({ ...msg, mine: msg.senderId === currentUser.id })));
    });
    socket.on("lastMessages", (data: Record<number, LastMessageInfo>) => setLastMessages(data));
    socket.on("userTyping", ({ isTyping }: { isTyping: boolean }) => setIsTyping(isTyping));
    socket.on("messagesRead", () => setMessages(prev => prev.map(m => m.mine ? { ...m, isRead: true } : m)));
    socket.on("messageReacted", ({ messageId, reactions }: { messageId: number; reactions: Record<string, string> }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
    });
    socket.on("incomingCall", ({ callerId, callerName, signal }: any) => {
      setIncomingCall(prev => {
        if (prev) return prev;
        return { callerId, callerName, signal };
      });
    });
    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
    if (!socketRef.current || !activeContact) return;
    socketRef.current.emit("getMessages", { receiverId: activeContact.id });
    setMessages([]); setIsTyping(false); setReplyingTo(null);
    socketRef.current.emit("markAsRead", { senderId: activeContact.id });
    setLastMessages(prev => ({ ...prev, [activeContact.id]: { ...prev[activeContact.id], unreadCount: 0 } }));
  }, [activeContact]);

  useEffect(() => {
    if (!socketRef.current || contacts.length === 0) return;
    socketRef.current.emit("getLastMessages", { contactIds: contacts.map(c => c.id) });
  }, [contacts]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = useCallback(() => {
    if (!message.trim() || !socketRef.current || !activeContact) return;
    socketRef.current.emit("sendMessage", { receiverId: activeContact.id, content: message, replyToId: replyingTo?.id });
    setMessage(""); setReplyingTo(null);
    socketRef.current.emit("typing", { receiverId: activeContact.id, isTyping: false });
  }, [message, activeContact, replyingTo]);

  const handleSendGif = useCallback((gifUrl: string) => {
    if (!socketRef.current || !activeContact) return;
    socketRef.current.emit("sendMessage", { receiverId: activeContact.id, content: "", fileUrl: gifUrl, fileName: "giphy.gif", fileType: "gif", replyToId: replyingTo?.id });
    setReplyingTo(null); setShowGifPicker(false);
  }, [activeContact, replyingTo]);

  const handleTyping = (value: string) => {
    setMessage(value);
    if (!socketRef.current || !activeContact) return;
    socketRef.current.emit("typing", { receiverId: activeContact.id, isTyping: true });
    if (typingTimeout) clearTimeout(typingTimeout);
    const t = setTimeout(() => { socketRef.current?.emit("typing", { receiverId: activeContact.id, isTyping: false }); }, 2000);
    setTypingTimeout(t);
  };

  const handleReact = useCallback((msgId: number, emoji: string) => {
    if (!socketRef.current || !activeContact) return;
    socketRef.current.emit("reactMessage", { messageId: msgId, emoji, receiverId: activeContact.id });
  }, [activeContact]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeContact) return;
    setUploadingFile(true);
    try {
      const token = sessionStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/chat/upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
      if (!res.ok) throw new Error();
      const { fileUrl, fileName, fileType } = await res.json();
      socketRef.current?.emit("sendMessage", { receiverId: activeContact.id, content: "", fileUrl, fileName, fileType, replyToId: replyingTo?.id });
      setReplyingTo(null);
    } catch { console.error("Lỗi upload file"); }
    finally { setUploadingFile(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const handleDeleteHistory = (contactId: number) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) setDeleteConfirm(contact);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const token = sessionStorage.getItem("accessToken");
      await fetch(`/api/chat/messages/${deleteConfirm.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setMessages([]);
      setLastMessages(prev => ({ ...prev, [deleteConfirm.id]: { lastMessage: null, unreadCount: 0 } }));
    } catch (err) { console.error(err); }
    finally { setDeleteConfirm(null); }
  };

  const handleSelectContact = (contact: Contact) => {
    setActiveContact(contact);
    setShowContactList(false);
  };

  const filteredContacts = contacts
    .filter(c => c.displayName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const timeA = lastMessages[a.id]?.lastMessage?.createdAt || "";
      const timeB = lastMessages[b.id]?.lastMessage?.createdAt || "";
      return timeB > timeA ? 1 : timeB < timeA ? -1 : 0;
    });
  const totalUnread = Object.values(lastMessages).reduce((sum, info) => sum + (info.unreadCount || 0), 0);

  return (
    <div className="flex flex-1 h-full bg-white overflow-hidden">

      <div className={`flex-1 flex flex-col min-w-0 ${showContactList ? "hidden sm:flex" : "flex"}`}>

        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-white">
          {activeContact ? (
            <>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowContactList(true)} className="sm:hidden p-1.5 -ml-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1F4E79] to-[#2E75B6] flex items-center justify-center text-white font-bold">
                    {activeContact.displayName.charAt(0)}
                  </div>
                  {onlineUsers.includes(activeContact.id) && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{activeContact.displayName}</p>
                  <p className="text-xs text-green-500">{isTyping ? "Đang nhập..." : onlineUsers.includes(activeContact.id) ? "Đang hoạt động" : "Ngoại tuyến"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setShowContactList(true)} className="sm:hidden relative p-2 hover:bg-gray-100 rounded-xl transition-colors text-[#1F4E79]">
                  <Users className="w-5 h-5" />
                  {totalUnread > 0 && <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">{totalUnread}</span>}
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-[#1F4E79]"><Phone className="w-5 h-5" /></button>
                <button onClick={() => setShowVideoCall(true)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-[#1F4E79]"><Video className="w-5 h-5" /></button>
                <button className="hidden sm:block p-2 hover:bg-gray-100 rounded-xl transition-colors text-[#1F4E79]"><Info className="w-5 h-5" /></button>
                <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"><MoreHorizontal className="w-5 h-5" /></button>
              </div>
            </>
          ) : <p className="text-gray-400 text-sm">Chọn một cuộc trò chuyện</p>}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
          {messages.length === 0 && !isTyping && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1F4E79] to-[#2E75B6] flex items-center justify-center text-white text-2xl font-bold">
                {activeContact?.displayName.charAt(0)}
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-600">{activeContact?.displayName}</p>
                <p className="text-sm mt-1">Hãy bắt đầu cuộc trò chuyện!</p>
              </div>
            </div>
          )}
          {messages.map((msg, index) => (
            <MessageBubble key={msg.id || index} msg={msg} prevMsg={messages[index - 1]} nextMsg={messages[index + 1]}
              currentUserId={currentUser.id} activeContact={activeContact} onReact={handleReact} onReply={setReplyingTo} />
          ))}
          {isTyping && (
            <div className="flex items-end gap-2 mt-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1F4E79] to-[#2E75B6] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {activeContact?.displayName.charAt(0)}
              </div>
              <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {replyingTo && (
          <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center gap-3">
            <Reply className="w-4 h-4 text-[#1F4E79] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#1F4E79]">{replyingTo.senderId === currentUser.id ? "Bạn" : activeContact?.displayName}</p>
              <p className="text-xs text-gray-500 truncate">{replyingTo.content}</p>
            </div>
            <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="px-4 py-3 bg-white border-t border-gray-100">
          <div className="flex items-center gap-2">
            <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFile}
              className="p-2 text-gray-400 hover:text-[#1F4E79] hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0">
              {uploadingFile ? <div className="w-5 h-5 border-2 border-[#1F4E79] border-t-transparent rounded-full animate-spin" /> : <Paperclip className="w-5 h-5" />}
            </button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
            <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2.5">
              <input ref={inputRef} type="text" placeholder="Aa" value={message}
                onChange={e => handleTyping(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                className="flex-1 bg-transparent text-sm focus:outline-none text-gray-800 placeholder-gray-400 min-w-0" />
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="relative">
                  <button onClick={() => { setShowGifPicker(v => !v); setShowEmojiPicker(false); }}
                    className={`p-2 rounded-lg transition-colors text-xs font-bold ${showGifPicker ? "bg-[#1F4E79] text-white" : "text-gray-400 hover:text-[#1F4E79] hover:bg-gray-100"}`}>
                    GIF
                  </button>
                  {showGifPicker && <GiphyPicker onSelect={handleSendGif} onClose={() => setShowGifPicker(false)} />}
                </div>
                <div className="relative">
                  <button onClick={() => { setShowEmojiPicker(v => !v); setShowGifPicker(false); }}
                    className={`p-2 rounded-lg transition-colors text-gray-400 hover:text-[#1F4E79] hover:bg-gray-100 ${showEmojiPicker ? "text-[#1F4E79] bg-gray-100" : ""}`}>
                    <Smile className="w-5 h-5" />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 grid grid-cols-6 gap-1 z-20 w-52">
                      {EMOJIS.map(emoji => (
                        <button key={emoji} onClick={() => { setMessage(prev => prev + emoji); setShowEmojiPicker(false); inputRef.current?.focus(); }}
                          className="text-xl hover:scale-125 transition-transform p-1 rounded-lg hover:bg-gray-100">{emoji}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {message.trim()
              ? <button onClick={handleSend} className="w-9 h-9 bg-gradient-to-br from-[#1F4E79] to-[#2E75B6] rounded-full flex items-center justify-center hover:opacity-90 transition-all flex-shrink-0 shadow-md"><Send className="w-4 h-4 text-white" /></button>
              : <button onClick={() => socketRef.current?.emit("sendMessage", { receiverId: activeContact?.id, content: "👍" })} className="text-2xl hover:scale-110 transition-transform flex-shrink-0">👍</button>
            }
          </div>
        </div>
      </div>

      <div className={`
        flex-col bg-white border-l border-gray-100
        w-full sm:w-72 sm:flex sm:flex-shrink-0
        ${showContactList ? "flex" : "hidden sm:flex"}
      `}>
        <div className="px-4 pt-5 pb-3">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Tin nhắn</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:bg-gray-200 transition-colors" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.map(contact => {
            const info = lastMessages[contact.id];
            const unread = info?.unreadCount || 0;
            const last = info?.lastMessage;
            const isActive = activeContact?.id === contact.id;
            return (
              <button key={contact.id} onClick={() => handleSelectContact(contact)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group relative ${isActive ? "bg-blue-50" : ""}`}>
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1F4E79] to-[#2E75B6] flex items-center justify-center text-white font-bold text-sm">
                    {contact.displayName.charAt(0)}
                  </div>
                  {onlineUsers.includes(contact.id) && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-semibold truncate ${isActive ? "text-[#1F4E79]" : "text-gray-800"}`}>{contact.displayName}</p>
                    {last?.createdAt && <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{formatLastTime(last.createdAt)}</span>}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className={`text-xs truncate ${unread > 0 ? "text-gray-800 font-semibold" : "text-gray-500"}`}>
                      {last ? (last.senderId === currentUser.id ? "Bạn: " : "") + (last.fileType === "gif" ? "GIF" : last.fileType === "image" ? "Hình ảnh" : last.fileType === "file" ? "File" : last.content || "") : contact.department}
                    </p>
                    {unread > 0 && <span className="ml-1 min-w-[18px] h-[18px] bg-[#1F4E79] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 flex-shrink-0">{unread > 99 ? "99+" : unread}</span>}
                  </div>
                </div>
                {isActive && (
                  <div role="button" onClick={e => { e.stopPropagation(); handleDeleteHistory(contact.id); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded-lg transition-all text-gray-400 hover:text-red-500 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-80 max-w-full text-center shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-gray-800 text-lg font-bold mb-2">Xóa lịch sử trò chuyện?</p>
            <p className="text-gray-500 text-sm mb-6">
              Toàn bộ tin nhắn với{" "}
              <span className="font-semibold text-gray-700">{deleteConfirm.displayName}</span>{" "}
              sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
                Hủy
              </button>
              <button onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {incomingCall && !showVideoCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-80 max-w-full text-center shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1F4E79] to-[#2E75B6] flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-white text-3xl font-bold">{incomingCall.callerName.charAt(0)}</span>
            </div>
            <p className="text-gray-500 text-sm mb-1">Cuộc gọi video đến</p>
            <p className="text-gray-800 text-xl font-bold mb-8">{incomingCall.callerName}</p>
            <div className="flex items-center justify-center gap-8">
              <div className="flex flex-col items-center gap-2">
                <button onClick={() => { socketRef.current?.emit("rejectCall", { callerId: incomingCall.callerId }); setIncomingCall(null); }}
                  className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors">
                  <Phone className="w-6 h-6 text-white rotate-[135deg]" />
                </button>
                <span className="text-xs text-gray-500">Từ chối</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <button onClick={() => setShowVideoCall(true)} className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors">
                  <Video className="w-6 h-6 text-white" />
                </button>
                <span className="text-xs text-gray-500">Chấp nhận</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showVideoCall && activeContact && socketRef.current && (
        <VideoCall
          key={incomingCall ? `in-${incomingCall.callerId}` : `out-${activeContact.id}`}
          socket={socketRef.current} currentUser={currentUser}
          contact={incomingCall ? { id: incomingCall.callerId, displayName: incomingCall.callerName } : activeContact}
          isIncoming={!!incomingCall} incomingSignal={incomingCall?.signal}
          onClose={() => { setShowVideoCall(false); setIncomingCall(null); }} />
      )}
    </div>
  );
}