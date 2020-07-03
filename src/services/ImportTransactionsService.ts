import csvParse from 'csv-parse';

import path from 'path';
import fs from 'fs';
import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';
import CreateTransactionService from './CreateTransactionService';

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
    const lines = [];
    parseCSV.on('data', line => {
      lines.push(line);
    });
    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    // this array contains all transactions to be created
    const transactionDTOArray: TransactionDTO[] = [];

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

    // create transaction service
    const createTransaction = new CreateTransactionService();

    // array of stored transactions
    const storedTransactions: Transaction[] = [];

    transactionDTOArray.forEach(transaction => {
      createTransaction.execute(transaction).then(result => {
        storedTransactions.push(result);
      });
    });

    await new Promise(() => {
      if (storedTransactions.length === transactionDTOArray.length) {
        return Promise.resolve(console.log('Pronto'));
      }
    });

    return storedTransactions;
  }
}

export default ImportTransactionsService;
