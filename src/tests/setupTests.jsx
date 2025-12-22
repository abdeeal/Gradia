import '@testing-library/jest-dom';
import { vi } from 'vitest';
import axios from 'axios';

// Mock axios global
vi.mock('axios');

// Mock fetch & localStorage
global.fetch = vi.fn();
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
};

// Mock media query, tapi JANGAN panggil implementasi di sini
vi.mock("react-responsive", () => ({
  useMediaQuery: vi.fn()
}));
