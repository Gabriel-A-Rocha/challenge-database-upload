import { Router } from 'express';
import { getCustomRepository, getRepository } from 'typeorm';
import multer from 'multer';
import CreateTransactionService from '../services/CreateTransactionService';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';
import DeleteTransactionService from '../services/DeleteTransactionService';
import uploadConfig from '../config/upload';
import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();

// instantiate multer
const upload = multer(uploadConfig);

transactionsRouter.get('/', async (request, response) => {
  // transactions repository - get all transactions
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  const transactions = await transactionsRepository.find();
  // category repository - get all categories
  const categoriesRepository = getRepository(Category);
  const categories = await categoriesRepository.find();

  const list = transactions.map(transaction => {
    const categoryFound = categories.find(
      category => transaction.category_id === category.id,
    );

    const newTransaction = {
      ...transaction,
      category: categoryFound,
    };
    delete newTransaction.category_id;

    return newTransaction;
  });

  const balance = await transactionsRepository.getBalance();

  const output = {
    transactions: list,
    balance,
  };

  return response.json(output);
});

transactionsRouter.post('/', async (request, response) => {
  // receive transaction information
  const { title, value, type, category } = request.body;
  // delegate transaction creation to the service and wait for the return
  const createTransaction = new CreateTransactionService();
  const transaction = await createTransaction.execute({
    title,
    value,
    type,
    category,
  });
  // return the transaction created
  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const deleteTransaction = new DeleteTransactionService();
  await deleteTransaction.execute(id);

  return response.json({ message: 'Transaction successfully deleted.' });
});

transactionsRouter.post(
  '/import',
  upload.single('csv-transactions'),
  async (request, response) => {
    const { filename } = request.file;

    const importTransactions = new ImportTransactionsService();

    const result = await importTransactions.execute(filename);

    return response.json(result);
  },
);

export default transactionsRouter;
