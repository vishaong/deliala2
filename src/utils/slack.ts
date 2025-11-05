import { sendSlackMessageViaProxy } from './slack-proxy';

export async function sendSlackMessage(webhookUrl: string, message: string): Promise<boolean> {
  if (!webhookUrl.trim()) {
    throw new Error('슬랙 웹후크 URL이 설정되지 않았습니다.');
  }

  try {
    // 개발 환경에서는 Vite 프록시를 사용
    const isDevelopment = import.meta.env.DEV;
    let targetUrl = webhookUrl;

    if (isDevelopment) {
      // 개발 환경: Vite 프록시 사용
      try {
        const url = new URL(webhookUrl);
        const pathAndQuery = url.pathname + (url.search || '');
        targetUrl = `/api/slack-proxy${pathAndQuery}`;
      } catch (e) {
        console.warn('슬랙 웹후크 URL 파싱 실패, 직접 호출 시도:', e);
        targetUrl = webhookUrl;
      }

      // 개발 환경에서는 프록시를 통해 호출
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`슬랙 메시지 전송 실패: ${response.status} ${errorText}`);
      }

      return true;
    } else {
      // 프로덕션 환경: 직접 호출 시도 후 실패 시 프록시 서비스 사용
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: message,
          }),
        });

        if (response.ok) {
          return true;
        }
      } catch (error) {
        // CORS 오류인 경우 프록시 서비스를 통해 재시도
        if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('CORS'))) {
          console.warn('직접 호출 실패, 프록시 서비스를 통해 재시도합니다.');
          return await sendSlackMessageViaProxy(webhookUrl, message);
        }
        throw error;
      }

      // 직접 호출이 실패한 경우 프록시 서비스 사용
      return await sendSlackMessageViaProxy(webhookUrl, message);
    }
  } catch (error) {
    // 최종 오류 처리
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('CORS'))) {
      throw new Error('슬랙 웹후크 URL에 접근할 수 없습니다. 네트워크 연결을 확인하거나 다른 방법을 시도해주세요.');
    }
    throw error;
  }
}

export function formatSlackMessage(
  type: 'shipping_delay' | 'shipping_start' | 'delivery_complete' | 'delivery_exception',
  carrierName: string,
  trackingNumber: string,
  status?: string,
  description?: string
): string {
  const emoji = {
    shipping_delay: '⚠️',
    shipping_start: '📦',
    delivery_complete: '✅',
    delivery_exception: '🚨',
  };

  const title = {
    shipping_delay: '출고 지연 알림',
    shipping_start: '출고 알림',
    delivery_complete: '배송 완료 알림',
    delivery_exception: '배송 예외 알림',
  };

  let message = `${emoji[type]} *${title[type]}*\n\n`;
  message += `택배사: ${carrierName}\n`;
  message += `송장번호: ${trackingNumber}\n`;

  if (status) {
    message += `상태: ${status}\n`;
  }

  if (description) {
    message += `설명: ${description}\n`;
  }

  if (type === 'shipping_delay') {
    message += `\n등록 후 48시간이 지났지만 아직 출고되지 않았습니다.`;
  }

  return message;
}

