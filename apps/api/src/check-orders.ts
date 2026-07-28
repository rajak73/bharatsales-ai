import mongoose from 'mongoose';

async function run() {
  await mongoose.connect('mongodb://localhost:27017/bharatsales');
  const db = mongoose.connection.db;
  if (!db) return;
  const orders = await db.collection('orders').find({}).toArray();
  console.log(JSON.stringify(orders, null, 2));
  await mongoose.disconnect();
}
run();
