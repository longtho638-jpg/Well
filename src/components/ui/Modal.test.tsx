import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import { describe, it, expect, vi } from 'vitest';
import { Modal } from './Modal';
import React from 'react';

// Mock framer-motion since it handles animations that might be tricky in tests
vi.mock('framer-motion', async () => {
  const actualReact = await import('react');
  return {
    motion: {
      div: actualReact.forwardRef(({ children, onClick, className, ...props }: React.HTMLAttributes<HTMLDivElement>, ref: React.ForwardedRef<HTMLDivElement>) => (
        <div ref={ref} className={className} onClick={onClick} {...props}>
          {children}
        </div>
      )),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <div>Modal Content</div>,
  };

  it('renders when open', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<Modal {...defaultProps} />);
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('renders with custom max width', () => {
    render(<Modal {...defaultProps} maxWidth="lg" />);
    // The Modal implementation puts the maxWidth class on the motion.div
    // which corresponds to the inner div in our mock.
    const modalHeader = screen.getByText('Test Modal').closest('div'); // Header div
    const modalContent = modalHeader?.parentElement; // motion.div
    expect(modalContent?.className).toContain('max-w-lg');
  });

  it('hides close button when configured', () => {
    render(<Modal {...defaultProps} showCloseButton={false} />);
    expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
  });
});
