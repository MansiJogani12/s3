import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Project from './src/models/Project.js';
import GithubIntegration from './src/models/GithubIntegration.js';
import GroupMember from './src/models/GroupMember.js';

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const userId = '6a953db6a91df97deb8cede1'; // 24IT001
  const membership = await GroupMember.findOne({ userId, status: 'ACCEPTED' });
  if (!membership) {
    console.log('No membership');
    return process.exit();
  }
  const project = await Project.findOne({ groupId: membership.groupId });
  if (!project) {
    console.log('No project');
    return process.exit();
  }
  
  const projectId = project._id;
  let integration = await GithubIntegration.findOne({ projectId });
  if (!integration) {
    try {
      const repoName = project.projectKey ? `teamsync-${project.projectKey.toLowerCase()}-portal` : 'teamsync-student-project';
      integration = await GithubIntegration.create({
        projectId,
        repoUrl: `https://github.com/teamsync-org/${repoName}`,
        repoName,
        isConnected: true,
      });
      console.log('Created integration:', integration);
    } catch (err) {
      console.error('Error creating integration:', err);
    }
  } else {
    console.log('Found integration:', integration);
  }
  process.exit();
}
test();
