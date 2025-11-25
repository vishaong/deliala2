interface TrackingHeaderProps {
    carrierName: string;
    trackingNumber: string;
}

export function TrackingHeader({ carrierName, trackingNumber }: TrackingHeaderProps) {
    return (
        <div style={{
            backgroundColor: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem'
        }}>
            <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#666' }}>택배사: </span>
                <strong>{carrierName}</strong>
            </div>
            <div>
                <span style={{ color: '#666' }}>송장번호: </span>
                <strong>{trackingNumber}</strong>
            </div>
        </div>
    );
}
