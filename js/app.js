import { Auth, DB } from './firebase.js'

// ═══════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════
const S = {
  user: null, plans: [], history: [], customEx: [],
  session: null, timerInt: null, timerSec: 0, restInt: null, restDur: 60, charts: {},
  npSel: [], npMuscle: 'Todos',
  epId: '', epExs: [], epMuscle: 'Todos',
}

// ═══════════════════════════════════════════════
// EXERCISE DATABASE
// ═══════════════════════════════════════════════
const BUILTIN = [
  {id:'e01',name:'Supino Reto com Barra',   muscle:'Peitoral',   type:'musculacao'},
  {id:'e02',name:'Supino Inclinado',         muscle:'Peitoral',   type:'musculacao'},
  {id:'e03',name:'Crossover na Polia',       muscle:'Peitoral',   type:'musculacao'},
  {id:'e04',name:'Flexão de Braços',         muscle:'Peitoral',   type:'musculacao'},
  {id:'e05',name:'Peck Deck',                muscle:'Peitoral',   type:'musculacao'},
  {id:'e06',name:'Puxada Alta Frente',       muscle:'Costas',     type:'musculacao'},
  {id:'e07',name:'Remada Curvada',           muscle:'Costas',     type:'musculacao'},
  {id:'e08',name:'Serrote com Halter',       muscle:'Costas',     type:'musculacao'},
  {id:'e09',name:'Barra Fixa',               muscle:'Costas',     type:'musculacao'},
  {id:'e10',name:'Pull-over na Polia',       muscle:'Costas',     type:'musculacao'},
  {id:'e11',name:'Agachamento Livre',        muscle:'Quadríceps', type:'musculacao'},
  {id:'e12',name:'Leg Press 45°',           muscle:'Quadríceps', type:'musculacao'},
  {id:'e13',name:'Cadeira Extensora',        muscle:'Quadríceps', type:'musculacao'},
  {id:'e14',name:'Hack Squat',               muscle:'Quadríceps', type:'musculacao'},
  {id:'e15',name:'Mesa Flexora',             muscle:'Posterior',  type:'musculacao'},
  {id:'e16',name:'Stiff',                    muscle:'Posterior',  type:'musculacao'},
  {id:'e17',name:'Desenvolvimento c/ Barra', muscle:'Ombro',      type:'musculacao'},
  {id:'e18',name:'Elevação Lateral',         muscle:'Ombro',      type:'musculacao'},
  {id:'e19',name:'Elevação Frontal',         muscle:'Ombro',      type:'musculacao'},
  {id:'e20',name:'Rosca Direta',             muscle:'Bíceps',     type:'musculacao'},
  {id:'e21',name:'Rosca Martelo',            muscle:'Bíceps',     type:'musculacao'},
  {id:'e22',name:'Rosca Concentrada',        muscle:'Bíceps',     type:'musculacao'},
  {id:'e23',name:'Tríceps Pulley',           muscle:'Tríceps',    type:'musculacao'},
  {id:'e24',name:'Tríceps Francês',          muscle:'Tríceps',    type:'musculacao'},
  {id:'e25',name:'Tríceps Corda',            muscle:'Tríceps',    type:'musculacao'},
  {id:'e26',name:'Panturrilha no Smith',     muscle:'Panturrilha',type:'musculacao'},
  {id:'e27',name:'Panturrilha Sentado',      muscle:'Panturrilha',type:'musculacao'},
  {id:'e28',name:'Abdominal Crunch',         muscle:'Abdômen',    type:'musculacao'},
  {id:'e29',name:'Prancha',                  muscle:'Abdômen',    type:'musculacao'},
  {id:'e30',name:'Abdominal Roda',           muscle:'Abdômen',    type:'musculacao'},
  {id:'e31',name:'Corrida',                  muscle:'Cardio',     type:'cardio'},
  {id:'e32',name:'Caminhada',                muscle:'Cardio',     type:'cardio'},
  {id:'e33',name:'Bicicleta',                muscle:'Cardio',     type:'cardio'},
  {id:'e34',name:'Esteira',                  muscle:'Cardio',     type:'cardio'},
  {id:'e35',name:'Elíptico',                 muscle:'Cardio',     type:'cardio'},
  {id:'e36',name:'Natação',                  muscle:'Cardio',     type:'cardio'},
  {id:'e37',name:'Burpees',                  muscle:'HIIT',       type:'hiit'},
  {id:'e38',name:'Jumping Jacks',            muscle:'HIIT',       type:'hiit'},
  {id:'e39',name:'Mountain Climbers',        muscle:'HIIT',       type:'hiit'},
  {id:'e40',name:'Box Jump',                 muscle:'HIIT',       type:'hiit'},
]
const MUSCLES = ['Todos','Peitoral','Costas','Quadríceps','Posterior','Ombro','Bíceps','Tríceps','Panturrilha','Abdômen','Cardio','HIIT','Personalizado']
const COLORS  = ['c0','c1','c2','c3','c4']

function allEx() { return [...BUILTIN, ...S.customEx] }

// ═══════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════
const $ = id => document.getElementById(id)
const fmtDate = d => { if(!d)return'—'; const dt=new Date(d+'T12:00:00'); return dt.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}) }
const greet = () => { const h=new Date().getHours(); return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite' }
const dayNm  = (d=new Date()) => ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][d.getDay()]
const monNm  = (d=new Date()) => ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'][d.getMonth()]
const typeL  = t => ({musculacao:'Musculação',cardio:'Cardio',hiit:'HIIT'}[t]||t)
const ini    = n => n.trim().split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()

let _tt = null
function toast(msg, type='info') {
  const el=$('toast'); el.textContent=msg; el.className=`toast show${type==='ok'?' ok':type==='err'?' err':''}`
  clearTimeout(_tt); _tt=setTimeout(()=>el.classList.remove('show'),2800)
}

function openModal(id)  { const el=$(id); el.classList.add('open') }
function closeModal(id) { $(id)?.classList.remove('open') }
window.closeModal = closeModal

function loader(msg='Carregando...') { $('load-msg').textContent=msg; $('loader').style.display='flex' }
function unloader() { $('loader').style.display='none' }

