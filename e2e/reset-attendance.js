const { MongoClient } = require('mongodb');
async function reset() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bharatsales';
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  await db.collection('attendancesessions').deleteMany({});
  await client.close();
}
reset().catch(console.error);
