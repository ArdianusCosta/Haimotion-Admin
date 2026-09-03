import { getProjects } from './app/actions/projects'

async function run() {
  const res = await getProjects()
  console.log('Success:', res.success)
  console.log('Projects count:', res.data?.length)
}
run()
