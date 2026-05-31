export function useIsMockAuth(): boolean {
  if (typeof window !== "undefined" && window.__FORCE_MOCK_AUTH__ === true) {
    return true;
  }

  return false;
}

export default useIsMockAuth;
