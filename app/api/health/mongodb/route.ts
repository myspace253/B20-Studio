import { NextResponse } from "next/server";
import { pingMongoDB } from "@/lib/mongodb";

export async function GET() {
  try {
    await pingMongoDB();
    return NextResponse.json({ ok: true, message: "MongoDB connection is healthy" });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "MongoDB connection failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
