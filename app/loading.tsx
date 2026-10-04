export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-[500px] w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-sm" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Memuat halaman...</p>
      </div>
    </div>
  )
}
