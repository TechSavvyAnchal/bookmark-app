import React, { useState, useEffect, useRef, Component } from "react";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Plus, Search, Loader2, LayoutGrid, List, Filter, ArrowUpDown, Star, Sparkles, ArrowUpRight, Key, Mail, Trash2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import LinkCard from "../components/LinkCard";
import AddLink from "../components/AddLink";
import toast from "react-hot-toast";
import { useSocket } from "../context/SocketContext";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Dashboard ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-red-500">
          <h2>Something went wrong rendering the Dashboard.</h2>
          <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-4 mt-2 rounded">{this.state.error && this.state.error.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const SkeletonCard = () => (
  <div className="bg-white/40 dark:bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-6 border border-white/60 dark:border-white/10 animate-pulse flex flex-col h-full min-h-[400px]">
    <div className="flex justify-between items-start mb-6">
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
      <div className="flex gap-2">
        <div className="w-20 h-8 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
      </div>
    </div>
    <div className="space-y-4 flex-grow">
      <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-xl w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/2"></div>
      <div className="flex gap-2 mt-6">
        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
      </div>
      <div className="mt-8 h-24 bg-gray-200/50 dark:bg-gray-800/50 rounded-[1.5rem] w-full"></div>
    </div>
    <div className="flex justify-between mt-auto pt-6 border-t border-gray-100 dark:border-gray-800">
      <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
      <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
    </div>
  </div>
);

