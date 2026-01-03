import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { city, pickupLat, pickupLon, bookingId } = await request.json()

    // Call Java backend driver matching service
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8080"
    const response = await fetch(
      `${backendUrl}/api/driver/match?city=${encodeURIComponent(city)}&pickupLat=${pickupLat}&pickupLon=${pickupLon}&bookingId=${bookingId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "No driver match found" }, { status: 404 })
      }
      throw new Error(`Backend error: ${response.status}`)
    }

    const match = await response.json()
    return NextResponse.json(match)
  } catch (error) {
    console.error("Driver match error:", error)
    return NextResponse.json({ error: "Failed to match driver" }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get spatial index statistics
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8080"
    const response = await fetch(`${backendUrl}/api/driver/stats`)

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`)
    }

    const stats = await response.json()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Failed to fetch stats:", error)
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
  }
}