// ═══════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════
function nav(name) {
  document.querySelectorAll('.scr').forEach(s=>s.classList.remove('on'))
  document.querySelectorAll('.ni').forEach(b=>b.classList.remove('on'))
  $('scr-'+name)?.classList.add('on')
  $('n-'+name)?.classList.add('on')
  if(name==='home')     renderHome()
  if(name==='plans')    renderPlans()
  if(name==='history')  renderHistory()
  if(name==='progress') renderProgress()
  if(name==='profile')  renderProfile()
}
window.nav = nav

// ═══════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════
async function boot(uid) {
  loader('Carregando seus dados...')
  try {
    const [user, plans, history, customEx] = await Promise.all([
      DB.getUser(uid), DB.getPlans(uid), DB.getSessions(uid), DB.getCustomEx(uid)
    ])
    S.user=user; S.plans=plans; S.history=history; S.customEx=customEx
    const saved=localStorage.getItem('im_rest'); if(saved) S.restDur=parseInt(saved)
    $('auth').style.display='none'; $('app').style.display='flex'
    updateAvBtn()
    nav('home')
    toast(`Olá, ${S.user.name?.split(' ')[0]||'Atleta'}! 💪`, 'ok')
  } catch(e) {
    console.error(e)
    toast('Erro ao carregar: '+e.message, 'err')
  } finally { unloader() }
}

function updateAvBtn() {
  const btn=$('av-btn'); if(!btn) return
  btn.innerHTML = S.user?.avatarUrl ? `<img src="${S.user.avatarUrl}" alt="">` : (S.user?.initials||'?')
}

// ═══════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════
function showAuth(mode='login') {
  $('auth').style.display='flex'; $('app').style.display='none'
  renderAuth(mode)
}

function renderAuth(mode) {
  const isL = mode==='login'
  $('auth-card').innerHTML = `
    <div class="auth-head">
      <div class="auth-ttl">${isL?'Bem-vindo de volta':'Criar conta'}</div>
      <div class="auth-sub">${isL?'Entre para continuar seus treinos':'Comece a acompanhar seu progresso'}</div>
    </div>
    <div class="auth-err" id="aerr"></div>
    ${!isL?`<div class="field"><label class="lbl">Nome completo</label><input class="inp" id="a-nm" placeholder="Seu nome" autocomplete="name"></div>`:''}
    <div class="field"><label class="lbl">E-mail</label><input class="inp" id="a-em" type="email" placeholder="seu@email.com" autocomplete="email"></div>
    <div class="field">
      <label class="lbl">Senha</label>
      <div class="pw-wrap">
        <input class="inp" id="a-pw" type="password" placeholder="${isL?'Sua senha':'Mínimo 6 caracteres'}" autocomplete="${isL?'current-password':'new-password'}">
        <button class="pw-eye" id="a-eye" type="button">👁</button>
      </div>
    </div>
    <button class="btn btn-g" id="a-btn" type="button" style="margin-top:8px;">${isL?'Entrar':'Criar conta'}</button>
    <div class="auth-sw">${isL?`Não tem conta? <button class="auth-sw-btn" type="button">Cadastre-se</button>`:
    `Já tem conta? <button class="auth-sw-btn" type="button">Entrar</button>`}</div>`

  $('a-eye').onclick = () => { const i=$('a-pw'),b=$('a-eye'); i.type=i.type==='password'?'text':'password'; b.textContent=i.type==='password'?'👁':'🙈' }
  $('a-btn').onclick = () => doAuth(mode)
  $('auth-card').querySelector('.auth-sw-btn').onclick = () => renderAuth(isL?'register':'login')
  setTimeout(()=>{ $('a-pw').onkeydown=e=>{if(e.key==='Enter')doAuth(mode)}; $(isL?'a-em':'a-nm')?.focus() },50)
}

async function doAuth(mode) {
  const em=$('a-em')?.value.trim(), pw=$('a-pw')?.value, nm=$('a-nm')?.value.trim()
  const errEl=$('aerr'), btn=$('a-btn')
  errEl.style.display='none'
  if(!em||!pw){errEl.textContent='Preencha todos os campos.';errEl.style.display='block';return}
  if(mode==='register'&&!nm){errEl.textContent='Informe seu nome.';errEl.style.display='block';return}
  btn.disabled=true; btn.textContent=mode==='login'?'Entrando...':'Criando conta...'
  try {
    const user = mode==='login' ? await Auth.login(em,pw) : await Auth.register(nm,em,pw)
    await boot(user.uid)
  } catch(e) {
    const msgs={'auth/invalid-credential':'E-mail ou senha incorretos.','auth/email-already-in-use':'E-mail já cadastrado.','auth/weak-password':'Senha fraca (6+ caracteres).','auth/invalid-email':'E-mail inválido.','auth/user-not-found':'E-mail ou senha incorretos.','auth/wrong-password':'E-mail ou senha incorretos.','auth/too-many-requests':'Muitas tentativas. Aguarde.'}
    errEl.textContent=msgs[e.code]||e.message; errEl.style.display='block'
    btn.disabled=false; btn.textContent=mode==='login'?'Entrar':'Criar conta'
  }
}

// ═══════════════════════════════════════════════
// HOME
// ═══════════════════════════════════════════════
function renderHome() {
  const now=new Date(), u=S.user||{}
  $('g-title').innerHTML = `${greet()}, <strong style="color:var(--g)">${u.name?.split(' ')[0]||'Atleta'}</strong>`
  $('g-sub').textContent = `${dayNm(now)} · ${now.getDate()} de ${monNm(now)}`
  const thisM = S.history.filter(h=>{const d=new Date((h.date||'')+'T12:00:00');return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()})
  const totMin = thisM.reduce((a,h)=>a+(h.duration||0),0)
  $('s-month').textContent = thisM.length
  $('s-time').innerHTML    = `${Math.round(totMin/60)||0}<span class="stat-u">h</span>`
  $('s-streak').textContent = calcStreak()
  buildHeatmap()
  const todayPlan = S.plans.find(p=>p.day===dayNm(now))||S.plans[0]
  $('home-next').innerHTML = todayPlan ? buildWCard(todayPlan,true) : `<div class="empty" style="padding:32px 20px;"><div class="empty-ic">🏋️</div><div class="empty-t">Nenhuma ficha</div><div class="empty-s">Crie sua primeira ficha de treino!</div></div>`
  $('home-all').innerHTML  = S.plans.map(p=>buildWCard(p,false)).join('') || `<div style="color:var(--t4);font-size:13px;padding:0 20px 8px;">Nenhuma ficha criada ainda.</div>`
}

