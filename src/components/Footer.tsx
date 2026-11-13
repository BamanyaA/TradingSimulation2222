import React from "react";
import { Shield, Globe, Award, Mail } from "lucide-react";
import { cn } from "../lib/utils";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tighter italic">
                GAMMIX<span className="text-blue-600">TRADING</span>
              </span>
            </div>
            <p className="text-slate-500 text-base max-w-sm leading-relaxed font-semibold">
              Experience professional-grade trading with our advanced binary options platform. 
              Secure, fast, and built for modern traders who demand the best in execution and support.
            </p>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer group">
                <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-black uppercase tracking-widest">Secure SSL</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer group">
                <Award className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-black uppercase tracking-widest">Licensed</span>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <h4 className="text-slate-900 font-black text-xs uppercase tracking-[0.2em]">Platform</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm font-bold transition-colors">Trade History</a></li>
              <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm font-bold transition-colors">Deposit Methods</a></li>
              <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm font-bold transition-colors">Withdrawal Policy</a></li>
              <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm font-bold transition-colors">VIP Program</a></li>
            </ul>
          </div>

          <div className="space-y-8">
            <h4 className="text-slate-900 font-black text-xs uppercase tracking-[0.2em]">Support</h4>
            <ul className="space-y-4">
              <li>
                <a href="mailto:support@gamixtrading.com" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 text-sm font-bold transition-colors">
                  <Mail className="w-4 h-4" />
                  Help Center
                </a>
              </li>
              <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm font-bold transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm font-bold transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm font-bold transition-colors">FAQ</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest">
            © {new Date().getFullYear()} GAMMIX TRADING GLOBAL LTD. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center gap-6">
            <span className="px-3 py-1.5 bg-green-50 text-green-600 text-[10px] font-black rounded-lg border border-green-100 uppercase tracking-widest shadow-sm">Server Online</span>
            <span className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg border border-blue-100 uppercase tracking-widest shadow-sm">Fast Connect</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
