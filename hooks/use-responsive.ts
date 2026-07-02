"use client"

import { useState, useEffect } from "react"

const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280, "2xl": 1536 } as const
type Breakpoint = keyof typeof BREAKPOINTS

export function useResponsive() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("sm")
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      setWidth(w)
      if (w >= BREAKPOINTS["2xl"]) setBreakpoint("2xl")
      else if (w >= BREAKPOINTS.xl) setBreakpoint("xl")
      else if (w >= BREAKPOINTS.lg) setBreakpoint("lg")
      else if (w >= BREAKPOINTS.md) setBreakpoint("md")
      else setBreakpoint("sm")
    }
    handleResize()
    window.addEventListener("resize", handleResize, { passive: true })
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return {
    breakpoint,
    width,
    isMobile: width < BREAKPOINTS.md,
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: width >= BREAKPOINTS.lg,
    isLessThan: (bp: Breakpoint) => width < BREAKPOINTS[bp],
    isGreaterThan: (bp: Breakpoint) => width >= BREAKPOINTS[bp],
  }
}
