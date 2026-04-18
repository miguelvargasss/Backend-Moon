import { CartItem } from './cart-item.entity.js';

export const CART_REPOSITORY = 'CART_REPOSITORY';

export interface ICartRepository {
  findByUserId(userId: string): Promise<CartItem[]>;
  findExistingItem(userId: string, productId: string): Promise<CartItem | null>;
  addItem(userId: string, productId: string, quantity: number): Promise<CartItem>;
  updateQuantity(cartItemId: string, quantity: number): Promise<CartItem>;
  removeItem(cartItemId: string): Promise<void>;
  clearCart(userId: string): Promise<void>;
}
