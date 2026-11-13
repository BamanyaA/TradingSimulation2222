import { motion } from "motion/react";
import { Shield, Target, Lightbulb, CheckCircle2 } from "lucide-react";

export default function About() {
  const values = [
    {
      title: "Transparency",
      desc: "Every trade is backed by clear algorithms and verifiable results. We believe in open trading environments.",
      icon: Shield
    },
    {
      title: "Innovation First",
      desc: "Our platform uses the latest web technologies to deliver a lag-free, real-time trading experience.",
      icon: Lightbulb
    },
    {
      title: "Customer Success",
      desc: "Your growth as a trader is our primary metric. We provide tools to help you succeed in real markets.",
      icon: Target
    }
  ];

  return (
    <div className="container mx-auto px-4 py-20 max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-20"
      >
        <span className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-4 block underline decoration-blue-600 underline-offset-8">Our Mission</span>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 tracking-tighter">
          Democratizing Financial <br /> Education Through Technology
        </h1>
        <p className="text-xl text-slate-500 leading-relaxed max-w-3xl mx-auto font-medium">
          GAMMIX TRADING was founded with a simple goal: to provide a safe, engaging, and realistic environment for anyone to learn the complexities of cryptocurrency trading.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-12 mb-32">
        {values.map((value, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="p-8 rounded-3xl bg-white border border-slate-100 text-center shadow-xl shadow-slate-100/50"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center mx-auto mb-6">
              <value.icon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight">{value.title}</h3>
            <p className="text-slate-500 leading-relaxed font-medium">{value.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-blue-600 rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-blue-200"
      >
        <div className="relative z-10">
          <h2 className="text-3xl md:text-5xl font-black mb-8 tracking-tighter italic">Ready to start your journey?</h2>
          <p className="text-blue-100 text-lg mb-12 max-w-2xl mx-auto font-medium">
            Join over 24,000 traders who have already started practicing their strategies on our platform.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              <span className="font-black uppercase tracking-widest text-[10px]">Free Forever</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              <span className="font-black uppercase tracking-widest text-[10px]">Zero Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              <span className="font-black uppercase tracking-widest text-[10px]">24/7 Support</span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-black/10 rounded-full blur-3xl" />
      </motion.div>
    </div>
  );
}
