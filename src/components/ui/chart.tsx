"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"
import type { TooltipProps } from "recharts"

import { cn } from "@/lib/utils"

/* -------------------- theme -------------------- */

const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

/* -------------------- context -------------------- */

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const ctx = React.useContext(ChartContext)
  if (!ctx) {
    throw new Error("useChart must be used within ChartContainer")
  }
  return ctx
}

/* -------------------- container -------------------- */

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"]
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
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

/* -------------------- style -------------------- */

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(
    ([, c]) => c.color || c.theme
  )

  if (!colorConfig.length) return null

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, c]) => {
    const color =
      c.theme?.[theme as keyof typeof c.theme] || c.color
    return color ? `  --color-${key}: ${color};` : ""
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

/* -------------------- tooltip -------------------- */

const ChartTooltip = RechartsPrimitive.Tooltip

function ChartTooltipContent(
  props: TooltipProps<number, string> &
    React.ComponentProps<"div"> & {
      nameKey?: string
    }
) {
  const { active, payload, className, nameKey } = props
  const { config } = useChart()

  if (!active || !payload?.length) return null

  return (
    <div className={cn("rounded-lg border bg-background p-2 text-xs", className)}>
      {payload.map((item) => {
        const key = `${nameKey || item.dataKey || "value"}`
        const itemConfig = getPayloadConfigFromPayload(config, item, key)

        return (
          <div
            key={item.dataKey}
            className="flex items-center justify-between gap-2"
          >
            <span className="text-muted-foreground">
              {itemConfig?.label || item.name}
            </span>
            <span className="font-mono tabular-nums">
              {item.value?.toLocaleString()}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* -------------------- legend -------------------- */

const ChartLegend = RechartsPrimitive.Legend

function ChartLegendContent({
  className,
  payload,
}: React.ComponentProps<"div"> &
  Pick<RechartsPrimitive.LegendProps, "payload">) {
  const { config } = useChart()

  if (!payload?.length) return null

  return (
    <div className={cn("flex gap-4", className)}>
      {payload.map((item) => {
        const key = `${item.dataKey || "value"}`
        const itemConfig = getPayloadConfigFromPayload(config, item, key)

        return (
          <div key={item.value} className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <span>{itemConfig?.label}</span>
          </div>
        )
      })}
    </div>
  )
}

/* -------------------- helpers -------------------- */

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) return undefined

  const p = payload as Record<string, unknown>

  if (typeof p[key] === "string" && p[key] in config) {
    return config[p[key] as string]
  }

  if (key in config) return config[key]

  return undefined
}

/* -------------------- exports -------------------- */

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
