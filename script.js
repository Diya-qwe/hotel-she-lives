/* =====================================================================
   DATA LAYER — everything persisted to localStorage. No backend.
   ===================================================================== */
const DB = {
  get(key, fallback){ try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }catch(e){ return fallback; } },
  set(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
};
const KEYS = { USERS:'hm_users', ROOMS:'hm_rooms', BOOKINGS:'hm_bookings', SESSION:'hm_session', THEME:'hm_theme', DRAFT:'hm_draft' };

const ROOM_TYPES = [
  {id:'single', name:'Single Room', beds:'1 Bed', price:1800, icon:'🛏️', facilities:['Free WiFi','AC','City view','Work desk']},
  {id:'double', name:'Double Room', beds:'2 Beds', price:2800, icon:'🛌', facilities:['Free WiFi','AC','Mini fridge','Balcony']},
  {id:'deluxe', name:'Deluxe Room', beds:'King Bed', price:4000, icon:'🌟', facilities:['Free WiFi','AC','Bathtub','Lounge access']},
  {id:'family', name:'Family Room', beds:'3 Beds', price:5500, icon:'👨‍👩‍👧', facilities:['Free WiFi','AC','Kitchenette','Sofa bed']},
  {id:'suite', name:'Suite', beds:'King + Lounge', price:8000, icon:'👑', facilities:['Free WiFi','Jacuzzi','Butler service','Skyline view']},
];
const FLOORS = [1,2,3,4,5];
const ROOMS_PER_FLOOR = 8;
/* text */
function generateRooms(){
  let rooms = DB.get(KEYS.ROOMS, null);
  if(rooms) return rooms;
  rooms = [];
  FLOORS.forEach(floor=>{
    for(let i=1;i<=ROOMS_PER_FLOOR;i++){
      const num = floor*100 + i;
      const type = ROOM_TYPES[(floor+i) % ROOM_TYPES.length];
      const r = Math.random();
      const status = r < 0.35 ? 'booked' : (r < 0.45 ? 'maintenance' : 'available');
      rooms.push({number:num, floor, typeId:type.id, status});
    }
  });
  DB.set(KEYS.ROOMS, rooms);
  return rooms;
}

function seedSampleBookings(){
  let bookings = DB.get(KEYS.BOOKINGS, null);
  if(bookings) return bookings;
  const names = ['Rahul Menon','Divya Nair','Arjun Iyer','Kavya Pillai','Sameer Shaikh','Priya Suresh','Vikram Rao','Ishita Bose'];
  const services = ['Spa, Breakfast','Gym, Pool','Cab, Laundry','None','Party Hall','Airport Pickup','Extra Bed','Spa, Dinner'];
  bookings = names.map((name,i)=>{
    const type = ROOM_TYPES[i % ROOM_TYPES.length];
    const bill = type.price*2 + Math.floor(Math.random()*4000);
    return {
      id:'SEED'+(1000+i), userEmail:'seed'+i+'@demo.com', customerName:name,
      roomNumber:(i+1)*101, floor:(i%5)+1, roomType:type.name,
      checkIn:'2026-07-0'+(i%9+1), checkOut:'2026-07-1'+(i%9),
      services:services[i], totalBill:bill, paymentStatus: i%3===0?'Pending':'Paid',
      createdAt:Date.now()-i*90000000
    };
  });
  DB.set(KEYS.BOOKINGS, bookings);
  return bookings;
}

generateRooms();
seedSampleBookings();

/* =====================================================================
   THEME
   ===================================================================== */
function applyTheme(){
  const t = DB.get(KEYS.THEME, 'light');
  document.documentElement.setAttribute('data-theme', t);
}
function toggleTheme(){
  const cur = DB.get(KEYS.THEME, 'light');
  DB.set(KEYS.THEME, cur === 'light' ? 'dark' : 'light');
  applyTheme();
}
applyTheme();

/* =====================================================================
   AUTH
   ===================================================================== */
function setAuthTab(tab){
  document.getElementById('tabLogin').classList.toggle('active', tab==='login');
  document.getElementById('tabRegister').classList.toggle('active', tab==='register');
  document.getElementById('loginForm').classList.toggle('hidden', tab!=='login');
  document.getElementById('registerForm').classList.toggle('hidden', tab!=='register');
}

function handleRegister(e){
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const phone = document.getElementById('regPhone').value.trim();
  const role = document.getElementById('regRole').value;
  const pass = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirm').value;
  const errEl = document.getElementById('regError');
  errEl.classList.add('hidden');

  const users = DB.get(KEYS.USERS, []);
  if(pass !== confirm){ return showErr(errEl,'Passwords do not match.'); }
  if(pass.length < 4){ return showErr(errEl,'Password should be at least 4 characters.'); }
  if(users.find(u=>u.email===email)){ return showErr(errEl,'An account with this email already exists.'); }

  users.push({name, email, phone, role, password:pass});
  DB.set(KEYS.USERS, users);
  setAuthTab('login');
  document.getElementById('loginEmail').value = email;
  document.getElementById('loginRole').value = role;
  return false;
}

function handleLogin(e){
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass = document.getElementById('loginPassword').value;
  const role = document.getElementById('loginRole').value;
  const errEl = document.getElementById('loginError');
  errEl.classList.add('hidden');

  const users = DB.get(KEYS.USERS, []);
  const user = users.find(u=>u.email===email && u.password===pass && u.role===role);
  if(!user){ return showErr(errEl,'Invalid credentials or role for this account.'); }

  DB.set(KEYS.SESSION, {email:user.email, name:user.name, role:user.role});
  bootApp();
  return false;
}

function showErr(el, msg){ el.textContent = msg; el.classList.remove('hidden'); return false; }

function logout(){
  localStorage.removeItem(KEYS.SESSION);
  localStorage.removeItem(KEYS.DRAFT);
  document.getElementById('appShell').classList.remove('active');
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('billFab').classList.remove('show');
}

/* =====================================================================
   APP SHELL / NAV
   ===================================================================== */
