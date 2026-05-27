"use client";

import { motion } from "framer-motion";

const banks = [
  "JPMorgan Chase", "Bank of America", "Wells Fargo", "Citigroup", "Goldman Sachs",
  "Morgan Stanley", "U.S. Bancorp", "PNC Financial Services", "Truist Financial", "Charles Schwab",
  "TD Bank", "Capital One", "Bank of New York Mellon", "State Street", "American Express",
  "Citizens Financial", "First Republic", "Fifth Third Bank", "KeyCorp", "Huntington Bancshares"
];

export default function BankRollover() {
  return (
    <section className="py-20 bg-[#030812] overflow-hidden border-y border-gray-800/50">
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <h2 className="text-center text-gray-500 uppercase tracking-[0.2em] text-sm font-bold">
          Bancos con los que trabajamos
        </h2>
      </div>
      
      <div className="relative flex overflow-x-hidden">
        <motion.div 
          className="flex whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ 
            duration: 30, 
            ease: "linear", 
            repeat: Infinity 
          }}
        >
          {/* Primer set de logos */}
          <div className="flex items-center gap-12 px-6">
            {banks.map((bank, i) => (
              <div 
                key={i} 
                className="h-12 px-8 flex items-center justify-center bg-gray-900/50 border border-gray-800 rounded-xl hover:border-cyan-500/30 transition-colors group"
              >
                <span className="text-gray-400 group-hover:text-cyan-400 font-bold text-lg tracking-tight italic">
                  {bank}
                </span>
              </div>
            ))}
          </div>
          
          {/* Duplicado para loop infinito */}
          <div className="flex items-center gap-12 px-6">
            {banks.map((bank, i) => (
              <div 
                key={`dup-${i}`} 
                className="h-12 px-8 flex items-center justify-center bg-gray-900/50 border border-gray-800 rounded-xl hover:border-cyan-500/30 transition-colors group"
              >
                <span className="text-gray-400 group-hover:text-cyan-400 font-bold text-lg tracking-tight italic">
                  {bank}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
        
        {/* Degradados laterales para suavizar el corte */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#030812] to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#030812] to-transparent z-10" />
      </div>
    </section>
  );
}
