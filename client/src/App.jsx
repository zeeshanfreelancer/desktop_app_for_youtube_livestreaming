import { AppProvider } from './context/AppContext'
import ErrorBoundary from './components/ErrorBoundary'
import LeftPanel from './components/layout/LeftPanel'
import RightPanel from './components/layout/RightPanel'
import PreviewCanvas from './components/preview/PreviewCanvas'

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <div className="flex h-full min-h-0">
          <LeftPanel />
          <PreviewCanvas />
          <RightPanel />
        </div>
      </AppProvider>
    </ErrorBoundary>
  )
}
