import React from "react";
import { Typography, Card } from "antd";
import ShoppingCart from "../components/ShoppingCart";
import { useCart } from "../contexts/CartContext";
import styles from "../styles/home.module.css";

const { Title } = Typography;

const CartPage: React.FC = () => {
  const { cartItems, removeFromCart, clearCart } = useCart();

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Card style={{ maxWidth: 900, margin: "16px auto", width: "100%" }}>
          <Title level={2} style={{ marginBottom: 16 }}>我的购物车</Title>
          <ShoppingCart
            items={cartItems}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
          />
        </Card>
      </div>
    </main>
  );
};

export default CartPage;


