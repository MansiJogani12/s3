const fs = require('fs');
const path = require('path');

const files = [
  'supervisionController.js',
  'qaController.js',
  'integrationController.js',
  'evaluationController.js',
  'collaborationController.js',
  'calendarController.js'
];

const helperStr = `// Helper to get active project ID for logged in user
const getStudentProjectId = async (user) => {
  const membership = await GroupMember.findOne({
    userId: user._id,
    status: 'ACCEPTED',
  });
  if (!membership) return null;

  const project = await Project.findOne({ groupId: membership.groupId });
  return project ? project._id : null;
};`;

const importStr = `import { resolveAndVerifyProjectId } from '../utils/projectAccess.js';`;

for (const file of files) {
  const filePath = path.join('c:\\Users\\VICTUS\\Downloads\\new twi\\backend\\src\\controllers', file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace helper definition
  if (content.includes(helperStr)) {
     content = content.replace(helperStr, importStr);
  }

  // Replace usages
  content = content.replace(/const\s+projectId\s*=\s*req\.query\.projectId\s*\|\|\s*\(await\s+getStudentProjectId\(req\.user\)\);/g, 'const projectId = await resolveAndVerifyProjectId(req);');
  content = content.replace(/await\s+getStudentProjectId\(user\)/g, 'await resolveAndVerifyProjectId(req)');
  content = content.replace(/await\s+getStudentProjectId\(req\.user\)/g, 'await resolveAndVerifyProjectId(req)');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
}
