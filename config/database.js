const mongoose = require('mongoose');
require('dotenv').config()
const Schema = mongoose.Schema;
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })

const UserSchema = new Schema({
    email: {
        type: String,
        unique: true
    },
    password: String,
    cart: {
        items: [
            {
                itemId: {
                    type: Number,
                    ref: 'Item',
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true
                }
            }
        ]
    }
})

UserSchema.methods.AddToCart = function (product_id, quantity) {
    let ItemIndex;
    this.cart.items.forEach(item => {
        if (item.itemId === product_id) {
            ItemIndex = this.cart.items.indexOf(item)
        }
    });

    if (ItemIndex !== -1 && ItemIndex !== undefined) {
        this.cart.items[ItemIndex].quantity = quantity
    } else {
        this.cart.items.push({ itemId: product_id, quantity: quantity })
    }
    return this.save()
}
UserSchema.methods.RemoveFromCart = function (product_id, quantity, EmptyCart) {
    if (EmptyCart) {
        this.cart.items = []
    } else {
        let ItemIndex;
        this.cart.items.forEach(item => {
            if (item.itemId === product_id) {
                ItemIndex = this.cart.items.indexOf(item)
            }
        });

        if (ItemIndex !== -1 && ItemIndex !== undefined) {
            this.cart.items[ItemIndex].quantity = quantity
            if (quantity === 0) {
                this.card.items.splice(ItemIndex, 1)
            }
        }
    }
    return this.save()
}

const User = mongoose.model('User', UserSchema);

async function createUser(email, password) {
    try {
        const user = new User({
            email: email,
            password: password
        })
        const result = await user.save();
        return result
    } catch (err) {
        console.log(err)

    }
}

async function VerifyUser(user_email, password) {
    const user = await User.findOne({ email: user_email, password: password })
    return user
}

async function AddToCart(product_id, quantity, user_email) {
    try {
        const user = await User.findOne({ email: user_email })
        let res = await user.AddToCart(product_id, quantity)
        return res
    } catch (err) {
        console.log(err)
    }
}
async function DeleteFromcart(product_id, user_email, EmptyAll, quantity) {
    try {
        const user = await User.findOne({ email: user_email })

        let res = await user.RemoveFromCart(product_id, quantity, EmptyAll)
        return res
    } catch (err) {
        console.log(err)
    }
}

async function GetCart(user_email) {
    try {
        const user = await User.findOne({ email: user_email })
        return user.cart.items
    } catch (err) {
        console.log(err)
    }
}

// createUser('mees', 'mees.v.d@icloud.com', 'test')
// AddToCart(4, 2, "mees.v.d@icloud.com")
// DeleteFromcart(4, 'mees.v.d@icloud.com', true, 3)

module.exports = {
    GetCart, VerifyUser, DeleteFromcart, AddToCart, createUser
}