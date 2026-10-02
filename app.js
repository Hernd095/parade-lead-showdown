const SUPABASE_URL="https://chjetlbimlujuszbibzt.supabase.co";
const SUPABASE_KEY="sb_publishable_jbBinxUbi4Z530pbCu3ODw_5s0VWPkU";
const GAME_CODE="parade-lead-live";
let applyingRemote=false;
async function cloudRequest(method,body){
  const r=await fetch(SUPABASE_URL+"/rest/v1/games?code=eq."+encodeURIComponent(GAME_CODE),{
    method,headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json","Prefer":"return=minimal"},body:body?JSON.stringify(body):undefined});
  if(!r.ok)throw new Error(await r.text());
}
async function pushCloud(){
  if(applyingRemote)return;
  const payload={state:{state,questions},updated_at:new Date().toISOString()};
  try{
    const r=await fetch(SUPABASE_URL+"/rest/v1/games?code=eq."+encodeURIComponent(GAME_CODE),{headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY}});
    const rows=await r.json();
    if(rows.length) await cloudRequest("PATCH",payload);
    else await fetch(SUPABASE_URL+"/rest/v1/games",{method:"POST",headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify({code:GAME_CODE,...payload})});
  }catch(e){console.error("Cloud sync:",e)}
}
async function pullCloud(){
  try{
    const r=await fetch(SUPABASE_URL+"/rest/v1/games?code=eq."+encodeURIComponent(GAME_CODE)+"&select=state,updated_at",{headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY}});
    const rows=await r.json();
    if(rows[0]?.state?.state){
      applyingRemote=true; state=rows[0].state.state; questions=rows[0].state.questions||questions;
      localStorage.setItem("plsQuestions",JSON.stringify(questions));localStorage.setItem("plsState",JSON.stringify(state));
      render(); applyingRemote=false;
    } else if(!new URLSearchParams(location.search).has("audience")) pushCloud();
  }catch(e){console.error("Cloud pull:",e)}
}
let lastCloud=""; let lastStrikeFlash=0; let lastAnswerFlash=0;
async function pollCloud(){
  try{
    const r=await fetch(SUPABASE_URL+"/rest/v1/games?code=eq."+encodeURIComponent(GAME_CODE)+"&select=state,updated_at",{headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY}});
    const rows=await r.json(), row=rows[0];
    if(row&&row.updated_at!==lastCloud){
      lastCloud=row.updated_at;
      if(row.state?.state){
        applyingRemote=true;
        state=row.state.state;
        questions=row.state.questions||questions;
        localStorage.setItem("plsQuestions",JSON.stringify(questions));
        localStorage.setItem("plsState",JSON.stringify(state));
        render();
        if(state.strikeFlash&&state.strikeFlash!==lastStrikeFlash){lastStrikeFlash=state.strikeFlash;flashStrike()}
        if(state.answerFlash&&state.answerFlash!==lastAnswerFlash){lastAnswerFlash=state.answerFlash;answerSound()}
        applyingRemote=false;
      }
    }
  }catch(e){console.error("Cloud poll:",e)}
}
const DEFAULT_GAME=[{"q":"What's in the comfort kit?","answers":[["Bandages",30],["Insect Sting Swab",25],["Splinter Removal",20],["Throat Lozenges",15],["Moleskin",10],["Baby Powder",8],["Eye Wash",6],["Synthetic Medical Gloves",5]],"note":"Additional source answers: Ibuprofen; Acetaminophen; Antacid Tablets; Antihistamine; Bacitracin ointments; Hydrocortisone cream; Cold pack; Hot pack."},{"q":"Which floats are a one person clear?","answers":[["Opening",30],["All Books",25],["Candy House",20],["The Trees",15],["Toy Blocks",10],["Humvee",10]]},{"q":"Which floats are a two person clear? i.e. side to side","answers":[["Frozen",30],["Ballroom",20],["Santa",10]]},{"q":"What is the P.A.S.S model?","answers":[["Pull",25],["Aim",25],["Squeeze",25],["Sweep",25]]},{"q":"What are the different types of Fire Extinguishers?","answers":[["Class A",25],["Class B",20],["Class C",20],["Class D",15],["Class ABC",20]],"note":"Class A: ordinary solid combustibles. Class B: flammable liquids and gases. Class C: energized electrical equipment. Class D: combustible metals. Class ABC: multi-purpose for ordinary combustibles, flammable liquids, and energized electrical equipment."},{"q":"What are the top responsibilities for the Fantasyland lead at the sign in board?","answers":[["Check for Show Look",25],["Monitor time clock reporting",20],["Check the call out log",15],["Inform Parade 1 of missing Cast",15],["Call scheduling for missing cast",10],["Relay changes to fellow leads",10],["PA announcements",5]]},{"q":"Name something to check or do when dispatching parade trams or shuttles.","answers":[["Check in with Show Services Driver",25],["Verify passengers are onboard",20],["Make sure everyone is safely seated",20],["Give the thumbs up to depart",15],["Clear belongings at arrival",10],["Announce when clear to depart again",10]]},{"q":"Name something you need to report or document on the OP Sheet.","answers":[["Cast Members' sign-ins and attendance",30],["Roles being performed",25],["Shift alterations/updates",20],["Notes on late/no-shows",15],["Changes in performing roster",10]]},{"q":"Name something monitored during a performer conditioning session.","answers":[["Participation of scheduled performers",20],["Start/end time & session length",18],["Correct attire/Disney Look compliance",16],["Appropriate and safe music",14],["Minimal side conversations/talking",12],["Noise levels",10],["No personal electronic device use",6],["Clean-up after session",4]],"note":"Additional source answer: Reporting of injuries or no-shows."},{"q":"Name a situation where you should initiate a Drive Stop on a float.","answers":[["Child or Guest runs onto parade route",1],["Safety hazard on or around the float",1],["Cast Member is injured",1],["Fire or electrical malfunction",1],["Float needs to stop quickly for safety",1]],"sourcePoints":true}];
let questions=JSON.parse(localStorage.getItem("plsQuestions")||JSON.stringify(DEFAULT_GAME));
let state=JSON.parse(localStorage.getItem("plsState")||'{"round":0,"revealed":[],"a":0,"b":0,"strikes":0,"mult":1,"teamA":"TEAM A","teamB":"TEAM B"}');
const bc=("BroadcastChannel" in window)?new BroadcastChannel("parade-lead-showdown"):null;
if(bc)bc.onmessage=e=>{if(e.data==="sync"){load();render();}};
window.addEventListener("storage",e=>{if(e.key==="plsState"||e.key==="plsQuestions"){load();render();}});
function save(){localStorage.setItem("plsQuestions",JSON.stringify(questions));localStorage.setItem("plsState",JSON.stringify(state));if(bc)bc.postMessage("sync");pushCloud()}
function load(){questions=JSON.parse(localStorage.getItem("plsQuestions")||JSON.stringify(DEFAULT_GAME));state=JSON.parse(localStorage.getItem("plsState")||JSON.stringify(state))}
function show(id){document.querySelectorAll(".view").forEach(x=>x.classList.add("hidden"));document.getElementById(id).classList.remove("hidden");render()}
function bank(){return questions[state.round].answers.reduce((s,a,i)=>s+(state.revealed.includes(i)?a[1]:0),0)*state.mult}
function reveal(i){if(i>=questions[state.round].answers.length)return;if(!state.revealed.includes(i))state.revealed.push(i);answerSound();state.answerFlash=Date.now();lastAnswerFlash=state.answerFlash;save();render()}
function flashStrike(){let o=document.getElementById("strikeOverlay");o.classList.remove("on");void o.offsetWidth;o.classList.add("on");buzzerSound();setTimeout(()=>o.classList.remove("on"),1800)}
function strike(){state.strikes=Math.min(3,state.strikes+1);state.strikeFlash=Date.now();lastStrikeFlash=state.strikeFlash;flashStrike();save();render()}
function award(t){state[t]+=bank();state.revealed=[];state.strikes=0;tone(900,.25);save();render()}
function nav(n){const oldRound=state.round;state.round=Math.max(0,Math.min(questions.length-1,state.round+n));state.revealed=[];state.strikes=0;if(state.round!==oldRound)nextQuestionSound();save();render()}
const SOUND_REVEAL="Family%20Feud%20YES%20Ding%20-%20QuickSounds.com.mp3";
const SOUND_BUZZER="family%20feud%20buzzer%20-%20QuickSounds.com.mp3";
const SOUND_NEXT="Family%20Feud%20theme%20-%20After%201st%20Fast%20Money%20-%20QuickSounds.com.mp3";
function playClip(src){try{const a=new Audio(src);a.volume=1;const p=a.play();if(p&&p.catch)p.catch(()=>{})}catch(e){}}
function answerSound(){playClip(SOUND_REVEAL)}
function buzzerSound(){playClip(SOUND_BUZZER)}
function nextQuestionSound(){playClip(SOUND_NEXT)}
function tone(freq,dur){try{let A=audio(),o=A.createOscillator(),g=A.createGain();o.frequency.value=freq;o.connect(g);g.connect(A.destination);g.gain.setValueAtTime(.1,A.currentTime);g.gain.exponentialRampToValueAtTime(.001,A.currentTime+dur);o.start();o.stop(A.currentTime+dur)}catch(e){}}
function setTeamName(team,value){if(team==="A")state.teamA=value||"TEAM A";else state.teamB=value||"TEAM B";save();document.querySelectorAll(".score").forEach((el,i)=>{const name=i%2===0?state.teamA:state.teamB;const b=el.querySelector("b");el.childNodes[0].nodeValue=name;});}
function board(){let q=questions[state.round];state.teamA=state.teamA||"TEAM A";state.teamB=state.teamB||"TEAM B";return `<div class="board"><div class="question">${q.q}</div><div class="answers">${q.answers.map((a,i)=>`<div class="answer ${state.revealed.includes(i)?"":"covered"}"><div class="num">${i+1}</div><div class="txt">${a[0]}</div><div class="pts">${a[1]}</div></div>`).join("")}</div><div class="scores"><div class="score">${state.teamA}<b>${state.a}</b></div><div class="bank">BANK<b>${bank()}</b><div>${"✕".repeat(state.strikes)}</div></div><div class="score">${state.teamB}<b>${state.b}</b></div></div></div>`}
function render(){document.getElementById("game").innerHTML=board();let q=questions[state.round];document.getElementById("host").innerHTML=`<div class="hostPreviewWrap"><div class="hostPreviewLabel">LIVE AUDIENCE BOARD</div><div class="hostPreview">${board()}</div></div><div class="panel"><h2>Round ${state.round+1} / ${questions.length}</h2><div class="teamNames"><label>Team A Name<input id="teamAName" value="${(state.teamA||"TEAM A").replace(/"/g,"&quot;")}" oninput="setTeamName(\'A\',this.value)"></label><label>Team B Name<input id="teamBName" value="${(state.teamB||"TEAM B").replace(/"/g,"&quot;")}" oninput="setTeamName(\'B\',this.value)"></label></div><h1>${q.q}</h1><div class="controls">${q.answers.map((a,i)=>`<button onclick="reveal(${i})">${i+1}. ${state.revealed.includes(i)?"Shown":a[0]+" — "+a[1]}</button>`).join("")}</div><p class="small">${q.note||""}</p></div><div class="panel"><h3>Game Controls</h3><div class="controls"><button onclick="nav(-1)">◀ Previous</button><button onclick="nav(1)">Next ▶</button><button class="danger" onclick="strike()">✕ Strike</button><button onclick="state.strikes=0;save();render()">Clear Strikes</button></div><label>Multiplier</label><div class="controls">${[1,2,3].map(x=>`<button onclick="state.mult=${x};save();render()">${x}×</button>`).join("")}</div><h2>Bank: ${bank()}</h2><div class="controls"><button onclick="award('a')">Award Team A</button><button onclick="award('b')">Award Team B</button></div></div>`;document.getElementById("editor").innerHTML=`<div class="panel"><h2>Question Editor</h2><label>Round</label><select onchange="state.round=+this.value;save();render()">${questions.map((x,i)=>`<option value="${i}" ${i===state.round?"selected":""}>${i+1}. ${x.q}</option>`).join("")}</select><label>Question</label><textarea id="eq">${q.q}</textarea><h3>Answers</h3>${q.answers.map((a,i)=>`<div class="editAns"><input id="ea${i}" value="${a[0].replaceAll('"','&quot;')}"><input id="ep${i}" type="number" value="${a[1]}"><button class="danger" onclick="delAns(${i})">×</button></div>`).join("")}<div class="controls"><button onclick="addAns()">+ Answer</button><button onclick="saveEdit()">Save Changes</button><button onclick="exportGame()">Export JSON</button><button class="danger" onclick="resetAll()">Reset Default</button></div></div>`}
function saveEdit(){let q=questions[state.round];q.q=document.getElementById("eq").value;q.answers=q.answers.map((a,i)=>[document.getElementById("ea"+i).value,+document.getElementById("ep"+i).value]);save();render()}
function addAns(){questions[state.round].answers.push(["New Answer",0]);save();render()}function delAns(i){questions[state.round].answers.splice(i,1);save();render()}
function exportGame(){let b=new Blob([JSON.stringify(questions,null,2)],{type:"application/json"}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download="parade-lead-showdown-questions.json";a.click();URL.revokeObjectURL(u)}
function resetAll(){if(confirm("Reset questions and scores to the original training set?")){questions=JSON.parse(JSON.stringify(DEFAULT_GAME));state={round:0,revealed:[],a:0,b:0,strikes:0,mult:1};save();render()}}
function openAudience(){let u=new URL(location.href);u.searchParams.set("audience","1");window.open(u.toString(),"audience","width=1400,height=850")}
document.addEventListener("keydown",e=>{if(e.target.matches("input,textarea"))return;if("12345678".includes(e.key))reveal(+e.key-1);if(e.key.toLowerCase()==="x")strike();if(e.key==="ArrowRight")nav(1);if(e.key==="ArrowLeft")nav(-1);if(e.key.toLowerCase()==="a")award("a");if(e.key.toLowerCase()==="b")award("b");if(e.key.toLowerCase()==="f")document.documentElement.requestFullscreen?.()});
if(new URLSearchParams(location.search).has("audience")){document.body.classList.add("audience");show("game")}else render(); pullCloud(); setInterval(pollCloud,700);