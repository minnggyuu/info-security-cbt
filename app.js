const state = {
  exam: null,
  index: 0,
  answers: {},
};

const els = {
  pageTitle: document.getElementById("pageTitle"),
  pageSubtitle: document.getElementById("pageSubtitle"),
  homeView: document.getElementById("homeView"),
  examView: document.getElementById("examView"),
  backButton: document.getElementById("backButton"),
  resetButton: document.getElementById("resetButton"),
  progressText: document.getElementById("progressText"),
  scoreText: document.getElementById("scoreText"),
  questionNav: document.getElementById("questionNav"),
  questionNumber: document.getElementById("questionNumber"),
  questionStem: document.getElementById("questionStem"),
  contextImageList: document.getElementById("contextImageList"),
  optionList: document.getElementById("optionList"),
  feedbackBox: document.getElementById("feedbackBox"),
  prevButton: document.getElementById("prevButton"),
  nextButton: document.getElementById("nextButton"),
};

function storageKey(examId) {
  return `info-security-cbt:${examId}`;
}

function loadAnswers(examId) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(examId)) || "{}");
  } catch {
    return {};
  }
}

function saveAnswers() {
  if (!state.exam) return;
  localStorage.setItem(storageKey(state.exam.id), JSON.stringify(state.answers));
}

function answeredStats(exam) {
  const answers = loadAnswers(exam.id);
  const answered = Object.keys(answers).length;
  let correct = 0;
  exam.questions.forEach((q) => {
    if (answers[q.number] === q.answer) correct += 1;
  });
  return { answered, correct };
}

function renderHome() {
  state.exam = null;
  state.index = 0;
  state.answers = {};

  els.pageTitle.textContent = "정보보안기사 CBT";
  els.pageSubtitle.textContent = "기출 회차를 선택하세요.";
  els.homeView.classList.remove("hidden");
  els.examView.classList.add("hidden");
  els.backButton.classList.add("hidden");
  els.resetButton.classList.add("hidden");

  els.homeView.innerHTML = "";
  window.EXAM_DATA.forEach((exam) => {
    const stats = answeredStats(exam);
    const card = document.createElement("button");
    card.className = "exam-card";
    card.type = "button";
    card.innerHTML = `
      <strong>${exam.title}</strong>
      <span>${exam.questionCount}문항 · 교사용 PDF 정답 반영</span>
      <div class="card-stats">
        <span>풀이 ${stats.answered}/${exam.questionCount}</span>
        <span>정답 ${stats.correct}</span>
      </div>
    `;
    card.addEventListener("click", () => openExam(exam.id));
    els.homeView.appendChild(card);
  });
}

function openExam(examId) {
  state.exam = window.EXAM_DATA.find((exam) => exam.id === examId);
  state.index = 0;
  state.answers = loadAnswers(examId);

  els.pageTitle.textContent = state.exam.title;
  els.pageSubtitle.textContent = `${state.exam.questionCount}문항 · 클릭 즉시 정답 판정`;
  els.homeView.classList.add("hidden");
  els.examView.classList.remove("hidden");
  els.backButton.classList.remove("hidden");
  els.resetButton.classList.remove("hidden");
  renderQuestion();
}

function renderQuestion() {
  const q = state.exam.questions[state.index];
  els.questionNumber.textContent = `${q.number}번`;
  els.questionStem.textContent = q.stem;
  renderContextImages(q);
  els.optionList.innerHTML = "";

  q.options.forEach((text, idx) => {
    const optionNumber = idx + 1;
    const selected = state.answers[q.number] === optionNumber;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-button";
    if (selected) {
      button.classList.add("selected", optionNumber === q.answer ? "correct" : "wrong");
    }
    button.innerHTML = `
      <span class="option-number">${optionNumber}</span>
      <span>${escapeHtml(text)}</span>
    `;
    button.addEventListener("click", () => selectAnswer(q.number, optionNumber));
    els.optionList.appendChild(button);
  });

  renderFeedback(q);
  renderNav();
  renderStats();

  els.prevButton.disabled = state.index === 0;
  els.nextButton.disabled = state.index === state.exam.questions.length - 1;
}

function renderContextImages(q) {
  els.contextImageList.innerHTML = "";
  if (!q.contextImages || q.contextImages.length === 0) {
    els.contextImageList.classList.add("hidden");
    return;
  }
  els.contextImageList.classList.remove("hidden");
  q.contextImages.forEach((src) => {
    const image = document.createElement("img");
    image.src = src;
    image.alt = `${q.number}번 문제 지문`;
    image.loading = "lazy";
    els.contextImageList.appendChild(image);
  });
}

function selectAnswer(questionNumber, optionNumber) {
  state.answers[questionNumber] = optionNumber;
  saveAnswers();
  renderQuestion();
}

function renderFeedback(q) {
  const selected = state.answers[q.number];
  if (!selected) {
    els.feedbackBox.className = "feedback-box hidden";
    els.feedbackBox.textContent = "";
    return;
  }
  const correct = selected === q.answer;
  els.feedbackBox.className = `feedback-box ${correct ? "correct" : "wrong"}`;
  els.feedbackBox.innerHTML = `
    <strong>${correct ? "정답입니다." : `오답입니다. 정답은 ${q.answer}번입니다.`}</strong>
    <span>${escapeHtml(q.explanation)}</span>
  `;
}

function renderNav() {
  els.questionNav.innerHTML = "";
  state.exam.questions.forEach((q, idx) => {
    const selected = state.answers[q.number];
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = q.number;
    if (idx === state.index) button.classList.add("active");
    if (selected) button.classList.add(selected === q.answer ? "correct" : "wrong");
    button.addEventListener("click", () => {
      state.index = idx;
      renderQuestion();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    els.questionNav.appendChild(button);
  });
}

function renderStats() {
  const answered = Object.keys(state.answers).length;
  let correct = 0;
  state.exam.questions.forEach((q) => {
    if (state.answers[q.number] === q.answer) correct += 1;
  });
  const percent = answered ? Math.round((correct / answered) * 100) : 0;
  els.progressText.textContent = `${answered} / ${state.exam.questionCount}`;
  els.scoreText.textContent = `${percent}%`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

els.backButton.addEventListener("click", renderHome);
els.prevButton.addEventListener("click", () => {
  if (state.index > 0) {
    state.index -= 1;
    renderQuestion();
  }
});
els.nextButton.addEventListener("click", () => {
  if (state.index < state.exam.questions.length - 1) {
    state.index += 1;
    renderQuestion();
  }
});
els.resetButton.addEventListener("click", () => {
  if (!state.exam) return;
  state.answers = {};
  localStorage.removeItem(storageKey(state.exam.id));
  renderQuestion();
});

renderHome();
