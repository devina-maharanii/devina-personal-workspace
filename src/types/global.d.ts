declare global {
  interface Window {
    __FORCE_MOCK_AUTH__?: boolean;
  }
}

export {};
