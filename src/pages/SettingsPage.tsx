import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../utils/storage';
import { sendSlackMessage, formatSlackMessage } from '../utils/slack';
import { NotificationSettings, MonitoringInterval } from '../types';

const MONITORING_INTERVALS: MonitoringInterval[] = [
  '5분',
  '10분',
  '30분',
  '1시간',
  '2시간',
  '4시간',
  '8시간',
  '12시간',
  '24시간',
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [monitoringInterval, setMonitoringInterval] = useState<MonitoringInterval>('30분');
  const [notifyOnShippingDelay, setNotifyOnShippingDelay] = useState(true);
  const [notifyOnShippingStart, setNotifyOnShippingStart] = useState(false);
  const [notifyOnDeliveryComplete, setNotifyOnDeliveryComplete] = useState(false);
  const [notifyOnDeliveryException, setNotifyOnDeliveryException] = useState(false);
  const [autoDeleteCompleted, setAutoDeleteCompleted] = useState(true);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testingSlack, setTestingSlack] = useState(false);

  useEffect(() => {
    const credentials = storage.getCredentials();
    if (credentials) {
      setClientId(credentials.clientId);
      setClientSecret(credentials.clientSecret);
    }

    const notificationSettings = storage.getNotificationSettings();
    if (notificationSettings) {
      setSlackWebhookUrl(notificationSettings.slackWebhookUrl);
      setMonitoringInterval(notificationSettings.monitoringInterval);
      setNotifyOnShippingDelay(notificationSettings.notifyOnShippingDelay);
      setNotifyOnShippingStart(notificationSettings.notifyOnShippingStart);
      setNotifyOnDeliveryComplete(notificationSettings.notifyOnDeliveryComplete);
      setNotifyOnDeliveryException(notificationSettings.notifyOnDeliveryException);
      setAutoDeleteCompleted(notificationSettings.autoDeleteCompleted ?? true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!clientId.trim() || !clientSecret.trim()) {
      setError('Client ID와 Client Secret을 모두 입력해주세요.');
      return;
    }

    storage.saveCredentials({
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
    });

    const notificationSettings: NotificationSettings = {
      slackWebhookUrl: slackWebhookUrl.trim(),
      monitoringInterval,
      notifyOnShippingDelay,
      notifyOnShippingStart,
      notifyOnDeliveryComplete,
      notifyOnDeliveryException,
      autoDeleteCompleted,
    };

    storage.saveNotificationSettings(notificationSettings);

    setSuccess('설정이 저장되었습니다.');
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  const handleTestSlack = async () => {
    if (!slackWebhookUrl.trim()) {
      setError('슬랙 웹후크 URL을 먼저 입력해주세요.');
      return;
    }

    setTestingSlack(true);
    setError('');
    setSuccess('');

    try {
      const testMessage = formatSlackMessage(
        'shipping_delay',
        '테스트 택배사',
        'TEST1234567890',
        '테스트 상태',
        '이것은 테스트 메시지입니다.'
      );
      
      await sendSlackMessage(slackWebhookUrl, testMessage);
      setSuccess('슬랙 테스트 메시지가 전송되었습니다!');
    } catch (err) {
      setError(err instanceof Error ? err.message : '슬랙 메시지 전송에 실패했습니다.');
    } finally {
      setTestingSlack(false);
    }
  };

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
          ← 메인으로
        </button>
        <h1 style={{ margin: 0 }}>설정</h1>
      </div>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* 델리버리 트래커 크레덴셜 */}
        <section style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '1.5rem', 
          borderRadius: '8px' 
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>델리버리 트래커 크레덴셜</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label htmlFor="clientId" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Client ID
              </label>
              <input
                id="clientId"
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                placeholder="델리버리 트래커 Client ID를 입력하세요"
              />
            </div>

            <div>
              <label htmlFor="clientSecret" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Client Secret
              </label>
              <input
                id="clientSecret"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                placeholder="델리버리 트래커 Client Secret을 입력하세요"
              />
            </div>
          </div>
        </section>

        {/* 슬랙 설정 */}
        <section style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '1.5rem', 
          borderRadius: '8px' 
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>슬랙 알림 설정</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label htmlFor="slackWebhookUrl" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                슬랙 웹후크 URL
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  id="slackWebhookUrl"
                  type="url"
                  value={slackWebhookUrl}
                  onChange={(e) => setSlackWebhookUrl(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                  placeholder="https://hooks.slack.com/services/..."
                />
                <button
                  type="button"
                  onClick={handleTestSlack}
                  disabled={testingSlack || !slackWebhookUrl.trim()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: testingSlack || !slackWebhookUrl.trim() ? '#ccc' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    cursor: testingSlack || !slackWebhookUrl.trim() ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {testingSlack ? '전송 중...' : '테스트 전송'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 모니터링 설정 */}
        <section style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '1.5rem', 
          borderRadius: '8px' 
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>모니터링 설정</h2>
          <div>
            <label htmlFor="monitoringInterval" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              모니터링 주기
            </label>
            <select
              id="monitoringInterval"
              value={monitoringInterval}
              onChange={(e) => setMonitoringInterval(e.target.value as MonitoringInterval)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            >
              {MONITORING_INTERVALS.map(interval => (
                <option key={interval} value={interval}>
                  {interval}
                </option>
              ))}
            </select>
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
              배송 상태를 조회하는 주기를 설정합니다.
            </div>
          </div>
        </section>

        {/* 알림 옵션 */}
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
                onChange={(e) => setNotifyOnShippingDelay(e.target.checked)}
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
                onChange={(e) => setNotifyOnShippingStart(e.target.checked)}
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
                onChange={(e) => setNotifyOnDeliveryComplete(e.target.checked)}
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
                onChange={(e) => setNotifyOnDeliveryException(e.target.checked)}
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

        {/* 자동 삭제 설정 */}
        <section style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '1.5rem', 
          borderRadius: '8px' 
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>자동 삭제 설정</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoDeleteCompleted}
                onChange={(e) => setAutoDeleteCompleted(e.target.checked)}
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: '500' }}>배송 완료 후 자동 삭제</div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  배송이 완료된 송장은 12시간 후에 자동으로 삭제됩니다.
                </div>
              </div>
            </label>
          </div>
        </section>

        {error && (
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: '#fee', 
            color: '#c33',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: '#dfd', 
            color: '#3c3',
            borderRadius: '4px'
          }}>
            {success}
          </div>
        )}

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
            fontWeight: '500'
          }}
        >
          저장
        </button>
      </form>
    </div>
  );
}
