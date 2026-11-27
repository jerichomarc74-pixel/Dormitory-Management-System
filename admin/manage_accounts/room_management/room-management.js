(function(){
"use strict";
var KEY="lnu-rooms-v1",CAP=4,FLOORS=[1,2,3],PER=10;
var db={students:[],checks:{}},cur=null,open={"1":true};
var $=function(i){return document.getElementById(i)};
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function today(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function load(){try{var r=localStorage.getItem(KEY);if(r){var j=JSON.parse(r);db.students=Array.isArray(j.students)?j.students:[];db.checks=j.checks&&typeof j.checks==="object"?j.checks:{}}}catch(e){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){$("alert").hidden=false;$("alert").textContent="Changes could not be saved in this browser."}}
function rooms(){var a=[];FLOORS.forEach(function(f){for(var r=1;r<=PER;r++)a.push({k:f+"-"+r,f:f,r:r})});return a}
function occ(k){return db.students.filter(function(s){return s.room===k})}
function checked(k){return !!db.checks[k]&&db.checks[k].date===today()}
function badge(k){return checked(k)?'<span class="badge b-ok">Checked</span>':'<span class="badge b-warn">Unchecked</span>'}
function fmt(ts){return new Date(ts).toLocaleString([],{dateStyle:"medium",timeStyle:"short"})}
function summary(){var all=rooms(),c=all.filter(function(x){return checked(x.k)}).length;$("mc").textContent=c;$("mu").textContent=all.length-c;$("mt").textContent=all.length;$("mo").textContent=db.students.length}
function render(){
  summary();
  $("floors").innerHTML=FLOORS.map(function(f){
    var rs=rooms().filter(function(x){return x.f===f}),un=rs.filter(function(x){return !checked(x.k)}).length;
    return '<details class="floor" data-f="'+f+'"'+(open[f]?" open":"")+'><summary><h3>Floor '+f+'</h3><span class="sw"><span class="badge '+(un?"b-warn":"b-ok")+'">'+(un?un+" unchecked":"All checked")+'</span></span></summary><div class="tw"><table><caption class="sr" style="position:absolute;left:-9999px">Rooms on floor '+f+'</caption><thead><tr><th scope="col">Room</th><th scope="col">Occupants</th><th scope="col">Status</th><th scope="col"><span style="position:absolute;left:-9999px">Actions</span></th></tr></thead><tbody>'+
    rs.map(function(x){return '<tr><td><strong>Room '+x.r+'</strong></td><td>'+occ(x.k).length+' / '+CAP+'</td><td>'+badge(x.k)+'</td><td><button class="btn sm" type="button" data-v="'+x.k+'" aria-label="View floor '+x.f+' room '+x.r+'">View</button></td></tr>'}).join("")+
    '</tbody></table></div></details>'}).join("");
}
function fillDialog(){
  var k=cur,list=occ(k),c=db.checks[k],full=list.length>=CAP;
  $("dm").innerHTML=badge(k)+'<span>Occupants <strong>'+list.length+' / '+CAP+'</strong></span>'+(c?'<span>Last checked <strong>'+esc(fmt(c.at))+'</strong></span>':'<span>Never checked</span>');
  $("ds").innerHTML=list.length?'<ul class="occ">'+list.map(function(s){return '<li><span><strong>'+esc(s.name)+'</strong><small>'+esc(s.year)+' · ID '+esc(s.sid)+'</small></span><button class="rm" type="button" data-rm="'+esc(s.sid)+'" aria-label="Remove '+esc(s.name)+'">Remove</button></li>'}).join("")+'</ul>':'<p class="muted">No students live in this room yet.</p>';
  $("note").textContent=checked(k)?"This room has been checked today.":"Please click Check if room is clean.";
  $("chk").disabled=checked(k);$("chk").textContent=checked(k)?"Checked":"Check";
  $("addbtn").disabled=full;$("addbtn").textContent=full?"Room is full":"Add student";
}
function view(k){cur=k;var p=k.split("-");$("de").textContent="Floor "+p[0];$("dt").textContent="Room "+p[1];$("err").textContent="";$("af").reset();fillDialog();$("dlg").showModal()}
$("floors").addEventListener("click",function(e){var b=e.target.closest("[data-v]");if(b)view(b.dataset.v)});
$("floors").addEventListener("toggle",function(e){var d=e.target;if(d.dataset&&d.dataset.f)open[d.dataset.f]=d.open},true);
$("chk").onclick=function(){if(!cur||checked(cur))return;db.checks[cur]={date:today(),at:Date.now()};save();fillDialog();render()};
$("ds").addEventListener("click",function(e){var b=e.target.closest("[data-rm]");if(!b)return;db.students=db.students.filter(function(s){return !(s.room===cur&&s.sid===b.dataset.rm)});save();fillDialog();render()});
$("af").addEventListener("submit",function(e){
  e.preventDefault();var f=e.target,n=f.name.value.trim(),id=f.sid.value.trim(),er="";
  if(occ(cur).length>=CAP)er="This room is full.";
  else if(n.length<2||!/^[\p{L} .'-]+$/u.test(n))er="Enter the student’s full name using letters only.";
  else if(!/^[A-Za-z0-9-]{3,20}$/.test(id))er="Student ID must be 3 to 20 letters, numbers or dashes.";
  else if(db.students.some(function(s){return s.sid.toLowerCase()===id.toLowerCase()}))er="That student ID is already assigned to a room.";
  $("err").textContent=er;if(er)return;
  db.students.push({name:n,sid:id,year:f.year.value,room:cur});save();f.reset();fillDialog();render()});
$("dx").onclick=$("dc").onclick=function(){$("dlg").close()};
$("dlg").addEventListener("close",function(){cur=null});
$("refresh").onclick=function(){load();render()};
document.addEventListener("visibilitychange",function(){if(!document.hidden){load();render()}});
var th="dark";try{th=localStorage.getItem("lnu-theme")||"dark"}catch(e){}
document.documentElement.dataset.theme=th;
$("theme").onclick=function(){th=th==="dark"?"light":"dark";document.documentElement.dataset.theme=th;try{localStorage.setItem("lnu-theme",th)}catch(e){}};
load();render();
})();