const CUSTOMER_NAV = [
  {id:'dashboard', label:'Dashboard', icon:'🏛️'},
  {id:'book-dates', label:'Book a room', icon:'🗓️'},
  {id:'services', label:'Services', icon:'🛎️'},
  {id:'payment', label:'Payment', icon:'💳'},
  {id:'profile', label:'Profile', icon:'👤'},
  {id:'history', label:'Booking history', icon:'📜'},
  {id:'notifications', label:'Notifications', icon:'🔔'},
  {id:'faq', label:'FAQs', icon:'❓'},
  {id:'contact', label:'Contact hotel', icon:'📞'},
  {id:'settings', label:'Settings', icon:'⚙️'},
];
const ADMIN_NAV = [
  {id:'admin-dashboard', label:'Dashboard', icon:'📊'},
  {id:'admin-customers', label:'Customers', icon:'🧾'},
  {id:'admin-analytics', label:'Analytics', icon:'📈'},
  {id:'settings', label:'Settings', icon:'⚙️'},
];

let session = null;
let currentView = 'dashboard';

function bootApp(){
  session = DB.get(KEYS.SESSION, null);
  if(!session){ return; }
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('appShell').classList.add('active');
  document.getElementById('avatarInitial').textContent = session.name.charAt(0).toUpperCase();
  document.getElementById('userNameTag').textContent = session.name;
  document.getElementById('roleTag').textContent = session.role === 'admin' ? 'ADMIN PANEL' : 'CUSTOMER PANEL';
  renderNav();
  go(session.role === 'admin' ? 'admin-dashboard' : 'dashboard');
}

function renderNav(){
  const nav = session.role === 'admin' ? ADMIN_NAV : CUSTOMER_NAV;
  const el = document.getElementById('navLinks');
  el.innerHTML = nav.map(n=>`<button class="nav-link" data-nav="${n.id}" onclick="go('${n.id}')"><span class="ic">${n.icon}</span>${n.label}</button>`).join('');
}

function setActiveNav(view){
  document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active', b.dataset.nav===view));
}

const TITLES = {
  'dashboard':['Your dashboard','Everything about your stay, in one place'],
  'book-dates':['Book a room','Step 1 — choose your stay dates'],
  'book-types':['Choose a room type','Step 2 — pick what suits you'],
  'book-floors':['Choose a floor','Step 3 — select where you\'d like to stay'],
  'book-map':['Select your room','Step 4 — tap an available room on the plan'],
  'services':['Additional services','Spa, dining, travel and more — added instantly to your bill'],
  'payment':['Payment','This is a simulated payment — no real money moves'],
  'success':['Booking confirmed',''],
  'profile':['Your profile','Manage your personal details'],
  'history':['Booking history','Your past and current reservations'],
  'notifications':['Notifications','Updates about your stay'],
  'faq':['Frequently asked questions','Quick answers about your booking'],
  'contact':['Contact the hotel','We are here around the clock'],
  'settings':['Settings','Preferences for this device'],
  'admin-dashboard':['Admin dashboard','Live overview of the hotel'],
  'admin-customers':['Customer bookings','Search and manage every reservation'],
  'admin-analytics':['Booking analytics','Occupancy, services and revenue'],
};

function go(view){
  currentView = view;
  setActiveNav(view);
  const t = TITLES[view] || ['',''];
  document.getElementById('pageTitle').textContent = t[0];
  document.getElementById('pageSub').textContent = t[1];
  const root = document.getElementById('viewRoot');
  root.innerHTML = '';
  window.scrollTo(0,0);
  const renderers = {
    'dashboard':renderCustomerDashboard,'book-dates':renderBookDates,'book-types':renderBookTypes,
    'book-floors':renderBookFloors,'book-map':renderBookMap,'services':renderServices,'payment':renderPayment,
    'success':renderSuccess,'profile':renderProfile,'history':renderHistory,'notifications':renderNotifications,
    'faq':renderFaq,'contact':renderContact,'settings':renderSettings,
    'admin-dashboard':renderAdminDashboard,'admin-customers':renderAdminCustomers,'admin-analytics':renderAdminAnalytics,
  };
  (renderers[view] || renderCustomerDashboard)(root);
  updateBillFab();
}

/* =====================================================================
   BOOKING DRAFT (customer flow state)
   ===================================================================== */
function emptyDraft(){
  return { checkIn:'', checkOut:'', fromTime:'14:00', toTime:'11:00', typeId:null, floor:null, roomNumber:null,
    services:{ spa:[], party:null, cab:null, restaurant:{people:0,breakfast:0,lunch:0,dinner:0}, laundry:false,
      gym:false, pool:false, pet:{has:false, type:''}, extraBed:false, airportDrop:false, lateCheckout:false } };
}
function getDraft(){ return DB.get(KEYS.DRAFT, emptyDraft()); }
function saveDraft(d){ DB.set(KEYS.DRAFT, d); updateBillFab(); }

function roomTypeById(id){ return ROOM_TYPES.find(t=>t.id===id); }

