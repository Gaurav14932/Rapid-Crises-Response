# CrisisLink AI 🚨
## AI Powered Rapid Crisis Response Platform

CrisisLink AI is an intelligent emergency response system designed to reduce rescue time during emergencies such as road accidents, fire incidents, floods, crimes, women safety alerts, medical emergencies, and natural disasters.

The platform uses **Artificial Intelligence, Real-Time Tracking, Smart Dispatching, GPS Mapping, Cloud Infrastructure, and Emergency Communication Systems** to connect citizens with the nearest responders instantly.

> **Every second matters in emergencies. CrisisLink AI is built to save lives through technology.**

---

# 📌 Table of Contents

- About Project
- Problem Statement
- Solution Overview
- How the System Works
- Features
- Architecture
- Tech Stack
- Modules
- Database Design
- APIs Used
- Installation
- Running the Project
- Project Flow
- Screenshots
- Future Scope
- Team Contribution
- License

---

# 🧩 Problem Statement

## Rapid Crisis Response

Traditional emergency systems often suffer from:

- Delayed response times
- Manual call handling
- Poor coordination
- No real-time visibility
- Wrong responder allocation
- Lack of tracking

This causes loss of life, property damage, and chaos.

---

# 💡 Our Solution

CrisisLink AI automates emergency response using:

✅ One Tap SOS Reporting  
✅ AI Emergency Classification  
✅ Nearest Responder Allocation  
✅ Smart Route Navigation  
✅ Live Tracking Dashboard  
✅ Emergency Communication Alerts

---

# 🌍 Real Life Use Cases

- Road Accidents
- Heart Attack / Medical Crisis
- Fire Outbreaks
- Women Safety Panic Alerts
- Flood Rescue Requests
- Crime Reporting
- Earthquake / Disaster Response
- Missing Person Search

---

# ⚙ How the System Works

## Step 1: User Reports Emergency

Citizen opens mobile/web app and presses **SOS Button**.

The system collects:

- GPS Location
- Emergency Type
- Time
- Optional Photo / Video / Voice

---

## Step 2: AI Engine Processes Request

The AI module performs:

- Detect crisis type
- Predict severity level (1–5)
- Analyze distress text
- Detect fire/smoke from image (optional)

---

## Step 3: GIS Engine Finds Nearest Help

Using Maps + GPS:

- Finds nearest ambulance
- Finds nearest police unit
- Finds nearest fire truck
- Calculates fastest route

---

## Step 4: Dispatch Engine Sends Alerts

Automatically sends:

- Push Notifications
- SMS Alerts
- Admin Dashboard Alert
- Responder App Alert

---

## Step 5: Live Tracking Starts

User and admin can track:

- Team location
- Estimated arrival time
- Current status

---

## Step 6: Case Closed

Once resolved:

- Case marked completed
- Response time stored
- Analytics updated

---

# 🚀 Main Features

# 👤 Citizen Module

- One Tap SOS Button
- Live GPS Tracking
- Upload Evidence
- Emergency Chatbot
- View Response ETA
- Safety Tips

# 🚑 Responder Module

- Accept Emergency Case
- Get Route Navigation
- Update Case Status
- Mark Case Resolved

# 🖥 Admin Dashboard

- Live City Map
- Active Cases Queue
- Resource Management
- Analytics Reports
- Emergency Severity Monitoring

# 🧠 AI Features

- Severity Prediction
- Emergency Classification
- NLP Distress Detection
- Fire Detection
- Smart Priority Queue

---

# 🏗 System Architecture

```text
Citizen App / Website
        ↓
 Emergency API Gateway
        ↓
------------------------------------
| Backend Server (Node.js)         |
------------------------------------
   ↓          ↓            ↓
AI Engine   GIS Engine   Dispatch Engine
   ↓          ↓            ↓
------------------------------------
| Database + Firebase + Dashboard |
------------------------------------
        ↓
