(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const e of i)if(e.type==="childList")for(const d of e.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&s(d)}).observe(document,{childList:!0,subtree:!0});function o(i){const e={};return i.integrity&&(e.integrity=i.integrity),i.referrerPolicy&&(e.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?e.credentials="include":i.crossOrigin==="anonymous"?e.credentials="omit":e.credentials="same-origin",e}function s(i){if(i.ep)return;i.ep=!0;const e=o(i);fetch(i.href,e)}})();const C="http://localhost:8000",k=()=>localStorage.getItem("ecm_token"),$=()=>localStorage.getItem("ecm_role"),A=()=>localStorage.getItem("ecm_user_name")||"Usuario",q=()=>!!k();function M(a,t){localStorage.setItem("ecm_token",a),localStorage.setItem("ecm_role",t)}function T(){localStorage.removeItem("ecm_token"),localStorage.removeItem("ecm_role"),localStorage.removeItem("ecm_user_name"),localStorage.removeItem("ecm_user_id")}async function g(a,t={}){const o={...t.headers||{}},s=k();s&&(o.Authorization=`Bearer ${s}`),t.body&&typeof t.body=="object"&&!(t.body instanceof FormData)&&!(t.body instanceof URLSearchParams)&&(o["Content-Type"]="application/json",t.body=JSON.stringify(t.body));const i=await fetch(`${C}${a}`,{...t,headers:o});if(i.status===401)throw T(),window.location.hash="#/login",new Error("Sesión expirada");if(!i.ok){const e=await i.json().catch(()=>({}));throw new Error(e.detail||`Error ${i.status}`)}return i.status===204?null:i.json()}const y={login(a,t){const o=new URLSearchParams({username:a,password:t});return g("/auth/login",{method:"POST",body:o,headers:{"Content-Type":"application/x-www-form-urlencoded"}})},register:a=>g("/auth/register",{method:"POST",body:a}),me:()=>g("/auth/me"),getDevices:(a={})=>g(`/devices/?${new URLSearchParams(a)}`),getDevice:a=>g(`/devices/${a}`),createDevice:a=>g("/devices/",{method:"POST",body:a}),updateDevice:(a,t)=>g(`/devices/${a}`,{method:"PATCH",body:t}),retireDevice:a=>g(`/devices/${a}`,{method:"DELETE"}),sendToRepair:a=>g(`/devices/${a}/send-to-repair`,{method:"POST"}),returnFromRepair:a=>g(`/devices/${a}/return-from-repair`,{method:"POST"}),getRequests:(a={})=>g(`/requests/?${new URLSearchParams(a)}`),getRequest:a=>g(`/requests/${a}`),createRequest:a=>g("/requests/",{method:"POST",body:a}),reviewRequest:(a,t)=>g(`/requests/${a}/review`,{method:"POST",body:t}),returnDevice:(a,t)=>g(`/requests/${a}/return`,{method:"POST",body:t}),checkOverdue:()=>g("/requests/check-overdue",{method:"POST"}),getStats:()=>g("/dashboard/stats"),getQueue:()=>g("/dashboard/queue"),getAuditLog:(a={})=>g(`/dashboard/audit-log?${new URLSearchParams(a)}`),previewScore:a=>g("/scoring/preview",{method:"POST",body:a}),getUsers:(a={})=>g(`/users/?${new URLSearchParams(a)}`),updateUser:(a,t)=>g(`/users/${a}`,{method:"PATCH",body:t})},L={success:"✓",error:"✕",info:"ℹ"};function b(a,t="success"){const o=document.getElementById("toast-container");if(!o)return;const s=document.createElement("div");s.className=`toast toast-${t}`,s.innerHTML=`
    <span class="toast-icon">${L[t]||L.info}</span>
    <span class="toast-msg">${a}</span>
  `,o.appendChild(s),requestAnimationFrame(()=>s.classList.add("show")),setTimeout(()=>{s.classList.remove("show"),setTimeout(()=>s.remove(),300)},3500)}function P(a){let t=!1;function o(){if(a.innerHTML=`
      <div class="login-page">
        <div class="login-left">
          <div class="login-branding">
            <img class="brand-logo" src="/img/escudo-ud.png" alt="Universidad Distrital" />
            <h1 class="brand-title">SmartCampus UD</h1>
            <p class="brand-subtitle">Gestión de Equipos y Conectividad para estudiantes de la Universidad Distrital</p>
            <p class="brand-uni">Universidad Distrital Francisco José de Caldas</p>
          </div>
        </div>
        <div class="login-right">
          <div class="login-form">
            <h2 class="login-title">${t?"Crear Cuenta":"Iniciar Sesión"}</h2>
            <p class="login-subtitle">${t?"Registra tus datos para acceder":"Ingresa a la plataforma ECM"}</p>
            <div id="login-error" class="login-error hidden"></div>
            <form id="auth-form">
              ${t?`
                <div class="form-group">
                  <label class="form-label">Nombre Completo</label>
                  <input class="form-input" id="reg-name" type="text" placeholder="Juan Ramírez" required minlength="2" />
                </div>`:""}
              <div class="form-group">
                <label class="form-label">Correo Electrónico</label>
                <input class="form-input" id="auth-email" type="email" placeholder="correo@udistrital.edu.co" required />
              </div>
              <div class="form-group">
                <label class="form-label">Contraseña</label>
                <input class="form-input" id="auth-pass" type="password" placeholder="••••••••" required minlength="6" />
              </div>
              ${t?`
                <div class="form-group">
                  <label class="form-label">Rol</label>
                  <select class="form-select" id="reg-role">
                    <option value="student">Estudiante</option>
                    <option value="admin">Administrador</option>
                    <option value="donor">Donante</option>
                  </select>
                </div>
                <div id="student-fields" class="student-fields">
                  <div class="form-group">
                    <label class="form-label">Índice de Vulnerabilidad</label>
                    <div class="slider-inline">
                      <input type="range" class="range-slider" id="reg-vi" min="0" max="1" step="0.01" value="0.5" />
                      <span class="slider-val" id="val-vi">0.50</span>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Carga Académica</label>
                    <div class="slider-inline">
                      <input type="range" class="range-slider" id="reg-al" min="0" max="1" step="0.01" value="0.5" />
                      <span class="slider-val" id="val-al">0.50</span>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Historial de Cumplimiento</label>
                    <div class="slider-inline">
                      <input type="range" class="range-slider" id="reg-ch" min="0" max="1" step="0.01" value="1.0" />
                      <span class="slider-val" id="val-ch">1.00</span>
                    </div>
                  </div>
                </div>`:""}
              <button type="submit" class="btn btn-primary w-full mt-2" id="auth-submit">
                ${t?"Registrarse":"Ingresar"}
              </button>
            </form>
            <div class="login-toggle">
              ${t?'¿Ya tienes cuenta? <button id="toggle-mode">Inicia sesión</button>':'¿No tienes cuenta? <button id="toggle-mode">Regístrate</button>'}
            </div>
          </div>
        </div>
      </div>`,document.getElementById("toggle-mode").addEventListener("click",()=>{t=!t,o()}),t){const s=document.getElementById("reg-role"),i=document.getElementById("student-fields");s.addEventListener("change",()=>{i.style.display=s.value==="student"?"block":"none"}),["vi","al","ch"].forEach(e=>{const d=document.getElementById(`reg-${e}`),n=document.getElementById(`val-${e}`);d&&n&&d.addEventListener("input",()=>{n.textContent=parseFloat(d.value).toFixed(2)})})}document.getElementById("auth-form").addEventListener("submit",async s=>{s.preventDefault();const i=document.getElementById("auth-submit"),e=document.getElementById("login-error");i.disabled=!0,i.textContent=t?"Registrando...":"Ingresando...",e.classList.add("hidden");try{if(t){const d=document.getElementById("reg-role").value,n={full_name:document.getElementById("reg-name").value,email:document.getElementById("auth-email").value,password:document.getElementById("auth-pass").value,role:d};d==="student"&&(n.vulnerability_index=parseFloat(document.getElementById("reg-vi").value),n.academic_load=parseFloat(document.getElementById("reg-al").value),n.compliance_history=parseFloat(document.getElementById("reg-ch").value)),await y.register(n),b("Cuenta creada exitosamente","success"),t=!1,o()}else{const d=document.getElementById("auth-email").value,n=document.getElementById("auth-pass").value,u=await y.login(d,n);M(u.access_token,u.role);const r=await y.me();localStorage.setItem("ecm_user_name",r.full_name),localStorage.setItem("ecm_user_id",r.id),window.location.hash="#"+(u.role==="student"?"/requests":"/dashboard")}}catch(d){e.textContent=d.message,e.classList.remove("hidden"),i.disabled=!1,i.textContent=t?"Registrarse":"Ingresar"}})}o()}function F(a){const t=$();if(a.innerHTML=`
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Resumen general de la plataforma</p>
      </div>
      ${t==="admin"?`<div class="page-actions">
        <button class="btn btn-secondary" id="btn-overdue">⚠️ Verificar Vencimientos</button>
      </div>`:""}
    </div>
    <div class="stats-grid" id="stats-grid">
      ${Array(9).fill('<div class="stat-card"><div class="skeleton" style="width:48px;height:48px"></div><div class="stat-info"><div class="skeleton" style="width:60px;height:24px;margin-bottom:6px"></div><div class="skeleton" style="width:100px;height:14px"></div></div></div>').join("")}
    </div>
    <div class="dashboard-row mt-3">
      <div class="card" id="recovery-card">
        <div class="card-header"><span class="card-title">Tasa de Recuperación</span></div>
        <div class="recovery-gauge"><div class="skeleton" style="width:130px;height:130px;border-radius:50%"></div></div>
      </div>
      ${t==="admin"?`<div class="card" id="queue-card">
        <div class="card-header"><span class="card-title">Cola de Prioridad</span></div>
        <div id="queue-content"><div class="skeleton" style="height:200px"></div></div>
      </div>`:"<div></div>"}
    </div>`,o(),t==="admin"){s();const i=document.getElementById("btn-overdue");i&&i.addEventListener("click",async()=>{try{const e=await y.checkOverdue();b(`${e.count} solicitud(es) vencida(s) detectada(s)`,e.count>0?"info":"success"),o()}catch(e){b(e.message,"error")}})}async function o(){var i;try{const e=await y.getStats(),d=[{v:e.total_devices,l:"Total Dispositivos",c:"blue",i:"💻"},{v:e.available,l:"Disponibles",c:"green",i:"✅"},{v:e.assigned,l:"Asignados",c:"purple",i:"📦"},{v:e.in_repair,l:"En Reparación",c:"amber",i:"🔧"},{v:e.overdue,l:"Vencidos",c:"rose",i:"⚠️"},{v:e.pending_requests,l:"Solicitudes Pendientes",c:"amber",i:"📋"},{v:e.approved_requests,l:"Solicitudes Aprobadas",c:"green",i:"✓"},{v:e.academic_holds,l:"Retenciones Académicas",c:"rose",i:"🚫"},{v:e.total_students,l:"Total Estudiantes",c:"blue",i:"🎓"}];document.getElementById("stats-grid").innerHTML=d.map(v=>`
        <div class="stat-card ${v.c}">
          <div class="stat-icon">${v.i}</div>
          <div class="stat-info">
            <div class="stat-value">${v.v}</div>
            <div class="stat-label">${v.l}</div>
          </div>
        </div>`).join("");const n=e.recovery_rate,u=n>=80?"var(--accent-emerald)":n>=50?"var(--accent-amber)":"var(--accent-rose)";(i=document.getElementById("recovery-card").querySelector(".recovery-gauge, .skeleton"))==null||i.parentElement;const r=document.getElementById("recovery-card"),m=r.querySelector(".recovery-gauge")||r.querySelector(".card-body");if(r){const v=r.querySelector(".recovery-gauge");v&&(v.innerHTML=`
          <div class="gauge-ring" style="background: conic-gradient(${u} ${n*3.6}deg, var(--bg-tertiary) 0deg);">
            <div class="gauge-value">${n}%</div>
          </div>
          <div class="gauge-label">Devoluciones a tiempo</div>`)}}catch(e){b(e.message,"error")}}async function s(){try{const i=await y.getQueue(),e=document.getElementById("queue-content");if(!i.length){e.innerHTML='<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">No hay solicitudes pendientes</div></div>';return}e.innerHTML=`<div class="queue-list">${i.map(d=>{const n=d.priority_band==="High"?"priority-high":d.priority_band==="Medium"?"priority-medium":"priority-low";return`
          <div class="queue-item">
            <div class="queue-info">
              <div class="queue-name">${d.student_name}</div>
              <div class="queue-detail">${d.program} · Sem. ${d.semester}</div>
            </div>
            <div class="queue-score">
              <div class="queue-score-value ${n}">${(d.priority_score||0).toFixed(2)}</div>
              <div class="queue-band ${n}">${d.priority_band==="High"?"Alta":d.priority_band==="Medium"?"Media":"Baja"}</div>
            </div>
          </div>`}).join("")}</div>`}catch(i){b(i.message,"error")}}}const H={laptop:"💻",tablet:"📱",router:"📡"},S={available:{label:"Disponible",badge:"badge-success"},assigned:{label:"Asignado",badge:"badge-info"},in_repair:{label:"En Reparación",badge:"badge-warning"},overdue:{label:"Vencido",badge:"badge-danger"},retired:{label:"Retirado",badge:"badge-neutral"}};function U(a){const o=$()==="admin";a.innerHTML=`
    <div class="page-header">
      <div><h1 class="page-title">Dispositivos</h1><p class="page-subtitle">Inventario de equipos</p></div>
      ${o?'<div class="page-actions"><button class="btn btn-primary" id="btn-new-device">+ Nuevo Dispositivo</button></div>':""}
    </div>
    <div class="filter-bar">
      <div class="filter-group">
        <label>Estado:</label>
        <select class="form-select" id="filter-state" style="width:160px">
          <option value="">Todos</option>
          <option value="available">Disponible</option><option value="assigned">Asignado</option>
          <option value="in_repair">En Reparación</option><option value="overdue">Vencido</option>
          <option value="retired">Retirado</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Tipo:</label>
        <select class="form-select" id="filter-type" style="width:140px">
          <option value="">Todos</option>
          <option value="laptop">Laptop</option><option value="tablet">Tablet</option><option value="router">Router</option>
        </select>
      </div>
    </div>
    <div id="device-list" class="device-grid">
      ${Array(6).fill('<div class="device-card"><div class="skeleton" style="height:160px"></div></div>').join("")}
    </div>
    <div id="modal-container"></div>`;const s=document.getElementById("filter-state"),i=document.getElementById("filter-type");s.addEventListener("change",e),i.addEventListener("change",e),o&&document.getElementById("btn-new-device").addEventListener("click",()=>d()),e();async function e(){const r={};s.value&&(r.state=s.value),i.value&&(r.device_type=i.value);try{const m=await y.getDevices(r),v=document.getElementById("device-list");if(!m.length){v.innerHTML='<div class="empty-state"><div class="empty-icon">📦</div><div class="empty-text">No se encontraron dispositivos</div></div>';return}v.innerHTML=m.map(l=>{const p=S[l.state]||S.available,c=Math.round(l.condition*100),h=l.condition>.7?"var(--accent-emerald)":l.condition>.3?"var(--accent-amber)":"var(--accent-rose)";let E="";if(o){const I=[];l.state!=="retired"&&I.push(`<button class="btn btn-ghost btn-sm" data-edit="${l.id}">✏️</button>`),l.state==="available"&&(I.push(`<button class="btn btn-ghost btn-sm" data-repair="${l.id}" title="Enviar a reparación">🔧</button>`),I.push(`<button class="btn btn-ghost btn-sm" data-retire="${l.id}" title="Retirar">🗑️</button>`)),l.state==="in_repair"&&I.push(`<button class="btn btn-ghost btn-sm" data-return-repair="${l.id}" title="Retornar de reparación">🔄</button>`),E=`<div class="device-actions">${I.join("")}</div>`}return`
          <div class="device-card">
            <div class="device-icon">${H[l.device_type]||"💻"}</div>
            <div class="device-name">${l.name}</div>
            <div class="device-serial">${l.serial_number}</div>
            <div class="device-meta">
              <span class="badge ${p.badge}">${p.label}</span>
              <span class="badge ${l.origin==="donated"?"badge-purple":"badge-info"}">${l.origin==="donated"?"Donado":"Propio"}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:0.78rem;color:var(--text-secondary)">
              <span>Condición</span><span style="font-weight:600;color:${h}">${c}%</span>
            </div>
            <div class="condition-bar"><div class="condition-fill" style="width:${c}%;background:${h}"></div></div>
            ${E}
          </div>`}).join(""),o&&(v.querySelectorAll("[data-edit]").forEach(l=>l.addEventListener("click",()=>n(m.find(p=>p.id==l.dataset.edit)))),v.querySelectorAll("[data-repair]").forEach(l=>l.addEventListener("click",async()=>{try{await y.sendToRepair(l.dataset.repair),b("Enviado a reparación","success"),e()}catch(p){b(p.message,"error")}})),v.querySelectorAll("[data-retire]").forEach(l=>l.addEventListener("click",async()=>{if(confirm("¿Retirar este dispositivo?"))try{await y.retireDevice(l.dataset.retire),b("Dispositivo retirado","success"),e()}catch(p){b(p.message,"error")}})),v.querySelectorAll("[data-return-repair]").forEach(l=>l.addEventListener("click",async()=>{try{await y.returnFromRepair(l.dataset.returnRepair),b("Retornado de reparación","success"),e()}catch(p){b(p.message,"error")}})))}catch(m){b(m.message,"error")}}function d(){u("Nuevo Dispositivo",`
      <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="m-name" required /></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Tipo</label>
          <select class="form-select" id="m-type"><option value="laptop">Laptop</option><option value="tablet">Tablet</option><option value="router">Router</option></select>
        </div>
        <div class="form-group"><label class="form-label">Origen</label>
          <select class="form-select" id="m-origin"><option value="owned">Propio</option><option value="donated">Donado</option></select>
        </div>
      </div>
      <div class="form-group"><label class="form-label">Número de Serie</label><input class="form-input" id="m-serial" required /></div>
      <div class="form-group"><label class="form-label">Condición</label>
        <div class="slider-inline"><input type="range" class="range-slider" id="m-cond" min="0" max="1" step="0.01" value="1" /><span class="slider-val" id="m-cond-val">1.00</span></div>
      </div>
      <div class="form-group"><label class="form-label">Notas</label><textarea class="form-textarea" id="m-notes" rows="2"></textarea></div>
    `,async()=>{const r={name:document.getElementById("m-name").value,device_type:document.getElementById("m-type").value,serial_number:document.getElementById("m-serial").value,origin:document.getElementById("m-origin").value,condition:parseFloat(document.getElementById("m-cond").value),notes:document.getElementById("m-notes").value||null};await y.createDevice(r),b("Dispositivo creado","success"),e()}),document.getElementById("m-cond").addEventListener("input",r=>{document.getElementById("m-cond-val").textContent=parseFloat(r.target.value).toFixed(2)})}function n(r){u("Editar Dispositivo",`
      <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="m-name" value="${r.name}" /></div>
      <div class="form-group"><label class="form-label">Condición</label>
        <div class="slider-inline"><input type="range" class="range-slider" id="m-cond" min="0" max="1" step="0.01" value="${r.condition}" /><span class="slider-val" id="m-cond-val">${r.condition.toFixed(2)}</span></div>
      </div>
      <div class="form-group"><label class="form-label">Notas</label><textarea class="form-textarea" id="m-notes" rows="2">${r.notes||""}</textarea></div>
    `,async()=>{await y.updateDevice(r.id,{name:document.getElementById("m-name").value,condition:parseFloat(document.getElementById("m-cond").value),notes:document.getElementById("m-notes").value||null}),b("Dispositivo actualizado","success"),e()}),document.getElementById("m-cond").addEventListener("input",m=>{document.getElementById("m-cond-val").textContent=parseFloat(m.target.value).toFixed(2)})}function u(r,m,v){const l=document.getElementById("modal-container");l.innerHTML=`
      <div class="modal-overlay active" id="modal-overlay">
        <div class="modal">
          <div class="modal-header"><span class="modal-title">${r}</span><button class="modal-close" id="modal-close">✕</button></div>
          <div class="modal-body">${m}</div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="modal-cancel">Cancelar</button>
            <button class="btn btn-primary" id="modal-save">Guardar</button>
          </div>
        </div>
      </div>`;const p=()=>{l.innerHTML=""};document.getElementById("modal-close").addEventListener("click",p),document.getElementById("modal-cancel").addEventListener("click",p),document.getElementById("modal-overlay").addEventListener("click",c=>{c.target.id==="modal-overlay"&&p()}),document.getElementById("modal-save").addEventListener("click",async()=>{try{await v(),p()}catch(c){b(c.message,"error")}})}}const _={pending:{label:"Pendiente",badge:"badge-warning"},approved:{label:"Aprobada",badge:"badge-success"},denied:{label:"Denegada",badge:"badge-danger"},returned:{label:"Devuelta",badge:"badge-purple"}};function w(a){return a?new Date(a).toLocaleDateString("es-CO",{day:"2-digit",month:"short",year:"numeric"}):"—"}function x(a){return a>=.7?"priority-high":a>=.45?"priority-medium":"priority-low"}function N(a){var u,r;const o=$()==="student";a.innerHTML=`
    <div class="page-header">
      <div><h1 class="page-title">${o?"Mis Solicitudes":"Solicitudes"}</h1>
           <p class="page-subtitle">${o?"Gestiona tus solicitudes de equipos":"Administra todas las solicitudes"}</p></div>
      ${o?'<div class="page-actions"><button class="btn btn-primary" id="btn-new-req">+ Nueva Solicitud</button></div>':""}
    </div>
    ${o?"":`<div class="filter-bar">
      <div class="filter-group"><label>Estado:</label>
        <select class="form-select" id="filter-status" style="width:160px">
          <option value="">Todos</option><option value="pending">Pendiente</option>
          <option value="approved">Aprobada</option><option value="denied">Denegada</option>
          <option value="returned">Devuelta</option>
        </select>
      </div>
    </div>`}
    <div id="req-list"></div>
    <div id="modal-container"></div>`,o?(u=document.getElementById("btn-new-req"))==null||u.addEventListener("click",i):(r=document.getElementById("filter-status"))==null||r.addEventListener("change",s),s();async function s(){var v;const m={};if(!o){const l=(v=document.getElementById("filter-status"))==null?void 0:v.value;l&&(m.status=l)}try{const l=await y.getRequests(m),p=document.getElementById("req-list");if(!l.length){p.innerHTML='<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">No hay solicitudes</div></div>';return}o?p.innerHTML=`<div class="request-cards">${l.map(c=>{const h=_[c.status]||_.pending;return`<div class="request-card">
            <div class="request-card-header">
              <span class="badge ${h.badge}">${h.label}</span>
              <span class="${x(c.priority_score||0)}" style="font-weight:700">${(c.priority_score||0).toFixed(2)}</span>
            </div>
            <div class="request-card-body">
              <p><strong>Programa:</strong> ${c.academic_program} · Sem. ${c.semester}</p>
              <p><strong>Motivo:</strong> ${c.reason}</p>
              ${c.admin_notes?`<p><strong>Notas admin:</strong> ${c.admin_notes}</p>`:""}
            </div>
            <div class="request-dates">
              <span>📅 Solicitado: ${w(c.requested_at)}</span>
              ${c.approved_at?`<span>✅ Aprobado: ${w(c.approved_at)}</span>`:""}
              ${c.due_date?`<span>⏰ Vence: ${w(c.due_date)}</span>`:""}
              ${c.returned_at?`<span>📦 Devuelto: ${w(c.returned_at)}</span>`:""}
            </div>
          </div>`}).join("")}</div>`:(p.innerHTML=`<div class="table-wrapper"><table class="data-table">
          <thead><tr><th>ID</th><th>Estado</th><th>Puntaje</th><th>Programa</th><th>Sem.</th><th>Fecha</th><th>Acciones</th></tr></thead>
          <tbody>${l.map(c=>{const h=_[c.status]||_.pending;let E="";return c.status==="pending"&&(E=`<button class="btn btn-sm btn-primary" data-review="${c.id}">Revisar</button>`),c.status==="approved"&&(E=`<button class="btn btn-sm btn-secondary" data-return="${c.id}">Devolución</button>`),`<tr>
              <td>#${c.id}</td>
              <td><span class="badge ${h.badge}">${h.label}</span></td>
              <td class="${x(c.priority_score||0)}" style="font-weight:700">${(c.priority_score||0).toFixed(2)}</td>
              <td>${c.academic_program}</td><td>${c.semester}</td>
              <td>${w(c.requested_at)}</td>
              <td class="actions">${E}</td>
            </tr>`}).join("")}</tbody>
        </table></div>`,p.querySelectorAll("[data-review]").forEach(c=>c.addEventListener("click",()=>e(c.dataset.review))),p.querySelectorAll("[data-return]").forEach(c=>c.addEventListener("click",()=>d(c.dataset.return))))}catch(l){b(l.message,"error")}}function i(){n("Nueva Solicitud",`
      <div class="form-group"><label class="form-label">Motivo (mín. 10 caracteres)</label><textarea class="form-textarea" id="m-reason" minlength="10" required></textarea></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Programa Académico</label><input class="form-input" id="m-program" required /></div>
        <div class="form-group"><label class="form-label">Semestre</label><input class="form-input" id="m-semester" type="number" min="1" max="12" required /></div>
      </div>
    `,async()=>{await y.createRequest({reason:document.getElementById("m-reason").value,academic_program:document.getElementById("m-program").value,semester:parseInt(document.getElementById("m-semester").value)}),b("Solicitud creada","success"),s()})}async function e(m){let v=[];try{v=await y.getDevices({state:"available"})}catch{}n("Revisar Solicitud #"+m,`
      <div class="form-group"><label class="form-label">Decisión</label>
        <select class="form-select" id="m-approved"><option value="true">✅ Aprobar</option><option value="false">❌ Denegar</option></select></div>
      <div id="approve-fields">
        <div class="form-group"><label class="form-label">Dispositivo</label>
          <select class="form-select" id="m-device">${v.map(l=>`<option value="${l.id}">${l.name} (${l.serial_number})</option>`).join("")}${v.length?"":'<option value="">Sin dispositivos disponibles</option>'}</select></div>
        <div class="form-group"><label class="form-label">Días de préstamo</label><input class="form-input" id="m-days" type="number" value="30" min="1" max="90" /></div>
      </div>
      <div class="form-group"><label class="form-label">Notas</label><textarea class="form-textarea" id="m-notes"></textarea></div>
    `,async()=>{var c;const l=document.getElementById("m-approved").value==="true",p={approved:l,admin_notes:document.getElementById("m-notes").value||null,loan_days:parseInt(((c=document.getElementById("m-days"))==null?void 0:c.value)||30)};l&&(p.device_id=parseInt(document.getElementById("m-device").value)),await y.reviewRequest(m,p),b(l?"Solicitud aprobada":"Solicitud denegada","success"),s()}),document.getElementById("m-approved").addEventListener("change",l=>{document.getElementById("approve-fields").style.display=l.target.value==="true"?"block":"none"})}function d(m){n("Registrar Devolución #"+m,`
      <div class="form-group"><label class="form-label">Condición del equipo</label>
        <div class="slider-inline"><input type="range" class="range-slider" id="m-cond" min="0" max="1" step="0.01" value="0.8" /><span class="slider-val" id="m-cond-val">0.80</span></div></div>
      <div class="form-group"><label class="form-label">Notas</label><textarea class="form-textarea" id="m-notes"></textarea></div>
    `,async()=>{await y.returnDevice(m,{device_condition:parseFloat(document.getElementById("m-cond").value),notes:document.getElementById("m-notes").value||null}),b("Devolución registrada","success"),s()}),document.getElementById("m-cond").addEventListener("input",v=>{document.getElementById("m-cond-val").textContent=parseFloat(v.target.value).toFixed(2)})}function n(m,v,l){const p=document.getElementById("modal-container");p.innerHTML=`<div class="modal-overlay active" id="modal-overlay"><div class="modal">
      <div class="modal-header"><span class="modal-title">${m}</span><button class="modal-close" id="modal-close">✕</button></div>
      <div class="modal-body">${v}</div>
      <div class="modal-footer"><button class="btn btn-secondary" id="modal-cancel">Cancelar</button><button class="btn btn-primary" id="modal-save">Confirmar</button></div>
    </div></div>`;const c=()=>{p.innerHTML=""};document.getElementById("modal-close").onclick=c,document.getElementById("modal-cancel").onclick=c,document.getElementById("modal-overlay").onclick=h=>{h.target.id==="modal-overlay"&&c()},document.getElementById("modal-save").onclick=async()=>{try{await l(),c()}catch(h){b(h.message,"error")}}}}const O={student:"badge-success",admin:"badge-info",donor:"badge-purple"},V={student:"Estudiante",admin:"Admin",donor:"Donante"};function j(a){a.innerHTML=`
    <div class="page-header">
      <div><h1 class="page-title">Usuarios</h1><p class="page-subtitle">Gestión de usuarios del sistema</p></div>
    </div>
    <div class="filter-bar">
      <div class="filter-group"><label>Rol:</label>
        <select class="form-select" id="filter-role" style="width:150px">
          <option value="">Todos</option><option value="student">Estudiante</option>
          <option value="admin">Admin</option><option value="donor">Donante</option>
        </select>
      </div>
    </div>
    <div id="users-table"></div>
    <div id="modal-container"></div>`,document.getElementById("filter-role").addEventListener("change",t),t();async function t(){const s={},i=document.getElementById("filter-role").value;i&&(s.role=i);try{const e=await y.getUsers(s),d=document.getElementById("users-table");if(!e.length){d.innerHTML='<div class="empty-state"><div class="empty-icon">👥</div><div class="empty-text">No se encontraron usuarios</div></div>';return}d.innerHTML=`<div class="table-wrapper"><table class="data-table">
        <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Retención</th><th>V-Index</th><th>Carga Ac.</th><th>Cumpl.</th><th>Acciones</th></tr></thead>
        <tbody>${e.map(n=>{const u=(r,m)=>`<div class="user-progress"><div class="progress-bar"><div class="progress-fill" style="width:${r*100}%;background:${m}"></div></div><span>${r.toFixed(2)}</span></div>`;return`<tr>
            <td style="font-weight:600">${n.full_name}</td>
            <td style="color:var(--text-secondary);font-size:0.8rem">${n.email}</td>
            <td><span class="badge ${O[n.role]}">${V[n.role]}</span></td>
            <td><span class="status-dot ${n.is_active?"active":"inactive"}"></span>${n.is_active?"Activo":"Inactivo"}</td>
            <td>${n.academic_hold?'<span class="badge badge-danger">⚠ Retención</span>':'<span class="badge badge-success">✓ Normal</span>'}</td>
            <td>${u(n.vulnerability_index,"var(--accent-blue)")}</td>
            <td>${u(n.academic_load,"var(--accent-purple)")}</td>
            <td>${u(n.compliance_history,"var(--accent-emerald)")}</td>
            <td><button class="btn btn-ghost btn-sm" data-edit="${n.id}">✏️ Editar</button></td>
          </tr>`}).join("")}</tbody>
      </table></div>`,d.querySelectorAll("[data-edit]").forEach(n=>n.addEventListener("click",()=>{const u=e.find(r=>r.id==n.dataset.edit);u&&o(u)}))}catch(e){b(e.message,"error")}}function o(s){const i=document.getElementById("modal-container");i.innerHTML=`<div class="modal-overlay active" id="modal-overlay"><div class="modal">
      <div class="modal-header"><span class="modal-title">Editar Usuario</span><button class="modal-close" id="modal-close">✕</button></div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="m-name" value="${s.full_name}" /></div>
        <div class="form-group"><label class="form-label">Índice de Vulnerabilidad</label>
          <div class="slider-inline"><input type="range" class="range-slider" id="m-vi" min="0" max="1" step="0.01" value="${s.vulnerability_index}" /><span class="slider-val" id="val-vi">${s.vulnerability_index.toFixed(2)}</span></div></div>
        <div class="form-group"><label class="form-label">Carga Académica</label>
          <div class="slider-inline"><input type="range" class="range-slider" id="m-al" min="0" max="1" step="0.01" value="${s.academic_load}" /><span class="slider-val" id="val-al">${s.academic_load.toFixed(2)}</span></div></div>
        <div class="form-group"><label class="form-label">Historial de Cumplimiento</label>
          <div class="slider-inline"><input type="range" class="range-slider" id="m-ch" min="0" max="1" step="0.01" value="${s.compliance_history}" /><span class="slider-val" id="val-ch">${s.compliance_history.toFixed(2)}</span></div></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Retención Académica</label>
            <label class="toggle-switch"><input type="checkbox" id="m-hold" ${s.academic_hold?"checked":""} /><span class="toggle-slider"></span></label></div>
          <div class="form-group"><label class="form-label">Activo</label>
            <label class="toggle-switch"><input type="checkbox" id="m-active" ${s.is_active?"checked":""} /><span class="toggle-slider"></span></label></div>
        </div>
      </div>
      <div class="modal-footer"><button class="btn btn-secondary" id="modal-cancel">Cancelar</button><button class="btn btn-primary" id="modal-save">Guardar</button></div>
    </div></div>`,["vi","al","ch"].forEach(d=>{const n=document.getElementById(`m-${d}`),u=document.getElementById(`val-${d}`);n&&u&&n.addEventListener("input",()=>{u.textContent=parseFloat(n.value).toFixed(2)})});const e=()=>{i.innerHTML=""};document.getElementById("modal-close").onclick=e,document.getElementById("modal-cancel").onclick=e,document.getElementById("modal-overlay").onclick=d=>{d.target.id==="modal-overlay"&&e()},document.getElementById("modal-save").onclick=async()=>{try{await y.updateUser(s.id,{full_name:document.getElementById("m-name").value,vulnerability_index:parseFloat(document.getElementById("m-vi").value),academic_load:parseFloat(document.getElementById("m-al").value),compliance_history:parseFloat(document.getElementById("m-ch").value),academic_hold:document.getElementById("m-hold").checked,is_active:document.getElementById("m-active").checked}),b("Usuario actualizado","success"),e(),t()}catch(d){b(d.message,"error")}}}}function G(a){a.innerHTML=`
    <div class="page-header">
      <div><h1 class="page-title">Simulador de Scoring</h1>
           <p class="page-subtitle">Calcula la prioridad de asignación de equipos</p></div>
    </div>
    <div class="scoring-layout">
      <div class="card">
        <div class="card-header"><span class="card-title">Parámetros</span></div>
        <div class="card-body">
          <div class="slider-group">
            <div class="slider-label"><span class="slider-name">Índice de Vulnerabilidad (V)</span><span class="slider-value" id="dv">0.50</span></div>
            <input type="range" class="range-slider" id="s-vi" min="0" max="1" step="0.01" value="0.5" />
            <div class="slider-weight">Peso: 50%</div>
          </div>
          <div class="slider-group">
            <div class="slider-label"><span class="slider-name">Carga Académica (A)</span><span class="slider-value" id="da">0.50</span></div>
            <input type="range" class="range-slider" id="s-al" min="0" max="1" step="0.01" value="0.5" />
            <div class="slider-weight">Peso: 30%</div>
          </div>
          <div class="slider-group">
            <div class="slider-label"><span class="slider-name">Historial de Cumplimiento (H)</span><span class="slider-value" id="dh">1.00</span></div>
            <input type="range" class="range-slider" id="s-ch" min="0" max="1" step="0.01" value="1.0" />
            <div class="slider-weight">Peso: 20%</div>
          </div>
          <button class="btn btn-primary w-full mt-2" id="btn-calc">Calcular Puntaje</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Resultado</span></div>
        <div id="score-result">
          <div class="score-display">
            <div class="score-big" id="score-num">—</div>
            <div class="score-band" id="score-band"></div>
          </div>
          <div class="breakdown-section" id="breakdown"></div>
          <div class="formula-display">S = (V × 0.5) + (A × 0.3) + (H × 0.2)</div>
        </div>
      </div>
    </div>`,[{id:"s-vi",display:"dv"},{id:"s-al",display:"da"},{id:"s-ch",display:"dh"}].forEach(({id:s,display:i})=>{const e=document.getElementById(s),d=document.getElementById(i);e.addEventListener("input",()=>{d.textContent=parseFloat(e.value).toFixed(2)})}),document.getElementById("btn-calc").addEventListener("click",o),o();async function o(){const s=parseFloat(document.getElementById("s-vi").value),i=parseFloat(document.getElementById("s-al").value),e=parseFloat(document.getElementById("s-ch").value);try{const d=await y.previewScore({vulnerability_index:s,academic_load:i,compliance_history:e}),n=d.priority_band,u=n==="High"?"high":n==="Medium"?"medium":"low",r=n==="High"?"Alta Prioridad":n==="Medium"?"Media Prioridad":"Baja Prioridad";document.getElementById("score-num").className=`score-big ${u}`,document.getElementById("score-num").textContent=d.score.toFixed(4),document.getElementById("score-band").className=`score-band ${u}`,document.getElementById("score-band").textContent=r;const m=d.breakdown;document.getElementById("breakdown").innerHTML=`
        <div class="breakdown-item">
          <span class="breakdown-label">Vulnerabilidad</span>
          <div class="breakdown-bar-track"><div class="breakdown-bar-fill" style="width:${m.vulnerability_contribution*100}%;background:var(--accent-blue)"></div></div>
          <span class="breakdown-value">${m.vulnerability_contribution.toFixed(4)}</span>
        </div>
        <div class="breakdown-item">
          <span class="breakdown-label">Carga Académica</span>
          <div class="breakdown-bar-track"><div class="breakdown-bar-fill" style="width:${m.academic_contribution*100}%;background:var(--accent-purple)"></div></div>
          <span class="breakdown-value">${m.academic_contribution.toFixed(4)}</span>
        </div>
        <div class="breakdown-item">
          <span class="breakdown-label">Cumplimiento</span>
          <div class="breakdown-bar-track"><div class="breakdown-bar-fill" style="width:${m.compliance_contribution*100}%;background:var(--accent-emerald)"></div></div>
          <span class="breakdown-value">${m.compliance_contribution.toFixed(4)}</span>
        </div>`}catch{const n=s*.5+i*.3+e*.2,u=n>=.7?"high":n>=.45?"medium":"low",r=u==="high"?"Alta Prioridad":u==="medium"?"Media Prioridad":"Baja Prioridad";document.getElementById("score-num").className=`score-big ${u}`,document.getElementById("score-num").textContent=n.toFixed(4),document.getElementById("score-band").className=`score-band ${u}`,document.getElementById("score-band").textContent=r,document.getElementById("breakdown").innerHTML=`
        <div class="breakdown-item"><span class="breakdown-label">Vulnerabilidad</span><div class="breakdown-bar-track"><div class="breakdown-bar-fill" style="width:${s*50}%;background:var(--accent-blue)"></div></div><span class="breakdown-value">${(s*.5).toFixed(4)}</span></div>
        <div class="breakdown-item"><span class="breakdown-label">Carga Académica</span><div class="breakdown-bar-track"><div class="breakdown-bar-fill" style="width:${i*30}%;background:var(--accent-purple)"></div></div><span class="breakdown-value">${(i*.3).toFixed(4)}</span></div>
        <div class="breakdown-item"><span class="breakdown-label">Cumplimiento</span><div class="breakdown-bar-track"><div class="breakdown-bar-fill" style="width:${e*20}%;background:var(--accent-emerald)"></div></div><span class="breakdown-value">${(e*.2).toFixed(4)}</span></div>`}}}const Q={LOGIN:"🔑",REGISTER:"👤",CREATE_REQUEST:"📋",APPROVE_REQUEST:"✅",DENY_REQUEST:"❌",CREATE_DEVICE:"💻",UPDATE_DEVICE:"✏️",RETIRE_DEVICE:"🗑️",SEND_TO_REPAIR:"🔧",RETURN_FROM_REPAIR:"🔄",RETURN_DEVICE:"📦",CHECK_OVERDUE:"⚠️",UPDATE_USER:"👥"},z={LOGIN:"Inicio de Sesión",REGISTER:"Registro",CREATE_REQUEST:"Crear Solicitud",APPROVE_REQUEST:"Aprobar Solicitud",DENY_REQUEST:"Denegar Solicitud",CREATE_DEVICE:"Crear Dispositivo",UPDATE_DEVICE:"Actualizar Dispositivo",RETIRE_DEVICE:"Retirar Dispositivo",SEND_TO_REPAIR:"Enviar a Reparación",RETURN_FROM_REPAIR:"Retorno de Reparación",RETURN_DEVICE:"Devolución de Dispositivo",CHECK_OVERDUE:"Verificar Vencimientos",UPDATE_USER:"Actualizar Usuario"};function J(a){let o=0;a.innerHTML=`
    <div class="page-header">
      <div><h1 class="page-title">Registro de Auditoría</h1>
           <p class="page-subtitle">Historial de acciones del sistema</p></div>
    </div>
    <div class="card">
      <div id="audit-list"><div class="skeleton" style="height:400px"></div></div>
      <div class="pagination" id="pagination"></div>
    </div>`,s();async function s(){var i,e;try{const d=await y.getAuditLog({skip:o,limit:30}),n=document.getElementById("audit-list");if(!d.length&&o===0){n.innerHTML='<div class="empty-state"><div class="empty-icon">📜</div><div class="empty-text">No hay registros de auditoría</div></div>',document.getElementById("pagination").innerHTML="";return}n.innerHTML=`<div class="audit-list">${d.map(r=>{const m=Q[r.action]||"📝",v=z[r.action]||r.action,l=[r.entity,r.entity_id?`#${r.entity_id}`:"",r.detail].filter(Boolean).join(" · "),p=r.timestamp?new Date(r.timestamp).toLocaleString("es-CO"):"";return`<div class="audit-entry">
          <div class="audit-icon">${m}</div>
          <div class="audit-content">
            <div class="audit-action">${v}</div>
            ${l?`<div class="audit-detail">${l}</div>`:""}
          </div>
          <div class="audit-time">${p}</div>
        </div>`}).join("")}</div>`;const u=Math.floor(o/30)+1;document.getElementById("pagination").innerHTML=`
        <button class="btn btn-secondary btn-sm" id="pg-prev" ${o===0?"disabled":""}>← Anterior</button>
        <span class="pagination-info">Página ${u}</span>
        <button class="btn btn-secondary btn-sm" id="pg-next" ${d.length<30?"disabled":""}>Siguiente →</button>`,(i=document.getElementById("pg-prev"))==null||i.addEventListener("click",()=>{o=Math.max(0,o-30),s()}),(e=document.getElementById("pg-next"))==null||e.addEventListener("click",()=>{o+=30,s()})}catch(d){b(d.message,"error")}}}const B={"/dashboard":{render:F,label:"Dashboard",icon:"📊",roles:["admin","donor"]},"/devices":{render:U,label:"Dispositivos",icon:"💻",roles:["admin","student","donor"]},"/requests":{render:N,label:"Solicitudes",icon:"📋",roles:["admin","student"]},"/users":{render:j,label:"Usuarios",icon:"👥",roles:["admin"]},"/scoring":{render:G,label:"Scoring",icon:"🧮",roles:["admin","student","donor"]},"/audit":{render:J,label:"Auditoría",icon:"📜",roles:["admin"]}};function R(a){return a==="admin"||a==="donor"?"/dashboard":"/requests"}function K(){return window.location.hash.slice(1)||""}function Y(){const a=document.getElementById("app"),t=$(),o=A(),s=o.charAt(0).toUpperCase(),i=Object.entries(B).filter(([,u])=>u.roles.includes(t)).map(([u,r])=>`
      <a href="#${u}" class="sidebar-link" data-path="${u}">
        <span class="sidebar-icon">${r.icon}</span>
        <span class="sidebar-label">${r.label}</span>
      </a>`).join("");a.innerHTML=`
    <div class="shell">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <img class="logo-img" src="/img/escudo-ud.png" alt="UD" />
            <span class="logo-text">SmartCampus UD</span>
          </div>
          <button class="sidebar-close" id="sidebar-close" aria-label="Cerrar menú">✕</button>
        </div>
        <nav class="sidebar-nav">${i}</nav>
        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="user-avatar">${s}</div>
            <div class="user-info">
              <span class="user-name">${o}</span>
              <span class="user-role badge badge-${t==="admin"?"info":t==="donor"?"purple":"success"}">${t}</span>
            </div>
          </div>
          <button class="btn-logout" id="btn-logout">
            <span>🚪</span><span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <div class="sidebar-overlay" id="sidebar-overlay"></div>

      <main class="main-content">
        <header class="topbar">
          <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Abrir menú">
            <span></span><span></span><span></span>
          </button>
          <div class="topbar-title" id="topbar-title"></div>
        </header>
        <div id="page-content" class="page-content"></div>
      </main>
    </div>`;const e=document.getElementById("sidebar"),d=document.getElementById("sidebar-overlay"),n=()=>{e.classList.remove("open"),d.classList.remove("active")};document.getElementById("mobile-menu-btn").onclick=()=>{e.classList.add("open"),d.classList.add("active")},document.getElementById("sidebar-close").onclick=n,d.onclick=n,document.querySelectorAll(".sidebar-link").forEach(u=>u.addEventListener("click",n)),document.getElementById("btn-logout").onclick=()=>{T(),window.location.hash="#/login"}}function W(a){document.querySelectorAll(".sidebar-link").forEach(s=>s.classList.toggle("active",s.dataset.path===a));const t=document.getElementById("topbar-title"),o=B[a];t&&o&&(t.textContent=o.label)}let f=null;function D(){const a=K();if(!q()){if(a!=="/login"){window.location.hash="#/login";return}return f&&(f(),f=null),P(document.getElementById("app"))}if(a==="/login"||a===""){window.location.hash="#"+R($());return}document.querySelector(".shell")||Y();const t=$(),o=B[a];if(!o||!o.roles.includes(t)){window.location.hash="#"+R(t);return}W(a);const s=document.getElementById("page-content");f&&(f(),f=null),s.classList.remove("fade-in"),s.offsetWidth,s.classList.add("fade-in"),f=o.render(s)||null}window.addEventListener("hashchange",D);window.addEventListener("DOMContentLoaded",D);
