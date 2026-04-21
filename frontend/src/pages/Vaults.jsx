import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, Plus, Users, Share2, Trash2, ExternalLink, Shield, ShieldCheck, Mail, ArrowRight, X } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import { API_URL } from "../config";

export default function Vaults() {
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVaultName, setNewVaultName] = useState("");
  const [newVaultDesc, setNewVaultDesc] = useState("");
  const [selectedVault, setSelectedVault] = useState(null);
  const [shareEmail, setShareEmail] = useState("");

  useEffect(() => {
    fetchVaults();
  }, []);

  const fetchVaults = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/vaults`, {
        headers: { "x-auth-token": token }
      });
      setVaults(res.data);
    } catch (err) {
      toast.error("Failed to fetch vaults");
    } finally {
      setLoading(false);
    }
  };

  const createVault = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/vaults`, 
        { name: newVaultName, description: newVaultDesc },
        { headers: { "x-auth-token": token } }
      );
      toast.success("Vault created successfully!");
      setNewVaultName("");
      setNewVaultDesc("");
      setShowAddModal(false);
      fetchVaults();
    } catch (err) {
      toast.error("Failed to create vault");
    }
  };

  const shareVault = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/vaults/${selectedVault._id}/share`,
        { email: shareEmail },
        { headers: { "x-auth-token": token } }
      );
      toast.success(res.data.msg || "Vault shared!");
      setShareEmail("");
      fetchVaults(); // Refresh to show new member
      // Update selected vault too
      const updated = await axios.get(`${API_URL}/vaults`, {
        headers: { "x-auth-token": token }
      });
      const newSelected = updated.data.find(v => v._id === selectedVault._id);
      setSelectedVault(newSelected);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to share vault");
    }
  };

  const removeMember = async (vaultId, userId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/vaults/${vaultId}/members/${userId}`, {
        headers: { "x-auth-token": token }
      });
      toast.success("Member removed");
      fetchVaults();
      if (selectedVault?._id === vaultId) {
         const updated = await axios.get(`${API_URL}/vaults`, {
          headers: { "x-auth-token": token }
        });
        setSelectedVault(updated.data.find(v => v._id === vaultId));
      }
    } catch (err) {
      toast.error("Failed to remove member");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-2">
              Collaborative <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Vaults</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400">Share your research and collaborate in real-time.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5" />
            Create Vault
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : (
          <motion.div 
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {vaults.map((vault, idx) => (
              <motion.div
                key={vault._id}
                layout
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { 
                    opacity: 1, 
                    y: 0,
                    transition: { delay: idx * 0.1, duration: 0.5, ease: "easeOut" }
                  }
                }}
                whileHover={{ 
                  y: -10, 
                  scale: 1.03,
                  transition: { 
                    type: "spring", 
                    stiffness: 600, 
                    damping: 30,
                    mass: 0.8
                  }
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 40
                }}
                className="group relative bg-white/70 dark:bg-[#161925]/70 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-white/10 shadow-xl"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl">
                    <Folder className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedVault(vault)}
                      className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
                      title="Manage Members"
                    >
                      <Users className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{vault.name}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 line-clamp-2">{vault.description || "No description provided."}</p>

                <div className="flex items-center justify-between pt-6 border-t border-gray-50 dark:border-gray-800">
                  <div className="flex -space-x-3">
                    {vault.members?.slice(0, 4).map((member, i) => (
                      member && (
                        <div 
                          key={member._id}
                          className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center border-2 border-white dark:border-[#161925] text-[10px] font-bold text-indigo-600 dark:text-indigo-400"
                          title={member.name}
                        >
                          {member.name?.charAt(0)}
                        </div>
                      )
                    ))}
                    {vault.members?.length > 4 && (
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-white dark:border-[#161925] text-[10px] font-bold text-gray-500">
                        +{vault.members.length - 4}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    {vault.creator?.name || "Unknown User"}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Create Vault Modal */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddModal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-white dark:bg-[#161925] rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-white/10"
              >
                <h2 className="text-2xl font-bold mb-6">Create New Vault</h2>
                <form onSubmit={createVault} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <input
                      required
                      type="text"
                      value={newVaultName}
                      onChange={(e) => setNewVaultName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="e.g., Marketing Project"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                      value={newVaultDesc}
                      onChange={(e) => setNewVaultDesc(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                      placeholder="What is this vault for?"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
                  >
                    Create Vault
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Share Modal */}
        <AnimatePresence>
          {selectedVault && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedVault(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#161925] rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-white/10 max-h-[80vh] flex flex-col"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Manage Members</h2>
                  <button onClick={() => setSelectedVault(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Invite Member</label>
                  <form onSubmit={shareVault} className="flex gap-2">
                    <div className="relative flex-grow">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        required
                        type="email"
                        value={shareEmail}
                        onChange={(e) => setShareEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="colleague@example.com"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all"
                    >
                      Invite
                    </button>
                  </form>
                </div>

                <div className="flex-grow overflow-y-auto space-y-4">
                  {selectedVault.members?.map((member) => (
                    member && (
                      <div key={member._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400">
                            {member.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                        </div>
                        {member._id !== selectedVault.creator?._id ? (
                          <button
                            onClick={() => removeMember(selectedVault._id, member._id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-1 rounded-lg">OWNER</span>
                        )}
                      </div>
                    )
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
  );
}