function Dashboard() {
  const [bookmarks, setBookmarks] = useState([]);
  const [sparkLink, setSparkLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [filterCategory, setFilterCategory] = useState("All");
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("date-desc"); // date-desc, date-asc, title-asc
  const [isSemantic, setIsSemantic] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSendingDigest, setIsSendingDigest] = useState(false);
  
  const dashboardRef = useRef(null);
  const socket = useSocket();

  useEffect(() => {
    if (socket) {
      socket.on("linkUpdate", (data) => {
        console.log("[SOCKET] Received link update:", data);
        if (data.action === "create") {
          setBookmarks(prev => {
            if (prev.find(b => b._id === data.link._id)) return prev;
            return [data.link, ...prev];
          });
        } else if (data.action === "delete") {
          setBookmarks(prev => prev.filter(b => b._id !== data.linkId));
        } else if (data.action === "update") {
          setBookmarks(prev => prev.map(b => b._id === data.link._id ? data.link : b));
        }
      });

      return () => socket.off("linkUpdate");
    }
  }, [socket]);

  const fetchBookmarks = async (searchQuery = "") => {
    setLoading(true);
    try {
      let res;
      if (isSemantic && searchQuery) {
        setIsSearching(true);
        res = await api.post(`/links/search`, { query: searchQuery });
      } else {
        res = await api.get(`/links`);
      }
      setBookmarks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch bookmarks:", err);
      toast.error("Failed to load bookmarks.");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      setLoading(true);
      try {
        const sparkRes = await api.get(`/links/spark`);
        setSparkLink(sparkRes.data);
      } catch (e) { }
      
      try {
        await fetchBookmarks();
      } catch (e) {
        console.error("Main fetch failed:", e.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [isSemantic]);

  const handleTriggerDigest = async () => {
    setIsSendingDigest(true);
    const toastId = toast.loading("Generating your weekly digest...");
    try {
      const res = await api.post(`/links/trigger-digest`);
      toast.success(res.data.msg, { id: toastId });
    } catch (err) {
      toast.error(err.response?.data || "Failed to send digest.", { id: toastId });
    } finally {
      setIsSendingDigest(false);
    }
  };

  const today = new Date().toDateString();
  const todayReadTime = (Array.isArray(bookmarks) ? bookmarks : [])
    .filter(b => b && b.createdAt && new Date(b.createdAt).toDateString() === today)
    .reduce((acc, b) => acc + (b.readTime || 2), 0);
  const readingGoal = 30;
  const progressPercent = Math.min((todayReadTime / readingGoal) * 100, 100);

  const handleAdd = async (newBookmark) => {
    try {
      const res = await api.post(`/links`, newBookmark);
      // Immediately update local state so user sees it
      setBookmarks(prev => [res.data, ...prev]);
      toast.success("Link successfully added");
    } catch (err) {
      toast.error("Failed to add bookmark.");
    }
  };

  const handleDelete = async (id) => {
    // Optimistically remove from UI
    const previousBookmarks = [...bookmarks];
    setBookmarks(prev => prev.filter(b => b._id !== id));
    
    try {
      await api.delete(`/links/${id}`);
      toast.success("Link deleted");
    } catch (err) {
      // Revert if API fails
      setBookmarks(previousBookmarks);
      toast.error("Failed to delete.");
    }
  };

  const handleUpdate = async (id, updates) => {
    try {
      const res = await api.put(`/links/${id}`, updates);
      setBookmarks(prev => prev.map(b => b._id === id ? res.data : b));
      toast.success("Updated!");
    } catch (err) {
      toast.error("Failed to update.");
    }
  };

  const exportPDF = async () => {
    if (!dashboardRef.current) return;
    const toastId = toast.loading("Generating PDF...");
    try {
      const canvas = await html2canvas(dashboardRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("bookmarks.pdf");
      toast.success("Exported!", { id: toastId });
    } catch (e) {
      toast.error("Export failed.", { id: toastId });
    }
  };

  const categories = ["All", ...new Set((Array.isArray(bookmarks) ? bookmarks : []).map(b => b?.category).filter(Boolean))];

  const processedBookmarks = (Array.isArray(bookmarks) ? bookmarks : [])
    .filter(b => {
      if (!b) return false;
      const s = search.toLowerCase();
      const matchesSearch = !search || 
        (b.title || "").toLowerCase().includes(s) || 
        (b.summary || "").toLowerCase().includes(s) ||
        (b.tags || []).some(t => (t || "").toLowerCase().includes(s));
      
      const matchesCategory = filterCategory === "All" || b.category === filterCategory;
      const matchesPinned = !showPinnedOnly || b.isPinned;
      return matchesSearch && matchesCategory && matchesPinned;
    })
    .sort((a, b) => {
      if (sortBy === "date-desc") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortBy === "date-asc") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortBy === "title-asc") return (a.title || "").localeCompare(b.title || "");
      return 0;
    });

  if (!showPinnedOnly && sortBy === "date-desc") {
    processedBookmarks.sort((a, b) => (b.isPinned === a.isPinned) ? 0 : b.isPinned ? 1 : -1);
  }

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col px-4 sm:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-8 mt-2 md:mt-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1 bg-white/40 dark:bg-white/5 backdrop-blur-2xl rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-white/60 dark:border-white/10 shadow-xl shadow-indigo-500/5 flex flex-col justify-center"
        >
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">Activity</span>
              <h3 className="text-lg md:text-xl font-[900] text-gray-900 dark:text-gray-100 tracking-tight">Daily Goal</h3>
            </div>
            <div className="text-right">
              <span className="text-xl md:text-2xl font-black text-indigo-600 dark:text-indigo-400">{todayReadTime}</span>
              <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest ml-1">/ {readingGoal}m</span>
            </div>
          </div>
          <div className="w-full h-3 md:h-4 bg-gray-100 dark:bg-black/20 rounded-full overflow-hidden p-0.5 md:p-1 shadow-inner">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${progressPercent}%` }} 
              transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.5 }}
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-lg" 
            />
          </div>
          <p className="mt-3 md:mt-4 text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center opacity-60">
            {progressPercent >= 100 ? "Goal Achieved! 🚀" : `${readingGoal - todayReadTime}m left`}
          </p>
        </motion.div>

        <AnimatePresence>
          {sparkLink && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="lg:col-span-2 relative group overflow-hidden bg-[#0F172A] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white shadow-2xl border border-white/10"
            >
              <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-indigo-600/20 blur-[80px] md:blur-[100px] rounded-full -mr-16 md:-mr-20 -mt-16 md:-mt-20 animate-pulse" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                  <span className="px-2 md:px-3 py-0.5 md:py-1 bg-indigo-500/20 backdrop-blur-md rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] border border-indigo-500/30 text-indigo-300">Daily Spark</span>
                  <div className="h-px flex-grow bg-white/10" />
                </div>
                <h3 className="text-xl md:text-2xl font-[900] mb-2 md:mb-3 leading-tight tracking-tight line-clamp-2">{sparkLink.title}</h3>
                <p className="text-slate-400 text-xs md:text-sm line-clamp-2 mb-4 md:mb-6 font-medium italic">"{sparkLink.summary}"</p>
                <div className="flex items-center gap-4 md:gap-6 mt-auto">
                  <a href={sparkLink.url} target="_blank" rel="noreferrer" className="px-6 md:px-8 py-2.5 md:py-3 bg-white text-slate-900 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Explore</a>
                  <button onClick={() => setSparkLink(null)} className="text-slate-500 hover:text-slate-300 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">Dismiss</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">My Dashboard</h1>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-1">Manage your AI-powered links.</p>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <button onClick={handleTriggerDigest} disabled={isSendingDigest} className="p-2 md:p-2.5 bg-white text-indigo-600 border border-gray-200 rounded-xl hover:bg-indigo-50 transition-colors">
              <Mail className={`w-4 h-4 md:w-5 md:h-5 ${isSendingDigest ? 'animate-bounce' : ''}`} />
            </button>
            <button onClick={() => setShowPinnedOnly(!showPinnedOnly)} className={`p-2 md:p-2.5 rounded-xl border transition-all ${showPinnedOnly ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-white text-gray-400 border-gray-200"}`}><Star className={`w-4 h-4 md:w-5 md:h-5 ${showPinnedOnly ? "fill-current" : ""}`} /></button>
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
              <button onClick={() => setViewMode("grid")} className={`p-1 md:p-1.5 rounded-lg ${viewMode === "grid" ? "bg-white dark:bg-gray-700 text-indigo-600" : "text-gray-500"}`}><LayoutGrid className="w-4 h-4 md:w-5 md:h-5" /></button>
              <button onClick={() => setViewMode("list")} className={`p-1 md:p-1.5 rounded-lg ${viewMode === "list" ? "bg-white dark:bg-gray-700 text-indigo-600" : "text-gray-500"}`}><List className="w-4 h-4 md:w-5 md:h-5" /></button>
            </div>
            <button onClick={() => setIsAddOpen(true)} className="flex-grow md:flex-grow-0 px-4 py-2 md:py-2.5 bg-indigo-600 text-white rounded-xl flex items-center justify-center gap-2 text-sm md:text-base font-medium hover:bg-indigo-700 transition-colors shadow-sm"><Plus className="w-4 h-4 md:w-5 md:h-5" /> Add Link</button>
          </div>
        </div>

        <div className="flex flex-col gap-4 bg-white/60 dark:bg-white/5 backdrop-blur-2xl p-4 md:p-5 rounded-[2rem] border border-white/60 dark:border-white/10 shadow-xl shadow-indigo-500/5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
            <div className="relative flex-grow">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder={isSemantic ? "Search concepts..." : "Search..."} value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchBookmarks(search)} className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-black/20 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium" />
              {isSearching && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin absolute right-4 top-1/2 -translate-y-1/2" />}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsSemantic(!isSemantic)} className={`flex-1 sm:flex-none px-4 py-3 rounded-2xl border flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${isSemantic ? "bg-indigo-600 text-white border-indigo-600" : "bg-white/50 dark:bg-white/5 text-gray-400 border-white/50 dark:border-white/10"}`}><Sparkles className="w-4 h-4" /> AI</button>
              <button onClick={() => fetchBookmarks(search)} className="flex-1 sm:flex-none px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">Search</button>
            </div>
          </div>
          
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer">
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer text-right">
                <option value="date-desc">Newest</option>
                <option value="date-asc">Oldest</option>
                <option value="title-asc">A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 pb-10">
           <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-3"}>
              {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
           </div>
        </div>
      ) : (
        <div ref={dashboardRef} className="flex-1 pb-10">
          {processedBookmarks.length === 0 ? (
            <div className="text-center py-20 bg-white/50 rounded-3xl border border-gray-200 border-dashed">
              <Search className="w-8 h-8 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No bookmarks found</h3>
            </div>
          ) : (
            <motion.div layout className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-3"}>
              <AnimatePresence mode="popLayout">
                {processedBookmarks.map((bookmark, idx) => (
                  <LinkCard key={bookmark._id} bookmark={bookmark} onDelete={handleDelete} onUpdate={handleUpdate} viewMode={viewMode} index={idx} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      )}

      <AddLink isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onAdd={handleAdd} />
    </div>
  );
}

export default function DashboardWrapper() {
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}
