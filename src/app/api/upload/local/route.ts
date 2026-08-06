import { NextResponse } from 'next/server';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    
    if (!key) {
      return NextResponse.json({ error: 'Missing key' }, { status: 400 });
    }

    const buffer = await req.arrayBuffer();
    
    // Write to public/uploads directory for local development
    const filePath = join(process.cwd(), 'public', 'uploads', key);
    
    // Ensure the directory exists
    mkdirSync(dirname(filePath), { recursive: true });
    
    // Write the file
    writeFileSync(filePath, Buffer.from(buffer));

    return NextResponse.json({ success: true, message: 'File uploaded locally' });
  } catch (error) {
    console.error('Local upload error:', error);
    return NextResponse.json({ error: 'Failed to upload locally' }, { status: 500 });
  }
}
