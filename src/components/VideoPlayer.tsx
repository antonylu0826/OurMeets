"use client";

import { useEffect, useRef } from "react";

interface VideoPlayerProps {
    stream: MediaStream | null;
    muted?: boolean;
    userName?: string;
    isLocal?: boolean;
}

export default function VideoPlayer({ stream, muted = false, userName = "使用者", isLocal = false }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="relative w-full h-full bg-dark-900 rounded-xl overflow-hidden border border-gray-800 shadow-xl group">
            {stream ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={muted}
                    className={`w-full h-full object-cover transition-transform duration-300 ${isLocal ? "scale-x-[-1]" : ""}`}
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-dark-800 text-gray-500">
                    <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-3xl text-white font-bold mb-4">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                </div>
            )}

            {/* Name Tag overlay */}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm text-white font-medium flex items-center gap-2 max-w-[80%] opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="truncate">{userName} {isLocal && "(您)"}</span>
            </div>
        </div>
    );
}
