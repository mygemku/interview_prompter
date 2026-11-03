import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PrompterControls } from '../components/prompter/PrompterControls';
import { AppProvider } from '../context/AppContext';

describe('UI Components', () => {
  describe('Button', () => {
    it('renders text correctly', () => {
      render(<Button>Click Me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('applies variant classes', () => {
      render(<Button variant="danger">Delete</Button>);
      const btn = screen.getByRole('button', { name: /delete/i });
      expect(btn.className).toContain('text-red-400');
    });

    it('respects disabled prop', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button', { name: /disabled/i })).toBeDisabled();
    });
  });

  describe('Badge', () => {
    it('renders with correct variant', () => {
      render(<Badge variant="green">Active</Badge>);
      const badge = screen.getByText('Active');
      expect(badge.className).toContain('text-green-400');
    });
  });

  describe('PrompterControls', () => {
    it('renders play button, speed, font and opacity sliders', () => {
      render(
        <AppProvider>
          <PrompterControls />
        </AppProvider>
      );
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
      expect(screen.getByText(/speed/i)).toBeInTheDocument();
      expect(screen.getByText(/font/i)).toBeInTheDocument();
    });
  });
});
