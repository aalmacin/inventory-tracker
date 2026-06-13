import './App.css'
import { app } from "./lib/firebase"

function App() {
  console.log('Firebase project:', app.options.projectId);

  return (
    <div>
      <h1>Inventory Tracker</h1>
      <p>Stock at a glance</p>
    </div>
  )
}

export default App
