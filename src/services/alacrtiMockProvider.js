import { MOCK_FUNDS_AVAILABILITY, MOCK_ALACRITI_TRANSACTIONS } from '../data/alacrtiMockData';

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

export const alacrtiService = {
  async getFundsAvailability() {
    await delay();
    return response(MOCK_FUNDS_AVAILABILITY, 'GET', '/alacriti/v1/funds-availability');
  },

  async getTransactions() {
    await delay(500);
    return response(MOCK_ALACRITI_TRANSACTIONS, 'GET', '/alacriti/v1/transactions/daily-summary');
  },
};
