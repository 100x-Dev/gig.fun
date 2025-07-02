import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '~/auth';
import { Service } from '~/types/service';

// Simple in-memory store for development
// In production, replace this with a database
let services: Service[] = [];

interface ServiceRequest {
  title: string;
  description: string;
  price: string | number;
  currency?: 'ETH' | 'USDC';
  deliveryDays: string | number;
  category: string;
  tags?: string[];
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.fid) {
      return new NextResponse(
        JSON.stringify({ error: 'You must be logged in to create a service' }),
        { status: 401 }
      );
    }

    let data: ServiceRequest;
    try {
      data = await request.json();
    } catch (error) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400 }
      );
    }
    
    // Basic validation
    const { title, description, price, deliveryDays, category } = data;
    if (!title?.trim() || !description?.trim() || price === undefined || deliveryDays === undefined || !category) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    const priceValue = typeof price === 'string' ? parseFloat(price) : price;
    const deliveryDaysValue = typeof deliveryDays === 'string' ? parseInt(deliveryDays, 10) : deliveryDays;

    if (isNaN(priceValue) || priceValue <= 0) {
      return new NextResponse(
        JSON.stringify({ error: 'Price must be a positive number' }),
        { status: 400 }
      );
    }

    if (isNaN(deliveryDaysValue) || deliveryDaysValue <= 0) {
      return new NextResponse(
        JSON.stringify({ error: 'Delivery days must be a positive number' }),
        { status: 400 }
      );
    }

    const newService: Service = {
      id: Date.now().toString(),
      fid: session.user.fid,
      title: title.trim(),
      description: description.trim(),
      price: priceValue,
      currency: data.currency || 'USDC',
      deliveryDays: deliveryDaysValue,
      category: category.trim(),
      tags: Array.isArray(data.tags) ? data.tags : [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In a real app, save to database here
    services.push(newService);
    console.log('Created service:', newService);

    return NextResponse.json(newService, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET() {
  try {
    // In a real app, fetch from database with pagination, filtering, etc.
    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return NextResponse.json(services);
}
