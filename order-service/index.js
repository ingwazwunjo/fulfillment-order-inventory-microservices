const express = require('express');
const mysql = require('mysql2');
const { Kafka } = require('kafkajs');

const app = express();
app.use(express.json());

/* =======================
   MySQL Connection
======================= */
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // ใส่ password ของคุณ
    database: 'orders_db'
});

db.connect((err) => {
    if (err) {
        console.error('❌ MySQL connection error:', err);
    } else {
        console.log('✅ Connected to MySQL');
    }
});

/* =======================
   Kafka Producer
======================= */
const kafka = new Kafka({
    clientId: 'order-service',
    brokers: ['localhost:9092']
});

const producer = kafka.producer();

/* =======================
   API: Create Order
======================= */
app.post('/orders', async (req, res) => {
    const { productId, quantity } = req.body;

    try {
        // 🔥 1. ส่ง event ไป Kafka
        await producer.send({
            topic: 'order-events',
            messages: [
                {
                    value: JSON.stringify({
                        productId,
                        quantity
                    })
                }
            ]
        });

        console.log('📤 Event sent to Kafka:', { productId, quantity });

        // 🔥 2. save ลง database (status = PENDING)
        const sql = `
            INSERT INTO orders (product_id, quantity, status)
            VALUES (?, ?, ?)
        `;

        db.query(sql, [productId, quantity, 'PENDING'], (err) => {
            if (err) {
                console.error('❌ DB error:', err);
                return res.status(500).json({ message: 'DB error' });
            }

            res.json({
                message: 'Order created (event sent)',
                status: 'PENDING'
            });
        });

    } catch (err) {
        console.error('❌ Kafka error:', err);
        res.status(500).json({ message: 'Kafka error' });
    }
});

/* =======================
   Start Server
======================= */
const consumer = kafka.consumer({ groupId: 'order-group' });

const runConsumer = async () => {
  await consumer.connect();
  console.log('✅ Order Consumer connected');

  await consumer.subscribe({
    topic: 'order-results',
    fromBeginning: true
  });

  console.log('📡 Waiting for order-results...');

  await consumer.run({
    eachMessage: async ({ message }) => {
      const data = JSON.parse(message.value.toString());
      console.log('📥 Received result:', data);

      const { productId, quantity, status } = data;

      // 🔥 update DB (อัปเดตรายการล่าสุดที่ตรงกัน)
      const sql = `
        UPDATE orders 
        SET status = ?
        WHERE product_id = ? AND quantity = ?
        ORDER BY id DESC
        LIMIT 1
      `;

      db.query(sql, [status, productId, quantity], (err) => {
        if (err) {
          console.error('❌ Update error:', err);
        } else {
          console.log('✅ Order updated to:', status);
        }
      });
    }
  });
};

const start = async () => {
  try {
    await producer.connect();
    console.log('✅ Kafka Producer connected');

    await runConsumer(); // 👈 สำคัญ

    app.listen(3000, () => {
      console.log('🚀 Order Service running on port 3000');
    });

  } catch (err) {
    console.error('❌ Start error:', err);
  }
};

start();