function calcStreak() {
  if(!S.history.length)return 0
  const days=[...new Set(S.history.map(h=>h.date))].sort().reverse()
  let streak=0,check=new Date();check.setHours(0,0,0,0)
  for(const day of days){const d=new Date(day+'T12:00:00');d.setHours(0,0,0,0);if(Math.round((check-d)/86400000)>1)break;streak++;check=d}
  return streak
}

function buildHeatmap() {
  const el=$('hm-grid'); if(!el)return
  const now=new Date(), days=new Date(now.getFullYear(),now.getMonth()+1,0).getDate()
  const trained=new Set(S.history.filter(h=>{const d=new Date((h.date||'')+'T12:00:00');return d.getMonth()===now.getMonth()}).map(h=>new Date((h.date||'')+'T12:00:00').getDate()))
  el.innerHTML=Array.from({length:days},(_,i)=>{const d=i+1;return`<div class="hc ${trained.has(d)?'l3':''}${d===now.getDate()?' today':''}" title="Dia ${d}"></div>`}).join('')
  $('hm-lbl').textContent = monNm(now).charAt(0).toUpperCase()+monNm(now).slice(1)
}

function buildWCard(plan, isToday) {
  const exs=plan.exercises||[], chips=exs.slice(0,4).map(e=>`<span class="chip">${e.name}</span>`).join(''), more=exs.length>4?`<span class="chip">+${exs.length-4}</span>`:'', totS=exs.reduce((a,e)=>a+(e.sets||0),0), ci=COLORS[S.plans.indexOf(plan)%COLORS.length]||'c0', wt=plan.workoutType||'musculacao'
  return `<div class="wcard"><div class="wcard-accent ${ci}"></div><div class="wcard-body"><div class="wcard-top"><div class="wcard-name">${plan.name}</div><div class="wcard-day${isToday?' now':''}">${isToday?'Hoje':plan.day}</div></div><div class="wcard-meta"><span class="type-pill ${wt==='musculacao'?'musc':wt==='cardio'?'card':'hiit'}">${typeL(wt)}</span><span class="wcard-meta-txt">${exs.length} exercícios${totS?` · ${totS} séries`:''}</span></div><div class="chip-row">${chips}${more}</div></div><div class="wcard-foot"><span class="wcard-hint">~50–60 min</span><div class="wcard-btns"><button class="sb sb-r" onclick="event.stopPropagation();delPlan('${plan.id}')">excluir</button><button class="sb sb-d" onclick="event.stopPropagation();openEditPlan('${plan.id}')">editar</button><button class="sb sb-g" onclick="event.stopPropagation();openPreSession('${plan.id}')">iniciar</button></div></div></div>`
}
window.delPlan = async id => {
  if(!confirm('Excluir esta ficha permanentemente?'))return
  try{await DB.deletePlan(S.user.uid,id);S.plans=S.plans.filter(p=>p.id!==id);renderPlans();renderHome();toast('Ficha excluída','ok')}catch(e){toast(e.message,'err')}
}

// ═══════════════════════════════════════════════
// PLANS
// ═══════════════════════════════════════════════
function renderPlans() {
  $('plans-ct').textContent=`${S.plans.length} ficha${S.plans.length!==1?'s':''}`
  const el=$('plans-list')
  el.innerHTML = S.plans.length ? `<div class="wc-list">${S.plans.map(p=>buildWCard(p,false)).join('')}</div>` : `<div class="empty"><div class="empty-ic">📋</div><div class="empty-t">Nenhuma ficha</div><div class="empty-s">Crie sua primeira ficha de treino!</div></div>`
}

// ── New plan ─────────────────────────────────────
function npSetMuscle(v) { S.npMuscle=v; buildNpMuChips(); renderNpPicker() }
function buildNpMuChips() {
  const el=$('np-mf'); if(!el)return
  el.innerHTML=MUSCLES.map(m=>`<button class="mu-chip${S.npMuscle===m?' on':''}" type="button" data-m="${m}">${m}</button>`).join('')
  el.querySelectorAll('.mu-chip').forEach(btn=>{ btn.onclick=()=>npSetMuscle(btn.dataset.m) })
}
function openNewPlan() {
  S.npSel=[]; S.npMuscle='Todos'
  $('np-name').value=''; $('np-day').value='Segunda'; $('np-type').value='musculacao'
  buildNpMuChips(); renderNpPicker(); renderNpPills()
  openModal('ov-newplan')
}
window.openNewPlan = openNewPlan

function renderNpPicker() {
  const q=($('np-srch')?.value||'').toLowerCase(), sel=new Set(S.npSel.map(e=>e.id))
  $('np-pk').innerHTML = allEx().filter(e=>(S.npMuscle==='Todos'||e.muscle===S.npMuscle||(S.npMuscle==='Personalizado'&&e.custom))&&(e.name.toLowerCase().includes(q)||e.muscle.toLowerCase().includes(q))).map(e=>`<div class="pk-item${sel.has(e.id)?' sel':''}" data-id="${e.id}"><div><div class="pk-nm">${e.name}${e.custom?'<span class="custom-tag">custom</span>':''}</div><div class="pk-mu">${e.muscle}</div></div><span class="pk-ck">✓</span></div>`).join('')
  $('np-pk').querySelectorAll('.pk-item').forEach(el=>{el.onclick=()=>{toggleNpEx(el.dataset.id)}})
  // Attach search input
  const npSrch=$('np-srch'); if(npSrch && !npSrch._bound){npSrch._bound=true;npSrch.oninput=()=>renderNpPicker()}
}
function toggleNpEx(id){const ex=allEx().find(e=>e.id===id);if(!ex)return;const idx=S.npSel.findIndex(e=>e.id===id);if(idx>-1)S.npSel.splice(idx,1);else S.npSel.push({...ex,sets:3,reps:'10-12',lastWeight:0});renderNpPicker();renderNpPills()}
function renderNpPills(){$('np-pills').innerHTML=S.npSel.map(e=>`<span class="sel-pill">${e.name}</span>`).join('')}

