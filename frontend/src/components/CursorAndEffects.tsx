import { useRef } from 'react'



export default function CursorAndEffects() {
  const overlayRef = useRef<HTMLDivElement>(null)




  return (
    <>


      {/* Page transition overlay */}
      <div ref={overlayRef} style={{
        position:'fixed', inset:0, zIndex:9999,
        pointerEvents:'none', opacity:0,
      }} />

      {/* Watermark */}
      <div style={{
        position:'fixed', bottom:14, right:18,
        fontFamily:'"Playfair Display", serif',
        fontSize:10, fontStyle:'italic',
        color:'rgba(184,115,51,0.2)',
        letterSpacing:'0.06em',
        pointerEvents:'none', zIndex:100,
        userSelect:'none',
      }}>
        VitessProbe ✦ Sarthak Naikare
      </div>
    </>
  )
}
