import { useState, useEffect, useRef } from "react";
import {
  ThumbsUp, MessageCircle, Bookmark, X, Upload,
  File, Image, FileText, Trash2, PenSquare, TrendingUp, Clock,
  Flame, Filter, Eye, Hash, Users, BarChart2, ArrowLeft,
  Send, ChevronLeft, ChevronRight, Pencil, Check,
} from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import { useSearchParams } from "react-router-dom";

const POST_COLORS = [
  "from-blue-500 to-indigo-600",
  "from-pink-500 to-rose-600",
  "from-green-500 to-teal-600",
  "from-purple-500 to-violet-600",
  "from-orange-500 to-amber-600",
  "from-cyan-500 to-blue-600",
];

const CATEGORIES = ["Tất cả", "Công nghệ", "Marketing", "HR", "Kinh doanh", "Chuyển đổi số", "Khác"];
const SORT_OPTIONS = [
  { value: "newest",   label: "Mới nhất",  icon: Clock },
  { value: "popular",  label: "Phổ biến",  icon: Flame },
  { value: "trending", label: "Xu hướng",  icon: TrendingUp },
];
const POPULAR_TAGS = ["Docker", "5G", "AI", "DevOps", "Cloud", "React", "MobiFone", "Network"];

interface Attachment { filename: string; path: string; size: number; mimetype: string; }
interface Post {
  id: number; userId: number; title: string; content: string; category: string;
  attachments: string[]; likes: number; comments: number; views: number;
  createdAt: string; authorName?: string; authorRole?: string;
}
interface Comment {
  id: number; postId: number; userId: number; content: string;
  authorName?: string; createdAt: string;
}

function CreatePostModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Công nghệ");
  const [tags, setTags] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <Image className="w-4 h-4 text-blue-500" />;
    if (file.type.includes("pdf")) return <FileText className="w-4 h-4 text-red-500" />;
    return <File className="w-4 h-4 text-gray-500" />;
  };
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) { setError("Vui lòng nhập tiêu đề và nội dung!"); return; }
    setIsLoading(true); setError("");
    try {
      const token = sessionStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("title", title); formData.append("content", content);
      formData.append("category", category); formData.append("tags", tags);
      files.forEach(f => formData.append("files", f));
      const res = await fetch("/api/posts", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
      if (!res.ok) throw new Error();
      onSuccess(); onClose();
    } catch { setError("Lỗi tạo bài viết. Vui lòng thử lại!"); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#1F4E79] to-[#2E75B6] rounded-lg flex items-center justify-center">
              <PenSquare className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Tạo bài viết mới</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tiêu đề *</label>
            <input type="text" placeholder="Nhập tiêu đề bài viết..." value={title} onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-white text-gray-800 border border-gray-300 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:border-[#1F4E79]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Danh mục</label>
            <div className="flex gap-2 flex-wrap">
              {["Công nghệ","Marketing","HR","Kinh doanh","Chuyển đổi số","Khác"].map(cat => (
                <button key={cat} type="button" onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${category === cat ? "bg-[#1F4E79] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{cat}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tags</label>
            <input type="text" placeholder="Docker, DevOps, Cloud..." value={tags} onChange={e => setTags(e.target.value)}
              className="w-full px-4 py-2.5 bg-white text-gray-800 border border-gray-300 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:border-[#1F4E79]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nội dung *</label>
            <textarea placeholder="Nhập nội dung bài viết..." value={content} onChange={e => setContent(e.target.value)} rows={6}
              className="w-full px-4 py-2.5 bg-white text-gray-800 border border-gray-300 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:border-[#1F4E79] resize-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Đính kèm file</label>
            <div onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center cursor-pointer hover:border-[#1F4E79] hover:bg-blue-50 transition-colors">
              <Upload className="w-7 h-7 text-gray-400 mx-auto mb-1.5" />
              <p className="text-sm text-gray-500">Click để chọn file</p>
              <p className="text-xs text-gray-400 mt-0.5">Tối đa 50MB/file</p>
              <input ref={fileInputRef} type="file" multiple onChange={e => { if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]); }} className="hidden" />
            </div>
            {files.length > 0 && (
              <div className="mt-2 space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    {getFileIcon(file)}
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-700 truncate">{file.name}</p><p className="text-xs text-gray-400">{formatFileSize(file.size)}</p></div>
                    <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="p-1 hover:bg-red-100 rounded-lg transition-colors text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">Hủy</button>
          <button onClick={handleSubmit} disabled={isLoading}
            className="px-6 py-2 bg-gradient-to-r from-[#1F4E79] to-[#2E75B6] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50">
            {isLoading ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang đăng...</div> : "Đăng bài"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Forum() {
  const { darkMode } = useThemeStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [liked, setLiked] = useState<number[]>([]);
  const [saved, setSaved] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("newest");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [editingComment, setEditingComment] = useState<{ id: number; content: string } | null>(null);

  const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = sessionStorage.getItem("accessToken");

  // 🔔 Read postId and commentId from URL query param (from notification click)
  const [searchParams, setSearchParams] = useSearchParams();
  const targetPostId = searchParams.get("postId");
  const targetCommentId = searchParams.get("commentId");

  // Highlighted comment (blue border animation)
  const [highlightedCommentId, setHighlightedCommentId] = useState<number | null>(null);

  // Ref for comment section auto-scroll
  const commentSectionRef = useRef<HTMLDivElement>(null);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      setPosts(await res.json());
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };
  useEffect(() => { fetchPosts(); }, []);

  // 🔔 Auto-select post from notification click (?postId=...&commentId=...)
  useEffect(() => {
    if (!targetPostId || posts.length === 0) return;
    const target = posts.find(p => p.id === Number(targetPostId));
    if (target) {
      setSelectedPost(target);
      if (targetCommentId) {
        setHighlightedCommentId(Number(targetCommentId));
      }
      setSearchParams({}, { replace: true });
    }
  }, [targetPostId, posts]);

  // 🔔 Scroll to highlighted comment after comments load
  useEffect(() => {
    if (!highlightedCommentId || comments.length === 0) return;
    setTimeout(() => {
      const el = document.getElementById(`comment-${highlightedCommentId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        commentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 300);
    // Auto-remove highlight after 4 seconds
    const timer = setTimeout(() => setHighlightedCommentId(null), 4000);
    return () => clearTimeout(timer);
  }, [highlightedCommentId, comments]);

  useEffect(() => {
    if (!selectedPost) { setComments([]); setEditingComment(null); return; }
    const fetchComments = async () => {
      setLoadingComments(true);
      try {
        const res = await fetch(`/api/posts/${selectedPost.id}/comments`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setComments(await res.json());
      } catch { } finally { setLoadingComments(false); }
    };
    fetchComments();
  }, [selectedPost?.id]);

  const handlePostComment = async () => {
    if (!commentText.trim() || !selectedPost) return;
    setIsPostingComment(true);
    try {
      const res = await fetch(`/api/posts/${selectedPost.id}/comments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments(prev => [...prev, { ...newComment, authorName: newComment.authorName || currentUser.displayName }]);
        setCommentText("");
        setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, comments: p.comments + 1 } : p));
        // Auto-scroll to the new comment
        setTimeout(() => {
          commentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 100);
      }
    } catch { } finally { setIsPostingComment(false); }
  };

  const handleEditComment = async () => {
    if (!editingComment || !selectedPost) return;
    try {
      const res = await fetch(`/api/posts/${selectedPost.id}/comments/${editingComment.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content: editingComment.content }),
      });
      if (res.ok) {
        const updated = await res.json();
        setComments(prev => prev.map(c => c.id === editingComment.id ? { ...c, content: updated.content } : c));
        setEditingComment(null);
      }
    } catch { }
  };

  const handleDeleteComment = async (commentId: number, postId: number) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: Math.max(0, p.comments - 1) } : p));
      }
    } catch { }
  };

  const toggleLike = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await fetch(`/api/posts/${id}/like`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      setLiked(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } catch (err) { console.error(err); }
  };

  const handleDeletePost = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("Bạn có chắc muốn xóa bài viết này?")) return;
    try {
      await fetch(`/api/posts/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setPosts(prev => prev.filter(p => p.id !== id));
      if (selectedPost?.id === id) setSelectedPost(null);
    } catch (err) { console.error(err); }
  };

  const handleTagClick = (tag: string) => {
    if (activeTag === tag) { setActiveTag(null); setSearch(""); }
    else { setActiveTag(tag); setSearch(tag); }
  };

  // 🔔 Click comment count on post card → open post and scroll to comments
  const handleCommentClick = (post: Post, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedPost(post);
    setTimeout(() => {
      commentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
  };

  const formatTime = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "Vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  const formatFullDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const filteredPosts = posts
    .filter(post => {
      const matchSearch = post.title.toLowerCase().includes(search.toLowerCase()) || post.content.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === "Tất cả" || post.category === activeCategory;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sortBy === "popular") return (b.likes + b.comments) - (a.likes + a.comments);
      if (sortBy === "trending") return b.views - a.views;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const bg = darkMode ? "bg-[#131929]" : "bg-gray-50";
  const card = darkMode ? "bg-[#161b27] border-white/5" : "bg-white border-gray-100";
  const panelBg = darkMode ? "bg-[#161b27]" : "bg-white";
  const textMain = darkMode ? "text-white" : "text-gray-800";
  const textSub = darkMode ? "text-gray-400" : "text-gray-500";
  const hoverBg = darkMode ? "hover:bg-white/5" : "hover:bg-gray-50";
  const border = darkMode ? "border-white/5" : "border-gray-100";
  const inputBg = darkMode ? "bg-[#0f1117] border-white/10 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400";

  const previewAttachments: Attachment[] = (Array.isArray(selectedPost?.attachments)
    ? selectedPost!.attachments : []
  ).map(a => { try { return JSON.parse(a); } catch { return null; } }).filter(Boolean);

  const previewColorIndex = selectedPost ? filteredPosts.findIndex(p => p.id === selectedPost.id) % POST_COLORS.length : 0;
  const compact = !!selectedPost;

  return (
    <div className={`h-full flex flex-col ${bg}`}>
      <div className="flex-1 overflow-hidden flex">

        {/* ── Col 1: Sidebar ── */}
        <div className={`flex-shrink-0 border-r overflow-y-auto transition-all duration-300 relative ${panelBg} ${border} ${sidebarOpen ? "w-72" : "w-10"}`}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`absolute top-3 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${darkMode ? "bg-white/10 hover:bg-white/20 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-500"}`}>
            {sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {sidebarOpen && (
            <div className="p-3 space-y-4 pt-4">
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1 ${textSub}`}>Danh mục</p>
                <div className="space-y-0.5">
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${activeCategory === cat ? "bg-[#1F4E79] text-white" : `${textSub} ${hoverBg}`}`}>
                      <Hash className="w-3 h-3 flex-shrink-0" />{cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1 ${textSub}`}>Tags phổ biến</p>
                <div className="flex flex-wrap gap-1">
                  {POPULAR_TAGS.map(tag => (
                    <button key={tag} onClick={() => handleTagClick(tag)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${activeTag === tag ? "bg-[#1F4E79] text-white" : darkMode ? "bg-white/5 text-gray-300 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
              <div className={`rounded-xl p-3 border ${card}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${textSub}`}>Thống kê</p>
                <div className="space-y-1.5">
                  {[
                    { icon: FileText, label: "Bài viết", value: posts.length },
                    { icon: Users, label: "Thành viên", value: "—" },
                    { icon: BarChart2, label: "Lượt xem", value: posts.reduce((a, p) => a + (p.views || 0), 0) },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className={`flex items-center gap-1.5 text-xs ${textSub}`}><item.icon className="w-3 h-3" />{item.label}</div>
                      <span className={`text-xs font-bold ${textMain}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Col 2: Feed ── */}
        <div className={`flex-1 border-r overflow-y-auto ${border}`}>
          <div className="py-4 px-4 space-y-4">
            <div className={`rounded-2xl border cursor-pointer transition-all hover:shadow-md ${card} ${compact ? "p-3" : "p-4"}`}
              onClick={() => setShowCreateModal(true)}>
              <div className="flex items-center gap-3">
                <div className={`rounded-full bg-gradient-to-br from-[#1F4E79] to-[#2E75B6] flex items-center justify-center flex-shrink-0 ${compact ? "w-8 h-8" : "w-10 h-10"}`}>
                  <span className={`text-white font-bold ${compact ? "text-xs" : "text-sm"}`}>{currentUser.displayName?.charAt(0) || "U"}</span>
                </div>
                <div className={`flex-1 px-4 rounded-xl ${compact ? "py-2 text-xs" : "py-3 text-base"} ${darkMode ? "bg-white/5 text-gray-500" : "bg-gray-100 text-gray-400"}`}>
                  Bạn đang nghĩ gì? Chia sẻ với mọi người...
                </div>
                <button className={`flex items-center gap-1.5 px-3 bg-gradient-to-r from-[#1F4E79] to-[#2E75B6] text-white font-semibold rounded-lg flex-shrink-0 ${compact ? "py-1.5 text-[11px]" : "py-2 text-xs"}`}>
                  <PenSquare className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} /> Đăng bài
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setSortBy(opt.value)}
                    className={`flex items-center gap-1.5 rounded-lg font-medium transition-colors ${compact ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-2 text-xs"} ${sortBy === opt.value ? "bg-[#1F4E79] text-white" : `${textSub} ${hoverBg}`}`}>
                    <opt.icon className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />{opt.label}
                  </button>
                ))}
              </div>
              <div className={`flex items-center gap-1 ${compact ? "text-[11px]" : "text-xs"} ${textSub}`}>
                <Filter className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />{filteredPosts.length} bài viết
              </div>
            </div>

            {isLoading && <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-[#1F4E79] border-t-transparent rounded-full animate-spin" /></div>}

            {!isLoading && filteredPosts.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3"><FileText className="w-7 h-7 text-gray-300" /></div>
                <p className="font-medium">Không có bài viết nào</p>
              </div>
            )}

            {filteredPosts.map((post, index) => {
              const isSelected = selectedPost?.id === post.id;
              const isLiked = liked.includes(post.id);
              const isSaved = saved.includes(post.id);
              return (
                <div key={post.id} onClick={() => setSelectedPost(isSelected ? null : post)}
                  className={`rounded-2xl border overflow-hidden transition-all cursor-pointer hover:shadow-md ${card} ${isSelected ? "ring-2 ring-[#1F4E79]" : ""}`}>
                  <div className={`bg-gradient-to-r ${POST_COLORS[index % POST_COLORS.length]} ${compact ? "h-1" : "h-1.5"}`} />
                  <div className={compact ? "p-4" : "p-5"}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`rounded-full bg-gradient-to-br ${POST_COLORS[index % POST_COLORS.length]} flex items-center justify-center flex-shrink-0 ${compact ? "w-7 h-7" : "w-9 h-9"}`}>
                          <span className={`text-white font-bold ${compact ? "text-[10px]" : "text-xs"}`}>{post.authorName?.charAt(0) || "U"}</span>
                        </div>
                        <div>
                          <p className={`font-semibold ${textMain} ${compact ? "text-xs" : "text-base"}`}>{post.authorName || "Người dùng"}</p>
                          <p className={`${textSub} ${compact ? "text-[10px]" : "text-xs"}`}>• {formatTime(post.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${compact ? "text-[10px]" : "text-xs"} ${darkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-[#1F4E79]"}`}>{post.category}</span>
                        {post.userId === currentUser.id && (
                          <button onClick={e => handleDeletePost(post.id, e)} className="p-1 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-500">
                            <Trash2 className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
                          </button>
                        )}
                      </div>
                    </div>
                    <h3 className={`font-bold mb-2 leading-snug hover:text-[#1F4E79] transition-colors ${textMain} ${compact ? "text-sm" : "text-xl"}`}>{post.title}</h3>
                    <p className={`leading-relaxed line-clamp-2 ${textSub} ${compact ? "text-xs" : "text-base"}`}>{post.content}</p>
                    <div className={`flex items-center gap-0.5 mt-3 pt-3 border-t ${border}`}>
                      <button onClick={e => { e.stopPropagation(); toggleLike(post.id); }}
                        className={`flex items-center gap-1.5 px-2.5 rounded-lg font-medium transition-all ${compact ? "py-1.5 text-xs" : "py-2 text-sm"} ${isLiked ? "text-[#1F4E79]" : `${textSub} ${hoverBg}`}`}>
                        <ThumbsUp className={`${compact ? "w-3.5 h-3.5" : "w-4 h-4"} ${isLiked ? "fill-[#1F4E79]" : ""}`} />
                        {post.likes + (isLiked ? 1 : 0)}
                      </button>
                      {/* 🔔 Click comment count → open post + scroll to comments */}
                      <button onClick={e => handleCommentClick(post, e)}
                        className={`flex items-center gap-1.5 px-2.5 rounded-lg font-medium transition-colors ${compact ? "py-1.5 text-xs" : "py-2 text-sm"} ${isSelected ? "text-[#1F4E79]" : `${textSub} ${hoverBg}`}`}>
                        <MessageCircle className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />{post.comments}
                      </button>
                      <button onClick={e => e.stopPropagation()}
                        className={`flex items-center gap-1.5 px-2.5 rounded-lg font-medium transition-colors ${compact ? "py-1.5 text-xs" : "py-2 text-sm"} ${textSub} ${hoverBg}`}>
                        <Eye className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />{post.views || 0}
                      </button>
                      <button onClick={e => { e.stopPropagation(); setSaved(prev => prev.includes(post.id) ? prev.filter(i => i !== post.id) : [...prev, post.id]); }}
                        className={`flex items-center gap-1.5 px-2.5 rounded-lg font-medium ml-auto transition-all ${compact ? "py-1.5 text-xs" : "py-2 text-sm"} ${isSaved ? "text-[#1F4E79]" : `${textSub} ${hoverBg}`}`}>
                        <Bookmark className={`${compact ? "w-3.5 h-3.5" : "w-4 h-4"} ${isSaved ? "fill-[#1F4E79]" : ""}`} />
                        {!compact && (isSaved ? "Đã lưu" : "Lưu")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Col 3: Preview + Comments (COMPACT WIDTH: w-72) ── */}
        {selectedPost && (
          <div className={`w-80 flex-shrink-0 overflow-y-auto flex flex-col border-l ${panelBg} ${border}`}>
            <div className={`h-1.5 bg-gradient-to-r ${POST_COLORS[previewColorIndex]}`} />
            <div className={`sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-2 ${panelBg} ${border}`}>
              <button onClick={() => setSelectedPost(null)} className={`p-1.5 rounded-lg transition-colors ${hoverBg} ${textSub}`}>
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className={`text-sm font-semibold flex-1 truncate ${textMain}`}>Chi tiết bài viết</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${darkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-[#1F4E79]"}`}>{selectedPost.category}</span>
            </div>

            <div className="p-4 space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${POST_COLORS[previewColorIndex]} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-sm font-bold">{selectedPost.authorName?.charAt(0) || "U"}</span>
                </div>
                <div>
                  <p className={`text-sm font-bold ${textMain}`}>{selectedPost.authorName || "Người dùng"}</p>
                  <p className={`text-xs ${textSub}`}>{selectedPost.authorRole || ""}</p>
                  <p className={`text-xs ${textSub}`}>{formatFullDate(selectedPost.createdAt)}</p>
                </div>
              </div>

              <h2 className={`text-lg font-bold leading-snug ${textMain}`}>{selectedPost.title}</h2>
              <div className={`text-sm leading-relaxed whitespace-pre-wrap ${textSub}`}>{selectedPost.content}</div>

              {previewAttachments.length > 0 && (
                <div className="space-y-2">
                  <p className={`text-xs font-semibold ${textSub}`}>File đính kèm ({previewAttachments.length})</p>
                  {previewAttachments.map((att, i) => (
                    <a key={i} href={att.path} target="_blank" rel="noopener noreferrer"
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors hover:border-[#1F4E79] ${darkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`}>
                      {att.mimetype?.startsWith("image/") ? <Image className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        : att.mimetype?.includes("pdf") ? <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                        : <File className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                      <span className={`text-xs font-medium truncate flex-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{att.filename}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {att.size < 1024 * 1024 ? `${(att.size / 1024).toFixed(1)} KB` : `${(att.size / (1024 * 1024)).toFixed(1)} MB`}
                      </span>
                    </a>
                  ))}
                </div>
              )}

              <div className={`border-t ${border}`} />

              <div className="flex items-center gap-2">
                <button onClick={() => toggleLike(selectedPost.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all flex-1 justify-center ${liked.includes(selectedPost.id) ? "bg-[#1F4E79]/10 text-[#1F4E79]" : `border ${border} ${textSub} ${hoverBg}`}`}>
                  <ThumbsUp className={`w-4 h-4 ${liked.includes(selectedPost.id) ? "fill-[#1F4E79]" : ""}`} />
                  {selectedPost.likes + (liked.includes(selectedPost.id) ? 1 : 0)}
                </button>
                <button onClick={() => setSaved(prev => prev.includes(selectedPost.id) ? prev.filter(i => i !== selectedPost.id) : [...prev, selectedPost.id])}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all flex-1 justify-center ${saved.includes(selectedPost.id) ? "bg-[#1F4E79]/10 text-[#1F4E79]" : `border ${border} ${textSub} ${hoverBg}`}`}>
                  <Bookmark className={`w-4 h-4 ${saved.includes(selectedPost.id) ? "fill-[#1F4E79]" : ""}`} />
                  {saved.includes(selectedPost.id) ? "Đã lưu" : "Lưu"}
                </button>
              </div>

              {/* ── Comments Section (with ref for auto-scroll) ── */}
              <div ref={commentSectionRef} className={`border-t pt-4 ${border}`}>
                <p className={`text-xs font-bold mb-3 flex items-center gap-2 ${textMain}`}>
                  <MessageCircle className="w-3.5 h-3.5 text-[#1F4E79]" />
                  Bình luận ({comments.length})
                </p>

                {/* Input */}
                <div className="flex items-start gap-2 mb-4">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1F4E79] to-[#2E75B6] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[10px] font-bold">{currentUser.displayName?.charAt(0) || "U"}</span>
                  </div>
                  <div className="flex-1 flex items-center gap-1.5">
                    <input type="text" placeholder="Viết bình luận..." value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && handlePostComment()}
                      className={`flex-1 px-2.5 py-1.5 rounded-xl border text-xs focus:outline-none focus:border-[#1F4E79] transition-colors ${inputBg}`} />
                    <button onClick={handlePostComment} disabled={!commentText.trim() || isPostingComment}
                      className="w-7 h-7 bg-gradient-to-br from-[#1F4E79] to-[#2E75B6] rounded-full flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-40 flex-shrink-0">
                      {isPostingComment
                        ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Send className="w-2.5 h-2.5 text-white" />}
                    </button>
                  </div>
                </div>

                {/* Comment list */}
                {loadingComments ? (
                  <div className="flex justify-center py-4">
                    <div className="w-4 h-4 border-2 border-[#1F4E79] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className={`text-xs text-center py-4 ${textSub}`}>Chưa có bình luận nào</p>
                ) : (
                  <div className="space-y-2">
                    {comments.map(comment => (
                      <div key={comment.id} id={`comment-${comment.id}`}
                        className="flex items-start gap-2 group">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[9px] font-bold">{comment.authorName?.charAt(0) || "U"}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingComment?.id === comment.id ? (
                            <div className="flex items-center gap-1.5">
                              <input type="text" value={editingComment.content}
                                onChange={e => setEditingComment(prev => prev ? { ...prev, content: e.target.value } : null)}
                                onKeyDown={e => { if (e.key === "Enter") handleEditComment(); if (e.key === "Escape") setEditingComment(null); }}
                                className={`flex-1 px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-[#1F4E79] ${inputBg}`}
                                autoFocus />
                              <button onClick={handleEditComment} className="p-1 bg-[#1F4E79] rounded-lg text-white hover:bg-[#2E75B6] transition-colors">
                                <Check className="w-2.5 h-2.5" />
                              </button>
                              <button onClick={() => setEditingComment(null)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ) : (
                            <div className={`px-2.5 py-1.5 rounded-lg text-xs transition-all duration-500 ${
                              highlightedCommentId === comment.id
                                ? "ring-2 ring-[#2E75B6] bg-blue-50 shadow-md shadow-blue-200/50"
                                : darkMode ? "bg-white/5" : "bg-gray-100"
                            }`}>
                              <p className={`text-xs font-semibold mb-0.5 ${textMain}`}>{comment.authorName || "Người dùng"}</p>
                              <p className={`text-xs leading-relaxed ${textMain}`}>{comment.content}</p>
                            </div>
                          )}
                          <p className={`text-[9px] mt-1 ml-1 ${textSub}`}>{formatTime(comment.createdAt)}</p>
                        </div>
                        {comment.userId === currentUser.id && editingComment?.id !== comment.id && (
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                            <button onClick={() => setEditingComment({ id: comment.id, content: comment.content })}
                              className="p-0.5 text-gray-400 hover:text-[#1F4E79] hover:bg-blue-50 rounded-lg transition-colors">
                              <Pencil className="w-2.5 h-2.5" />
                            </button>
                            <button onClick={() => handleDeleteComment(comment.id, selectedPost.id)}
                              className="p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedPost.userId === currentUser.id && (
                <button onClick={() => handleDeletePost(selectedPost.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-500 text-xs font-medium rounded-xl hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Xóa bài viết
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      {showCreateModal && <CreatePostModal onClose={() => setShowCreateModal(false)} onSuccess={fetchPosts} />}
    </div>
  );
}