window.savePlan = async()=>{
  const name=$('np-name').value.trim()
  if(!name){toast('Digite o nome da ficha','err');return}
  if(!S.npSel.length){toast('Adicione ao menos um exercício','err');return}
  const btn=$('np-btn');btn.disabled=true;btn.textContent='Salvando...'
  try{
    const plan=await DB.addPlan(S.user.uid,{name,day:$('np-day').value,workoutType:$('np-type').value,color:COLORS[S.plans.length%COLORS.length],exercises:S.npSel.map(e=>({id:e.id,name:e.name,muscle:e.muscle,type:e.type,sets:e.sets||3,reps:e.reps||'10-12',lastWeight:0}))})
    S.plans.push(plan);closeModal('ov-newplan');renderPlans();renderHome();toast('Ficha criada! 💪','ok')
  }catch(e){toast(e.message,'err')}finally{btn.disabled=false;btn.textContent='Salvar ficha'}
}

// ── Edit plan ─────────────────────────────────────
function epSetMuscle(v) { S.epMuscle=v; buildEpMuChips(); renderEpPicker() }
function buildEpMuChips() {
  const el=$('ep-mf'); if(!el)return
  el.innerHTML=MUSCLES.map(m=>`<button class="mu-chip${S.epMuscle===m?' on':''}" type="button" data-m="${m}">${m}</button>`).join('')
  el.querySelectorAll('.mu-chip').forEach(btn=>{ btn.onclick=()=>epSetMuscle(btn.dataset.m) })
}
function openEditPlan(planId) {
  const plan=S.plans.find(p=>p.id===planId);if(!plan)return
  S.epId=planId;S.epExs=(plan.exercises||[]).map(e=>({...e}));S.epMuscle='Todos'
  $('ep-id').value=planId;$('ep-name').value=plan.name;$('ep-day').value=plan.day;$('ep-type').value=plan.workoutType||'musculacao'
  renderEpExList(); buildEpMuChips(); renderEpPicker()
  openModal('ov-editplan')
}
window.openEditPlan = openEditPlan

function renderEpExList(){
  $('ep-ex-list').innerHTML=S.epExs.map((e,i)=>`<div class="edit-ex-row"><div class="eer-info"><div class="eer-nm">${e.name}${e.custom?'<span class="custom-tag">custom</span>':''}</div><div class="eer-mu">${e.muscle}</div></div>${e.type!=='cardio'&&e.type!=='hiit'?`<div style="display:flex;align-items:center;gap:4px;"><span style="font-size:10px;color:var(--t4);">séries</span><input class="eer-sets" type="number" value="${e.sets||3}" min="1" max="10" id="es-${i}"></div>`:`<span style="font-size:11px;color:var(--org);">${e.type}</span>`}<button class="eer-del" data-i="${i}">✕</button></div>`).join('')
  $('ep-ex-list').querySelectorAll('.eer-del').forEach(b=>{b.onclick=()=>{S.epExs.splice(parseInt(b.dataset.i),1);renderEpExList();renderEpPicker()}})
}
function renderEpPicker(){
  const q=($('ep-srch')?.value||'').toLowerCase(),cur=new Set(S.epExs.map(e=>e.id))
  $('ep-pk').innerHTML=allEx().filter(e=>(S.epMuscle==='Todos'||e.muscle===S.epMuscle||(S.epMuscle==='Personalizado'&&e.custom))&&(e.name.toLowerCase().includes(q)||e.muscle.toLowerCase().includes(q))).map(e=>`<div class="pk-item${cur.has(e.id)?' sel':''}" data-id="${e.id}"><div><div class="pk-nm">${e.name}${e.custom?'<span class="custom-tag">custom</span>':''}</div><div class="pk-mu">${e.muscle}</div></div><span class="pk-ck">✓</span></div>`).join('')
  $('ep-pk').querySelectorAll('.pk-item').forEach(el=>{el.onclick=()=>{const ex=allEx().find(e=>e.id===el.dataset.id);if(!ex)return;const idx=S.epExs.findIndex(e=>e.id===el.dataset.id);if(idx>-1)S.epExs.splice(idx,1);else S.epExs.push({...ex,sets:3,reps:'10-12',lastWeight:0});renderEpExList();renderEpPicker()}})
  // Attach search input
  const epSrch=$('ep-srch'); if(epSrch && !epSrch._bound){epSrch._bound=true;epSrch.oninput=()=>renderEpPicker()}
}
window.saveEditPlan = async()=>{
  const name=$('ep-name').value.trim()
  if(!name){toast('Digite o nome','err');return}
  if(!S.epExs.length){toast('Adicione ao menos um exercício','err');return}
  S.epExs.forEach((_,i)=>{const inp=$(`es-${i}`);if(inp)S.epExs[i].sets=parseInt(inp.value)||3})
  const btn=$('ep-btn');btn.disabled=true;btn.textContent='Salvando...'
  try{
    const upd={name,day:$('ep-day').value,workoutType:$('ep-type').value,exercises:S.epExs}
    await DB.updatePlan(S.user.uid,S.epId,upd)
    const idx=S.plans.findIndex(p=>p.id===S.epId);if(idx>-1)S.plans[idx]={...S.plans[idx],...upd}
    closeModal('ov-editplan');renderPlans();renderHome();toast('Ficha atualizada! ✨','ok')
  }catch(e){toast(e.message,'err')}finally{btn.disabled=false;btn.textContent='Salvar alterações'}
}

// ── Custom exercises ──────────────────────────────
function openCustomEx(){renderCustomExList();openModal('ov-customex')}
window.openCustomEx = openCustomEx
function renderCustomExList(){
  $('cx-list').innerHTML=!S.customEx.length?`<div style="text-align:center;padding:16px;font-size:13px;color:var(--t4);">Nenhum exercício personalizado ainda.</div>`:S.customEx.map(e=>`<div class="edit-ex-row"><div class="eer-info"><div class="eer-nm">${e.name}</div><div class="eer-mu">${e.muscle} · ${typeL(e.type)}</div></div><button class="eer-del" data-id="${e.id}">🗑</button></div>`).join('')
  $('cx-list').querySelectorAll('.eer-del').forEach(b=>{b.onclick=async()=>{if(!confirm('Excluir?'))return;try{await DB.deleteCustomEx(S.user.uid,b.dataset.id);S.customEx=S.customEx.filter(e=>e.id!==b.dataset.id);renderCustomExList();toast('Removido','ok')}catch(e){toast(e.message,'err')}}})
}
window.saveCustomEx = async()=>{
  const name=$('cx-name').value.trim(), muscle=$('cx-muscle').value.trim()||'Personalizado', type=$('cx-type').value
  if(!name){toast('Digite o nome','err');return}
  const btn=$('cx-btn');btn.disabled=true;btn.textContent='Salvando...'
  try{const ex=await DB.addCustomEx(S.user.uid,{name,muscle,type});S.customEx.push(ex);$('cx-name').value='';renderCustomExList();toast(`"${name}" adicionado! 🎯`,'ok')}catch(e){toast(e.message,'err')}finally{btn.disabled=false;btn.textContent='+ Adicionar exercício'}
}

