import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { toast } from "react-hot-toast";
import { TrendingUp, Mail, Lock, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const isAdminEmail = user.email === "habeshatilaye@gmail.com";
      try {
        await fetch("/api/users/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
            role: isAdminEmail ? "admin" : "user",
            balance: isAdminEmail ? 31050 : 0
          })
        });
      } catch (upsertErr) {
        console.error("Server upsert profile failed:", upsertErr);
      }

      toast.success("Account created successfully!");
      navigate(isAdminEmail ? "/admin" : "/dashboard");
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Registration failed";
      if (errMsg.includes("email-already-in-use") || errMsg.includes("already-in-use") || errMsg.includes("already exists")) {
        toast.error("Email already in use. Please log in as the administrator (habeshatilaye@gmail.com) first to trigger a deep database sweep and clear registration cache.", { duration: 8000 });
      } else {
        toast.error(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center min-h-[calc(100vh-10rem)] items-center bg-[#111c38] text-slate-100">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#131b2e] border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-500/10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="p-4 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-[1.5rem] mb-6 shadow-xl shadow-indigo-500/30">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight text-center leading-tight">Create <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Account</span></h2>
          <p className="text-slate-400 mt-3 font-medium">Start your trading journey</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="email"
                required
                className="w-full bg-[#1a233a] border border-slate-700/60 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:bg-[#1f2b45] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none font-medium"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="password"
                required
                className="w-full bg-[#1a233a] border border-slate-700/60 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:bg-[#1f2b45] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none font-medium"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="password"
                required
                className="w-full bg-[#1a233a] border border-slate-700/60 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:bg-[#1f2b45] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none font-medium"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-3 uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50 mt-2"
          >
            {loading ? "Creating Account..." : "Create Account"} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm font-medium">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-400 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
