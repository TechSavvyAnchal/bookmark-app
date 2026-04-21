import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Download, BookOpen, Clock, StickyNote, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import toast from "react-hot-toast";

export default function ReaderModal({ isOpen, onClose, content }) {
  if (!isOpen || !content) return null;

  const copyMarkdown = () => {
    navigator.clipboard.writeText(content.markdown);
    toast.success("Markdown copied!");
  };

  const downloadMarkdown = () => {
    const element = document.createElement("a");
    const file = new Blob([content.markdown], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(element);
    element.click();
    toast.success("Downloaded!");
  };

  // Estimate read time for the snapshot content
  const wordCount = content.markdown?.split(/\s+/).length || 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 pointer-events-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-gray-900/90 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 40 }}
          className="relative w-full max-w-5xl h-[90vh] bg-white dark:bg-[#0F111A] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/10"
        >
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-white/5 bg-white/50 dark:bg-[#0F111A]/50 backdrop-blur-xl sticky top-0 z-20">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-black text-gray-900 dark:text-white truncate leading-tight">
                  {content.title}
                </h2>
                <div className="flex items-center gap-3 mt-1 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {readTime} min read</span>
                  {content.siteName && <span className="text-indigo-500">/ {content.siteName}</span>}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1 mr-2 px-2 py-1 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                <button onClick={copyMarkdown} className="p-2 text-gray-500 hover:text-indigo-500 transition-colors" title="Copy Markdown"><Copy className="w-4 h-4" /></button>
                <button onClick={downloadMarkdown} className="p-2 text-gray-500 hover:text-indigo-500 transition-colors" title="Download MD"><Download className="w-4 h-4" /></button>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-white/5 text-gray-500 hover:text-red-500 rounded-xl transition-all border border-gray-100 dark:border-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Reader Body */}
          <div className="flex-grow overflow-y-auto custom-scrollbar bg-white dark:bg-[#0F111A]">
            <div className="max-w-3xl mx-auto px-8 py-12">
              
              {/* User Context Callout */}
              {content.note && (
                <div className="mb-12 relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl blur-xl group-hover:opacity-100 transition-opacity opacity-50" />
                  <div className="relative p-6 bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-3xl">
                    <div className="flex items-center gap-2 mb-3">
                      <StickyNote className="w-4 h-4 text-indigo-500" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600/60 dark:text-indigo-400/60">Your Context</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-indigo-200 leading-relaxed italic">
                      "{content.note}"
                    </p>
                  </div>
                </div>
              )}

              <article className="prose prose-lg prose-indigo dark:prose-invert max-w-none 
                prose-headings:font-black prose-headings:tracking-tight 
                prose-p:leading-relaxed prose-p:text-gray-600 dark:prose-p:text-gray-300
                prose-a:text-indigo-500 prose-a:no-underline hover:prose-a:underline
                prose-pre:bg-gray-900 prose-pre:rounded-2xl prose-pre:border prose-pre:border-white/5
                prose-img:rounded-3xl prose-img:shadow-2xl">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content.markdown}
                </ReactMarkdown>
              </article>

              <div className="mt-20 pt-10 border-t border-gray-100 dark:border-white/5 text-center">
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest">
                  <Sparkles className="w-4 h-4" /> End of AI Snapshot
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