// ── Muscle chips helper ───────────────────────────
function renderMuChips(containerId, getF, setF) {
  const el=$(containerId); if(!el)return
  el.innerHTML=MUSCLES.map(m=>`<button class="mu-chip${getF()===m?' on':''}" type="button" data-m="${m}">${m}</button>`).join('')
  el.querySelectorAll('.mu-chip').forEach(btn=>{btn.onclick=()=>setF(btn.dataset.m)})
}

// ═══════════════════════════════════════════════
// SESSION
// ═══════════════════════════════════════════════
function openPreSession(planId) {
  const plan=S.plans.find(p=>p.id===planId);if(!plan)return
  const exs=plan.exercises||[],totS=exs.reduce((a,e)=>a+(e.sets||0),0),wt=plan.workoutType||'musculacao'
  $('sess-c').innerHTML=`<div class="pre-wrap"><div class="back-row"><div class="back-btn" id="pre-back">←</div><span class="back-label">Pronto para treinar?</span></div><div class="pre-name">${plan.name}</div><div class="pre-meta"><span class="type-pill ${wt==='musculacao'?'musc':wt==='cardio'?'card':'hiit'}">${typeL(wt)}</span><span>${plan.day}</span></div><div class="pre-stats"><div class="pre-stat"><div class="pre-stat-v">${exs.length}</div><div class="pre-stat-l">exercícios</div></div><div class="pre-stat"><div class="pre-stat-v">${totS||'—'}</div><div class="pre-stat-l">séries</div></div><div class="pre-stat"><div class="pre-stat-v">${S.restDur}s</div><div class="pre-stat-l">descanso</div></div></div><div class="pre-ex-list"><div class="pre-ex-h"><span>Exercícios</span><span>${exs.length} itens</span></div>${exs.map((e,i)=>`<div class="pre-ex-row"><div class="pre-ex-n">${String(i+1).padStart(2,'0')}</div><div class="pre-ex-name">${e.name}</div><div class="pre-ex-d">${e.type==='cardio'||e.type==='hiit'?'tempo/dist.':e.sets+'×'+e.reps}</div></div>`).join('')}</div><button class="btn btn-g" id="start-btn">▶ &nbsp;Iniciar treino</button></div>`
  $('pre-back').onclick=()=>nav('plans')
  $('start-btn').onclick=()=>startSession(planId)
  nav('session')
}
window.openPreSession = openPreSession

function startSession(planId) {
  const plan=S.plans.find(p=>p.id===planId);if(!plan)return
  S.session={plan,curIdx:0,sets:(plan.exercises||[]).map(ex=>ex.type==='cardio'||ex.type==='hiit'?[{dur:'',dist:'',cal:'',done:false}]:Array.from({length:ex.sets||3},(_,i)=>({num:i+1,kg:ex.lastWeight||'',reps:ex.reps?.split('-')[0]||'',done:false}))),startTime:Date.now()}
  S.timerSec=0;clearInterval(S.timerInt)
  S.timerInt=setInterval(()=>{S.timerSec++;const el=$('sess-timer');if(!el)return;el.textContent=String(Math.floor(S.timerSec/60)).padStart(2,'0')+':'+String(S.timerSec%60).padStart(2,'0')},1000)
  renderSession()
}

