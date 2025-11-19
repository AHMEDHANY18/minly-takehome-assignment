import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
      <h1 className="text-4xl font-bold text-emerald-400 mb-6">
        Minly Frontend + Tailwind ✅
      </h1>

      {/* زرار Tailwind */}
      <button
        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-all shadow-lg"
        onClick={() => setCount(count + 1)}
      >
        اضغط هنا
      </button>

      {/* JavaScript Output */}
      <p className="text-white mt-4 text-xl">
        عدد الضغطات: <span className="text-emerald-400">{count}</span>
      </p>
    </div>
  );
}

export default App;
