import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const dir = path.join(process.cwd(), 'public', 'vishmish');
  if (!fs.existsSync(dir)) {
    return NextResponse.json([]);
  }
  const files = fs.readdirSync(dir).filter((f) => {
    const lower = f.toLowerCase();
    return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png');
  });
  return NextResponse.json(files);
}
