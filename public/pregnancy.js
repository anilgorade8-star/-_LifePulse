/**
 * Pregnancy Companion Logic
 * Handles calculations for week, trimester, due date, and fetal growth.
 */

const PREGNANCY_DATA = {
  weeklyGrowth: {
    13: {
      length: 7.5,
      weight: 23.0,
      growthRate: 20,
      organs: { brain: 30, lungs: 15 },
      milestone:
        "Baby can move and swallow. Skeletal system and sex organs are forming rapidly.",
    },
    // Add more weeks as needed, following the medical standards
    14: {
      length: 8.7,
      weight: 43.0,
      growthRate: 25,
      organs: { brain: 35, lungs: 18 },
      milestone: "Baby's neck is getting longer, and the head is more erect.",
    },
    // ...
  },
  recommendations: {
    1: {
      // Trimester 1
      recommended: [
        "Calcium-rich foods (milk, yoghurt, tofu)",
        "Protein: eggs, chicken, legumes",
        "Omega-3: walnuts, flax seeds",
        "Plenty of fluids",
      ],
      avoid: [
        "Excess salt (risk of oedema)",
        "Processed junk food",
        "Papaya & pineapple (In large amounts)",
        "Smoking & passive smoke",
      ],
      exercise: [
        "Swimming – great joint-safe cardio",
        "Prenatal aerobics",
        "Stretching & light weights",
        "Avoid lying flat on back",
      ],
      doctor: [
        "Anatomy scan (18–20 weeks)",
        "Glucose tolerance test",
        "Blood pressure monitoring",
        "Iron level check",
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
  const diffTime = Math.abs(today - lmpDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const week = Math.floor(diffDays / 7) + 1;
  const month = Math.floor(week / 4) + 1;
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
  if (monthDisplay) monthDisplay.textContent = `${month} of 9`;

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
  if (progressVal) progressVal.textContent = `${week} / 40 wks`;

  // Circular progress (CSS Variable)
  const circle = document.getElementById("preg-circle");
  if (circle)
    circle.style.setProperty("--preg-progress", `${progressPercent}%`);

  updateFetalAnalysis(week);
  updateLifestyleAdvice(trimester);
}

function updateFetalAnalysis(week) {
  const data =
    PREGNANCY_DATA.weeklyGrowth[week] || PREGNANCY_DATA.weeklyGrowth[13]; // Fallback to week 13

  const lengthEl = document.getElementById("fetal-length");
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
}

function updateLifestyleAdvice(trimester) {
  const advice =
    PREGNANCY_DATA.recommendations[trimester] ||
    PREGNANCY_DATA.recommendations[1];

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
    const response = await fetch("/api/chat", {
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
