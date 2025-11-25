interface AutoDeleteSectionProps {
    autoDeleteCompleted: boolean;
    onAutoDeleteCompletedChange: (value: boolean) => void;
}

export function AutoDeleteSection({
    autoDeleteCompleted,
    onAutoDeleteCompletedChange
}: AutoDeleteSectionProps) {
    return (
        <section style={{
            backgroundColor: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '8px'
        }}>
            <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>자동 삭제 설정</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={autoDeleteCompleted}
                        onChange={(e) => onAutoDeleteCompletedChange(e.target.checked)}
                        style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                    />
                    <div>
                        <div style={{ fontWeight: '500' }}>배송 완료 후 자동 삭제</div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>
                            배송이 완료된 송장은 12시간 후에 자동으로 삭제됩니다.
                        </div>
                    </div>
                </label>
            </div>
        </section>
    );
}
