import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/design-system.css' // generated design system (visual layer)
import { Provider } from 'react-redux'
import { store } from './app/store'
import { AuthProvider } from './features/auth/AuthProvider'
import { FirestoreSync } from './app/FirestoreSync'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <FirestoreSync />
        <RouterProvider router={router} />
      </AuthProvider>
    </Provider>
  </StrictMode>,
)
