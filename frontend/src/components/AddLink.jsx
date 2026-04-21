import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Link2, Sparkles } from "lucide-react";

export default function AddLink({ isOpen, onClose, onAdd }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAdd({ url, title, category, note });
      setUrl("");
      setTitle("");
      setCategory("");
      setNote("");
      onClose();
    } catch (err) {
      console.error("Error adding bookmark:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md max-h-[90vh] bg-white dark:bg-[#161925] rounded-3xl shadow-2xl flex flex-col overflow-hidden border dark:border-gray-800"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/80 dark:bg-gray-800/50 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center">
                  <Link2 className="text-indigo-600 dark:text-indigo-400 w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Add Bookmark</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Save a new link to your dashboard</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <form id="add-link-form" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">Website URL</label>
                  <div className="relative">
                    <input
                      type="url"
                      required
                      autoFocus
                      placeholder="https://example.com"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                    {url && (
                      <div className="mt-2 px-3 py-2 bg-indigo-50/50 dark:bg-indigo-500/5 backdrop-blur-sm border border-indigo-100 dark:border-indigo-500/20 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <img 
                          src={`https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(url.startsWith('http') ? url : `https://${url}`)}&size=32`} 
                          alt="preview" 
                          className="w-4 h-4 object-contain"
                          onError={(e) => {
                            try {
                              const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
                              if (!e.target.src.includes('icon.horse')) {
                                e.target.src = `https://icon.horse/icon/${hostname}`;
                              } else {
                                e.target.style.display = 'none';
                              }
                            } catch (err) {
                              e.target.style.display = 'none';
                            }
                          }}
                        />
                        <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 truncate">
                          Previewing: {(() => {
                            try {
                              return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
                            } catch (e) {
                              return url;
                            }
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">Display Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. My Favorite Design Tool"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">Category (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Design, Tech, Work"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">Quick Note (Why are you saving this?)</label>
                  <textarea
                    placeholder="e.g. Need this for the project research"
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500 italic px-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    AI will use this note to refine your summary.
                  </p>
                </div>
                
                {/* Extra spacing for long forms to ensure visibility */}
                <div className="h-4"></div>
              </form>
            </div>

            {/* Footer / Buttons */}
            <div className="px-6 py-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50 flex justify-end gap-3 sticky bottom-0">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-600 dark:text-gray-400 font-semibold hover:bg-white dark:hover:bg-gray-800 rounded-2xl transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-link-form"
                disabled={loading}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50"
              >
                {loading ? (
                  "Adding..."
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Submit Bookmark
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
