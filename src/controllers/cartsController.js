const Cart = require('../models/cartModel');
const Product = require('../models/productModel');

// Obtener un carrito por ID y mostrar los productos completos
const getCartById = async (req, res) => {
  try {
    const { cid } = req.params;

    const cart = await Cart.findById(cid).populate('products.product');

    if (cart) {
      res.json(cart.products);
    } else {
      res.status(404).json({ error: 'Cart not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Eliminar un producto del carrito
const removeProductFromCart = async (req, res) => {
  try {
    const { cid, pid } = req.params;

    const cart = await Cart.findById(cid);
    if (!cart) {
      return res.status(404).
      json({ error: 'Cart not found' });
    }

    const updatedProducts = cart.products.filter((p) => p.product.toString() !== pid);

    if (updatedProducts.length === cart.products.length) {
      return res.status(404).json({ error: 'Product not found in cart' });
    }

    cart.products = updatedProducts;
    await cart.save();

    res.json(cart.products);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Actualizar el carrito con un arreglo de productos
const updateCart = async (req, res) => {
  try {
    const { cid } = req.params;
    const { products } = req.body;

    const cart = await Cart.findById(cid);
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Verificar que los productos existan
    const productIds = products.map((p) => p.product);
    const existingProducts = await Product.find({ _id: { $in: productIds } });
    const existingProductIds = existingProducts.map((p) => p._id.toString());

    const invalidProducts = products.filter((p) => !existingProductIds.includes(p.product));
    if (invalidProducts.length > 0) {
      return res.status(404).json({ error: 'Invalid products', invalidProducts });
    }

    // Actualizar el carrito con los nuevos productos y cantidades
    cart.products = products;
    await cart.save();

    res.json(cart.products);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Actualizar la cantidad de ejemplares de un producto en el carrito
const updateProductQuantityInCart = async (req, res) => {
  try {
    const { cid, pid } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findById(cid);
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const productIndex = cart.products.findIndex((p) => p.product.toString() === pid);
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found in cart' });
    }

    cart.products[productIndex].quantity = quantity;
    await cart.save();

    res.json(cart.products);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Eliminar todos los productos del carrito
const clearCart = async (req, res) => {
  try {
    const { cid } = req.params;

    const cart = await Cart.findById(cid);
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.products = [];
    await cart.save();

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getCartById,
  removeProductFromCart,
  updateCart,
  updateProductQuantityInCart,
  clearCart,
};
