import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";
import { TrendingUp, Shield, Zap, Globe, ArrowRight, BarChart3, PieChart, Activity } from "lucide-react";

export default function Home() {
  const stats = [
    { label: "Active Traders", value: "24k+", icon: Globe, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Platform Uptime", value: "99.9%", icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Daily Volume", value: "$2.4M", icon: BarChart3, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Global Markets", value: "50+", icon: Activity, color: "text-rose-600", bg: "bg-rose-50" }
  ];

  const features = [
    {
      title: "Real-time Execution",
      desc: "Experience the thrill of ultra-low latency trading with our proprietary matching engine.",
      icon: TrendingUp,
      accent: "bg-indigo-500"
    },
    {
      title: "Secure Custody",
      desc: "Your assets are protected by multiple layers of cold storage and MPC wallet infrastructure.",
      icon: Shield,
      accent: "bg-emerald-500"
    },
    {
      title: "Advanced Analytics",
      desc: "Institutional-grade technical indicators and on-chain metrics at your fingertips.",
      icon: PieChart,
      accent: "bg-blue-500"
    }
  ];

  return (
    <div className="flex flex-col min-h-[calc(100-4rem)] bg-slate-100 text-slate-900 selection:bg-indigo-500/30">
      {/* Hero Section */}
      <section className="relative pt-32 pb-44 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#4f46e5,transparent)] opacity-10" />
        <div className="absolute inset-0 bg-slate-100" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#4f46e5,transparent)] opacity-10" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 pointer-events-none" />
        
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="max-w-3xl text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-10 shadow-sm mx-auto lg:mx-0">
                  <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                  Institutional Grade Trading Platform
                </div>
                <h1 className="text-7xl md:text-9xl font-display font-black tracking-tighter text-slate-900 mb-8 leading-[0.85]">
                  Master the <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">Digital</span> Markets
                </h1>
                <p className="text-lg md:text-xl text-slate-500 mb-12 leading-relaxed max-w-xl lg:mx-0 mx-auto font-medium">
                  The most advanced trading ecosystem for crypto and global markets. 
                  <span className="hidden md:inline"> Lightning execution meets cryptographic security for the modern trader.</span>
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6">
                  <Link 
                    to="/register" 
                    className="group relative w-full sm:w-auto overflow-hidden px-12 py-5 bg-indigo-600 rounded-2xl transition-all active:scale-95 shadow-xl hover:shadow-indigo-500/40"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <span className="relative flex items-center justify-center gap-3 text-white font-black text-lg">
                      Start Trading <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                  <Link 
                    to="/login" 
                    className="w-full sm:w-auto px-12 py-5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 font-bold rounded-2xl transition-all backdrop-blur-md text-lg"
                  >
                    Client Login
                  </Link>
                </div>

                {/* Floating Stats */}
                <div className="mt-16 flex flex-wrap items-center justify-center lg:justify-start gap-12 border-t border-slate-200 pt-10">
                  <div>
                    <div className="text-2xl font-black text-slate-900 font-display">$2.4B+</div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Trading Volume</div>
                  </div>
                  <div className="w-[1px] h-8 bg-slate-200" />
                  <div>
                    <div className="text-2xl font-black text-slate-900 font-display">1.2M+</div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Active Users</div>
                  </div>
                </div>
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative flex-1"
            >
              <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 rounded-[3rem] blur-2xl opacity-20 animate-pulse" />
              <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden border border-slate-200/80 bg-slate-900 shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&q=80&w=1200" 
                  alt="Cryptocurrency Bitcoin Blockchain Visualization"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                
                {/* Floating Elements on Top of Image */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute top-8 right-8 bg-white/90 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-mono font-black text-slate-900">BTC/USD +5.42%</span>
                  </div>
                </motion.div>

                <motion.div 
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute bottom-8 left-8 bg-white/90 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-xl"
                >
                   <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
                    <span className="text-xs font-mono font-black text-slate-900">SOL/USDT +8.15%</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bento Grid Stats/Features */}
      <section className="py-32 relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 glass-card rounded-[2.5rem] p-12 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8">
                <Activity className="w-12 h-12 text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors" />
              </div>
              <h3 className="text-4xl font-display font-black mb-6">Real-time Global Liquidity</h3>
              <p className="text-slate-500 max-w-md leading-relaxed mb-8">
                Access deep liquidity pools across major exchanges with zero-spread execution and instant settlements.
              </p>
              <div className="flex items-end gap-2 h-20">
                {[40, 70, 45, 90, 65, 80, 50, 85, 60, 95].map((h, i) => (
                  <motion.div 
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    transition={{ delay: i * 0.05, duration: 1 }}
                    className="flex-1 bg-indigo-500/10 rounded-t-lg group-hover:bg-indigo-500/20 transition-all"
                  />
                ))}
              </div>
            </div>

            <div className="glass-card rounded-[2.5rem] p-12 flex flex-col justify-between group">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-8 border border-emerald-100 group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-3xl font-display font-black mb-4 tracking-tight">Vault Security</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Multi-signature cold storage and FIPS 140-2 Level 3 hardware security modules protect every asset.
                </p>
              </div>
            </div>

            <div className="glass-card rounded-[2.5rem] p-12 flex flex-col justify-between group">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 mb-8 border border-blue-100 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-3xl font-display font-black mb-4 tracking-tight">Hyper-Speed</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Our core matching engine process over 1.2M transactions per second with sub-millisecond latency.
                </p>
              </div>
            </div>

            <div className="md:col-span-2 glass-card rounded-[2.5rem] p-12 flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1">
                <h3 className="text-4xl font-display font-black mb-6">Built for the Modern Era</h3>
                <p className="text-slate-500 leading-relaxed">
                  Whether you are a retail enthusiast or an institutional powerhouse, our API and interface provide the tools you need to succeed.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                <div className="p-6 bg-slate-100 rounded-3xl border border-slate-200">
                  <div className="text-2xl font-black text-slate-900 font-mono">0.0%</div>
                  <div className="text-[10px] uppercase text-slate-400">Maker Fee</div>
                </div>
                <div className="p-6 bg-slate-100 rounded-3xl border border-slate-200">
                  <div className="text-2xl font-black text-slate-900 font-mono">1.2ms</div>
                  <div className="text-[10px] uppercase text-slate-400">Avg. Execution</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
