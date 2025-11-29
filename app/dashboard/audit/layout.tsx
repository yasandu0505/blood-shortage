import { Toaster } from '@/components/ui/toaster'

export default function AuditLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <Toaster />
    </>
  )
}

