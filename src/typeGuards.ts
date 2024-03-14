/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * Type guards for the types declanred in types.ts
 */

export const isGpsCoord = (obj: unknown): obj is GpsCoord => {
   return typeof obj === 'object' && obj !== null && 'lat' in obj && typeof obj.lat === 'number' && 'lng' in obj && typeof obj.lng === 'number';
};
