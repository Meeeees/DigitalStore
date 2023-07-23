const fs = require('fs');
const stripe = require('stripe')('sk_test_51NVKYjFazh23Yq1JfMS95HZTqeCzODeddzERTxrDymRm6NvWDPS8BMoETgK2FPN8jXbyMM3IFj3X21h2FwMRZ2O300e22LwKRq');
let products = []

stripe.files.list({ limit: 14 }).then(data => console.log(data))
stripe.products.list().then(data => {
    data.data.forEach(product => {
        products.push({ id: product.id, name: product.name, images: product.images })
    });
    console.log(products)
})

const fileLinks = []

const fileLink = stripe.fileLinks.create({
    file: 'file_1NWlktFazh23Yq1JCmnXYGNm'
}).then(data => console.log(data))

fs.readFile('./config/products.json', (err, data) => {
    if (err) {
        console.log('Error reading file: ', err)
    } else {
        const products = JSON.parse(data);
        for (const theme in products) {
            products[theme].forEach(async product => {
                // for test purpose, only do the first
                if (product.id !== 1) {
                    return
                }









            });
        }
    }
}
);

