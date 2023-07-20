const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');

function OpenloginModal() {
    loginModal.showModal();
    signupModal.close()

}
function openSignupModal() {
    loginModal.close();
    signupModal.showModal()

}
// Event listeners to show/hide the login modal
document.getElementById('openLoginModal').addEventListener('click', () => {
    OpenloginModal()
    console.log('open login')

});
document.getElementById('closeLoginModal').addEventListener('click', () => {
    hideModal(loginModal);
});

// Event listeners to show/hide the signup modal
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
            const id = e.target.parentNode.parentNode.dataset.itemId;

            console.log(id);

            fetch(`/cart?buy=0&quantity=1&prodId=${id}`, {
                method: 'POST'
            }).then((res) => {
                if (res.ok) {
                    return res.json();
                } else if (res.status === 401) {
                    OpenloginModal()
                } else {
                    throw new Error('Request failed with status ' + res.status);
                }
            }).catch(err => {
                console.log(err)
            })
        })
    })

}

function CartReady() {

}