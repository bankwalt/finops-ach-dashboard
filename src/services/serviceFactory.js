import { finxactEventService } from './finxactEventService';
import { finxactCalendarService } from './finxactCalendarService';
import { mockEventService, mockCalendarService } from './mockProvider';
import { alacrtiService } from './alacrtiMockProvider';
import { transactionService } from './transactionMockProvider';
import { exceptionsService } from './exceptionsMockProvider';
import { tmService } from './tmMockProvider';

export function getServices(apiMode) {
  if (apiMode === 'real') {
    return {
      events: finxactEventService,
      calendar: finxactCalendarService,
      alacriti: alacrtiService,
      transactions: transactionService,
      exceptions: exceptionsService,
      tm: tmService,
    };
  }
  return {
    events: mockEventService,
    calendar: mockCalendarService,
    alacriti: alacrtiService,
    transactions: transactionService,
    exceptions: exceptionsService,
    tm: tmService,
  };
}
