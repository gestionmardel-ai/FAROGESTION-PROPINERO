// @ts-nocheck
import { useState, useEffect } from "react";

const SUPABASE_URL = "https://vuzyvdfftdjrgbchpebk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1enl2ZGZmdGRqcmdiY2hwZWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNzg2NjYsImV4cCI6MjA5Mzc1NDY2Nn0.G0__BqrBq_Tsg2raq3rbyxzPeCgzxGE4kTCm9uZGSl0";

const PUESTOS = ["Bacha 1","Bacha 2","Cafetería","Caja","Recepcionista","Encargado Salón","Cocina 1","Cocina 2","Cocina 3","Cocina 4","Cocina 5","Cocina 6","Cocina 7","Cocina 8"];
const PAGADORES = ["Cristian","Valentina","Daniel"];
const TURNOS = ["Mañana","Noche","Evento"];
const USUARIOS = { cristian: "cristian1492", valentina: "valentina1492", daniel: "daniel1492" };

const BG="#000",CARD="#0d0d0d",CARD2="#161616",BORDER="#2a2a2a",BRIGHT="#f0f0f0",MUTED="#666",ACCENT="#e0e0e0",GREEN="#22c55e",RED="#dc2626";

const todayStr = () => new Date().toISOString().split("T")[0];
const uid = () => Math.random().toString(36).slice(2,9);
const fmtDate = (d) => { if(!d) return "—"; const [y,m,day] = d.split("-"); return `${day}/${m}/${y}`; };

const sb = async(path, options = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  if(!res.ok) throw new Error(text);
  return text ? JSON.parse(text) : [];
};

const getPersonal = () => sb("/propinas_personal?order=nombre.asc");
const getHistorial = () => sb("/propinas_historial?order=created_at.desc");
const getBorradores = () => sb("/propinas_borradores?order=created_at.desc");
const addEmp = (nombre) => sb("/propinas_personal", {method:"POST", body:JSON.stringify({nombre})});
const delEmp = (id) => sb(`/propinas_personal?id=eq.${id}`, {method:"DELETE", headers:{"Prefer":""}});
const addReg = (r) => sb("/propinas_historial", {method:"POST", body:JSON.stringify({id:r.id, fecha_pago:r.fechaPago, fecha_propina:r.fechaPropina, turno:r.turno, pagado_por:r.pagadoPor, monto:r.monto, total_hs:r.totalHs, rate_ph:r.ratePH, detalles:r.detalles, created_by:r.createdBy})});
const addBorrador = (b) => sb("/propinas_borradores", {method:"POST", body:JSON.stringify({id:b.id, fecha_pago:b.fechaPago, fecha_propina:b.fechaPropina, turno:b.turno, pagado_por:b.pagadoPor, distribucion:b.distribucion, created_by:b.createdBy})});
const delBorrador = (id) => sb(`/propinas_borradores?id=eq.${id}`, {method:"DELETE", headers:{"Prefer":""}});
const patchReg = (id, dt) => sb(`/propinas_historial?id=eq.${id}`, {method:"PATCH", body:JSON.stringify({detalles:dt})});
const deleteReg = (id) => sb(`/propinas_historial?id=eq.${id}`, {method:"DELETE", headers:{"Prefer":""}});

const INPUT = {background:CARD2, border:`1px solid ${BORDER}`, borderRadius:10, color:BRIGHT, fontFamily:"Inter,sans-serif", fontSize:15, padding:"14px 16px", outline:"none", width:"100%", boxSizing:"border-box"};
const LABEL = {fontSize:11, color:MUTED, marginBottom:12, display:"block"};
const SECTIT = {fontSize:10, color:ACCENT, letterSpacing:2, textTransform:"uppercase", fontWeight:600, marginBottom:14};

