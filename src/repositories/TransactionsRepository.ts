import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  // custom function to calculate the balance
  public async getBalance(): Promise<Balance> {
    const allTransactions = await this.find();

    let income = 0;
    let outcome = 0;

    allTransactions.forEach(item => {
      const { type, value } = item;

      const str = String(value);
      const [, s] = str.split('$');
      const s2 = s.replace(/,/g, '');

      const formattedValue = parseFloat(s2);
      if (type === 'income') {
        income += formattedValue;
      } else {
        outcome += formattedValue;
      }
    });

    const balance = {
      income,
      outcome,
      total: income - outcome,
    };

    return balance;
  }
}

export default TransactionsRepository;
