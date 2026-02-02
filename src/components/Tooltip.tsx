import React, { useState, useRef, useEffect } from 'react'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'bottom',
  delay = 300,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="tooltip-container" style={{ position: 'relative', display: 'inline-block' }}>
      <div
        ref={triggerRef}
        className={`tooltip-trigger ${className}`}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        style={{ display: 'inline-block' }}
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          className={`tooltip tooltip-${position}`}
          style={{
            position: 'absolute',
            zIndex: 1000,
            ...(position === 'bottom' && {
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: '8px'
            }),
            ...(position === 'top' && {
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: '8px'
            }),
            ...(position === 'left' && {
              right: '100%',
              top: '50%',
              transform: 'translateY(-50%)',
              marginRight: '8px'
            }),
            ...(position === 'right' && {
              left: '100%',
              top: '50%',
              transform: 'translateY(-50%)',
              marginLeft: '8px'
            })
          }}
        >
          {content}
        </div>
      )}
    </div>
  )
}

export default Tooltip