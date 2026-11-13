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
    <div className="container mx-auto px-4 py-20 flex justify-center min-h-[calc(100vh-10rem)] items-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-100/50"
      >
        <div className="flex flex-col items-center mb-12">
          <div className="p-4 bg-indigo-600 rounded-[1.5rem] mb-6 shadow-xl shadow-indigo-200">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
          <p className="text-slate-400 mt-3 font-medium">Continue your trading journey</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="email"
                required
                className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-4 pl-14 pr-6 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/50 transition-all outline-none font-medium"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="password"
                required
                className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-4 pl-14 pr-6 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/50 transition-all outline-none font-medium"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 group shadow-2xl shadow-indigo-100 active:scale-95 text-sm uppercase tracking-widest"
          >
            {loading ? "Authorizing..." : "Log In"}
            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <p className="mt-10 text-center text-slate-400 font-medium">
          New to the platform?{" "}
          <Link to="/register" className="text-indigo-600 hover:text-indigo-500 font-black">Register</Link>
        </p>
      </motion.div>
    </div>
  );
}
