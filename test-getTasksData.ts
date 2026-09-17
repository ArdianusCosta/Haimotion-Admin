import { getTasksData } from './app/actions/tasks'

async function run() {
  const data = await getTasksData()
  console.log(JSON.stringify(data.tasks.filter(t => t.id === '1241'), null, 2))
}
run()
