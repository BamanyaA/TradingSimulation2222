import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
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
            balance: 0
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
    <div className="container mx-auto px-4 py-10 flex justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-100/50"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="p-4 bg-indigo-600 rounded-[1.5rem] mb-6 shadow-xl shadow-indigo-200">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight text-center leading-tight">Create <br/> <span className="text-indigo-600">Account</span></h2>
          <p className="text-slate-400 mt-3 font-medium">Start your trading journey</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="email"
                required
                className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/50 transition-all outline-none font-medium"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="password"
                required
                className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/50 transition-all outline-none font-medium"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="password"
                required
                className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/50 transition-all outline-none font-medium"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 group shadow-2xl shadow-indigo-100 active:scale-95 text-sm uppercase tracking-[0.2em]"
          >
            {loading ? "Creating Account..." : "Create Account"}
            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <p className="mt-10 text-center text-slate-400 text-xs font-medium uppercase tracking-widest leading-relaxed">
          Already registered?{" "}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-black">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}
