let allQuestions = [];
let currentQuestions = [];
let currentIndex = 0;
let userAnswers = [];
let mode = ''; // 'subject' | 'year' | 'random'
let timerInterval = null;
let timerSeconds = 9000; // 2시간 30분

// 데이터 로드
fetch('data/questions.json')
  .then(r => r.json())
  .then(data => {
    allQuestions = data;
    buildSubjectList();
    buildYearList();
  });

// 화면 전환
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// 과목 목록 생성
function buildSubjectList() {
  const subjects = [...new Set(allQuestions.map(q => q.subject))];
  const el = document.getElementById('subject-list');
  el.innerHTML = '';
  subjects.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'menu-btn';
    const count = allQuestions.filter(q => q.subject === s).length;
    btn.textContent = `${s}  (${count}문제)`;
    btn.onclick = () => startSubjectQuiz(s);
    el.appendChild(btn);
  });
}

// 년도 목록 생성
function buildYearList() {
  // 년도+회차 조합 추출 후 정렬 (최신순)
  const combos = [...new Map(
    allQuestions.map(q => [`${q.year}-${q.session}`, { year: q.year, session: q.session }])
  ).values()].sort((a, b) => b.year - a.year || b.session - a.session);

  const el = document.getElementById('year-list');
  el.innerHTML = '';
  combos.forEach(({ year, session }) => {
    const btn = document.createElement('button');
    btn.className = 'menu-btn';
    const count = allQuestions.filter(q => q.year === year && q.session === session).length;
    btn.textContent = `${year}년도 ${session}회  (${count}문제)`;
    btn.onclick = () => startYearExam(year, session);
    el.appendChild(btn);
  });
}

// 과목별 문제풀이 시작
function startSubjectQuiz(subject) {
  mode = 'subject';
  currentQuestions = shuffle(allQuestions.filter(q => q.subject === subject));
  currentIndex = 0;
  userAnswers = new Array(currentQuestions.length).fill(null);
  document.getElementById('quiz-subject-label').textContent = subject;
  showScreen('screen-quiz');
  renderQuizQuestion();
}

// 년도별 모의고사 시작
function startYearExam(year, session) {
  mode = 'year';
  currentQuestions = allQuestions.filter(q => q.year === year && q.session === session);
  startExam(`${year}년도 ${session}회 모의고사`);
}

// 랜덤 모의고사 시작
function startRandomExam() {
  mode = 'random';
  currentQuestions = shuffle([...allQuestions]).slice(0, 100);
  startExam('랜덤 모의고사');
}

function startExam(label) {
  currentIndex = 0;
  userAnswers = new Array(currentQuestions.length).fill(null);
  document.getElementById('exam-label').textContent = label;
  timerSeconds = 9000;
  clearInterval(timerInterval);
  timerInterval = setInterval(tickTimer, 1000);
  showScreen('screen-exam');
  renderExamQuestion();
}

