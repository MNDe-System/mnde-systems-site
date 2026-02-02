"use client"

import { useState } from "react"

const INITIAL_VALUES = {
  gpuCount: 64,
  gpuHourlyCost: 2.75,
  utilizationPercent: 52,
  idlePercent: 18,
  overRequestPercent: 22,
  unownedJobsPercent: 9
}

const COVERAGE_LOW = 0.45
const COVERAGE_HIGH = 0.65

export default function Calculator() {
  const [values, setValues] = useState(INITIAL_VALUES)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setValues(prev => ({ ...prev, [name]: parseFloat(value) || 0 }))
  }

  const setPreset = (preset: "conservative" | "aggressive") => {
    if (preset === "conservative") {
      setValues(prev => ({
        ...prev,
        idlePercent: 12,
        overRequestPercent: 15,
        unownedJobsPercent: 5
      }))
    } else {
      setValues(prev => ({
        ...prev,
        idlePercent: 25,
        overRequestPercent: 30,
        unownedJobsPercent: 12
      }))
    }
  }

  const annualGpuHours = values.gpuCount * 24 * 365
  const allocatedHours = (annualGpuHours * values.utilizationPercent) / 100
  const wasteHours =
    (allocatedHours *
      (values.idlePercent +
        values.overRequestPercent +
        values.unownedJobsPercent)) /
    100

  const preventedLow = wasteHours * COVERAGE_LOW
  const preventedHigh = wasteHours * COVERAGE_HIGH

  const dollarsLow = preventedLow * values.gpuHourlyCost
  const dollarsHigh = preventedHigh * values.gpuHourlyCost

  const gpusLow = preventedLow / 24 / 365
  const gpusHigh = preventedHigh / 24 / 365

  const exportJson = () => {
    const data = {
      inputs: values,
      coverageRange: {
        low: COVERAGE_LOW,
        high: COVERAGE_HIGH
      },
      outputs: {
        annualGpuHours,
        allocatedHours,
        wasteHours,
        preventedWasteHoursRange: {
          low: preventedLow,
          high: preventedHigh
        },
        annualDollarsAvoidedRange: {
          low: dollarsLow,
          high: dollarsHigh
        },
        equivalentGpusFreedRange: {
          low: gpusLow,
          high: gpusHigh
        }
      },
      timestamp: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "mnde-acrl-estimate.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 font-mono">
      <div className="space-y-8">
        <div className="flex gap-4">
          <button
            onClick={() => setPreset("conservative")}
            className="text-[10px] uppercase tracking-widest px-4 py-2 border border-[#262A30] hover:border-[#6F7680] transition-colors"
          >
            Preset conservative
          </button>
          <button
            onClick={() => setPreset("aggressive")}
            className="text-[10px] uppercase tracking-widest px-4 py-2 border border-[#262A30] hover:border-[#6F7680] transition-colors"
          >
            Preset aggressive
          </button>
        </div>

        <div className="space-y-6">
          <InputItem
            label="Cluster GPU count"
            name="gpuCount"
            value={values.gpuCount}
            onChange={handleChange}
          />
          <InputItem
            label="Average GPU hourly cost ($)"
            name="gpuHourlyCost"
            value={values.gpuHourlyCost}
            onChange={handleChange}
            step="0.01"
          />
          <InputItem
            label="Average utilization percent (%)"
            name="utilizationPercent"
            value={values.utilizationPercent}
            onChange={handleChange}
          />
          <InputItem
            label="Idle percent of allocated time (%)"
            name="idlePercent"
            value={values.idlePercent}
            onChange={handleChange}
          />
          <InputItem
            label="Over request percent (%)"
            name="overRequestPercent"
            value={values.overRequestPercent}
            onChange={handleChange}
          />
          <InputItem
            label="Unowned jobs percent (%)"
            name="unownedJobsPercent"
            value={values.unownedJobsPercent}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="space-y-10 bg-[#0B0D0F] lg:pl-12 lg:border-l lg:border-[#262A30]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-10 gap-x-8">
          <OutputBlock
            label="Annual GPU hours"
            value={annualGpuHours.toLocaleString()}
            formula="GPU count * 24 * 365"
          />
          <OutputBlock
            label="Executed hours"
            value={allocatedHours.toLocaleString()}
            formula="Annual GPU hours * utilization percent"
          />
          <OutputBlock
            label="Estimated waste hours"
            value={wasteHours.toLocaleString()}
            formula="Executed hours * waste share"
          />
          <OutputRangeBlock
            label="Waste blocked by refusal"
            low={preventedLow}
            high={preventedHigh}
            formula="Waste hours * observed coverage range"
          />
          <div className="sm:col-span-2">
            <OutputRangeBlock
              label="Estimated spend avoided"
              low={dollarsLow}
              high={dollarsHigh}
              prefix="$"
              highlight
              formula="Blocked waste hours * avg cost"
            />
          </div>
          <OutputRangeBlock
            label="Effective capacity returned (GPUs)"
            low={gpusLow}
            high={gpusHigh}
            formula="Blocked waste hours / 24 / 365"
          />
        </div>

        <div className="pt-10 border-t border-[#262A30]">
          <h4 className="text-[10px] uppercase tracking-widest font-bold mb-4 text-[#6F7680]">
            Refusal drivers
          </h4>
          <ul className="text-sm space-y-2 text-[#B8BDC4]">
            <li className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#262A30]" />
              <span>Idle allocation refusal</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#262A30]" />
              <span>Over request normalization</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#262A30]" />
              <span>Unowned workload eviction</span>
            </li>
          </ul>
        </div>

        <button
          onClick={exportJson}
          className="w-full text-[10px] uppercase tracking-widest font-bold border border-[#F2F2F2] text-[#F2F2F2] hover:bg-[#F2F2F2] hover:text-[#0B0D0F] transition-colors py-4"
        >
          Export estimate JSON
        </button>
      </div>
    </div>
  )
}

function InputItem({
  label,
  name,
  value,
  onChange,
  step = "1"
}: {
  label: string
  name: string
  value: number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  step?: string
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] uppercase tracking-widest text-[#6F7680] font-bold">
        {label}
      </label>
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        step={step}
        className="w-full bg-transparent border border-[#262A30] p-4 text-[#F2F2F2] outline-none focus:border-[#6F7680] transition-colors"
      />
    </div>
  )
}

function OutputBlock({
  label,
  value,
  formula,
  highlight = false
}: {
  label: string
  value: string
  formula: string
  highlight?: boolean
}) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-widest text-[#6F7680] font-bold">
        {label}
      </div>
      <div
        className={`text-2xl font-semibold ${
          highlight ? "text-[#F2F2F2]" : "text-[#B8BDC4]"
        }`}
      >
        {value}
      </div>
      <div className="text-[9px] text-[#6F7680] italic">{formula}</div>
    </div>
  )
}

function OutputRangeBlock({
  label,
  low,
  high,
  formula,
  prefix = "",
  highlight = false
}: {
  label: string
  low: number
  high: number
  formula: string
  prefix?: string
  highlight?: boolean
}) {
  const format = (v: number) =>
    prefix
      ? `${prefix}${v.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`
      : v.toFixed(2)

  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-widest text-[#6F7680] font-bold">
        {label}
      </div>
      <div
        className={`text-2xl font-semibold ${
          highlight ? "text-[#F2F2F2]" : "text-[#B8BDC4]"
        }`}
      >
        {format(low)} to {format(high)}
      </div>
      <div className="text-[9px] text-[#6F7680] italic">{formula}</div>
    </div>
  )
}
