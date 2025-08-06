# IoT-Enabled Smart Locker System

This project implements a complete end-to-end smart locker platform, comprising:

- **ESP32 firmware** (Arduino/C++) that drives a servo lock, reads a keypad & LCD, and beeps a buzzer  
- **Flask backend** with SQLite persistence, CORS, and REST endpoints to register lockers, generate/verify OTPs, and record open/close status & activities  
- **React frontend** (Vite + TypeScript) that lists lockers, shows their status & current OTP, and lets couriers or admins generate new OTPs and remotely open/close lockers  

---

## Features

- **Locker registration** via `POST /api/lockers/`  
- **OTP lifecycle**  
  - Generate new OTP: `POST /api/lockers/<id>/otp`  
  - Fetch current OTP:   `GET  /api/lockers/<id>/otp`  
  - Verify user-entered OTP: `POST /api/lockers/<id>/verify-otp`  
- **Status reporting**  
  - Read status:      `GET  /api/lockers/<id>/status`  
  - Update status:    `POST /api/lockers/<id>/status`  
- **Activity logging**: `POST /api/lockers/<id>/activity`  
- **Frontend dashboard**: lists all lockers, shows status, OTP, last activity; supports “Generate OTP” and “Open/Close” actions  
- **ESP32 firmware**:  
  - On boot, fetches & prints OTP to Serial, displays on LCD  
  - Allows on-keypad new-OTP fetch (`A`), OTP entry (`0–9` + `#`) with timeout/clear (`*`)  
  - Verifies via `/verify-otp`, drives servo & buzzer, reports open/closed via `/status`  

---

## Prerequisites

- **Hardware**: ESP32 + servo + 4×4 keypad + I²C LCD + buzzer  
- **Software**:  
  - Python 3.8+ & pip  
  - Node.js & npm 
  - Arduino IDE / PlatformIO for ESP32  
  - SQLite (for local dev) or PostgreSQL in production  

---

## Backend Setup

1. **Install dependencies**  
   ```bash
   pip install flask flask-sqlalchemy flask-cors