// 타이머
function tickTimer() {
  timerSeconds--;
  if (timerSeconds <= 0) {
    clearInterval(timerInterval);
    submitExam();
    return;
  }
  const h = String(Math.floor(timerSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((timerSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(timerSeconds % 60).padStart(2, '0');
  document.getElementById('exam-timer').textContent = `${h}:${m}:${s}`;
}

// 과목별 문제 렌더
function renderQuizQuestion() {
  const q = currentQuestions[currentIndex];
  const total = currentQuestions.length;
  document.getElementById('quiz-progress').textContent = `${currentIndex + 1} / ${total}`;
  document.getElementById('quiz-question').textContent = `Q${currentIndex + 1}. ${q.question}`;

  const optionsEl = document.getElementById('quiz-options');
  optionsEl.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = `${i + 1}. ${opt}`;
    btn.onclick = () => selectQuizAnswer(i + 1);
    optionsEl.appendChild(btn);
  });

  document.getElementById('quiz-feedback').className = 'feedback hidden';
  document.getElementById('quiz-feedback').textContent = '';
  document.getElementById('btn-next').classList.add('hidden');
}

// 과목별 답 선택
function selectQuizAnswer(selected) {
  const q = currentQuestions[currentIndex];
  const optBtns = document.querySelectorAll('#quiz-options .option-btn');

  optBtns.forEach(b => b.disabled = true);

  const isCorrect = selected === q.answer;
  optBtns[selected - 1].classList.add(isCorrect ? 'correct' : 'wrong');
  if (!isCorrect) {
    optBtns[q.answer - 1].classList.add('correct');
  }

  const feedback = document.getElementById('quiz-feedback');
  feedback.className = `feedback ${isCorrect ? 'correct-fb' : 'wrong-fb'}`;

  if (isCorrect) {
    feedback.textContent = '✅ 정답입니다!';
  } else {
    const correctText = q.options[q.answer - 1];
    feedback.textContent = `❌ 오답입니다. 정답: ${q.answer}번. ${correctText}`;
    if (q.explanation) {
      feedback.textContent += `\n\n💡 ${q.explanation}`;
    }
  }

  document.getElementById('btn-next').classList.remove('hidden');
}

// 다음 문제
function nextQuestion() {
  currentIndex++;
  if (currentIndex >= currentQuestions.length) {
    showQuizComplete();
  } else {
    renderQuizQuestion();
  }
}

// 과목별 완료
function showQuizComplete() {
  showScreen('screen-result');
  document.getElementById('result-score').textContent = '완료!';
  document.getElementById('result-detail').textContent = `${currentQuestions.length}문제를 모두 풀었습니다.`;
  document.getElementById('result-wrong-list').innerHTML = '';
}

// 모의고사 문제 렌더
function renderExamQuestion() {
  const q = currentQuestions[currentIndex];
  const total = currentQuestions.length;
  document.getElementById('exam-progress').textContent = `${currentIndex + 1} / ${total}`;
  document.getElementById('exam-question').textContent = `Q${currentIndex + 1}. ${q.question}`;

  const optionsEl = document.getElementById('exam-options');
  optionsEl.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    if (userAnswers[currentIndex] === i + 1) btn.classList.add('selected');
    btn.textContent = `${i + 1}. ${opt}`;
    btn.onclick = () => selectExamAnswer(i + 1);
    optionsEl.appendChild(btn);
  });
}

// 모의고사 답 선택
function selectExamAnswer(selected) {
  userAnswers[currentIndex] = selected;
  document.querySelectorAll('#exam-options .option-btn').forEach((b, i) => {
    b.classList.toggle('selected', i + 1 === selected);
  });
}

function examPrev() {
  if (currentIndex > 0) { currentIndex--; renderExamQuestion(); }
}

function examNext() {
  if (currentIndex < currentQuestions.length - 1) { currentIndex++; renderExamQuestion(); }
}

// 채점
function submitExam() {
  clearInterval(timerInterval);
  const unanswered = userAnswers.filter(a => a === null).length;
  if (unanswered > 0) {
    if (!confirm(`아직 ${unanswered}문제를 풀지 않았습니다. 채점할까요?`)) return;
  }

  let correct = 0;
  const wrongItems = [];

  currentQuestions.forEach((q, i) => {
    if (userAnswers[i] === q.answer) {
      correct++;
    } else {
      wrongItems.push({ q, myAnswer: userAnswers[i] });
    }
  });

  const total = currentQuestions.length;
  const score = Math.round((correct / total) * 100);

  showScreen('screen-result');
  document.getElementById('result-score').textContent = `${score}점`;
  document.getElementById('result-detail').textContent = `${total}문제 중 ${correct}문제 정답 (${correct}/${total})`;

  const wrongEl = document.getElementById('result-wrong-list');
  wrongEl.innerHTML = '';
  if (wrongItems.length > 0) {
    const title = document.createElement('h3');
    title.style.cssText = 'font-size:16px;font-weight:700;margin-bottom:12px;color:#1a1a2e;';
    title.textContent = `오답 목록 (${wrongItems.length}문제)`;
    wrongEl.appendChild(title);

    wrongItems.forEach(({ q, myAnswer }) => {
      const div = document.createElement('div');
      div.className = 'wrong-item';
      div.innerHTML = `
        <p class="q-text">${q.question}</p>
        <p class="my-text">내 답: ${myAnswer ? `${myAnswer}번. ${q.options[myAnswer - 1]}` : '미응답'}</p>
        <p class="a-text">정답: ${q.answer}번. ${q.options[q.answer - 1]}</p>
      `;
      wrongEl.appendChild(div);
    });
  }
}

// 나가기 확인
function confirmExit() {
  if (confirm('문제풀이를 종료하고 나갈까요?')) {
    clearInterval(timerInterval);
    showScreen('screen-main');
  }
}

// 배열 섞기
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
