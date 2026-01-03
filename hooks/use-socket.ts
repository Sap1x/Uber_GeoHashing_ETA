"use client"

import { useEffect, useRef, useState } from "react"
import { Client, IMessage } from "@stomp/stompjs"
import SockJS from "sockjs-client"

export interface DriverLocation {
  driverId: number
  latitude: number
  longitude: number
  heading?: number
  timestamp: number
}

export interface DriverMatchResult {
  success: boolean
  driverId: number
  driverName: string
  etaSeconds: number
  driverLatitude: number
  driverLongitude: number
}

export function useSocket(backendUrl: string = "http://localhost:8080") {
  const [connected, setConnected] = useState(false)
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const clientRef = useRef<Client | null>(null)
  const subscriptionsRef = useRef<Map<string, any>>(new Map())

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${backendUrl}/ws-uber`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log("[v0] WebSocket connected")
        setConnected(true)
        setError(null)
      },
      onDisconnect: () => {
        console.log("[v0] WebSocket disconnected")
        setConnected(false)
      },
      onStompError: (frame) => {
        console.error("[v0] STOMP error:", frame)
        setError("Connection error occurred")
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe())
      subscriptionsRef.current.clear()
      client.deactivate()
    }
  }, [backendUrl])

  const subscribeToDriverLocation = (driverId: number, callback: (location: DriverLocation) => void) => {
    if (!clientRef.current?.connected) {
      console.warn("[v0] Cannot subscribe: WebSocket not connected")
      return
    }

    const topic = `/topic/driver-location/${driverId}`
    
    // Unsubscribe from previous driver if any
    subscriptionsRef.current.forEach((sub, key) => {
      if (key.startsWith("/topic/driver-location/")) {
        sub.unsubscribe()
        subscriptionsRef.current.delete(key)
      }
    })

    const subscription = clientRef.current.subscribe(topic, (message: IMessage) => {
      try {
        const location: DriverLocation = JSON.parse(message.body)
        console.log("[v0] Received driver location:", location)
        setDriverLocation(location)
        callback(location)
      } catch (err) {
        console.error("[v0] Error parsing location message:", err)
      }
    })

    subscriptionsRef.current.set(topic, subscription)
    console.log("[v0] Subscribed to driver location:", driverId)
  }

  const unsubscribeFromDriverLocation = (driverId: number) => {
    const topic = `/topic/driver-location/${driverId}`
    const subscription = subscriptionsRef.current.get(topic)
    
    if (subscription) {
      subscription.unsubscribe()
      subscriptionsRef.current.delete(topic)
      console.log("[v0] Unsubscribed from driver location:", driverId)
    }
  }

  const sendDriverLocation = (location: DriverLocation) => {
    if (!clientRef.current?.connected) {
      console.warn("[v0] Cannot send location: WebSocket not connected")
      return
    }

    clientRef.current.publish({
      destination: "/app/driver-location",
      body: JSON.stringify(location),
    })
    console.log("[v0] Sent driver location:", location)
  }

  return {
    connected,
    error,
    driverLocation,
    subscribeToDriverLocation,
    unsubscribeFromDriverLocation,
    sendDriverLocation,
  }
}
