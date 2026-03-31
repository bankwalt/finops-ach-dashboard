import { MOCK_TM_ALERTS, MOCK_TM_SUMMARY } from '../data/tmMockData';

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

export const tmService = {
  async getAlertSummary() {
    await delay();
    return response(MOCK_TM_SUMMARY, 'GET', '/v1/tm/summary');
  },

  async getAlerts() {
    await delay(500);
    return response(MOCK_TM_ALERTS, 'GET', '/v1/tm/alerts');
  },

  async getAlertDetail(decisionId) {
    await delay(300);
    const alert = MOCK_TM_ALERTS.find(a => a.decisionId === decisionId);
    if (!alert) return response(null, 'GET', `/v1/tm/alerts/${decisionId}`, 404);
    return response(alert, 'GET', `/v1/tm/alerts/${decisionId}`);
  },

  async getMerchantAlertHistory(merchantId) {
    await delay(300);
    const history = MOCK_TM_ALERTS
      .filter(a => a.merchantId === merchantId && a.status !== 'PENDING_REVIEW')
      .slice(0, 10);
    return response(history, 'GET', `/v1/tm/merchants/${merchantId}/alerts`);
  },

  async submitDecision(decisionId, decision) {
    await delay(600);
    return response(
      { decisionId, ...decision, decidedAt: new Date().toISOString() },
      'PUT',
      `/v1/tm/alerts/${decisionId}/decision`
    );
  },

  async generateUAR(decisionId) {
    await delay(400);
    const alert = MOCK_TM_ALERTS.find(a => a.decisionId === decisionId);
    if (!alert) return response(null, 'POST', `/v1/tm/alerts/${decisionId}/uar`, 404);
    return response({
      uarId: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      decisionId,
      generatedAt: new Date().toISOString(),
      alert,
    }, 'POST', `/v1/tm/alerts/${decisionId}/uar`);
  },

  async getUARHistory() {
    await delay();
    const uars = MOCK_TM_ALERTS
      .filter(a => a.uarRequired)
      .map(a => ({
        uarId: a.decisionId + '-uar',
        decisionId: a.decisionId,
        merchantName: a.merchantName,
        amount: a.amount,
        severity: a.severity,
        generatedAt: a.updatedAt,
        generatedBy: a.updatedBy,
      }));
    return response(uars, 'GET', '/v1/tm/uars');
  },
};
