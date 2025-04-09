const express = require('express');
const fs = require('fs');
const path = require('path');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const WebSocket = require('ws');
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
const PORT = 8080;
const productsPath = path.join(__dirname, 'data', 'products.json');
function readData() {
  return JSON.parse(fs.readFileSync(productsPath, 'utf8'));
}
const schema = buildSchema(`
  type Product {
    id: Int
    name: String
    description: String
    price: Float
    categories: [String]
  }
  type Query {
    products: [Product]
    product(id: Int): Product
  }
`);
const rootValue = {
  products: () => {
    const data = readData();
    return data.products.map(({ id, name, price }) => ({ id, name, price }));
  },
  product: ({ id }) => {
    const data = readData();
    return data.products.find(p => p.id === id);
  }
};
app.use('/graphql', graphqlHTTP({
  schema,
  rootValue,
  graphiql: true
}));
const server = app.listen(PORT, () => {
  console.log("Shop server running on " + PORT);
});
const wss = new WebSocket.Server({ noServer: true });
wss.on('connection', ws => {
  ws.on('message', message => {
    let msg = message;
    if (Buffer.isBuffer(message)) {
      msg = message.toString();
    }
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });
});
server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, ws => {
    wss.emit('connection', ws, req);
  });
});
