# 🚗 Real-Time Ride Dispatch & Live Tracking System
### Uber-Inspired | ETA-Based Matching | GeoHashing | WebSockets + gRPC

<p align="center">
  <img src="docs/preview-banner.png" alt="Project Preview" width="100%" />
</p>

<p align="center">
  <b>A foundation-level, scalable ride-hailing backend + mobile-first frontend</b><br/>
  Built to demonstrate real-time systems, intelligent matching, and production-grade architecture.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-success"/>
  <img src="https://img.shields.io/badge/Architecture-Event%20Driven-blue"/>
  <img src="https://img.shields.io/badge/Realtime-WebSockets-orange"/>
  <img src="https://img.shields.io/badge/Matching-ETA%20Based-purple"/>
</p>

---

## ✨ Preview

> 🚗 **Live car emoji tracking**  
> 📍 **Per-second GPS updates**  
> 🧠 **ETA-based intelligent driver assignment**  
> 🗺️ **Map-based mobile UI**  
> 💳 **Cash, PayPal & UPI payments**

<p align="center">
  <img src="docs/live-tracking.gif" alt="Live Tracking Preview" width="80%" />
</p>

---

## 📌 What This Project Is

This project is a **foundation-grade real-time ride dispatch system**, inspired by platforms like Uber.

Unlike simple demos, this system focuses on:

- **Correct decision-making (ETA > distance)**
- **Scalability using spatial indexing**
- **Real-time streaming architecture**
- **Extensibility for ML, analytics, and surge pricing**

It is designed to be **interview-ready** for:
- System Design rounds  
- Backend / Production Engineering roles  
- Real-time & distributed systems discussions  

---

## 🧠 Core Intelligence: ETA-Based Matching

Drivers are **not selected by nearest distance**.

### Matching Logic
For each driver `xᵢ` and client `y`:

**Idle Driver**
