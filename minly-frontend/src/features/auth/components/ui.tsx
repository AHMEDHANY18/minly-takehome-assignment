import type { InputHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  rightElement?: ReactNode;
  className?: string;
}

export function InputField({ label, rightElement, className, ...props }: InputProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className || ""}`}>
      <label className="text-xs font-semibold text-slate-700 ml-1">{label}</label>
      <div className="relative">
        <input
          className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
}

export function SocialButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      onClick={onClick}
      disabled={disabled}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 disabled:opacity-60"
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );
}

export function Button({
  children,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileHover={!disabled ? { y: -1 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      className="w-full py-3.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl font-semibold text-sm shadow-[0_10px_25px_rgba(30,58,138,0.25)] transition disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {children}
    </motion.button>
  );
}

export function Toggle({
  options,
  selectedIndex,
  onChange,
}: {
  options: [string, string];
  selectedIndex: number;
  onChange: (index: number) => void;
}) {
  return (
    <div className="relative flex w-full p-1 bg-slate-100 rounded-xl border border-slate-200">
      {/* Moving background pill */}
      <motion.div
        className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm pointer-events-none z-0"
        initial={false}
        animate={{
          left: selectedIndex === 0 ? "4px" : "50%",
          right: selectedIndex === 0 ? "50%" : "4px",
          width: "calc(50% - 4px)",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />

      {options.map((option, idx) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(idx)}
          className={`flex-1 relative z-10 text-xs font-semibold py-2 text-center transition ${
            selectedIndex === idx
              ? "text-slate-900"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

