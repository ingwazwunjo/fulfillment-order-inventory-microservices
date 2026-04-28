const express = require('express');
const { Kafka } = require('kafkajs');

const app = express();

/* ===== Mock Stock ===== */
const stock = {
  1: 10,
  2: 0
};

/* ===== Kafka ===== */
const kafka = new Kafka({
  clientId: 'inventory-service',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'inventory-group' });
const producer = kafka.producer();

const run = async () => {
  await consumer.connect();
  console.log('✅ Inventory Consumer connected');

  await producer.connect();
  console.log('✅ Inventory Producer connected');

  await consumer.subscribe({ topic: 'order-events', fromBeginning: true });
  console.log('📡 Waiting for order-events...');

  await consumer.run({
    eachMessage: async ({ message }) => {
      const data = JSON.parse(message.value.toString());
      console.log('📦 Received order-event:', data);

      const { productId, quantity } = data;

      let status = 'REJECTED';
      if ((stock[productId] || 0) > 0) {
        status = 'CONFIRMED';
        console.log('✅ IN STOCK');
      } else {
        console.log('❌ OUT OF STOCK');
      }

      // 🔥 ส่งผลกลับไป Kafka
      await producer.send({
        topic: 'order-results',
        messages: [
          {
            value: JSON.stringify({
              productId,
              quantity,
              status
            })
          }
        ]
      });

      console.log('📤 Sent result:', { productId, quantity, status });
    }
  });
};

const start = async () => {
  try {
    await run();
    app.listen(3001, () => {
      console.log('🚀 Inventory Service running on port 3001');
    });
  } catch (err) {
    console.error('❌ Inventory start error:', err);
  }
};

start();