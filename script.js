let allQuestions=[],quiz=[],current=0,selected=null,score=0,mistakes=[],currentMode="normal",currentLabel="";
const STORAGE_HISTORY="etis_qcm_history_v2",STORAGE_LAST_MISTAKES="etis_qcm_last_mistakes_v2";
const home=document.getElementById("home"),quizSection=document.getElementById("quiz"),results=document.getElementById("results");
const startBtn=document.getElementById("startBtn"),validateBtn=document.getElementById("validateBtn"),nextBtn=document.getElementById("nextBtn"),restartBtn=document.getElementById("restartBtn"),homeBtn=document.getElementById("homeBtn"),retryMistakesBtn=document.getElementById("retryMistakesBtn"),retryLastMistakesHomeBtn=document.getElementById("retryLastMistakesHomeBtn"),clearHistoryBtn=document.getElementById("clearHistoryBtn");

fetch("questions.json").then(r=>r.json()).then(data=>{allQuestions=data;renderHomeStats();}).catch(()=>alert("Impossible de charger questions.json. Vérifie que tous les fichiers sont bien envoyés sur GitHub."));

function shuffle(array){const a=[...array];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function show(section){home.classList.add("hidden");quizSection.classList.add("hidden");results.classList.add("hidden");section.classList.remove("hidden");}
function getHistory(){try{return JSON.parse(localStorage.getItem(STORAGE_HISTORY))||[]}catch{return[]}}
function saveHistoryEntry(entry){const h=getHistory();h.unshift(entry);localStorage.setItem(STORAGE_HISTORY,JSON.stringify(h.slice(0,30)));}
function getLastMistakeIds(){try{return JSON.parse(localStorage.getItem(STORAGE_LAST_MISTAKES))||[]}catch{return[]}}
function saveLastMistakes(ids){localStorage.setItem(STORAGE_LAST_MISTAKES,JSON.stringify(ids));}
function clearHistory(){if(!confirm("Effacer tous les résultats enregistrés sur cet appareil ?"))return;localStorage.removeItem(STORAGE_HISTORY);localStorage.removeItem(STORAGE_LAST_MISTAKES);renderHomeStats();}

function renderHomeStats(){
 const h=getHistory(),stats=document.getElementById("statsSummary"),list=document.getElementById("historyList"),lastMistakes=getLastMistakeIds();
 if(lastMistakes.length>0){retryLastMistakesHomeBtn.classList.remove("hidden");retryLastMistakesHomeBtn.textContent=`Refaire mes erreurs du dernier test (${lastMistakes.length})`;}else retryLastMistakesHomeBtn.classList.add("hidden");
 if(h.length===0){stats.textContent="Aucun résultat enregistré pour l’instant.";list.innerHTML="";clearHistoryBtn.classList.add("hidden");return;}
 clearHistoryBtn.classList.remove("hidden");
 const best=h.reduce((m,x)=>Math.max(m,x.percentage),0),avg=Math.round(h.reduce((s,x)=>s+x.percentage,0)/h.length),last=h[0];
 stats.textContent=`Dernier score : ${last.score}/${last.total} (${last.percentage}%) — Meilleur : ${best}% — Moyenne : ${avg}%`;
 list.innerHTML="";
 h.slice(0,5).forEach(x=>{const item=document.createElement("div");item.className="history-item";item.innerHTML=`<strong>${x.score}/${x.total} — ${x.percentage}%</strong><br>${x.label}<br><span>${x.date}</span>`;list.appendChild(item);});
}

function startQuiz(){
 const testFilter=document.getElementById("testFilter").value,count=Number(document.getElementById("questionCount").value);
 let pool=allQuestions.filter(q=>testFilter==="all"||q.test===testFilter);
 pool=shuffle(pool).slice(0,Math.min(count,pool.length));
 currentMode="normal";currentLabel=`${testFilter==="all"?"Tous les tests":testFilter} — ${pool.length} questions`;
 prepareQuiz(pool);
}
function startMistakesQuiz(ids){
 const idSet=new Set(ids),pool=allQuestions.filter(q=>idSet.has(q.id));
 if(pool.length===0){alert("Aucune erreur à refaire pour l’instant.");return;}
 currentMode="mistakes";currentLabel=`Révision des erreurs — ${pool.length} questions`;
 prepareQuiz(shuffle(pool));
}
function prepareQuiz(pool){
 quiz=pool.map(q=>{const good=q.options[q.answer],opts=shuffle(q.options);return{...q,options:opts,answer:opts.indexOf(good)}});
 current=0;selected=null;score=0;mistakes=[];show(quizSection);renderQuestion();
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
 q.options.forEach((option,index)=>{const b=document.createElement("button");b.className="answer";b.textContent=option;b.onclick=()=>{selected=index;document.querySelectorAll(".answer").forEach(btn=>btn.classList.remove("selected"));b.classList.add("selected");};answers.appendChild(b);});
}
function validateAnswer(){
 if(selected===null){document.getElementById("feedback").textContent="Choisis une réponse avant de valider.";return;}
 const q=quiz[current],buttons=document.querySelectorAll(".answer");
 buttons.forEach((b,i)=>{b.disabled=true;if(i===q.answer)b.classList.add("correct");if(i===selected&&selected!==q.answer)b.classList.add("wrong");});
 if(selected===q.answer){score++;document.getElementById("feedback").textContent="✅ Correct";}else{mistakes.push({id:q.id,question:q.question,selected:q.options[selected],correct:q.options[q.answer],test:q.test,number:q.number});document.getElementById("feedback").textContent=`❌ Faux — bonne réponse : ${q.options[q.answer]}`;}
 document.getElementById("scoreLive").textContent=`Score ${score}`;validateBtn.classList.add("hidden");nextBtn.classList.remove("hidden");
}
function nextQuestion(){current++;if(current>=quiz.length)endQuiz();else renderQuestion();}
function endQuiz(){
 document.getElementById("progressFill").style.width="100%";show(results);
 const pct=Math.round((score/quiz.length)*100);
 document.getElementById("finalScore").textContent=`${score} / ${quiz.length} — ${pct}%`;
 saveLastMistakes(mistakes.map(m=>m.id));
 saveHistoryEntry({date:new Date().toLocaleString("fr-FR"),score,total:quiz.length,percentage:pct,mistakes:mistakes.length,label:currentLabel,mode:currentMode});
 renderMistakes();
 if(mistakes.length>0){retryMistakesBtn.classList.remove("hidden");retryMistakesBtn.textContent=`Refaire uniquement mes erreurs (${mistakes.length})`;}else retryMistakesBtn.classList.add("hidden");
 renderHomeStats();
}
function renderMistakes(){
 const div=document.getElementById("mistakes");div.innerHTML="";
 if(mistakes.length===0){div.innerHTML="<p>Parfait, aucune erreur.</p>";return;}
 const title=document.createElement("h3");title.textContent=`Erreurs (${mistakes.length})`;div.appendChild(title);
 mistakes.forEach(m=>{const d=document.createElement("div");d.className="mistake";d.innerHTML=`<strong>${m.test} — Question ${m.number}</strong><p>${m.question}</p><p>Ta réponse : ${m.selected}</p><p>Bonne réponse : <strong>${m.correct}</strong></p>`;div.appendChild(d);});
}

startBtn.addEventListener("click",startQuiz);
validateBtn.addEventListener("click",validateAnswer);
nextBtn.addEventListener("click",nextQuestion);
restartBtn.addEventListener("click",startQuiz);
homeBtn.addEventListener("click",()=>{renderHomeStats();show(home);});
retryMistakesBtn.addEventListener("click",()=>startMistakesQuiz(mistakes.map(m=>m.id)));
retryLastMistakesHomeBtn.addEventListener("click",()=>startMistakesQuiz(getLastMistakeIds()));
clearHistoryBtn.addEventListener("click",clearHistory);
