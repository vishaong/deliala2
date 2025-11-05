import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../utils/storage';
import { CARRIERS } from '../constants/carriers';
import { Tracking } from '../types';
import { monitorAllTrackings, intervalToMs } from '../utils/monitoring';

export default function MainPage() {
  const navigate = useNavigate();
  const [trackings, setTrackings] = useState<Tracking[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState(CARRIERS[0].code);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const credentials = storage.getCredentials();
    if (!credentials) {
      navigate('/settings');
      return;
    }

    const savedTrackings = storage.getTrackings();
    // 기존 송장에 registeredAt이 없는 경우 현재 시간으로 설정
    const trackingsWithRegisteredAt = savedTrackings.map(tracking => {
      if (!tracking.registeredAt) {
        const updated = { ...tracking, registeredAt: new Date().toISOString() };
        storage.updateTracking(tracking.id, updated);
        return updated;
      }
      return tracking;
    });
    setTrackings(trackingsWithRegisteredAt);

    // 모니터링 서비스 시작
    const settings = storage.getNotificationSettings();
    if (settings) {
      const runMonitoring = async () => {
        await monitorAllTrackings(settings);
        // 모니터링 후 목록 새로고침
        const updatedTrackings = storage.getTrackings();
        setTrackings(updatedTrackings);
      };

      // 즉시 한 번 실행
      runMonitoring();

      // 주기적으로 실행
      const intervalMs = intervalToMs(settings.monitoringInterval);
      intervalRef.current = setInterval(runMonitoring, intervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [navigate]);

  // 여러 송장번호 파싱 (스페이스, 쉼표, 줄바꿈으로 구분)
  const parseTrackingNumbers = (input: string): string[] => {
    return input
      .split(/[\s,\n]+/)
      .map(num => num.trim())
      .filter(num => num.length > 0);
  };

  const handleAddTracking = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!trackingNumber.trim()) {
      setError('송장번호를 입력해주세요.');
      return;
    }

    const carrier = CARRIERS.find(c => c.code === selectedCarrier);
    if (!carrier) {
      setError('택배사를 선택해주세요.');
      return;
    }

    // 여러 송장번호 파싱
    const trackingNumbers = parseTrackingNumbers(trackingNumber);
    
    if (trackingNumbers.length === 0) {
      setError('유효한 송장번호를 입력해주세요.');
      return;
    }

    // 이미 등록된 송장번호 확인
    const existingNumbers = new Set(trackings.map(t => t.trackingNumber));
    const duplicates: string[] = [];
    const newNumbers: string[] = [];

    trackingNumbers.forEach(num => {
      if (existingNumbers.has(num)) {
        duplicates.push(num);
      } else {
        newNumbers.push(num);
      }
    });

    if (duplicates.length > 0) {
      setError(`다음 송장번호는 이미 등록되어 있습니다: ${duplicates.join(', ')}`);
      if (newNumbers.length === 0) {
        return;
      }
    }

    // 새 송장 등록
    const newTrackings: Tracking[] = newNumbers.map((num, index) => ({
      id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      carrierId: selectedCarrier,
      carrierName: carrier.name,
      trackingNumber: num,
      registeredAt: new Date().toISOString(),
    }));

    newTrackings.forEach(tracking => {
      storage.addTracking(tracking);
    });

    setTrackings([...trackings, ...newTrackings]);
    setTrackingNumber('');
    
    if (duplicates.length > 0 && newNumbers.length > 0) {
      setError(`일부 송장이 이미 등록되어 있습니다. ${newNumbers.length}개의 새 송장이 등록되었습니다.`);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteTracking = (id: string) => {
    if (window.confirm('이 송장을 삭제하시겠습니까?')) {
      storage.deleteTracking(id);
      setTrackings(trackings.filter(t => t.id !== id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === trackings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(trackings.map(t => t.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) {
      return;
    }

    const count = selectedIds.size;
    if (window.confirm(`선택한 ${count}개의 송장을 삭제하시겠습니까?`)) {
      selectedIds.forEach(id => {
        storage.deleteTracking(id);
      });
      setTrackings(trackings.filter(t => !selectedIds.has(t.id)));
      setSelectedIds(new Set());
    }
  };

  const handleTrackingClick = (id: string) => {
    navigate(`/tracking/${id}`);
  };

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: 'clamp(1rem, 4vw, 2rem)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>미출고 알람 서비스</h1>
          <button
            onClick={() => navigate('/settings')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              whiteSpace: 'nowrap'
            }}
          >
            설정
          </button>
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: 'clamp(1rem, 3vw, 1.5rem)', 
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: 'clamp(1.25rem, 3vw, 1.5rem)' }}>송장 등록</h2>
        <form onSubmit={handleAddTracking}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div>
              <label htmlFor="carrier" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9375rem' }}>
                택배사
              </label>
              <select
                id="carrier"
                value={selectedCarrier}
                onChange={(e) => setSelectedCarrier(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontFamily: 'inherit'
                }}
              >
                {CARRIERS.map(carrier => (
                  <option key={carrier.code} value={carrier.code}>
                    {carrier.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="trackingNumber" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9375rem' }}>
                송장번호 (여러 개 입력 가능)
              </label>
              <textarea
                id="trackingNumber"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
                placeholder="송장번호를 입력하세요 (스페이스, 쉼표, 줄바꿈으로 구분하여 여러 개 입력 가능)"
              />
              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                여러 송장번호를 스페이스, 쉼표, 또는 줄바꿈으로 구분하여 입력할 수 있습니다.
              </div>
            </div>

            <button
              type="submit"
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                cursor: 'pointer',
                fontWeight: '500',
                width: '100%',
                maxWidth: '200px'
              }}
            >
              등록
            </button>
          </div>
        </form>

        {error && (
          <div style={{ 
            marginTop: '1rem',
            padding: '0.75rem', 
            backgroundColor: '#fee', 
            color: '#c33',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}
      </div>

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
                onClick={handleSelectAll}
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
                  onClick={handleDeleteSelected}
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
            {trackings.map(tracking => {
              const isSelected = selectedIds.has(tracking.id);
              return (
                <div
                  key={tracking.id}
                  onClick={() => handleTrackingClick(tracking.id)}
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
                        onChange={() => {}}
                        onClick={handleToggleSelect.bind(null, tracking.id)}
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
                        handleDeleteTracking(tracking.id);
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}

