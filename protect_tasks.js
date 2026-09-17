const fs = require('fs');
const file = 'app/actions/tasks.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('requireAuth')) {
  content = content.replace(
    "import { revalidatePath } from 'next/cache'",
    "import { revalidatePath } from 'next/cache'\nimport { requireAuth, requirePermission, canAccessTask } from '@/lib/auth/authorization'"
  );
}

// protect getTasksData
content = content.replace(
  'export async function getTasksData() {\n  try {',
  'export async function getTasksData() {\n  try {\n    const user = await requireAuth();\n    requirePermission(user, "tasks.view");'
);

// protect createTask
content = content.replace(
  'export async function createTask(data: { title: string',
  'export async function createTask(data: { title: string'
).replace(
  'projectId: number, dueDate?: string }) {\n  try {',
  'projectId: number, dueDate?: string }) {\n  try {\n    const user = await requireAuth();\n    requirePermission(user, "tasks.create");'
);

// protect updateTask
const updateRegex = /export async function updateTask\(id: number, data: \{[^\}]+\}\) \{\s*try \{/;
const updateMatch = content.match(updateRegex);
if (updateMatch) {
  content = content.replace(updateMatch[0], `${updateMatch[0]}\n    const user = await requireAuth();\n    const hasAccess = await canAccessTask(user, id, 'editor');\n    if (!hasAccess) return { success: false, error: 'Unauthorized' };`);
}

// protect deleteTask
const deleteRegex = /export async function deleteTask\(id: number\) \{\s*try \{/;
const deleteMatch = content.match(deleteRegex);
if (deleteMatch) {
  content = content.replace(deleteMatch[0], `${deleteMatch[0]}\n    const user = await requireAuth();\n    const hasAccess = await canAccessTask(user, id, 'manager');\n    if (!hasAccess) return { success: false, error: 'Unauthorized' };`);
}

fs.writeFileSync(file, content);
console.log('tasks.ts protected');
