interface CredentialsSectionProps {
    clientId: string;
    clientSecret: string;
    onClientIdChange: (value: string) => void;
    onClientSecretChange: (value: string) => void;
}

export function CredentialsSection({
    clientId,
    clientSecret,
    onClientIdChange,
    onClientSecretChange
}: CredentialsSectionProps) {
    return (
        <section style={{
            backgroundColor: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '8px'
        }}>
            <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>델리버리 트래커 크레덴셜</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <label htmlFor="clientId" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Client ID
                    </label>
                    <input
                        id="clientId"
                        type="text"
                        value={clientId}
                        onChange={(e) => onClientIdChange(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '1rem'
                        }}
                        placeholder="델리버리 트래커 Client ID를 입력하세요"
                    />
                </div>

                <div>
                    <label htmlFor="clientSecret" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Client Secret
                    </label>
                    <input
                        id="clientSecret"
                        type="password"
                        value={clientSecret}
                        onChange={(e) => onClientSecretChange(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '1rem'
                        }}
                        placeholder="델리버리 트래커 Client Secret을 입력하세요"
                    />
                </div>
            </div>
        </section>
    );
}