function renderSession(){
  if(!S.session)return
  const{plan,sets,curIdx}=S.session,exs=plan.exercises||[]
  const flat=sets.flat(),done=flat.filter(s=>s.done).length,tot=flat.length,pct=tot?Math.round(done/tot*100):0
  let html=`<div class="sess-hd"><div class="back-btn" id="sess-back">←</div><div class="sess-info"><div class="sess-nm">${plan.name}</div><div class="sess-sub">${exs.length} exercícios · ${plan.day}</div></div><div class="timer-chip" id="sess-timer">00:00</div></div><div class="prog-bar-wrap"><div class="prog-track"><div class="prog-fill" style="width:${pct}%"></div></div><div class="prog-lbl"><span>${done}/${tot} séries</span><span>${pct}%</span></div></div><div class="sess-body">`
  exs.forEach((ex,ei)=>{
    const isCur=ei===curIdx,isUp=ei>curIdx,exS=sets[ei],isC=ex.type==='cardio'||ex.type==='hiit'
    if(isC){
      const s=exS[0]
      html+=`<div class="cardio-card${isCur?' active':''}${isUp?' upcoming':''}"><div class="ex-card-hd"><div class="ex-card-nm">${ex.name}</div><span class="mu-tag" style="background:var(--od);color:var(--org);">${ex.type.toUpperCase()}</span></div><div class="ex-prev">${ex.muscle} · registre seus dados</div>${!isUp?`<div class="cardio-ins"><div class="cin-wrap"><span class="cin-lbl">Duração (min)</span><input class="cin" type="number" value="${s.dur||''}" placeholder="—" data-ei="${ei}" data-f="dur"></div><div class="cin-wrap"><span class="cin-lbl">Distância (km)</span><input class="cin" type="number" step="0.1" value="${s.dist||''}" placeholder="—" data-ei="${ei}" data-f="dist"></div><div class="cin-wrap"><span class="cin-lbl">Calorias</span><input class="cin" type="number" value="${s.cal||''}" placeholder="—" data-ei="${ei}" data-f="cal"></div></div><button class="btn ${s.done?'btn-g':'btn-og'}" style="padding:10px;margin-top:4px;" data-cardio-ei="${ei}">${s.done?'✓ Concluído':'Marcar como concluído'}</button>`:''}</div>`
    } else {
      html+=`<div class="ex-card${isCur?' active':''}${isUp?' upcoming':''}"><div class="ex-card-hd"><div class="ex-card-nm">${ex.name}</div><span class="mu-tag">${ex.muscle}</span></div><div class="ex-prev">${ex.sets}×${ex.reps}${ex.lastWeight>0?' · último: '+ex.lastWeight+'kg':''}</div>${!isUp?`<div class="sets-hd"><span>série</span><span>kg</span><span>reps</span><span></span></div>${exS.map((s,si)=>`<div class="set-row${s.done?' done':''}" data-ei="${ei}" data-si="${si}"><span class="set-n">${s.num}</span><input class="set-in" type="number" value="${s.kg}" placeholder="kg" data-ei="${ei}" data-si="${si}" data-f="kg"><input class="set-in" type="number" value="${s.reps}" placeholder="reps" data-ei="${ei}" data-si="${si}" data-f="reps"><button class="ck${s.done?' done':''}" data-ei="${ei}" data-si="${si}">${s.done?'✓':''}</button></div>`).join('')}<button class="add-set" data-add-ei="${ei}">+ série</button><div class="rest-banner" id="rb-${ei}"><span class="rest-lbl">Descanso</span><span class="rest-cnt" id="rc-${ei}">${S.restDur}</span><div class="rest-trk"><div class="rest-prg" id="rp-${ei}" style="width:100%"></div></div></div>`:''}</div>`
    }
  })
  html+=`</div><div style="padding:0 20px 4px;"><button class="btn btn-og" id="finish-btn">✓ Finalizar treino</button></div><div style="height:20px;"></div>`
  $('sess-c').innerHTML=html

  // Attach events after render
  $('sess-back').onclick=()=>{if(confirm('Abandonar o treino?')){clearInterval(S.timerInt);clearInterval(S.restInt);S.session=null;nav('home')}}
  $('finish-btn').onclick=finishSession
  document.querySelectorAll('.set-in').forEach(inp=>{inp.onchange=()=>{S.session.sets[+inp.dataset.ei][+inp.dataset.si][inp.dataset.f]=inp.value}})
  document.querySelectorAll('.ck').forEach(btn=>{btn.onclick=()=>checkSet(+btn.dataset.ei,+btn.dataset.si)})
  document.querySelectorAll('[data-add-ei]').forEach(btn=>{btn.onclick=()=>{const ei=+btn.dataset.addEi,ex=S.session.plan.exercises[ei],last=S.session.sets[ei].at(-1);S.session.sets[ei].push({num:S.session.sets[ei].length+1,kg:last?.kg||ex.lastWeight||'',reps:last?.reps||ex.reps?.split('-')[0]||'',done:false});renderSession()}})
  document.querySelectorAll('.cin').forEach(inp=>{inp.onchange=()=>{S.session.sets[+inp.dataset.ei][0][inp.dataset.f]=inp.value}})
  document.querySelectorAll('[data-cardio-ei]').forEach(btn=>{btn.onclick=()=>{const ei=+btn.dataset.cardioEi;S.session.sets[ei][0].done=!S.session.sets[ei][0].done;if(S.session.sets[ei][0].done){const nx=ei+1;if(nx<S.session.plan.exercises.length){S.session.curIdx=nx;toast('Próximo: '+S.session.plan.exercises[nx].name)}};renderSession()}})
}

function checkSet(ei,si){
  const s=S.session.sets[ei][si];s.done=!s.done
  if(s.done)startRest(ei)
  if(S.session.sets[ei].every(s=>s.done)&&ei===S.session.curIdx){const nx=ei+1;if(nx<S.session.plan.exercises.length){S.session.curIdx=nx;toast('Próximo: '+S.session.plan.exercises[nx].name)}}
  renderSession()
}

function startRest(ei){
  const b=$(`rb-${ei}`),c=$(`rc-${ei}`),p=$(`rp-${ei}`);if(!b)return
  b.classList.add('show');let t=S.restDur;clearInterval(S.restInt)
  S.restInt=setInterval(()=>{t--;if(c)c.textContent=t;if(p)p.style.width=`${(t/S.restDur)*100}%`;if(t<=0){clearInterval(S.restInt);b.classList.remove('show')}},1000)
}

async function finishSession(){
  const{plan,sets}=S.session,dur=Math.round(S.timerSec/60)||1
  const doneSets=sets.flat().filter(s=>s.done),totVol=doneSets.reduce((a,s)=>a+(parseFloat(s.kg)||0)*(parseInt(s.reps)||0),0)
  clearInterval(S.timerInt);clearInterval(S.restInt)
  const data={planId:plan.id,planName:plan.name,workoutType:plan.workoutType||'musculacao',duration:dur,exercises:(plan.exercises||[]).map((ex,i)=>{const exS=sets[i];if(ex.type==='cardio'||ex.type==='hiit'){const s=exS[0]||{};return{name:ex.name,type:ex.type,duration:s.dur||0,distance:s.dist||0,calories:s.cal||0}}return{name:ex.name,muscle:ex.muscle,sets:exS.filter(s=>s.done).length,maxWeight:Math.max(...exS.map(s=>parseFloat(s.kg)||0)),totalVol:exS.filter(s=>s.done).reduce((a,s)=>a+(parseFloat(s.kg)||0)*(parseInt(s.reps)||0),0)}})}
  const btn=$('finish-btn');if(btn){btn.disabled=true;btn.textContent='Salvando...'}
  try{
    const saved=await DB.addSession(S.user.uid,data);S.history.unshift({...data,id:saved.id,date:new Date().toISOString().split('T')[0]});S.session=null
    $('sess-c').innerHTML=`<div class="done-screen"><div class="done-em">🎉</div><div class="done-ttl">Treino <span>concluído!</span></div><div class="done-s">Salvo no seu histórico.</div><div class="done-stats"><div class="done-stat"><div class="done-v">${dur}</div><div class="done-l">min</div></div><div class="done-stat"><div class="done-v">${doneSets.length}</div><div class="done-l">séries</div></div><div class="done-stat"><div class="done-v">${Math.round(totVol/1000)||'—'}</div><div class="done-l">vol k</div></div></div><button class="btn btn-g" id="done-home-btn">Voltar ao início</button></div>`
    $('done-home-btn').onclick=()=>nav('home')
    toast('Treino salvo! 🏆','ok')
  }catch(e){toast('Erro: '+e.message,'err');if(btn){btn.disabled=false;btn.textContent='✓ Finalizar treino'}}
}

