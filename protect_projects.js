const fs = require('fs');
const file = 'app/actions/projects.ts';
let content = fs.readFileSync(file, 'utf8');

// Add imports
if (!content.includes('requireAuth')) {
  content = content.replace(
    "import prisma from '@/lib/prisma'",
    "import prisma from '@/lib/prisma'\nimport { requireAuth, requirePermission, canAccessProject } from '@/lib/auth/authorization'"
  );
}

const funcsToProtectWithID = [
  { name: 'getProjectById', level: 'viewer' },
  { name: 'updateProject', level: 'editor' },
  { name: 'deleteProject', level: 'manager' },
  { name: 'updateProjectStatus', level: 'editor' },
  { name: 'toggleFavoriteProject', level: 'viewer' },
  { name: 'archiveProject', level: 'manager' },
  { name: 'duplicateProject', level: 'viewer' }, // assuming viewer can duplicate? maybe editor
  { name: 'exportProjectData', level: 'viewer' },
  { name: 'updateProjectMembers', level: 'manager' }
];

// Add auth to getProjects
content = content.replace(
  'export async function getProjects() {\n  try {',
  'export async function getProjects() {\n  try {\n    const user = await requireAuth();\n    requirePermission(user, "projects.view");'
);

// Add auth to createProject
content = content.replace(
  'export async function createProject(data: {',
  'export async function createProject(data: {\n  name: string'
).replace(
  'client_name?: string\n}) {\n  try {',
  'client_name?: string\n}) {\n  try {\n    const user = await requireAuth();\n    requirePermission(user, "projects.create");'
);

for (const f of funcsToProtectWithID) {
  const regex = new RegExp(`export async function ${f.name}\\([^\\)]*id: number[^\\)]*\\) {\\s*try {`);
  const match = content.match(regex);
  if (match) {
    const replacement = `${match[0]}\n    const user = await requireAuth();\n    const hasAccess = await canAccessProject(user, id, '${f.level}');\n    if (!hasAccess) return { success: false, error: 'Unauthorized' };`;
    content = content.replace(match[0], replacement);
  }
}

fs.writeFileSync(file, content);
console.log('projects.ts protected');
