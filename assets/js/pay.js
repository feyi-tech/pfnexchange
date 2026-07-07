const FLUTTERWAVE_PAYMENT_CONFIG = {
    // Add your Flutterwave public key here, for example:
    // publicKey: 'FLWPUBK_TEST-your-public-key-here-X',
    publicKey: 'FLWPUBK-a3086ecbcb45167115f5e74b25684872-X',
    paymentTitle: 'Customer Payment',
    paymentDescription: 'Customer payment for service(s)',
    paymentOptions: '',
    logoUrl: ''
};

const FLUTTERWAVE_PUBLIC_KEY_PLACEHOLDER = 'FLWPUBK-public-X';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('paymentForm');
    const currency = document.getElementById('currency');
    const amount = document.getElementById('amount');
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

    const hasLiveFlutterwaveKey = () => {
        const key = FLUTTERWAVE_PAYMENT_CONFIG.publicKey.trim();
        return key && key !== FLUTTERWAVE_PUBLIC_KEY_PLACEHOLDER;
    };

    const setMessage = (text, type = 'info') => {
        message.textContent = text;
        message.dataset.type = type;
    };

    amount.addEventListener('input', () => {
        amount.value = amount.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
        setMessage('');
        formatAmount();
    });

    currency.addEventListener('change', () => {
        setMessage('');
        formatAmount();
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

        if (!hasLiveFlutterwaveKey()) {
            setMessage('Payment is temporarily unavailable. Please contact customer support.', 'error');
            return;
        }

        if (typeof window.FlutterwaveCheckout !== 'function') {
            setMessage('Payment gateway is still loading. Please try again in a moment.', 'error');
            return;
        }

        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const selectedCurrency = currency.value;
        const txRef = createTransactionReference();
        let paymentCompleted = false;

        payButton.disabled = true;
        setMessage('Opening secure checkout...', 'info');

        const checkoutConfig = {
            public_key: FLUTTERWAVE_PAYMENT_CONFIG.publicKey.trim(),
            tx_ref: txRef,
            amount: numericAmount,
            currency: selectedCurrency,
            customer: {
                email,
                name: `${firstName} ${lastName}`.trim()
            },
            customizations: {
                title: FLUTTERWAVE_PAYMENT_CONFIG.paymentTitle,
                description: FLUTTERWAVE_PAYMENT_CONFIG.paymentDescription,
                logo: FLUTTERWAVE_PAYMENT_CONFIG.logoUrl
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

        const paymentOptions = FLUTTERWAVE_PAYMENT_CONFIG.paymentOptions.trim();
        if (paymentOptions) {
            checkoutConfig.payment_options = paymentOptions;
        }

        window.FlutterwaveCheckout(checkoutConfig);
    });

    formatAmount();
});
