const mongoose = require('mongoose');

async function checkUsers() {
  await mongoose.connect('mongodb://localhost:27017/bharatsales');
  const db = mongoose.connection.db;
  
  const users = await db.collection('users').find({}).toArray();
  console.log(`Found ${users.length} users`);
  for (const u of users) {
    console.log(`- ${u.email} (${u.role})`);
  }
  
  process.exit(0);
}

checkUsers();
