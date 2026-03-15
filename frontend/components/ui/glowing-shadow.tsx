"use client"

import { useEffect, type ReactNode } from "react"
import styles from "./glowing-shadow.module.css"

interface GlowingShadowButtonProps {
  children: ReactNode
}

export function GlowingShadow({ children }: GlowingShadowButtonProps) {
  return (
    <div className={styles.glowContainer} role="button">
      <span className={styles.glow}></span>
      <div className={styles.glowContent}>{children}</div>
    </div>
  )
}
