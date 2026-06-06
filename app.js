const state = {
  exam: null,
  index: 0,
  answers: {},
  music: {
    frame: null,
    playing: false,
  },
};

const els = {
  pageTitle: document.getElementById("pageTitle"),
  pageSubtitle: document.getElementById("pageSubtitle"),
  homeView: document.getElementById("homeView"),
  examView: document.getElementById("examView"),
  backButton: document.getElementById("backButton"),
  resetButton: document.getElementById("resetButton"),
  musicToggle: document.getElementById("musicToggle"),
  musicPlayer: document.getElementById("musicPlayer"),
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
  els.pageSubtitle.textContent = `${state.exam.questionCount}문항`;
  els.homeView.classList.add("hidden");
  els.examView.classList.remove("hidden");
  els.backButton.classList.remove("hidden");
  els.resetButton.classList.remove("hidden");
  renderQuestion();
}

function renderQuestion() {
  const q = state.exam.questions[state.index];
  els.questionNumber.textContent = `${q.number}번 · ${q.part}`;
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
    image.alt = `${q.number}번 ${q.part} 문제 지문`;
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
  const parts = state.exam.parts || buildPartsFromQuestions(state.exam.questions);
  parts.forEach((part) => {
    const section = document.createElement("section");
    section.className = "part-nav";

    const heading = document.createElement("div");
    heading.className = "part-heading";
    heading.innerHTML = `
      <strong>${part.name}</strong>
      <span>${part.range}번</span>
    `;
    section.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "part-question-grid";
    state.exam.questions
      .filter((q) => q.number >= part.start && q.number <= part.end)
      .forEach((q) => {
        const idx = state.exam.questions.findIndex((item) => item.number === q.number);
        const selected = state.answers[q.number];
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = q.number;
        button.setAttribute("aria-label", `${q.number}번 ${q.part}`);
        if (idx === state.index) button.classList.add("active");
        if (selected) button.classList.add(selected === q.answer ? "correct" : "wrong");
        button.addEventListener("click", () => {
          state.index = idx;
          renderQuestion();
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
        grid.appendChild(button);
      });
    section.appendChild(grid);
    els.questionNav.appendChild(section);
  });
}

function buildPartsFromQuestions(questions) {
  const partMap = new Map();
  questions.forEach((q) => {
    if (!partMap.has(q.part)) {
      partMap.set(q.part, {
        name: q.part,
        range: q.partRange,
        start: q.number,
        end: q.number,
      });
      return;
    }
    const part = partMap.get(q.part);
    part.start = Math.min(part.start, q.number);
    part.end = Math.max(part.end, q.number);
    part.range = `${part.start}-${part.end}`;
  });
  return [...partMap.values()].sort((a, b) => a.start - b.start);
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

function updateMusicButton() {
  if (!els.musicToggle) return;
  els.musicToggle.classList.toggle("playing", state.music.playing);
  els.musicToggle.textContent = state.music.playing ? "Ⅱ" : "♪";
  els.musicToggle.setAttribute("aria-label", state.music.playing ? "배경음악 정지" : "배경음악 재생");
  els.musicToggle.title = state.music.playing ? "배경음악 정지" : "배경음악 재생";
}

function playMusic() {
  if (!els.musicPlayer || state.music.frame) return;
  const frame = document.createElement("iframe");
  frame.src = "https://www.youtube.com/embed/NqnmieDlnBc?autoplay=1&controls=0&loop=1&modestbranding=1&playsinline=1&playlist=NqnmieDlnBc&rel=0";
  frame.title = "배경음악";
  frame.allow = "autoplay; encrypted-media";
  frame.referrerPolicy = "strict-origin-when-cross-origin";
  els.musicPlayer.appendChild(frame);
  state.music.frame = frame;
  state.music.playing = true;
  updateMusicButton();
}

function pauseMusic() {
  state.music.frame?.remove();
  state.music.frame = null;
  state.music.playing = false;
  updateMusicButton();
}

function toggleMusic() {
  if (state.music.playing) {
    pauseMusic();
    return;
  }
  playMusic();
}

els.backButton.addEventListener("click", renderHome);
els.musicToggle.addEventListener("click", toggleMusic);
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

updateMusicButton();
renderHome();
