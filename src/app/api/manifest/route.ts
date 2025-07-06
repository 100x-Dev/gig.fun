import { NextResponse } from 'next/server';
import { manifest } from '../../miniapp-manifest';

export async function GET() {
  return NextResponse.json(manifest);
}