function computeBill(draft){
  const lines = [];
  if(draft.typeId && draft.roomNumber){
    const t = roomTypeById(draft.typeId);
    const nights = nightsBetween(draft.checkIn, draft.checkOut) || 1;
    lines.push({label:`${t.name} (Room ${draft.roomNumber}) × ${nights} night${nights>1?'s':''}`, amount:t.price*nights});
  }
  const s = draft.services;
  const spaMap = {full:['Full Body Spa',2000], head:['Head Massage',800], steam:['Steam Bath',600]};
  (s.spa||[]).forEach(k=>{ if(spaMap[k]) lines.push({label:spaMap[k][0], amount:spaMap[k][1]}); });
  const partyMap = {birthday:['Birthday Decoration',5000], anniversary:['Anniversary Decoration',7000], conference:['Conference Hall',15000]};
  if(s.party && partyMap[s.party]) lines.push({label:partyMap[s.party][0], amount:partyMap[s.party][1]});
  const cabMap = {airport:['Airport Pickup',1200], railway:['Railway Pickup',800], city:['City Tour',2500]};
  if(s.cab && cabMap[s.cab]) lines.push({label:cabMap[s.cab][0], amount:cabMap[s.cab][1]});
  if(s.restaurant){
    const r = s.restaurant;
    if(r.breakfast>0) lines.push({label:`Breakfast × ${r.breakfast}`, amount:r.breakfast*250});
    if(r.lunch>0) lines.push({label:`Lunch × ${r.lunch}`, amount:r.lunch*450});
    if(r.dinner>0) lines.push({label:`Dinner × ${r.dinner}`, amount:r.dinner*500});
  }
  if(s.laundry) lines.push({label:'Laundry', amount:300});
  if(s.gym) lines.push({label:'Gym access', amount:500});
  if(s.pool) lines.push({label:'Swimming pool', amount:350});
  if(s.pet && s.pet.has) lines.push({label:`Pet care (${s.pet.type||'Pet'})`, amount:1500});
  if(s.extraBed) lines.push({label:'Extra bed', amount:700});
  if(s.airportDrop) lines.push({label:'Airport drop', amount:1200});
  if(s.lateCheckout) lines.push({label:'Late checkout', amount:1000});
  const subtotal = lines.reduce((a,l)=>a+l.amount,0);
  const tax = Math.round(subtotal*0.18);
  return {lines, subtotal, tax, total: subtotal+tax};
}
function nightsBetween(a,b){
  if(!a||!b) return 0;
  const d1=new Date(a), d2=new Date(b);
  const diff = Math.round((d2-d1)/(1000*60*60*24));
  return diff>0?diff:0;
}
function inr(n){ return '₹'+Math.round(n).toLocaleString('en-IN'); }

/* =====================================================================
   FLOATING BILL
   ===================================================================== */
function updateBillFab(){
  const fab = document.getElementById('billFab');
  if(!session || session.role !== 'customer'){ fab.classList.remove('show'); return; }
  const draft = getDraft();
  const bill = computeBill(draft);
  if(bill.total > 0){
    fab.classList.add('show');
    document.getElementById('billFabTotal').textContent = inr(bill.total);
  } else {
    fab.classList.remove('show');
  }
}
function openBill(){
  const draft = getDraft();
  const bill = computeBill(draft);
  const el = document.getElementById('billLines');
  if(bill.lines.length===0){
    el.innerHTML = '<p style="color:var(--text-soft); font-size:13.5px;">Nothing added yet — book a room or add a service to see your bill here.</p>';
  } else {
    el.innerHTML = bill.lines.map(l=>`<div class="bill-line"><span>${l.label}</span><span class="mono">${inr(l.amount)}</span></div>`).join('')
      + `<div class="bill-line"><span>Taxes (18%)</span><span class="mono">${inr(bill.tax)}</span></div>`
      + `<div class="bill-line total"><span>Grand total</span><span class="mono">${inr(bill.total)}</span></div>`;
  }
  document.getElementById('billPanel').classList.add('open');
  document.getElementById('overlay').classList.add('show');
}
function closeBill(){
  document.getElementById('billPanel').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}

/* =====================================================================
   CUSTOMER: DASHBOARD
   ===================================================================== */
function renderCustomerDashboard(root){
  const bookings = DB.get(KEYS.BOOKINGS, []).filter(b=>b.userEmail===session.email);
  const draft = getDraft();
  const hasDraftInProgress = draft.typeId || draft.checkIn;
  root.innerHTML = `
    <div class="grid-3" style="margin-bottom:22px;">
      <div class="card stat-card"><span class="stat-icon">🗓️</span><div class="stat-label">Confirmed stays</div><div class="stat-value">${bookings.length}</div></div>
      <div class="card stat-card"><span class="stat-icon">💰</span><div class="stat-label">Total spent</div><div class="stat-value">${inr(bookings.reduce((a,b)=>a+(b.totalBill||0),0))}</div></div>
      <div class="card stat-card"><span class="stat-icon">🛎️</span><div class="stat-label">Active draft bill</div><div class="stat-value">${inr(computeBill(draft).total)}</div></div>
    </div>
    <div class="card" style="margin-bottom:22px;">
      <div class="section-title"><span class="num">01</span> Continue where you left off</div>
      ${hasDraftInProgress ? `
        <p style="color:var(--text-soft); font-size:14px; margin-bottom:14px;">You have a room selection in progress. Review services or head straight to payment.</p>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="go('services')">Edit services &amp; bill</button>
          <button class="btn btn-outline" onclick="if(confirm('Discard your current room selection?')){ saveDraft(emptyDraft()); go('book-dates'); }">Start a fresh booking</button>
        </div>
      ` : `
        <p style="color:var(--text-soft); font-size:14px; margin-bottom:14px;">No room selected yet. Start a new booking below.</p>
        <button class="btn btn-primary" onclick="go('book-dates')">Book a room →</button>
      `}
    </div>
    <div class="card">
      <div class="section-title"><span class="num">02</span> Recent bookings</div>
      ${bookings.length ? renderMiniBookingTable(bookings.slice(-4).reverse()) : '<div class="empty-state">No bookings yet — your first stay is one click away.</div>'}
    </div>
  `;
}
function renderMiniBookingTable(rows){
  return `<table><thead><tr><th>Room</th><th>Check-in</th><th>Check-out</th><th>Services</th><th>Bill</th><th>Status</th></tr></thead><tbody>
    ${rows.map(b=>`<tr><td>${b.roomNumber} · Fl ${b.floor}</td><td>${b.checkIn}</td><td>${b.checkOut}</td><td>${b.services||'—'}</td><td class="mono">${inr(b.totalBill)}</td>
    <td><span class="badge ${b.paymentStatus==='Paid'?'badge-paid':'badge-pending'}">${b.paymentStatus}</span></td></tr>`).join('')}
  </tbody></table>`;
}

