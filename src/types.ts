export interface Credentials {
  clientId: string;
  clientSecret: string;
}

export interface Carrier {
  name: string;
  code: string;
}

export interface TrackingEvent {
  time: string;
  status: {
    code: string;
    name: string;
  };
  description: string;
}

export interface TrackInfo {
  lastEvent: TrackingEvent;
  events: {
    edges: Array<{
      node: TrackingEvent;
    }>;
  };
}

export interface TrackResponse {
  data: {
    track: TrackInfo;
  };
}

export interface Tracking {
  id: string;
  carrierId: string;
  carrierName: string;
  trackingNumber: string;
  lastStatus?: {
    code: string;
    name: string;
    time: string;
    description: string;
  };
}

