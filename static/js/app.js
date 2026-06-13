document.addEventListener('DOMContentLoaded', () => {
  fetch('/api/products/')
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('product-list');
      container.innerHTML = data.map(p => `<div>${p.name} - Rs. ${p.price}</div>`).join('');
    })
    .catch(err => console.error('Error fetching products:', err));
});
