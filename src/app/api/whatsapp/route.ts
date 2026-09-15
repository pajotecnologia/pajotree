import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Módulo descontinuado" }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ error: "Módulo descontinuado" }, { status: 404 });
}

export async function PUT() {
  return NextResponse.json({ error: "Módulo descontinuado" }, { status: 404 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Módulo descontinuado" }, { status: 404 });
}
