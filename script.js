const tunnel = document.getElementById('tunnel');
const stepLabels = [
  "Step 1: Soap 제품 (세안용)",
  "Step 2: Serum 1 또는 Serum 1 Plus",
  "Step 3: Lotion",
  "Step 4: City Block 또는 Outdoor",
  "Step 5: Cleaning Milk → 이후 다시 Soap"
];

// 터널 원 생성
const circles = 80;
for (let i = 0; i < circles; i++) {
  const circle = document.createElement('div');
  circle.className = 'circle';
  const size = 100 + i * 15;
  circle.style.width = `${size}px`;
  circle.style.height = `${size}px`;
  circle.style.opacity = 1 - i / circles;
  tunnel.appendChild(circle);
}

// 텍스트 단계 배치 (나선형)
const steps = [];
stepLabels.forEach((label, index) => {
  const step = document.createElement('div');
  step.className = 'step';
  step.innerText = label;

  const angle = index * 0.6 * Math.PI; // 나선 각도 증가
  const radius = 50 + index * 100;
  step.style.left = `calc(50% + ${Math.cos(angle) * radius}px)`;
  step.style.top = `calc(50% + ${Math.sin(angle) * radius}px)`;

  tunnel.appendChild(step);
  steps.push(step);
});

// 스크롤에 따라 텍스트 나타나기
window.addEventListener('scroll', () => {
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const scrollRatio = window.scrollY / maxScroll;

  const total = steps.length;
  const visibleCount = Math.floor(scrollRatio * (total + 1));

  steps.forEach((step, i) => {
    if (i <= visibleCount) {
      step.classList.add('visible');
    } else {
      step.classList.remove('visible');
    }
  });
});
