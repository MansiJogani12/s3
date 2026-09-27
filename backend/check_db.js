import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/teamsync').then(async () => {
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({ enrollmentNumber: { $in: ['24IT001', '24IT002', '24IT003'] } }).toArray();
  console.log('Users:', users.map(u => ({ id: u._id, en: u.enrollmentNumber })));
  
  const members = await db.collection('groupmembers').find({}).toArray();
  console.log('Members:', members.map(m => ({ userId: m.userId, groupId: m.groupId, status: m.status })));
  
  process.exit(0);
});
