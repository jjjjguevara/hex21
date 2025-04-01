import { getDocData } from '@/lib/content.server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const doc = await getDocData(params.slug);
    
    if (!doc) {
      return new NextResponse(null, { status: 404 });
    }

    return NextResponse.json(doc);
  } catch (error) {
    console.error('Error in /api/docs/[slug]:', error);
    return new NextResponse(null, { status: 500 });
  }
} 