/* ---- Step 1: Dates ---- */
function renderBookDates(root){
  const draft = getDraft();
  root.innerHTML = `
    <div class="card" style="max-width:560px;">
      <div class="section-title"><span class="num">1/4</span> Select your stay</div>
      <div class="row2">
        <div class="field"><label>From date</label><input type="date" id="dCheckIn" value="${draft.checkIn}"></div>
        <div class="field"><label>To date</label><input type="date" id="dCheckOut" value="${draft.checkOut}"></div>
      </div>
      <div class="row2">
        <div class="field"><label>From time</label><input type="time" id="dFromTime" value="${draft.fromTime}"></div>
        <div class="field"><label>To time</label><input type="time" id="dToTime" value="${draft.toTime}"></div>
      </div>
      <div class="error-text hidden" id="dateErr"></div>
      <button class="btn btn-primary" onclick="submitDates()">Continue to room types →</button>
    </div>`;
}
function submitDates(){
  const checkIn = document.getElementById('dCheckIn').value;
  const checkOut = document.getElementById('dCheckOut').value;
  const fromTime = document.getElementById('dFromTime').value;
  const toTime = document.getElementById('dToTime').value;
  const errEl = document.getElementById('dateErr');
  if(!checkIn || !checkOut){ return showErr(errEl,'Please choose both dates.'); }
  if(new Date(checkOut) <= new Date(checkIn)){ return showErr(errEl,'Check-out must be after check-in.'); }
  const draft = getDraft();
  Object.assign(draft, {checkIn, checkOut, fromTime, toTime});
  saveDraft(draft);
  go('book-types');
}

/* ---- Step 2: Room types ---- */
function renderBookTypes(root){
  root.innerHTML = `<div class="section-title"><span class="num">2/4</span> Choose a room type</div>
    <div class="grid-3" id="typeGrid"></div>`;
  document.getElementById('typeGrid').innerHTML = ROOM_TYPES.map(t=>`
    <div class="room-card">
      <div class="img">${t.icon}</div>
      <div class="body">
        <h3 style="font-size:17px;">${t.name}</h3>
        <div style="font-size:12.5px; color:var(--text-soft);">${t.beds}</div>
        <ul>${t.facilities.map(f=>`<li>${f}</li>`).join('')}</ul>
        <div class="price">${inr(t.price)}<span style="font-size:12px; color:var(--text-soft); font-family:var(--font-body);">/night</span></div>
        <button class="btn btn-primary" onclick="selectRoomType('${t.id}')">Select</button>
      </div>
    </div>`).join('');
}
function selectRoomType(typeId){
  const draft = getDraft();
  draft.typeId = typeId; draft.floor=null; draft.roomNumber=null;
  saveDraft(draft);
  go('book-floors');
}

/* ---- Step 3: Floors ---- */
function renderBookFloors(root){
  const draft = getDraft();
  if(!draft.typeId){ go('book-types'); return; }
  root.innerHTML = `<div class="section-title"><span class="num">3/4</span> Choose a floor</div>
    <div class="floor-grid" id="floorGrid"></div>`;
  document.getElementById('floorGrid').innerHTML = FLOORS.map(f=>{
    const rooms = DB.get(KEYS.ROOMS, []).filter(r=>r.floor===f && r.typeId===draft.typeId);
    const avail = rooms.filter(r=>r.status==='available').length;
    return `<div class="floor-pick" onclick="selectFloor(${f})">Floor ${f}<div style="font-weight:400; font-size:12px; color:var(--text-soft); margin-top:6px;">${avail} available</div></div>`;
  }).join('');
}
function selectFloor(floor){
  const draft = getDraft();
  draft.floor = floor; draft.roomNumber=null;
  saveDraft(draft);
  go('book-map');
}

/* ---- Step 4: Room map ---- */
function renderBookMap(root){
  const draft = getDraft();
  if(!draft.typeId || !draft.floor){ go('book-floors'); return; }
  const allRooms = DB.get(KEYS.ROOMS, []);
  const rooms = allRooms.filter(r=>r.floor===draft.floor && r.typeId===draft.typeId).sort((a,b)=>a.number-b.number);
  root.innerHTML = `
    <div class="section-title"><span class="num">4/4</span> Floor ${draft.floor} — blueprint</div>
    <div class="card">
      <div class="blueprint" id="blueprintGrid"></div>
      <div class="legend">
        <span><i style="background:var(--surface); border-color:var(--emerald-2);"></i> Available</span>
        <span><i style="background:#2E6B4C;"></i> Already booked</span>
        <span><i style="background:#9A9A94;"></i> Maintenance</span>
        <span><i style="background:var(--gold);"></i> Your selection</span>
      </div>
    </div>
    <div style="margin-top:18px; display:flex; justify-content:flex-end;">
      <button class="btn btn-primary" id="mapContinueBtn" ${draft.roomNumber?'':'disabled style="opacity:.5;"'} onclick="go('services')">Continue to services →</button>
    </div>`;
  const grid = document.getElementById('blueprintGrid');
  if(rooms.length===0){ grid.innerHTML = '<div class="empty-state">No rooms of this type on this floor. Go back and pick another floor.</div>'; return; }
  grid.innerHTML = rooms.map(r=>{
    let cls = r.status;
    if(draft.roomNumber === r.number) cls = 'selected';
    return `<div class="room-box ${cls}" ${r.status==='available'?`onclick="pickRoom(${r.number})"`:''}>
      ${r.number}<small>${r.status==='available' ? (draft.roomNumber===r.number?'Selected':'Available') : r.status}</small>
    </div>`;
  }).join('');
}
function pickRoom(number){
  const draft = getDraft();
  draft.roomNumber = number;
  saveDraft(draft);
  renderBookMap(document.getElementById('viewRoot'));
}

