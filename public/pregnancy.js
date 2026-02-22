/**
 * Pregnancy Companion Logic
 * Handles calculations for week, trimester, due date, and fetal growth.
 */

const PREGNANCY_DATA = {
  weeklyGrowth: {
    4: {
      length: 0.2,
      weight: 0.1,
      growthRate: 5,
      organs: { brain: 5, lungs: 2 },
      milestone:
        "Implantation complete. The blastocyst is now an embryo. Neural tube is forming.",
    },
    8: {
      length: 1.6,
      weight: 1.0,
      growthRate: 10,
      organs: { brain: 15, lungs: 5 },
      milestone:
        "Main organs and limbs are developing. The heart is beating regularly.",
    },
    12: {
      length: 5.4,
      weight: 14.0,
      growthRate: 15,
      organs: { brain: 25, lungs: 10 },
      milestone:
        "End of first trimester. Reflexes develop, and the baby moves its limbs.",
    },
    13: {
      length: 7.5,
      weight: 23.0,
      growthRate: 20,
      organs: { brain: 30, lungs: 15 },
      milestone:
        "Baby can move and swallow. Skeletal system and sex organs are forming rapidly.",
    },
    16: {
      length: 11.6,
      weight: 100.0,
      growthRate: 35,
      organs: { brain: 40, lungs: 25 },
      milestone:
        "Baby's eyes move and the ears are in their final position. Sucking motions begin.",
    },
    20: {
      length: 25.6,
      weight: 300.0,
      growthRate: 50,
      organs: { brain: 55, lungs: 40 },
      milestone:
        "Halfway point! Baby is covered in vernix. You may start feeling kicks (quickening).",
    },
    24: {
      length: 30.0,
      weight: 600.0,
      growthRate: 65,
      organs: { brain: 70, lungs: 60 },
      milestone:
        "Baby can respond to sounds. Lungs are beginning to produce surfactant.",
    },
    28: {
      length: 37.6,
      weight: 1000.0,
      growthRate: 75,
      organs: { brain: 85, lungs: 75 },
      milestone:
        "Third trimester begins. Eyes can blink and baby can see light through the womb.",
    },
    32: {
      length: 42.4,
      weight: 1700.0,
      growthRate: 85,
      organs: { brain: 90, lungs: 85 },
      milestone:
        "Baby is practicing breathing. Most major organs are fully functional.",
    },
    36: {
      length: 47.4,
      weight: 2600.0,
      growthRate: 95,
      organs: { brain: 95, lungs: 90 },
      milestone:
        "Baby is likely in a head-down position. Hearing is fully developed.",
    },
    40: {
      length: 51.2,
      weight: 3500.0,
      growthRate: 100,
      organs: { brain: 100, lungs: 100 },
      milestone:
        "Baby is full term and ready to meet the world! Lung development is complete.",
    },
  },
  recommendations: {
    1: {
      // Trimester 1
      title: "Trimester 1",
      recommended: [
        "Calcium-rich foods (milk, yoghurt)",
        "Folic acid and Iron tablets",
        "Protein: eggs, lentils",
        "Plenty of water (8-10 glasses)",
      ],
      avoid: [
        "Excess salt & caffeine",
        "Unpasteurized dairy",
        "Raw/undercooked eggs",
        "Smoking & alcohol",
      ],
      exercise: [
        "Walking (20 mins daily)",
        "Prenatal Yoga (gentle)",
        "Pelvic floor exercises",
        "Deep breathing",
      ],
      doctor: [
        "Pregnancy confirmation",
        "Blood & Urine tests",
        "Nuchal translucency scan",
        "First prenatal check",
      ],
    },
    2: {
      // Trimester 2
      title: "Trimester 2",
      recommended: [
        "Iron-rich foods (spinach)",
        "Omega-3 (walnuts, chia)",
        "Vitamin C for iron absorption",
        "Healthy snacks (fruits, nuts)",
      ],
      avoid: [
        "Lying flat on your back",
        "Heavy lifting (>5kg)",
        "High-mercury fish",
        "Long periods of standing",
      ],
      exercise: [
        "Swimming",
        "Modified Aerobics",
        "Side-lying stretches",
        "Pelvic tilts",
      ],
      doctor: [
        "Anatomy scan (18-20 wks)",
        "Glucose tolerance test",
        "Blood pressure checks",
        "Fetal doppler check",
      ],
    },
    3: {
      // Trimester 3
      title: "Trimester 3",
      recommended: [
        "Small frequent meals",
        "DHA-rich foods for brain",
        "High-fiber for digestion",
        "Hydration is critical",
      ],
      avoid: [
        "Long distance travel",
        "Strenuous activities",
        "Raw sprouts",
        "Excessive spicy foods",
      ],
      exercise: [
        "Short walks",
        "Birth ball exercises",
        "Gentle stretching",
        "Kegel exercises",
      ],
      doctor: [
        "Weekly/Bi-weekly checkups",
        "GBS screening",
        "Growth ultrasound",
        "Birth plan discussion",
      ],
    },
  },
};

