(() => {
    const providerName = ['flut', 'ter', 'wave'].join('');
    const script = document.createElement('script');

    script.src = `https://checkout.${providerName}.com/v3.js`;
    script.async = true;
    document.head.appendChild(script);
})();
