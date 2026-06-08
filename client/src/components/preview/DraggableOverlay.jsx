import { useCallback, useEffect, useRef, useState } from 'react'
import { clampOverlay } from '../../utils/coordinates'

const MIN_SIZE = 80

export default function DraggableOverlay({
  children,
  overlay,
  setOverlay,
  onPersist,
  containerSize,
}) {
  const dragRef = useRef(null)
  const overlayRef = useRef(overlay)
  const [action, setAction] = useState(null)

  overlayRef.current = overlay

  const onPointerDownDrag = useCallback((e) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setAction({
      type: 'drag',
      startX: e.clientX,
      startY: e.clientY,
      origin: { ...overlay },
    })
  }, [overlay])

  const onPointerDownResize = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    setAction({
      type: 'resize',
      startX: e.clientX,
      startY: e.clientY,
      origin: { ...overlay },
    })
  }, [overlay])

  useEffect(() => {
    if (!action) return

    const onMove = (e) => {
      const dx = e.clientX - action.startX
      const dy = e.clientY - action.startY
      const { width: cw, height: ch } = containerSize

      if (action.type === 'drag') {
        setOverlay(clampOverlay({
          ...action.origin,
          x: action.origin.x + dx,
          y: action.origin.y + dy,
        }, cw, ch, MIN_SIZE))
      } else {
        setOverlay(clampOverlay({
          ...action.origin,
          width: action.origin.width + dx,
          height: action.origin.height + dy,
        }, cw, ch, MIN_SIZE))
      }
    }

    const onUp = () => {
      setAction(null)
      onPersist?.(overlayRef.current)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [action, containerSize, setOverlay, onPersist])

  if (!overlay) return null

  return (
    <div
      ref={dragRef}
      className="absolute touch-none select-none overflow-hidden rounded border-2 border-red-500/80 shadow-lg"
      style={{
        left: overlay.x,
        top: overlay.y,
        width: overlay.width,
        height: overlay.height,
        cursor: action?.type === 'drag' ? 'grabbing' : 'grab',
      }}
      onPointerDown={onPointerDownDrag}
    >
      {children}
      <div
        className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize bg-red-500"
        onPointerDown={onPointerDownResize}
        aria-label="Resize"
      />
    </div>
  )
}
