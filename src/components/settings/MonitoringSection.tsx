import { MonitoringInterval } from '../../types';

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

interface MonitoringSectionProps {
    interval: MonitoringInterval;
    onIntervalChange: (value: MonitoringInterval) => void;
}

export function MonitoringSection({
    interval,
    onIntervalChange
}: MonitoringSectionProps) {
    return (
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
                    value={interval}
                    onChange={(e) => onIntervalChange(e.target.value as MonitoringInterval)}
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
    );
}
