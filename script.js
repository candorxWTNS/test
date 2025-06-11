const tunnel = document.getElementById('tunnel');
const stepLabels = [
  "Step 1: Soap 제품 (세안용)",
  "Step 2: Serum 1 또는 Serum 1 Plus",
  "Step 3: Lotion",
  "Step 4: City Block 또는 Outdoor",
  "Step 5: Cleaning Milk → 이후 다시 Soap"
];

// Create tunnel rings
for (let i = 0; i < 60; i++) {
  const circle = document.createElement('div');
  circle.classList.add('circle');
  const size = 30 + i * 20;
  circle.style.width = `${size}px`;
  circle.style.height = `${size}px`;
  circle.style.opacity = `${1 - i / 60}`;
  tunnel.appendChild(circle);
}

// Add step text
stepLabels.forEach((label, index) => {
  const step = document.createElement('div');
  step.className = 'step';
  step.innerText = label;
  tunnel.appendChild(step);
});

const steps = document.querySelectorAll('.step');

window.addEventListener('scroll', () => {
  const scrollRatio = window.scrollY / (document.body.scrollHeight - window.innerHeight);
  const currentIndex = Math.floor(scrollRatio * stepLabels.length);

  steps.forEach((step, index) => {
    step.classList.toggle('visible', index === currentIndex);
  });
});
