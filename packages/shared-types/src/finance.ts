export interface LedgerEntry {
  id: string;
  date: string;
  type: 'Invoice' | 'Collection' | 'Reversal' | 'Bounced';
  reference: string;
  debit: number;
  credit: number;
  status: string;
  runningBalance: number;
}