let pregnancyLogs = JSON.parse(localStorage.getItem("pregnancyLogs")) || [];

function initPregnancy() {
  console.log("Initializing Pregnancy Companion...");
  const lmpInput = document.getElementById("lmp-date");
  if (lmpInput) {
    // Set default value to today if not set
    if (!lmpInput.value) {
      const today = new Date().toISOString().split("T")[0];
      lmpInput.value = today;
    }

    // Remove existing listener to avoid duplicates
    lmpInput.removeEventListener("change", updatePregnancyStats);
    lmpInput.addEventListener("change", updatePregnancyStats);
    updatePregnancyStats();
  }
  renderHistoricalTrends();
}

function updatePregnancyStats() {
  const lmpValue = document.getElementById("lmp-date").value;
  if (!lmpValue) return;

  const lmpDate = new Date(lmpValue);
  const today = new Date();

  // Difference in milliseconds
  const diffTime = today - lmpDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const week = Math.max(1, Math.floor(diffDays / 7));
  const month = Math.max(1, Math.floor(week / 4) + 1);
  let trimester = 1;
  if (week > 13) trimester = 2;
  if (week > 27) trimester = 3;

  // Due Date (LMP + 280 days)
  const dueDate = new Date(lmpDate);
  dueDate.setDate(dueDate.getDate() + 280);
  const dueDateStr = dueDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Update UI
  const weekDisplay = document.getElementById("preg-week-display");
  if (weekDisplay) weekDisplay.textContent = `W ${week}`;

  const monthDisplay = document.getElementById("preg-month-val");
  if (monthDisplay) monthDisplay.textContent = `${Math.min(month, 9)} of 9`;

  const trimesterDisplay = document.getElementById("preg-trimester-val");
  if (trimesterDisplay)
    trimesterDisplay.textContent = `${trimester}${getOrdinal(trimester)} Trimester`;

  const dueDateDisplay = document.getElementById("preg-due-date-val");
  if (dueDateDisplay) dueDateDisplay.textContent = dueDateStr;

  // Progress bar (max 40 weeks)
  const progressPercent = Math.min((week / 40) * 100, 100);
  const progressBar = document.getElementById("preg-progress-bar");
  if (progressBar) progressBar.style.width = `${progressPercent}%`;

  const progressVal = document.getElementById("preg-progress-val");
  if (progressVal) progressVal.textContent = `${Math.min(week, 40)} / 40 wks`;

  // Circular progress (CSS Variable)
  const circle = document.getElementById("preg-circle");
  if (circle)
    circle.style.setProperty("--preg-progress", `${progressPercent}%`);

  updateFetalAnalysis(week);
  updateLifestyleAdvice(trimester);
}

