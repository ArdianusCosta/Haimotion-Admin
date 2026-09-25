export type FileItem = {
  id: string
  dbId: number
  name: string
  type: string
  size: string
  kind: string // 'folder', 'image', 'sheet', 'pdf', 'video', 'file'
  isStarred?: boolean
  updatedAt: string
  fileData?: any
  permission: string
  sharedBy?: string
  shares: any[]
}

export type ActionItem = {
  id: string
  dbId: number
  name: string
  kind: string
}
