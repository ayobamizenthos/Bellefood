import { Loader2 } from 'lucide-react'

export function PageSpinner() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <Loader2 className="h-7 w-7 animate-spin text-brand" />
    </div>
  )
}
