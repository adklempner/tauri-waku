import { describe, it, expect, vi } from 'vitest';

// Import the getRelyingPartyId function for testing
import { getRelyingPartyId } from '../credential/passkey';

describe('Passkey Relying Party ID', () => {
  it('should detect hostname appropriately', () => {
    // Mock window for localhost
    vi.stubGlobal('window', {
      location: {
        hostname: 'localhost',
        origin: 'http://localhost:5173'
      }
    });
    
    // Should return 'localhost' for local development
    expect(getRelyingPartyId()).toBe('localhost');
    
    // Mock window for production domain
    vi.stubGlobal('window', {
      location: {
        hostname: 'example.com',
        origin: 'https://example.com'
      }
    });
    
    // Should return the actual domain for production
    expect(getRelyingPartyId()).toBe('example.com');
    
    // Clean up
    vi.restoreAllMocks();
  });
}); 