/* ---- Services ---- */
function renderServices(root){
  const draft = getDraft();
  const s = draft.services;
  root.innerHTML = `
    <div class="grid-2" style="align-items:start;">
      <div>
        <div class="svc-group"><h4>💆 Spa services</h4>
          ${svcCheckbox('spa-full','Full Body Spa',2000, s.spa.includes('full'), `toggleSpa('full')`)}
          ${svcCheckbox('spa-head','Head Massage',800, s.spa.includes('head'), `toggleSpa('head')`)}
          ${svcCheckbox('spa-steam','Steam Bath',600, s.spa.includes('steam'), `toggleSpa('steam')`)}
        </div>
        <div class="svc-group"><h4>🎉 Party services</h4>
          ${svcRadioGroup('party', [['birthday','Birthday Decoration',5000],['anniversary','Anniversary Decoration',7000],['conference','Conference Hall',15000]], s.party)}
        </div>
        <div class="svc-group"><h4>🚕 Cab service</h4>
          ${svcRadioGroup('cab', [['airport','Airport Pickup',1200],['railway','Railway Pickup',800],['city','City Tour',2500]], s.cab)}
        </div>
        <div class="svc-group"><h4>🐾 Pet care</h4>
          <div class="svc-item"><div class="left"><span class="ic">🐾</span><span>Bringing a pet?</span></div>
            <button class="toggle ${s.pet.has?'on':''}" onclick="togglePetHas()"></button></div>
          ${s.pet.has ? `<div class="field" style="margin-top:8px;"><label>Pet type</label>
            <select id="petType" onchange="setPetType(this.value)">
              <option value="">Choose…</option>
              <option value="Dog" ${s.pet.type==='Dog'?'selected':''}>Dog</option>
              <option value="Cat" ${s.pet.type==='Cat'?'selected':''}>Cat</option>
              <option value="Bird" ${s.pet.type==='Bird'?'selected':''}>Bird</option>
              <option value="Other" ${s.pet.type==='Other'?'selected':''}>Other</option>
            </select></div>
            <div style="font-size:12px; color:var(--text-soft); margin-top:6px;">Pet care charge: ${inr(1500)}</div>` : ''}
        </div>
      </div>
      <div>
        <div class="svc-group"><h4>🍽️ Restaurant booking</h4>
          <div class="card" style="box-shadow:none;">
            <div class="field"><label>Number of people</label><input type="number" min="0" id="rPeople" value="${s.restaurant.people}" class="qty-input" style="width:100%;" onchange="setRestaurant('people', this.value)"></div>
            <div class="row2">
              <div class="field"><label>Breakfast (₹250/person)</label><input type="number" min="0" id="rBreak" value="${s.restaurant.breakfast}" class="qty-input" style="width:100%;" onchange="setRestaurant('breakfast', this.value)"></div>
              <div class="field"><label>Lunch (₹450/person)</label><input type="number" min="0" id="rLunch" value="${s.restaurant.lunch}" class="qty-input" style="width:100%;" onchange="setRestaurant('lunch', this.value)"></div>
            </div>
            <div class="field"><label>Dinner (₹500/person)</label><input type="number" min="0" id="rDinner" value="${s.restaurant.dinner}" class="qty-input" style="width:100%;" onchange="setRestaurant('dinner', this.value)"></div>
          </div>
        </div>
        <div class="svc-group"><h4>🧺 More extras</h4>
          ${svcCheckbox('laundry','Laundry',300, s.laundry, `toggleFlag('laundry')`)}
          ${svcCheckbox('gym','Gym access',500, s.gym, `toggleFlag('gym')`)}
          ${svcCheckbox('pool','Swimming pool',350, s.pool, `toggleFlag('pool')`)}
          ${svcCheckbox('extraBed','Extra bed',700, s.extraBed, `toggleFlag('extraBed')`)}
          ${svcCheckbox('airportDrop','Airport drop',1200, s.airportDrop, `toggleFlag('airportDrop')`)}
          ${svcCheckbox('lateCheckout','Late checkout',1000, s.lateCheckout, `toggleFlag('lateCheckout')`)}
        </div>
      </div>
    </div>
    <div style="margin-top:10px; display:flex; justify-content:flex-end; gap:10px;">
      <button class="btn btn-outline" onclick="openBill()">Review bill</button>
      <button class="btn btn-primary" onclick="go('payment')">Continue to payment →</button>
    </div>
  `;
}
function svcCheckbox(id, label, price, on, onclickFn){
  return `<div class="svc-item"><div class="left"><span class="ic">•</span><span>${label}</span></div>
    <div style="display:flex; align-items:center; gap:12px;"><span class="price">${inr(price)}</span>
    <button class="toggle ${on?'on':''}" onclick="${onclickFn}()"></button></div></div>`;
}
function svcRadioGroup(name, options, current){
  const none = `<div class="svc-item"><div class="left"><span>None</span></div>
    <button class="toggle ${!current?'on':''}" onclick="set${cap(name)}(null)"></button></div>`;
  const rows = options.map(([val,label,price])=>`
    <div class="svc-item"><div class="left"><span>${label}</span></div>
      <div style="display:flex; align-items:center; gap:12px;"><span class="price">${inr(price)}</span>
      <button class="toggle ${current===val?'on':''}" onclick="set${cap(name)}('${val}')"></button></div></div>`).join('');
  return none + rows;
}
function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }
function toggleSpa(key){
  const draft = getDraft();
  const idx = draft.services.spa.indexOf(key);
  if(idx>-1) draft.services.spa.splice(idx,1); else draft.services.spa.push(key);
  saveDraft(draft); renderServices(document.getElementById('viewRoot'));
}
function setParty(val){ const d=getDraft(); d.services.party = (d.services.party===val)?null:val; saveDraft(d); renderServices(document.getElementById('viewRoot')); }
function setCab(val){ const d=getDraft(); d.services.cab = (d.services.cab===val)?null:val; saveDraft(d); renderServices(document.getElementById('viewRoot')); }
function toggleFlag(key){ const d=getDraft(); d.services[key] = !d.services[key]; saveDraft(d); renderServices(document.getElementById('viewRoot')); }
function togglePetHas(){ const d=getDraft(); d.services.pet.has = !d.services.pet.has; saveDraft(d); renderServices(document.getElementById('viewRoot')); }
function setPetType(v){ const d=getDraft(); d.services.pet.type=v; saveDraft(d); }
function setRestaurant(field, val){ const d=getDraft(); d.services.restaurant[field] = Math.max(0, parseInt(val)||0); saveDraft(d); }

