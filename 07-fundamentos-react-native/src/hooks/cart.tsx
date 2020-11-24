import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import { ProductQuantity } from 'src/pages/Cart/styles';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsAsync = await AsyncStorage.getItem('@MyCart:products');
      if (productsAsync) {
        setProducts([...JSON.parse(productsAsync)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(p => p.id === product.id);

      if (productExists) {
        setProducts(
          products.map(p =>
            p.id === product.id
              ? {
                  ...product,
                  quantity: p.quantity + 1,
                }
              : p,
          ),
        );
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }

      await AsyncStorage.setItem('@MyCart:products', JSON.stringify(products));
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      function filterId(product: Product): Product {
        if (product.id === id) {
          product.quantity += 1;
        }
        return product;
      }
      setProducts(products.filter(filterId));

      await AsyncStorage.setItem('@MyCart:products', JSON.stringify(products));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      function filterId(product: Product): Product {
        if (product.id === id) {
          if (product.quantity > 1) {
            product.quantity -= 1;
          }
        }
        return product;
      }

      setProducts([...products.filter(filterId)]);

      await AsyncStorage.setItem('@MyCart:products', JSON.stringify(products));
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