// ═══════════════════════════════════════════════
// HISTORY
// ═══════════════════════════════════════════════
function renderHistory(){
  const el=$('hist-list')
  if(!S.history.length){el.innerHTML=`<div class="empty"><div class="empty-ic">📅</div><div class="empty-t">Nenhum treino ainda</div><div class="empty-s">Complete seu primeiro treino!</div></div>`;return}
  el.innerHTML=S.history.map((h,i)=>{const totS=(h.exercises||[]).filter(e=>!e.type||e.type==='musculacao').reduce((a,e)=>a+(e.sets||0),0),totV=(h.exercises||[]).reduce((a,e)=>a+(e.totalVol||0),0),cItems=(h.exercises||[]).filter(e=>e.type==='cardio'||e.type==='hiit'),rows=(h.exercises||[]).map(e=>e.type==='cardio'||e.type==='hiit'?`<div class="hi-ex"><span class="hi-ex-n">${e.name}</span><span class="hi-ex-d">${e.duration||0}min${e.distance?` · ${e.distance}km`:''}</span></div>`:`<div class="hi-ex"><span class="hi-ex-n">${e.name}</span><span class="hi-ex-d">${e.sets}× · ${e.maxWeight}kg</span></div>`).join('');return`<div class="hi-card"><div class="hi-row1"><span class="hi-date">${fmtDate(h.date)}</span><span class="hi-dur">${h.duration}min</span></div><div class="hi-name">${h.planName}</div><div class="hi-sts">${totS?`<span class="hi-st">🏋️ ${totS} séries</span>`:''}${totV?`<span class="hi-st">📊 ${(totV/1000).toFixed(1)}k</span>`:''}${cItems.length?`<span class="hi-st">🏃 cardio</span>`:''}<span class="hi-st">⏱️ ${h.duration}min</span></div><div class="hi-det" id="hd-${i}">${rows}</div></div>`}).join('')
  el.querySelectorAll('.hi-card').forEach((card,i)=>{card.onclick=()=>$(`hd-${i}`)?.classList.toggle('open')})
}

// ═══════════════════════════════════════════════
// PROGRESS
// ═══════════════════════════════════════════════
function renderProgress(){
  const el=$('prog-c'),prs={}
  S.history.forEach(h=>(h.exercises||[]).forEach(e=>{if(!e.maxWeight)return;if(!prs[e.name]||e.maxWeight>prs[e.name].val)prs[e.name]={val:e.maxWeight,muscle:e.muscle||''}}))
  if(!S.plans.length&&!Object.keys(prs).length){el.innerHTML=`<div class="empty"><div class="empty-ic">📈</div><div class="empty-t">Sem dados</div><div class="empty-s">Complete treinos para ver sua evolução!</div></div>`;return}
  const planPills=S.plans.map((p,i)=>`<button class="pill${i===0?' on':''}" type="button" data-plan="${p.id}">${(p.name.split(' — ')[0]||p.name).substring(0,14)}</button>`).join('')
  const vols=weekVols(),maxV=Math.max(...vols.map(v=>v.vol),1)
  const volBars=vols.map((v,i)=>`<div class="vbar${i===vols.length-1?' hi':''}" style="height:${Math.round(v.vol/maxV*68)}px" title="${(v.vol/1000).toFixed(1)}k"></div>`).join('')
  const prRows=Object.entries(prs).slice(0,8).map(([n,pr])=>`<div class="pr-row"><div><div class="pr-nm">${n}</div><div class="pr-mu">${pr.muscle}</div></div><div class="pr-v">${pr.val}kg</div></div>`).join('')
  el.innerHTML=`<div class="prog-wrap-s"><div class="chart-box"><div class="ch-ttl">Evolução por ficha</div><div class="ch-sub">selecione uma ficha abaixo</div><div class="pill-row" id="plan-pills">${planPills}</div><div class="pill-row" id="ex-pills"></div><div style="position:relative;height:150px;margin-top:10px;"><canvas id="ev-chart"></canvas></div></div><div class="chart-box"><div class="ch-ttl">Volume semanal</div><div class="ch-sub">séries × reps × carga acumulados</div><div class="vol-chart">${volBars}</div><div class="vbar-lbl">${vols.map(v=>`<div class="vbl">${v.label}</div>`).join('')}</div></div>${prRows?`<div class="chart-box"><div class="ch-ttl">Records pessoais</div><div class="ch-sub" style="margin-bottom:6px;">melhor carga por exercício</div>${prRows}</div>`:''}</div>`

  $('plan-pills').querySelectorAll('.pill').forEach(btn=>{btn.onclick=()=>{$('plan-pills').querySelectorAll('.pill').forEach(b=>b.classList.remove('on'));btn.classList.add('on');selPlan(btn.dataset.plan)}})
  if(S.plans.length)selPlan(S.plans[0].id)
}

function weekVols(){const weeks=[],now=new Date();for(let i=7;i>=0;i--){const d=new Date(now);d.setDate(d.getDate()-i*7);const start=new Date(d);start.setDate(start.getDate()-6);const vol=S.history.filter(h=>{const hd=new Date((h.date||'')+'T12:00:00');return hd>=start&&hd<=d}).reduce((a,h)=>a+((h.exercises||[]).reduce((b,e)=>b+(e.totalVol||0),0)),0);weeks.push({label:`S${8-i}`,vol})}return weeks}

function selPlan(planId){
  const plan=S.plans.find(p=>p.id===planId);if(!plan)return
  const mEx=(plan.exercises||[]).filter(e=>e.type!=='cardio'&&e.type!=='hiit'),exPillsEl=$('ex-pills');if(!exPillsEl)return
  exPillsEl.innerHTML=mEx.map((e,i)=>`<button class="pill${i===0?' on':''}" type="button" data-ex="${e.name}">${e.name.split(' ')[0]}</button>`).join('')
  exPillsEl.querySelectorAll('.pill').forEach(btn=>{btn.onclick=()=>{exPillsEl.querySelectorAll('.pill').forEach(b=>b.classList.remove('on'));btn.classList.add('on');buildChart(btn.dataset.ex)}})
  if(mEx.length)buildChart(mEx[0].name)
}

