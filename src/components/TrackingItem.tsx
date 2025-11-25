import { Tracking } from '../types';

interface TrackingItemProps {
    tracking: Tracking;
    isSelected: boolean;
    onToggleSelect: (id: string, e: React.MouseEvent) => void;
    onDelete: (id: string) => void;
    onClick: (id: string) => void;
}

export function TrackingItem({
    tracking,
    isSelected,
    onToggleSelect,
    onDelete,
    onClick
}: TrackingItemProps) {
    return (
        <div
            onClick={() => onClick(tracking.id)}
            style={{
                backgroundColor: isSelected ? '#e7f3ff' : 'white',
                border: isSelected ? '2px solid #007bff' : '1px solid #ddd',
                borderRadius: '8px',
                padding: 'clamp(1rem, 3vw, 1.5rem)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isSelected ? '0 4px 8px rgba(0,123,255,0.2)' : '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
                if (!isSelected) {
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                }
            }}
            onMouseLeave={(e) => {
                if (!isSelected) {
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                }
            }}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem',
                gap: '0.75rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => { }}
                        onClick={(e) => onToggleSelect(tracking.id, e)}
                        style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            cursor: 'pointer',
                            marginTop: '0.25rem',
                            flexShrink: 0
                        }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                            {tracking.carrierName}
                        </div>
                        <div style={{
                            fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
                            fontWeight: '600',
                            wordBreak: 'break-word'
                        }}>
                            {tracking.trackingNumber}
                        </div>
                    </div>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(tracking.id);
                    }}
                    style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        flexShrink: 0,
                        whiteSpace: 'nowrap'
                    }}
                >
                    삭제
                </button>
            </div>

            {tracking.lastStatus ? (
                <div>
                    <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                        마지막 상태
                    </div>
                    <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                        {tracking.lastStatus.name}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                        {new Date(tracking.lastStatus.time).toLocaleString('ko-KR')}
                    </div>
                </div>
            ) : (
                <div style={{ fontSize: '0.875rem', color: '#999' }}>
                    상태 정보 없음
                </div>
            )}
        </div>
    );
}
