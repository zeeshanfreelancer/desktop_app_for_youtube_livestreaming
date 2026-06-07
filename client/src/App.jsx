import { AppProvider } from './context/AppContext'
import LeftPanel from './components/layout/LeftPanel'
import RightPanel from './components/layout/RightPanel'
import PreviewCanvas from './components/preview/PreviewCanvas'

export default function App() {
  return (
    <AppProvider>
      <div className="flex h-full">
        <LeftPanel />
        <PreviewCanvas />
        <RightPanel />
      </div>
    </AppProvider>
  )
}
