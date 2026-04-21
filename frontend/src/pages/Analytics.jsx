import { useEffect, useState } from "react";
import api from "../api";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";
import { Download, TrendingUp, Tag, Layers, Calendar, Sparkles } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";
import { API_URL } from "../config";

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllTags, setShowAllTags] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get("/links/analytics");
      console.log("Analytics Data Received:", res.data);
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-80 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const allTagData = Object.entries(data.tagCount || {}).map(([tag, count]) => ({
    name: tag,
    value: count
  })).sort((a, b) => b.value - a.value);

  const tagData = showAllTags ? allTagData : allTagData.slice(0, 8);

  const allCategoryData = Object.entries(data.categoryCount || {}).map(
    ([cat, count]) => ({
      name: cat,
      value: count
    })
  ).sort((a, b) => b.value - a.value);

  // Group minor categories into "Others" if more than 6
  const categoryData = allCategoryData.length > 6
    ? [
        ...allCategoryData.slice(0, 5),
        {
          name: "Others",
          value: allCategoryData.slice(5).reduce((acc, curr) => acc + curr.value, 0)
        }
      ]
    : allCategoryData;

  const weeklyActivity = data.weeklyActivity || [];

  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

  const downloadPDF = async () => {
    const toastId = toast.loading("Generating report...");
    try {
      const input = document.getElementById("analytics-content");
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("bookmark-analytics.pdf");
      toast.success("Report downloaded!", { id: toastId });
    } catch (e) {
      toast.error("Failed to generate PDF", { id: toastId });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Analytics Insights</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Understanding your bookmarking habits and interests.</p>
        </div>
        <button
          onClick={downloadPDF}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
        >
          <Download className="w-5 h-5" />
          Download Report
        </button>
      </div>

      <div id="analytics-content" className="space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#161925] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Links</h3>
            </div>
            <p className="text-4xl font-black text-gray-900 dark:text-gray-100">{data.total}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-[#161925] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400">
                <Tag className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Top Tag</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">#{tagData[0]?.name || "N/A"}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-[#161925] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-pink-50 dark:bg-pink-500/10 rounded-lg text-pink-600 dark:text-pink-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Main Category</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{categoryData[0]?.name || "N/A"}</p>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-[#161925] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-gray-900 dark:text-gray-100">Tag Distribution</h3>
              </div>
              {allTagData.length > 8 && (
                <button
                  onClick={() => setShowAllTags(!showAllTags)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-md"
                >
                  {showAllTags ? "Show Top 8" : `View All (${allTagData.length})`}
                </button>
              )}
            </div>
            <div className={`w-full transition-all duration-300 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 ${showAllTags ? 'h-[400px] overflow-y-auto pr-2' : 'h-[300px]'}`}>
              <div style={{ height: showAllTags ? Math.max(400, tagData.length * 35) : '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tagData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#88888822" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={90} style={{ fontSize: '11px', fontWeight: 600 }} />
                    <Tooltip cursor={{ fill: '#88888811' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-[#161925] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Layers className="w-5 h-5 text-purple-500" />
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Category Mix</h3>
            </div>
            <div className="h-[300px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              {allCategoryData.length > 6 && (
                <div className="absolute bottom-0 right-0">
                  <span className="text-[10px] text-gray-400 font-medium italic">* Minor categories grouped in 'Others'</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Daily Progress */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-[#161925] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-gray-900 dark:text-gray-100">Weekly Activity</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} style={{ fontSize: '12px' }} />
                <YAxis axisLine={false} tickLine={false} style={{ fontSize: '12px' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* AI Insight Section */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Sparkles className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6" />
              <h3 className="text-xl font-bold">Weekly AI Digest</h3>
            </div>
            <p className="text-lg text-white/90 leading-relaxed max-w-2xl font-medium">
              This week, you've shown a strong interest in <span className="text-white font-black underline decoration-indigo-300 underline-offset-4">{categoryData[0]?.name || "new"}</span> content. 
              Your most frequent focus was on <span className="bg-white/20 px-2 py-0.5 rounded-lg">#{tagData[0]?.name || "research"}</span>. 
              You're building a great knowledge base! 🚀
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
