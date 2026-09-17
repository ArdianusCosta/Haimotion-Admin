import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const permissions = await prisma.systemPermission.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
    return NextResponse.json({ permissions });
  } catch (error: any) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { id, category, name, description } = data;
    
    if (!id || !category || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newPermission = await prisma.systemPermission.create({
      data: { id, category, name, description }
    });

    return NextResponse.json({ permission: newPermission });
  } catch (error: any) {
    console.error('Error creating permission:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
