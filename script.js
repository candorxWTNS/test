const tunnel = document.getElementById('tunnel');
const circles = 60;
const stepLabels = [
  "Step 1: Soap 제품 (세안용)",
  "Step 2: Serum 1 또는 Serum 1 Plus",
  "Step 3: Lotion",
  "Step 4: City Block 또는 Outdoor",
  "Step 5: Cleaning Milk → 이후 다시 Soap"
];

// 원형 터널 생성
for (let i = 0; i < circles; i++) {
  const c = document.createElement('div');
  c.classList.add('circle');
  const size = 30 + i * 20;
  c.style.width = `${size}px`;
  c.style.height = `${size}px`;
  c.style.opacity = `${1 - i / circles}`;
  tunnel.appendChild(c);
}

// 단계 텍스트 생성
stepLabels.forEach((label, index) => {
  const step = document.createElement('div');
  step.className = 'step';
  step.innerText = label;
  tunnel.appendChild(step);
});

// 스크롤에 따라 하나씩 표시
window.addEventListener('scroll', () => {
  const stepCount = stepLabels.length;
  const sectionHeight = document.body.scrollHeight / stepCount;
  const stepIndex = Math.floor(window.scrollY / sectionHeight);

  document.querySelectorAll('.step').forEach((step, index) => {
    if (index === stepIndex) {
      step.classList.add('visible');
    } else {
      step.classList.remove('visible');
    }
  });
});
