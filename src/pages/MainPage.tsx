import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../utils/storage';
import { CARRIERS } from '../constants/carriers';
import { Tracking } from '../types';
import { monitorAllTrackings, intervalToMs } from '../utils/monitoring';
import { TrackingForm } from '../components/TrackingForm';
import { TrackingList } from '../components/TrackingList';

export default function MainPage() {
  const navigate = useNavigate();
  const [trackings, setTrackings] = useState<Tracking[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState(CARRIERS[0].code);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const intervalRef = useRef<number | null>(null);

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

      <TrackingForm
        selectedCarrier={selectedCarrier}
        onCarrierChange={setSelectedCarrier}
        trackingNumber={trackingNumber}
        onTrackingNumberChange={setTrackingNumber}
        onSubmit={handleAddTracking}
        error={error}
      />

      <TrackingList
        trackings={trackings}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onDeleteSelected={handleDeleteSelected}
        onToggleSelect={handleToggleSelect}
        onDeleteTracking={handleDeleteTracking}
        onTrackingClick={handleTrackingClick}
      />
    </div>
  );
}

