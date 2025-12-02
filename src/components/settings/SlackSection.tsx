import React, { useState } from 'react';

interface SlackSectionProps {
    webhookUrl: string;
    onWebhookUrlChange: (value: string) => void;
    onTest: () => void;
    isTesting: boolean;
}

export function SlackSection({
    webhookUrl,
    onWebhookUrlChange,
    onTest,
    isTesting
}: SlackSectionProps) {
    const [testingNotification, setTestingNotification] = useState<string | null>(null);
    const [testError, setTestError] = useState<string>('');
    const [testSuccess, setTestSuccess] = useState<string>('');

    const handleDetailedTest = async (type: 'delay' | 'start' | 'complete' | 'exception') => {
        if (!webhookUrl.trim()) {
            setTestError('슬랙 웹후크 URL을 먼저 입력해주세요.');
            return;
        }

        setTestingNotification(type);
        setTestError('');
        setTestSuccess('');

        try {
            const { testShippingDelayNotification, testShippingStartNotification, testDeliveryCompleteNotification, testDeliveryExceptionNotification } = await import('../../utils/monitoring');

            switch (type) {
                case 'delay':
                    await testShippingDelayNotification(webhookUrl);
                    setTestSuccess('미출고 알림 테스트가 완료되었습니다!');
                    break;
                case 'start':
                    await testShippingStartNotification(webhookUrl);
                    setTestSuccess('출고 알림 테스트가 완료되었습니다!');
                    break;
                case 'complete':
                    await testDeliveryCompleteNotification(webhookUrl);
                    setTestSuccess('배송완료 알림 테스트가 완료되었습니다!');
                    break;
                case 'exception':
                    await testDeliveryExceptionNotification(webhookUrl);
                    setTestSuccess('배송예외 알림 테스트가 완료되었습니다!');
                    break;
            }
        } catch (err) {
            setTestError(err instanceof Error ? err.message : '테스트에 실패했습니다.');
        } finally {
            setTestingNotification(null);
        }
    };

    return (
        <section style={{
            backgroundColor: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '8px'
        }}>
            <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>슬랙 알림 설정</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <label htmlFor="slackWebhookUrl" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        슬랙 웹후크 URL
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            id="slackWebhookUrl"
                            type="url"
                            value={webhookUrl}
                            onChange={(e) => onWebhookUrlChange(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem'
                            }}
                            placeholder="https://hooks.slack.com/services/..."
                        />
                        <button
                            type="button"
                            onClick={onTest}
                            disabled={isTesting || !webhookUrl.trim()}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: isTesting || !webhookUrl.trim() ? '#ccc' : '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                cursor: isTesting || !webhookUrl.trim() ? 'not-allowed' : 'pointer',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {isTesting ? '전송 중...' : '테스트 전송'}
                        </button>
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        상세 알림 테스트 (개발자용)
                    </label>
                    <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                        48시간 경과 없이 각 알림 타입을 즉시 테스트합니다. 브라우저 개발자 도구(F12) 콘솔에서 로그를 확인할 수 있습니다.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={() => handleDetailedTest('delay')}
                            disabled={testingNotification !== null || !webhookUrl.trim()}
                            style={{
                                padding: '0.75rem',
                                backgroundColor: testingNotification === 'delay' ? '#ffc107' : !webhookUrl.trim() ? '#ccc' : '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.9rem',
                                cursor: testingNotification !== null || !webhookUrl.trim() ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {testingNotification === 'delay' ? '테스트 중...' : '⚠️ 미출고 알림'}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDetailedTest('start')}
                            disabled={testingNotification !== null || !webhookUrl.trim()}
                            style={{
                                padding: '0.75rem',
                                backgroundColor: testingNotification === 'start' ? '#ffc107' : !webhookUrl.trim() ? '#ccc' : '#0dcaf0',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.9rem',
                                cursor: testingNotification !== null || !webhookUrl.trim() ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {testingNotification === 'start' ? '테스트 중...' : '📦 출고 알림'}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDetailedTest('complete')}
                            disabled={testingNotification !== null || !webhookUrl.trim()}
                            style={{
                                padding: '0.75rem',
                                backgroundColor: testingNotification === 'complete' ? '#ffc107' : !webhookUrl.trim() ? '#ccc' : '#198754',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.9rem',
                                cursor: testingNotification !== null || !webhookUrl.trim() ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {testingNotification === 'complete' ? '테스트 중...' : '✅ 배송완료 알림'}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDetailedTest('exception')}
                            disabled={testingNotification !== null || !webhookUrl.trim()}
                            style={{
                                padding: '0.75rem',
                                backgroundColor: testingNotification === 'exception' ? '#ffc107' : !webhookUrl.trim() ? '#ccc' : '#fd7e14',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.9rem',
                                cursor: testingNotification !== null || !webhookUrl.trim() ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {testingNotification === 'exception' ? '테스트 중...' : '🚨 배송예외 알림'}
                        </button>
                    </div>

                    {testError && (
                        <div style={{
                            marginTop: '0.5rem',
                            padding: '0.75rem',
                            backgroundColor: '#fee',
                            color: '#c33',
                            borderRadius: '4px',
                            fontSize: '0.9rem'
                        }}>
                            ❌ {testError}
                        </div>
                    )}

                    {testSuccess && (
                        <div style={{
                            marginTop: '0.5rem',
                            padding: '0.75rem',
                            backgroundColor: '#dfd',
                            color: '#3c3',
                            borderRadius: '4px',
                            fontSize: '0.9rem'
                        }}>
                            {testSuccess}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
