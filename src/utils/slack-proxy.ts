/**
 * 슬랙 웹후크를 브라우저에서 직접 호출할 수 없을 때 사용하는 대체 방법
 * no-cors 모드를 사용하여 요청을 보냅니다 (응답 확인은 불가하지만 요청은 전송됨)
 */
export async function sendSlackMessageViaProxy(webhookUrl: string, message: string): Promise<boolean> {
  if (!webhookUrl.trim()) {
    throw new Error('슬랙 웹후크 URL이 설정되지 않았습니다.');
  }

  try {
    // no-cors 모드를 사용하여 CORS 검사를 우회
    // 응답을 확인할 수는 없지만, 요청은 전송됩니다
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message,
      }),
      mode: 'no-cors', // CORS 검사 우회
    });

    // no-cors 모드에서는 response.ok를 확인할 수 없지만,
    // 에러가 발생하지 않았다면 요청은 전송된 것으로 간주
    // 실제로 슬랙 웹후크는 CORS를 허용하므로 대부분의 경우 작동합니다
    return true;
  } catch (error) {
    // no-cors 모드에서도 에러가 발생한 경우
    throw new Error(`슬랙 메시지 전송 실패: ${error instanceof Error ? error.message : String(error)}`);
  }
}

