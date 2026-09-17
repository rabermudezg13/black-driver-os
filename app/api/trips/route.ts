import { NextResponse } from "next/server";

const allowedServices = ["Black", "Black SUV", "Premier", "Comfort", "XL", "Private"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { zone, service, fare, tip = 0, miles, waitingMinutes = 0, tripMinutes } = body;

    if (!zone || !allowedServices.includes(service) || fare === undefined || miles === undefined || tripMinutes === undefined) {
      return NextResponse.json({ ok: false, error: "Missing or invalid trip data" }, { status: 400 });
    }

    const trip = {
      zone: String(zone),
      service,
      fare: Number(fare),
      tip: Number(tip),
      miles: Number(miles),
      waitingMinutes: Number(waitingMinutes),
      tripMinutes: Number(tripMinutes),
      timestamp: new Date().toISOString(),
    };

    // Next milestone: persist this object to Firebase Firestore.
    return NextResponse.json({ ok: true, message: "Trip received", trip }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "Black Driver OS Trips API", status: "ready" });
}