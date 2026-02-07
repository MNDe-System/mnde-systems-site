"use client"

import * as React from "react"
import * as Recharts from "recharts"
import { cn } from "@/lib/utils"

/* =======================
   Theme
======================= */

const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k: string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
    color?: string
  }
}

/* =======================
   Context
======================= */

type ChartContextValue = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextValue | null>(null)

function useChart() {
  const ctx = React.useContext(ChartContext)
  if (!ctx) {
    throw new Error("Chart components must be wrapped in <ChartContainer>")
  }
  return ctx
}

/* =======================
   Container
======================= */

export function ChartContainer({
  id,
  config,
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ReactNode
}) {
  const uid = React.useId()
  const chartId = `chart-${id || uid.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn("flex aspect-video justify-center text-xs", className)}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <Recharts.ResponsiveContainer>
          {children}
        </Recharts.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

/* =======================
   Style Injection
======================= */

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const entries = Object.entries(config).filter(([, v]) => v.color)

  if (!entries.length) return null

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([, prefix]) => `
${prefix} [data-chart=${id}] {
${entries
  .map(([key, v]) => `  --color-${key}: ${v.color};`)
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

/* =======================
   Tooltip
======================= */

export const ChartTooltip = Recharts.Tooltip

export function ChartTooltipContent(props: any) {
  const { active, payload, className } = props
  const { config } = useChart()

  if (!active || !payload || !payload.length) return null

  return (
    <div className={cn("rounded border bg-background p-2 text-xs", className)}>
      {payload.map((item: any, i: number) => {
        const key = item.dataKey || item.name
        const cfg = config[key]

        return (
          <div key={i} className="flex justify-between gap-2">
            <span className="text-muted-foreground">
              {cfg?.label || item.name}
            </span>
            <span className="font-mono">
              {item.value?.toLocaleString?.() ?? item.value}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* =======================
   Legend
======================= */

export const ChartLegend = Recharts.Legend

export function ChartLegendContent(props: any) {
  const { payload, className } = props
  const { config } = useChart()

  if (!payload || !payload.length) return null

  return (
    <div className={cn("flex gap-4", className)}>
      {payload.map((item: any) => {
        const cfg = config[item.dataKey]

        return (
          <div key={item.value} className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <span>{cfg?.label}</span>
          </div>
        )
      })}
    </div>
  )
}
