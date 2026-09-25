export type User = {
  id: number
  firstname: string
  lastname: string
  email: string
  notification_email: string | null
  role_id: number | null
  role: { id: number, name: string } | null
  avatar: string
  date_created: string
  nik: string | null
  address: string | null
  status: string
}

export type Role = {
  id: number
  name: string
}
