import { getArticleData } from '@/lib/content.server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const article = await getArticleData(params.slug);
    
    if (!article) {
      return new NextResponse(null, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error('Error in article API route:', error);
    return new NextResponse(null, { status: 500 });
  }
} 