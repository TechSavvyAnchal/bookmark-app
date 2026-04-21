import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Chrome, Key, MousePointer2, CheckCircle2, ArrowRight, Download, Sparkles, MousePointerClick, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { API_URL } from "../config";

const StepCard = ({ number, title, description, icon: Icon, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white/60 dark:bg-[#161925]/60 backdrop-blur-xl p-8 rounded-3xl border border-white/20 dark:border-white/10 shadow-sm hover:shadow-md transition-all group"
  >
    <div className="flex items-start gap-6">
      <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl group-hover:scale-110 transition-transform">
        {number}
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-indigo-500" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        <div className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
          {description}
        </div>
      </div>
    </div>
  </motion.div>
);

const ExtensionGuide = () => {
  const [token, setToken] = useState("");
  const bookmarkletRef = useRef(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) setToken(savedToken);
  }, []);

  useEffect(() => {
    if (bookmarkletRef.current && token) {
      const code = `javascript:(function(){
        const title = document.title;
        const url = window.location.href;
        const token = '${token}';
        const apiUrl = '${API_URL}';

        if (!token) {
          alert('Please login to AI Bookmarks first to get your token!');
          return;
        }

        fetch(\`\${apiUrl}/links\`, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          body: JSON.stringify({ title, url, note: 'Saved via Bookmarklet' })
        })
        .then(res => {
          if(res.ok) {
            const div = document.createElement('div');
            div.textContent = '✨ Saved to AI Bookmarks!';
            div.style.cssText = 'position:fixed;top:20px;right:20px;background:#4f46e5;color:white;padding:16px 24px;border-radius:12px;z-index:9999999;font-family:sans-serif;font-weight:bold;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);';
            document.body.appendChild(div);
            setTimeout(() => { div.style.opacity = "0"; setTimeout(() => div.remove(), 500); }, 2000);
          } else {
            alert('❌ Error: Please make sure you are logged in on the main app.');
          }
        })
        .catch(err => {
          console.error('Bookmarklet error:', err);
          alert('❌ Network Error. Possible reasons:\\n1. API is down\\n2. Mixed Content (Trying to save HTTPS site to HTTP API)\\n3. CSP Block (Website blocks external requests)');
        });
      })();`.replace(/\s+/g, ' ');
      
      // Clear existing content
      bookmarkletRef.current.innerHTML = '';
      
      // Create elements manually to be safe with quotes
      const link = document.createElement('a');
      link.href = code;
      link.className = "inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/30 cursor-move hover:scale-105 transition-transform active:scale-95";
      link.style.textDecoration = 'none';
      link.onclick = (e) => { if (e.button === 0) e.preventDefault(); };
      
      const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles w-5 h-5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>`;
      
      link.innerHTML = `${iconSvg} <span>Drag Me: Save to AI</span>`;
      bookmarkletRef.current.appendChild(link);
    }
  }, [token]);

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      toast.success("Token copied to clipboard!");
    } else {
      toast.error("Please login to get your token.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16 space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-bold tracking-wide uppercase">
          <Zap className="w-4 h-4" />
          Pro Feature
        </div>
        <h1 className="text-5xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
          Supercharge Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Workflow</span>
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Choose the best way to save content: the instant Bookmarklet or the full Browser Extension.
        </p>
      </motion.div>

      {/* SECTION 1: BOOKMARKLET (RECRUITER IMPRESSER) */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
            <MousePointerClick className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold">Method 1: One-Click Bookmarklet</h2>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-[#161925] rounded-[2.5rem] p-10 border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden relative group"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-6">
              <h3 className="text-3xl font-black leading-tight">Zero Installation. <br/><span className="text-indigo-600">Pure Magic.</span></h3>
              <p className="text-gray-600 dark:text-gray-400">
                The bookmarklet is a tiny script that lives in your browser's bookmarks bar. It works on <strong>any device</strong> and <strong>any browser</strong> (Chrome, Safari, Edge, Firefox) without downloading anything.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-[10px] text-indigo-600">1</div>
                  <span>Make sure your bookmarks bar is visible (Ctrl+Shift+B)</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-[10px] text-indigo-600">2</div>
                  <span>Drag the "Magic" button below to your bar</span>
                </div>
              </div>

              <div className="pt-4" ref={bookmarkletRef}>
                {/* Managed via innerHTML to bypass React security */}
              </div>
            </div>

            <div className="relative">
               <div className="bg-gray-100 dark:bg-gray-800/50 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 aspect-square flex flex-col justify-center items-center text-center space-y-4">
                  <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-3xl shadow-lg flex items-center justify-center mb-2 animate-bounce">
                    <MousePointer2 className="w-10 h-10 text-indigo-600" />
                  </div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Interactive Tutorial</p>
                  <p className="text-xs text-gray-400">Grab the button on the left and drag it into your browser's favorites/bookmarks bar above. That's it!</p>
               </div>
            </div>
          </div>
          {/* Decorative blur */}
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors" />
        </motion.div>
      </section>

      {/* SECTION 2: BROWSER EXTENSION */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
            <Chrome className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold">Method 2: Full Browser Extension</h2>
        </div>

        <div className="grid gap-8">
          <StepCard
            number="01"
            delay={0.1}
            icon={Download}
            title="Download & Load"
            description="Download the extension bundle, unzip it, and go to chrome://extensions. Enable 'Developer Mode' and click 'Load Unpacked'."
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden group"
          >
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <h4 className="text-lg font-bold">Download Bundle</h4>
                <p className="text-indigo-100 text-sm">Download the extension files to get started.</p>
              </div>
              <div className="flex gap-4">
                <a 
                  href="/extension-bundle.zip" 
                  download 
                  className="px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl font-bold flex items-center gap-3 hover:bg-white/20 transition-all active:scale-95"
                >
                  <Download className="w-5 h-5" />
                  Extension.zip
                </a>
                <button 
                  onClick={copyToken}
                  className="px-6 py-4 bg-white text-indigo-600 rounded-2xl font-bold flex items-center gap-3 hover:bg-gray-50 transition-all active:scale-95 shadow-lg group-hover:shadow-indigo-500/25"
                >
                  <Key className="w-5 h-5" />
                  Copy Access Token
                </button>
              </div>
            </div>
          </motion.div>

          <StepCard
            number="02"
            delay={0.3}
            icon={MousePointer2}
            title="Paste & Activate"
            description={`1. Click the Extensions icon (puzzle piece) in your browser bar.
2. Pin 'AI Bookmarks' for easy access.
3. Click the icon, paste your Access Token from above into the 'Auth Token' field, and you're ready to save!`}
          />
        </div>
      </section>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-20 p-8 bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 text-center"
      >
        <div className="flex justify-center gap-4 mb-4 text-gray-400">
          <Chrome className="w-6 h-6" />
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-700" />
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Built for modern browsers. Extension works best on Chrome, Edge, and Brave.
        </p>
      </motion.div>
    </div>
  );
};

export default ExtensionGuide;
