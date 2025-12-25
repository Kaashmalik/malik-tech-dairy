import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MedicinePage from '../page';

// Mock fetch
global.fetch = jest.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const mockMedicinesResponse = {
  success: true,
  medicines: [
    {
      id: 'med-1',
      name: 'Penicillin G',
      category: 'antibiotic',
      stock: 150,
      unit: 'ml',
      expiryDate: '2024-12-31',
      supplier: 'PharmaCo Ltd',
      purchasePrice: 250,
      minimumStock: 10,
      status: 'adequate',
      isExpired: false,
      isExpiringSoon: false,
    },
    {
      id: 'med-2',
      name: 'Ivermectin',
      category: 'antiparasitic',
      stock: 25,
      unit: 'ml',
      expiryDate: '2024-08-15',
      supplier: 'VetMed Inc',
      purchasePrice: 450,
      minimumStock: 30,
      status: 'low',
      isExpired: false,
      isExpiringSoon: true,
    },
  ],
  stats: {
    total: 2,
    lowStock: 1,
    expiringSoon: 1,
    expired: 0,
    totalValue: 48750,
  },
};

describe('MedicinePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders medicine page with title', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMedicinesResponse,
    });

    render(<MedicinePage />, { wrapper: createWrapper() });

    expect(screen.getByText('Medicine Management')).toBeInTheDocument();
    expect(screen.getByText(/Track medications, inventory/)).toBeInTheDocument();
  });

  it('displays loading state initially', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => mockMedicinesResponse,
              }),
            100
          )
        )
    );

    render(<MedicinePage />, { wrapper: createWrapper() });

    // Check for loader
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('displays medicines after loading', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMedicinesResponse,
    });

    render(<MedicinePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Penicillin G')).toBeInTheDocument();
      expect(screen.getByText('Ivermectin')).toBeInTheDocument();
    });
  });

  it('displays stats cards', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMedicinesResponse,
    });

    render(<MedicinePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Total Medicines')).toBeInTheDocument();
      expect(screen.getByText('Low Stock')).toBeInTheDocument();
      expect(screen.getByText('Expiring Soon')).toBeInTheDocument();
    });
  });

  it('opens add medicine dialog when button is clicked', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMedicinesResponse,
    });

    render(<MedicinePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Penicillin G')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /Add Medicine/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add New Medicine')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Penicillin G/)).toBeInTheDocument();
    });
  });

  it('filters medicines by search term', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMedicinesResponse,
    });

    render(<MedicinePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Penicillin G')).toBeInTheDocument();
      expect(screen.getByText('Ivermectin')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search medicines/);
    fireEvent.change(searchInput, { target: { value: 'Penicillin' } });

    await waitFor(() => {
      expect(screen.getByText('Penicillin G')).toBeInTheDocument();
      expect(screen.queryByText('Ivermectin')).not.toBeInTheDocument();
    });
  });

  it('displays error state on fetch failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<MedicinePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Failed to load medicines/)).toBeInTheDocument();
    });
  });

  it('displays status badges correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMedicinesResponse,
    });

    render(<MedicinePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('In Stock')).toBeInTheDocument();
      expect(screen.getByText('Low Stock')).toBeInTheDocument();
    });
  });

  it('displays WhatsApp vet contact banner', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMedicinesResponse,
    });

    render(<MedicinePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Need Veterinary Guidance/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Chat with Vet/i })).toBeInTheDocument();
    });
  });

  it('displays tabs for inventory and treatments', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMedicinesResponse,
    });

    render(<MedicinePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Inventory/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Treatment Records/i })).toBeInTheDocument();
    });
  });
});

