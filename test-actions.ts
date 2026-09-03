import { getProjects } from './app/actions/projects'

async function run() {
  const res = await getProjects()
  console.log(JSON.stringify(res, null, 2))
}
run()
