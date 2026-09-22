// Default WAT words (common SSB practice words)
const DEFAULT_WORDS = [
  "Success", "Failure", "Leader", "Bravery", "Confidence",
  "Hard work", "Discipline", "Education", "Teamwork", "Respect",
  "Courage", "Responsibility", "Dedication", "Loyalty", "Patience",
  "Wisdom", "Army", "Soldier", "Strategy", "Honesty",
  "Integrity", "Character", "Knowledge", "Teacher", "Reading",
  "Morning", "Time", "Service", "Protection", "Defence",
  "Advice", "Ambitious", "Careful", "Important", "Choice",
  "Help", "Friendship", "Unity", "Champion", "Pride",
  "Country", "Freedom", "Necessity", "Accident", "Fear",
  "Death", "Crisis", "Defeat", "Enemy", "Pain",
  "Love", "Mother", "Father", "Friend", "Home",
  "Book", "Rain", "Journey", "Victory", "Hope",
  "Truth", "Justice", "Peace", "War", "Gun",
  "Money", "Power", "Dream", "Future", "Past",
  "Work", "Play", "Sport", "Health", "Mind",
  "Body", "Speed", "Strength", "Weakness", "Mistake"
];

const WORD_DURATION = 15; // seconds
const TARGET_WORDS = 60;

let words = [...DEFAULT_WORDS];
let currentIndex = 0;
let responses = [];
let timerInterval = null;
let timeLeft = WORD_DURATION;
let isRunning = false;

// DOM Elements
const landing = document.getElementById("landing");
const testScreen = document.getElementById("test");
const resultsScreen = document.getElementById("results");

const uploadBtn = document.getElementById("uploadBtn");
const wordFile = document.getElementById("wordFile");
const fileName = document.getElementById("fileName");
const wordCount = document.getElementById("wordCount");
const startBtn = document.getElementById("startBtn");

const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const timerText = document.getElementById("timerText");
const timerCircle = document.getElementById("timerCircle");
const currentWordEl = document.getElementById("currentWord");
const responseInput = document.getElementById("responseInput");
const nextBtn = document.getElementById("nextBtn");
const quitBtn = document.getElementById("quitBtn");

const totalAnswered = document.getElementById("totalAnswered");
const totalWordsEl = document.getElementById("totalWords");
const resultsList = document.getElementById("resultsList");
const downloadBtn = document.getElementById("downloadBtn");
const restartBtn = document.getElementById("restartBtn");

const CIRCUMFERENCE = 2 * Math.PI * 45; // r=45

// Initialize
function init() {
  updateWordCount();
  timerCircle.style.strokeDasharray = CIRCUMFERENCE;
  timerCircle.style.strokeDashoffset = 0;

  uploadBtn.addEventListener("click", () => wordFile.click());
  wordFile.addEventListener("change", handleFileUpload);
  startBtn.addEventListener("click", startTest);
  nextBtn.addEventListener("click", nextWord);
  quitBtn.addEventListener("click", quitTest);
  restartBtn.addEventListener("click", () => {
    showScreen("landing");
    resetState();
  });
  downloadBtn.addEventListener("click", downloadResults);

  responseInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      nextWord();
    }
  });
}

function updateWordCount() {
  wordCount.innerHTML = `Loaded: <strong>${words.length}</strong> words`;
}

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.name.toLowerCase().endsWith(".txt")) {
    alert("Please upload a .txt file");
    return;
  }

  fileName.textContent = file.name;

  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target.result;
    const newWords = text
      .split(/\r?\n/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    if (newWords.length === 0) {
      alert("No words found in the file.");
      return;
    }

    const mode = document.querySelector('input[name="uploadMode"]:checked').value;
    if (mode === "replace") {
      words = newWords;
    } else {
      // Merge unique (case-insensitive)
      const existing = new Set(words.map((w) => w.toLowerCase()));
      newWords.forEach((w) => {
        if (!existing.has(w.toLowerCase())) {
          words.push(w);
          existing.add(w.toLowerCase());
        }
      });
    }
    updateWordCount();
  };
  reader.readAsText(file);
}

