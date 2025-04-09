const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'admin')));
const PORT = 3000;
const productsPath = path.join(__dirname, 'data', 'products.json');
function readData() {
  return JSON.parse(fs.readFileSync(productsPath, 'utf8'));
}
function writeData(data) {
  fs.writeFileSync(productsPath, JSON.stringify(data, null, 2));
}
app.get('/api/products', (req, res) => {
  const data = readData();
  res.json(data.products);
});
app.post('/api/products', (req, res) => {
  const data = readData();
  const items = Array.isArray(req.body) ? req.body : [req.body];
  let maxId = data.products.length > 0 ? data.products.reduce((max, p) => p.id > max ? p.id : max, 0) : 0;
  items.forEach(item => {
    maxId++;
    data.products.push({
      id: maxId,
      name: item.name,
      description: item.description,
      price: item.price,
      categories: item.categories
    });
  });
  writeData(data);
  res.json({ message: "Товары добавлены" });
});
app.put('/api/products/:id', (req, res) => {
  const data = readData();
  const id = parseInt(req.params.id, 10);
  const product = data.products.find(p => p.id === id);
  if (!product) return res.status(404).json({ error: "Товар не найден" });
  if (req.body.name !== undefined) product.name = req.body.name;
  if (req.body.description !== undefined) product.description = req.body.description;
  if (req.body.price !== undefined) product.price = req.body.price;
  if (req.body.categories !== undefined) product.categories = req.body.categories;
  writeData(data);
  res.json({ message: "Товар обновлён", product });
});
app.delete('/api/products/:id', (req, res) => {
  const data = readData();
  const id = parseInt(req.params.id, 10);
  const index = data.products.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: "Товар не найден" });
  data.products.splice(index, 1);
  writeData(data);
  res.json({ message: "Товар удалён" });
});
const server = app.listen(PORT, () => {
  console.log("Admin server running on " + PORT);
});
