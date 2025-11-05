import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { storage } from '../utils/storage';
import { track } from '../utils/api';
import { Tracking, TrackInfo } from '../types';

export default function TrackingDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [trackInfo, setTrackInfo] = useState<TrackInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const credentials = storage.getCredentials();
    if (!credentials) {
      navigate('/settings');
      return;
    }

    if (!id) {
      navigate('/');
      return;
    }

    const trackings = storage.getTrackings();
    const found = trackings.find(t => t.id === id);
    
    if (!found) {
      navigate('/');
      return;
    }

    setTracking(found);
    loadTrackingInfo(found, credentials);
  }, [id, navigate]);

  const loadTrackingInfo = async (trackingData: Tracking, credentials: { clientId: string; clientSecret: string }) => {
    setLoading(true);
    setError('');

    try {
      const response = await track(
        credentials,
        trackingData.carrierId,
        trackingData.trackingNumber
      );

      const info = response.data.track;
      setTrackInfo(info);

      // 마지막 상태를 tracking에 업데이트
      const updatedTracking = {
        ...trackingData,
        lastStatus: {
          code: info.lastEvent.status.code,
          name: info.lastEvent.status.name,
          time: info.lastEvent.time,
          description: info.lastEvent.description,
        },
      };

      storage.updateTracking(trackingData.id, updatedTracking);
      setTracking(updatedTracking);
    } catch (err) {
      setError(err instanceof Error ? err.message : '배송 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (!tracking) return;
    const credentials = storage.getCredentials();
    if (!credentials) return;
    loadTrackingInfo(tracking, credentials);
  };

  if (!tracking) {
    return <div>로딩 중...</div>;
  }

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          ← 목록으로
        </button>
        <h1 style={{ margin: 0 }}>배송 상세 정보</h1>
      </div>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '1.5rem', 
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <span style={{ color: '#666' }}>택배사: </span>
          <strong>{tracking.carrierName}</strong>
        </div>
        <div>
          <span style={{ color: '#666' }}>송장번호: </span>
          <strong>{tracking.trackingNumber}</strong>
        </div>
      </div>

      {error && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#fee', 
          color: '#c33',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>배송 이벤트</h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '로딩 중...' : '새로고침'}
        </button>
      </div>

      {loading && !trackInfo && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          배송 정보를 불러오는 중...
        </div>
      )}

      {trackInfo && (
        <div>
          {trackInfo.lastEvent && (
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
                {trackInfo.lastEvent.status.name}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                {new Date(trackInfo.lastEvent.time).toLocaleString('ko-KR')}
              </div>
              <div style={{ color: '#333' }}>
                {trackInfo.lastEvent.description}
              </div>
            </div>
          )}

          <div>
            <h3 style={{ marginBottom: '1rem' }}>이벤트 내역</h3>
            {trackInfo.events.edges.length === 0 ? (
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
                {trackInfo.events.edges.map((edge, index) => (
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
        </div>
      )}
    </div>
  );
}

