import { Tracking, NotificationSettings, TrackInfo } from '../types';
import { track } from './api';
import { sendSlackMessage, formatSlackMessage } from './slack';
import { storage } from './storage';

// 모니터링 주기를 밀리초로 변환
export function intervalToMs(interval: string): number {
  const match = interval.match(/(\d+)(분|시간)/);
  if (!match) return 30 * 60 * 1000; // 기본값 30분

  const value = parseInt(match[1], 10);
  const unit = match[2];

  if (unit === '분') {
    return value * 60 * 1000;
  } else if (unit === '시간') {
    return value * 60 * 60 * 1000;
  }

  return 30 * 60 * 1000;
}

// 출고 상태 코드 확인 (일반적인 출고 상태 코드)
const SHIPPING_START_CODES = [
  'in_transit',
  'out_for_delivery',
  'shipped',
  'picked_up',
  'departed',
];

// 배송 완료 상태 코드
const DELIVERY_COMPLETE_CODES = [
  'delivered',
  'delivery_complete',
  'completed',
];

// 배송 예외 상태 코드
const DELIVERY_EXCEPTION_CODES = [
  'exception',
  'returned',
  'undelivered',
  'delayed',
  'exception_return',
  'return',
];

// 출고 여부 확인 (이벤트 내역에서 출고 관련 이벤트가 있는지 확인)
function hasShippingStarted(trackInfo: TrackInfo): boolean {
  // 마지막 이벤트가 출고 관련 상태인지 확인
  if (SHIPPING_START_CODES.some(code => 
    trackInfo.lastEvent.status.code.toLowerCase().includes(code) ||
    trackInfo.lastEvent.status.name.includes('출고') ||
    trackInfo.lastEvent.status.name.includes('집하') ||
    trackInfo.lastEvent.status.name.includes('배송중') ||
    trackInfo.lastEvent.status.name.includes('운송중')
  )) {
    return true;
  }

  // 이벤트 내역에서 출고 관련 이벤트 확인
  return trackInfo.events.edges.some(edge => 
    SHIPPING_START_CODES.some(code => 
      edge.node.status.code.toLowerCase().includes(code) ||
      edge.node.status.name.includes('출고') ||
      edge.node.status.name.includes('집하') ||
      edge.node.status.name.includes('배송중') ||
      edge.node.status.name.includes('운송중')
    )
  );
}

// 배송 완료 여부 확인
function isDeliveryComplete(trackInfo: TrackInfo): boolean {
  return DELIVERY_COMPLETE_CODES.some(code => 
    trackInfo.lastEvent.status.code.toLowerCase().includes(code) ||
    trackInfo.lastEvent.status.name.includes('배송완료') ||
    trackInfo.lastEvent.status.name.includes('완료')
  );
}

// 배송 예외 여부 확인
function isDeliveryException(trackInfo: TrackInfo): boolean {
  return DELIVERY_EXCEPTION_CODES.some(code => 
    trackInfo.lastEvent.status.code.toLowerCase().includes(code) ||
    trackInfo.lastEvent.status.name.includes('반송') ||
    trackInfo.lastEvent.status.name.includes('지연') ||
    trackInfo.lastEvent.status.name.includes('예외') ||
    trackInfo.lastEvent.status.name.includes('미배달')
  );
}

// 48시간 경과 여부 확인
function is48HoursPassed(registeredAt: string): boolean {
  const registered = new Date(registeredAt);
  const now = new Date();
  const diffMs = now.getTime() - registered.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours >= 48;
}

// 12시간 경과 여부 확인
function is12HoursPassed(completedAt: string): boolean {
  const completed = new Date(completedAt);
  const now = new Date();
  const diffMs = now.getTime() - completed.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours >= 12;
}