/* ---- Payment ---- */
let selectedPayMethod = null;
function renderPayment(root){
  const draft = getDraft();
  const bill = computeBill(draft);
  selectedPayMethod = null;
  root.innerHTML = `
    <div class="grid-2" style="align-items:start;">
      <div class="card">
        <h3 style="margin-bottom:14px;">Choose payment method</h3>
        <div class="pay-method">
          <button data-m="upi" onclick="choosePayMethod('upi')">📱 UPI</button>
          <button data-m="credit" onclick="choosePayMethod('credit')">💳 Credit Card</button>
          <button data-m="debit" onclick="choosePayMethod('debit')">💳 Debit Card</button>
          <button data-m="netbanking" onclick="choosePayMethod('netbanking')">🏦 Net Banking</button>
        </div>
        <div id="payFields"></div>
        <div class="error-text hidden" id="payErr"></div>
        <button class="btn btn-primary" id="payBtn" style="margin-top:10px; display:none;" onclick="submitPayment()">Pay ${inr(bill.total)}</button>
        <p class="help-note" style="text-align:left;">Demo credentials — Account: <span class="mono">1234567890</span>, Password: <span class="mono">hotel123</span>, OTP: <span class="mono">123456</span></p>
      </div>
      <div class="card">
        <h3 style="margin-bottom:14px;">Order summary</h3>
        ${bill.lines.map(l=>`<div class="bill-line"><span>${l.label}</span><span class="mono">${inr(l.amount)}</span></div>`).join('') || '<p style="color:var(--text-soft); font-size:13.5px;">No items yet.</p>'}
        <div class="bill-line"><span>Taxes (18%)</span><span class="mono">${inr(bill.tax)}</span></div>
        <div class="bill-line total"><span>Grand total</span><span class="mono">${inr(bill.total)}</span></div>
      </div>
    </div>`;
}
function choosePayMethod(m){
  selectedPayMethod = m;
  document.querySelectorAll('.pay-method button').forEach(b=>b.classList.toggle('active', b.dataset.m===m));
  const fields = document.getElementById('payFields');
  document.getElementById('payBtn').style.display = 'inline-flex';
  const labels = {upi:'UPI ID', credit:'Card Number', debit:'Card Number', netbanking:'Account Number'};
  fields.innerHTML = `
    <div class="field"><label>${labels[m]}</label><input type="text" id="payAccount" placeholder="e.g. 1234567890"></div>
    <div class="field"><label>Password</label><input type="password" id="payPassword" placeholder="hotel123"></div>
    <div class="field"><label>OTP</label><input type="text" id="payOtp" placeholder="123456"></div>`;
}
function submitPayment(){
  const acc = document.getElementById('payAccount').value.trim();
  const pass = document.getElementById('payPassword').value.trim();
  const otp = document.getElementById('payOtp').value.trim();
  const errEl = document.getElementById('payErr');
  errEl.classList.add('hidden');
  const btn = document.getElementById('payBtn');
  if(acc !== '1234567890' || pass !== 'hotel123' || otp !== '123456'){
    return showErr(errEl, 'Invalid credentials. Please check the demo credentials below and try again.');
  }
  btn.innerHTML = '<span class="loader"></span> Processing…';
  btn.disabled = true;
  setTimeout(()=>{ finalizeBooking(); }, 1400);
}
function finalizeBooking(){
  const draft = getDraft();
  const bill = computeBill(draft);
  const bookingId = 'MM'+Math.floor(100000+Math.random()*899999);
  const serviceLabels = bill.lines.filter(l=>!l.label.startsWith(roomTypeById(draft.typeId||'')?.name||'###')).map(l=>l.label);
  const booking = {
    id:bookingId, userEmail:session.email, customerName:session.name,
    roomNumber:draft.roomNumber, floor:draft.floor, roomType: draft.typeId? roomTypeById(draft.typeId).name : '—',
    checkIn:draft.checkIn, checkOut:draft.checkOut,
    services: bill.lines.filter(l=>l.label.indexOf('Room')===-1).map(l=>l.label).join(', ') || 'None',
    totalBill: bill.total, paymentStatus:'Paid', createdAt:Date.now()
  };
  const bookings = DB.get(KEYS.BOOKINGS, []);
  bookings.push(booking);
  DB.set(KEYS.BOOKINGS, bookings);
  // mark room as booked
  const rooms = DB.get(KEYS.ROOMS, []);
  const r = rooms.find(x=>x.number===draft.roomNumber);
  if(r) r.status = 'booked';
  DB.set(KEYS.ROOMS, rooms);
  DB.set(KEYS.DRAFT+'_last', booking);
  localStorage.removeItem(KEYS.DRAFT);
  go('success');
}

