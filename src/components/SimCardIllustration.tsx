import React from "react";
import { HelpCircle, Star, Sparkles, Wifi } from "lucide-react";

export default function SimCardIllustration() {
  return (
    <div id="sim-card-container" className="relative flex flex-col items-center justify-center p-6 my-4 select-none">
      {/* Background ambient glow */}
      <div className="absolute w-44 h-44 rounded-full bg-orange-500/10 blur-3xl" />

      {/* Main floating elements */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Floating Question Marks */}
        <div className="absolute -top-4 left-1/4 animate-bounce duration-1000">
          <HelpCircle className="w-10 h-10 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
        </div>
        <div className="absolute top-6 right-12 animate-bounce delay-300">
          <HelpCircle className="w-12 h-12 text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
        </div>
        <div className="absolute -top-8 right-1/4 animate-bounce delay-700">
          <HelpCircle className="w-8 h-8 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
        </div>

        {/* Small floating deco objects */}
        <div className="absolute bottom-16 -left-4 animate-pulse">
          <div className="w-10 h-10 border border-white/10 rounded-lg flex items-center justify-center bg-slate-900/40">
            <span className="text-xs text-slate-400 font-mono">SIM</span>
          </div>
        </div>

        <div className="absolute top-1/2 -right-8 animate-pulse delay-500">
          <div className="w-12 h-12 border border-white/10 rounded-full flex items-center justify-center bg-slate-900/40">
            <Wifi className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        {/* SIM Card Body */}
        <div className="relative w-40 h-52 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl shadow-[0_20px_50px_rgba(249,115,22,0.3)] border border-orange-300/30 flex flex-col items-center justify-center overflow-hidden">
          {/* SIM Card Notch at top right */}
          <div className="absolute top-0 right-0 w-10 h-10 bg-slate-950 rotate-45 translate-x-5 -translate-y-5" />

          {/* SIM Gold Chip texture */}
          <div className="absolute top-6 left-6 w-10 h-8 border border-amber-600/30 rounded bg-gradient-to-b from-amber-300/20 to-amber-400/5 flex flex-wrap p-1">
            <div className="w-1/2 h-1/2 border-r border-b border-amber-600/20" />
            <div className="w-1/2 h-1/2 border-b border-amber-600/20" />
            <div className="w-1/2 h-1/2 border-r border-amber-600/20" />
            <div className="w-1/2 h-1/2" />
          </div>

          {/* Smiling Face */}
          <div className="flex flex-col items-center justify-center mt-6">
            {/* Eyes */}
            <div className="flex gap-6 mb-3">
              <div className="w-4 h-4 rounded-full bg-white animate-ping absolute opacity-20" />
              <div className="w-4 h-4 rounded-full bg-white relative shadow-sm" />
              <div className="w-4 h-4 rounded-full bg-white relative shadow-sm" />
            </div>
            {/* Smile */}
            <div className="w-14 h-7 border-b-4 border-white rounded-b-full shadow-inner" />
          </div>

          {/* Decorative lines */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between px-2">
            <Star className="w-4 h-4 text-white/50" />
            <Sparkles className="w-4 h-4 text-white/50" />
          </div>
        </div>
      </div>
    </div>
  );
}
