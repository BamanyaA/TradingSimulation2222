import { Link, useNavigate } from "react-router-dom";
import { User } from "firebase/auth";
import { auth } from "../firebase";
import { UserProfile } from "../types";
import { LogOut, LayoutDashboard, Settings, TrendingUp } from "lucide-react";
import { cn } from "../lib/utils";

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
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to={user ? (isAdmin ? "/admin" : "/dashboard") : "/"} className="flex items-center gap-2 group">
          <div className="p-2 bg-indigo-600 rounded-lg group-hover:bg-indigo-500 transition-colors">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 italic">GAMMIX<span className="text-indigo-600">TRADING</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {!user && (
            <>
              <Link to="/" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Home</Link>
              <Link to="/about" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">About</Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user?.email === "habeshatilaye@gmail.com" && !profile?.role && (
            <span className="text-[10px] bg-yellow-50 text-yellow-600 px-2 py-1 rounded border border-yellow-100">Syncing Admin...</span>
          )}
          {user ? (
            <div className="flex items-center gap-4">
              <Link 
                to={isAdmin ? "/admin" : "/dashboard"} 
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-900 bg-slate-200 hover:bg-slate-300 rounded-full transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                {isAdmin ? "Admin Panel" : "Dashboard"}
              </Link>
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-200 rounded-full transition-all"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                Login
              </Link>
              <Link to="/register" className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-full transition-all shadow-lg shadow-indigo-100">
                Start Trading
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
