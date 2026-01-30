"use client"

import * as React from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface TimePickerProps {
    value?: Date
    onChange: (date: Date) => void
    className?: string
    focusOnMount?: boolean
}

export function TimePicker({ value, onChange, className, focusOnMount }: TimePickerProps) {
    const hours = value ? value.getHours() : 10
    const minutes = value ? value.getMinutes() : 0

    const [hourOpen, setHourOpen] = React.useState(false)
    const [minuteOpen, setMinuteOpen] = React.useState(false)
    const [periodOpen, setPeriodOpen] = React.useState(false)

    const hourTriggerRef = React.useRef<HTMLButtonElement>(null)

    // Convert 24h to 12h format
    const hour12 = hours % 12 || 12
    const period = hours >= 12 ? "PM" : "AM"

    // Focus on hours when focusOnMount changes to true
    React.useEffect(() => {
        if (focusOnMount) {
            // Small delay to ensure popover is closed first
            const timer = setTimeout(() => {
                setHourOpen(true)
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [focusOnMount])

    const handleHourChange = (newHour: string) => {
        const hour = parseInt(newHour)
        const newDate = value ? new Date(value) : new Date()
        // Convert 12h to 24h
        let hour24 = hour
        if (period === "PM" && hour !== 12) {
            hour24 = hour + 12
        } else if (period === "AM" && hour === 12) {
            hour24 = 0
        }
        newDate.setHours(hour24)
        newDate.setMinutes(minutes)
        onChange(newDate)

        // After selecting hour, open minutes
        setTimeout(() => {
            setMinuteOpen(true)
        }, 100)
    }

    const handleMinuteChange = (newMinute: string) => {
        const newDate = value ? new Date(value) : new Date()
        newDate.setHours(hours)
        newDate.setMinutes(parseInt(newMinute))
        onChange(newDate)

        // After selecting minute, open AM/PM
        setTimeout(() => {
            setPeriodOpen(true)
        }, 100)
    }

    const handlePeriodChange = (newPeriod: string) => {
        const newDate = value ? new Date(value) : new Date()
        let newHour = hours
        if (newPeriod === "PM" && hours < 12) {
            newHour = hours + 12
        } else if (newPeriod === "AM" && hours >= 12) {
            newHour = hours - 12
        }
        newDate.setHours(newHour)
        newDate.setMinutes(minutes)
        onChange(newDate)
    }

    return (
        <div className={cn("flex items-center gap-1", className)}>
            <Select
                value={hour12.toString().padStart(2, '0')}
                onValueChange={handleHourChange}
                open={hourOpen}
                onOpenChange={setHourOpen}
            >
                <SelectTrigger ref={hourTriggerRef} className="w-[70px] h-10">
                    <SelectValue placeholder="HH" />
                </SelectTrigger>
                <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                        <SelectItem key={hour} value={hour.toString().padStart(2, '0')}>
                            {hour.toString().padStart(2, '0')}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <span className="text-muted-foreground">:</span>

            <Select
                value={minutes.toString().padStart(2, '0')}
                onValueChange={handleMinuteChange}
                open={minuteOpen}
                onOpenChange={setMinuteOpen}
            >
                <SelectTrigger className="w-[70px] h-10">
                    <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                        <SelectItem key={minute} value={minute.toString().padStart(2, '0')}>
                            {minute.toString().padStart(2, '0')}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={period}
                onValueChange={handlePeriodChange}
                open={periodOpen}
                onOpenChange={setPeriodOpen}
            >
                <SelectTrigger className="w-[70px] h-10">
                    <SelectValue placeholder="AM/PM" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}
