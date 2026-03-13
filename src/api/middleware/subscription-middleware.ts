/**
 * Subscription Middleware - API Endpoint Protection
 *
 * Middleware for protecting API endpoints based on subscription tier.
 * Integrates with RaaS license middleware for license validation first,
 * then checks subscription feature access.
 *
 * Usage:
 *   import { subscriptionMiddleware, withSubscription } from '@/api/middleware/subscription-middleware'
 *
 *   export async function GET(req: Request) {
 *     // Manual middleware call
 *     const blocked = await subscriptionMiddleware(req, 'analyticsDashboard')
 *     if (blocked) return blocked
 *
 *     // Protected handler logic...
 *   }
 *
 *   // Or use wrapper
 *   export const GET = withSubscription(async (req) => {
 *     // Protected handler logic...
 *   }, 'analyticsDashboard')
 */

import { checkFeatureAccess } from '@/lib/subscription-gate'
import { raasLicenseMiddleware } from '@/lib/raas-license-middleware'

/**
 * Subscription middleware for API endpoints
 *
 * Validates RaaS license first, then checks subscription tier access.
 * Returns 403 response if access is denied, null if access granted.
 *
 * @param request - The incoming HTTP request
 * @param feature - Feature name to check access for
 * @returns Response if access denied, null if access granted
 */
export async function subscriptionMiddleware(
  request: Request,
  feature: string
): Promise<Response | null> {
  // Step 1: Check RaaS license first
  const licenseResult = await raasLicenseMiddleware.licenseValidationMiddleware(request)

  if (!licenseResult.allowed) {
    return raasLicenseMiddleware.licenseDeniedResponse(licenseResult)
  }

  // Step 2: Extract user's subscription tier from license
  const userPlan = licenseResult.license?.tier || 'free'

  // Step 3: Check subscription feature access
  const hasAccess = checkFeatureAccess(userPlan, feature)

  if (!hasAccess) {
    return new Response(
      JSON.stringify({
        error: 'subscription_required',
        message: 'This feature requires a premium subscription',
        required_plan: feature,
        current_plan: userPlan,
        upgrade_url: '/subscription',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  // Access granted
  return null
}

/**
 * Higher-order function for wrapping route handlers with subscription check
 *
 * @param handler - The route handler function to wrap
 * @param feature - Feature name to check access for
 * @returns Wrapped handler with subscription protection
 */
export function withSubscription<
  T extends (req: Request) => Promise<Response>,
>(handler: T, feature: string): T {
  return (async (request: Request) => {
    // Check subscription access
    const blocked = await subscriptionMiddleware(request, feature)

    if (blocked) {
      return blocked
    }

    // Call original handler
    return handler(request)
  }) as T
}

/**
 * Create subscription check response for manual usage
 *
 * @param feature - Feature that was denied
 * @param userTier - User's current subscription tier
 * @returns 403 Response with subscription required error
 */
export function subscriptionDeniedResponse(
  feature: string,
  userTier: string
): Response {
  return new Response(
    JSON.stringify({
      error: 'subscription_required',
      message: `This feature requires ${feature} plan or higher`,
      required_plan: feature,
      current_plan: userTier,
      upgrade_url: '/subscription',
    }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

/**
 * Middleware components for subscription protection
 */
export const subscriptionMiddlewareUtils = {
  subscriptionMiddleware,
  withSubscription,
  subscriptionDeniedResponse,
}

export default subscriptionMiddlewareUtils
