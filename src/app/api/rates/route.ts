import { NextResponse } from "next/server";
import { getRates } from "@/lib/rates";

export const dynamic = "force-dynamic";

export async function GET() {
  const rates = await getRates();
  return NextResponse.json(rates);
}
