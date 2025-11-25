import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../utils/storage';
import { sendSlackMessage, formatSlackMessage } from '../utils/slack';
import { NotificationSettings, MonitoringInterval } from '../types';
import { CredentialsSection } from '../components/settings/CredentialsSection';
import { SlackSection } from '../components/settings/SlackSection';
import { MonitoringSection } from '../components/settings/MonitoringSection';
import { NotificationSection } from '../components/settings/NotificationSection';
import { AutoDeleteSection } from '../components/settings/AutoDeleteSection';

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
        <CredentialsSection
          clientId={clientId}
          clientSecret={clientSecret}
          onClientIdChange={setClientId}
          onClientSecretChange={setClientSecret}
        />

        <SlackSection
          webhookUrl={slackWebhookUrl}
          onWebhookUrlChange={setSlackWebhookUrl}
          onTest={handleTestSlack}
          isTesting={testingSlack}
        />

        <MonitoringSection
          interval={monitoringInterval}
          onIntervalChange={setMonitoringInterval}
        />

        <NotificationSection
          notifyOnShippingDelay={notifyOnShippingDelay}
          onNotifyOnShippingDelayChange={setNotifyOnShippingDelay}
          notifyOnShippingStart={notifyOnShippingStart}
          onNotifyOnShippingStartChange={setNotifyOnShippingStart}
          notifyOnDeliveryComplete={notifyOnDeliveryComplete}
          onNotifyOnDeliveryCompleteChange={setNotifyOnDeliveryComplete}
          notifyOnDeliveryException={notifyOnDeliveryException}
          onNotifyOnDeliveryExceptionChange={setNotifyOnDeliveryException}
        />

        <AutoDeleteSection
          autoDeleteCompleted={autoDeleteCompleted}
          onAutoDeleteCompletedChange={setAutoDeleteCompleted}
        />

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
