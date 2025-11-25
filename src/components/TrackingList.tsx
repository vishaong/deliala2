import { Tracking } from '../types';
import { TrackingItem } from './TrackingItem';

interface TrackingListProps {
    trackings: Tracking[];
    selectedIds: Set<string>;
    onSelectAll: () => void;
    onDeleteSelected: () => void;
    onToggleSelect: (id: string, e: React.MouseEvent) => void;
    onDeleteTracking: (id: string) => void;
    onTrackingClick: (id: string) => void;
}

export function TrackingList({
    trackings,
    selectedIds,
    onSelectAll,
    onDeleteSelected,
    onToggleSelect,
    onDeleteTracking,
    onTrackingClick
}: TrackingListProps) {
    return (
        <div>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                marginBottom: '1rem'
            }}>
                <h2 style={{ margin: 0, fontSize: 'clamp(1.25rem, 3vw, 1.5rem)' }}>
                    등록된 송장 ({trackings.length}개)
                </h2>
                {trackings.length > 0 && (
                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={onSelectAll}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: selectedIds.size === trackings.length ? '#007bff' : '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {selectedIds.size === trackings.length ? '전체 해제' : '전체 선택'}
                        </button>
                        {selectedIds.size > 0 && (
                            <button
                                onClick={onDeleteSelected}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                선택 삭제 ({selectedIds.size})
                            </button>
                        )}
                    </div>
                )}
            </div>
            {trackings.length === 0 ? (
                <div style={{
                    padding: '3rem',
                    textAlign: 'center',
                    color: '#666',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px'
                }}>
                    등록된 송장이 없습니다.
                </div>
            ) : (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    {trackings.map(tracking => (
                        <TrackingItem
                            key={tracking.id}
                            tracking={tracking}
                            isSelected={selectedIds.has(tracking.id)}
                            onToggleSelect={onToggleSelect}
                            onDelete={onDeleteTracking}
                            onClick={onTrackingClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
