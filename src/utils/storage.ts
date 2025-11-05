import { Credentials, Tracking } from '../types';

const CREDENTIALS_KEY = 'delivery_tracker_credentials';
const TRACKINGS_KEY = 'delivery_tracker_trackings';

export const storage = {
  getCredentials(): Credentials | null {
    const stored = localStorage.getItem(CREDENTIALS_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  saveCredentials(credentials: Credentials): void {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
  },

  getTrackings(): Tracking[] {
    const stored = localStorage.getItem(TRACKINGS_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  },

  saveTrackings(trackings: Tracking[]): void {
    localStorage.setItem(TRACKINGS_KEY, JSON.stringify(trackings));
  },

  addTracking(tracking: Tracking): void {
    const trackings = this.getTrackings();
    trackings.push(tracking);
    this.saveTrackings(trackings);
  },

  updateTracking(id: string, updates: Partial<Tracking>): void {
    const trackings = this.getTrackings();
    const index = trackings.findIndex(t => t.id === id);
    if (index !== -1) {
      trackings[index] = { ...trackings[index], ...updates };
      this.saveTrackings(trackings);
    }
  },

  deleteTracking(id: string): void {
    const trackings = this.getTrackings();
    const filtered = trackings.filter(t => t.id !== id);
    this.saveTrackings(filtered);
  },
};

