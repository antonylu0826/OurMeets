import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest, props: { params: Promise<{ roomId: string }> }) {
    try {
        const { roomId } = await props.params;

        const records = await prisma.meetingRecord.findMany({
            where: { meetingId: roomId },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json({ success: true, records });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
