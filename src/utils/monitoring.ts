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

// 한국 배송사 출고 관련 상태 (한글)
const KOREAN_SHIPPING_START_KEYWORDS = [
  '출고',
  '집하',
  '배송중',
  '운송중',
  '픽업완료',
];

// 한국 배송사 배송 완료 관련 상태 (한글)
const KOREAN_DELIVERY_COMPLETE_KEYWORDS = [
  '배송완료',
  '완료',
  '인수',
];

// 한국 배송사 배송 예외 관련 상태 (한글)
const KOREAN_DELIVERY_EXCEPTION_KEYWORDS = [
  '반송',
  '지연',
  '예외',
  '미배달',
  '보류',
];

// 출고 여부 확인 (이벤트 내역에서 출고 관련 이벤트가 있는지 확인)
function hasShippingStarted(trackInfo: TrackInfo): boolean {
  // 마지막 이벤트가 출고 관련 상태인지 확인
  const lastEventStatus = trackInfo.lastEvent.status;
  const lastEventCode = lastEventStatus.code.toLowerCase();
  const lastEventName = lastEventStatus.name;

  // 영문 상태 코드 확인 (정확한 일치)
  if (SHIPPING_START_CODES.includes(lastEventCode)) {
    return true;
  }

  // 한글 상태명 확인
  if (KOREAN_SHIPPING_START_KEYWORDS.some(keyword => lastEventName.includes(keyword))) {
    return true;
  }

  // 이벤트 내역에서 출고 관련 이벤트 확인
  return trackInfo.events.edges.some(edge => {
    const eventCode = edge.node.status.code.toLowerCase();
    const eventName = edge.node.status.name;
    
    // 영문 상태 코드 확인 (정확한 일치)
    if (SHIPPING_START_CODES.includes(eventCode)) {
      return true;
    }

    // 한글 상태명 확인
    return KOREAN_SHIPPING_START_KEYWORDS.some(keyword => eventName.includes(keyword));
  });
}

// 배송 완료 여부 확인
function isDeliveryComplete(trackInfo: TrackInfo): boolean {
  const lastEventStatus = trackInfo.lastEvent.status;
  const lastEventCode = lastEventStatus.code.toLowerCase();
  const lastEventName = lastEventStatus.name;

  // 영문 상태 코드 확인 (정확한 일치)
  if (DELIVERY_COMPLETE_CODES.includes(lastEventCode)) {
    return true;
  }

  // 한글 상태명 확인
  return KOREAN_DELIVERY_COMPLETE_KEYWORDS.some(keyword => lastEventName.includes(keyword));
}

