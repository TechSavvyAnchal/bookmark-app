import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, PieChart, LogOut, Bookmark, Folder, Chrome, Shield } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Vaults", path: "/vaults", icon: Folder },
    { name: "Analytics", path: "/analytics", icon: PieChart },
    { name: "Extension", path: "/extension", icon: Chrome },
    { name: "Security", path: "/settings", icon: Shield },
  ];

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-72 lg:static lg:translate-x-0
      bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-2xl flex flex-col h-full 
      border-r border-white/50 dark:border-white/5 transition-all duration-500 
      shadow-2xl shadow-indigo-500/5
      ${isOpen ? "translate-x-0" : "-translate-x-full"}
    `}>
      {/* Logo Area */}
      <div className="h-24 flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40">
            <Bookmark className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-[900] text-slate-900 dark:text-white tracking-tight leading-tight">AI<br/><span className="text-indigo-600 dark:text-indigo-400">Bookmarks</span></span>
        </div>
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-8 space-y-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => onClose && onClose()}
              className={`flex items-center px-5 py-3.5 rounded-2xl transition-all duration-300 group ${
                isActive
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 scale-[1.02]"
                  : "text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-indigo-400 hover:translate-x-1"
              }`}
            >
              <Icon className={`w-5 h-5 mr-4 transition-transform duration-300 ${isActive ? "text-white" : "text-slate-400 group-hover:scale-110"}`} />
              <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${isActive ? "opacity-100" : "opacity-70"}`}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Area / Logout */}
      <div className="p-6">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-5 py-4 text-slate-400 hover:text-red-500 bg-slate-50/50 dark:bg-black/20 rounded-[1.5rem] border border-transparent hover:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/5 transition-all duration-300 group"
        >
          <LogOut className="w-5 h-5 mr-4 group-hover:rotate-12 transition-transform" />
          <span className="text-[11px] font-black uppercase tracking-[0.15em]">Logout</span>
        </button>
      </div>
    </aside>
  );
}
