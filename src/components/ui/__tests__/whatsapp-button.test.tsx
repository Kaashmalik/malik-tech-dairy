import { render, screen, fireEvent } from '@testing-library/react';
import { WhatsAppButton } from '../whatsapp-button';

// Mock window.open
const mockWindowOpen = jest.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

describe('WhatsAppButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the WhatsApp button', () => {
    render(<WhatsAppButton />);
    
    // The component should be rendered (there's a button)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('toggles the menu when clicked', () => {
    render(<WhatsAppButton />);
    
    // Click to open - find the main button (first button)
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    
    // Menu should be visible with contact options
    expect(screen.getByText('MTK Dairy Team')).toBeInTheDocument();
    expect(screen.getByText('Veterinary Doctor')).toBeInTheDocument();
    expect(screen.getByText('Technical Support')).toBeInTheDocument();
    expect(screen.getByText('General Inquiry')).toBeInTheDocument();
  });

  it('opens WhatsApp with veterinary message when vet option is clicked', () => {
    render(<WhatsAppButton />);
    
    // Open menu
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    
    // Click veterinary option - find it by text
    const vetButton = screen.getByText('Veterinary Doctor').closest('button');
    if (vetButton) {
      fireEvent.click(vetButton);
    }
    
    // Check that window.open was called with WhatsApp URL
    expect(mockWindowOpen).toHaveBeenCalledTimes(1);
    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/923038111297'),
      '_blank'
    );
  });

  it('opens WhatsApp with technical support message when tech option is clicked', () => {
    render(<WhatsAppButton />);
    
    // Open menu
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    
    // Click technical support option
    const techButton = screen.getByText('Technical Support').closest('button');
    if (techButton) {
      fireEvent.click(techButton);
    }
    
    // Check that window.open was called with WhatsApp URL
    expect(mockWindowOpen).toHaveBeenCalledTimes(1);
    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/923038111297'),
      '_blank'
    );
  });

  it('closes the menu when main button is clicked again', () => {
    render(<WhatsAppButton />);
    
    // Open menu
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    
    // Menu should be visible
    expect(screen.getByText('MTK Dairy Team')).toBeInTheDocument();
    
    // Click the main button again (now shows X icon) - it's still the first button
    const allButtons = screen.getAllByRole('button');
    // Find the button that's not in the menu (the main toggle button)
    const mainButton = allButtons[0];
    fireEvent.click(mainButton);
    
    // Menu should be closed - check that the menu header text is not visible
    expect(screen.queryByText("We're here to help 24/7")).not.toBeInTheDocument();
  });

  it('displays phone number in the menu footer', () => {
    render(<WhatsAppButton />);
    
    // Open menu
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    
    // Check phone number is displayed
    expect(screen.getByText('📞 03038111297 • Available 24/7')).toBeInTheDocument();
  });

  it('shows notification dot initially', () => {
    render(<WhatsAppButton />);
    
    // Check for notification dot (it has the number 1)
    const notificationDot = screen.getByText('1');
    expect(notificationDot).toBeInTheDocument();
  });

  it('displays subtitle for each contact option', () => {
    render(<WhatsAppButton />);
    
    // Open menu
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    
    // Check subtitles
    expect(screen.getByText('Animal health emergency')).toBeInTheDocument();
    expect(screen.getByText('App or dashboard issues')).toBeInTheDocument();
    expect(screen.getByText('Questions & feedback')).toBeInTheDocument();
  });
});
