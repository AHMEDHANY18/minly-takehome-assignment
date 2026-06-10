import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { AuthAPI } from "@/features/auth/api/auth.api";

function Background() {
  const blobVariants: Variants = {
    animate: {
      x: [0, 30, -20, 0],
      y: [0, -50, 20, 0],
      scale: [1, 1.1, 0.9, 1],
      transition: {
        duration: 10,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-gray-50 dark:bg-zinc-950">
      <motion.div
        variants={blobVariants}
        animate="animate"
        className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-200/30 dark:bg-blue-600/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen"
      />

      {/* Bottom Right - Indigo/Gray */}
      <motion.div
        variants={blobVariants}
        animate="animate"
        transition={{ delay: 2 }}
        className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-100/40 dark:bg-indigo-600/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen"
      />

      {/* Center - Light Cyan/Sky */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[30%] left-[30%] w-[40%] h-[40%] bg-sky-100/50 dark:bg-sky-500/10 rounded-full blur-[80px] mix-blend-multiply dark:mix-blend-screen"
      />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function MinlyLogo() {
  return (
    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10">
      <svg className="w-6 h-6 text-white fill-current ml-1" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
    </div>
  );
}

export default function LoginPage() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [devBusy, setDevBusy] = useState(false);
  const [devError, setDevError] = useState<string | null>(null);
  const nav = useNavigate();

  const onContinueWithGoogle = () => {
    if (isRedirecting) return;
    setIsRedirecting(true);
    AuthAPI.startLogin();
  };

  const onDevLogin = async () => {
    if (devBusy) return;
    setDevBusy(true);
    setDevError(null);
    try {
      await AuthAPI.devLogin();
      nav("/", { replace: true });
      window.location.reload();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setDevError(
        err?.response?.data?.message ??
          "Dev login failed. Is the backend running with DEV_AUTH=true?"
      );
      setDevBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen font-sans text-gray-900 dark:text-zinc-100 selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900 dark:selection:text-blue-100">
      <Background />

      <main className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[400px]"
        >

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/70 dark:border-zinc-800 shadow-xl dark:shadow-black/40 p-8 md:p-10">

            {/* Header Section */}
            <div className="flex flex-col items-center text-center">

              <div className="flex items-center gap-3 mb-6">
                <MinlyLogo />
                <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
                  Minly
                </span>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
                Welcome to Minly
              </h1>
              <p className="mt-2 text-gray-600 dark:text-zinc-400 text-[15px] leading-relaxed max-w-[280px]">
                Sign in to create, discover and share your best moments.
              </p>
            </div>

            {/* Action Section */}
            <div className="mt-8 space-y-4">
              <motion.button
                type="button"
                whileHover={!isRedirecting ? { scale: 1.01 } : {}}
                whileTap={!isRedirecting ? { scale: 0.98 } : {}}
                onClick={onContinueWithGoogle}
                disabled={isRedirecting}
                className="group relative w-full inline-flex items-center justify-center gap-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-3.5 px-4 text-[15px] font-semibold text-gray-700 dark:text-zinc-200 shadow-sm transition hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isRedirecting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-gray-200 dark:border-zinc-700 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin" />
                    <span>Redirecting...</span>
                  </>
                ) : (
                  <>
                    <GoogleIcon />
                    <span>Continue with Google</span>
                  </>
                )}
              </motion.button>

              {import.meta.env.DEV && (
                <>
                  <div className="flex items-center gap-3 py-1">
                    <span className="h-px flex-1 bg-gray-100 dark:bg-zinc-800" />
                    <span className="text-xs font-medium text-gray-400 dark:text-zinc-500">DEV</span>
                    <span className="h-px flex-1 bg-gray-100 dark:bg-zinc-800" />
                  </div>
                  <button
                    type="button"
                    onClick={onDevLogin}
                    disabled={devBusy}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/40 py-3 px-4 text-[15px] font-semibold text-blue-700 dark:text-blue-300 transition hover:bg-blue-50 dark:hover:bg-blue-950/60 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {devBusy ? "Signing in..." : "Continue as Dev User (local)"}
                  </button>
                  {devError && (
                    <p className="text-center text-xs text-red-500 dark:text-red-400">{devError}</p>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-zinc-800">
              <p className="text-center text-xs text-gray-400 dark:text-zinc-500 leading-relaxed">
                By continuing, you agree to Minly's <br />
                <a href="#" className="font-medium text-gray-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline decoration-gray-200 dark:decoration-zinc-700 underline-offset-2">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="font-medium text-gray-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline decoration-gray-200 dark:decoration-zinc-700 underline-offset-2">
                  Privacy Policy
                </a>.
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
