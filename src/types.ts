export interface Credentials {
  clientId: string;
  clientSecret: string;
}

export type MonitoringInterval = 
  | '5분'
  | '10분'
  | '30분'
  | '1시간'
  | '2시간'
  | '4시간'
  | '8시간'
  | '12시간'
  | '24시간';

export interface NotificationSettings {
  slackWebhookUrl: string;
  monitoringInterval: MonitoringInterval;
  notifyOnShippingDelay: boolean; // 출고지연 시 알림 (48시간 이내 미출고)
  notifyOnShippingStart: boolean; // 출고 시 알림
  notifyOnDeliveryComplete: boolean; // 배송 완료 시 알림
  notifyOnDeliveryException: boolean; // 배송 예외 시 알림
  autoDeleteCompleted: boolean; // 배송 완료 후 12시간 자동 삭제 (기본값: true)
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
  registeredAt: string; // 등록 시간 (ISO string)
  lastStatus?: {
    code: string;
    name: string;
    time: string;
    description: string;
  };
  lastCheckedAt?: string; // 마지막 조회 시간
  completedAt?: string; // 배송 완료 시간 (ISO string)
  webhookRegistered?: boolean; // 델리버리 트래커 웹후크 등록 여부
  webhookExpirationTime?: string; // 웹후크 만료 시간 (ISO string)
  notifiedShippingDelay?: boolean; // 출고지연 알림 전송 여부
  notifiedShippingStart?: boolean; // 출고 알림 전송 여부
  notifiedDeliveryComplete?: boolean; // 배송완료 알림 전송 여부
  notifiedDeliveryException?: boolean; // 배송예외 알림 전송 여부
}

