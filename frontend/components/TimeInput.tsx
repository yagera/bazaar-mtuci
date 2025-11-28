'use client'

import { useState, useEffect, useRef } from 'react'

interface TimeInputProps {
  value: string
  onChange: (value: string) => void
  className?: string
  label?: string
}

export default function TimeInput({ value, onChange, className = '', label }: TimeInputProps) {
  const parseTime = (timeStr: string | undefined) => {
    if (!timeStr) return { hours: '', minutes: '' }
    const [h, m] = timeStr.split(':')
    return {
      hours: h || '',
      minutes: m || ''
    }
  }

  const initialTime = parseTime(value)
  const [hours, setHours] = useState(initialTime.hours)
  const [minutes, setMinutes] = useState(initialTime.minutes)
  const isEditingRef = useRef(false)

  useEffect(() => {
    if (!isEditingRef.current) {
      const parsed = parseTime(value)
      setHours(parsed.hours)
      setMinutes(parsed.minutes)
    }
  }, [value])

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isEditingRef.current = true
    let val = e.target.value.replace(/\D/g, '')
    
    if (val === '') {
      setHours('')
      const currentMinutes = minutes || '00'
      onChange(`00:${currentMinutes.padStart(2, '0')}`)
      return
    }
    
    const num = parseInt(val, 10)
    if (isNaN(num)) {
      setHours('')
      return
    }
    
    if (num > 23) {
      val = '23'
    } else {
      val = num.toString()
    }
    
    setHours(val)
    
    const currentMinutes = minutes || '00'
    onChange(`${val.padStart(2, '0')}:${currentMinutes.padStart(2, '0')}`)
  }

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isEditingRef.current = true
    let val = e.target.value.replace(/\D/g, '')
    
    if (val === '') {
      setMinutes('')
      const currentHours = hours || '00'
      onChange(`${currentHours.padStart(2, '0')}:00`)
      return
    }
    
    const num = parseInt(val, 10)
    if (isNaN(num)) {
      setMinutes('')
      return
    }
    
    if (num > 59) {
      val = '59'
    } else {
      val = num.toString()
    }
    
    setMinutes(val)
    
    const currentHours = hours || '00'
    onChange(`${currentHours.padStart(2, '0')}:${val.padStart(2, '0')}`)
  }

  const handleHoursBlur = () => {
    isEditingRef.current = false
    const h = hours === '' ? '00' : hours.padStart(2, '0')
    const m = minutes === '' ? '00' : minutes.padStart(2, '0')
    setHours(h)
    setMinutes(m)
    onChange(`${h}:${m}`)
  }

  const handleMinutesBlur = () => {
    isEditingRef.current = false
    const h = hours === '' ? '00' : hours.padStart(2, '0')
    const m = minutes === '' ? '00' : minutes.padStart(2, '0')
    setHours(h)
    setMinutes(m)
    onChange(`${h}:${m}`)
  }

  const handleHoursFocus = () => {
    isEditingRef.current = true
  }

  const handleMinutesFocus = () => {
    isEditingRef.current = true
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={hours}
          onChange={handleHoursChange}
          onFocus={handleHoursFocus}
          onBlur={handleHoursBlur}
          className="input-field w-16 text-center"
          placeholder="00"
          maxLength={2}
          inputMode="numeric"
        />
        <span className="text-gray-500 dark:text-gray-400 font-bold">:</span>
        <input
          type="text"
          value={minutes}
          onChange={handleMinutesChange}
          onFocus={handleMinutesFocus}
          onBlur={handleMinutesBlur}
          className="input-field w-16 text-center"
          placeholder="00"
          maxLength={2}
          inputMode="numeric"
        />
      </div>
    </div>
  )
}

