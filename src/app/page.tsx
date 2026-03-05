"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Video, Keyboard, Plus, ArrowRight } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateMeeting = () => {
    if (!userName.trim()) return alert("請輸入您的名字");
    setIsCreating(true);
    // 產生隨機房間 ID (MVP)
    const newRoomId = Math.random().toString(36).substring(2, 10);
    localStorage.setItem("ourmeets_username", userName);
    router.push(`/room/${newRoomId}`);
  };

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return alert("請輸入您的名字");
    if (!roomId.trim()) return alert("請輸入會議代碼");
    localStorage.setItem("ourmeets_username", userName);
    router.push(`/room/${roomId}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 lg:p-24 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
      >
        <div className="flex flex-col gap-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-600/20 text-primary-500 w-fit text-sm font-medium border border-primary-500/30">
            <Video size={16} /> Beta Version 1.0
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            高品質視訊與<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-sky-400">
              AI 自動紀錄
            </span>
          </h1>
          <p className="text-lg text-gray-400 max-w-lg">
            即時音訊通話、畫面分享，結合先進的 AI 語音轉文字與會議結論總結功能，為您的遠距協作提升效率。
          </p>
        </div>

        <div className="glass-panel p-8 flex flex-col gap-6 shadow-2xl">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">您的名稱</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="例如: 林小明"
              className="w-full bg-dark-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>

          <div className="h-px bg-gray-800 w-full"></div>

          <button
            onClick={handleCreateMeeting}
            disabled={isCreating}
            className="group relative flex items-center justify-center gap-2 w-full bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-70 overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            <Plus size={20} />
            {isCreating ? "建立中..." : "建立新會議"}
          </button>

          <form onSubmit={handleJoinMeeting} className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Keyboard size={18} className="text-gray-500" />
              </div>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="輸入會議代碼或連結"
                className="w-full bg-dark-900/50 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <button
              type="submit"
              className="bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center gap-1"
            >
              加入
            </button>
          </form>
        </div>
      </motion.div>
    </main>
  );
}
