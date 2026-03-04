import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// Handles GET /api/proxy/health → GET /health
export async function GET() {
    const res = await fetch(`${BACKEND_URL}/health`);
    const data = await res.json();
    return NextResponse.json(data);
}
