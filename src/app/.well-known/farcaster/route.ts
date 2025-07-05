import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    accountAssociation: {
      header: "eyJmaWQiOjEwMDgzNzgsInR5cGUiOiJhdXRoIiwia2V5IjoiMHhiODVCM2JiQjkzRmZENUE4YzIwQmU0MURkQ0VFQWYxNGMyZWMzNjYyIn0",
      payload: "eyJkb21haW4iOiJnaWdzZnVuLnZlcmNlbC5hcHAifQ",
      signature: "m8nvW+sqLwbjFGVYPgSH/b55d2Lq/r+HxD9F6y9ZSToBrLaW2QMOGINz1N7I6NMBoELE8/hBafZg3NqAzD1IcBw="
    }
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    }
  });
}
