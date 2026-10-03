'use client';

import { useEffect, useState } from 'react';

const FLUTTERWAVE_PUBLIC_KEY = 'FLWPUBK-a3086ecbcb45167115f5e74b25684872-X';
const CURRENCIES = [
  ['NGN', 'Nigerian naira'], ['GHS', 'Ghanaian cedi'], ['USD', 'US dollar'], ['GBP', 'British pound'], ['EUR', 'Euro']
];

function isFlutterwavePaymentLink(value) {
  try {
    const url = new URL(value);
    return url.origin === 'https://checkout.flutterwave.com'
      && !url.username
      && !url.password
      && /^\/v3\/hosted\/pay\/[^/]+$/.test(url.pathname);
  } catch {
    return false;
  }
}

function loadFlutterwave() {
  return new Promise((resolve, reject) => {
    if (typeof window.FlutterwaveCheckout === 'function') return resolve(window.FlutterwaveCheckout);
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    script.onload = () => typeof window.FlutterwaveCheckout === 'function' ? resolve(window.FlutterwaveCheckout) : reject(new Error('Checkout could not be loaded.'));
    script.onerror = () => reject(new Error('Checkout could not be loaded.'));
    document.head.appendChild(script);
  });
}

export default function PaymentPage() {
  const [paymentLink, setPaymentLink] = useState(null);
  const [queryReady, setQueryReady] = useState(false);
  const [redirectError, setRedirectError] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [amount, setAmount] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [reference, setReference] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const link = new URLSearchParams(window.location.search).get('u');
    setPaymentLink(link);
    setQueryReady(true);
    if (!link) return;
    if (!isFlutterwavePaymentLink(link)) {
      setRedirectError('The payment link is invalid. Please request a new payment link.');
      return;
    }
    window.location.replace(link);
  }, []);

  if (!queryReady || paymentLink) {
    return (
      <main className="initialising" aria-live="polite">
        <div className="initialising-mark" aria-hidden="true">LC</div>
        <p>Initialising payment…</p>
        {redirectError && <small>{redirectError}</small>}
      </main>
    );
  }

  const numericAmount = Number(amount.replace(/,/g, ''));
  const formattedAmount = Number.isFinite(numericAmount) && numericAmount > 0
    ? `${currency} ${numericAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `${currency} 0.00`;

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setMessage('Enter an amount greater than zero.');
      return;
    }

    setSubmitting(true);
    try {
      const openCheckout = await loadFlutterwave();
      openCheckout({
        public_key: FLUTTERWAVE_PUBLIC_KEY,
        tx_ref: `lushy_${Date.now()}_${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
        amount: numericAmount,
        currency,
        customer: { email: email.trim(), name: `${firstName.trim()} ${lastName.trim()}`.trim() },
        customizations: {
          title: 'Lushycrown Payment',
          description: reference.trim() ? `Payment for ${reference.trim()}` : 'Payment for goods and services'
        },
        meta: { first_name: firstName.trim(), last_name: lastName.trim(), payment_reference: reference.trim() },
        callback: () => setMessage('Payment submitted. You will receive confirmation from Lushycrown.'),
        onclose: () => setSubmitting(false)
      });
    } catch (error) {
      setMessage(error.message || 'Unable to start checkout. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <main className="site-shell">
      <div className="topbar"><span>Welcome to Lushycrown</span><a href="https://lushycrown.com/">Continue shopping</a></div>
      <header className="header"><a className="brand" href="https://lushycrown.com/" aria-label="Lushycrown home"><span>LC</span><strong>Lushycrown</strong></a><span className="secure">◌ Secure customer payment</span></header>
      <section className="checkout" aria-labelledby="payment-title">
        <div className="intro"><p className="eyebrow">CUSTOMER PAYMENT</p><h1 id="payment-title">Complete your payment</h1><p>Pay Lushycrown securely for your order, goods, or services.</p><div className="assurance"><span>✓</span><p><strong>Your details are protected</strong><br />Payments are processed securely by Flutterwave.</p></div></div>
        <form onSubmit={submit} className="payment-form">
          <div className="section-label">Payment details</div>
          <label>Currency<select value={currency} onChange={event => setCurrency(event.target.value)}>{CURRENCIES.map(([code, label]) => <option key={code} value={code}>{code} — {label}</option>)}</select></label>
          <label>Amount<div className="amount-input"><span>{currency}</span><input value={amount} onChange={event => setAmount(event.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1'))} inputMode="decimal" placeholder="0.00" required /></div></label>
          <label>Order reference <span className="optional">Optional</span><input value={reference} onChange={event => setReference(event.target.value)} placeholder="Order number or item" /></label>
          <div className="section-label customer-label">Your details</div>
          <div className="split"><label>First name<input value={firstName} onChange={event => setFirstName(event.target.value)} autoComplete="given-name" required /></label><label>Last name<input value={lastName} onChange={event => setLastName(event.target.value)} autoComplete="family-name" required /></label></div>
          <label>Email address<input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" required /></label>
          <button disabled={submitting} type="submit">{submitting ? 'Opening checkout…' : <><span>Pay securely</span><strong>{formattedAmount}</strong></>}</button>
          <p className="form-message" role="status">{message}</p>
        </form>
      </section>
      <footer>Need help with a payment? <a href="mailto:chikannawuotu@gmail.com">Contact Lushycrown support</a></footer>
    </main>
  );
}
