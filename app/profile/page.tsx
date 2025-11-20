'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Settings,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'

interface UserProfile {
  id: string
  email: string
  name: string
  phone?: string
  avatar_url?: string
  role?: string
  email_verified: boolean
  is_active: boolean
  balance?: number
  created_at: string
  updated_at: string
}

export default function ProfilePage () {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    avatar_url: ''
  })

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { user: profileData } = await apiClient.getUserProfile(user.id)
      setProfile(profileData)
      setFormData({
        name: profileData.name || '',
        phone: profileData.phone || '',
        avatar_url: profileData.avatar_url || ''
      })
    } catch (error: any) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className='container mx-auto max-w-2xl p-4 md:p-8'>
        <div className='flex items-center justify-center h-64'>
          <Loader2 className='h-8 w-8 animate-spin' />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className='container mx-auto max-w-2xl p-4 md:p-8'>
        <Card className='bg-zinc-900/50 border-zinc-800'>
          <CardContent className='flex items-center justify-center h-64'>
            <p className='text-muted-foreground'>Profile not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='container mx-auto max-w-6xl p-4 md:p-8'>
      <div className='flex items-center mb-6'>
        <User className='h-8 w-8' />
        <h1 className='text-3xl font-bold'>My Profile</h1>
      </div>
      {/* Avatar Upload Section */}
      {/* <div className="lg:col-span-1">
          <AvatarUpload
            currentAvatarUrl={profile.avatar_url || ''}
            userName={profile.name}
            userId={profile.id}
            onAvatarUpdate={handleAvatarUpdate}
            className="bg-zinc-900/50 border-zinc-800"
          />
        </div> */}
      {/* Profile Information Section */}
      <Card className='bg-zinc-900/50 border-zinc-800'>
        <CardHeader>
          <div className='flex items-center gap-4'>
            <div className='flex-1'>
              <CardTitle className='text-2xl'>{profile.name}</CardTitle>
              <CardDescription className='flex items-center gap-2 mt-1'>
                <Mail className='h-4 w-4' />
                {profile.email}
              </CardDescription>
              <div className='flex items-center gap-2 mt-2'>
                <Badge
                  variant={profile.role === 'admin' ? 'default' : 'secondary'}
                >
                  <Shield className='h-3 w-3 mr-1' />
                  {profile.role || 'buyer'}
                </Badge>
                {profile.email_verified && (
                  <Badge
                    variant='outline'
                    className='text-green-500 border-green-500'
                  >
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name' className='flex items-center gap-2'>
                <User className='h-4 w-4' />
                Full Name
              </Label>
              {isEditing ? (
                <Input
                  id='name'
                  value={formData.name}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder='Enter your full name'
                />
              ) : (
                <p className='text-sm text-muted-foreground bg-zinc-800/50 p-3 rounded-md'>
                  {profile.name}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='email' className='flex items-center gap-2'>
                <Mail className='h-4 w-4' />
                Email Address
              </Label>
              <p className='text-sm text-muted-foreground bg-zinc-800/50 p-3 rounded-md'>
                {profile.email}
                <span className='text-xs ml-2'>(Cannot be changed)</span>
              </p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='phone' className='flex items-center gap-2'>
                <Phone className='h-4 w-4' />
                Phone Number
              </Label>
              {isEditing ? (
                <Input
                  id='phone'
                  type='tel'
                  value={formData.phone}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder='Enter your phone number'
                />
              ) : (
                <p className='text-sm text-muted-foreground bg-zinc-800/50 p-3 rounded-md'>
                  {profile.phone || 'Not provided'}
                </p>
              )}
            </div>

            {isEditing && (
              <div className='space-y-2'>
                <Label htmlFor='avatar_url'>Avatar URL</Label>
                <Input
                  id='avatar_url'
                  type='url'
                  value={formData.avatar_url}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      avatar_url: e.target.value
                    }))
                  }
                  placeholder='Enter avatar image URL'
                />
              </div>
            )}
          </div>

          <Separator />

          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Account Information</h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='space-y-2'>
                <Label className='flex items-center gap-2'>
                  <Calendar className='h-4 w-4' />
                  Member Since
                </Label>
                <p className='text-sm text-muted-foreground bg-zinc-800/50 p-3 rounded-md'>
                  {formatDate(profile.created_at)}
                </p>
              </div>
              <div className='space-y-2'>
                <Label>Account Status</Label>
                <p className='text-sm text-muted-foreground bg-zinc-800/50 p-3 rounded-md'>
                  <Badge variant={'default'}>active</Badge>
                </p>
              </div>
              <div className='space-y-2'>
                <Label className='flex items-center gap-2'>
                  <Settings className='h-4 w-4' />
                  Account Balance
                </Label>
                <p className='text-sm font-semibold bg-green-900/20 border border-green-800 text-green-400 p-3 rounded-md'>
                  ${(profile.balance || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