function updateFetalAnalysis(week) {
  // Find the closest week data available that is not greater than the current week
  const availableWeeks = Object.keys(PREGNANCY_DATA.weeklyGrowth)
    .map(Number)
    .sort((a, b) => b - a);
  const closestWeek =
    availableWeeks.find((w) => w <= week) ||
    availableWeeks[availableWeeks.length - 1];
  const data = PREGNANCY_DATA.weeklyGrowth[closestWeek];

  const lengthEl = document.getElementById("fetal-length");
  // Simple interpolation for length and weight between milestones
  if (lengthEl) lengthEl.textContent = `${data.length}`;

  const weightEl = document.getElementById("fetal-weight");
  if (weightEl) weightEl.textContent = `${data.weight}`;

  const ageEl = document.getElementById("fetal-age");
  if (ageEl) ageEl.textContent = `${week}.0`;

  const growthEl = document.getElementById("fetal-growth");
  if (growthEl) growthEl.textContent = `${data.growthRate}.0`;

  const brainBar = document.getElementById("organ-brain-progress");
  const brainVal = document.getElementById("organ-brain-val");
  if (brainBar) brainBar.style.width = `${data.organs.brain}%`;
  if (brainVal) brainVal.textContent = `${data.organs.brain}%`;

  const lungsBar = document.getElementById("organ-lungs-progress");
  const lungsVal = document.getElementById("organ-lungs-val");
  if (lungsBar) lungsBar.style.width = `${data.organs.lungs}%`;
  if (lungsVal) lungsVal.textContent = `${data.organs.lungs}%`;

  const milestoneEl = document.getElementById("milestone-text");
  if (milestoneEl) milestoneEl.textContent = data.milestone;

  updateFetalVisualization(week);
}

function updateFetalVisualization(week) {
  const target = document.getElementById("fetal-svg-target");
  if (!target) return;

  let stage = 1;
  if (week > 12) stage = 2;
  if (week > 24) stage = 3;
  if (week > 34) stage = 4;

  // Only update if stage changed (or first run)
  if (target.dataset.currentStage == stage) return;
  target.dataset.currentStage = stage;

  // Fade out
  target.style.opacity = "0.3";
  target.style.transform = "scale(0.8)";

  setTimeout(() => {
    target.innerHTML = getFetalSVG(stage);
    // Fade in
    target.style.opacity = "1";
    target.style.transform = "scale(1.1)";
  }, 300);
}

function getFetalSVG(stage) {
  const gradients = `
        <defs>
            <radialGradient id="fetalGrad${stage}" cx="50%" cy="50%" r="50%">
                <stop offset="0%" style="stop-color:#ff8eb3;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#db2777;stop-opacity:1" />
            </radialGradient>
            <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
        </defs>`;

  if (stage === 1) {
    // Embryo (Weeks 1-12)
    return `<svg viewBox="0 0 200 200" class="w-48 h-48 drop-shadow-2xl">
            ${gradients}
            <path d="M100,60 C120,60 140,80 140,110 C140,140 120,160 100,160 C80,160 60,140 60,110 C60,95 70,85 85,85 C95,85 100,90 100,100" 
                  fill="none" stroke="url(#fetalGrad1)" stroke-width="12" stroke-linecap="round" filter="url(#glow)" class="animate-pulse" />
            <circle cx="95" cy="85" r="5" fill="#fbcfe8" />
        </svg>`;
  } else if (stage === 2) {
    // Early Fetus (Weeks 13-24)
    return `<svg viewBox="0 0 200 200" class="w-48 h-48 drop-shadow-2xl">
            ${gradients}
            <path d="M100,50 C130,50 150,70 150,110 C150,150 120,170 100,170 C80,170 50,150 50,110 C50,70 70,50 100,50 M80,130 L60,150 M120,130 L140,150 M100,170 L100,190" 
                  fill="none" stroke="url(#fetalGrad2)" stroke-width="10" stroke-linecap="round" filter="url(#glow)" class="animate-pulse" />
            <circle cx="100" cy="85" r="30" fill="none" stroke="url(#fetalGrad2)" stroke-width="8" filter="url(#glow)" />
            <circle cx="90" cy="80" r="3" fill="#fbcfe8" />
            <circle cx="110" cy="80" r="3" fill="#fbcfe8" />
        </svg>`;
  } else if (stage === 3) {
    // Developing Fetus (Weeks 25-34)
    return `<svg viewBox="0 0 200 200" class="w-48 h-48 drop-shadow-2xl">
            ${gradients}
            <path d="M100,40 C140,40 160,70 160,120 C160,170 130,190 100,190 C70,190 40,170 40,120 C40,70 60,40 100,40 M70,110 Q50,130 65,150 M130,110 Q150,130 135,150 M100,140 Q100,180 120,175" 
                  fill="none" stroke="url(#fetalGrad3)" stroke-width="12" stroke-linecap="round" filter="url(#glow)" class="animate-pulse" />
            <circle cx="100" cy="80" r="35" fill="none" stroke="url(#fetalGrad3)" stroke-width="10" filter="url(#glow)" />
            <path d="M85,85 Q100,95 115,85" fill="none" stroke="#fbcfe8" stroke-width="3" stroke-linecap="round" />
        </svg>`;
  } else {
    // Full Term (Weeks 35-42)
    return `<svg viewBox="0 0 200 200" class="w-48 h-48 drop-shadow-2xl">
            ${gradients}
            <path d="M100,30 C150,30 170,70 170,130 C170,180 140,200 100,200 C60,200 30,180 30,130 C30,70 50,30 100,30 M60,120 Q40,140 60,170 M140,120 Q160,140 140,170 M100,150 Q100,200 130,190" 
                  fill="none" stroke="url(#fetalGrad4)" stroke-width="14" stroke-linecap="round" filter="url(#glow)" class="animate-pulse" />
            <circle cx="100" cy="80" r="40" fill="none" stroke="url(#fetalGrad4)" stroke-width="12" filter="url(#glow)" />
            <circle cx="85" cy="75" r="4" fill="#fbcfe8" />
            <circle cx="115" cy="75" r="4" fill="#fbcfe8" />
            <path d="M88,95 Q100,105 112,95" fill="none" stroke="#fbcfe8" stroke-width="3" stroke-linecap="round" />
        </svg>`;
  }
}

