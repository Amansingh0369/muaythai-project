"use client"

import * as React from "react"
import { useState } from "react"
import { TextScramble } from "@/components/ui/text-scramble"

export function BasicDemo() {
  return (
    <div className="flex justify-center">
      <TextScramble className="font-mono text-sm uppercase">
        Text Scramble
      </TextScramble>
    </div>
  )
}

export function CustomTriggerDemo() {
  const [isTrigger, setIsTrigger] = useState(false)

  return (
    <div className="flex justify-center">
      <a
        href="#"
        className="text-zinc-500 transition-colors hover:text-black dark:hover:text-white"
      >
        <TextScramble
          className="text-sm"
          as="span"
          speed={0.01}
          trigger={isTrigger}
          onHoverStart={() => setIsTrigger(true)}
          onScrambleComplete={() => setIsTrigger(false)}
        >
          Tyler, The Creator - I Hope You Find Your Way Home
        </TextScramble>
      </a>
    </div>
  )
}

export function CustomCharacterDemo() {
  return (
    <div className="flex justify-center">
      <TextScramble
        className="font-mono text-sm"
        duration={1.2}
        characterSet=". "
      >
        Generating the interface...
      </TextScramble>
    </div>
  )
}

const demos = [
  {
    name: "Basic",
    description: "Basic text scramble with default settings",
    component: BasicDemo,
  },
  {
    name: "Custom Trigger",
    description: "Text scramble triggered on hover",
    component: CustomTriggerDemo,
  },
  {
    name: "Custom Character Set", 
    description: "Text scramble with custom character set and duration",
    component: CustomCharacterDemo,
  }
]

export default function ScrambleDemoPage() {
  return (
    <div className="min-h-screen bg-black text-white p-24 space-y-12">
      <h1 className="text-4xl font-bold text-center mb-16 uppercase tracking-widest">Text Scramble Demos</h1>
      <div className="grid gap-12 max-w-2xl mx-auto">
        {demos.map((demo) => (
          <div key={demo.name} className="space-y-4 border border-white/10 p-8 rounded-lg">
            <h2 className="text-xl font-bold">{demo.name}</h2>
            <p className="text-sm text-white/40">{demo.description}</p>
            <div className="pt-4 border-t border-white/5">
              <demo.component />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