export default function App(){
  const [usuarioSel, setUsuarioSel] = useState("");
  const [usuario, setUsuario] = useState("");
  const [pass, setPass] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [logueado, setLogueado] = useState(false);
  const [tab, setTab] = useState("registrar");
  const [personal, setPersonal] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [borradores, setBorradores] = useState([]);
  const [ready, setReady] = useState(false);
  const [fechaPago, setFechaPago] = useState(todayStr());
  const [fechaPropina, setFechaPropina] = useState(todayStr());
  const [turno, setTurno] = useState("");
  const [pagadoPor, setPagadoPor] = useState("");
  const [monto, setMonto] = useState("");
  const [distrib, setDistrib] = useState(PUESTOS.map(p => ({puesto:p, empId:"", horas:0})));
  const [expandedId, setExpandedId] = useState(null);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [convertMode, setConvertMode] = useState(null);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");

  useEffect(() => {
    const l = document.createElement("link");
    l.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
    l.rel = "stylesheet";
    document.head.appendChild(l);
  }, []);

  const login = (u, p) => {
    if(!u || !p) { setLoginErr("Ingresa usuario y contraseña"); return; }
    if(USUARIOS[u] && USUARIOS[u] === p) {
      setLogueado(true);
      setUsuario(u);
      setPass("");
      setLoginErr("");
      cargarDatos();
    } else {
      setLoginErr("Credenciales incorrectas");
    }
  };

  const logout = () => {
    setLogueado(false);
    setUsuario("");
    setPass("");
    setUsuarioSel("");
  };

  const cargarDatos = async() => {
    try {
      const [p, h, b] = await Promise.all([getPersonal(), getHistorial(), getBorradores()]);
      setPersonal(Array.isArray(p) ? p : []);
      setHistorial(Array.isArray(h) ? h.map(r => ({
        id:r.id, fechaPago:r.fecha_pago, fechaPropina:r.fecha_propina, turno:r.turno,
        pagadoPor:r.pagado_por, monto:r.monto, totalHs:r.total_hs, ratePH:r.rate_ph,
        detalles:r.detalles||[], createdBy:r.created_by
      })) : []);
      setBorradores(Array.isArray(b) ? b.map(br => ({
        id:br.id, fechaPago:br.fecha_pago, fechaPropina:br.fecha_propina, turno:br.turno,
        pagadoPor:br.pagado_por, distribucion:br.distribucion||[], createdBy:br.created_by
      })) : []);
    } catch(e) { console.log("Error"); }
    setReady(true);
  };

  useEffect(() => { if(logueado) cargarDatos(); }, [logueado]);

  const montoNum = parseFloat(monto) || 0;
  const totalHs = distrib.reduce((s, r) => s + (r.empId && r.horas > 0 ? r.horas : 0), 0);
  const ratePH = totalHs > 0 && montoNum > 0 ? montoNum / totalHs : 0;
  const updDistrib = (i, key, val) => setDistrib(d => d.map((r, idx) => {
    if(idx !== i) return r;
    const u = {...r, [key]: val};
    if(key === "empId" && !val) u.horas = 0;
    return u;
  }));

  const guardarBorrador = async() => {
    if(!fechaPago || !fechaPropina || !turno || !pagadoPor) { alert("Completa datos"); return; }
    const b = {id:uid(), fechaPago, fechaPropina, turno, pagadoPor, distribucion:distrib, createdBy:usuario};
    try {
      await addBorrador(b);
      setBorradores([b, ...borradores]);
      setFechaPago(todayStr()); setFechaPropina(todayStr()); setTurno(""); setPagadoPor("");
      setDistrib(PUESTOS.map(p => ({puesto:p, empId:"", horas:0})));
      setTab("borradores");
    } catch { alert("Error"); }
  };

  const convertirBorrador = async(b, mt) => {
    const mn = parseFloat(mt) || 0;
    if(!mn) { alert("Ingresa monto"); return; }
    const df = b.distribucion.filter(r => r.empId && r.horas > 0);
    if(!df.length) { alert("Sin empleados"); return; }
    const th = df.reduce((s, r) => s + r.horas, 0);
    const rph = mn / th;
    const det = df.map(r => ({
      puesto:r.puesto, empId:r.empId, empNombre:personal.find(p=>p.id===r.empId)?.nombre||"?",
      horas:r.horas, cobro:rph*r.horas, cobrado:false
    }));
    const reg = {
      id:uid(), fechaPago:b.fechaPago, fechaPropina:b.fechaPropina, turno:b.turno, pagadoPor:b.pagadoPor,
      monto:mn, totalHs:th, ratePH:rph, detalles:det, createdBy:usuario
    };
    try {
      await addReg(reg);
      await delBorrador(b.id);
      setHistorial([reg, ...historial]);
      setBorradores(borradores.filter(x => x.id !== b.id));
      setConvertMode(null);
      setTab("historial");
    } catch { alert("Error"); }
  };

  const guardarPropina = async() => {
    if(!fechaPago || !fechaPropina || !turno || !pagadoPor || !montoNum) { alert("Completa todo"); return; }
    const det = distrib.filter(r => r.empId && r.horas > 0).map(r => ({
      puesto:r.puesto, empId:r.empId, empNombre:personal.find(p=>p.id===r.empId)?.nombre||"?",
      horas:r.horas, cobro:ratePH*r.horas, cobrado:false
    }));
    const reg = {
      id:uid(), fechaPago, fechaPropina, turno, pagadoPor, monto:montoNum,
      totalHs, ratePH, detalles:det, createdBy:usuario
    };
    try {
      await addReg(reg);
      setHistorial([reg, ...historial]);
      setFechaPago(todayStr()); setFechaPropina(todayStr()); setTurno(""); setPagadoPor(""); setMonto("");
      setDistrib(PUESTOS.map(p => ({puesto:p, empId:"", horas:0})));
      setTab("historial");
    } catch { alert("Error"); }
  };

  const toggleCobrado = async(regId, idx) => {
    const upd = historial.map(h => {
      if(h.id !== regId) return h;
      return {...h, detalles: h.detalles.map((d, i) => i === idx ? {...d, cobrado:!d.cobrado} : d)};
    });
    const reg = upd.find(h => h.id === regId);
    try { await patchReg(regId, reg.detalles); setHistorial(upd); } catch { alert("Error"); }
  };

  const addPersonal = async() => {
    const n = nuevoNombre.trim(); 
    if(!n) return;
    if(personal.some(p => p.nombre.toLowerCase() === n.toLowerCase())) { alert("Existe"); return; }
    try {
      const res = await addEmp(n);
      const neo = res[0] || {id:uid(), nombre:n};
      setPersonal([...personal, neo].sort((a,b) => a.nombre.localeCompare(b.nombre, "es")));
      setNuevoNombre("");
    } catch { alert("Error"); }
  };

  if(!logueado) {
    return (
      <div style={{minHeight:"100vh", background:BG, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px"}}>
        <div style={{width:"100%", maxWidth:320}}>
          <div style={{textAlign:"center", marginBottom:40}}>
            <div style={{fontSize:20, fontWeight:700, color:BRIGHT}}>🔐 Propinero</div>
            <div style={{fontSize:12, color:MUTED, marginTop:4}}>v2.3</div>
          </div>
          <div style={{background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:20}}>
            <div style={{fontSize:14, fontWeight:600, color:BRIGHT, marginBottom:20}}>Iniciar sesión</div>
            <div style={{marginBottom:24}}>
              <label style={LABEL}>Usuario</label>
              <select value={usuarioSel} onChange={e=>setUsuarioSel(e.target.value)} style={INPUT}>
                <option value="">Seleccionar...</option>
                <option value="cristian">Cristian</option>
                <option value="valentina">Valentina</option>
                <option value="daniel">Daniel</option>
              </select>
            </div>
            <div style={{marginBottom:24}}>
              <label style={LABEL}>Contraseña</label>
              <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login(usuarioSel,pass)} style={INPUT}/>
            </div>
            {loginErr && <div style={{fontSize:12, color:RED, marginBottom:16, padding:12, background:"#dc262615", borderRadius:8}}>{loginErr}</div>}
            <button onClick={()=>login(usuarioSel,pass)} style={{width:"100%", padding:14, background:BRIGHT, border:"none", borderRadius:10, color:"#000", fontWeight:700, cursor:"pointer", fontSize:15}}>
              Entrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if(!ready) return <div style={{minHeight:"100vh", background:BG, display:"flex", alignItems:"center", justifyContent:"center"}}>⏳</div>;

  return (
    <div style={{minHeight:"100vh", background:BG, color:BRIGHT, paddingBottom:80, maxWidth:500, margin:"0 auto"}}>
      <div style={{background:CARD, borderBottom:`1px solid ${BORDER}`, padding:"12px 16px", position:"sticky", top:0, zIndex:10}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div style={{fontSize:16, fontWeight:700}}>Propinero</div>
          <div style={{fontSize:12, color:MUTED}}>🔑 {usuario}</div>
          <button onClick={logout} style={{background:"none", border:`1px solid ${BORDER}`, borderRadius:8, color:RED, padding:"6px 12px", fontSize:12, cursor:"pointer"}}>Salir</button>
        </div>
      </div>

      <div style={{padding:"16px"}}>
        {tab==="registrar" && <TabRegistrar {...{personal, distrib, updDistrib, fechaPago, setFechaPago, fechaPropina, setFechaPropina, turno, setTurno, pagadoPor, setPagadoPor, monto, setMonto, totalHs, ratePH, guardarPropina, guardarBorrador}} />}
        {tab==="borradores" && <TabBorradores {...{borradores, personal, delBorrador, convertirBorrador, convertMode, setConvertMode}} />}
        {tab==="historial" && <TabHistorial {...{historial, expandedId, setExpandedId, toggleCobrado, deleteReg}} />}
        {tab==="registros" && <TabRegistros {...{personal, historial, selectedEmp, setSelectedEmp, fechaDesde, setFechaDesde, fechaHasta, setFechaHasta}} />}
        {tab==="personal" && <TabPersonal {...{personal, nuevoNombre, setNuevoNombre, addPersonal, delEmp}} />}
      </div>

      <div style={{position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:500, background:CARD, borderTop:`1px solid ${BORDER}`, display:"flex", zIndex:20}}>
        {[
          {id:"registrar",icon:"✏️",label:"Registrar"},
          {id:"borradores",icon:"📝",label:"Borradores"},
          {id:"historial",icon:"📋",label:"Historial"},
          {id:"registros",icon:"👤",label:"Registros"},
          {id:"personal",icon:"👥",label:"Personal"}
        ].map(t=>
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1, background:"none", border:"none", padding:"8px 0", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2}}>
            <span style={{fontSize:18}}>{t.icon}</span>
            <span style={{fontSize:9, color:tab===t.id?BRIGHT:MUTED, fontWeight:tab===t.id?600:400}}>{t.label}</span>
          </button>
        )}
      </div>
    </div>
  );
}

function TabRegistrar({personal, distrib, updDistrib, fechaPago, setFechaPago, fechaPropina, setFechaPropina, turno, setTurno, pagadoPor, setPagadoPor, monto, setMonto, totalHs, ratePH, guardarPropina, guardarBorrador}) {
  const montoNum = parseFloat(monto) || 0;
  
  return (
    <div>
      <div style={{background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:20, marginBottom:24}}>
        <div style={SECTIT}>Datos</div>
        <div style={{marginBottom:32}}>
          <label style={LABEL}>Fecha pago</label>
          <input type="date" value={fechaPago} onChange={e=>setFechaPago(e.target.value)} style={INPUT}/>
        </div>
        <div style={{marginBottom:32}}>
          <label style={LABEL}>Fecha propina</label>
          <input type="date" value={fechaPropina} onChange={e=>setFechaPropina(e.target.value)} style={INPUT}/>
        </div>
        <div style={{marginBottom:24}}>
          <label style={LABEL}>Turno</label>
          <div style={{display:"flex", gap:10}}>
            {TURNOS.map(t=>
              <button key={t} onClick={()=>setTurno(turno===t?"":t)} style={{flex:1, padding:"12px 6px", borderRadius:10, border:`1px solid ${turno===t?ACCENT:BORDER}`, background:turno===t?"#2a2a2a":"transparent", color:turno===t?BRIGHT:MUTED, fontWeight:turno===t?600:400, cursor:"pointer"}}>
                {t}
              </button>
            )}
          </div>
        </div>
        <div style={{marginBottom:24}}>
          <label style={LABEL}>Pagado por</label>
          <div style={{display:"flex", gap:10}}>
            {PAGADORES.map(p=>
              <button key={p} onClick={()=>setPagadoPor(pagadoPor===p?"":p)} style={{flex:1, padding:"12px 6px", borderRadius:10, border:`1px solid ${pagadoPor===p?ACCENT:BORDER}`, background:pagadoPor===p?"#2a2a2a":"transparent", color:pagadoPor===p?BRIGHT:MUTED, fontWeight:pagadoPor===p?600:400, cursor:"pointer"}}>
                {p}
              </button>
            )}
          </div>
        </div>
        <div>
          <label style={LABEL}>Monto</label>
          <input type="number" inputMode="decimal" value={monto} onChange={e=>setMonto(e.target.value)} placeholder="0.00" style={INPUT}/>
        </div>
      </div>
      <div style={{background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:20, marginBottom:24}}>
        <div style={SECTIT}>Personal</div>
        {PUESTOS.map((p,i)=>
          <div key={p} style={{borderBottom:i<PUESTOS.length-1?`1px solid ${BORDER}`:"none", paddingBottom:16, marginBottom:24}}>
            <label style={LABEL}>{p}</label>
            <select value={distrib[i].empId} onChange={e=>updDistrib(i,"empId",e.target.value)} style={INPUT}>
              <option value="">-- Sin asignar --</option>
              {personal.map(per=><option key={per.id} value={per.id}>{per.nombre}</option>)}
            </select>
            {distrib[i].empId && (
              <div style={{display:"flex", gap:8, marginTop:10}}>
                {[4,6,8].map(h=>
                  <button key={h} onClick={()=>updDistrib(i,"horas",h)} style={{flex:1, padding:"10px 6px", borderRadius:8, border:`1px solid ${distrib[i].horas===h?ACCENT:BORDER}`, background:distrib[i].horas===h?"#2a2a2a":"transparent", color:BRIGHT, cursor:"pointer", fontWeight:distrib[i].horas===h?600:400}}>
                    {h}h
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{display:"flex", gap:10, marginBottom:20}}>
        <button onClick={guardarBorrador} style={{flex:1, padding:16, background:"#444", border:"none", borderRadius:14, color:BRIGHT, fontWeight:700, cursor:"pointer", fontSize:15}}>
          📝 Borrador
        </button>
        <button onClick={guardarPropina} disabled={!montoNum} style={{flex:1, padding:16, background:montoNum?"#fff":"#555", border:"none", borderRadius:14, color:montoNum?"#000":MUTED, fontWeight:700, cursor:montoNum?"pointer":"not-allowed", opacity:montoNum?1:0.5, fontSize:15}}>
          💾 Propina
        </button>
      </div>
    </div>
  );
}

function TabBorradores({borradores, personal, delBorrador, convertirBorrador, convertMode, setConvertMode}) {
  const [monto, setMonto] = useState("");
  
  return (
    <div>
      {borradores.length === 0 ? (
        <div style={{textAlign:"center", padding:"64px 20px", color:MUTED}}>📝 Sin borradores</div>
      ) : (
        borradores.map(b=>
          <div key={b.id} style={{background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:20, marginBottom:14}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14}}>
              <div>
                <div style={{fontWeight:600, fontSize:15, color:BRIGHT}}>{fmtDate(b.fechaPropina)}</div>
                <div style={{fontSize:11, color:MUTED, marginTop:4}}>{b.turno} · {b.pagadoPor}</div>
              </div>
              <button onClick={()=>delBorrador(b.id)} style={{background:"#dc262615", border:`1px solid ${RED}44`, borderRadius:8, color:RED, padding:"8px 14px", fontSize:11, cursor:"pointer"}}>
                Eliminar
              </button>
            </div>
            {convertMode === b.id ? (
              <div style={{background:CARD2, border:`1px solid ${BORDER}`, borderRadius:10, padding:14}}>
                <label style={LABEL}>Monto total</label>
                <div style={{display:"flex", gap:10}}>
                  <input type="number" inputMode="decimal" value={monto} onChange={e=>setMonto(e.target.value)} placeholder="0.00" style={{...INPUT, marginBottom:0, flex:1}}/>
                  <button onClick={()=>{convertirBorrador(b,monto); setMonto(""); setConvertMode(null);}} style={{padding:"16px 20px", background:GREEN, border:"none", borderRadius:10, color:"#000", fontWeight:700, cursor:"pointer", fontSize:14}}>
                    Convertir
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={()=>setConvertMode(b.id)} style={{width:"100%", padding:12, background:GREEN+"33", border:`1px solid ${GREEN}44`, borderRadius:10, color:GREEN, fontWeight:600, cursor:"pointer", marginTop:12, fontSize:14}}>
                → Convertir
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
}

function TabHistorial({historial, expandedId, setExpandedId, toggleCobrado, deleteReg}) {
  const [confirmDel, setConfirmDel] = useState(null);
  const tc = (t) => t==="Mañana"?"#fbbf24":t==="Noche"?"#818cf8":"#34d399";
  
  return (
    <div>
      {historial.length === 0 ? (
        <div style={{textAlign:"center", padding:"64px 20px", color:MUTED}}>📋 Sin registros</div>
      ) : (
        historial.map(h=>{
          const cobrados = h.detalles?.filter(d=>d.cobrado).length || 0;
          const total = h.detalles?.length || 0;
          return (
            <div key={h.id} style={{background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, marginBottom:12, overflow:"hidden"}}>
              <div style={{padding:"16px", cursor:"pointer"}} onClick={()=>setExpandedId(expandedId===h.id?null:h.id)}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontWeight:600, fontSize:15, color:BRIGHT}}>
                      {fmtDate(h.fechaPropina)} <span style={{fontSize:11, color:tc(h.turno), background:tc(h.turno)+"22", padding:"3px 10px", borderRadius:20}}>{h.turno}</span>
                    </div>
                    <div style={{fontSize:12, color:MUTED, marginTop:4}}>Pagó: {h.pagadoPor}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontWeight:700, fontSize:20, color:BRIGHT}}>${Number(h.monto).toFixed(2)}</div>
                    <div style={{fontSize:11, color:MUTED}}>{cobrados}/{total}</div>
                  </div>
                </div>
              </div>
              {expandedId === h.id && (
                <div style={{borderTop:`1px solid ${BORDER}`, padding:"16px"}}>
                  {(h.detalles||[]).map((d,i)=>
                    <div key={i} onClick={()=>toggleCobrado(h.id,i)} style={{display:"flex", justifyContent:"space-between", padding:"12px 14px", marginBottom:8, borderRadius:10, background:d.cobrado?"#22c55e15":CARD2, cursor:"pointer"}}>
                      <div>
                        <div style={{fontSize:14, color:d.cobrado?GREEN:BRIGHT, fontWeight:500}}>{d.empNombre}</div>
                        <div style={{fontSize:11, color:MUTED}}>{d.puesto} · {d.horas}h</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{color:GREEN, fontWeight:700}}>${Number(d.cobro).toFixed(2)}</div>
                        <div style={{fontSize:10, color:d.cobrado?GREEN:MUTED}}>{d.cobrado?"Pagada":"Pendiente"}</div>
                      </div>
                    </div>
                  )}
                  <div style={{marginTop:14, paddingTop:12, borderTop:`1px solid ${BORDER}`, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                    <span style={{fontSize:12, color:MUTED}}>${Number(h.ratePH||0).toFixed(2)}/h</span>
                    {confirmDel===h.id ? (
                      <div style={{display:"flex", gap:6}}>
                        <button onClick={()=>{deleteReg(h.id); setConfirmDel(null);}} style={{padding:"7px 12px", background:"#dc262615", border:`1px solid ${RED}`, borderRadius:8, color:RED, fontSize:12, cursor:"pointer"}}>
                          Sí, eliminar
                        </button>
                        <button onClick={()=>setConfirmDel(null)} style={{padding:"7px 10px", background:"none", border:`1px solid ${BORDER}`, borderRadius:8, color:MUTED, fontSize:12, cursor:"pointer"}}>
                          No
                        </button>
                      </div>
                    ) : (
                      <button onClick={()=>setConfirmDel(h.id)} style={{padding:"7px 14px", background:"#dc262615", border:`1px solid ${RED}44`, borderRadius:8, color:RED, fontSize:12, cursor:"pointer"}}>
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function TabRegistros({personal, historial, selectedEmp, setSelectedEmp, fechaDesde, setFechaDesde, fechaHasta, setFechaHasta}) {
  const tc = (t) => t==="Mañana"?"#fbbf24":t==="Noche"?"#818cf8":"#34d399";
  
  if(selectedEmp) {
    const emp = personal.find(p=>p.id===selectedEmp);
    let registros = historial.filter(h=>h.detalles?.some(d=>d.empId===selectedEmp));
    if(fechaDesde) registros = registros.filter(h=>h.fechaPropina>=fechaDesde);
    if(fechaHasta) registros = registros.filter(h=>h.fechaPropina<=fechaHasta);
    const total = registros.reduce((sum,h)=>{
      const det = h.detalles?.find(d=>d.empId===selectedEmp);
      return sum + (det ? Number(det.cobro) : 0);
    }, 0);
    
    const enviarWA = () => {
      const msg = `👤 ${emp?.nombre}\n${registros.map(h=>{
        const d = h.detalles?.find(x=>x.empId===selectedEmp);
        return d ? `📅 ${fmtDate(h.fechaPropina)} - $${Number(d.cobro).toFixed(2)} ${d.cobrado?"Pagada":"Pendiente"}` : "";
      }).filter(Boolean).join("\n")}\n💵 Total: $${total.toFixed(2)}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    };

    return (
      <div>
        <button onClick={()=>setSelectedEmp(null)} style={{background:"none", border:`1px solid ${BORDER}`, borderRadius:10, color:MUTED, padding:"10px 14px", fontSize:13, cursor:"pointer", marginBottom:24}}>
          ← Volver
        </button>
        <div style={{background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:20, marginBottom:24}}>
          <div style={{display:"flex", alignItems:"center", gap:14, marginBottom:24}}>
            <div style={{width:44, height:44, borderRadius:"50%", background:CARD2, border:`2px solid ${ACCENT}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, color:BRIGHT, fontWeight:700}}>
              {emp?.nombre[0].toUpperCase()}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:16, fontWeight:700, color:BRIGHT}}>{emp?.nombre}</div>
              <div style={{fontSize:12, color:MUTED}}>{registros.length} propinas</div>
            </div>
            <div style={{fontSize:18, fontWeight:700, color:GREEN}}>${total.toFixed(2)}</div>
          </div>
          <div style={{marginBottom:32}}>
            <label style={LABEL}>Desde</label>
            <input type="date" value={fechaDesde} onChange={e=>setFechaDesde(e.target.value)} style={INPUT}/>
          </div>
          <div style={{marginBottom:32}}>
            <label style={LABEL}>Hasta</label>
            <input type="date" value={fechaHasta} onChange={e=>setFechaHasta(e.target.value)} style={INPUT}/>
          </div>
          <button onClick={enviarWA} disabled={registros.length===0} style={{width:"100%", padding:14, background:registros.length>0?"#25d366":"#555", border:"none", borderRadius:10, color:"#fff", fontWeight:600, cursor:registros.length>0?"pointer":"not-allowed", opacity:registros.length>0?1:0.5, fontSize:15}}>
            📲 Enviar WhatsApp
          </button>
        </div>
        {registros.length === 0 ? (
          <div style={{textAlign:"center", padding:"40px 20px", color:MUTED}}>Sin registros en este período</div>
        ) : (
          registros.map(h=>{
            const d = h.detalles?.find(x=>x.empId===selectedEmp);
            return (
              <div key={h.id} style={{background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:"15px 16px", marginBottom:10}}>
                <div style={{display:"flex", justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontWeight:600, fontSize:14, color:BRIGHT}}>
                      {fmtDate(h.fechaPropina)} <span style={{fontSize:11, color:tc(h.turno), background:tc(h.turno)+"22", padding:"2px 7px", borderRadius:20}}>{h.turno}</span>
                    </div>
                    <div style={{fontSize:11, color:MUTED, marginTop:4}}>{d?.puesto} · {d?.horas}h</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontWeight:700, fontSize:16, color:GREEN}}>${Number(d?.cobro||0).toFixed(2)}</div>
                    <div style={{fontSize:10, color:d?.cobrado?GREEN:MUTED}}>{d?.cobrado?"Pagada ✓":"Pendiente ⏳"}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div>
      {personal.length === 0 ? (
        <div style={{textAlign:"center", padding:"48px 20px", color:MUTED}}>👤 Sin empleados</div>
      ) : (
        <div style={{background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, overflow:"hidden"}}>
          {personal.map((p,i)=>{
            const cant = historial.filter(h=>h.detalles?.some(d=>d.empId===p.id)).length;
            const tot = historial.reduce((sum,h)=>{
              const d = h.detalles?.find(x=>x.empId===p.id);
              return sum + (d ? Number(d.cobro) : 0);
            }, 0);
            return (
              <div key={p.id} onClick={()=>setSelectedEmp(p.id)} style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px", borderBottom:i<personal.length-1?`1px solid ${BORDER}`:"none", cursor:"pointer"}}>
                <div style={{display:"flex", alignItems:"center", gap:12}}>
                  <div style={{width:38, height:38, borderRadius:"50%", background:CARD2, border:`1px solid ${ACCENT}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, color:BRIGHT, fontWeight:700}}>
                    {p.nombre[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{fontSize:15, fontWeight:500, color:BRIGHT}}>{p.nombre}</div>
                    <div style={{fontSize:11, color:MUTED}}>{cant} propinas</div>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:15, fontWeight:700, color:GREEN}}>{tot>0?`$${tot.toFixed(2)}`:"—"}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TabPersonal({personal, nuevoNombre, setNuevoNombre, addPersonal, delEmp}) {
  const [confirmId, setConfirmId] = useState(null);

  return (
    <div>
      <div style={{display:"flex", gap:10, marginBottom:24}}>
        <input 
          value={nuevoNombre} 
          onChange={e=>setNuevoNombre(e.target.value)} 
          onKeyDown={e=>e.key==="Enter"&&addPersonal()} 
          placeholder="Nombre..." 
          style={{...INPUT, flex:1}}
        />
        <button 
          onClick={()=>{
            const n=nuevoNombre.trim(); 
            if(n&&!personal.some(p=>p.nombre.toLowerCase()===n.toLowerCase())) {
              addPersonal(); 
              setNuevoNombre("");
            }
          }} 
          style={{padding:"16px 20px", background:"#fff", border:"none", borderRadius:10, color:"#000", fontSize:20, fontWeight:700, cursor:"pointer", flexShrink:0}}
        >
          +
        </button>
      </div>
      {personal.length === 0 ? (
        <div style={{textAlign:"center", padding:"48px 20px", color:MUTED}}>Sin empleados</div>
      ) : (
        <div style={{background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, overflow:"hidden"}}>
          {personal.map((p,i)=>
            <div key={p.id} style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"15px 16px", borderBottom:i<personal.length-1?`1px solid ${BORDER}`:"none"}}>
              <div style={{display:"flex", alignItems:"center", gap:12}}>
                <div style={{width:36, height:36, borderRadius:"50%", background:CARD2, border:`1px solid ${ACCENT}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:BRIGHT, fontWeight:700}}>
                  {p.nombre[0].toUpperCase()}
                </div>
                <span style={{fontSize:15, fontWeight:500, color:BRIGHT}}>{p.nombre}</span>
              </div>
              {confirmId===p.id ? (
                <div style={{display:"flex", gap:6}}>
                  <button onClick={()=>{delEmp(p.id); setConfirmId(null);}} style={{padding:"7px 12px", background:"#dc262615", border:`1px solid ${RED}`, borderRadius:8, color:RED, fontSize:12, cursor:"pointer"}}>
                    Sí
                  </button>
                  <button onClick={()=>setConfirmId(null)} style={{padding:"7px 10px", background:"none", border:`1px solid ${BORDER}`, borderRadius:8, color:MUTED, fontSize:12, cursor:"pointer"}}>
                    No
                  </button>
                </div>
              ) : (
                <button onClick={()=>setConfirmId(p.id)} style={{padding:"7px 14px", background:"none", border:`1px solid ${BORDER}`, borderRadius:8, color:MUTED, fontSize:12, cursor:"pointer"}}>
                  Eliminar
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