function updateLifestyleAdvice(trimester) {
  const advice =
    PREGNANCY_DATA.recommendations[trimester] ||
    PREGNANCY_DATA.recommendations[1];

  // Update section subtitle
  const subtitle = document.getElementById("lifestyle-subtitle");
  if (subtitle) {
    subtitle.textContent = `Tailored recommendations for ${advice.title}`;
  }

  renderAdviceList(
    "advice-recommended",
    advice.recommended,
    "fa-check-circle",
    "text-green-600",
  );
  renderAdviceList(
    "advice-avoid",
    advice.avoid,
    "fa-times-circle",
    "text-red-600",
  );
  renderAdviceList(
    "advice-exercise",
    advice.exercise,
    "fa-walking",
    "text-blue-600",
  );
  renderAdviceList(
    "advice-doctor",
    advice.doctor,
    "fa-user-md",
    "text-indigo-600",
  );
}

function renderAdviceList(containerId, items, icon, colorClass) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = items
    .map(
      (item) => `
        <div class="flex items-start gap-2 mb-2">
            <i class="fas ${icon} ${colorClass} mt-1 text-[10px]"></i>
            <span class="text-xs text-gray-700 font-medium">${item}</span>
        </div>
    `,
    )
    .join("");
}

function savePregnancyLog() {
  const weight = document.getElementById("log-weight").value;
  const bp = document.getElementById("log-bp").value;
  const sugar = document.getElementById("log-sugar").value;
  const hb = document.getElementById("log-hb").value;

  if (!weight && !bp && !sugar && !hb) {
    if (window.showNotification)
      window.showNotification("Please enter at least one metric.", "info");
    return;
  }

  const log = {
    date: new Date().toLocaleDateString("en-GB"),
    weight: weight || "-",
    bp: bp || "-",
    sugar: sugar || "-",
    hb: hb || "-",
  };

  pregnancyLogs.unshift(log);
  localStorage.setItem("pregnancyLogs", JSON.stringify(pregnancyLogs));

  // Clear inputs
  document.getElementById("log-weight").value = "";
  document.getElementById("log-bp").value = "";
  document.getElementById("log-sugar").value = "";
  document.getElementById("log-hb").value = "";

  if (window.showNotification)
    window.showNotification("Log saved successfully!", "success");
  renderHistoricalTrends();
}

