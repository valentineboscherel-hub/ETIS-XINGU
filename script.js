let allQuestions=[],quiz=[],current=0,selected=null,score=0,mistakes=[],currentMode="normal",currentLabel="",resultAlreadySaved=false;
const STORAGE_HISTORY="etis_qcm_history_v3";
const STORAGE_LAST_MISTAKES="etis_qcm_last_mistakes_v3";

const home=document.getElementById("home"),quizSection=document.getElementById("quiz"),results=document.getElementById("results");
const startBtn=document.getElementById("startBtn"),validateBtn=document.getElementById("validateBtn"),nextBtn=document.getElementById("nextBtn"),restartBtn=document.getElementById("restartBtn"),homeBtn=document.getElementById("homeBtn"),retryMistakesBtn=document.getElementById("retryMistakesBtn"),retryLastMistakesHomeBtn=document.getElementById("retryLastMistakesHomeBtn"),clearHistoryBtn=document.getElementById("clearHistoryBtn");

fetch("questions.json?v=3").then(r=>r.json()).then(data=>{allQuestions=data;renderDashboard();}).catch(()=>alert("Impossible de charger questions.json. Vérifie que tous les fichiers sont bien envoyés sur GitHub."));

function shuffle(array){const a=[...array];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function show(section){home.classList.add("hidden");quizSection.classList.add("hidden");results.classList.add("hidden");section.classList.remove("hidden");}
function getHistory(){try{return JSON.parse(localStorage.getItem(STORAGE_HISTORY))||[]}catch{return[]}}
function setHistory(history){localStorage.setItem(STORAGE_HISTORY,JSON.stringify(history));}
function getLastMistakeIds(){try{return JSON.parse(localStorage.getItem(STORAGE_LAST_MISTAKES))||[]}catch{return[]}}
function saveLastMistakes(ids){localStorage.setItem(STORAGE_LAST_MISTAKES,JSON.stringify(ids));}

function saveCurrentResult(){
 if(resultAlreadySaved || !quiz.length) return;
 const pct=Math.round((score/quiz.length)*100);
 const mistakeIds=mistakes.map(m=>m.id);
 saveLastMistakes(mistakeIds);
 const entry={
   id:Date.now(),
   date:new Date().toLocaleString("fr-FR"),
   score:score,
   total:quiz.length,
   percentage:pct,
   mistakes:mistakes.length,
   label:currentLabel,
   mode:currentMode
 };
 const history=getHistory();
 history.unshift(entry);
 setHistory(history.slice(0,100));
 resultAlreadySaved=true;
}

function renderDashboard(){
 const history=getHistory();
 const list=document.getElementById("historyList");
 const lastMistakes=getLastMistakeIds();

 if(history.length===0){
   document.getElementById("statLast").textContent="—";
   document.getElementById("statBest").textContent="—";
   document.getElementById("statAverage").textContent="—";
   document.getElementById("statCount").textContent="0";
   list.textContent="Aucun résultat enregistré.";
   clearHistoryBtn.classList.add("hidden");
 } else {
   const best=Math.max(...history.map(h=>h.percentage));
   const avg=Math.round(history.reduce((s,h)=>s+h.percentage,0)/history.length);
   const last=history[0];
   document.getElementById("statLast").textContent=last.percentage+"%";
   document.getElementById("statBest").textContent=best+"%";
   document.getElementById("statAverage").textContent=avg+"%";
   document.getElementById("statCount").textContent=String(history.length);
   list.innerHTML="";
   history.slice(0,8).forEach(h=>{
     const item=document.createElement("div");
     item.className="history-item";
     item.innerHTML=`<strong>${h.score}/${h.total} — ${h.percentage}%</strong><br>${h.label}<br><span>${h.date}</span>`;
     list.appendChild(item);
   });
   clearHistoryBtn.classList.remove("hidden");
 }

 if(lastMistakes.length>0){
   retryLastMistakesHomeBtn.classList.remove("hidden");
   retryLastMistakesHomeBtn.textContent=`Refaire mes erreurs du dernier test (${lastMistakes.length})`;
 } else {
   retryLastMistakesHomeBtn.classList.add("hidden");
 }
}

function clearHistory(){
 if(!confirm("Effacer tous les résultats enregistrés sur cet appareil ?")) return;
 localStorage.removeItem(STORAGE_HISTORY);
 localStorage.removeItem(STORAGE_LAST_MISTAKES);
 renderDashboard();
}

function startQuiz(){
 const testFilter=document.getElementById("testFilter").value;
 const count=Number(document.getElementById("questionCount").value);
 let pool=allQuestions.filter(q=>testFilter==="all"||q.test===testFilter);
 pool=shuffle(pool).slice(0,Math.min(count,pool.length));
 currentMode="normal";
 currentLabel=`${testFilter==="all"?"Tous les tests":testFilter} — ${pool.length} questions`;
 prepareQuiz(pool);
}

function startMistakesQuiz(ids){
 const idSet=new Set(ids);
 const pool=allQuestions.filter(q=>idSet.has(q.id));
 if(pool.length===0){alert("Aucune erreur à refaire pour l’instant.");return;}
 currentMode="mistakes";
 currentLabel=`Révision des erreurs — ${pool.length} questions`;
 prepareQuiz(shuffle(pool));
}

function prepareQuiz(pool){
 quiz=pool.map(q=>{
   const correct=q.options[q.answer];
   const opts=shuffle(q.options);
   return {...q,options:opts,answer:opts.indexOf(correct)};
 });
 current=0;selected=null;score=0;mistakes=[];resultAlreadySaved=false;
 show(quizSection);
 renderQuestion();
}

function renderQuestion(){
 const q=quiz[current];selected=null;
 document.getElementById("progressText").textContent=`Question ${current+1} / ${quiz.length}`;
 document.getElementById("scoreLive").textContent=`Score ${score}`;
 document.getElementById("progressFill").style.width=`${(current/quiz.length)*100}%`;
 document.getElementById("meta").textContent=`${q.test} — Question ${q.number}${q.category?" — "+q.category:""}`;
 document.getElementById("questionText").textContent=q.question;
 document.getElementById("feedback").textContent="";
 validateBtn.classList.remove("hidden");nextBtn.classList.add("hidden");
 const answers=document.getElementById("answers");answers.innerHTML="";
 q.options.forEach((option,index)=>{
   const b=document.createElement("button");
   b.className="answer";
   b.textContent=option;
   b.onclick=()=>{selected=index;document.querySelectorAll(".answer").forEach(btn=>btn.classList.remove("selected"));b.classList.add("selected");};
   answers.appendChild(b);
 });
}

function validateAnswer(){
 if(selected===null){document.getElementById("feedback").textContent="Choisis une réponse avant de valider.";return;}
 const q=quiz[current],buttons=document.querySelectorAll(".answer");
 buttons.forEach((b,i)=>{b.disabled=true;if(i===q.answer)b.classList.add("correct");if(i===selected&&selected!==q.answer)b.classList.add("wrong");});
 if(selected===q.answer){score++;document.getElementById("feedback").textContent="✅ Correct";}
 else{
   mistakes.push({id:q.id,question:q.question,selected:q.options[selected],correct:q.options[q.answer],test:q.test,number:q.number});
   document.getElementById("feedback").textContent=`❌ Faux — bonne réponse : ${q.options[q.answer]}`;
 }
 document.getElementById("scoreLive").textContent=`Score ${score}`;
 validateBtn.classList.add("hidden");nextBtn.classList.remove("hidden");
}

function nextQuestion(){current++;if(current>=quiz.length)endQuiz();else renderQuestion();}

function endQuiz(){
 document.getElementById("progressFill").style.width="100%";
 saveCurrentResult();
 show(results);
 const pct=Math.round((score/quiz.length)*100);
 document.getElementById("finalScore").textContent=`${score} / ${quiz.length} — ${pct}%`;
 renderMistakes();
 if(mistakes.length>0){
   retryMistakesBtn.classList.remove("hidden");
   retryMistakesBtn.textContent=`Refaire uniquement mes erreurs (${mistakes.length})`;
 } else retryMistakesBtn.classList.add("hidden");
 renderDashboard();
}

function renderMistakes(){
 const div=document.getElementById("mistakes");div.innerHTML="";
 if(mistakes.length===0){div.innerHTML="<p>Parfait, aucune erreur.</p>";return;}
 const title=document.createElement("h3");title.textContent=`Erreurs (${mistakes.length})`;div.appendChild(title);
 mistakes.forEach(m=>{
   const d=document.createElement("div");
   d.className="mistake";
   d.innerHTML=`<strong>${m.test} — Question ${m.number}</strong><p>${m.question}</p><p>Ta réponse : ${m.selected}</p><p>Bonne réponse : <strong>${m.correct}</strong></p>`;
   div.appendChild(d);
 });
}

startBtn.addEventListener("click",startQuiz);
validateBtn.addEventListener("click",validateAnswer);
nextBtn.addEventListener("click",nextQuestion);
restartBtn.addEventListener("click",startQuiz);
homeBtn.addEventListener("click",()=>{saveCurrentResult();renderDashboard();show(home);});
retryMistakesBtn.addEventListener("click",()=>startMistakesQuiz(mistakes.map(m=>m.id)));
retryLastMistakesHomeBtn.addEventListener("click",()=>startMistakesQuiz(getLastMistakeIds()));
clearHistoryBtn.addEventListener("click",clearHistory);