/* ---- Success ---- */
function renderSuccess(root){
  const booking = DB.get(KEYS.DRAFT+'_last', null);
  if(!booking){ root.innerHTML = '<div class="empty-state">No recent booking found.</div>'; return; }
  root.innerHTML = `
    <div class="success-wrap">
      <div class="checkmark">✓</div>
      <h2>🎉 Congratulations!</h2>
      <p style="color:var(--text-soft); margin-top:8px;">Your hotel booking has been confirmed successfully.</p>
      <div class="card receipt">
        <div class="bill-line"><span>Booking ID</span><span class="mono">${booking.id}</span></div>
        <div class="bill-line"><span>Customer name</span><span>${booking.customerName}</span></div>
        <div class="bill-line"><span>Room number</span><span>${booking.roomNumber} (Floor ${booking.floor})</span></div>
        <div class="bill-line"><span>Check-in</span><span>${booking.checkIn}</span></div>
        <div class="bill-line"><span>Check-out</span><span>${booking.checkOut}</span></div>
        <div class="bill-line"><span>Services</span><span>${booking.services}</span></div>
        <div class="bill-line total"><span>Total paid</span><span class="mono">${inr(booking.totalBill)}</span></div>
      </div>
      <div style="display:flex; gap:10px; margin-top:20px; flex-wrap:wrap; justify-content:center;">
        <button class="btn btn-primary" onclick="downloadInvoice()">⬇ Download invoice</button>
        <button class="btn btn-outline" onclick="go('dashboard')">Back to dashboard</button>
        <button class="btn btn-outline" onclick="saveDraft(emptyDraft()); go('book-dates');">Book another room</button>
      </div>
    </div>`;
}
function downloadInvoice(){
  const booking = DB.get(KEYS.DRAFT+'_last', null);
  if(!booking) return;
  const text = `She & Lives HOTELS — INVOICE
========================================
Booking ID: ${booking.id}
Customer:   ${booking.customerName}
Room:       ${booking.roomNumber} (Floor ${booking.floor}) — ${booking.roomType}
Check-in:   ${booking.checkIn}
Check-out:  ${booking.checkOut}
Services:   ${booking.services}
----------------------------------------
TOTAL PAID: ${inr(booking.totalBill)}
========================================
Thank you for staying with us.`;
  const blob = new Blob([text], {type:'text/plain'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `invoice-${booking.id}.txt`;
  a.click();
}

/* ---- Profile / History / Notifications / FAQ / Contact / Settings ---- */
function renderProfile(root){
  const users = DB.get(KEYS.USERS, []);
  const user = users.find(u=>u.email===session.email) || {};
  root.innerHTML = `
    <div class="card" style="max-width:520px;">
      <div class="section-title">Personal details</div>
      <div class="field"><label>Full name</label><input type="text" id="pName" value="${user.name||''}"></div>
      <div class="field"><label>Email</label><input type="email" value="${user.email||''}" disabled></div>
      <div class="field"><label>Phone number</label><input type="text" id="pPhone" value="${user.phone||''}"></div>
      <button class="btn btn-primary" onclick="saveProfile()">Save changes</button>
      <div class="error-text hidden" id="profileMsg" style="color:var(--emerald-2);"></div>
    </div>`;
}
function saveProfile(){
  const users = DB.get(KEYS.USERS, []);
  const user = users.find(u=>u.email===session.email);
  if(user){
    user.name = document.getElementById('pName').value.trim() || user.name;
    user.phone = document.getElementById('pPhone').value.trim();
    DB.set(KEYS.USERS, users);
    session.name = user.name; DB.set(KEYS.SESSION, session);
    document.getElementById('userNameTag').textContent = session.name;
    document.getElementById('avatarInitial').textContent = session.name.charAt(0).toUpperCase();
  }
  const msg = document.getElementById('profileMsg');
  msg.textContent = 'Saved.'; msg.classList.remove('hidden');
}
function renderHistory(root){
  const bookings = DB.get(KEYS.BOOKINGS, []).filter(b=>b.userEmail===session.email).reverse();
  root.innerHTML = `<div class="card">${bookings.length ? renderMiniBookingTable(bookings) : '<div class="empty-state">No bookings yet.</div>'}</div>`;
}
function renderNotifications(root){
  const items = [
    ['🛎️','Welcome to She & Lives','Your account was created successfully.'],
    ['🧾','Bill updates instantly','Any service you add or remove reflects in your floating bill right away.'],
    ['🌙','Try dark mode','Toggle the moon icon in the top bar for a low-light theme.'],
  ];
  root.innerHTML = `<div class="card">${items.map(i=>`
    <div class="svc-item"><div class="left"><span class="ic">${i[0]}</span><div><div style="font-weight:700; font-size:13.5px;">${i[1]}</div>
    <div style="font-size:12.5px; color:var(--text-soft);">${i[2]}</div></div></div></div>`).join('')}</div>`;
}
function renderFaq(root){
  const faqs = [
    ['Is this a real payment system?','No — the payment page is a simulation for demo purposes only. No real money moves.'],
    ['Where is my data stored?','Everything is saved to your browser\'s local storage. Nothing leaves your device.'],
    ['Can I change my room after booking services?','Yes, from your dashboard you can edit your room and services any time before payment.'],
    ['What are the demo payment credentials?','Account 1234567890, password hotel123, OTP 123456.'],
  ];
  root.innerHTML = `<div class="card">${faqs.map(f=>`<div style="margin-bottom:16px;"><h4 style="font-size:14.5px;">${f[0]}</h4><p style="font-size:13.5px; color:var(--text-soft); margin-top:4px;">${f[1]}</p></div>`).join('')}</div>`;
}
function renderContact(root){
  root.innerHTML = `<div class="card" style="max-width:460px;">
    <div class="section-title">Get in touch</div>
    <p style="font-size:13.5px; color:var(--text-soft); line-height:1.7;">
      📞 +91 44 2345 6789<br>✉️ stay@shelives.example<br>📍 ECR Road, Chennai, Tamil Nadu<br>🕐 Front desk open 24 hours</p>
  </div>`;
}
function renderSettings(root){
  const theme = DB.get(KEYS.THEME,'light');
  root.innerHTML = `<div class="card" style="max-width:460px;">
    <div class="section-title">Preferences</div>
    <div class="svc-item"><div class="left"><span>Dark mode</span></div><button class="toggle ${theme==='dark'?'on':''}" onclick="toggleTheme(); renderSettings(document.getElementById('viewRoot'))"></button></div>
    <button class="btn btn-outline" style="margin-top:18px; width:100%;" onclick="logout()">Log out</button>
  </div>`;
}

/* =====================================================================
   ADMIN VIEWS
   ===================================================================== */
function renderAdminDashboard(root){
  const bookings = DB.get(KEYS.BOOKINGS, []);
  const rooms = DB.get(KEYS.ROOMS, []);
  const totalCustomers = new Set(bookings.map(b=>b.customerName)).size;
  const totalRevenue = bookings.reduce((a,b)=>a+(b.totalBill||0),0);
  const occupied = rooms.filter(r=>r.status==='booked').length;
  const available = rooms.filter(r=>r.status==='available').length;
  root.innerHTML = `
    <div class="grid-4" style="margin-bottom:22px;">
      <div class="card stat-card"><span class="stat-icon">🧑‍🤝‍🧑</span><div class="stat-label">Total customers</div><div class="stat-value">${totalCustomers}</div></div>
      <div class="card stat-card"><span class="stat-icon">🗓️</span><div class="stat-label">Total bookings</div><div class="stat-value">${bookings.length}</div></div>
      <div class="card stat-card"><span class="stat-icon">💰</span><div class="stat-label">Total revenue</div><div class="stat-value">${inr(totalRevenue)}</div></div>
      <div class="card stat-card"><span class="stat-icon">🛏️</span><div class="stat-label">Occupied / Available</div><div class="stat-value">${occupied} / ${available}</div></div>
    </div>
    <div class="card">
      <div class="section-title">Recent bookings</div>
      ${renderAdminTable(bookings.slice(-6).reverse())}
    </div>`;
}
function renderAdminTable(rows){
  if(!rows.length) return '<div class="empty-state">No bookings yet.</div>';
  return `<table><thead><tr><th>Customer</th><th>Room</th><th>Floor</th><th>Type</th><th>Check-in</th><th>Check-out</th><th>Services</th><th>Bill</th><th>Status</th></tr></thead><tbody>
    ${rows.map(b=>`<tr><td>${b.customerName}</td><td>${b.roomNumber}</td><td>${b.floor}</td><td>${b.roomType||'—'}</td><td>${b.checkIn}</td><td>${b.checkOut}</td>
    <td style="max-width:200px;">${b.services||'—'}</td><td class="mono">${inr(b.totalBill)}</td>
    <td><span class="badge ${b.paymentStatus==='Paid'?'badge-paid':'badge-pending'}">${b.paymentStatus}</span></td></tr>`).join('')}
  </tbody></table>`;
}
function renderAdminCustomers(root){
  root.innerHTML = `
    <div class="filters">
      <input type="text" id="fSearch" placeholder="Search customer…" oninput="applyAdminFilters()">
      <select id="fRoom" onchange="applyAdminFilters()"><option value="">All rooms</option>${[...new Set(DB.get(KEYS.BOOKINGS,[]).map(b=>b.roomNumber))].sort((a,b)=>a-b).map(r=>`<option>${r}</option>`).join('')}</select>
      <select id="fFloor" onchange="applyAdminFilters()"><option value="">All floors</option>${FLOORS.map(f=>`<option>${f}</option>`).join('')}</select>
      <select id="fPayment" onchange="applyAdminFilters()"><option value="">All payments</option><option>Paid</option><option>Pending</option></select>
    </div>
    <div class="card" id="adminTableWrap">${renderAdminTable(DB.get(KEYS.BOOKINGS,[]).slice().reverse())}</div>`;
}
function applyAdminFilters(){
  const search = document.getElementById('fSearch').value.toLowerCase();
  const room = document.getElementById('fRoom').value;
  const floor = document.getElementById('fFloor').value;
  const payment = document.getElementById('fPayment').value;
  let rows = DB.get(KEYS.BOOKINGS,[]).slice().reverse();
  if(search) rows = rows.filter(b=>b.customerName.toLowerCase().includes(search));
  if(room) rows = rows.filter(b=>String(b.roomNumber)===room);
  if(floor) rows = rows.filter(b=>String(b.floor)===floor);
  if(payment) rows = rows.filter(b=>b.paymentStatus===payment);
  document.getElementById('adminTableWrap').innerHTML = renderAdminTable(rows);
}
let chartRefs = {};
function renderAdminAnalytics(root){
  const bookings = DB.get(KEYS.BOOKINGS, []);
  const rooms = DB.get(KEYS.ROOMS, []);
  root.innerHTML = `
    <div class="grid-3">
      <div class="card chart-card"><h4 style="margin-bottom:10px; font-size:14px;">Room occupancy</h4><canvas id="chartOcc"></canvas></div>
      <div class="card chart-card"><h4 style="margin-bottom:10px; font-size:14px;">Service usage</h4><canvas id="chartSvc"></canvas></div>
      <div class="card chart-card"><h4 style="margin-bottom:10px; font-size:14px;">Revenue by room type</h4><canvas id="chartRev"></canvas></div>
    </div>`;
  Object.values(chartRefs).forEach(c=>c && c.destroy());
  const occCounts = {available:0, booked:0, maintenance:0};
  rooms.forEach(r=>occCounts[r.status]++);
  chartRefs.occ = new Chart(document.getElementById('chartOcc'), {
    type:'doughnut',
    data:{labels:['Available','Booked','Maintenance'], datasets:[{data:[occCounts.available,occCounts.booked,occCounts.maintenance], backgroundColor:['#23594A','#C7962E','#9A9A94']}]},
    options:{plugins:{legend:{position:'bottom', labels:{boxWidth:10, font:{size:10}}}}}
  });
  const svcCount = {};
  bookings.forEach(b=>(b.services||'').split(',').map(s=>s.trim()).filter(Boolean).forEach(s=>{ if(s!=='None') svcCount[s]=(svcCount[s]||0)+1; }));
  const svcEntries = Object.entries(svcCount).sort((a,b)=>b[1]-a[1]).slice(0,6);
  chartRefs.svc = new Chart(document.getElementById('chartSvc'), {
    type:'bar',
    data:{labels:svcEntries.map(e=>e[0]), datasets:[{label:'Times booked', data:svcEntries.map(e=>e[1]), backgroundColor:'#C7962E'}]},
    options:{plugins:{legend:{display:false}}, scales:{x:{ticks:{font:{size:9}}}}}
  });
  const revByType = {};
  ROOM_TYPES.forEach(t=>revByType[t.name]=0);
  bookings.forEach(b=>{ if(revByType[b.roomType]!==undefined) revByType[b.roomType]+=b.totalBill||0; });
  chartRefs.rev = new Chart(document.getElementById('chartRev'), {
    type:'line',
    data:{labels:Object.keys(revByType), datasets:[{label:'Revenue ₹', data:Object.values(revByType), borderColor:'#17392E', backgroundColor:'rgba(23,57,46,0.15)', fill:true, tension:.35}]},
    options:{plugins:{legend:{display:false}}}
  });
}

/* =====================================================================
   INIT
   ===================================================================== */
document.addEventListener('DOMContentLoaded', ()=>{
  const s = DB.get(KEYS.SESSION, null);
  if(s){ bootApp(); }
});
