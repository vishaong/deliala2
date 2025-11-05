import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../utils/storage';
import { CARRIERS } from '../constants/carriers';
import { Tracking } from '../types';

export default function MainPage() {
  const navigate = useNavigate();
  const [trackings, setTrackings] = useState<Tracking[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState(CARRIERS[0].code);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const credentials = storage.getCredentials();
    if (!credentials) {
      navigate('/settings');
      return;
    }

    const savedTrackings = storage.getTrackings();
    setTrackings(savedTrackings);
  }, [navigate]);

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

    const newTracking: Tracking = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      carrierId: selectedCarrier,
      carrierName: carrier.name,
      trackingNumber: trackingNumber.trim(),
    };

    storage.addTracking(newTracking);
    setTrackings([...trackings, newTracking]);
    setTrackingNumber('');
  };

  const handleDeleteTracking = (id: string) => {
    if (window.confirm('이 송장을 삭제하시겠습니까?')) {
      storage.deleteTracking(id);
      setTrackings(trackings.filter(t => t.id !== id));
    }
  };

  const handleTrackingClick = (id: string) => {
    navigate(`/tracking/${id}`);
  };

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>미출고 알람 서비스</h1>
        <button
          onClick={() => navigate('/settings')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          설정
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '1.5rem', 
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>송장 등록</h2>
        <form onSubmit={handleAddTracking} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label htmlFor="carrier" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
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
                fontSize: '1rem'
              }}
            >
              {CARRIERS.map(carrier => (
                <option key={carrier.code} value={carrier.code}>
                  {carrier.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: '2', minWidth: '200px' }}>
            <label htmlFor="trackingNumber" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              송장번호
            </label>
            <input
              id="trackingNumber"
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="송장번호를 입력하세요"
            />
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
              whiteSpace: 'nowrap'
            }}
          >
            등록
          </button>
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
        <h2 style={{ marginBottom: '1rem' }}>등록된 송장</h2>
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
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '1rem' 
          }}>
            {trackings.map(tracking => (
              <div
                key={tracking.id}
                onClick={() => handleTrackingClick(tracking.id)}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                      {tracking.carrierName}
                    </div>
                    <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                      {tracking.trackingNumber}
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
                      fontSize: '0.875rem'
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

