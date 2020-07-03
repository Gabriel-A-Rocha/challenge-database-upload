import csvParse from 'csv-parse';

import path from 'path';
import fs from 'fs';

import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';
import CreateTransactionService from './CreateTransactionService';

import AppError from '../errors/AppError';

// data structure for transactions to be created
interface TransactionDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    // csv file path
    const csvFilePath = path.resolve(uploadConfig.directory, filename);
    // csv import process
    const readCSVStream = fs.createReadStream(csvFilePath);
    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });
    const parseCSV = readCSVStream.pipe(parseStream);
    const lines: Array<any[]> = [];
    parseCSV.on('data', line => {
      lines.push(line);
    });
    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    // this array contains all transactions to be created
    const transactionDTOArray: TransactionDTO[] = [];

    // transform each line in a transaction to be created
    lines.forEach(line => {
      const [title, type, value, category] = line;

      const transactionDTO = {
        title,
        type,
        value: Number(value),
        category,
      };

      transactionDTOArray.push(transactionDTO);
    });

    // instantiate transaction service
    const createTransaction = new CreateTransactionService();

    // array of stored transactions
    const storedTransactions: Transaction[] = [];

    const promises: Array<Promise<Transaction>> = [];

    transactionDTOArray.forEach(transactionDTO =>
      promises.push(createTransaction.execute(transactionDTO)),
    );

    await Promise.all(promises)
      .then(results =>
        results.forEach(entry => {
          storedTransactions.push(entry);
        }),
      )
      .catch(() => {
        throw new AppError('Transactions from csv file could not be stored.');
      });

    return storedTransactions;
  }
}

export default ImportTransactionsService;
