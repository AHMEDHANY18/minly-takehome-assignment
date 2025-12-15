import type { ReactNode } from "react";
import { motion } from "framer-motion";


export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4 relative overflow-hidden">
      <motion.div
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px]"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-[100px]"
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <motion.div
        className="w-full max-w-[420px] bg-white rounded-[24px] shadow-[0_20px_40px_-5px_rgba(0,0,0,0.05),0_10px_20px_-5px_rgba(0,0,0,0.02)] p-8 sm:p-10 relative z-10"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-300 rounded-t-[24px]" />
        {children}
      </motion.div>
    </div>
  );
}
