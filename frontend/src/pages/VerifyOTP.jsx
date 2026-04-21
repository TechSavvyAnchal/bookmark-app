import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight } from "lucide-react";
import axios from "axios";
import { API_URL } from "../config";
import toast from "react-hot-toast";

export default function VerifyOTP() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      toast.error("Invalid access");
      navigate("/signup");
    }
  }, [email, navigate]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.nextSibling && element.value) {
      element.nextSibling.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 6) return toast.error("Please enter full code");

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/verify-otp`, { email, otp: otpCode });
      localStorage.setItem("token", res.data.token);
      toast.success("Email verified successfully!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full backdrop-blur-xl bg-white/20 p-8 rounded-3xl shadow-2xl border border-white/30 text-center"
      >
        <div className="w-20 h-20 bg-white/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <ShieldCheck className="text-white w-10 h-10" />
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-2">Check Your Email</h2>
        <p className="text-white/80 mb-8">We've sent a 6-digit code to <br/><span className="font-bold text-white">{email}</span></p>

        <form onSubmit={handleVerify} className="space-y-8">
          <div className="flex justify-between gap-2">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                className="w-12 h-14 text-center text-2xl font-bold bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-white/50 outline-none"
                value={data}
                onChange={e => handleChange(e.target, index)}
                onFocus={e => e.target.select()}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-white text-indigo-600 font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Verifying..." : <>Verify Email <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>

        <p className="mt-8 text-white/60 text-sm">
          Didn't receive code? <button className="text-white font-bold hover:underline" onClick={() => window.location.reload()}>Resend</button>
        </p>
      </motion.div>
    </div>
  );
}
