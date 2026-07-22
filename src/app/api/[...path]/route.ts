import { NextRequest } from 'next/server';
import { handleApiRequest } from '@/lib/server/handler';

export const dynamic = 'force-dynamic';

async function route(method: string, req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return handleApiRequest(method, path, req);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) { return route('GET', req, ctx); }
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) { return route('POST', req, ctx); }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) { return route('PATCH', req, ctx); }
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) { return route('DELETE', req, ctx); }
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) { return route('PUT', req, ctx); }
