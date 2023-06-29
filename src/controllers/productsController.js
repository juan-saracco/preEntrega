const Product = require('../models/productModel');

// Obtener todos los productos con opciones de filtrado, paginación y ordenamiento
const getProducts = async (req, res) => {
  try {
    const { limit = 10, page = 1, sort, query } = req.query;

    const filters = {};
    if (query) {
      filters.$or = [
        { category: { $regex: query, $options: 'i' } },
        { status: { $regex: query, $options: 'i' } },
      ];
    }

    const totalProducts = await Product.countDocuments(filters);

    let totalPages = Math.ceil(totalProducts / limit);
    if (totalPages === 0) {
      totalPages = 1;
    }

    let currentPage = parseInt(page);
    if (currentPage < 1) {
      currentPage = 1;
    } else if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    const skip = (currentPage - 1) * limit;

    const sortOptions = {};
    if (sort === 'asc') {
      sortOptions.price = 1;
    } else if (sort === 'desc') {
      sortOptions.price = -1;
    }

    const products = await Product.find(filters)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip);

    const prevPage = currentPage > 1 ? currentPage - 1 : null;
    const nextPage = currentPage < totalPages ? currentPage + 1 : null;

    const result = {
      status: 'success',
      payload: products,
      totalPages,
      prevPage,
      nextPage,
      page: currentPage,
      hasPrevPage: prevPage !== null,
      hasNextPage: nextPage !== null,
      prevLink: prevPage ? `/api/products?limit=${limit}&page=${prevPage}` : null,
      nextLink: nextPage ? `/api/products?limit=${limit}&page=${nextPage}` : null,
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Obtener un producto por ID
const getProductById = async (req, res) => {
  try {
    const { pid } = req.params;
    const product = await Product.findById(pid);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Crear un nuevo producto
const createProduct = async (req, res) => {
  try {
    const { title, description, code, price, status, stock, category, thumbnails } = req.body;

    const newProduct = new Product({
      title,
      description,
      code,
      price,
      status,
      stock,
      category,
      thumbnails,
    });

    await newProduct.save();

    res.json(newProduct);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Actualizar un producto por ID
const updateProductById = async (req, res) => {
  try {
    const { pid } = req.params;
    const { title, description, code, price, status, stock, category, thumbnails } = req.body;

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
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Eliminar un producto por ID
const deleteProductById = async (req, res) => {
  try {
    const { pid } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(pid);
    if (deletedProduct) {
      res.json({ message: 'Product deleted successfully' });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProductById,
  deleteProductById,
};
