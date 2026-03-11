import {
  MOCK_EXCEPTION_SUMMARY,
  MOCK_ACH_DEBIT_QUEUE,
  MOCK_VAN_EXCEPTIONS,
  MOCK_RECON_EXCEPTIONS,
  MOCK_ACH_PROCESSING_ERRORS,
  MOCK_ACH_RETURNS_QUEUE,
  MOCK_RTP_FEDNOW_EXCEPTIONS,
  MOCK_PAYOUT_EXCEPTIONS,
  MOCK_INFRA_ALERTS,
} from '../data/exceptionsMockData';

function delay(ms = 400) {
  return new Promise(resolve => setTimeout(resolve, ms + Math.random() * 300));
}

function response(data, method, path, status = 200) {
  return {
    data,
    status,
    duration: Math.round(300 + Math.random() * 400),
    method,
    path,
    requestBody: null,
    ok: status >= 200 && status < 300,
  };
}

const CATEGORY_QUEUES = {
  vanExceptions: MOCK_VAN_EXCEPTIONS,
  reconExceptions: MOCK_RECON_EXCEPTIONS,
  achProcessingErrors: MOCK_ACH_PROCESSING_ERRORS,
  achReturns: MOCK_ACH_RETURNS_QUEUE,
  rtpFedNowExceptions: MOCK_RTP_FEDNOW_EXCEPTIONS,
  payoutExceptions: MOCK_PAYOUT_EXCEPTIONS,
  infraAlerts: MOCK_INFRA_ALERTS,
};

export const exceptionsService = {
  async getExceptionSummary() {
    await delay();
    return response(MOCK_EXCEPTION_SUMMARY, 'GET', '/v1/exceptions/summary');
  },

  async getACHDebitQueue() {
    await delay(500);
    return response(MOCK_ACH_DEBIT_QUEUE, 'GET', '/v1/exceptions/ach-debit-decisioning');
  },

  async submitDecision(itemId, decision) {
    await delay(600);
    return response(
      { id: itemId, ...decision, decidedAt: new Date().toISOString() },
      'POST',
      `/v1/exceptions/ach-debit-decisioning/${itemId}/decision`
    );
  },

  async getQueueByCategory(category) {
    await delay();
    return response(
      CATEGORY_QUEUES[category] || [],
      'GET',
      `/v1/exceptions/${category}`
    );
  },
};
