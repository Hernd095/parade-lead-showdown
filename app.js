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
      lastCloud=rows[0].updated_at||lastCloud; lastStrikeFlash=state.strikeFlash||0; lastAnswerFlash=state.answerFlash||0; lastNavFlash=state.navFlash||0; lastWinFlash=state.winFlash||0;
      localStorage.setItem("plsQuestions",JSON.stringify(questions));localStorage.setItem("plsState",JSON.stringify(state));
      render(); applyingRemote=false;
    } else if(!new URLSearchParams(location.search).has("audience")) pushCloud();
  }catch(e){console.error("Cloud pull:",e)}
}
let lastCloud=""; let lastStrikeFlash=0; let lastNavFlash=0; let lastAnswerFlash=0; let lastWinFlash=0;
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
        if(state.navFlash&&state.navFlash!==lastNavFlash){lastNavFlash=state.navFlash;nextQuestionSound()}
        if(state.winFlash&&state.winFlash!==lastWinFlash){lastWinFlash=state.winFlash;winningSound()}
        applyingRemote=false;
      }
    }
  }catch(e){console.error("Cloud poll:",e)}
}
const DEFAULT_GAME=[{"q":"What's in the comfort kit?","answers":[["Bandages",30],["Insect Sting Swab",25],["Splinter Removal",20],["Throat Lozenges",15],["Moleskin",10],["Baby Powder",8],["Eye Wash",6],["Synthetic Medical Gloves",5]],"note":"Additional source answers: Ibuprofen; Acetaminophen; Antacid Tablets; Antihistamine; Bacitracin ointments; Hydrocortisone cream; Cold pack; Hot pack."},{"q":"Which floats are a one person clear?","answers":[["Opening",30],["All Books",25],["Candy House",20],["The Trees",15],["Toy Blocks",10],["Humvee",10]]},{"q":"Which floats are a two person clear? i.e. side to side","answers":[["Frozen",30],["Ballroom",20],["Santa",10]]},{"q":"What is the P.A.S.S model?","answers":[["Pull",25],["Aim",25],["Squeeze",25],["Sweep",25]]},{"q":"What are the different types of Fire Extinguishers?","answers":[["Class A",25],["Class B",20],["Class C",20],["Class D",15],["Class ABC",20]],"note":"Class A: ordinary solid combustibles. Class B: flammable liquids and gases. Class C: energized electrical equipment. Class D: combustible metals. Class ABC: multi-purpose for ordinary combustibles, flammable liquids, and energized electrical equipment."},{"q":"What are the top responsibilities for the Fantasyland lead at the sign in board?","answers":[["Check for Show Look",25],["Monitor time clock reporting",20],["Check the call out log",15],["Inform Parade 1 of missing Cast",15],["Call scheduling for missing cast",10],["Relay changes to fellow leads",10],["PA announcements",5]]},{"q":"Name something to check or do when dispatching parade trams or shuttles.","answers":[["Check in with Show Services Driver",25],["Verify passengers are onboard",20],["Make sure everyone is safely seated",20],["Give the thumbs up to depart",15],["Clear belongings at arrival",10],["Announce when clear to depart again",10]]},{"q":"Name something you need to report or document on the OP Sheet.","answers":[["Cast Members' sign-ins and attendance",30],["Roles being performed",25],["Shift alterations/updates",20],["Notes on late/no-shows",15],["Changes in performing roster",10]]},{"q":"Name something monitored during a performer conditioning session.","answers":[["Participation of scheduled performers",20],["Start/end time & session length",18],["Correct attire/Disney Look compliance",16],["Appropriate and safe music",14],["Minimal side conversations/talking",12],["Noise levels",10],["No personal electronic device use",6],["Clean-up after session",4]],"note":"Additional source answer: Reporting of injuries or no-shows."},{"q":"Name a situation where you should initiate a Drive Stop on a float.","answers":[["Child or Guest runs onto parade route",1],["Safety hazard on or around the float",1],["Cast Member is injured",1],["Fire or electrical malfunction",1],["Float needs to stop quickly for safety",1]],"sourcePoints":true}];
let questions=JSON.parse(localStorage.getItem("plsQuestions")||JSON.stringify(DEFAULT_GAME));
let state=JSON.parse(localStorage.getItem("plsState")||'{"round":0,"revealed":[],"a":0,"b":0,"strikes":0,"mult":1,"teamA":"TEAM A","teamB":"TEAM B"}');
const bc=("BroadcastChannel" in window)?new BroadcastChannel("parade-lead-showdown"):null;
if(bc)bc.onmessage=e=>{if(e.data==="sync"){load();render();if(isAudience()){if(state.strikeFlash&&state.strikeFlash!==lastStrikeFlash){lastStrikeFlash=state.strikeFlash;flashStrike()}if(state.answerFlash&&state.answerFlash!==lastAnswerFlash){lastAnswerFlash=state.answerFlash;answerSound()}if(state.navFlash&&state.navFlash!==lastNavFlash){lastNavFlash=state.navFlash;nextQuestionSound()}if(state.winFlash&&state.winFlash!==lastWinFlash){lastWinFlash=state.winFlash;winningSound()}}}};
window.addEventListener("storage",e=>{if(e.key==="plsState"||e.key==="plsQuestions"){load();render();if(isAudience()){if(state.strikeFlash&&state.strikeFlash!==lastStrikeFlash){lastStrikeFlash=state.strikeFlash;flashStrike()}if(state.answerFlash&&state.answerFlash!==lastAnswerFlash){lastAnswerFlash=state.answerFlash;answerSound()}if(state.navFlash&&state.navFlash!==lastNavFlash){lastNavFlash=state.navFlash;nextQuestionSound()}}}});
function save(){localStorage.setItem("plsQuestions",JSON.stringify(questions));localStorage.setItem("plsState",JSON.stringify(state));if(bc)bc.postMessage("sync");pushCloud()}
function load(){questions=JSON.parse(localStorage.getItem("plsQuestions")||JSON.stringify(DEFAULT_GAME));state=JSON.parse(localStorage.getItem("plsState")||JSON.stringify(state))}
function show(id){document.querySelectorAll(".view").forEach(x=>x.classList.add("hidden"));document.getElementById(id).classList.remove("hidden");render()}
function bank(){return questions[state.round].answers.reduce((s,a,i)=>s+(state.revealed.includes(i)?a[1]:0),0)*state.mult}
function reveal(i){if(i>=questions[state.round].answers.length||state.revealed.includes(i))return;state.revealed.push(i);answerSound();state.answerFlash=Date.now();save();render()}
function flashStrike(){let o=document.getElementById("strikeOverlay");o.classList.remove("on");void o.offsetWidth;o.classList.add("on");buzzerSound();setTimeout(()=>o.classList.remove("on"),1800)}
function strike(){state.strikes=Math.min(3,state.strikes+1);state.strikeFlash=Date.now();flashStrike();save();render()}
function award(t){state[t]+=bank();state.strikes=0;tone(900,.25);save();render()}
function nav(n){const before=state.round;state.round=Math.max(0,Math.min(questions.length-1,state.round+n));state.revealed=[];state.strikes=0;if(state.round!==before){state.navFlash=Date.now();lastNavFlash=state.navFlash;nextQuestionSound()}save();render()}
const SOUND_REVEAL="./Family%20Feud%20YES%20Ding%20-%20QuickSounds.com.mp3";
const SOUND_BUZZER="./family-feud-strike-sfx.mp3";
const SOUND_NEXT="./transition-music.mp3";
const SOUND_WIN="./winning-music.mp3";
const isAudience=()=>new URLSearchParams(location.search).has("audience");
const soundPlayers={};
function primeSounds(){
  if(!isAudience())return;
  [SOUND_REVEAL,SOUND_BUZZER,SOUND_NEXT,SOUND_WIN].forEach(src=>{
    if(!soundPlayers[src]){const a=new Audio(src);a.preload="auto";soundPlayers[src]=a}
    const a=soundPlayers[src];a.muted=true;
    const p=a.play();if(p&&p.then)p.then(()=>{a.pause();a.currentTime=0;a.muted=false}).catch(()=>{a.muted=false});
  });
}
function playClip(src){
  if(!isAudience())return;
  try{
    if(!soundPlayers[src]){const a=new Audio(src);a.preload="auto";soundPlayers[src]=a}
    const a=soundPlayers[src];a.pause();a.currentTime=0;a.muted=false;a.volume=1;
    const p=a.play();if(p&&p.catch)p.catch(()=>{});
  }catch(e){}
}
if(isAudience()){document.addEventListener("pointerdown",primeSounds,{once:true});document.addEventListener("keydown",primeSounds,{once:true})}
function answerSound(){playClip(SOUND_REVEAL)}
function buzzerSound(){playClip(SOUND_BUZZER)}
function nextQuestionSound(){playClip(SOUND_NEXT)}
function winningSound(){playClip(SOUND_WIN)}
function playWinningMusic(){state.winFlash=Date.now();lastWinFlash=state.winFlash;winningSound();save();render()}
function tone(freq,dur){try{let A=audio(),o=A.createOscillator(),g=A.createGain();o.frequency.value=freq;o.connect(g);g.connect(A.destination);g.gain.setValueAtTime(.1,A.currentTime);g.gain.exponentialRampToValueAtTime(.001,A.currentTime+dur);o.start();o.stop(A.currentTime+dur)}catch(e){}}
function setTeamName(team,value){if(team==="A")state.teamA=value||"TEAM A";else state.teamB=value||"TEAM B";save();document.querySelectorAll(".score").forEach((el,i)=>{const name=i%2===0?state.teamA:state.teamB;const b=el.querySelector("b");el.childNodes[0].nodeValue=name;});}
function board(){let q=questions[state.round];state.teamA=state.teamA||"TEAM A";state.teamB=state.teamB||"TEAM B";return `<div class="board"><div class="question">${q.q}</div><div class="answers">${q.answers.map((a,i)=>`<div class="answer ${state.revealed.includes(i)?"":"covered"}"><div class="num">${i+1}</div><div class="txt">${a[0]}</div><div class="pts">${a[1]}</div></div>`).join("")}</div><div class="scores"><div class="score">${state.teamA}<b>${state.a}</b></div><div class="bank">BANK<b>${bank()}</b><div>${"✕".repeat(state.strikes)}</div></div><div class="score">${state.teamB}<b>${state.b}</b></div></div></div>`}
function render(){
  document.getElementById("game").innerHTML=board();
  let q=questions[state.round], teamA=state.teamA||"TEAM A", teamB=state.teamB||"TEAM B";
  document.getElementById("host").innerHTML=`
  <div class="hostConsole">
    <div class="hostTopbar"><div><b>PARADE LEAD <span>SHOWDOWN</span></b><small>HOST CONSOLE</small></div><div class="hostTopActions"><button onclick="openAudience()">Open Audience Board</button><button onclick="show('editor')">Edit Questions</button></div></div>
    <div class="hostGrid">
      <div class="hostLeft">
        <div class="consoleCard previewCard"><div class="consoleLabel">LIVE BOARD PREVIEW</div><div class="hostPreview">${board()}</div></div>
        <div class="consoleCard navCard"><button onclick="nav(-1)">◀ Prev</button><select onchange="state.round=+this.value;save();render()">${questions.map((x,i)=>`<option value="${i}" ${i===state.round?"selected":""}>Round ${i+1}: ${x.q}</option>`).join("")}</select><button onclick="nav(1)">Next ▶</button><button onclick="resetRound()">Reset round</button><button class="danger" onclick="resetBoard()">Reset game</button></div>
        <div class="teamControlGrid">
          <div class="consoleCard teamControl activeTeam"><div class="teamRow"><b>A</b><input value="${teamA.replace(/"/g,"&quot;")}" oninput="setTeamName('A',this.value)"></div><div class="bigScore">${state.a}</div><div class="scoreBtns"><button onclick="adjustScore('a',-10)">-10</button><button onclick="adjustScore('a',-5)">-5</button><button onclick="adjustScore('a',5)">+5</button><button onclick="adjustScore('a',10)">+10</button></div></div>
          <div class="consoleCard teamControl"><div class="teamRow"><b>B</b><input value="${teamB.replace(/"/g,"&quot;")}" oninput="setTeamName('B',this.value)"></div><div class="bigScore">${state.b}</div><div class="scoreBtns"><button onclick="adjustScore('b',-10)">-10</button><button onclick="adjustScore('b',-5)">-5</button><button onclick="adjustScore('b',5)">+5</button><button onclick="adjustScore('b',10)">+10</button></div></div>
        </div>
      </div>
      <div class="hostRight">
        <div class="consoleCard answerControl"><div class="consoleLabel">ROUND ${state.round+1} · HOST PREVIEW</div><h2>${q.q}</h2><div class="hostAnswers">${q.answers.map((x,i)=>`<button class="${state.revealed.includes(i)?"shown":""}" onclick="reveal(${i})"><b>${i+1}</b><span>${x[0]}</span><strong>${x[1]}</strong><small>${state.revealed.includes(i)?"SHOWN":"HIDDEN"}</small></button>`).join("")}</div><div class="miniActions"><button onclick="revealAll()">Reveal all</button><button onclick="hideAll()">Hide all</button></div></div>
        <div class="consoleCard bankControl"><div><div class="consoleLabel">BANK</div><div class="bankNumber">${bank()}</div></div><div class="multControl"><div class="consoleLabel">MULTIPLIER</div><div class="scoreBtns">${[1,2,3].map(x=>`<button class="${state.mult===x?"selected":""}" onclick="state.mult=${x};save();render()">${x}x</button>`).join("")}</div></div><div class="awardBtns"><button onclick="award('a')">Award → ${teamA}</button><button onclick="award('b')">Award → ${teamB}</button><button class="winMusicBtn" onclick="playWinningMusic()">🏆 Play Winning Music</button></div></div>
        <div class="consoleCard strikeControl"><div class="strikeHead"><div class="consoleLabel">STRIKES</div><button onclick="state.strikes=0;save();render()">Clear strikes</button></div><div class="strikeTeam"><span>${teamA}</span><strong>${"✕".repeat(state.strikes)}</strong><button class="danger" onclick="strike()">+ Strike</button></div></div>
      </div>
    </div>
  </div>`;
  document.getElementById("editor").innerHTML=`<div class="panel"><h2>Question Editor</h2><label>Round</label><select onchange="state.round=+this.value;save();render()">${questions.map((x,i)=>`<option value="${i}" ${i===state.round?"selected":""}>${i+1}. ${x.q}</option>`).join("")}</select><label>Question</label><textarea id="eq">${q.q}</textarea><h3>Answers</h3>${q.answers.map((x,i)=>`<div class="editAns"><input id="ea${i}" value="${x[0].replaceAll('"','&quot;')}"><input id="ep${i}" type="number" value="${x[1]}"><button class="danger" onclick="delAns(${i})">×</button></div>`).join("")}<div class="controls"><button onclick="addAns()">+ Answer</button><button onclick="saveEdit()">Save Changes</button><button onclick="exportGame()">Export JSON</button><button class="danger" onclick="resetAll()">Reset Default</button></div></div>`;
}
function resetRound(){state.revealed=[];state.strikes=0;state.mult=1;save();render()}
function revealAll(){state.revealed=questions[state.round].answers.map((_,i)=>i);save();render()}
function hideAll(){state.revealed=[];save();render()}
function adjustScore(team,amount){state[team]=Math.max(0,(state[team]||0)+amount);save();render()}
function saveEdit(){let q=questions[state.round];q.q=document.getElementById("eq").value;q.answers=q.answers.map((a,i)=>[document.getElementById("ea"+i).value,+document.getElementById("ep"+i).value]);save();render()}
function addAns(){questions[state.round].answers.push(["New Answer",0]);save();render()}function delAns(i){questions[state.round].answers.splice(i,1);save();render()}
function exportGame(){let b=new Blob([JSON.stringify(questions,null,2)],{type:"application/json"}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download="parade-lead-showdown-questions.json";a.click();URL.revokeObjectURL(u)}
function resetBoard(){if(confirm("Reset the board? This will clear scores, revealed answers, strikes, multiplier, team names, and return to Round 1.")){state={round:0,revealed:[],a:0,b:0,strikes:0,mult:1,teamA:"TEAM A",teamB:"TEAM B"};save();render()}}
function resetAll(){if(confirm("Reset questions and scores to the original training set?")){questions=JSON.parse(JSON.stringify(DEFAULT_GAME));state={round:0,revealed:[],a:0,b:0,strikes:0,mult:1};save();render()}}
function openAudience(){let u=new URL(location.href);u.searchParams.set("audience","1");window.open(u.toString(),"audience","width=1400,height=850")}
document.addEventListener("keydown",e=>{if(e.target.matches("input,textarea"))return;if("12345678".includes(e.key))reveal(+e.key-1);if(e.key.toLowerCase()==="x")strike();if(e.key==="ArrowRight")nav(1);if(e.key==="ArrowLeft")nav(-1);if(e.key.toLowerCase()==="a")award("a");if(e.key.toLowerCase()==="b")award("b");if(e.key.toLowerCase()==="f")document.documentElement.requestFullscreen?.()});
if(new URLSearchParams(location.search).has("audience")){document.body.classList.add("audience");show("game")}else render(); pullCloud(); setInterval(pollCloud,700);