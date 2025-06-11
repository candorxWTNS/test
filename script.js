const tunnel = document.getElementById('tunnel');
const stepLabels = [
  "Step 1: Soap 제품 (세안용)",
  "Step 2: Serum 1 또는 Serum 1 Plus",
  "Step 3: Lotion",
  "Step 4: City Block 또는 Outdoor",
  "Step 5: Cleaning Milk → 이후 다시 Soap"
];

// 원형 터널 생성
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

// 텍스트 단계 배치
stepLabels.forEach((label, index) => {
  const step = document.createElement('div');
  step.className = 'step';
  step.innerText = label;
  const angle = index * Math.PI / 2.5;
  const radius = 80 + index * 60;
  step.style.left = `calc(50% + ${Math.cos(angle) * radius}px)`;
  step.style.top = `calc(50% + ${Math.sin(angle) * radius}px)`;
  tunnel.appendChild(step);
});

// 스크롤 시 텍스트 등장
window.addEventListener('scroll', () => {
  const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
  const stepIndex = Math.floor(scrollPercent * stepLabels.length);

  document.querySelectorAll('.step').forEach((step, i) => {
    step.classList.toggle('visible', i <= stepIndex);
  });
});
