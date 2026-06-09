import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Server, HardDrive, Cpu, RefreshCw,
  File, Image, FileText, Trash2, Search,
  Upload, Settings, CheckCircle, AlertCircle, Eye,
  X
} from "lucide-react";

interface OutletContext { darkMode: boolean; }

interface SystemInfo {
  appName: string;
  version: string;
  environment: string;
  nodeVersion: string;
  uptime: string;
  startedAt: string;
  memory: { used: number; total: number; rss: number };
  storage: { totalFiles: number; totalSizeMB: number };
}

interface UploadedFile {
  filename: string;
  url: string;
  sizeMB: number;
  sizeKB: number;
  type: string;
  ext: string;
  createdAt: string;
}

interface Features {
  forum: boolean;
  chat: boolean;
  videoCall: boolean;
  fileUpload: boolean;
  gifSearch: boolean;
  notifications: boolean;
}

const FEATURE_LABELS: Record<string, { label: string; desc: string }> = {
  forum:         { label: "Diễn đàn",         desc: "Cho phép đăng và xem bài viết trên forum" },
  chat:          { label: "Tin nhắn",          desc: "Tính năng nhắn tin trực tiếp giữa nhân viên" },
  videoCall:     { label: "Gọi video",         desc: "Cuộc gọi video trực tiếp trong chat" },
  fileUpload:    { label: "Upload file",        desc: "Đính kèm file trong chat và forum" },
  gifSearch:     { label: "Tìm kiếm GIF",      desc: "Tích hợp GIPHY để gửi GIF trong chat" },
  notifications: { label: "Thông báo",         desc: "Hệ thống thông báo real-time" },
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function AdminSystem() {
  const { darkMode } = useOutletContext<OutletContext>();
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [features, setFeatures] = useState<Features | null>(null);
  const [maxFileSizeMB, setMaxFileSizeMB] = useState(50);
  const [tempMaxSize, setTempMaxSize] = useState(50);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fileSearch, setFileSearch] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);

  const token = sessionStorage.getItem("accessToken");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const [infoRes, filesRes, featuresRes, uploadRes] = await Promise.all([
        fetch("/api/system/info", { headers }),
        fetch("/api/system/files", { headers }),
        fetch("/api/system/features", { headers }),
        fetch("/api/system/upload-config", { headers }),
      ]);
      if (infoRes.ok) setSysInfo(await infoRes.json());
      if (filesRes.ok) setFiles(await filesRes.json());
      if (featuresRes.ok) setFeatures(await featuresRes.json());
      if (uploadRes.ok) {
        const cfg = await uploadRes.json();
        setMaxFileSizeMB(cfg.maxFileSizeMB);
        setTempMaxSize(cfg.maxFileSizeMB);
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); if (!silent) setIsRefreshing(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleToggleFeature = async (key: string, current: boolean) => {
    try {
      const res = await fetch(`/api/system/features/${key}`, {
        method: "PATCH", headers,
        body: JSON.stringify({ enabled: !current }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFeatures(updated);
        showToast(`${!current ? "✅ Bật" : "⛔ Tắt"} ${FEATURE_LABELS[key]?.label}`);
      }
    } catch { showToast("Lỗi cập nhật tính năng", "error"); }
  };

  const handleDeleteFile = async (file: UploadedFile) => {
    if (!confirm(`Xóa file "${file.filename}"?`)) return;
    try {
      const res = await fetch(`/api/system/files/${file.filename}`, { method: "DELETE", headers });
      if (res.ok) {
        setFiles(prev => prev.filter(f => f.filename !== file.filename));
        if (sysInfo) setSysInfo(prev => prev ? {
          ...prev,
          storage: {
            totalFiles: prev.storage.totalFiles - 1,
            totalSizeMB: Math.round((prev.storage.totalSizeMB - file.sizeMB) * 100) / 100,
          }
        } : null);
        showToast("🗑️ Đã xóa file");
      }
    } catch { showToast("Lỗi xóa file", "error"); }
  };

  const handleSaveUploadConfig = async () => {
    try {
      const res = await fetch("/api/system/upload-config", {
        method: "PATCH", headers,
        body: JSON.stringify({ maxFileSizeMB: tempMaxSize }),
      });
      if (res.ok) { setMaxFileSizeMB(tempMaxSize); showToast(`✅ Đã cập nhật giới hạn upload: ${tempMaxSize}MB`); }
    } catch { showToast("Lỗi cập nhật cấu hình", "error"); }
  };

  const filteredFiles = files.filter(f => {
    const matchSearch = f.filename.toLowerCase().includes(fileSearch.toLowerCase());
    const matchType = fileTypeFilter === "all" || f.type === fileTypeFilter;
    return matchSearch && matchType;
  });

  // Theme
  const bg = darkMode ? "bg-[#0f1117]" : "bg-gray-100";
  const card = darkMode ? "bg-[#161b27] border-white/5" : "bg-white border-gray-200";
  const textMain = darkMode ? "text-white" : "text-gray-800";
  const textSub = darkMode ? "text-gray-400" : "text-gray-500";
  const inputBg = darkMode ? "bg-[#0f1117] border-white/10 text-white placeholder-gray-500" : "bg-white border-gray-300 text-gray-800 placeholder-gray-400";
  const hoverBg = darkMode ? "hover:bg-white/5" : "hover:bg-gray-50";
  const divider = darkMode ? "border-white/5" : "border-gray-100";

  const getFileIcon = (type: string) => {
    if (type === "image") return <Image className="w-4 h-4 text-blue-500" />;
    if (type === "pdf") return <FileText className="w-4 h-4 text-red-500" />;
    return <File className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className={`p-6 space-y-6 h-full overflow-y-auto ${bg}`}>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium flex items-center gap-2 max-w-sm ${
          toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Preview modal */}
      {previewFile && previewFile.type === "image" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setPreviewFile(null)}>
          <div className="relative max-w-3xl w-full">
            <img src={previewFile.url} alt={previewFile.filename} className="w-full rounded-2xl shadow-2xl" />
            <button onClick={() => setPreviewFile(null)}
              className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
            <p className="text-white text-center text-sm mt-3 opacity-70">{previewFile.filename}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold ${textMain}`}>Cấu hình hệ thống</h1>
          <p className={`text-sm mt-0.5 ${textSub}`}>Thông tin, tệp upload và cấu hình tính năng</p>
        </div>
        <button onClick={() => fetchAll()} disabled={isRefreshing}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${inputBg} ${hoverBg}`}>
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#1F4E79]" : "text-gray-400"}`} />
          Làm mới
        </button>
      </div>

      {/* ── Section 1: Thông tin hệ thống ── */}
      <div className={`rounded-2xl border ${card}`}>
        <div className={`px-5 py-4 border-b ${divider} flex items-center gap-2`}>
          <Server className="w-4 h-4 text-[#1F4E79]" />
          <h2 className={`font-bold text-sm ${textMain}`}>Thông tin hệ thống</h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10"><div className="w-6 h-6 border-4 border-[#1F4E79] border-t-transparent rounded-full animate-spin" /></div>
        ) : sysInfo ? (
          <div className="p-5 grid grid-cols-2 gap-4">
            {/* Left: app info */}
            <div className="space-y-3">
              {[
                { label: "Ứng dụng",     value: sysInfo.appName },
                { label: "Phiên bản",    value: sysInfo.version },
                { label: "Môi trường",   value: sysInfo.environment.toUpperCase(), badge: true },
                { label: "Node.js",      value: sysInfo.nodeVersion },
                { label: "Khởi động lúc",value: formatDate(sysInfo.startedAt) },
                { label: "Uptime",       value: sysInfo.uptime },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className={`text-xs ${textSub}`}>{item.label}</span>
                  {item.badge ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      sysInfo.environment === "production"
                        ? "bg-green-50 text-green-600 border border-green-200"
                        : "bg-yellow-50 text-yellow-600 border border-yellow-200"
                    }`}>{item.value}</span>
                  ) : (
                    <span className={`text-xs font-semibold ${textMain}`}>{item.value}</span>
                  )}
                </div>
              ))}
            </div>
            {/* Right: resource usage */}
            <div className="space-y-4">
              {/* Memory */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`flex items-center gap-1.5 text-xs ${textSub}`}><Cpu className="w-3.5 h-3.5" />Bộ nhớ (Heap)</div>
                  <span className={`text-xs font-bold ${textMain}`}>{sysInfo.memory.used} / {sysInfo.memory.total} MB</span>
                </div>
                <div className={`w-full h-2 rounded-full ${darkMode ? "bg-white/10" : "bg-gray-100"}`}>
                  <div className="h-2 rounded-full bg-gradient-to-r from-[#1F4E79] to-[#2E75B6] transition-all"
                    style={{ width: `${Math.min(100, (sysInfo.memory.used / sysInfo.memory.total) * 100)}%` }} />
                </div>
                <p className={`text-[10px] mt-0.5 ${textSub}`}>RSS: {sysInfo.memory.rss} MB</p>
              </div>

              {/* Storage */}
              <div className={`p-3 rounded-xl ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <HardDrive className={`w-3.5 h-3.5 ${textSub}`} />
                  <span className={`text-xs font-semibold ${textMain}`}>Dung lượng Upload</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <p className={`text-2xl font-bold text-[#1F4E79]`}>{sysInfo.storage.totalFiles}</p>
                    <p className={`text-[10px] ${textSub}`}>File</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold text-[#2E75B6]`}>{sysInfo.storage.totalSizeMB}</p>
                    <p className={`text-[10px] ${textSub}`}>MB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Section 2: Quản lý file upload ── */}
      <div className={`rounded-2xl border ${card}`}>
        <div className={`px-5 py-4 border-b ${divider} flex items-center justify-between flex-wrap gap-3`}>
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#1F4E79]" />
            <h2 className={`font-bold text-sm ${textMain}`}>Quản lý file upload</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? "bg-white/10 text-gray-300" : "bg-gray-100 text-gray-500"}`}>{files.length} file</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" placeholder="Tìm file..." value={fileSearch}
                onChange={e => setFileSearch(e.target.value)}
                className={`pl-8 pr-3 py-1.5 rounded-lg border text-xs focus:outline-none w-40 ${inputBg}`} />
            </div>
            <select value={fileTypeFilter} onChange={e => setFileTypeFilter(e.target.value)}
              className={`px-2 py-1.5 rounded-lg border text-xs focus:outline-none ${inputBg}`}>
              <option value="all">Tất cả</option>
              <option value="image">Hình ảnh</option>
              <option value="pdf">PDF</option>
              <option value="file">Khác</option>
            </select>
          </div>
        </div>

        {filteredFiles.length === 0 ? (
          <div className="text-center py-10">
            <HardDrive className={`w-10 h-10 mx-auto mb-2 ${darkMode ? "text-gray-700" : "text-gray-300"}`} />
            <p className={`text-sm ${textSub}`}>Không có file nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredFiles.map(file => (
              <div key={file.filename} className={`flex items-center gap-4 px-5 py-3 transition-colors ${hoverBg}`}>
                {/* Icon/Preview */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
                  {file.type === "image"
                    ? <img src={file.url} alt={file.filename} className="w-10 h-10 rounded-xl object-cover" />
                    : getFileIcon(file.type)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${textMain}`}>{file.filename}</p>
                  <div className={`flex items-center gap-2 mt-0.5 text-[10px] ${textSub}`}>
                    <span className={`px-1.5 py-0.5 rounded-md font-bold ${darkMode ? "bg-white/10" : "bg-gray-100"}`}>{file.ext}</span>
                    <span>{file.sizeKB < 1024 ? `${file.sizeKB} KB` : `${file.sizeMB} MB`}</span>
                    <span>•</span>
                    <span>{formatDate(file.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {file.type === "image" && (
                    <button onClick={() => setPreviewFile(file)}
                      className={`p-1.5 rounded-lg transition-colors ${textSub} ${hoverBg}`} title="Xem trước">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <a href={file.url} target="_blank" rel="noopener noreferrer"
                    className={`p-1.5 rounded-lg transition-colors ${textSub} ${hoverBg}`} title="Mở file">
                    <File className="w-3.5 h-3.5" />
                  </a>
                  <button onClick={() => handleDeleteFile(file)}
                    className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-red-500 hover:bg-red-50" title="Xóa">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 3: Bật/tắt tính năng ── */}
      <div className={`rounded-2xl border ${card}`}>
        <div className={`px-5 py-4 border-b ${divider} flex items-center gap-2`}>
          <Settings className="w-4 h-4 text-[#1F4E79]" />
          <h2 className={`font-bold text-sm ${textMain}`}>Cấu hình tính năng</h2>
        </div>
        <div className={`divide-y ${divider}`}>
          {features && Object.entries(features).map(([key, enabled]) => {
            const info = FEATURE_LABELS[key];
            if (!info) return null;
            return (
              <div key={key} className={`flex items-center justify-between px-5 py-4 transition-colors ${hoverBg}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${enabled ? "bg-green-400" : "bg-gray-300"}`} />
                  <div>
                    <p className={`text-sm font-semibold ${textMain}`}>{info.label}</p>
                    <p className={`text-xs ${textSub}`}>{info.desc}</p>
                  </div>
                </div>
                <button onClick={() => handleToggleFeature(key, enabled)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    enabled
                      ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                      : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
                  }`}>
                  {enabled
                    ? <><CheckCircle className="w-3.5 h-3.5" /> Đang bật</>
                    : <><AlertCircle className="w-3.5 h-3.5" /> Đang tắt</>}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 4: Cấu hình upload ── */}
      <div className={`rounded-2xl border ${card}`}>
        <div className={`px-5 py-4 border-b ${divider} flex items-center gap-2`}>
          <Upload className="w-4 h-4 text-[#1F4E79]" />
          <h2 className={`font-bold text-sm ${textMain}`}>Cấu hình upload</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className={`block text-xs font-semibold mb-2 ${textMain}`}>
              Giới hạn kích thước file tối đa: <span className="text-[#1F4E79]">{tempMaxSize} MB</span>
            </label>
            <div className="flex items-center gap-4">
              <input type="range" min={1} max={200} value={tempMaxSize}
                onChange={e => setTempMaxSize(Number(e.target.value))}
                className="flex-1 accent-[#1F4E79]" />
              <input type="number" min={1} max={200} value={tempMaxSize}
                onChange={e => setTempMaxSize(Number(e.target.value))}
                className={`w-20 px-3 py-1.5 rounded-xl border text-sm text-center focus:outline-none focus:border-[#1F4E79] ${inputBg}`} />
              <span className={`text-xs ${textSub}`}>MB</span>
            </div>
            <div className={`flex gap-2 mt-2 text-[10px] ${textSub}`}>
              {[5, 10, 25, 50, 100].map(v => (
                <button key={v} onClick={() => setTempMaxSize(v)}
                  className={`px-2 py-1 rounded-lg border transition-colors ${tempMaxSize === v ? "bg-[#1F4E79] text-white border-[#1F4E79]" : `${hoverBg} ${darkMode ? "border-white/10" : "border-gray-200"}`}`}>
                  {v}MB
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className={`text-xs ${textSub}`}>Hiện tại: <span className="font-semibold text-[#1F4E79]">{maxFileSizeMB} MB</span></p>
            <button onClick={handleSaveUploadConfig} disabled={tempMaxSize === maxFileSizeMB}
              className="px-4 py-2 bg-gradient-to-r from-[#1F4E79] to-[#2E75B6] text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-40">
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
