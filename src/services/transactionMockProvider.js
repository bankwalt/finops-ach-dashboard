import { MOCK_TRANSACTIONS } from '../data/transactionMockData';

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms + Math.random() * 200));

function response(data, method, path) {
  return { data, status: 200, duration: Math.floor(50 + Math.random() * 150), method, path, requestBody: null, ok: true };
}

export const transactionService = {
  async getTransactions() {
    await delay();
    return response(MOCK_TRANSACTIONS, 'GET', '/v1/transactions');
  },
};