// 단일 송장 모니터링
export async function monitorTracking(
  tracking: Tracking,
  settings: NotificationSettings
): Promise<void> {
  // 슬랙 웹후크 URL이 없으면 알림만 보내지 않고, 상태 업데이트는 계속 수행
  const hasSlackWebhook = settings.slackWebhookUrl.trim().length > 0;

  const credentials = storage.getCredentials();
  if (!credentials) {
    return;
  }

  try {
    const trackInfo = await track(
      credentials,
      tracking.carrierId,
      tracking.trackingNumber
    );

    const info = trackInfo.data.track;
    const now = new Date().toISOString();

    // 마지막 상태 업데이트
    const updatedTracking: Tracking = {
      ...tracking,
      lastStatus: {
        code: info.lastEvent.status.code,
        name: info.lastEvent.status.name,
        time: info.lastEvent.time,
        description: info.lastEvent.description,
      },
      lastCheckedAt: now,
    };

    // 알림 조건 확인 및 전송
    let shouldUpdate = false;

    // 1. 출고지연 알림 (48시간 경과 + 아직 출고 안됨)
    if (
      hasSlackWebhook &&
      settings.notifyOnShippingDelay &&
      !tracking.notifiedShippingDelay &&
      is48HoursPassed(tracking.registeredAt) &&
      !hasShippingStarted(info)
    ) {
      const message = formatSlackMessage(
        'shipping_delay',
        tracking.carrierName,
        tracking.trackingNumber,
        info.lastEvent.status.name,
        info.lastEvent.description
      );
      await sendSlackMessage(settings.slackWebhookUrl, message);
      updatedTracking.notifiedShippingDelay = true;
      shouldUpdate = true;
    }

    // 2. 출고 알림
    if (
      hasSlackWebhook &&
      settings.notifyOnShippingStart &&
      !tracking.notifiedShippingStart &&
      hasShippingStarted(info)
    ) {
      const message = formatSlackMessage(
        'shipping_start',
        tracking.carrierName,
        tracking.trackingNumber,
        info.lastEvent.status.name,
        info.lastEvent.description
      );
      await sendSlackMessage(settings.slackWebhookUrl, message);
      updatedTracking.notifiedShippingStart = true;
      shouldUpdate = true;
    }

    // 3. 배송 완료 감지 및 처리
    const isComplete = isDeliveryComplete(info);
    if (isComplete && !tracking.completedAt) {
      // 배송 완료 시간 설정
      updatedTracking.completedAt = info.lastEvent.time;
      shouldUpdate = true;
    }

    // 배송 완료 알림
    if (
      hasSlackWebhook &&
      settings.notifyOnDeliveryComplete &&
      !tracking.notifiedDeliveryComplete &&
      isComplete
    ) {
      const message = formatSlackMessage(
        'delivery_complete',
        tracking.carrierName,
        tracking.trackingNumber,
        info.lastEvent.status.name,
        info.lastEvent.description
      );
      await sendSlackMessage(settings.slackWebhookUrl, message);
      updatedTracking.notifiedDeliveryComplete = true;
      shouldUpdate = true;
    }

    // 4. 배송 예외 알림
    if (
      hasSlackWebhook &&
      settings.notifyOnDeliveryException &&
      !tracking.notifiedDeliveryException &&
      isDeliveryException(info)
    ) {
      const message = formatSlackMessage(
        'delivery_exception',
        tracking.carrierName,
        tracking.trackingNumber,
        info.lastEvent.status.name,
        info.lastEvent.description
      );
      await sendSlackMessage(settings.slackWebhookUrl, message);
      updatedTracking.notifiedDeliveryException = true;
      shouldUpdate = true;
    }

    // 업데이트가 있으면 저장
    if (shouldUpdate || !tracking.lastStatus) {
      storage.updateTracking(tracking.id, updatedTracking);
    }
  } catch (error) {
    console.error(`송장 ${tracking.trackingNumber} 모니터링 오류:`, error);
    // 오류 발생 시에도 마지막 조회 시간만 업데이트
    storage.updateTracking(tracking.id, {
      lastCheckedAt: new Date().toISOString(),
    });
  }
}

// 모든 송장 모니터링
export async function monitorAllTrackings(settings: NotificationSettings): Promise<void> {
  const trackings = storage.getTrackings();
  
  if (trackings.length === 0) {
    return;
  }

  // 배송 완료된 송장 중 12시간 경과된 것들 삭제
  if (settings.autoDeleteCompleted) {
    const toDelete: string[] = [];

    trackings.forEach(tracking => {
      if (tracking.completedAt && is12HoursPassed(tracking.completedAt)) {
        toDelete.push(tracking.id);
      }
    });

    // 삭제할 송장이 있으면 삭제
    if (toDelete.length > 0) {
      toDelete.forEach(id => {
        storage.deleteTracking(id);
      });
      console.log(`${toDelete.length}개의 배송 완료된 송장이 자동 삭제되었습니다.`);
    }
  }

  // 남은 송장들 모니터링
  const remainingTrackings = storage.getTrackings();
  
  // 병렬로 모든 송장 모니터링 (API Rate Limit 고려하여 순차 처리도 가능)
  for (const tracking of remainingTrackings) {
    await monitorTracking(tracking, settings);
    // API Rate Limit을 고려하여 약간의 지연 추가
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

