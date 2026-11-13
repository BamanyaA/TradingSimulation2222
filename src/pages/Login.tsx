import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { TrendingUp, Mail, Lock, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome back!");
      const isAdmin = email.toLowerCase() === "habeshatilaye@gmail.com";
      navigate(isAdmin ? "/admin" : "/dashboard");
    } catch (error: any) {
      if (email.toLowerCase() === "habeshatilaye@gmail.com" && (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials' || error.code === 'auth/wrong-password')) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          try {
            await setDoc(doc(db, "users", cred.user.uid), {
              email: cred.user.email,
              fullName: "Admin Habesha",
              address: "",
              phoneNumber: "",
              verificationDoc: null,
              balance: 100000,
              role: "admin",
              createdAt: new Date(),
              verificationStatus: "verified",
              isVerified: true,
              tradeAction: true
            });
          } catch (docErr) {
            console.error("Admin profile doc write error:", docErr);
          }
          toast.success("Admin account created and logged in!");
          navigate("/admin");
          return;
        } catch (createErr: any) {
          toast.error(createErr?.message || "Failed to create admin account");
        }
      } else {
        toast.error(error instanceof Error ? error.message : "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-20 flex justify-center min-h-[calc(100vh-10rem)] items-center bg-[#111c38] text-slate-100">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#131b2e] border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-500/10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="p-4 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-[1.5rem] mb-6 shadow-xl shadow-indigo-500/30">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">Welcome Back</h2>
          <p className="text-slate-400 mt-3 font-medium">Continue your trading journey</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="email"
                required
                className="w-full bg-[#1a233a] border border-slate-700/60 rounded-2xl py-4 pl-14 pr-6 text-white focus:bg-[#1f2b45] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none font-medium"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="password"
                required
                className="w-full bg-[#1a233a] border border-slate-700/60 rounded-2xl py-4 pl-14 pr-6 text-white focus:bg-[#1f2b45] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none font-medium"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-3 uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm font-medium">
            Don't have an account?{" "}
            <Link to="/register" className="text-indigo-400 font-bold hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
