import { CARRIERS } from '../constants/carriers';

interface TrackingFormProps {
    selectedCarrier: string;
    onCarrierChange: (carrier: string) => void;
    trackingNumber: string;
    onTrackingNumberChange: (number: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    error: string;
}

export function TrackingForm({
    selectedCarrier,
    onCarrierChange,
    trackingNumber,
    onTrackingNumberChange,
    onSubmit,
    error
}: TrackingFormProps) {
    return (
        <div style={{
            backgroundColor: '#f8f9fa',
            padding: 'clamp(1rem, 3vw, 1.5rem)',
            borderRadius: '8px',
            marginBottom: '2rem'
        }}>
            <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: 'clamp(1.25rem, 3vw, 1.5rem)' }}>송장 등록</h2>
            <form onSubmit={onSubmit}>
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
                            onChange={(e) => onCarrierChange(e.target.value)}
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
                            onChange={(e) => onTrackingNumberChange(e.target.value)}
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
    );
}
