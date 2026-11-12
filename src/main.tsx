import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { mayCleanUpImages } from '@/lib/plan-storage'
import { getBrowserStorage } from '@/lib/ui-prefs'
import { referencedImageIds } from '@/lib/underlay'
import { removeUnusedImages } from '@/storage/image-cache'
import { useAppStore } from '@/store/app-store'
import { startPlanAutosave } from '@/store/plan-autosave'

// Images replaced or removed in an earlier session go now, never during a session (undo may need them).
const { loadOutcome, plan } = useAppStore.getState()
if (mayCleanUpImages(loadOutcome)) void removeUnusedImages(referencedImageIds(plan))

const autosave = startPlanAutosave(useAppStore, getBrowserStorage())
// `pagehide` instead of `beforeunload`: fires more reliably and keeps the back-forward cache usable.
window.addEventListener('pagehide', autosave.flush)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') autosave.flush()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
