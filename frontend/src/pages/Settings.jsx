import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield, ShieldAlert, LogOut, Key, CheckCircle2, AlertTriangle, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../api";

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ name: "", password: "" });
  const navigate = useNavigate();

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileData.name && !profileData.password) {
      toast.error("Please fill in at least one field to update.");
      return;
    }

    setUpdatingProfile(true);
    try {
      const res = await api.put("/auth/profile", profileData);
      toast.success(res.data.msg || "Profile updated!");
      setProfileData({ name: "", password: "" });
    } catch (err) {
      toast.error(err.response?.data || "Update failed");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleRevokeTokens = async () => {
    const confirmRevoke = window.confirm(
      "Are you sure? This will invalidate ALL your active sessions, including the Browser Extension and Bookmarklets on other devices. You will be logged out immediately."
    );

    if (!confirmRevoke) return;

    setLoading(true);
    try {
      await api.post("/auth/revoke-tokens");
      toast.success("All sessions revoked successfully!");
      
      // Clear local storage and redirect to login
      localStorage.removeItem("token");
      setTimeout(() => {
        navigate("/");
        window.location.reload(); // Force refresh to clear all states
      }, 1500);
    } catch (err) {
      console.error("Revocation failed:", err);
      toast.error(err.response?.data?.msg || "Failed to revoke sessions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-4 flex items-center gap-4">
          <Shield className="w-10 h-10 text-indigo-600" />
          Security <span className="text-indigo-600">Settings</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Manage your account security and active sessions.
        </p>
      </motion.div>

      <div className="space-y-8">
        {/* Profile Settings Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl shadow-indigo-500/5"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl text-indigo-600">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Profile Settings</h3>
              <p className="text-slate-500 text-sm">Update your display name and password.</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">New Display Name</label>
                <input
                  type="text"
                  placeholder="Your Full Name"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">New Password</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep current"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                  value={profileData.password}
                  onChange={(e) => setProfileData({ ...profileData, password: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <button
                type="submit"
                disabled={updatingProfile}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updatingProfile ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save Profile Changes"
                )}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Revoke Sessions Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl shadow-indigo-500/5 relative overflow-hidden group"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                <ShieldAlert className="w-3 h-3" />
                Critical Action
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Revoke All Active Sessions</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                If you believe your Bookmarklet or Extension token has been compromised, or if you want to logout from all other devices, use this feature. 
                <span className="block mt-2 font-semibold text-red-500/80">
                  Warning: This will instantly invalidate every token associated with your account.
                </span>
              </p>
            </div>

            <button
              onClick={handleRevokeTokens}
              disabled={loading}
              className={`px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-red-500/20 ${
                loading 
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" 
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Revoking...
                </>
              ) : (
                <>
                  <LogOut className="w-5 h-5" />
                  Revoke & Logout
                </>
              )}
            </button>
          </div>

          {/* Decorative blur */}
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-colors" />
        </motion.div>

        {/* Security Info Card */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-8 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-[2rem] border border-indigo-100/50 dark:border-indigo-500/10">
             <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                <Zap className="w-6 h-6" />
             </div>
             <h4 className="text-lg font-bold mb-2">Token Expiration</h4>
             <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
               All tokens now expire automatically after 7 days. This limits the window of risk if a bookmarklet is left on a public computer.
             </p>
          </div>

          <div className="p-8 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-[2rem] border border-emerald-100/50 dark:border-emerald-500/10">
             <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                <CheckCircle2 className="w-6 h-6" />
             </div>
             <h4 className="text-lg font-bold mb-2">Encrypted Transit</h4>
             <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
               Your tokens are always sent via HTTPS in production, ensuring they cannot be intercepted by third parties during transmission.
             </p>
          </div>
        </div>

        {/* Placement Tip */}
        <div className="p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-white/5">
           <div className="flex gap-4 items-start">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-1" />
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">Developer Note (Placement Tip)</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This system uses <strong>Token Versioning</strong> for revocation. Instead of a database blacklist (which grows forever), we just increment a version number on the user object. Old tokens with the wrong version are instantly rejected by the middleware. This is O(1) time complexity and highly efficient.
                </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
