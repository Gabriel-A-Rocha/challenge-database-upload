import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    // deny outcome transaction if balance is not sufficient
    if (type === 'outcome') {
      const balance = await transactionsRepository.getBalance();
      if (balance.total < value) {
        throw new AppError('Not enough money in the account.');
      }
    }

    // check if category exists
    const categoriesRepository = getRepository(Category);
    const categoryFound = await categoriesRepository.findOne({
      where: { title: category },
    });

    let category_id = '';

    if (categoryFound) {
      category_id = categoryFound.id;
    } else {
      const newCategory = categoriesRepository.create({ title: category });
      await categoriesRepository.save(newCategory);
      category_id = newCategory.id;
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id,
    });
    await transactionsRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
