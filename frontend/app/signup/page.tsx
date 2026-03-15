'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login as apiLogin, signup as apiSignup } from '@/lib/api'
import Signup1 from '@/components/ui/signup-1'

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (name: string, email: string, pass: string) => {
    setError('')
    setLoading(true)
    try {
      const res = await apiSignup(name, email, pass)
      localStorage.setItem('guardian_token', res.data.token)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Signup1 
      onSubmit={handleSubmit} 
      loading={loading} 
      error={error} 
    />
  )
}
