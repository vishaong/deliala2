interface NotificationSectionProps {
    notifyOnShippingDelay: boolean;
    onNotifyOnShippingDelayChange: (value: boolean) => void;
    notifyOnShippingStart: boolean;
    onNotifyOnShippingStartChange: (value: boolean) => void;
    notifyOnDeliveryComplete: boolean;
    onNotifyOnDeliveryCompleteChange: (value: boolean) => void;
    notifyOnDeliveryException: boolean;
    onNotifyOnDeliveryExceptionChange: (value: boolean) => void;
}

export function NotificationSection({
    notifyOnShippingDelay,
    onNotifyOnShippingDelayChange,
    notifyOnShippingStart,
    onNotifyOnShippingStartChange,
    notifyOnDeliveryComplete,
    onNotifyOnDeliveryCompleteChange,
    notifyOnDeliveryException,
    onNotifyOnDeliveryExceptionChange
}: NotificationSectionProps) {
    return (
        <section style={{
            backgroundColor: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '8px'
        }}>
            <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>알림 옵션</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={notifyOnShippingDelay}
                        onChange={(e) => onNotifyOnShippingDelayChange(e.target.checked)}
                        style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                    />
                    <div>
                        <div style={{ fontWeight: '500' }}>출고지연 시 알림</div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>
                            등록 후 48시간 이내 미출고 시 알림을 받습니다 (가장 중요)
                        </div>
                    </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={notifyOnShippingStart}
                        onChange={(e) => onNotifyOnShippingStartChange(e.target.checked)}
                        style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                    />
                    <div>
                        <div style={{ fontWeight: '500' }}>출고 시 알림</div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>
                            배송이 시작되면 알림을 받습니다.
                        </div>
                    </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={notifyOnDeliveryComplete}
                        onChange={(e) => onNotifyOnDeliveryCompleteChange(e.target.checked)}
                        style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                    />
                    <div>
                        <div style={{ fontWeight: '500' }}>배송 완료 시 알림</div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>
                            배송이 완료되면 알림을 받습니다.
                        </div>
                    </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={notifyOnDeliveryException}
                        onChange={(e) => onNotifyOnDeliveryExceptionChange(e.target.checked)}
                        style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                    />
                    <div>
                        <div style={{ fontWeight: '500' }}>배송 예외 시 알림</div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>
                            반송, 지연 등의 예외가 발생하면 알림을 받습니다.
                        </div>
                    </div>
                </label>
            </div>
        </section>
    );
}
