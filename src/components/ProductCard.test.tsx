import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductCard from './ProductCard';
import { Product } from '../types';

// Mock the store
vi.mock('../store', () => ({
  useStore: () => ({
    simulateOrder: vi.fn(),
  }),
}));

const mockProduct: Product = {
  id: 'TEST-001',
  name: 'Test Product',
  price: 1500000,
  commissionRate: 0.25,
  imageUrl: 'https://example.com/test.jpg',
  description: 'A test product for unit testing',
  salesCount: 10,
  stock: 50,
};

const renderProductCard = (product: Product = mockProduct) => {
  return render(
    <BrowserRouter>
      <ProductCard product={product} />
    </BrowserRouter>
  );
};

describe('ProductCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render product name', () => {
    renderProductCard();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('should render product price in VND format', () => {
    renderProductCard();
    expect(screen.getByText(/1\.500\.000/)).toBeInTheDocument();
  });

  it('should display commission amount', () => {
    renderProductCard();
    // Commission is 25% of 1,500,000 = 375,000
    expect(screen.getByText(/375\.000/)).toBeInTheDocument();
  });

  it('should display stock information', () => {
    renderProductCard();
    expect(screen.getByText(/Stock: 50/)).toBeInTheDocument();
  });

  it('should display product description', () => {
    renderProductCard();
    expect(screen.getByText('A test product for unit testing')).toBeInTheDocument();
  });

  it('should show "Out of Stock" when stock is 0', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 };
    renderProductCard(outOfStockProduct);
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('should render Share button', () => {
    renderProductCard();
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
  });

  it('should render Buy Now button', () => {
    renderProductCard();
    expect(screen.getByText('Buy Now')).toBeInTheDocument();
  });

  it('should disable Buy button when out of stock', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 };
    renderProductCard(outOfStockProduct);

    const buyButton = screen.getByRole('button', { name: /buy now/i });
    expect(buyButton).toBeDisabled();
  });

  it('should render product image with correct alt text', () => {
    renderProductCard();
    const img = screen.getByAltText('Test Product');
    expect(img).toHaveAttribute('src', 'https://example.com/test.jpg');
  });
});
