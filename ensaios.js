// Modo de demonstração deliberado: não envia dados nem cria reservas reais.
const DEMO_MODE = true;
const demoEvent = {
  id:"preview-event", name:"Ensaio do Hormônios da Garoa", date:null, startTime:null,
  location:null, bookingOpen:true, goingCount:null,
  groups:[
    {id:"grupo-surdo-1",name:"Surdo de 1ª",active:true},
    {id:"grupo-surdo-2",name:"Surdo de 2ª",active:true},
    {id:"grupo-caixa",name:"Caixa",active:true},
    {id:"grupo-tamborim",name:"Tamborim",active:true},
    {id:"grupo-agogo",name:"Agogô",active:true}
  ],
  catalog:[
    {id:"inst-surdo-1",name:"Surdo de 1ª",type:"INSTRUMENT",groupIds:["grupo-surdo-1"],stock:{free:2}},
    {id:"inst-surdo-2",name:"Surdo de 2ª",type:"INSTRUMENT",groupIds:["grupo-surdo-2"],stock:{free:1}},
    {id:"inst-caixa",name:"Caixa",type:"INSTRUMENT",groupIds:["grupo-caixa"],stock:{free:3}},
    {id:"inst-tamborim",name:"Tamborim",type:"INSTRUMENT",groupIds:["grupo-tamborim"],stock:{free:4}},
    {id:"inst-agogo",name:"Agogô",type:"INSTRUMENT",groupIds:["grupo-agogo"],stock:{free:2}},
    {id:"acc-baqueta",name:"Baqueta",type:"ACCESSORY",groupIds:["grupo-surdo-1","grupo-surdo-2","grupo-caixa","grupo-tamborim","grupo-agogo"],stock:{free:6}},
    {id:"acc-talabarte",name:"Talabarte",type:"ACCESSORY",groupIds:["grupo-surdo-1","grupo-surdo-2","grupo-caixa"],stock:{free:3}},
    {id:"acc-correia",name:"Correia",type:"ACCESSORY",groupIds:["grupo-tamborim","grupo-agogo"],stock:{free:2}}
  ]
};
const state={event:demoEvent,selectedGroup:null,reservation:null};
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
function esc(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function setPanel(id){$$(".tab").forEach(b=>b.classList.toggle("active",b.dataset.panel===id));$$(".panel").forEach(p=>p.classList.toggle("active",p.id===id));}
$$(".tab").forEach(b=>b.addEventListener("click",()=>setPanel(b.dataset.panel)));
function instruments(){return state.event.groups.filter(g=>g.active).map(group=>({group,item:state.event.catalog.find(c=>c.type==="INSTRUMENT"&&c.groupIds.includes(group.id))})).filter(x=>x.item);}
function renderInstruments(){
  $("#instrument-list").innerHTML=instruments().map(({group,item})=>{
    const free=item.stock?.free??null;const sold=free===0;
    return '<article class="instrument-row"><div><h3>'+esc(group.name)+'</h3><small>Reserva vinculada ao grupo do ensaio</small></div><div class="stock '+(sold?'sold':'')+'">'+(free===null?'Disponibilidade livre':'<strong>'+esc(free)+'</strong>'+(free===1?'disponível':'disponíveis'))+'</div><button class="reserve-btn" data-group="'+esc(group.id)+'" '+(sold?'disabled':'')+'>'+(sold?'Esgotado':'Escolher →')+'</button></article>';
  }).join("");
  $$("#instrument-list [data-group]").forEach(b=>b.addEventListener("click",()=>openInstrument(b.dataset.group)));
}
function openInstrument(groupId){
  const group=state.event.groups.find(g=>g.id===groupId);if(!group)return;
  state.selectedGroup=group;
  $("#dialog-instrument-name").textContent=group.name;
  const accessories=state.event.catalog.filter(c=>c.type==="ACCESSORY"&&(!c.groupIds.length||c.groupIds.includes(groupId)));
  $("#dialog-accessories").innerHTML=accessories.length?'<p class="eyebrow">ACESSÓRIOS DISPONÍVEIS</p>'+accessories.map(a=>'<label class="accessory-choice"><input type="checkbox" value="'+esc(a.id)+'" '+((a.stock?.free??1)===0?'disabled':'')+'><span>'+esc(a.name)+' · '+(a.stock?.free??'livre')+' disponível(is)</span></label>').join(""):'<p class="form-note">Este instrumento não tem acessórios vinculados.</p>';
  $("#instrument-feedback").classList.add("hidden");
  $("#instrument-dialog").showModal();
}
$("#close-dialog").addEventListener("click",()=>$("#instrument-dialog").close());
$("#instrument-form").addEventListener("submit",e=>{
  e.preventDefault();if(!state.selectedGroup)return;
  if(!state.reservation){$("#instrument-feedback").textContent="Preencha primeiro sua confirmação de presença.";$("#instrument-feedback").classList.remove("hidden");return;}
  const chosen=$$("#dialog-accessories input:checked").map(x=>x.value);
  const names=chosen.map(id=>state.event.catalog.find(c=>c.id===id)?.name).filter(Boolean);
  state.reservation.groupId=state.selectedGroup.id;state.reservation.groupName=state.selectedGroup.name;state.reservation.supportIds=chosen;state.reservation.accessories=names;
  $("#instrument-dialog").close();renderMine();setPanel("mine");
});
$("#presence-form").addEventListener("submit",e=>{
  e.preventDefault();
  const answer=new FormData(e.currentTarget).get("answer");
  const email=$("#email").value.trim();const name=$("#name").value.trim();const pronoun=$("#pronoun").value.trim();
  if(!email||!name||!pronoun)return;
  if(answer==="nao-vou"){
    state.reservation={email,name,pronoun,answer,groupId:null,groupName:null,accessories:[],supportIds:[]};
  }else{
    state.reservation={email,name,pronoun,answer,groupId:null,groupName:null,accessories:[],supportIds:[]};
  }
  $("#presence-feedback").textContent="Resposta registrada nesta prévia. Nenhum dado foi enviado ao servidor.";
  $("#presence-feedback").classList.remove("hidden","error");
  renderMine();setPanel("mine");
});
function renderMine(){
  const r=state.reservation;
  if(!r){$("#my-reservation").innerHTML='<div class="empty-state">Você ainda não registrou uma reserva nesta prévia. Preencha a confirmação de presença para experimentar o fluxo.</div>';return;}
  $("#my-reservation").innerHTML='<article class="reservation-card"><div><p class="eyebrow">SUA RESPOSTA · PRÉVIA</p><h3>'+esc(r.name)+'</h3><p>'+esc(r.pronoun)+' · '+esc(r.email.replace(/^(.{2}).*(@.*)$/,"$1•••$2"))+'</p><p>'+(r.answer==="vou"?"Presença confirmada no exemplo":"Não vai conseguir participar")+'</p><p>'+(r.groupName?"Instrumento: "+esc(r.groupName):"Sem instrumento reservado")+'</p><p>'+(r.accessories.length?"Acessórios: "+esc(r.accessories.join(", ")):"")+'</p></div><div class="reservation-actions"><button class="secondary-btn" id="edit-reservation">Atualizar resposta</button><button class="secondary-btn" id="remove-instrument" '+(!r.groupId?'disabled':'')+'>Desfazer instrumento</button><button class="secondary-btn" id="cancel-attendance">Cancelar presença</button></div></article>';
  $("#edit-reservation").addEventListener("click",()=>setPanel("presence"));
  $("#remove-instrument").addEventListener("click",()=>{r.groupId=null;r.groupName=null;r.supportIds=[];r.accessories=[];renderMine();});
  $("#cancel-attendance").addEventListener("click",()=>{state.reservation=null;renderMine();setPanel("presence");});
}
// Contrato para ativação posterior, depois de configurar ambiente e validar o banco:
// GET /api/ensaio; GET /api/minhas-reservas;
// POST /api/reserva {email,name,pronoun,answer,groupId,supportIds,emailHash}.
async function api(path,options={}){const response=await fetch(path,{method:options.method||"GET",credentials:"same-origin",headers:options.body?{"Content-Type":"application/json"}:{},body:options.body?JSON.stringify(options.body):undefined});const data=response.status===204?null:await response.json().catch(()=>null);if(!response.ok)throw new Error(data?.message||"Falha na API ("+response.status+")");return data;}
renderInstruments();renderMine();