function renderHistoricalTrends() {
  const container = document.getElementById("historical-trends-body");
  if (!container) return;

  if (pregnancyLogs.length === 0) {
    container.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-gray-500 italic text-xs">No logs recorded yet.</td></tr>`;
    return;
  }

  container.innerHTML = pregnancyLogs
    .slice(0, 5)
    .map(
      (log) => `
        <tr class="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
            <td class="py-3 text-[10px] text-gray-700">${log.date}</td>
            <td class="py-3 text-[10px] text-gray-700 font-bold text-center">${log.weight}</td>
            <td class="py-3 text-[10px] text-gray-700 font-bold text-center">${log.bp}</td>
            <td class="py-3 text-[10px] text-gray-700 font-bold text-center">${log.sugar}</td>
            <td class="py-3 text-[10px] text-gray-700 font-bold text-center">${log.hb}</td>
        </tr>
    `,
    )
    .join("");
}

function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// AI Pregnancy Companion Expert Function
async function PregnancyAI(query) {
  if (!query || query.trim() === "") return;

  const inputArea = document.getElementById("preg-ai-input");
  const responseArea = document.getElementById("preg-ai-results");

  // Add user message to chat
  const userMsg = document.createElement("div");
  userMsg.className = "flex justify-end gap-3 mb-4";
  userMsg.innerHTML = `
        <div class="bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-2xl rounded-tr-none p-4 text-xs shadow-md max-w-[80%]">
            ${query}
        </div>
    `;
  responseArea.appendChild(userMsg);

  // Clear input
  if (inputArea) inputArea.value = "";

  // Typing indicator
  const typingIndicator = document.createElement("div");
  typingIndicator.className = "flex gap-3 mb-4 loading-indicator";
  typingIndicator.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
            <i class="fas fa-robot text-pink-600 text-xs"></i>
        </div>
        <div class="bg-gray-100 rounded-2xl rounded-tl-none p-3 text-xs text-gray-500 animate-pulse">
            Sanjeevani is thinking...
        </div>
    `;
  responseArea.appendChild(typingIndicator);
  responseArea.scrollTo({ top: responseArea.scrollHeight, behavior: "smooth" });

  try {
    const response = await fetch("/api/pregnancy-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: query,
        language: window.aiLanguage || "en",
        systemPrompt:
          "You are Sanjeevani, a specialized AI Pregnancy Expert for LifePulse. Provide medically accurate, empathetic, and culturally relevant advice for pregnant women in rural India. Always advise consulting a doctor for any pain or serious symptoms.",
      }),
    });

    if (!response.ok) throw new Error("Pregnancy AI error");

    const data = await response.json();

    // Remove typing indicator
    typingIndicator.remove();

    // Add AI response
    const aiMsg = document.createElement("div");
    aiMsg.className = "flex gap-3 mb-4";
    aiMsg.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                <i class="fas fa-robot text-pink-600 text-xs"></i>
            </div>
            <div class="bg-gray-100 rounded-2xl rounded-tl-none p-4 text-xs text-gray-700 leading-relaxed shadow-sm">
                ${data.reply || data.response}
            </div>
        `;
    responseArea.appendChild(aiMsg);
    responseArea.scrollTo({
      top: responseArea.scrollHeight,
      behavior: "smooth",
    });

    // Speak response if enabled
    if (window.isAutoSpeak && window.speakResponse) {
      window.speakResponse(data.reply || data.response);
    }
  } catch (error) {
    console.error("Pregnancy AI Error:", error);
    if (typingIndicator) typingIndicator.remove();
    const errMsg = document.createElement("div");
    errMsg.className = "flex gap-3 mb-4";
    errMsg.innerHTML = `
            <div class="bg-red-50 text-red-600 rounded-2xl p-4 text-xs border border-red-100">
                I'm sorry, I'm having trouble connecting to my medical database. Please try again or check your internet.
            </div>
        `;
    responseArea.appendChild(errMsg);
  }
}

// AI Companion Sidebar Toggle
function togglePregnancyAI(forceState) {
  const panel = document.getElementById("pregnancy-ai-panel");
  if (!panel) return;

  if (forceState === true) {
    panel.classList.remove("hidden");
  } else if (forceState === false) {
    panel.classList.add("hidden");
  } else {
    panel.classList.toggle("hidden");
  }
}

// Export functions to window
window.initPregnancy = initPregnancy;
window.updatePregnancyStats = updatePregnancyStats;
window.savePregnancyLog = savePregnancyLog;
window.togglePregnancyAI = togglePregnancyAI;
window.PregnancyAI = PregnancyAI;
