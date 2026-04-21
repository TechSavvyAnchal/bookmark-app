import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Clock, ArrowUpRight, Pin, Tag, Copy, RefreshCcw, Volume2, VolumeX, BookOpen, Trash2, AlertTriangle, Sparkles, Brain } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import ReaderModal from "./ReaderModal";
import QuizModal from "./QuizModal";
import { API_URL } from "../config";

export default function LinkCard({ bookmark, onDelete, onUpdate, viewMode = "grid", index = 0 }) {
  const [faviconError, setFaviconError] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [readerContent, setReaderContent] = useState(null);
  const [isLoadingReader, setIsLoadingReader] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: i => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.05,
        duration: 0.5,
        ease: [0.215, 0.61, 0.355, 1],
      },
    }),
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  const hoverEffect = {
    y: -8,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 25,
      mass: 1
    }
  };

  const resetTransition = {
    type: "spring",
    stiffness: 300,
    damping: 30
  };

  useEffect(() => {
    setFaviconError(false);
    
    const handleStopSpeech = () => {
      setIsSpeaking(false);
    };

    window.addEventListener("stop-all-speech", handleStopSpeech);
    return () => {
      window.removeEventListener("stop-all-speech", handleStopSpeech);
      window.speechSynthesis.cancel();
    };
  }, [bookmark.url]);

  const handleRead = async (e) => {
    e.stopPropagation();
    if (readerContent) {
      setIsReaderOpen(true);
      return;
    }
    setIsLoadingReader(true);
    const toastId = toast.loading("Preparing Reader Mode...");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/links/${bookmark._id}/read`, {
        headers: { "x-auth-token": token }
      });
      setReaderContent(res.data);
      setIsReaderOpen(true);
      toast.success("Content ready!");
    } catch (err) {
      toast.error("Failed to load content.");
    } finally {
      setIsLoadingReader(false);
      toast.dismiss(toastId);
    }
  };

  const handleQuiz = async (e) => {
    e.stopPropagation();
    if (quizData) {
      setIsQuizOpen(true);
      return;
    }
    setIsLoadingQuiz(true);
    const toastId = toast.loading("AI is generating a quiz...");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/links/${bookmark._id}/quiz`, {}, {
        headers: { "x-auth-token": token }
      });
      setQuizData(res.data);
      setIsQuizOpen(true);
      toast.success("Quiz Ready!", { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to generate quiz.", { id: toastId });
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const handleSpeak = (e) => {
    e.stopPropagation();
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Stop any existing speech and notify other cards
    window.speechSynthesis.cancel();
    window.dispatchEvent(new CustomEvent("stop-all-speech"));

    const utterance = new SpeechSynthesisUtterance(bookmark.summary);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };
  
  const getCategoryColor = (cat) => {
    const colors = {
      Tech: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/30 shadow-[0_0_15px_-3px_rgba(59,130,246,0.2)]",
      Design: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200/50 dark:border-pink-800/30 shadow-[0_0_15px_-3px_rgba(236,72,153,0.2)]",
      General: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200/50 dark:border-gray-800/30",
      Study: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/30 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]",
      Work: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/30 shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)]",
      Education: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/30 shadow-[0_0_15px_-3px_rgba(99,102,241,0.2)]",
      Productivity: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200/50 dark:border-violet-800/30 shadow-[0_0_15px_-3px_rgba(139,92,246,0.2)]"
    };
    return colors[cat] || "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200/50 dark:border-gray-800/30";
  };

  const togglePin = (e) => {
    e.stopPropagation();
    onUpdate(bookmark._id, { isPinned: !bookmark.isPinned });
  };

  const copyToClipboard = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(bookmark.url);
    toast.success("Copied!");
  };

  const domain = useMemo(() => {
    try {
      return new URL(bookmark.url).hostname;
    } catch (e) {
      return "";
    }
  }, [bookmark.url]);

  const faviconUrl = `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(bookmark.url)}&size=64`;

  // --- ACTIONS COMPONENT ---
  const ActionButtons = () => (
    <div className="flex items-center gap-0.5 bg-white/80 dark:bg-black/60 p-1 rounded-xl border border-white/50 dark:border-white/10 shadow-lg backdrop-blur-md opacity-0 scale-95 translate-x-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 transition-all duration-300 ease-out pointer-events-none group-hover:pointer-events-auto">
      <button 
        onClick={togglePin} 
        className={`p-1.5 rounded-lg transition-all ${bookmark.isPinned ? 'bg-amber-100 text-amber-600' : 'text-gray-400 hover:bg-amber-50 hover:text-amber-500'}`}
        title={bookmark.isPinned ? "Unpin" : "Pin"}
      >
        <Pin className={`w-3.5 h-3.5 ${bookmark.isPinned ? 'fill-current' : ''}`} />
      </button>
      <button onClick={copyToClipboard} className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-all" title="Copy URL"><Copy className="w-3.5 h-3.5" /></button>
      <button onClick={handleQuiz} disabled={isLoadingQuiz} className={`p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-all ${isLoadingQuiz ? 'animate-pulse' : ''}`} title="Quiz"><Brain className="w-3.5 h-3.5" /></button>
      <button onClick={handleRead} className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-all" title="Reader"><BookOpen className="w-3.5 h-3.5" /></button>
      <button onClick={handleSpeak} className={`p-1.5 rounded-lg transition-all ${isSpeaking ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-indigo-50 hover:text-indigo-600'}`} title="Speak">
        {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(bookmark._id); }} 
        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all" 
        title="Delete"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  if (viewMode === "list") {
    return (
      <motion.div
        layout
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        custom={index}
        whileHover={{ x: 8, backgroundColor: "rgba(99, 102, 241, 0.08)" }}
        transition={resetTransition}
        className="group relative flex items-center justify-between bg-white/60 dark:bg-white/5 backdrop-blur-xl p-4 rounded-[2rem] border border-white/50 dark:border-white/10 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all overflow-hidden"
      >
        <div className="flex items-center gap-5 flex-grow min-w-0 pr-4">
          <div className="w-10 h-10 bg-white/80 dark:bg-white/10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner border border-white/50 dark:border-white/10">
            {!faviconError ? (
              <img src={faviconUrl} alt="icon" className="w-5 h-5 object-contain rounded-sm" onError={() => setFaviconError(true)} />
            ) : (
              <Globe className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div className="min-w-0 flex-grow">
            <div className="flex items-center gap-3">
              <a href={bookmark.url} target="_blank" rel="noreferrer" className="text-sm font-black text-gray-900 dark:text-gray-100 truncate hover:text-indigo-600 transition-colors tracking-tight">
                {bookmark.title}
              </a>
              <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${getCategoryColor(bookmark.category)}`}>
                {bookmark.category}
              </span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          <ActionButtons />
        </div>
        <ReaderModal isOpen={isReaderOpen} onClose={() => setIsReaderOpen(false)} content={readerContent} />
        <QuizModal isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} quizData={quizData} title={bookmark.title} />
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      custom={index}
      whileHover={hoverEffect}
      transition={resetTransition}
      className={`group relative bg-white/40 dark:bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-6 shadow-xl shadow-indigo-500/5 border border-white/60 dark:border-white/10 flex flex-col h-full min-h-[400px] transition-all overflow-hidden ${bookmark.isPinned ? "ring-2 ring-indigo-500/30" : ""}`}
    >
      <div className="flex items-start justify-between mb-6 gap-2">
        <div className="w-12 h-12 bg-white/80 dark:bg-white/10 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-lg border border-white/50 dark:border-white/10">
          {!faviconError ? (
            <img src={faviconUrl} alt="icon" className="w-7 h-7 object-contain rounded-md" onError={() => setFaviconError(true)} />
          ) : (
            <Globe className="w-7 h-7 text-gray-400" />
          )}
        </div>
        <div className="flex-shrink-0">
          <ActionButtons />
        </div>
      </div>

      <div className="mb-5">
        <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mb-2 hover:opacity-70 transition-opacity">
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">{domain}</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-indigo-300" />
        </a>
        <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="block pr-8">
          <h3 className="text-2xl font-[900] text-gray-900 dark:text-gray-100 leading-[1.1] tracking-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
            {bookmark.title}
          </h3>
        </a>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {bookmark.tags?.slice(0, 3).map(tag => (
          <span key={tag} className="px-3.5 py-1.5 bg-indigo-500/5 backdrop-blur-md text-[9px] font-black text-indigo-600 dark:text-indigo-300 rounded-xl border border-indigo-500/10 shadow-sm uppercase tracking-widest">
            #{tag}
          </span>
        ))}
      </div>

      <div className="flex-grow bg-white/40 dark:bg-white/5 backdrop-blur-sm rounded-[2rem] p-5 border border-indigo-500/5 mb-6 max-h-[160px] overflow-hidden relative shadow-inner">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase text-indigo-600/40 dark:text-indigo-400/40 tracking-[0.3em]">AI Synthesis</span>
        </div>
        <p className="text-[14px] text-gray-600 dark:text-gray-300 leading-relaxed font-semibold italic line-clamp-4">
          "{bookmark.summary}"
        </p>
        {bookmark.note && (
          <div className="mt-4 pt-4 border-t border-indigo-500/10 text-[11px] text-indigo-600 dark:text-indigo-400 font-black truncate uppercase tracking-tight">
            <span className="opacity-40 mr-2">Note:</span> {bookmark.note}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto pt-5 border-t border-indigo-500/5">
        <div className={`px-4 py-2 rounded-2xl border text-[10px] font-[900] uppercase tracking-[0.15em] shadow-sm transition-all ${getCategoryColor(bookmark.category)}`}>
          {bookmark.category}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-[900] uppercase tracking-widest opacity-80">
          <Clock className="w-4 h-4" />
          {bookmark.readTime}m read
        </div>
      </div>

      <ReaderModal isOpen={isReaderOpen} onClose={() => setIsReaderOpen(false)} content={readerContent} />
      <QuizModal isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} quizData={quizData} title={bookmark.title} />
    </motion.div>
  );
}
