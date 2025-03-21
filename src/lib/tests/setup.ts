// Setup file for Vitest tests

// Mock browser globals if needed
if (typeof window === 'undefined') {
  // Mock atob and btoa for Node.js environment
  global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
  global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
}

// Any other global test setup can go here 