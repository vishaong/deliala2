import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../utils/storage';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!clientId.trim() || !clientSecret.trim()) {
      setError('Client ID와 Client Secret을 모두 입력해주세요.');
      return;
    }

    storage.saveCredentials({
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
    });

    navigate('/');
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ marginBottom: '2rem' }}>설정</h1>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

