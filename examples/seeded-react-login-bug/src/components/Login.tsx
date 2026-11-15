import React, { useState } from 'react';

export interface UserSession {
  token: string;
  expiresAt: number;
}

// Buggy implementation: Does not await token refresh or check expiration before state commit
export const useAuthManager = () => {
  const [session, setSession] = useState<UserSession | null>(null);

  const refreshToken = async (): Promise<string> => {
    // Simulated token refresh endpoint
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`token_${Date.now()}`);
      }, 50);
    });
  };

  const handleLogin = async (username: string) => {
    // BUGGY: Omitting await causes race condition in asynchronous token validation
    const token = refreshToken(); // Should be: await refreshToken()
    setSession({
      token: token as unknown as string,
      expiresAt: Date.now() + 3600000
    });
  };

  return { session, handleLogin, refreshToken };
};

