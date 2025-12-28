// 只在 PC 端启用
// if (window.matchMedia('(hover: hover)').matches) {

//   document.addEventListener("click", e => {
//     const colors = ["#f59d9fff", "#ffa940", "#40a9ff", "#73d13d", "#9254de"];
//     const count = 12;

//     for (let i = 0; i < count; i++) {
//       const particle = document.createElement("span");
//       particle.className = "firework";

//       const angle = (Math.PI * 2 * i) / count;
//       const distance = Math.random() * 80 + 20;

//       particle.style.left = e.clientX + "px";
//       particle.style.top = e.clientY + "px";
//       particle.style.background = colors[Math.floor(Math.random() * colors.length)];

//       particle.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
//       particle.style.setProperty("--y", `${Math.sin(angle) * distance}px`);

//       document.body.appendChild(particle);

//       // 自动清理
//       setTimeout(() => particle.remove(), 700);
//     }
//   });

// }
console.log("🔥 firework injected");

alert("firework loaded");
