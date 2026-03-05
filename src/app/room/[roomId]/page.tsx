"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, MessageSquare, Disc, RefreshCw } from "lucide-react";
import io, { Socket } from "socket.io-client";
import VideoPlayer from "@/components/VideoPlayer";
import Peer from "peerjs";

interface MeetingRecord {
    id: string;
    transcript: string;
    summary: string;
    createdAt: string;
}

export default function RoomPage() {
    const params = useParams<{ roomId: string }>();
    const roomId = params.roomId;
    const router = useRouter();

    const [userName, setUserName] = useState("訪客");
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<{ id: string; stream: MediaStream; name: string }[]>([]);

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState<"ai-minutes" | "participants">("participants");
    const [records, setRecords] = useState<MeetingRecord[]>([]);

    const isInitializing = useRef(false);
    const socketRef = useRef<Socket | null>(null);
    const peerRef = useRef<Peer | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);

    useEffect(() => {
        if (isInitializing.current) return;
        isInitializing.current = true;

        const storedName = localStorage.getItem("ourmeets_username");
        if (storedName) setUserName(storedName);

        const initMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);

                const peer = new Peer(undefined as any, {
                    host: "0.peerjs.com",
                    port: 443,
                    secure: true,
                });

                peerRef.current = peer;

                peer.on("open", (id) => {
                    socketRef.current = io("http://localhost:3001");
                    socketRef.current.emit("join-room", roomId, id);

                    socketRef.current.on("user-connected", (userId: string) => {
                        console.log("User connected", userId);
                        const call = peer.call(userId, stream);
                        call.on("stream", (userVideoStream) => {
                            addRemoteStream(userId, userVideoStream, "與會者");
                        });
                    });

                    socketRef.current.on("user-disconnected", (userId: string) => {
                        setRemoteStreams((prev) => prev.filter((s) => s.id !== userId));
                    });
                });

                peer.on("call", (call) => {
                    call.answer(stream);
                    call.on("stream", (userVideoStream) => {
                        addRemoteStream(call.peer, userVideoStream, "與會者");
                    });
                });

            } catch (err) {
                console.error("無法存取攝影機與麥克風", err);
            }
        };

        initMedia();
        fetchRecords();

        return () => {
            localStream?.getTracks().forEach((track) => track.stop());
            socketRef.current?.disconnect();
            peerRef.current?.destroy();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    const fetchRecords = async () => {
        try {
            const res = await fetch(`/api/meetings/${roomId}`);
            const data = await res.json();
            if (data.success) {
                setRecords(data.records);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const addRemoteStream = (id: string, stream: MediaStream, name: string) => {
        setRemoteStreams((prev) => {
            if (prev.some((s) => s.id === id)) return prev;
            return [...prev, { id, stream, name }];
        });
    };

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!localStream.getAudioTracks()[0].enabled);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(!localStream.getVideoTracks()[0].enabled);
        }
    };

    const handleRecordToggle = async () => {
        if (isRecording) {
            // 停止錄製
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            // 開始錄製
            if (!localStream) return;
            audioChunksRef.current = [];

            // 直接以預設配置初始化 MediaRecorder，將交由瀏覽器決定最適合的預設音訊格式，避免特定的 MIME 類型引發 NotSupportedError
            let mediaRecorder: MediaRecorder;
            try {
                mediaRecorder = new MediaRecorder(localStream);
            } catch (err) {
                console.error("初始化 MediaRecorder 失敗", err);
                alert("您的瀏覽器不支援錄音功能，請更換最新的 Chrome 或 Edge 瀏覽器。");
                return;
            }

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });
                await uploadRecording(audioBlob);
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);
            setActiveTab("ai-minutes");
        }
    };

    const uploadRecording = async (blob: Blob) => {
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("audio", blob, "record.webm");
            formData.append("roomId", roomId);
            formData.append("userName", userName);

            const res = await fetch("/api/recordings", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                await fetchRecords();
            } else {
                console.error(await res.json());
            }
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleLeave = () => {
        localStream?.getTracks().forEach((track) => track.stop());
        router.push("/");
    };

    return (
        <div className="flex flex-col lg:flex-row h-screen w-full bg-[#0a0a0c] text-white overflow-hidden">
            {/* 視訊區域 */}
            <div className="flex-1 flex flex-col p-4">
                {/* Header */}
                <div className="flex justify-between items-center px-4 py-2 border-b border-gray-800/60 pb-4 mb-4">
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            會議室 <span className="text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded text-sm">{roomId}</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {isRecording && (
                            <div className="flex items-center gap-2 text-red-500 text-sm font-medium animate-pulse bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                正在錄音中...
                            </div>
                        )}
                        {isUploading && (
                            <div className="flex items-center gap-2 text-sky-400 text-sm font-medium animate-pulse bg-sky-400/10 px-3 py-1.5 rounded-full border border-sky-400/20">
                                <RefreshCw size={14} className="animate-spin" />
                                正在轉錄並生成 AI 摘要
                            </div>
                        )}
                    </div>
                </div>

                {/* Video Grid */}
                <div className="flex-1 min-h-0 relative">
                    <div className={`w-full h-full grid gap-4 p-2 ${remoteStreams.length === 0 ? "grid-cols-1" : remoteStreams.length === 1 ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-3"}`}>
                        <VideoPlayer stream={localStream} muted userName={userName} isLocal />
                        {remoteStreams.map((rs) => (
                            <VideoPlayer key={rs.id} stream={rs.stream} userName={rs.name} />
                        ))}
                    </div>
                </div>

                {/* Toolbar */}
                <div className="h-20 shrink-0 mt-4 bg-dark-800/80 backdrop-blur-lg border border-gray-800 rounded-2xl flex items-center justify-center gap-4 px-6 shadow-2xl mx-4 mb-2">
                    <button onClick={toggleMute} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMuted ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-gray-700/50 hover:bg-gray-700 hover:text-white"}`}>
                        {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                    </button>

                    <button onClick={toggleVideo} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isVideoOff ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-gray-700/50 hover:bg-gray-700 hover:text-white"}`}>
                        {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
                    </button>

                    <button onClick={handleRecordToggle} disabled={isUploading} className={`flex items-center gap-2 px-6 h-12 font-medium rounded-full transition-all ${isRecording ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "bg-primary-600 hover:bg-primary-500 text-white"} disabled:opacity-50`}>
                        {isUploading ? <RefreshCw size={20} className="animate-spin" /> : <Disc size={20} className={isRecording ? "animate-pulse" : ""} />}
                        {isUploading ? "AI 處理中" : isRecording ? "停止錄音並分析" : "發言錄音"}
                    </button>

                    <button onClick={handleLeave} className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center ml-auto lg:ml-8 transition-colors">
                        <PhoneOff size={22} />
                    </button>
                </div>
            </div>

            {/* 側邊面板 (AI 紀錄與成員) */}
            <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-gray-800 bg-[#111114] flex flex-col shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] h-[50vh] lg:h-auto">
                <div className="flex border-b border-gray-800 shrink-0">
                    <button
                        onClick={() => setActiveTab("participants")}
                        className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === "participants" ? "border-primary-500 text-primary-500" : "border-transparent text-gray-400 hover:text-gray-200"}`}
                    >
                        <Users size={16} /> 與會者
                    </button>
                    <button
                        onClick={() => setActiveTab("ai-minutes")}
                        className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === "ai-minutes" ? "border-primary-500 text-primary-500" : "border-transparent text-gray-400 hover:text-gray-200"}`}
                    >
                        <MessageSquare size={16} /> AI 會議紀錄
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {activeTab === "participants" && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-gray-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">{userName.charAt(0)}</div>
                                    <span className="font-medium">{userName} (您)</span>
                                </div>
                            </div>
                            {remoteStreams.map(rs => (
                                <div key={rs.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-gray-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">{rs.name.charAt(0)}</div>
                                        <span className="font-medium text-gray-300">{rs.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === "ai-minutes" && (
                        <div className="flex flex-col gap-4 text-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">即時轉錄結果</span>
                                <button onClick={fetchRecords} disabled={isUploading} className="text-primary-500 hover:text-primary-400 flex items-center gap-1 text-xs bg-primary-500/10 px-2 py-1 rounded">
                                    <RefreshCw size={12} className={isUploading ? "animate-spin" : ""} /> 更新
                                </button>
                            </div>

                            {records.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    <Disc size={40} className="mx-auto mb-3 opacity-20" />
                                    {!isRecording ? "錄製您的發言以產生對話紀錄與 AI 摘要" : "正在錄音中..."}
                                </div>
                            ) : (
                                records.map((rec) => (
                                    <div key={rec.id} className="bg-[#1a1a20] rounded-xl p-4 border border-gray-800 shrink-0">
                                        <div className="text-xs text-gray-500 mb-2">{new Date(rec.createdAt).toLocaleTimeString()}</div>
                                        <div className="text-gray-300 mb-3 leading-relaxed border-l-2 border-primary-500 pl-3">
                                            "{rec.transcript}"
                                        </div>
                                        {rec.summary && (
                                            <div className="bg-primary-900/20 text-primary-200 mt-2 p-3 rounded-lg border border-primary-500/20 break-words">
                                                <span className="font-bold flex items-center gap-1 mb-1">
                                                    ✨ AI 摘要
                                                </span>
                                                {rec.summary}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
