/**
 * Stripe Customer Portal Button Component
 *
 * Provides a button to open Stripe Customer Portal for self-service
 * subscription management (upgrade/downgrade, payment method, billing history).
 */

import { useState } from 'react'
import { stripeBillingClient } from '@/lib/stripe-billing-client'
import { Button } from '@/components/ui/Button'
import { ExternalLink } from 'lucide-react'

interface CustomerPortalButtonProps {
  customerId: string
  variant?: 'outline' | 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function CustomerPortalButton({
  customerId,
  variant = 'outline',
  size = 'md',
  className = '',
}: CustomerPortalButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleOpenPortal = async () => {
    setLoading(true)
    try {
      const portalUrl = await stripeBillingClient.getCustomerPortalUrl(customerId)

      if (portalUrl) {
        // Open in new window
        window.open(portalUrl, '_blank')
      } else {
        // Failed to get portal URL - handled by UI
      }
    } catch (err) {
      // Error opening portal - handled by UI
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleOpenPortal}
      disabled={loading}
    >
      {loading ? (
        <span className="animate-spin mr-2">⏳</span>
      ) : (
        <ExternalLink className="mr-2 h-4 w-4" />
      )}
      Quản lý Subscription
    </Button>
  )
}
