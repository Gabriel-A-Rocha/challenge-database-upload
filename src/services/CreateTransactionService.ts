// import AppError from '../errors/AppError';

import { getCustomRepository, getRepository } from 'typeorm';

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