// 배송 예외 여부 확인
function isDeliveryException(trackInfo: TrackInfo): boolean {
  const lastEventStatus = trackInfo.lastEvent.status;
  const lastEventCode = lastEventStatus.code.toLowerCase();
  const lastEventName = lastEventStatus.name;

  // 영문 상태 코드 확인 (정확한 일치)
  if (DELIVERY_EXCEPTION_CODES.includes(lastEventCode)) {
    return true;
  }

  // 한글 상태명 확인
  return KOREAN_DELIVERY_EXCEPTION_KEYWORDS.some(keyword => lastEventName.includes(keyword));
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

// 알림 전송 헬퍼 함수
async function sendNotification(
  settings: NotificationSettings,
  type: 'shipping_delay' | 'shipping_start' | 'delivery_complete' | 'delivery_exception',
  tracking: Tracking,
  status: string,
  description: string
) {
  const message = formatSlackMessage(
    type,
    tracking.carrierName,
    tracking.trackingNumber,
    status,
    description
  );
  await sendSlackMessage(settings.slackWebhookUrl, message);
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
      await sendNotification(
        settings,
        'shipping_delay',
        tracking,
        info.lastEvent.status.name,
        info.lastEvent.description
      );
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
      await sendNotification(
        settings,
        'shipping_start',
        tracking,
        info.lastEvent.status.name,
        info.lastEvent.description
      );
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
      await sendNotification(
        settings,
        'delivery_complete',
        tracking,
        info.lastEvent.status.name,
        info.lastEvent.description
      );
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
      await sendNotification(
        settings,
        'delivery_exception',
        tracking,
        info.lastEvent.status.name,
        info.lastEvent.description
      );
      updatedTracking.notifiedDeliveryException = true;
      shouldUpdate = true;
    }

    // 업데이트가 있으면 저장
    if (shouldUpdate || !tracking.lastStatus) {
      storage.updateTracking(tracking.id, updatedTracking);
    }
  } catch (error) {
    console.error(`송장 ${tracking.trackingNumber} 모니터링 오류:`, error);

    // 오류 발생 시에도 48시간 경과 체크 (미출고 알림)
    if (
      hasSlackWebhook &&
      settings.notifyOnShippingDelay &&
      !tracking.notifiedShippingDelay &&
      is48HoursPassed(tracking.registeredAt)
    ) {
      try {
        await sendNotification(
          settings,
          'shipping_delay',
          tracking,
          '정보 없음 (API 오류)',
          '등록 후 48시간이 지났으나 배송 정보를 확인할 수 없습니다. (아직 출고되지 않았거나 송장번호가 잘못되었을 수 있습니다.)'
        );

        storage.updateTracking(tracking.id, {
          notifiedShippingDelay: true,
          lastCheckedAt: new Date().toISOString(),
        });
        return;
      } catch (notifyError) {
        console.error('오류 발생 시 알림 전송 실패:', notifyError);
      }
    }

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

/**
 * ===== 테스트 모드 함수들 (개발자 도구에서 테스트용) =====
 * 브라우저 개발자 도구 콘솔에서 다음과 같이 호출:
 * - window.testShippingDelayNotification()
 * - window.testShippingStartNotification()
 * - window.testDeliveryCompleteNotification()
 */

// 미출고 상태를 가진 목 트래킹 데이터
export function createMockNotShippedTracking(): Tracking {
  return {
    id: `test-not-shipped-${Date.now()}`,
    carrierId: 'kr.cj',
    carrierName: 'CJ대한통운',
    trackingNumber: `TEST-${Date.now()}`,
    registeredAt: new Date(Date.now() - 49 * 60 * 60 * 1000).toISOString(), // 49시간 전 등록
    notifiedShippingDelay: false,
  };
}

// 출고 상태를 가진 목 트래킹 데이터
export function createMockShippedTracking(): Tracking {
  return {
    id: `test-shipped-${Date.now()}`,
    carrierId: 'kr.cj',
    carrierName: 'CJ대한통운',
    trackingNumber: `TEST-${Date.now()}`,
    registeredAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25시간 전 등록
    notifiedShippingStart: false,
  };
}

// 배송완료 상태를 가진 목 트래킹 데이터
export function createMockDeliveredTracking(): Tracking {
  return {
    id: `test-delivered-${Date.now()}`,
    carrierId: 'kr.cj',
    carrierName: 'CJ대한통운',
    trackingNumber: `TEST-${Date.now()}`,
    registeredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3일 전 등록
    completedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5시간 전 배송완료
    notifiedDeliveryComplete: false,
  };
}

// 배송지연/예외 상태를 가진 목 트래킹 데이터
export function createMockDelayedTracking(): Tracking {
  return {
    id: `test-delayed-${Date.now()}`,
    carrierId: 'kr.cj',
    carrierName: 'CJ대한통운',
    trackingNumber: `TEST-${Date.now()}`,
    registeredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3일 전 등록
    notifiedDeliveryException: false,
  };
}

// 미출고 상태 목 API 응답
export function createMockTrackInfoNotShipped(): TrackInfo {
  return {
    lastEvent: {
      time: new Date().toISOString(),
      status: {
        code: 'order_placed',
        name: '주문 접수',
      },
      description: '상품이 준비 중입니다.',
    },
    events: {
      edges: [
        {
          node: {
            time: new Date().toISOString(),
            status: {
              code: 'order_placed',
              name: '주문 접수',
            },
            description: '상품이 준비 중입니다.',
          },
        },
      ],
    },
  };
}

// 출고 상태 목 API 응답
export function createMockTrackInfoShipped(): TrackInfo {
  return {
    lastEvent: {
      time: new Date().toISOString(),
      status: {
        code: 'in_transit',
        name: '배송중',
      },
      description: '상품이 배송 중입니다.',
    },
    events: {
      edges: [
        {
          node: {
            time: new Date().toISOString(),
            status: {
              code: 'in_transit',
              name: '배송중',
            },
            description: '상품이 배송 중입니다.',
          },
        },
        {
          node: {
            time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            status: {
              code: 'shipped',
              name: '출고',
            },
            description: '상품이 출고되었습니다.',
          },
        },
      ],
    },
  };
}

// 배송완료 상태 목 API 응답
export function createMockTrackInfoDelivered(): TrackInfo {
  return {
    lastEvent: {
      time: new Date().toISOString(),
      status: {
        code: 'delivered',
        name: '배송완료',
      },
      description: '배송이 완료되었습니다.',
    },
    events: {
      edges: [
        {
          node: {
            time: new Date().toISOString(),
            status: {
              code: 'delivered',
              name: '배송완료',
            },
            description: '배송이 완료되었습니다.',
          },
        },
      ],
    },
  };
}

// 배송지연/예외 상태 목 API 응답
export function createMockTrackInfoDelayed(): TrackInfo {
  return {
    lastEvent: {
      time: new Date().toISOString(),
      status: {
        code: 'delayed',
        name: '배송지연',
      },
      description: '배송이 지연되고 있습니다.',
    },
    events: {
      edges: [
        {
          node: {
            time: new Date().toISOString(),
            status: {
              code: 'delayed',
              name: '배송지연',
            },
            description: '배송이 지연되고 있습니다.',
          },
        },
      ],
    },
  };
}

/**
 * 미출고 알림 테스트 (48시간 경과 + 미출고 상태)
 */
export async function testShippingDelayNotification(slackWebhookUrl: string): Promise<void> {
  const tracking = createMockNotShippedTracking();
  const trackInfo = createMockTrackInfoNotShipped();
  const settings: NotificationSettings = {
    slackWebhookUrl,
    monitoringInterval: '30분',
    notifyOnShippingDelay: true,
    notifyOnShippingStart: false,
    notifyOnDeliveryComplete: false,
    notifyOnDeliveryException: false,
    autoDeleteCompleted: true,
  };

  try {
    // 48시간 경과 확인
    const registered = new Date(tracking.registeredAt);
    const now = new Date();
    const diffHours = (now.getTime() - registered.getTime()) / (1000 * 60 * 60);
    console.log(`⏱️ 시간 경과: ${diffHours.toFixed(1)}시간`);

    // 출고 여부 확인
    const isShipped = hasShippingStarted(trackInfo);
    console.log(`📦 출고 상태: ${isShipped ? '출고됨' : '미출고'}`);

    if (!isShipped && diffHours >= 48) {
      const message = formatSlackMessage(
        'shipping_delay',
        tracking.carrierName,
        tracking.trackingNumber,
        trackInfo.lastEvent.status.name,
        trackInfo.lastEvent.description
      );
      console.log('📤 슬랙 메시지를 전송합니다:');
      console.log(message);
      await sendSlackMessage(slackWebhookUrl, message);
      console.log('✅ 미출고 알림 전송 완료!');
    } else {
      if (isShipped) {
        console.log('❌ 이미 출고되었습니다.');
      }
      if (diffHours < 48) {
        console.log(`❌ 아직 48시간이 경과하지 않았습니다. (${diffHours.toFixed(1)}시간)`);
      }
    }
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    throw error;
  }
}

/**
 * 출고 알림 테스트
 */
export async function testShippingStartNotification(slackWebhookUrl: string): Promise<void> {
  const tracking = createMockShippedTracking();
  const trackInfo = createMockTrackInfoShipped();
  const settings: NotificationSettings = {
    slackWebhookUrl,
    monitoringInterval: '30분',
    notifyOnShippingDelay: true,
    notifyOnShippingStart: true,
    notifyOnDeliveryComplete: false,
    notifyOnDeliveryException: false,
    autoDeleteCompleted: true,
  };

  try {
    const isShipped = hasShippingStarted(trackInfo);
    console.log(`📦 출고 상태: ${isShipped ? '출고됨' : '미출고'}`);

    if (isShipped && !tracking.notifiedShippingStart) {
      const message = formatSlackMessage(
        'shipping_start',
        tracking.carrierName,
        tracking.trackingNumber,
        trackInfo.lastEvent.status.name,
        trackInfo.lastEvent.description
      );
      console.log('📤 슬랙 메시지를 전송합니다:');
      console.log(message);
      await sendSlackMessage(slackWebhookUrl, message);
      console.log('✅ 출고 알림 전송 완료!');
    } else {
      console.log('❌ 출고되지 않았거나 이미 알림이 전송되었습니다.');
    }
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    throw error;
  }
}

/**
 * 배송완료 알림 테스트
 */
export async function testDeliveryCompleteNotification(slackWebhookUrl: string): Promise<void> {
  const tracking = createMockDeliveredTracking();
  const trackInfo = createMockTrackInfoDelivered();
  const settings: NotificationSettings = {
    slackWebhookUrl,
    monitoringInterval: '30분',
    notifyOnShippingDelay: true,
    notifyOnShippingStart: false,
    notifyOnDeliveryComplete: true,
    notifyOnDeliveryException: false,
    autoDeleteCompleted: true,
  };

  try {
    const isComplete = isDeliveryComplete(trackInfo);
    console.log(`📬 배송 완료: ${isComplete ? '완료됨' : '미완료'}`);

    if (isComplete && !tracking.notifiedDeliveryComplete) {
      const message = formatSlackMessage(
        'delivery_complete',
        tracking.carrierName,
        tracking.trackingNumber,
        trackInfo.lastEvent.status.name,
        trackInfo.lastEvent.description
      );
      console.log('📤 슬랙 메시지를 전송합니다:');
      console.log(message);
      await sendSlackMessage(slackWebhookUrl, message);
      console.log('✅ 배송완료 알림 전송 완료!');
    } else {
      console.log('❌ 배송이 완료되지 않았거나 이미 알림이 전송되었습니다.');
    }
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    throw error;
  }
}

/**
 * 배송 예외 알림 테스트
 */
export async function testDeliveryExceptionNotification(slackWebhookUrl: string): Promise<void> {
  const tracking = createMockDelayedTracking();
  const trackInfo = createMockTrackInfoDelayed();
  const settings: NotificationSettings = {
    slackWebhookUrl,
    monitoringInterval: '30분',
    notifyOnShippingDelay: true,
    notifyOnShippingStart: false,
    notifyOnDeliveryComplete: false,
    notifyOnDeliveryException: true,
    autoDeleteCompleted: true,
  };

  try {
    const isException = isDeliveryException(trackInfo);
    console.log(`⚠️ 배송 예외: ${isException ? '예외 발생' : '정상'}`);

    if (isException && !tracking.notifiedDeliveryException) {
      const message = formatSlackMessage(
        'delivery_exception',
        tracking.carrierName,
        tracking.trackingNumber,
        trackInfo.lastEvent.status.name,
        trackInfo.lastEvent.description
      );
      console.log('📤 슬랙 메시지를 전송합니다:');
      console.log(message);
      await sendSlackMessage(slackWebhookUrl, message);
      console.log('✅ 배송예외 알림 전송 완료!');
    } else {
      console.log('❌ 배송 예외가 아니거나 이미 알림이 전송되었습니다.');
    }
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    throw error;
  }
}

// 전역 window 객체에 테스트 함수 추가 (개발 모드에서만)
if (import.meta.env.DEV) {
  (window as any).testShippingDelayNotification = async () => {
    const settings = storage.getNotificationSettings();
    if (!settings?.slackWebhookUrl) {
      console.error('❌ 슬랙 웹후크 URL이 설정되지 않았습니다. 설정 페이지에서 설정해주세요.');
      return;
    }
    await testShippingDelayNotification(settings.slackWebhookUrl);
  };

  (window as any).testShippingStartNotification = async () => {
    const settings = storage.getNotificationSettings();
    if (!settings?.slackWebhookUrl) {
      console.error('❌ 슬랙 웹후크 URL이 설정되지 않았습니다. 설정 페이지에서 설정해주세요.');
      return;
    }
    await testShippingStartNotification(settings.slackWebhookUrl);
  };

  (window as any).testDeliveryCompleteNotification = async () => {
    const settings = storage.getNotificationSettings();
    if (!settings?.slackWebhookUrl) {
      console.error('❌ 슬랙 웹후크 URL이 설정되지 않았습니다. 설정 페이지에서 설정해주세요.');
      return;
    }
    await testDeliveryCompleteNotification(settings.slackWebhookUrl);
  };

  (window as any).testDeliveryExceptionNotification = async () => {
    const settings = storage.getNotificationSettings();
    if (!settings?.slackWebhookUrl) {
      console.error('❌ 슬랙 웹후크 URL이 설정되지 않았습니다. 설정 페이지에서 설정해주세요.');
      return;
    }
    await testDeliveryExceptionNotification(settings.slackWebhookUrl);
  };
}
