import { Credentials, Tracking } from '../types';
import { registerTrackWebhook } from './api';

/**
 * 델리버리 트래커 웹후크 등록
 * 브라우저 환경에서는 콜백 URL을 제공할 수 없으므로,
 * 웹후크 등록은 하되 실제 콜백 처리는 주기적 모니터링으로 대체합니다.
 */
export async function registerDeliveryTrackerWebhook(
  credentials: Credentials,
  tracking: Tracking
): Promise<void> {
  // 브라우저 환경에서는 공개 콜백 URL을 제공할 수 없으므로
  // 웹후크 등록은 하지 않고, 주기적 모니터링으로 대체합니다.
  // 만약 서버 환경이 있다면 여기서 웹후크를 등록할 수 있습니다.
  
  // 현재는 웹후크 등록을 시도하지 않고, 모니터링으로만 처리합니다.
  // 서버 환경이 구축되면 아래 코드를 활성화할 수 있습니다:
  
  /*
  try {
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 48); // 48시간 후 만료
    
    // 서버의 콜백 URL (예: https://your-server.com/api/webhook)
    const callbackUrl = `${window.location.origin}/api/webhook`;
    
    await registerTrackWebhook(
      credentials,
      tracking.carrierId,
      tracking.trackingNumber,
      callbackUrl,
      expirationTime.toISOString()
    );
    
    // 웹후크 등록 성공 시 추적 정보 업데이트
    return {
      ...tracking,
      webhookRegistered: true,
      webhookExpirationTime: expirationTime.toISOString(),
    };
  } catch (error) {
    console.error('웹후크 등록 실패:', error);
    throw error;
  }
  */
}

/**
 * 웹후크 만료 시간 갱신 (Keep Alive)
 * 24시간마다 호출하여 웹후크를 계속 유지합니다.
 */
export async function refreshWebhookExpiration(
  credentials: Credentials,
  tracking: Tracking
): Promise<void> {
  if (!tracking.webhookRegistered) {
    return;
  }

  // 만료 시간이 24시간 이내로 남았으면 갱신
  if (tracking.webhookExpirationTime) {
    const expirationTime = new Date(tracking.webhookExpirationTime);
    const now = new Date();
    const hoursUntilExpiration = (expirationTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilExpiration > 24) {
      return; // 아직 24시간 이상 남았음
    }
  }

  // 웹후크 갱신 (48시간 연장)
  const newExpirationTime = new Date();
  newExpirationTime.setHours(newExpirationTime.getHours() + 48);

  // 서버 환경이 있다면 여기서 웹후크를 갱신할 수 있습니다.
  // 현재는 브라우저 환경이므로 모니터링으로만 처리합니다.
}

