"use client"

import { PlaygroundHeader } from "./playground-header"

export function PlaygroundLayout() {
  return (
    <div className="h-screen flex flex-col">
      <PlaygroundHeader />
      <div className="flex-1" />
    </div>
  )
}