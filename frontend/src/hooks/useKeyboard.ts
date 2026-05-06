import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function useKeyboardShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    let gPressed = false
    let gTimer: ReturnType<typeof setTimeout>

    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.target instanceof HTMLTextAreaElement) return

      if (e.key === 'g' || e.key === 'G') {
        gPressed = true
        clearTimeout(gTimer)
        gTimer = setTimeout(() => { gPressed = false }, 1000)
        return
      }

      if (gPressed) {
        gPressed = false
        clearTimeout(gTimer)
        switch (e.key) {
          case 'd': navigate('/dashboard'); break
          case 't': navigate('/timeline'); break
          case 'q': navigate('/queries'); break
          case 'b': navigate('/tablets'); break
          case 's': navigate('/simulator'); break
          case 'r': navigate('/reports'); break
          case 'i': navigate('/import'); break
          case 'h': navigate('/'); break
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])
}
