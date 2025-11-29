"use client"
import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const order = ["light", "dark", "system"] as const
  type ThemeOpt = typeof order[number]
  const current: ThemeOpt = order.includes(theme as ThemeOpt) ? (theme as ThemeOpt) : "system"
  const next = order[(order.indexOf(current) + 1) % order.length]

  return (
    <Button variant="outline" size="icon" onClick={() => setTheme(next)}>
      <Sun className="h-[1.2rem] w-[1.2rem] dark:hidden" />
      <Moon className="h-[1.2rem] w-[1.2rem] hidden dark:block" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
