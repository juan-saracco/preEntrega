import express from 'express';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());

app.use(cors());

mongoose.connect('mongodb://localhost:27017/myapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const productsRouter = express.Router();
const cartsRouter = express.Router();

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'unavailable'],
    required: true,
  },
  stock: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  thumbnails: [String],
});

const Product = mongoose.model('Product', productSchema);

const cartSchema = new mongoose.Schema({
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    quantity: {
      type: Number,
      required: true,
    },
  }],
});

const Cart = mongoose.model('Cart', cartSchema);

productsRouter.get('/', async (req, res) => {
  const { limit = 10, page = 1, sort, query } = req.query;
  const skip = (page - 1) * limit;
  const sortOptions = {};

  if (sort === 'asc') {
    sortOptions.price = 1;
  } else if (sort === 'desc') {
    sortOptions.price = -1;
  }

  const filterOptions = {};
  if (query) {
    filterOptions.$or = [
      { title: { $regex: query, $options: 'i' } },
      { category: { $regex: query, $options: 'i' } },
    ];
  }

  try {
    const totalProducts = await Product.countDocuments(filterOptions);
    const totalPages = Math.ceil(totalProducts / limit);
    const products = await Product.find(filterOptions)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    const nextPage = page < totalPages ? page + 1 : null;
    const prevPage = page > 1 ? page - 1 : null;

    res.json({
      status: 'success',
      payload: products,
      totalPages,
      prevPage,
      nextPage,
      page: Number(page),
      hasPrevPage: prevPage !== null,
      hasNextPage: nextPage !== null,
      prevLink: prevPage ? `/api/products?limit=${limit}&page=${prevPage}` : null,
      nextLink: nextPage ? `/api/products?limit=${limit}&page=${nextPage}` : null,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

productsRouter.get('/:pid', async (req, res) => {
  const { pid } = req.params;

  try {
    const product = await Product.findById(pid);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

productsRouter.post('/', async (req, res) => {
  const { title, description, code, price, status, stock, category, thumbnails } = req.body;

  try {
    const newProduct = await Product.create({
      title,
      description,
      code,
      price,
      status,
      stock,
      category,
      thumbnails,
    });

    res.json(newProduct);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

productsRouter.put('/:pid', async (req, res) => {
  const { pid } = req.params;
  const { title, description, code, price, status, stock, category, thumbnails } = req.body;

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      pid,
      {
        title,
        description,
        code,
        price,
        status,
        stock,
        category,
        thumbnails,
      },
      { new: true }
    );

    if (updatedProduct) {
      res.json(updatedProduct);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

productsRouter.delete('/:pid', async (req, res) => {
  const { pid } = req.params;

  try {
    const deletedProduct = await Product.findByIdAndDelete(pid);

    if (deletedProduct) {
      res.json({ message: 'Product deleted successfully' });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

cartsRouter.post('/', async (req, res) => {
  try {
    const newCart = await Cart.create({ products: [] });
    res.json(newCart);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

cartsRouter.get('/:cid', async (req, res) => {
  const { cid } = req.params;

  try {
    const cart = await Cart.findById(cid).populate('products.product', '-thumbnails');
    if (cart) {
      res.json(cart.products);
    } else {
      res.status(404).json({ error: 'Cart not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

cartsRouter.post('/:cid/product/:pid', async (req, res) => {
  const { cid, pid } = req.params;
  const { quantity } = req.body;

  try {
    const cart = await Cart.findById(cid);

    if (cart) {
      const productIndex = cart.products.findIndex((p) => p.product.toString() === pid);

      if (productIndex !== -1) {
        cart.products[productIndex].quantity += quantity;
      } else {
        cart.products.push({ product: pid, quantity });
      }

      await cart.save();
      res.json(cart.products);
    } else {
      res.status(404).json({ error: 'Cart not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

app.listen(8080, () => {
  console.log('Server levantado');
});

