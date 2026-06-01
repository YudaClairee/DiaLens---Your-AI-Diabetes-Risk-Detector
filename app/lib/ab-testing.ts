"use client";

import { useCallback, useEffect, useState } from 'react';

export type AbVariant = 'A' | 'B';

export type AbEventMetadata = Record<string, string | number | boolean>;

export interface AbTrackingEvent {
  event: string;
  variant: AbVariant;
  path: string;
  timestamp: string;
  metadata?: AbEventMetadata;
}

const AB_VARIANT_STORAGE_KEY = 'dialens_ab_variant';
const AB_EVENTS_STORAGE_KEY = 'dialens_ab_events';

const isAbVariant = (value: string | null): value is AbVariant => value === 'A' || value === 'B';

const getRandomVariant = (): AbVariant => (Math.random() < 0.5 ? 'A' : 'B');

const readStoredEvents = (): AbTrackingEvent[] => {
  try {
    const rawEvents = window.localStorage.getItem(AB_EVENTS_STORAGE_KEY);
    if (!rawEvents) return [];

    const parsedEvents: unknown = JSON.parse(rawEvents);
    return Array.isArray(parsedEvents) ? (parsedEvents as AbTrackingEvent[]) : [];
  } catch {
    return [];
  }
};

export const trackAbEvent = (
  event: string,
  variant: AbVariant,
  metadata?: AbEventMetadata
) => {
  if (typeof window === 'undefined') return;

  const trackingEvent: AbTrackingEvent = {
    event,
    variant,
    path: `${window.location.pathname}${window.location.search}`,
    timestamp: new Date().toISOString(),
    ...(metadata ? { metadata } : {}),
  };

  try {
    const events = readStoredEvents();
    events.push(trackingEvent);
    window.localStorage.setItem(AB_EVENTS_STORAGE_KEY, JSON.stringify(events.slice(-200)));
  } catch {
    // Tracking should never interrupt the user's screening flow.
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info('[DiaLens A/B]', trackingEvent);
  }
};

export const useAbVariant = () => {
  const [variant, setVariant] = useState<AbVariant>('A');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applyVariant = (nextVariant: AbVariant) => {
      window.queueMicrotask(() => setVariant(nextVariant));
    };

    const searchParams = new URLSearchParams(window.location.search);
    const forcedVariant = searchParams.get('ab');

    if (isAbVariant(forcedVariant)) {
      applyVariant(forcedVariant);
      try {
        window.localStorage.setItem(AB_VARIANT_STORAGE_KEY, forcedVariant);
      } catch {
        // Variant still applies for this page view even if storage is unavailable.
      }
      return;
    }

    try {
      const storedVariant = window.localStorage.getItem(AB_VARIANT_STORAGE_KEY);
      if (isAbVariant(storedVariant)) {
        applyVariant(storedVariant);
        return;
      }

      const randomVariant = getRandomVariant();
      window.localStorage.setItem(AB_VARIANT_STORAGE_KEY, randomVariant);
      applyVariant(randomVariant);
    } catch {
      applyVariant(getRandomVariant());
    }
  }, []);

  const track = useCallback(
    (event: string, metadata?: AbEventMetadata) => {
      trackAbEvent(event, variant, metadata);
    },
    [variant]
  );

  return { variant, track };
};
