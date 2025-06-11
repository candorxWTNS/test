const tunnel = document.getElementById('tunnel');
const circles = 60;

for (let i = 0; i < circles; i++) {
  const c = document.createElement('div');
  c.classList.add('circle');
  c.style.width = `${20 + i * 20}px`;
  c.style.height = `${20 + i * 20}px`;
  c.style.opacity = `${1 - i / circles}`;
  tunnel.appendChild(c);
}

const stepLabels = [
  "Step 1: Soap 제품 (세안용)",
  "Step 2: Serum 1 또는 Serum 1 Plus",
  "Step 3: Lotion",
  "Step 4: City Block 또는 Outdoor",
  "Step 5: Cleaning Milk → 이후 다시 Soap"
];

stepLabels.forEach((label, index) => {
  const text = document.createElement('div');
  text.className = 'step';
  text.innerText = label;
  const angle = index * Math.PI / (stepLabels.length - 1);
  const radius = 150 + index * 80;
  text.style.left = `calc(50% + ${Math.cos(angle) * radius}px)`;
  text.style.top = `calc(50% + ${Math.sin(angle) * radius}px)`;
  tunnel.appendChild(text);
});

window.addEventListener('scroll', () => {
  document.querySelectorAll('.step').forEach((step, index) => {
    const triggerPoint = window.scrollY / document.body.scrollHeight * stepLabels.length;
    if (index < triggerPoint + 1) {
      step.classList.add('visible');
    }
  });
});
