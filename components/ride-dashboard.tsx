"use client"

import * as React from "react"
import { Car, MapPin, Navigation, CreditCard, Banknote, Landmark, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useSocket, type DriverLocation } from "@/hooks/use-socket"

export function RideDashboard() {
  const [status, setStatus] = React.useState<"idle" | "searching" | "on-ride" | "completed">("idle")
  const [city, setCity] = React.useState("San Francisco")
  const [paymentOpen, setPaymentOpen] = React.useState(false)
  const [selectedMethod, setSelectedMethod] = React.useState("cash")
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [currentBooking, setCurrentBooking] = React.useState<{ id: number; amount: number } | null>(null)
  const [assignedDriver, setAssignedDriver] = React.useState<{
    id: number
    name: string
    etaSeconds: number
    latitude: number
    longitude: number
  } | null>(null)
  const [driverPosition, setDriverPosition] = React.useState<{ lat: number; lng: number } | null>(null)
  const [pickupLocation] = React.useState({ lat: 37.7749, lng: -122.4194 })
  const { toast } = useToast()
  const { connected, subscribeToDriverLocation, unsubscribeFromDriverLocation } = useSocket()

  React.useEffect(() => {
    if (assignedDriver && connected) {
      subscribeToDriverLocation(assignedDriver.id, (location: DriverLocation) => {
        setDriverPosition({ lat: location.latitude, lng: location.longitude })
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          pickupLocation.lat,
          pickupLocation.lng,
        )
        const etaMinutes = Math.ceil(distance * 1.5)
        setAssignedDriver((prev) => (prev ? { ...prev, etaSeconds: etaMinutes * 60 } : null))
      })
    }

    return () => {
      if (assignedDriver) {
        unsubscribeFromDriverLocation(assignedDriver.id)
      }
    }
  }, [assignedDriver, connected, subscribeToDriverLocation, unsubscribeFromDriverLocation, pickupLocation])

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const handleRequestRide = async () => {
    setStatus("searching")
    const mockBookingId = Math.floor(Math.random() * 10000)

    try {
      const response = await fetch("/api/driver/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          city,
          pickupLat: pickupLocation.lat,
          pickupLon: pickupLocation.lng,
          bookingId: mockBookingId,
        }),
      })

      const result = await response.json()

      if (response.ok && result.driverId) {
        const mockAmount = Number.parseFloat((15 + Math.random() * 30).toFixed(2))
        setCurrentBooking({ id: mockBookingId, amount: mockAmount })
        setAssignedDriver({
          id: result.driverId,
          name: result.driverName,
          etaSeconds: result.etaSeconds,
          latitude: result.driverLatitude,
          longitude: result.driverLongitude,
        })
        setDriverPosition({ lat: result.driverLatitude, lng: result.driverLongitude })
        setStatus("on-ride")

        toast({
          title: "Driver Found!",
          description: `${result.driverName} is ${Math.ceil(result.etaSeconds / 60)} mins away${result.surgeMultiplier > 1 ? ` (${result.surgeMultiplier}x surge)` : ""}`,
        })
      } else {
        throw new Error(result.error || "No drivers available")
      }
    } catch (error) {
      toast({
        title: "No Drivers Available",
        description: "Please try again in a moment.",
        variant: "destructive",
      })
      setStatus("idle")
    }
  }

  const handleCompleteRide = () => {
    setStatus("completed")
    setPaymentOpen(true)
    if (assignedDriver) {
      unsubscribeFromDriverLocation(assignedDriver.id)
    }
  }

  const handlePayment = async () => {
    if (!currentBooking) {
      toast({
        title: "Error",
        description: "No active booking found.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch("/api/payment/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: currentBooking.id,
          userId: 1001,
          amount: currentBooking.amount,
          method: selectedMethod.toUpperCase(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Payment Successful",
          description:
            selectedMethod === "cash"
              ? "Cash payment confirmed. Thank you!"
              : `Payment ${result.status.toLowerCase()} via ${selectedMethod.toUpperCase()}. Transaction ID: ${result.transactionId}`,
        })

        setPaymentOpen(false)
        setStatus("idle")
        setCurrentBooking(null)
        setAssignedDriver(null)
        setDriverPosition(null)
      } else {
        throw new Error(result.message || "Payment failed")
      }
    } catch (error) {
      console.error("[v0] Payment error:", error)
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Unable to process payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative bg-slate-50 overflow-hidden">
      {/* Map Placeholder */}
      <div className="flex-1 bg-slate-200 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <Navigation className="w-32 h-32 rotate-45" />
        </div>

        <div className="absolute top-4 left-4 z-20">
          <div className="bg-black text-white px-4 py-2 rounded-lg font-bold text-xl shadow-lg">UBER</div>
        </div>

        <div className="absolute top-4 left-24 right-4 z-10">
          <Card className="shadow-lg border-none">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <div className="flex-1 text-sm font-medium">Your Current Location</div>
              {connected && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
            </CardContent>
          </Card>
        </div>

        {status === "on-ride" && driverPosition && (
          <div
            className="absolute z-10 text-4xl transition-all duration-1000 ease-linear"
            style={{
              top: `${((pickupLocation.lat - driverPosition.lat) / 0.1) * 40 + 50}%`,
              left: `${((driverPosition.lng - pickupLocation.lng) / 0.1) * 40 + 50}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            🚗
          </div>
        )}

        {status === "on-ride" && assignedDriver && (
          <div className="absolute bottom-4 left-4 right-4 z-10 animate-in fade-in slide-in-from-bottom-4">
            <Card className="bg-primary text-primary-foreground shadow-xl border-none">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-full">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs opacity-80 font-medium uppercase tracking-wider">{assignedDriver.name}</p>
                    <p className="font-bold">{Math.ceil(assignedDriver.etaSeconds / 60)} mins away</p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={handleCompleteRide}>
                  End Ride
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Bottom Action Sheet (Simplified for Idle/Searching) */}
      <div className="bg-white p-6 rounded-t-3xl shadow-2xl z-20">
        {status === "idle" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Where to?</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-xl">
                <MapPin className="text-primary w-5 h-5" />
                <input
                  placeholder="Enter destination"
                  className="bg-transparent border-none focus:ring-0 text-sm w-full"
                />
              </div>
            </div>
            <Button className="w-full py-6 text-lg font-bold rounded-xl" onClick={handleRequestRide}>
              Request Ride
            </Button>
          </div>
        )}

        {status === "searching" && (
          <div className="text-center py-8 space-y-4">
            <div className="relative mx-auto w-16 h-16">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="text-lg font-medium text-slate-600">Finding best driver by ETA...</p>
          </div>
        )}
      </div>

      {/* Payment Drawer */}
      <Drawer open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DrawerContent className="max-w-md mx-auto">
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle className="text-2xl font-bold text-center">
                Final Amount: ${currentBooking?.amount.toFixed(2) || "0.00"}
              </DrawerTitle>
            </DrawerHeader>
            <div className="p-4 space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="font-medium text-sm">Ride Completed</span>
                </div>
                <Badge variant="outline">2.4 miles</Badge>
              </div>

              <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod} className="space-y-3">
                <div className="flex items-center space-x-3 p-4 border rounded-xl hover:bg-slate-50 transition-colors">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex flex-1 items-center gap-3 cursor-pointer">
                    <Banknote className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold">Cash</p>
                      <p className="text-xs text-muted-foreground">Pay directly to driver</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-xl hover:bg-slate-50 transition-colors">
                  <RadioGroupItem value="paypal" id="paypal" />
                  <Label htmlFor="paypal" className="flex flex-1 items-center gap-3 cursor-pointer">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold">PayPal</p>
                      <p className="text-xs text-muted-foreground">Safe online payment</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-xl hover:bg-slate-50 transition-colors">
                  <RadioGroupItem value="upi" id="upi" />
                  <Label htmlFor="upi" className="flex flex-1 items-center gap-3 cursor-pointer">
                    <Landmark className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-semibold">UPI</p>
                      <p className="text-xs text-muted-foreground">Instant bank transfer</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              <Button
                className="w-full py-6 text-lg font-bold rounded-xl"
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing
                  ? "Processing..."
                  : selectedMethod === "cash"
                    ? "Confirm Payment"
                    : `Pay with ${selectedMethod.toUpperCase()}`}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