function showScreen(name) {
  landing.classList.remove("active");
  testScreen.classList.remove("active");
  resultsScreen.classList.remove("active");

  if (name === "landing") landing.classList.add("active");
  else if (name === "test") testScreen.classList.add("active");
  else if (name === "results") resultsScreen.classList.add("active");
}

function resetState() {
  currentIndex = 0;
  responses = [];
  isRunning = false;
  clearInterval(timerInterval);
  responseInput.value = "";
}

function startTest() {
  if (words.length === 0) {
    alert("No words available. Please upload a word list.");
    return;
  }

  // Shuffle and take up to 60
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  const testWords = shuffled.slice(0, Math.min(TARGET_WORDS, shuffled.length));

  // Store the test set
  window.testWords = testWords;
  currentIndex = 0;
  responses = new Array(testWords.length).fill("");
  isRunning = true;

  showScreen("test");
  showWord(0);
}

function showWord(index) {
  if (index >= window.testWords.length) {
    finishTest();
    return;
  }

  currentIndex = index;
  const word = window.testWords[index];

  // Update UI
  progressText.textContent = `Word ${index + 1} / ${window.testWords.length}`;
  progressFill.style.width = `${((index + 1) / window.testWords.length) * 100}%`;

  currentWordEl.classList.add("fade");
  setTimeout(() => {
    currentWordEl.textContent = word.toUpperCase();
    currentWordEl.classList.remove("fade");
  }, 100);

  responseInput.value = responses[index] || "";
  responseInput.focus();

  // Reset & start timer
  timeLeft = WORD_DURATION;
  updateTimerDisplay();
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    timeLeft -= 0.1;
    if (timeLeft <= 0) {
      timeLeft = 0;
      updateTimerDisplay();
      clearInterval(timerInterval);
      saveResponse();
      showWord(currentIndex + 1);
    } else {
      updateTimerDisplay();
    }
  }, 100);
}

function updateTimerDisplay() {
  const display = Math.ceil(timeLeft);
  timerText.textContent = display;

  const progress = timeLeft / WORD_DURATION;
  const offset = CIRCUMFERENCE * (1 - progress);
  timerCircle.style.strokeDashoffset = offset;

  // Color change when low
  if (timeLeft <= 5) {
    timerCircle.style.stroke = "#ef4444";
    timerText.style.color = "#ef4444";
  } else {
    timerCircle.style.stroke = "#3b82f6";
    timerText.style.color = "#e8eef7";
  }
}

function saveResponse() {
  responses[currentIndex] = responseInput.value.trim();
}

function nextWord() {
  if (!isRunning) return;
  saveResponse();
  clearInterval(timerInterval);
  showWord(currentIndex + 1);
}

function quitTest() {
  if (confirm("Are you sure you want to quit? Your progress will be lost.")) {
    clearInterval(timerInterval);
    isRunning = false;
    showScreen("landing");
    resetState();
  }
}

function finishTest() {
  clearInterval(timerInterval);
  isRunning = false;
  showResults();
}

function showResults() {
  const testWords = window.testWords || [];
  const answered = responses.filter((r) => r.length > 0).length;

  totalAnswered.textContent = answered;
  totalWordsEl.textContent = testWords.length;

  resultsList.innerHTML = "";
  testWords.forEach((word, i) => {
    const resp = responses[i] || "";
    const item = document.createElement("div");
    item.className = "result-item";
    item.innerHTML = `
      <span class="result-num">${i + 1}.</span>
      <span class="result-word">${word}</span>
      <span class="result-response ${resp ? "" : "empty"}">${resp || "(no response)"}</span>
    `;
    resultsList.appendChild(item);
  });

  showScreen("results");
}

function downloadResults() {
  const testWords = window.testWords || [];
  let content = "SSB WAT Practice Results\n";
  content += "========================\n\n";
  content += `Date: ${new Date().toLocaleString()}\n`;
  content += `Total Words: ${testWords.length}\n`;
  content += `Answered: ${responses.filter((r) => r.length > 0).length}\n\n`;

  testWords.forEach((word, i) => {
    content += `${i + 1}. ${word}\n`;
    content += `   → ${responses[i] || "(no response)"}\n\n`;
  });

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `WAT_Results_${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// Start
init();
