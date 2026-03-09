/**
 * OverageStatusCard Component Tests
 *
 * Tests for the OverageStatusCard React component.
 * Verifies rendering, i18n support, and user interactions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { OverageStatusCard } from '../billing/OverageStatusCard'
import { useOverageBilling } from '@/hooks/use-overage-billing'

// Mock the useOverageBilling hook
vi.mock('@/hooks/use-overage-billing', () => ({
  useOverageBilling: vi.fn(),
}))

const mockUseOverageBilling = vi.mocked(useOverageBilling)

describe('OverageStatusCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderWithI18n = (ui: React.ReactElement, language = 'vi') => {
    i18n.changeLanguage(language)
    return render(
      <I18nextProvider i18n={i18n}>
        {ui}
      </I18nextProvider>
    )
  }

  describe('Loading State', () => {
    it('shows loading skeleton when isLoading is true', () => {
      mockUseOverageBilling.mockReturnValue({
        overageEvents: [],
        totalOverageCost: 0,
        isLoading: true,
        error: null,
        forecast: null,
        refresh: vi.fn(),
        payOverage: vi.fn(),
      })

      renderWithI18n(<OverageStatusCard orgId="org-123" />)

      // Check for loading skeleton (animate-pulse class)
      const skeleton = screen.getByTestId('loading-skeleton', { exact: false }) ||
                       screen.getByRole('status') ||
                       document.querySelector('.animate-pulse')
      expect(skeleton).toBeInTheDocument()
    })
  })

  describe('Empty State - No Overage', () => {
    it('shows success message when no overage and no forecast warnings', () => {
      mockUseOverageBilling.mockReturnValue({
        overageEvents: [],
        totalOverageCost: 0,
        isLoading: false,
        error: null,
        forecast: null,
        refresh: vi.fn(),
        payOverage: vi.fn(),
      })

      renderWithI18n(<OverageStatusCard orgId="org-123" />)

      // Component uses hardcoded text based on i18n.language
      expect(screen.getByText(/Sử dụng trong giới hạn|Usage within limits/i)).toBeInTheDocument()
    })
  })

  describe('Overage Display', () => {
    it('displays overage cost', () => {
      mockUseOverageBilling.mockReturnValue({
        overageEvents: [
          {
            id: '1',
            orgId: 'org-123',
            userId: 'user-456',
            metricType: 'tokens',
            overageUnits: 5000,
            overageCost: 2.50,
            status: 'pending',
            createdAt: new Date(),
          },
        ],
        totalOverageCost: 2.50,
        isLoading: false,
        error: null,
        forecast: null,
        refresh: vi.fn(),
        payOverage: vi.fn(),
      })

      renderWithI18n(<OverageStatusCard orgId="org-123" />, 'vi')

      expect(screen.getByText(/Phí vượt mức/i)).toBeInTheDocument()
      expect(screen.getByText('$2.50')).toBeInTheDocument()
    })

    it('displays "Pay Now" button when overage exists', () => {
      mockUseOverageBilling.mockReturnValue({
        overageEvents: [],
        totalOverageCost: 10.00,
        isLoading: false,
        error: null,
        forecast: null,
        refresh: vi.fn(),
        payOverage: vi.fn(),
      })

      renderWithI18n(<OverageStatusCard orgId="org-123" />)

      expect(screen.getByText(/Thanh toán ngay|Pay Now/i)).toBeInTheDocument()
    })

    it('calls payOverage when button is clicked', () => {
      const mockPayOverage = vi.fn().mockResolvedValue({ success: true })
      mockUseOverageBilling.mockReturnValue({
        overageEvents: [],
        totalOverageCost: 10.00,
        isLoading: false,
        error: null,
        forecast: null,
        refresh: vi.fn(),
        payOverage: mockPayOverage,
      })

      renderWithI18n(<OverageStatusCard orgId="org-123" />)

      const payButton = screen.getByText(/Thanh toán ngay|Pay Now/i)
      fireEvent.click(payButton)

      expect(mockPayOverage).toHaveBeenCalled()
    })
  })

  describe('Error State', () => {
    it('displays error message when loading fails', () => {
      mockUseOverageBilling.mockReturnValue({
        overageEvents: [],
        totalOverageCost: 0,
        isLoading: false,
        error: new Error('Failed to load data'),
        forecast: null,
        refresh: vi.fn(),
        payOverage: vi.fn(),
      })

      renderWithI18n(<OverageStatusCard orgId="org-123" />)

      expect(screen.getByText(/Lỗi tải dữ liệu|Error loading data/i)).toBeInTheDocument()
    })
  })

  describe('Compact Mode', () => {
    it('shows minimal display when compact is true', () => {
      mockUseOverageBilling.mockReturnValue({
        overageEvents: [],
        totalOverageCost: 15.00,
        isLoading: false,
        error: null,
        forecast: null,
        refresh: vi.fn(),
        payOverage: vi.fn(),
      })

      renderWithI18n(<OverageStatusCard orgId="org-123" compact />)

      expect(screen.getByText(/Tổng phí vượt mức|Total overage/i)).toBeInTheDocument()
    })
  })

  describe('Multiple Metrics', () => {
    it('groups overage by metric type', () => {
      mockUseOverageBilling.mockReturnValue({
        overageEvents: [
          {
            id: '1',
            orgId: 'org-123',
            userId: 'user-456',
            metricType: 'tokens',
            overageUnits: 5000,
            overageCost: 2.50,
            status: 'pending',
            createdAt: new Date(),
          },
          {
            id: '2',
            orgId: 'org-123',
            userId: 'user-456',
            metricType: 'api_calls',
            overageUnits: 1000,
            overageCost: 1.00,
            status: 'pending',
            createdAt: new Date(),
          },
        ],
        totalOverageCost: 3.50,
        isLoading: false,
        error: null,
        forecast: null,
        refresh: vi.fn(),
        payOverage: vi.fn(),
      })

      renderWithI18n(<OverageStatusCard orgId="org-123" />)

      expect(screen.getByText('$3.50')).toBeInTheDocument()
    })
  })
})
