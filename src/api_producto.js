const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const cors = require('cors');

const app = express();

// Lista de usuarios con sus credenciales y roles
const USERS = [
    { username: 'admin', password: 'securepass123', roles: ['admin'] } 
];

app.use(cors({
    origin: 'http://localhost:4200', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true 
}));

app.use(bodyParser.json());

const SECRET_KEY = "miclaveultrasecreta";
let productos = [
    { id: 1, name: "Tennis", price: 79.9, stock: 10, color: "blue", brand: "Essence" },
    { id: 2, name: "Camiseta", price: 25.5, stock: 20, color: "red", brand: "Nike" }
];

// ================== AUTENTICACIÓN ==================

app.post("/auth", (req, res) => {
    const { username, password } = req.body;
    
    // Buscar usuario en el arreglo USERS
    const user = USERS.find(u => u.username === username && u.password === password);

    if (user) {
        // Generar token con el nombre de usuario y roles
        const token = jwt.sign({ username: user.username, roles: user.roles }, SECRET_KEY, { expiresIn: "10m" });
        return res.json({ token });
    }
    res.status(401).json({ message: "Credenciales inválidas" });
});

// Middleware para verificar token
function verificarToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) return res.sendStatus(403); 
    
    const token = authHeader.split(" ")[1];
    
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.sendStatus(403); 
        }
        req.user = user;
        next();
    });
}

// ================== CRUD PRODUCTOS (RUTAS CORREGIDAS) ==================

// 🟢 GET /products: Listar todos los productos
app.get("/products", (req, res) => {
    res.json(productos);
});

// 🟢 POST /products: Crear un nuevo producto (usa verificarToken)
app.post("/products", verificarToken, (req, res) => {
    const { name, price, stock, color, brand, imageUrl, description, category } = req.body;
    
    // Aseguramos que haya un ID único.
    const newId = productos.length > 0 ? Math.max(...productos.map(p => p.id)) + 1 : 1;

    const nuevoProducto = { 
        id: newId, 
        name, price, stock, color, brand, imageUrl, description, category 
    };
    
    productos.push(nuevoProducto);
    res.status(201).json(nuevoProducto);
});

// 🟢 GET /products/:id: Obtener un producto por ID (usa verificarToken)
app.get('/products/:id', verificarToken, (req, res) => {
    const { id } = req.params;
    const producto = productos.find(p => p.id === parseInt(id));
    
    if (!producto) {
        return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json(producto);
});

// 🟢 PUT /products/:id: Actualizar un producto por ID (usa verificarToken)
app.put("/products/:id", verificarToken, (req, res) => {
    const { id } = req.params;
    const { name, price, stock, color, brand, imageUrl, description, category } = req.body;
    const index = productos.findIndex((p) => p.id == id);
    
    if (index === -1) return res.status(404).json({ message: "Producto no encontrado" });
    
    // Actualización de campos
    const producto = productos[index];
    producto.name = name !== undefined ? name : producto.name;
    producto.price = price !== undefined ? price : producto.price;
    producto.stock = stock !== undefined ? stock : producto.stock;
    producto.color = color !== undefined ? color : producto.color;
    producto.brand = brand !== undefined ? brand : producto.brand;
    producto.imageUrl = imageUrl !== undefined ? imageUrl : producto.imageUrl;
    producto.description = description !== undefined ? description : producto.description;
    producto.category = category !== undefined ? category : producto.category;


    res.json(producto);
});

// 🟢 DELETE /products/:id: Eliminar un producto por ID (usa verificarToken)
app.delete("/products/:id", verificarToken, (req, res) => {
    const { id } = req.params;
    productos = productos.filter((p) => p.id != id);
    res.json({ message: "Producto eliminado" });
});

// ================== SWAGGER CONFIG (Ajustado a /products) ==================
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
                url: "https://api-products-cl0w.onrender.com", 
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
        <p>Credenciales de prueba: <code>admin</code> / <code>securepass123</code></p>
        <p>ℹ️ Usa Postman para interactuar con la API. </p>
    `);
});

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));