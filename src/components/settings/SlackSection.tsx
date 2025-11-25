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
            </div>
        </section>
    );
}
