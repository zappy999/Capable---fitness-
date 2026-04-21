import type { Food } from '../store/types';

export const FOOD_LIBRARY: Food[] = [
  { id: 'fd-chicken-breast', name: 'Chicken breast', macro: 'protein', kcalPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
  { id: 'fd-beef-mince-5', name: 'Lean beef mince (5%)', macro: 'protein', kcalPer100g: 137, proteinPer100g: 21, carbsPer100g: 0, fatPer100g: 5 },
  { id: 'fd-salmon', name: 'Salmon', macro: 'protein', kcalPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13 },
  { id: 'fd-cod', name: 'Cod', macro: 'protein', kcalPer100g: 82, proteinPer100g: 18, carbsPer100g: 0, fatPer100g: 0.7 },
  { id: 'fd-eggs', name: 'Whole eggs', macro: 'protein', kcalPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11 },
  { id: 'fd-egg-whites', name: 'Egg whites', macro: 'protein', kcalPer100g: 52, proteinPer100g: 11, carbsPer100g: 0.7, fatPer100g: 0.2 },
  { id: 'fd-whey', name: 'Whey protein', macro: 'protein', kcalPer100g: 375, proteinPer100g: 80, carbsPer100g: 8, fatPer100g: 5 },
  { id: 'fd-greek-yogurt', name: 'Greek yogurt 0%', macro: 'protein', kcalPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.6, fatPer100g: 0.4 },
  { id: 'fd-cottage-cheese', name: 'Cottage cheese', macro: 'protein', kcalPer100g: 98, proteinPer100g: 11, carbsPer100g: 3.4, fatPer100g: 4.3 },
  { id: 'fd-tofu', name: 'Tofu firm', macro: 'protein', kcalPer100g: 144, proteinPer100g: 17, carbsPer100g: 3, fatPer100g: 9 },

  { id: 'fd-white-rice', name: 'White rice (cooked)', macro: 'carb', kcalPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3 },
  { id: 'fd-brown-rice', name: 'Brown rice (cooked)', macro: 'carb', kcalPer100g: 123, proteinPer100g: 2.7, carbsPer100g: 26, fatPer100g: 1, fiberPer100g: 1.8 },
  { id: 'fd-oats', name: 'Oats (dry)', macro: 'carb', kcalPer100g: 389, proteinPer100g: 17, carbsPer100g: 66, fatPer100g: 7, fiberPer100g: 11 },
  { id: 'fd-sweet-potato', name: 'Sweet potato', macro: 'carb', kcalPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20, fatPer100g: 0.1, fiberPer100g: 3 },
  { id: 'fd-potato', name: 'Potato', macro: 'carb', kcalPer100g: 77, proteinPer100g: 2, carbsPer100g: 17, fatPer100g: 0.1, fiberPer100g: 2.2 },
  { id: 'fd-pasta', name: 'Pasta (cooked)', macro: 'carb', kcalPer100g: 131, proteinPer100g: 5, carbsPer100g: 25, fatPer100g: 1.1 },
  { id: 'fd-bread-whole', name: 'Whole-wheat bread', macro: 'carb', kcalPer100g: 247, proteinPer100g: 13, carbsPer100g: 41, fatPer100g: 3.4, fiberPer100g: 7 },
  { id: 'fd-banana', name: 'Banana', macro: 'carb', kcalPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3, fiberPer100g: 2.6 },
  { id: 'fd-apple', name: 'Apple', macro: 'carb', kcalPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2, fiberPer100g: 2.4 },
  { id: 'fd-berries', name: 'Mixed berries', macro: 'carb', kcalPer100g: 57, proteinPer100g: 0.7, carbsPer100g: 14, fatPer100g: 0.3, fiberPer100g: 2.4 },

  { id: 'fd-almonds', name: 'Almonds', macro: 'fat', kcalPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50, fiberPer100g: 12 },
  { id: 'fd-peanut-butter', name: 'Peanut butter', macro: 'fat', kcalPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50, fiberPer100g: 6 },
  { id: 'fd-olive-oil', name: 'Olive oil', macro: 'fat', kcalPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100 },
  { id: 'fd-avocado', name: 'Avocado', macro: 'fat', kcalPer100g: 160, proteinPer100g: 2, carbsPer100g: 9, fatPer100g: 15, fiberPer100g: 7 },
  { id: 'fd-cheese-cheddar', name: 'Cheddar cheese', macro: 'fat', kcalPer100g: 404, proteinPer100g: 25, carbsPer100g: 1.3, fatPer100g: 33 },

  { id: 'fd-broccoli', name: 'Broccoli', macro: 'carb', kcalPer100g: 35, proteinPer100g: 2.4, carbsPer100g: 7, fatPer100g: 0.4, fiberPer100g: 3.3 },
  { id: 'fd-spinach', name: 'Spinach', macro: 'carb', kcalPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 3.6, fatPer100g: 0.4, fiberPer100g: 2.2 },
  { id: 'fd-chickpeas', name: 'Chickpeas (cooked)', macro: 'mixed', kcalPer100g: 164, proteinPer100g: 9, carbsPer100g: 27, fatPer100g: 2.6, fiberPer100g: 8 },
  { id: 'fd-lentils', name: 'Lentils (cooked)', macro: 'mixed', kcalPer100g: 116, proteinPer100g: 9, carbsPer100g: 20, fatPer100g: 0.4, fiberPer100g: 8 },
  { id: 'fd-quinoa', name: 'Quinoa (cooked)', macro: 'mixed', kcalPer100g: 120, proteinPer100g: 4.4, carbsPer100g: 21, fatPer100g: 1.9, fiberPer100g: 2.8 },
  { id: 'fd-milk', name: 'Milk (skim)', macro: 'mixed', kcalPer100g: 42, proteinPer100g: 3.4, carbsPer100g: 5, fatPer100g: 0.1 },
];
