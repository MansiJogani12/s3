import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/teamsync').then(async () => {
  const db = mongoose.connection.db;
  const admin = await db.collection('users').findOne({ email: 'admin@teamsync.edu' });
  console.log('Admin user:', admin);
  process.exit(0);
});