function buildChart(exName){
  if(S.charts.line){S.charts.line.destroy();S.charts.line=null}
  const ctx=$('ev-chart');if(!ctx)return
  const byDate={};S.history.forEach(h=>(h.exercises||[]).forEach(e=>{if(e.name===exName&&e.maxWeight){const d=h.date||'';if(!byDate[d]||e.maxWeight>byDate[d])byDate[d]=e.maxWeight}}))
  const entries=Object.entries(byDate).sort((a,b)=>a[0].localeCompare(b[0])).slice(-8)
  const labels=entries.length?entries.map(([d])=>{const dt=new Date(d+'T12:00:00');return`${dt.getDate()}/${dt.getMonth()+1}`}):['S1','S2','S3','S4','S5','S6','S7','S8']
  const data=entries.length?entries.map(([,v])=>v):[0,0,0,0,0,0,0,0]
  if(typeof Chart==='undefined')return
  S.charts.line=new Chart(ctx,{type:'line',data:{labels,datasets:[{data,borderColor:'#39e07a',backgroundColor:'rgba(57,224,122,0.05)',pointBackgroundColor:'#39e07a',pointRadius:3,pointHoverRadius:5,tension:0.3,fill:true,borderWidth:1.5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:v=>`${v.raw}kg`}}},scales:{x:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#444',font:{size:10}}},y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#444',font:{size:10},callback:v=>`${v}kg`}}}}})
}

// ═══════════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════════
function renderProfile(){
  const u=S.user||{},bmi=u.weight&&u.height?(u.weight/Math.pow(u.height/100,2)).toFixed(1):'—',av=u.avatarUrl?`<img src="${u.avatarUrl}" alt="">`:(u.initials||'?')
  $('prof-c').innerHTML=`<div class="pf-wrap"><div class="pf-hero"><div class="pf-av-wrap"><div class="pf-av" id="pf-av-btn">${av}<div class="pf-av-ov">📷</div></div><div class="pf-cam-badge">📷</div><input type="file" id="pf-av-file" accept="image/*" style="display:none;"></div><div><div class="pf-name">${u.name||'—'}</div><div class="pf-goal">🎯 ${u.goal||'Hipertrofia'}</div></div><button class="pf-edit-btn" id="pf-edit-open">editar</button></div><div class="body-stats"><div class="bst"><div class="bst-v">${u.weight||'—'}<span class="bst-u"> kg</span></div><div class="bst-l">peso</div></div><div class="bst"><div class="bst-v">${u.height||'—'}<span class="bst-u"> cm</span></div><div class="bst-l">altura</div></div><div class="bst"><div class="bst-v">${bmi}</div><div class="bst-l">imc</div></div></div><div class="sec" style="padding-top:12px;">configurações</div><div class="settings-group"><div class="setting-row" style="flex-direction:column;align-items:flex-start;gap:10px;cursor:default;"><div style="display:flex;align-items:center;gap:10px;width:100%;"><div class="setting-ic">⏱️</div><div class="setting-info"><div class="setting-nm">Tempo de descanso</div></div></div><div class="rest-adj" style="width:100%;padding:0 2px;"><input type="range" class="rest-sl" id="rest-sl" min="15" max="180" step="15" value="${S.restDur}"><span class="rest-vl" id="rest-vl">${S.restDur}s</span></div></div><div class="setting-row" id="cx-open-btn"><div class="setting-ic">➕</div><div class="setting-info"><div class="setting-nm">Exercícios personalizados</div><div class="setting-ds">${S.customEx.length} criado${S.customEx.length!==1?'s':''}</div></div><span class="setting-r">›</span></div><div class="setting-row"><div class="setting-ic">📧</div><div class="setting-info"><div class="setting-nm">E-mail</div><div class="setting-ds">${u.email||'—'}</div></div></div><div class="setting-row" id="export-btn"><div class="setting-ic">💾</div><div class="setting-info"><div class="setting-nm">Exportar dados</div><div class="setting-ds">Baixar histórico em JSON</div></div><span class="setting-r">›</span></div><div class="setting-row" id="logout-btn"><div class="setting-ic">🚪</div><div class="setting-info"><div class="setting-nm">Sair</div><div class="setting-ds">Encerrar sessão</div></div><span class="setting-r">›</span></div></div><div style="text-align:center;padding:20px 0 8px;font-size:11px;color:var(--t4);">IronMode v3.0 · Firebase</div></div>`

  // Attach events after render
  const avBtn=$('pf-av-btn'), avFile=$('pf-av-file')
  avBtn.onclick  = () => avFile.click()
  avFile.onchange = async event => {
    const file=event.target.files[0]; if(!file)return
    const reader=new FileReader()
    reader.onload = async e => {
      try {
        toast('Enviando foto...','info')
        const url = await DB.uploadAvatar(S.user.uid, e.target.result)
        S.user.avatarUrl=url; updateAvBtn(); renderProfile()
        toast('Foto atualizada! 📸','ok')
      } catch(err) { toast('Erro: '+err.message,'err') }
    }
    reader.readAsDataURL(file)
  }
  $('pf-edit-open').onclick = () => {
    const u=S.user||{}
    $('pe-name').value=u.name||''; $('pe-w').value=u.weight||''; $('pe-h').value=u.height||''; $('pe-goal').value=u.goal||'Hipertrofia'
    openModal('ov-profile')
  }
  $('rest-sl').oninput = e => { S.restDur=parseInt(e.target.value); $('rest-vl').textContent=e.target.value+'s'; localStorage.setItem('im_rest',e.target.value) }
  $('cx-open-btn').onclick  = openCustomEx
  $('export-btn').onclick   = () => { const blob=new Blob([JSON.stringify({history:S.history,plans:S.plans},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='ironmode.json';a.click();toast('Exportado!','ok') }
  $('logout-btn').onclick   = async() => { try{await Auth.logout()}catch(_){}location.reload() }
}

window.savePfEdit = async() => {
  const name=$('pe-name').value.trim(); if(!name){toast('Digite seu nome','err');return}
  const btn=$('pe-btn');btn.disabled=true;btn.textContent='Salvando...'
  try{const data={name,initials:ini(name),weight:parseFloat($('pe-w').value)||null,height:parseFloat($('pe-h').value)||null,goal:$('pe-goal').value};await DB.updateUser(S.user.uid,data);S.user={...S.user,...data};updateAvBtn();closeModal('ov-profile');renderProfile();toast('Perfil atualizado!','ok')}catch(e){toast(e.message,'err')}finally{btn.disabled=false;btn.textContent='Salvar'}
}

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
Auth.onState(async user => {
  if(user) await boot(user.uid)
  else     showAuth('login')
})
