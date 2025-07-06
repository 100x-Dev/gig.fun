import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    accountAssociation: {
      header: "eyJmaWQiOjEwMDgzNzgsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgxNDQwNEIxODlBMDQyNmJjN2NkMjg5NkYzODNiRDIwQTNiMzUwZDI2In0",
      payload: "eyJkb21haW4iOiJnaWdzZnVuLnZlcmNlbC5hcHAifQ",
      signature: "MHg1NjVhYzc2YzgzMjc4ZTMzMDA0M2U3MzA4ZDUyN2Y2NGYyZDk0NTZjNTEzNzhiM2ExYWM0ODBlNjc0ZmQ0YWY2MGJhMWFmYWZkMzIwNWYzN2YxOWQxZjg3YmFhNTVhN2ZhZjVhNjc0NWM4ZjZiM2NiYThmOGIwMGFlOGFhMzdmYzFj"
    }
  });
}
