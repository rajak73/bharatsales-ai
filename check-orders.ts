import { MongoClient } from 'mongodb';

async function run() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('bharatsales');
  const orders = await db.collection('orders').find({}).toArray();
  console.log(JSON.stringify(orders, null, 2));
  await client.close();
}
run();
