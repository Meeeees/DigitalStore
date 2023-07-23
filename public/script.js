const loginModal = document.getElementById('loginModal'),
    signupModal = document.getElementById('signupModal'),
    PriceControlHighest = document.querySelector('#Price-highest'),
    PriceControlLowest = document.querySelector('#Price-lowest');

function OpenloginModal() {
    loginModal.showModal();
    signupModal.close()

}
function openSignupModal() {
    loginModal.close();
    signupModal.showModal()

}
document.getElementById('openLoginModal').addEventListener('click', () => {
    OpenloginModal()
    console.log('open login')

});
document.getElementById('closeLoginModal').addEventListener('click', () => {
    hideModal(loginModal);
});

document.getElementById('openSignupModal').addEventListener('click', () => {
    openSignupModal()
    console.log('open signup')
});
document.getElementById('closeSignupModal').addEventListener('click', () => {
    hideModal(signupModal);
});


function ready() {
    document.querySelectorAll('.add-to-cart-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop event propagation to prevent parent buttons from triggering
            let buttonEl = e.currentTarget,
                plusIcon = buttonEl.querySelector('.fa-plus'),
                checkIcon = buttonEl.querySelector('.fa-check'),
                ShoppingCartIcon = buttonEl.querySelector('.fa-cart-shopping'),
                LoadingIcon = buttonEl.querySelector('.fa-spinner');

            const id = buttonEl.parentNode.parentNode.parentNode.dataset.itemId;
            console.log('product id: ', id)

            buttonEl.addEventListener('loading', (e) => {
                console.log('loading event: ', e.detail.loading)

                if (e.detail.loading) {
                    e.currentTarget.classList.add('loading')
                    ShoppingCartIcon.classList.add('move-to-middle-from-right')
                    plusIcon.classList.add('move-to-middle-from-left')
                    LoadingIcon.classList.remove('hidden')
                    setTimeout(() => {
                        buttonEl.classList.remove('bg-button-bg-color')
                        buttonEl.classList.add('bg-button-bg-loading')
                    }, 50);
                } else {
                    e.currentTarget.classList.remove('loading')
                    checkIcon.classList.remove('hidden')
                    LoadingIcon.classList.add('hidden')
                    setTimeout(() => {
                        buttonEl.classList.remove('bg-button-bg-loading')
                        buttonEl.classList.add('bg-green-500')
                    }, 50);

                    setTimeout(() => {
                        checkIcon.classList.add('hidden')
                        ShoppingCartIcon.classList.remove('move-to-middle-from-right')
                        plusIcon.classList.remove('move-to-middle-from-left')
                        buttonEl.classList.remove('bg-green-500')
                        buttonEl.classList.add('bg-button-bg-color')
                    }, 750);

                }

            })

            loadingEvent = new CustomEvent('loading', { detail: { loading: true } })
            buttonEl.dispatchEvent(loadingEvent)


            fetch(`/cart?buy=0&quantity=1&prodId=${id}`, {
                method: 'POST'
            }).then((res) => {
                if (res.status === 401) {
                    OpenloginModal()
                } else if (res.ok) {
                    finishedLoadingEvent = new CustomEvent('loading', { detail: { loading: false } })
                    buttonEl.dispatchEvent(finishedLoadingEvent)

                } else {
                    throw new Error('Request failed with status ' + res.status);
                }
            }).catch(err => {
                console.log(err)
            })
        }, { capture: true })
    })

}

// script so that footer is always at the bottom of the page
function Footer() {
    const footer = document.querySelector('footer');
    const body = document.querySelector('body');
    const html = document.querySelector('html');
    const height = html.offsetHeight;
    const footerHeight = footer.offsetHeight;
    const bodyHeight = body.offsetHeight;
    const footerTop = height - footerHeight;
    if (bodyHeight < height) {
        footer.style.top = footerTop + 'px';
    } else {
        footer.style.top = 'auto';
    }
}

function CartReady(items) {
    if (items === '') {
        signupModal.showModal()
    }
}

document.querySelector('select').addEventListener('change', (e) => {
    console.log(e.target.value)
    if (e.target.value === 'nameASC') {
        OrderItems(true, true)
    } else if (e.target.value === 'nameDESC') {
        OrderItems(true, false)
    } else if (e.target.value === 'priceASC') {
        OrderItems(false, true)
    }
    else if (e.target.value === 'priceDESC') {
        OrderItems(false, false)
    }
}
)

function OrderItems(Byname, asc) {
    console.log('by name:', Byname)
    let items = document.querySelectorAll('.shop-item')
    items = Array.from(items)
    let names = []
    if (Byname) {
        items.forEach(item => {
            names.push({ name: item.children[1].children[0].innerHTML, index: items.indexOf(item) })
        })

        names.sort(function (a, b) {
            let x = a.name.toLowerCase();
            let y = b.name.toLowerCase();
            if (asc) {
                if (x < y) { return -1; }
                if (x > y) { return 1; }
                return 0;
            } else {
                if (x > y) { return -1; }
                if (x < y) { return 1; }
                return 0;
            }
        });

        items.forEach(item => {
            for (let name in names) {
                if (item.children[1].children[0].innerHTML === names[name].name) {
                    item.style.order = name
                }
            }
        })
    } else {
        items.forEach(item => {
            names.push({ price: parseFloat(item.children[2].children[0].innerHTML.replace('€', '')), index: items.indexOf(item) })
        })
        if (asc) {
            names.sort(function (a, b) { return a.price - b.price })
        }
        else {
            names.sort(function (a, b) { return b.price - a.price })
        }

        items.forEach(item => {

            for (let name in names) {
                if (items.indexOf(item) === names[name].index) {
                    item.style.order = name
                }
            }
        })
    }
}
if (document.querySelector('.shop-item')) {
    OrderItems(true)
}

PriceControlHighest.addEventListener('keyup', (e) => {
    let items = document.querySelectorAll('.shop-item'),
        value = e.target.value
    items = Array.from(items)
    items.forEach(item => {
        if (item.classList.contains('hidden')) {
            item.classList.remove('hidden')
        }
        if (parseFloat(item.children[2].children[0].innerHTML.replace('€', '')) > value || parseFloat(item.children[2].children[0].innerHTML.replace('€', '')) < PriceControlLowest.value) {
            item.classList.add('hidden')
        }
    });
    let OrderEvent = new Event('change')

    document.querySelector('select').dispatchEvent(OrderEvent)
}
)

PriceControlLowest.addEventListener('input', (e) => {
    let items = document.querySelectorAll('.shop-item'),
        value = e.target.value
    items = Array.from(items)
    items.forEach(item => {
        if (item.classList.contains('hidden')) {
            item.classList.remove('hidden')
        }
        if (parseFloat(item.children[2].children[0].innerHTML.replace('€', '')) < value || parseFloat(item.children[2].children[0].innerHTML.replace('€', '')) > PriceControlHighest.value) {
            item.classList.add('hidden')
        }
    });
    let OrderEvent = new Event('change')

    document.querySelector('select').dispatchEvent(OrderEvent)

}
)

function Checkout() {
    fetch('/checkout', {
        method: 'POST'
    }).then((res) => {
        console.log(res)
    }
    ).catch(err => {
        console.log(err)
    }
    )

}