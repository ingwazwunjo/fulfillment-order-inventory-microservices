# 🚀 Fulfillment Order & Inventory Microservices

A microservices-based system designed to handle order processing and inventory management for a fulfillment system.

---

## 🧠 Overview

This project demonstrates how to design and implement a scalable backend system using **Microservices Architecture**.

The system separates core functionalities into independent services and uses an **API Gateway** to manage routing and communication.

---

## 🏗 Architecture

- API Gateway → Handles all incoming requests
- Order Service → Manages order creation and retrieval
- Inventory Service → Handles stock checking and updates

---

## ⚙️ Tech Stack

- Node.js
- Express.js
- REST API
- Docker (optional)

---

## 🔗 Services

### 📦 API Gateway
- Routes requests to appropriate services

### 🛒 Order Service
- Create order
- Get order details

### 📊 Inventory Service
- Check product stock
- Update stock after order

---

## ▶️ How to Run

```bash
git clone https://github.com/your-username/fulfillment-order-inventory-microservices.git
cd fulfillment-order-inventory-microservices
docker-compose up
