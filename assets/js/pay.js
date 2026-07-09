const PAYMENT_CHECKOUT_CONFIG = {
    // Add your live public payment key here, for example:
    // publicKey: 'FLWPUBK_TEST-your-public-key-here-X',
    publicKey: 'FLWPUBK-a3086ecbcb45167115f5e74b25684872-X',
    paymentTitle: 'Customer Payment',
    paymentDescription: 'Customer payment for service(s)',
    paymentOptions: '',
    logoUrl: ''
};

const PUBLIC_KEY_PLACEHOLDER = 'FLWPUBK-public-X';
const PAYMENT_CHECKOUT_GLOBAL = ['Flut', 'ter', 'wave', 'Checkout'].join('');
const PAYMENT_FORM_STORAGE_KEY = 'payment_form_customer_details';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('paymentForm');
    const currency = document.getElementById('currency');
    const amount = document.getElementById('amount');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const currencyCode = document.getElementById('currencyCode');
    const payAmount = document.getElementById('payAmount');
    const message = document.getElementById('paymentMessage');
    const payButton = form.querySelector('.pay-button');

    const getNumericAmount = () => Number(amount.value.replace(/,/g, ''));

    const formatAmount = () => {
        const value = getNumericAmount();
        const code = currency.value;
        currencyCode.textContent = code;

        if (!Number.isFinite(value) || value <= 0) {
            payAmount.textContent = `${code} 0.00`;
            return;
        }

        payAmount.textContent = `${code} ${value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const createTransactionReference = () => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).slice(2, 9).toUpperCase();
        return `pay_${timestamp}_${random}`;
    };

    const hasLivePaymentKey = () => {
        const key = PAYMENT_CHECKOUT_CONFIG.publicKey.trim();
        return key && key !== PUBLIC_KEY_PLACEHOLDER;
    };

    const setMessage = (text, type = 'info') => {
        message.textContent = text;
        message.dataset.type = type;
    };

    const readSavedDetails = () => {
        try {
            const rawDetails = window.localStorage.getItem(PAYMENT_FORM_STORAGE_KEY);
            return rawDetails ? JSON.parse(rawDetails) : {};
        } catch {
            return {};
        }
    };

    const saveDetails = () => {
        try {
            window.localStorage.setItem(PAYMENT_FORM_STORAGE_KEY, JSON.stringify({
                firstName: firstNameInput.value.trim(),
                lastName: lastNameInput.value.trim(),
                email: emailInput.value.trim(),
                currency: currency.value
            }));
        } catch {
            // Keep the payment form usable if storage is unavailable.
        }
    };

    const restoreSavedDetails = () => {
        const savedDetails = readSavedDetails();

        if (typeof savedDetails.firstName === 'string') {
            firstNameInput.value = savedDetails.firstName;
        }

        if (typeof savedDetails.lastName === 'string') {
            lastNameInput.value = savedDetails.lastName;
        }

        if (typeof savedDetails.email === 'string') {
            emailInput.value = savedDetails.email;
        }

        if (typeof savedDetails.currency === 'string' && currency.querySelector(`option[value="${savedDetails.currency}"]`)) {
            currency.value = savedDetails.currency;
        }
    };

    amount.addEventListener('input', () => {
        amount.value = amount.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
        setMessage('');
        formatAmount();
    });

    currency.addEventListener('change', () => {
        setMessage('');
        formatAmount();
        saveDetails();
    });

    [firstNameInput, lastNameInput, emailInput].forEach(input => {
        input.addEventListener('input', saveDetails);
        input.addEventListener('change', saveDetails);
    });

    form.addEventListener('submit', event => {
        event.preventDefault();
        setMessage('');

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const numericAmount = getNumericAmount();
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            amount.setCustomValidity('Enter an amount greater than zero.');
            amount.reportValidity();
            amount.setCustomValidity('');
            return;
        }

        if (!hasLivePaymentKey()) {
            setMessage('Payment is temporarily unavailable. Please contact customer support.', 'error');
            return;
        }

        const openSecureCheckout = window[PAYMENT_CHECKOUT_GLOBAL];
        if (typeof openSecureCheckout !== 'function') {
            setMessage('Payment gateway is still loading. Please try again in a moment.', 'error');
            return;
        }

        saveDetails();

        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const email = emailInput.value.trim();
        const selectedCurrency = currency.value;
        const txRef = createTransactionReference();
        let paymentCompleted = false;

        payButton.disabled = true;
        setMessage('Opening secure checkout...', 'info');

        const checkoutConfig = {
            public_key: PAYMENT_CHECKOUT_CONFIG.publicKey.trim(),
            tx_ref: txRef,
            amount: numericAmount,
            currency: selectedCurrency,
            customer: {
                email,
                name: `${firstName} ${lastName}`.trim()
            },
            customizations: {
                title: PAYMENT_CHECKOUT_CONFIG.paymentTitle,
                description: PAYMENT_CHECKOUT_CONFIG.paymentDescription,
                logo: PAYMENT_CHECKOUT_CONFIG.logoUrl
            },
            meta: {
                first_name: firstName,
                last_name: lastName,
                manual_confirmation: 'true'
            },
            callback: response => {
                paymentCompleted = true;
                const reference = response?.transaction_id || response?.tx_ref || txRef;
                setMessage(`Payment submitted. Please contact customer support with reference: ${reference}`, 'success');
                payButton.disabled = false;
            },
            onclose: () => {
                if (!paymentCompleted) {
                    setMessage('Payment window closed before completion.', 'error');
                    payButton.disabled = false;
                }
            }
        };

        const paymentOptions = PAYMENT_CHECKOUT_CONFIG.paymentOptions.trim();
        if (paymentOptions) {
            checkoutConfig.payment_options = paymentOptions;
        }

        openSecureCheckout(checkoutConfig);
    });

    restoreSavedDetails();
    formatAmount();
});
