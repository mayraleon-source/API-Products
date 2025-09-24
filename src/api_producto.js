const  express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUI= require("swagger-ui-express");

const app = express();
app.use(bodyParser.json());

const SECRET_KEY = "mikeysecret";
let productos = [
    {id: 1, name: "laptop", price: 1200, stock: 5, brand: "asus"},
    {id: 2, name: "mouse", price: 30, stock: 5, brand: "hp"},
    {id: 3, name: "microphone", price: 50,stock: 5,  brand: "lenovo"}
];

//AUTENTICACION 
app.post("auth", (req, res)=>{
    const {username, password} = req.body;
    if (username === "ale" && password === "ale123"){
        const token = jwt.sign({username},SECRET_KEY, {expiresIn: "10m"});
        return res.json({token});
    }
    res.status(401).json({message: "credenciales invalidas"});
});
//VERIFICAR TOKEN 
function verificarToken(req, res, next){
    const authHeader = req.header ["authorization"];
    if(!authHeader)return res.sendStatus(403);
    const token =authHeader.split (" ")[1];
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if(err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}
// LISTAR PRODUCTOS
app.get("/productos", (req, res) =>{
    res.json(productos);
});

// CREAR PRODUCTOS
app.post("/productos" , verificarToken, (req, res) =>{
    const {name, price, stock, brand} = req.body;
    const nuevoProducto = {id: productos.length +1, name, price, stock, brand};
    productos.push(nuevoProducto);
    res.status(201).json(nuevoProducto);
});

// LISTAR PRODUCTOS POR ID
app.get("/productos/:id" , verificarToken, (req, res) =>{
    const {id } = req.params;
    const producto = productos.find(p => p.id === parseInt(id));
    if( !producto){
        return res.status(404).json({ message: "Producto no encontrado"});
    }
    res.json(producto);
});

// ACTUALIZAR PRODUCTOS
app.put("/productos/:id" , verificarToken, (req, res) =>{
    const { id } = req.params;
    const { name, price, stock, brand} = req.body;
    const producto = productos.find((p) => p.id == id);
    if( !producto)
        return res.status(404).json({ message: "Producto no encontrado"});
        producto.name = name;
        producto.price = price;
        producto.stock = stock;
        producto.brand = brand;
    res.json(producto);
});
// BORRAR PRODUCTOS
app.delete("/productos/:id" , verificarToken, (req, res) =>{
    const { id } = req.params;
    const { name, price, stock, brand} = req.body;
    const producto = productos.find((p) => p.id != id);
    res.json({message: "Producto eliminado"});
});

// ================== SWAGGER CONFIG ==================
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Productos con JWT",
      version: "1.0.0",
      description: "API de ejemplo con autenticación JWT para prácticas",
    },
    servers: [
      {
        url: "https://api-productos-jwt.onrender.com", // 🔹 tu dominio de Render
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./api_producto.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// ================== INICIO SERVIDOR ==================
const PORT = process.env.PORT || 3000;
// Página de inicio con criterios del parcial
app.get("/", (req, res) => {
  res.send(`
    <h1>API de Productos con Auth (JWT)</h1>
    <p> Documentación interactiva (Swagger UI): <a href="https://api-productos-jwt.onrender.com/api-docs">https://api-productos-jwt.onrender.com/api-docs</a></p>
    <hr>
    <p>👉 Endpoints disponibles:</p>
    <ul>
      <li><code>POST /auth</code> → obtener token</li>
      <li><code>GET /products</code> → listar productos</li>
      <li><code>GET /products/:id</code> → detalle producto</li>
      <li><code>POST /products</code> → crear producto (requiere token)</li>
      <li><code>PUT /products/:id</code> → actualizar producto (requiere token)</li>
      <li><code>DELETE /products/:id</code> → eliminar producto (requiere token)</li>
    </ul>
    <hr>
    <p>ℹ️ Usa Postman para interactuar con la API. </p>
  `);
});

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));