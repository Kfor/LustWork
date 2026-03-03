import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    invoke("get_today", { date: today })
      .then(() => setReady(true))
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Lust Work</h1>
        <p className="text-gray-600 mt-2">
          {ready
            ? "Database ready. N-of-1 Experiment Tracker."
            : "Initializing..."}
        </p>
      </div>
    </div>
  );
}

export default App;
