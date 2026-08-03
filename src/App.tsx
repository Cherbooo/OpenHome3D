import SceneRoot from './three/SceneRoot'
import AppUI from './ui/AppUI'

export default function App() {
  return (
    <div className="app">
      <AppUI />
      <div className="app-canvas">
        <SceneRoot />
      </div>
    </div>
  )
}
