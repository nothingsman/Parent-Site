import { afterEach } from 'vitest';

process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:4000';
process.env.NEXT_PUBLIC_API_TIMEOUT_MS = '10000';
process.env.NEXT_PUBLIC_ENABLE_MOCKS = 'true';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  document.body.innerHTML = '';
});
