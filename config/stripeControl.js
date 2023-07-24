const stripe = require('stripe')('sk_test_51NVKYjFazh23Yq1JfMS95HZTqeCzODeddzERTxrDymRm6NvWDPS8BMoETgK2FPN8jXbyMM3IFj3X21h2FwMRZ2O300e22LwKRq');
const fs = require('fs');
const path = require('path');


async function Products() {
    const products = await stripe.products.list({ limit: 50, active: true })
    return products
}

async function ArchiveDupes() {
    const products = await Products()
    let productsIds = []
    let UniqueIds = []
    let Dupliques = []
    products.data.forEach(product => {
        productsIds.push({ id: product.id, name: product.name })
    });
    productsIds.sort(function (a, b) {
        let x = a.name.toLowerCase();
        let y = b.name.toLowerCase();
        if (x < y) { return -1; }
        if (x > y) { return 1; }
        return 0;
    })
    productsIds.forEach(product => {
        if (UniqueIds.findIndex(obj => obj.name === product.name) === -1) {
            UniqueIds.push(product)
        } else {
            Dupliques.push(product)
        }
    })

    UniqueIds.sort(function (a, b) {
        let x = a.name.toLowerCase();
        let y = b.name.toLowerCase();
        if (x < y) { return -1; }
        if (x > y) { return 1; }
        return 0;
    })

    Dupliques.sort(function (a, b) {
        let x = a.name.toLowerCase();
        let y = b.name.toLowerCase();
        if (x < y) { return -1; }
        if (x > y) { return 1; }
        return 0;
    })

    Dupliques.forEach(async dupe => {
        if (dupe.name === 'sunglasses') {
            return
        }
        await stripe.products.update(dupe.id, { active: false })
    })

}
async function MatchIds() {
    const products = await Products();
    const filePath = path.join(__dirname, 'products.json');
    const productsjson = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(productsjson);

    const obj = {};

    for (const theme in data) {
        obj[theme] = [];

        data[theme].forEach(productFromJson => {
            const productFromStripe = products.data.find(product => product.name === productFromJson.name);

            if (productFromStripe) {
                obj[theme].push({
                    prod_id: productFromStripe.id,
                    name: productFromStripe.name
                });
            }
        });
    }

    console.log(obj);
}


async function MakePrices() {
    let products = await Products()
    const filePath = path.join(__dirname, 'products.json');
    let data = fs.readFileSync(filePath, 'utf8');
    data = JSON.parse(data)
    let prices = {}
    let newProduct = {}
    for (let theme in data) {
        data[theme].forEach(productAll => {
            products.data.forEach(async product => {
                if (product.name === productAll.name) {
                    // console.log(product.name, product.id)
                    let Productobj = {
                        "prod_id": product.id,
                        "name": product.name,
                        "price": productAll.price
                    }
                    let price = await stripe.prices.create({
                        unit_amount: productAll.price,
                        product: product.id,
                        currency: 'eur'
                    })
                    let priceObj = {
                        price: price,
                        name: product.name
                    }
                    console.log(price)
                    prices[productAll.id] = priceObj


                    newProduct[productAll.id] = Productobj
                }
            })
        })
    }
    console.log(prices)

    fs.writeFileSync('productPrice.json', JSON.stringify(prices))

}

async function getCheckout(id) {
    const session = await stripe.checkout.sessions.retrieve(id)
    console.log(session)

}

getCheckout('cs_test_a1B1e7DIwzI1lTEu74v1GRFVcx6GQkUpemDW8WC1tEzcs4M3tAmDbPqt2J')