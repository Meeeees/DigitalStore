const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs');
const database = require('./config/database')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');
const { decode } = require('punycode');

require('dotenv').config();
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())


app.get('/', (req, res) => {
    res.render('index')
}
);

app.get('/products', (req, res) => {
    fs.readFile('./config/products.json', (err, data) => {
        if (err) {
            console.log('Error reading file: ', err)
        } else {
            const products = JSON.parse(data);
            // console.log(products)
            res.render('products', { products: products })
        }
    })
}
);

app.get('/cart', (req, res) => {
    const token = req.cookies.token
    console.log(token)
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                console.log(err)

            }
            console.log(decoded)
            let items = await database.GetCart(decoded.email)
            console.log(items)
            res.render('cart', { items: items })
        })
    } else {
        res.render('cart')
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
                        database.AddToCart(prodId, quantity, decoded.email)
                        console.log('added', prodId, quantity)
                        res.status(200)
                        res.end()
                    } else {
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
            res.redirect('/products')
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
            res.cookie('token', token, { httpOnly: true })
            res.status(200)
            res.redirect('/products')
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

