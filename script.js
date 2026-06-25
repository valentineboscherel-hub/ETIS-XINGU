let allQuestions = [];
let quiz = [];
let current = 0;
let selected = null;
let score = 0;
let mistakes = [];

const home = document.getElementById("home");
const quizSection = document.getElementById("quiz");
const results = document.getElementById("results");

const startBtn = document.getElementById("startBtn");
const validateBtn = document.getElementById("validateBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const homeBtn = document.getElementById("homeBtn");

fetch("questions.json")
  .then(response => response.json())
  .then(data => {
    allQuestions = data;
  })
  .catch(() => {
    alert("Impossible de charger questions.json. Vérifie que tous les fichiers sont bien envoyés sur GitHub.");
  });

function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function show(section) {
  home.classList.add("hidden");
  quizSection.classList.add("hidden");
  results.classList.add("hidden");
  section.classList.remove("hidden");
}

function startQuiz() {
  const testFilter = document.getElementById("testFilter").value;
  const count = Number(document.getElementById("questionCount").value);

  let pool = allQuestions.filter(q => testFilter === "all" || q.test === testFilter);
  pool = shuffle(pool).slice(0, Math.min(count, pool.length));

  quiz = pool.map(q => {
    const correctAnswerText = q.options[q.answer];
    const mixedOptions = shuffle(q.options);
    return {
      ...q,
      options: mixedOptions,
      answer: mixedOptions.indexOf(correctAnswerText)
    };
  });

  current = 0;
  selected = null;
  score = 0;
  mistakes = [];
  show(quizSection);
  renderQuestion();
}

function renderQuestion() {
  const q = quiz[current];
  selected = null;

  document.getElementById("progressText").textContent = `Question ${current + 1} / ${quiz.length}`;
  document.getElementById("scoreLive").textContent = `Score ${score}`;
  document.getElementById("progressFill").style.width = `${((current) / quiz.length) * 100}%`;
  document.getElementById("meta").textContent = `${q.test} — Question ${q.number}${q.category ? " — " + q.category : ""}`;
  document.getElementById("questionText").textContent = q.question;
  document.getElementById("feedback").textContent = "";

  validateBtn.classList.remove("hidden");
  nextBtn.classList.add("hidden");

  const answers = document.getElementById("answers");
  answers.innerHTML = "";

  q.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.className = "answer";
    button.textContent = option;
    button.onclick = () => {
      selected = index;
      document.querySelectorAll(".answer").forEach(btn => btn.classList.remove("selected"));
      button.classList.add("selected");
    };
    answers.appendChild(button);
  });
}

function validateAnswer() {
  if (selected === null) {
    document.getElementById("feedback").textContent = "Choisis une réponse avant de valider.";
    return;
  }

  const q = quiz[current];
  const buttons = document.querySelectorAll(".answer");

  buttons.forEach((button, index) => {
    button.disabled = true;
    if (index === q.answer) button.classList.add("correct");
    if (index === selected && selected !== q.answer) button.classList.add("wrong");
  });

  if (selected === q.answer) {
    score++;
    document.getElementById("feedback").textContent = "✅ Correct";
  } else {
    mistakes.push({
      question: q.question,
      selected: q.options[selected],
      correct: q.options[q.answer],
      test: q.test,
      number: q.number
    });
    document.getElementById("feedback").textContent = `❌ Faux — bonne réponse : ${q.options[q.answer]}`;
  }

  document.getElementById("scoreLive").textContent = `Score ${score}`;
  validateBtn.classList.add("hidden");
  nextBtn.classList.remove("hidden");
}

function nextQuestion() {
  current++;
  if (current >= quiz.length) {
    endQuiz();
  } else {
    renderQuestion();
  }
}

function endQuiz() {
  document.getElementById("progressFill").style.width = "100%";
  show(results);

  const percentage = Math.round((score / quiz.length) * 100);
  document.getElementById("finalScore").textContent = `${score} / ${quiz.length} — ${percentage}%`;

  const mistakesDiv = document.getElementById("mistakes");
  mistakesDiv.innerHTML = "";

  if (mistakes.length === 0) {
    mistakesDiv.innerHTML = "<p>Parfait, aucune erreur.</p>";
    return;
  }

  const title = document.createElement("h3");
  title.textContent = `Erreurs (${mistakes.length})`;
  mistakesDiv.appendChild(title);

  mistakes.forEach(m => {
    const div = document.createElement("div");
    div.className = "mistake";
    div.innerHTML = `
      <strong>${m.test} — Question ${m.number}</strong>
      <p>${m.question}</p>
      <p>Ta réponse : ${m.selected}</p>
      <p>Bonne réponse : <strong>${m.correct}</strong></p>
    `;
    mistakesDiv.appendChild(div);
  });
}

startBtn.addEventListener("click", startQuiz);
validateBtn.addEventListener("click", validateAnswer);
nextBtn.addEventListener("click", nextQuestion);
restartBtn.addEventListener("click", startQuiz);
homeBtn.addEventListener("click", () => show(home));
