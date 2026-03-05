import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const audioBlob = formData.get("audio") as Blob;
        const roomId = formData.get("roomId") as string;
        const userName = formData.get("userName") as string;

        if (!audioBlob || !roomId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 取得環境變數設定
        const sttProvider = process.env.STT_PROVIDER || "openai";
        const llmProvider = process.env.LLM_PROVIDER || "gemini";
        let transcript = "";

        // MVP STT 處理
        if (sttProvider === "openai") {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            // 將 Blob 轉為 File 物件再傳給 OpenAI SDK
            const buffer = Buffer.from(await audioBlob.arrayBuffer());
            const file = new File([buffer], "audio.webm", { type: audioBlob.type || "audio/webm" });

            const response = await openai.audio.transcriptions.create({
                file: file,
                model: "whisper-1",
                language: "zh",
            });
            transcript = response.text;
        } else if (sttProvider === "gemini") {
            // Gemini支援原生 audio base64 分析
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
            const buffer = Buffer.from(await audioBlob.arrayBuffer());

            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const response = await model.generateContent([
                "這是一段會議錄音，請完整且精確的將這段錄音轉換為逐字稿，不要添加其他的對話內容。",
                {
                    inlineData: {
                        data: buffer.toString("base64"),
                        mimeType: audioBlob.type || "audio/webm"
                    }
                }
            ]);
            transcript = response.response.text() || "";
        }

        if (!transcript) {
            return NextResponse.json({ error: "Failed to transcribe audio" }, { status: 500 });
        }

        // MVP LLM 摘要處理
        let summary = "";
        const prompt = `你是一個專業的會議助理。請為以下會議逐字稿產生重點整理與待辦事項 (Action Items)。\n\n發言人: ${userName}\n逐字稿: ${transcript}\n\n請用精簡俐落的繁體中文排版。`;

        if (llmProvider === "openai") {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }]
            });
            summary = completion.choices[0].message.content || "";
        } else {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const summaryResp = await model.generateContent(prompt);
            summary = summaryResp.response.text() || "";
        }

        // 儲存至資料庫
        // 先確認 Meeting 是否存在，不存在就建立 (MVP簡化邏輯)
        let meeting = await prisma.meeting.findFirst({ where: { id: roomId } });
        if (!meeting) {
            meeting = await prisma.meeting.create({
                data: {
                    id: roomId,
                    title: "線上視訊會議",
                    host: {
                        connectOrCreate: {
                            where: { id: "user-placeholder" },
                            create: { id: "user-placeholder", name: "Host" }
                        }
                    }
                }
            });
        }

        const record = await prisma.meetingRecord.create({
            data: {
                meetingId: meeting.id,
                transcript: `${userName}: ${transcript}`,
                summary: summary,
            }
        });

        return NextResponse.json({ success: true, record });

    } catch (error: any) {
        console.error("Recording Process Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
