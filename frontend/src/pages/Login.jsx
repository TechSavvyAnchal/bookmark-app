import axios from "axios";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Link2, LogIn, ArrowRight, Eye, EyeOff } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';
import { API_URL } from "../config";
import toast from "react-hot-toast";

const formVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 20, 
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 15 }
  }
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error("Please verify your email");
        navigate("/verify-otp", { state: { email: err.response.data.email } });
      } else {
        toast.error(err.response?.data || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    try {
      const res = await axios.post(`${API_URL}/auth/google`, { credential: response.credential });
      localStorage.setItem("token", res.data.token);
      toast.success("Logged in with Google!");
      navigate("/dashboard");
    } catch (err) {
      toast.error("Google login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4 font-sans text-gray-900">
      <motion.div 
        variants={formVariants}
        initial="hidden"
        animate="visible"
        className="max-w-md w-full backdrop-blur-xl bg-white/20 p-8 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/30"
      >
        <motion.div variants={itemVariants} className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <Link2 className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AI Bookmarks</h1>
          <p className="text-white/80 mt-2 text-center text-sm">Save, organize, and summarize your links intelligently.</p>
        </motion.div>

        <form onSubmit={login} className="space-y-6">
          <motion.div variants={itemVariants}>
            <label className="block text-white/90 text-[10px] font-bold mb-1 ml-1 uppercase tracking-widest">Email Address</label>
            <input 
              type="email"
              placeholder="you@example.com" 
              required
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all text-sm"
              onChange={e => setEmail(e.target.value)} 
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <label className="block text-white/90 text-[10px] font-bold mb-1 ml-1 uppercase tracking-widest">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="••••••••" 
                required
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all pr-12 text-sm"
                onChange={e => setPassword(e.target.value)} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>

          <motion.button 
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-white text-indigo-600 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {loading ? "Logging in..." : <><LogIn className="w-5 h-5" /> Sign In</>}
          </motion.button>
        </form>

        <motion.div variants={itemVariants} className="mt-6 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-white/50 my-2">
            <div className="flex-1 h-px bg-white/20"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Or continue with</span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>
          
          <div className="flex gap-3">
            <div className="flex-1 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error("Google Login Failed")}
                useOneTap
                theme="filled_blue"
                shape="pill"
                text="signin_with"
                width="100%"
              />
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-white/70 text-sm">
            Don't have an account?{" "}
            <Link to="/signup" className="text-white font-bold hover:underline inline-flex items-center gap-1">
              Sign Up <ArrowRight className="w-4 h-4" />
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
