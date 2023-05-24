import express from 'express';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

const app = express();
app.use(express.json());

app.use(cors());

const productsRouter = express.Router();
const cartsRouter = express.Router();

const productsFilePath = 'src/productos.json';
const cartFilePath = 'src/productos.json';


function readDataFromFile(filePath) {
  const jsonData = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(jsonData);
}


function writeDataToFile(filePath, data) {
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, jsonData, 'utf8');
}


productsRouter.get('/', (req, res) => {
  const products = readDataFromFile(productsFilePath);
  res.json(products);
});


productsRouter.get('/:pid', (req, res) => {
  const { pid } = req.params;
  const products = readDataFromFile(productsFilePath);
  const product = products.find((p) => p.id === pid);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});


productsRouter.post('/', (req, res) => {
  const { title, description, code, price, status, stock, category, thumbnails } = req.body;

  const products = readDataFromFile(productsFilePath);

  const newProduct = {
    id: uuidv4(),
    title,
    description,
    code,
    price,
    status,
    stock,
    category,
    thumbnails,
  };

  products.push(newProduct);

  writeDataToFile(productsFilePath, products);

  res.json(newProduct);
});


productsRouter.put('/:pid', (req, res) => {
  const { pid } = req.params;
  const { title, description, code, price, status, stock, category, thumbnails } = req.body;

  const products = readDataFromFile(productsFilePath);

  const updatedProductIndex = products.findIndex((p) => p.id === pid);

  if (updatedProductIndex !== -1) {
    const updatedProduct = {
      id: pid,
      title,
      description,
      code,
      price,
      status,
      stock,
      category,
      thumbnails,
    };

    products[updatedProductIndex] = updatedProduct;

    writeDataToFile(productsFilePath, products);

    res.json(updatedProduct);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});


productsRouter.delete('/:pid', (req, res) => {
  const { pid } = req.params;

  const products = readDataFromFile(productsFilePath);

  const updatedProducts = products.filter((p) => p.id !== pid);

  if (updatedProducts.length < products.length) {
    writeDataToFile(productsFilePath, updatedProducts);
    res.json({ message: 'Product deleted successfully' });
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});


cartsRouter.post('/', (req, res) => {
  const cartId = uuidv4();
  const newCart = {
    id: cartId,
    products: [],
  };

  writeDataToFile(cartFilePath, newCart);

  res.json(newCart);
});

cartsRouter.get('/:cid', (req, res) => {
  const { cid } = req.params;

  const cart = readDataFromFile(cartFilePath);

  if (cart.id === cid) {
    res.json(cart.products);
  } else {
    res.status(404).json({ error: 'Cart not found' });
  }
});

cartsRouter.post('/:cid/product/:pid', (req, res) => {
  const { cid, pid } = req.params;
  const { quantity } = req.body;

  const cart = readDataFromFile(cartFilePath);

  if (cart.id === cid) {
    const productIndex = cart.products.findIndex((p) => p.product === pid);

    if (productIndex !== -1) {
      cart.products[productIndex].quantity += quantity;
    } else {
      const newProduct = {
        product: pid,
        quantity,
      };
      cart.products.push(newProduct);
    }

    writeDataToFile(cartFilePath, cart);

    res.json(cart.products);
  } else {
    res.status(404).json({ error: 'Cart not found' });
  }
});

app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

app.listen(8080, () => {
  console.log('Server levantado');
});
