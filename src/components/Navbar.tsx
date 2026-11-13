import { Link, useNavigate } from "react-router-dom";
import { User } from "firebase/auth";
import { auth } from "../firebase";
import { UserProfile } from "../types";
import { LogOut, LayoutDashboard, TrendingUp } from "lucide-react";

interface NavbarProps {
  user: User | null;
  profile: UserProfile | null;
}

export default function Navbar({ user, profile }: NavbarProps) {
  const navigate = useNavigate();
  const isAdmin = profile?.role === "admin" || user?.email === "habeshatilaye@gmail.com";

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-[#0f172a]/95 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to={user ? (isAdmin ? "/admin" : "/dashboard") : "/"} className="flex items-center gap-3 group">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl group-hover:scale-105 transition-all shadow-lg shadow-indigo-500/30">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-white italic">GAMMIX<span className="text-indigo-400">TRADING</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {!user && (
            <>
              <Link to="/" className="text-sm font-bold text-slate-300 hover:text-indigo-400 transition-colors">Home</Link>
              <Link to="/about" className="text-sm font-bold text-slate-300 hover:text-indigo-400 transition-colors">About</Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user?.email === "habeshatilaye@gmail.com" && !profile?.role && (
            <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-2.5 py-1 rounded-full border border-yellow-500/30 font-bold">Syncing Admin...</span>
          )}
          {user ? (
            <div className="flex items-center gap-4">
              <Link 
                to={isAdmin ? "/admin" : "/dashboard"} 
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
              >
                <LayoutDashboard className="w-4 h-4" />
                {isAdmin ? "Admin Panel" : "Dashboard"}
              </Link>
              <button 
                onClick={handleLogout}
                className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white transition-colors">
                Login
              </Link>
              <Link to="/register" className="px-6 py-3 text-xs font-black uppercase tracking-widest text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl transition-all shadow-xl shadow-indigo-500/30">
                Start Trading
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
