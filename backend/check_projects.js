import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/teamsync').then(async () => {
  const db = mongoose.connection.db;
  const projects = await db.collection('projects').find({}).toArray();
  console.log('Projects:', projects.map(p => ({ id: p._id, groupId: p.groupId })));
  
  const releases = await db.collection('releases').find({}).toArray();
  console.log('Releases:', releases.map(r => ({ id: r._id, title: r.title, projectId: r.projectId })));
  
  process.exit(0);
});
