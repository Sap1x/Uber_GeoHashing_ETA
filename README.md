🚗 Real-Time Ride Dispatch & Live Tracking System
Uber-Inspired | ETA-Based Matching | WebSockets + gRPC | GeoHashing
📌 Overview
This project is a foundation-level real-time ride dispatch and tracking system, inspired by large-scale platforms like Uber. It focuses on correctness, scalability, and extensibility, rather than just UI demos.
The system supports:
Live driver tracking (per-second updates)
ETA-based intelligent driver matching
GeoHash-based spatial filtering
Event-driven backend architecture
Cash, PayPal, and UPI payment flows
Mobile-first user experience
This project is designed to be interview-ready for System Design, Backend, and Production Engineering roles, and can be extended into a city-scale dispatch platform.
🎯 Key Goals
Minimize customer wait time using ETA-based matching
Efficiently scale matching from hundreds → tens of thousands of drivers
Separate real-time streaming from command/event processing
Build a system that is observable, debuggable, and extensible
🧠 Core Concepts Implemented
1️⃣ ETA-Based Driver Matching (Not Nearest Distance)
Drivers are not selected by current distance.
For each driver xᵢ and client y:
Idle driver
ETA = travel_time(driver → client)
Driver currently on a ride
ETA = time_to_finish_current_ride
    + travel_time(drop_location → client)
The system assigns:
driver = argmin(ETA)
This mirrors how real ride-hailing platforms optimize user wait time.
2️⃣ GeoHash-Based Spatial Filtering
To scale efficiently, the system uses GeoHashing (precision = 6):
Earth is divided into grid cells (~1 km)
Drivers are indexed by:
city → geohash → drivers
On ride request:
Only drivers in the same + neighboring geohash cells are evaluated
Reduces matching complexity from O(N) to O(k)
GeoHashing is used only for filtering, not final decision-making.
3️⃣ Real-Time Live Tracking
Drivers stream GPS coordinates every second
Updates sent via WebSockets
Client UI animates a 🚗 car marker smoothly on the map
Camera auto-follows the assigned driver
Handles reconnects and temporary disconnects
🧱 Architecture Overview
Frontend
Mobile-first UI
Live map with animated driver tracking
Bottom-sheet based UX
Uber logo displayed on top-left
Real-time updates without page refresh
Backend (Polyglot)
Python (FastAPI)
WebSocket server
Driver location streaming
Real-time state updates
Java (gRPC)
Ride lifecycle management
Driver assignment
Payment orchestration
This separation reflects real-world microservice boundaries.
🔁 Event-Driven Core
The system is built around domain events, such as:
DriverLocationUpdated
RideRequested
DriverAssigned
RideCompleted
PaymentCompleted
Benefits:
Loose coupling
Easier retries and failure handling
Ready for analytics, notifications, and ML integration
💳 Payments Supported
💵 Cash (default, instant completion)
🅿️ PayPal
🇮🇳 UPI
Payments are tied to the ride lifecycle and are idempotent to prevent double charging.
📊 Observability & Reliability
The system includes:
Structured logging (ride_id, driver_id, ETA, events)
Metrics tracking:
Match latency
ETA accuracy (predicted vs actual)
Driver utilization
Cancellation rate
Health and readiness checks
This allows continuous tuning of matching logic.
📂 Project Structure
/frontend
  /app
  /components
  /screens
  /hooks
  /services

/backend
  /python-socket
    /ws
    /models
    /config

  /java-grpc
    /proto
    /services
    /config
🚀 Scalability Characteristics
Feature	Capability
Active drivers	10K–100K per city
Location updates	~100K/sec
Matching latency	< 50 ms
Matching complexity	O(k), k ≪ N
Designed to scale city-by-city using sharding and spatial indexing.
🧠 Why This Project Is a Foundation
This is not a one-off demo. It is designed to grow into:
ML-based ETA prediction
Surge pricing systems
Multi-city / multi-region deployments
Driver incentive optimization
Analytics & replay simulations
The architecture intentionally avoids over-engineering while staying future-ready.
🧪 Future Enhancements
ML-based ETA prediction
Dynamic surge pricing
Driver incentive optimization
Kafka-based event streaming
Multi-region failover
Advanced simulation & replay tools
