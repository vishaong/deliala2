import { TrackingEvent } from '../../types';

interface TrackingEventListProps {
    events: Array<{ node: TrackingEvent }>;
}

export function TrackingEventList({ events }: TrackingEventListProps) {
    return (
        <div>
            <h3 style={{ marginBottom: '1rem' }}>이벤트 내역</h3>
            {events.length === 0 ? (
                <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#666',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px'
                }}>
                    이벤트 내역이 없습니다.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {events.map((edge, index) => (
                        <div
                            key={index}
                            style={{
                                backgroundColor: 'white',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                padding: '1.5rem'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <div style={{ fontWeight: '600', fontSize: '1.125rem' }}>
                                    {edge.node.status.name}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                                    {new Date(edge.node.time).toLocaleString('ko-KR')}
                                </div>
                            </div>
                            <div style={{ color: '#333', fontSize: '0.9375rem' }}>
                                {edge.node.description}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
