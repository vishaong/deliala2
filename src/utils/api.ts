import { Credentials, TrackResponse } from '../types';
import { API_URL } from '../constants/api';

export interface RegisterWebhookResponse {
  data: {
    registerTrackWebhook: {
      success: boolean;
    };
  };
}

export async function track(
  credentials: Credentials,
  carrierId: string,
  trackingNumber: string
): Promise<TrackResponse> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `TRACKQL-API-KEY ${credentials.clientId}:${credentials.clientSecret}`,
    },
    body: JSON.stringify({
      query: `query Track(
  $carrierId: ID!,
  $trackingNumber: String!
) {
  track(
    carrierId: $carrierId,
    trackingNumber: $trackingNumber
  ) {
    lastEvent {
      time
      status {
        code
        name
      }
      description
    }
    events(last: 10) {
      edges {
        node {
          time
          status {
            code
            name
          }
          description
        }
      }
    }
  }
}`.trim(),
      variables: {
        carrierId,
        trackingNumber,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.status}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(data.errors[0]?.message || 'API 오류가 발생했습니다.');
  }

  return data;
}

export async function registerTrackWebhook(
  credentials: Credentials,
  carrierId: string,
  trackingNumber: string,
  callbackUrl: string,
  expirationTime: string
): Promise<RegisterWebhookResponse> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `TRACKQL-API-KEY ${credentials.clientId}:${credentials.clientSecret}`,
    },
    body: JSON.stringify({
      query: `mutation RegisterTrackWebhook(
  $carrierId: ID!,
  $trackingNumber: String!,
  $callbackUrl: String!,
  $expirationTime: DateTime!
) {
  registerTrackWebhook(
    carrierId: $carrierId,
    trackingNumber: $trackingNumber,
    callbackUrl: $callbackUrl,
    expirationTime: $expirationTime
  ) {
    success
  }
}`.trim(),
      variables: {
        carrierId,
        trackingNumber,
        callbackUrl,
        expirationTime,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`웹후크 등록 실패: ${response.status}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(data.errors[0]?.message || '웹후크 등록 오류가 발생했습니다.');
  }

  return data;
}

