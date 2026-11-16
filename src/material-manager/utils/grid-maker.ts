import type { GridContext } from "../types/generic-types";

export const makeGrid = (size: number, segments: number): GridContext => ({
  size,
  segments,
  segmentSize: size / segments,
});

const defaultSize = 50;
const defaultSegments = 200;

// Helper function to read URL parameters and set defaults in the URL if missing
const getOrSetUrlParam = (key: string, defaultValue: number): number => {
  if (typeof window === "undefined") return defaultValue;

  const params = new URLSearchParams(window.location.search);
  const value = params.get(key);
  const parsed = value ? parseFloat(value) : NaN;

  if (isNaN(parsed)) {
    // If the parameter is missing, set it to the default value
    params.set(key, defaultValue.toString());
    
    // Update the browser URL without triggering a page reload
    const newRelativePathQuery = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    window.history.replaceState(null, "", newRelativePathQuery);

    return defaultValue;
  }

  return parsed;
};

export const GRID = makeGrid(
  getOrSetUrlParam("size", defaultSize),
  getOrSetUrlParam("segments", defaultSegments)
);