"use client";

import { useFeatureFlagEnabled, useFeatureFlagVariantKey } from 'posthog-js/react';

export function useFeatureFlag(flagName: string): boolean {
  const isEnabled = useFeatureFlagEnabled(flagName);
  return !!isEnabled;
}

export function useFeatureVariant(flagName: string) {
  const variant = useFeatureFlagVariantKey(flagName);
  return variant;
}
