const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs');
const database = require('./config/database')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');
const { decode } = require('punycode');
const stripe = require('stripe')(process.env.SECRET_KEY)
const morgan = require('morgan')
require('dotenv').config();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())
app.use(morgan('tiny'))

app.get('/', (req, res) => {
    res.render('index')
}
);

app.get('/products/:theme', (req, res) => {
    fs.readFile('./config/products.json', (err, data) => {
        if (err) {
            console.log('Error reading file: ', err)
        } else {
            let theme = req.params.theme
            theme = decodeURIComponent(theme)
            const products = JSON.parse(data);
            // console.log(products)
            highestPrice = 0
            if (theme === 'All') {
                for (const theme in products) {
                    products[theme].forEach(product => {
                        if (product.price > highestPrice) {
                            highestPrice = product.price
                        }
                    });
                }
                res.render('products', { products: products, theme: '', highestPrice: highestPrice })
            } else {
                products[theme].forEach(product => {
                    if (product.price > highestPrice) {
                        highestPrice = product.price
                    }
                });
                res.render('products', { products: products[theme], theme: theme, highestPrice: highestPrice })
            }
        }
    })
}
);

app.get('/cart', (req, res) => {
    const token = req.cookies.token
    console.log(token)
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                console.log(err)
                res.render('cart', { items: undefined })


            } else {
                console.log(decoded)
                fs.readFile("./config/products.json", async (err, data) => {
                    if (err) {
                        console.log('error reading file:', err)
                    } else {
                        let items = await database.GetCart(decoded.email)
                        totalPrice = 0
                        products = JSON.parse(data)
                        console.log(products)
                        for (const theme in products) {
                            products[theme].forEach(product => {
                                for (let j = 0; j < items.length; j++) {
                                    if (items[j].itemId === product.id) {
                                        totalPrice += product.price * items[j].quantity
                                    }
                                }
                            });

                        }
                        res.render('cart', { items: items, products: products, totalPrice: totalPrice })
                    }
                })
            }
        })
    } else {
        res.render('cart', { items: undefined })
    }
})

app.post('/cart', (req, res) => {
    if (req.cookies.token) {
        let token = req.cookies.token
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err) {
                    console.log(err)
                    res.status(401)
                    res.end()

                } else {
                    setTimeout(() => {
                        console.log(req.query)
                        console.log(decoded)
                        res.status(200)
                        const { buy, quantity, prodId } = req.query
                        console.log(quantity, prodId, buy)
                        console.log('performing action...', buy)
                        if (buy === '0') {
                            database.AddToCart(prodId, quantity, decoded.email)
                            console.log('added', prodId, quantity)
                            res.status(200)
                            res.end()
                        } else {
                            database.DeleteFromcart(prodId, decoded.email, false, quantity)
                            res.status(200)
                            res.end()
                        }
                    }, 400);

                }
            })
        }
    } else {
        console.log('no token')

        res.status(401)
        res.end()

    }
})

app.post('/checkout', async (req, res) => {
    const token = req.cookies.token;

    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                res.status(401);
                res.redirect('/products/All');
            } else {
                try {
                    const items = await database.GetCart('mees.v.d@icloud.com');
                    let data = fs.readFileSync('./config/products.json');
                    let priceData = fs.readFileSync('./config/productPrice.json');
                    let line_items = [];
                    data = JSON.parse(data);
                    priceData = JSON.parse(priceData);

                    for (const price of priceData["prices"]) {
                        for (const theme in data) {
                            for (const product of data[theme]) {
                                for (const item of items) {
                                    if (item.itemId === product.id) {
                                        const productStripe = await stripe.products.retrieve(price.product);
                                        if (productStripe.name === product.name) {
                                            console.log("item:", product.name, "product:", productStripe.name);
                                            line_items.push({
                                                price: price.id,
                                                quantity: item.quantity,
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }

                    console.log("line items:", line_items, "shopping card:", items);
                    const session = await stripe.checkout.sessions.create({
                        line_items,
                        mode: 'payment',
                        invoice_creation: {
                            enabled: true,
                        },
                        success_url: `http://localhost:3000/success`,
                        cancel_url: `http://localhost:3000/cancel`,
                    })
                    res.status(200)
                    console.log(session)
                    res.json({ url: session.url })

                } catch (error) {
                    console.error("Error:", error);
                    res.status(500).json({ error: "An error occurred" });
                }
            }
        });
    } else {
        res.status(401);
        res.redirect('/products/All');
    }
});


app.get('/success', (req, res) => {
    const token = req.cookies.token

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            res.status(401)
            res.redirect('/products/All')
        }
        else {
            await database.DeleteFromcart(0, decoded.email, true, 0)
            res.render('success')
        }
    })
})

app.get('/cancel', (req, res) => {
    res.render('cancel')
})


app.post('/SignUp', (req, res) => {
    const { email, password } = req.body;

    database.createUser(email, password)
        .then((result) => {
            // setup cookies and jwt
            const token = jwt.sign({ email: result.email }, process.env.JWT_SECRET, { expiresIn: '1h' })
            res.cookie('token', token, { httpOnly: true })
            res.status(200)

            console.log(result)
            res.status(200)
            res.redirect('/products/All')
        })
        .catch((err) => {
            console.log(err)
            res.status(500)
            res.json({ err })
        })
}
);

app.post('/Login', (req, res) => {
    console.log(req.body)
    const { email, password } = req.body;
    database.VerifyUser(email, password)
        .then((result) => {
            // setup cookies and jwt
            const token = jwt.sign({ email: result.email }, process.env.JWT_SECRET, { expiresIn: '1h' })
            res.cookie('token', token, { httpOnly: true, maxAge: 3600000 })
            res.status(200)
            res.redirect('/products/All')
        })
        .catch((err) => {
            console.log(err)
            res.status(500)
            res.json({ err })
        })
}
);






app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
}
);

