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
const util = require('util');
const readFileAsync = util.promisify(fs.readFile);


require('dotenv').config();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())
app.use(morgan('tiny'))

// if a user has the statuscode of 304, reload the page

app.get('/', (req, res) => {
    res.render('index')
}
);

app.get('/products/:theme', async (req, res) => {
    fs.readFile('./config/products.json', async (err, data) => {
        if (err) {
            console.log('Error reading file: ', err);
        } else {
            let theme = req.params.theme;
            theme = decodeURIComponent(theme);
            const products = JSON.parse(data);
            let highestPrice = 0;

            if (theme === 'All') {
                for (const theme in products) {
                    products[theme].forEach(product => {
                        if (product.price > highestPrice) {
                            highestPrice = product.price;
                        }
                    });
                }
            } else {
                products[theme].forEach(product => {
                    if (product.price > highestPrice) {
                        highestPrice = product.price;
                    }
                });
            }

            if (req.cookies.token) {
                let token = req.cookies.token;
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                let favorites = await database.Favorites(decoded.email);
                console.log(favorites);
                if (theme === 'All') {
                    res.render('products', { products: products, theme: '', highestPrice: highestPrice, favorites: favorites });
                } else {
                    res.render('products', { products: products[theme], theme: theme, highestPrice: highestPrice, favorites: favorites });
                }
            } else {
                if (theme === 'All') {
                    res.render('products', { products: products, theme: '', highestPrice: highestPrice, favorites: [] });
                } else {
                    res.render('products', { products: products[theme], theme: theme, highestPrice: highestPrice, favorites: [] });
                }
            }
        }
    });
});


app.get('/cart', (req, res) => {
    // reload if statuscode is 304
    const token = req.cookies.token
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
                    console.log(req.query)
                    console.log(decoded)
                    res.status(200)
                    const { buy, quantity, prodId } = req.query
                    console.log(quantity, prodId, buy)
                    console.log('performing action...', buy)
                    if (buy === '0') {
                        database.AddToCart(prodId, quantity, decoded.email, true)
                        console.log('added', prodId, quantity)
                        res.status(200)
                        res.end()
                    } else if (buy === '1') {
                        console.log('deleting', prodId, quantity)
                        database.DeleteFromcart(prodId, decoded.email, false, quantity)
                        res.status(200)
                        res.end()
                    }

                }
            })
        }
    } else {
        console.log('no token')

        res.status(401)
        res.end()

    }
})

app.delete('/cart/:id/:quantity', (req, res) => {
    console.log("\n\n NEW DELETE REQ")
    if (req.cookies.token) {
        let token = req.cookies.token
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
                if (err) {
                    console.log(err)
                    res.status(401)
                    res.end()
                } else {
                    console.log(decoded)
                    console.log('deleting', req.params.id, req.params.quantity)
                    await database.DeleteFromcart(req.params.id, decoded.email, false, req.params.quantity)
                    res.status(200)

                    res.end()
                }
            })
        } else {
            console.log('no token')
            res.status(401)
            res.end()
        }
    }
})

app.put('/cart/:id/:quantity', (req, res) => {
    console.log("\n\n NEW PUT REQ")
    if (req.cookies.token) {
        let token = req.cookies.token
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
                if (err) {
                    console.log(err)
                    res.status(401)
                    res.end()
                } else {
                    console.log(decoded)
                    console.log('adding', req.params.id, req.params.quantity)
                    console.log(decoded.email)
                    await database.AddToCart(req.params.id, req.params.quantity, decoded.email, false)
                    res.status(200)
                    res.end()
                }
            })
        } else {
            console.log('no token')
            res.status(401)
            res.end()
        }
    }
})


let userEmail = ''
app.post('/checkout', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            res.status(401);
            return res.redirect('/products/All');
        }

        const decoded = await util.promisify(jwt.verify)(token, process.env.JWT_SECRET);
        const items = await database.GetCart('mees.v.d@icloud.com');
        userEmail = decoded.email
        const [data, priceData] = await Promise.all([
            readFileAsync('./config/products.json', 'utf8'),
            readFileAsync('./config/productPrice.json', 'utf8')
        ]);

        const parsedData = JSON.parse(data);
        const parsedPriceData = JSON.parse(priceData);

        const matchingItems = [];
        for (const theme in parsedData) {
            for (const product of parsedData[theme]) {
                const foundItem = items.find(item => item.itemId === product.id);
                if (foundItem) {
                    matchingItems.push({ ...product, quantity: foundItem.quantity });
                }
            }
        }

        const line_items = [];
        for (const price of parsedPriceData["prices"]) {
            for (const item of matchingItems) {
                const productStripe = await stripe.products.retrieve(price.product);
                if (productStripe.name === item.name) {
                    console.log("item:", item.name, "product:", productStripe.name);
                    line_items.push({
                        price: price.id,
                        quantity: item.quantity,
                    });
                }
            }
        }

        console.log("line items:", line_items, "shopping card:", items);

        const session = await stripe.checkout.sessions.create({
            line_items,
            mode: 'payment',
            customer_email: decoded.email,
            payment_method_types: [
                'card',
                'paypal',
                'ideal'
            ],
            invoice_creation: {
                enabled: true,
            },
            success_url: `http://localhost:3000/success`,
            cancel_url: `http://localhost:3000/products/All`,
        });

        res.status(200);
        console.log(session);
        const sessionJson = JSON.stringify(session);
        console.log(sessionJson)
        res.json({ url: session.url });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "An error occurred" });
    }
});

app.post('/favorite', (req, res) => {
    let token = req.cookies.token
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                console.log(err)
                res.status(401)
                res.end()
            } else {
                let id = req.query.prodId
                let action = req.query.action
                await database.AddToFavorites(id, action, decoded.email)
                res.status(200)
                res.end()
            }
        }
        )
    } else {
        console.log('no token')
        res.status(401)
        res.end()
    }
})

app.get('/success', (req, res) => {
    const token = req.cookies.token
    console.log('loading success page...')
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            res.status(401)
            res.redirect('/products/All')
        }
        else {

            if (userEmail === '') {
                userEmail = decoded.email
            }
            await database.DeleteFromcart(0, decoded.email, true, 0)
            res.render('success', { email: userEmail })
        }
    })
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

