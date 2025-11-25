import { TrackingEvent } from '../../types';

interface TrackingStatusCardProps {
    lastEvent: TrackingEvent;
}

export function TrackingStatusCard({ lastEvent }: TrackingStatusCardProps) {
    return (
        <div style={{
            backgroundColor: '#e7f3ff',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            borderLeft: '4px solid #007bff'
        }}>
            <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                최신 상태
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                {lastEvent.status.name}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                {new Date(lastEvent.time).toLocaleString('ko-KR')}
            </div>
            <div style={{ color: '#333' }}>
                {lastEvent.description}
            </div>
        </div>
    );
}
