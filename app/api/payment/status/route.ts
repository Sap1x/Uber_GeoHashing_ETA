import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId, status } = body

    // Forward to Java Spring Boot backend
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8080"
    const response = await fetch(`${backendUrl}/api/payment/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bookingId,
        status,
      }),
    })

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Payment status API error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Status update failed",
      },
      { status: 500 },
    )
  }
}
