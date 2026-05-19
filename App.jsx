import { useState, useMemo, useEffect } from "react";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  LayoutDashboard, Package, ShoppingCart, Clock, Truck, Users,
  UserCircle, AlertTriangle, BarChart2, Settings, Menu, X, Bell,
  Search, Plus, Edit, Trash2, DollarSign, Activity, FileText,
  CheckCircle, Phone, Mail, Save, AlertCircle, ChevronRight,
  TrendingUp, TrendingDown, Tag, Pill, Building2, MapPin,
  RefreshCw, Eye, Star, Calendar,Send
} from "lucide-react";
import jsPDF from "jspdf";

/* ── THEME ─────────────────────────────────────────────────────────────────── */
const C = {
  primary:"#0EA5E9", primaryD:"#0284C7", primaryBg:"#E0F2FE",
  sidebar:"#0B1629", sidebarHover:"#1A2F4D", sidebarActive:"#1E3A5F",
  bg:"#F0F7FF", card:"#FFFFFF", text:"#0F172A", muted:"#64748B",
  border:"#E2E8F0", borderD:"#CBD5E1",
  success:"#15803D", successBg:"#DCFCE7", successBorder:"#86EFAC",
  warning:"#B45309", warningBg:"#FEF3C7", warningBorder:"#FCD34D",
  danger:"#DC2626",  dangerBg:"#FEE2E2",  dangerBorder:"#FCA5A5",
  info:"#1D4ED8",   infoBg:"#DBEAFE",    infoBorder:"#93C5FD",
  teal:"#0D9488",   tealBg:"#CCFBF1",
};

const sCard = {background:C.card,borderRadius:12,border:`1px solid ${C.border}`,padding:"1rem 1.25rem"};
const sBadge = (bg,color,border)=>({background:bg,color,border:`1px solid ${border}`,borderRadius:6,padding:"2px 10px",fontSize:12,fontWeight:600,display:"inline-block",whiteSpace:"nowrap"});
const sBtn = (bg,color="#fff",border=bg)=>({background:bg,color,border:`1px solid ${border}`,borderRadius:8,padding:"8px 14px",fontWeight:600,cursor:"pointer",fontSize:13,display:"inline-flex",alignItems:"center",gap:6,whiteSpace:"nowrap"});
const sInp = {width:"100%",padding:"8px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:14,background:"#fff",outline:"none",boxSizing:"border-box"};
const sTh = {padding:"10px 14px",textAlign:"left",fontSize:12,fontWeight:700,color:C.muted,borderBottom:`2px solid ${C.border}`,whiteSpace:"nowrap",background:"#F8FAFC"};
const sTd = {padding:"10px 14px",fontSize:13,color:C.text,borderBottom:`1px solid ${C.border}`};

/* ── GST RATES ──────────────────────────────────────────────────────────────── */
const GST_RATES = [0, 5, 12, 18, 28];

/* ── INITIAL DATA ───────────────────────────────────────────────────────────── */

const CHART_DATA = [
  {month:"Nov",sales:48200,profit:18400},{month:"Dec",sales:62100,profit:24800},
 
];
const CAT_DATA = [
  {name:"Antibiotics",value:28},{name:"Analgesics",value:22},
  {name:"Cardiovascular",value:18},{name:"Antacids",value:14},{name:"Others",value:18},
];
const PCOLORS = ["#0EA5E9","#0D9488","#8B5CF6","#F59E0B","#64748B"];
const CATEGORIES = ["Antibiotics","Analgesics","Antacids","Antidiabetics","Antihistamines","Cardiovascular","Dermatology","ENT","Vitamins","Others"];
const UNITS = ["Strip","Tablet","Capsule","Bottle","Injection","Cream","Syrup","Drops"];

/* ── HELPERS ────────────────────────────────────────────────────────────────── */
const fmt = (n) => "Rs" + Number(n).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
const today = () => new Date().toISOString().split("T")[0];
const daysUntilExpiry = (exp) => {
  const d = new Date(exp+"-01") - new Date();
  return Math.ceil(d/(1000*60*60*24));
};
const expiryBadge = (exp) => {
  const d = daysUntilExpiry(exp);
  if(d<0) return {label:"Expired",bg:C.dangerBg,color:C.danger,border:C.dangerBorder};
  if(d<60) return {label:"Exp. Soon",bg:C.warningBg,color:C.warning,border:C.warningBorder};
  return {label:"OK",bg:C.successBg,color:C.success,border:C.successBorder};
};
const stockBadge = (stock,min) => {
  if(stock===0) return {label:"Out of Stock",bg:C.dangerBg,color:C.danger,border:C.dangerBorder};
  if(stock<min) return {label:"Low Stock",bg:C.warningBg,color:C.warning,border:C.warningBorder};
  return {label:"In Stock",bg:C.successBg,color:C.success,border:C.successBorder};
};
const statusBadge = (s) => {
  const m={Received:{bg:C.successBg,color:C.success,border:C.successBorder},
    Pending:{bg:C.warningBg,color:C.warning,border:C.warningBorder},
    Cancelled:{bg:C.dangerBg,color:C.danger,border:C.dangerBorder},
    Active:{bg:C.successBg,color:C.success,border:C.successBorder},
    Inactive:{bg:C.dangerBg,color:C.danger,border:C.dangerBorder}};
  return m[s]||{bg:C.infoBg,color:C.info,border:C.infoBorder};
};

/* Helper: compute GST breakdown from cart items after discount */
function computeGstBreakdown(cartItems, discountPct) {
  const subtotal = cartItems.reduce((a,i)=>a+i.price*i.qty, 0);
  const discAmt = +(subtotal * discountPct / 100).toFixed(2);
  const afterDiscount = subtotal - discAmt;

  // Group by GST rate
  const groups = {};
  cartItems.forEach(item => {
    const rate = item.gst != null ? item.gst : 5;
    const lineTotal = item.price * item.qty;
    // Proportional discount for this item
    const lineAfterDisc = subtotal > 0 ? lineTotal * (afterDiscount / subtotal) : 0;
    if (!groups[rate]) groups[rate] = 0;
    groups[rate] += lineAfterDisc;
  });

  const breakdown = [];
  Object.entries(groups).forEach(([rate, base]) => {
    const r = +rate;
    if (r === 0) return; // 0% GST items contribute no tax
    const gstAmt = +(base * r / (100 + r)).toFixed(2);
    if (gstAmt > 0) breakdown.push({ rate: r, gstAmt });
  });
  breakdown.sort((a,b)=>a.rate-b.rate);
  return breakdown;
}

/* ── SIDEBAR ────────────────────────────────────────────────────────────────── */
const NAV = [
  {id:"dashboard",icon:LayoutDashboard,label:"Dashboard"},
  {id:"inventory",icon:Package,label:"Inventory"},
  {id:"pos",icon:ShoppingCart,label:"Point of Sale"},
  {id:"sales",icon:FileText,label:"Sales History"},
  {id:"purchases",icon:Truck,label:"Purchase Orders"},
  {id:"suppliers",icon:Building2,label:"Suppliers"},
  {id:"customers",icon:Users,label:"Customers"},
  {id:"expiry",icon:AlertTriangle,label:"Expiry Tracker"},
  {id:"reports",icon:BarChart2,label:"Reports"},
  {id:"employees",icon:UserCircle,label:"Employees"},
  {id:"settings",icon:Settings,label:"Settings"},
];

function Sidebar({active,onNav,open,onToggle,lowStockCount,expiryCount,ownerName}){
  return(
    <div style={{width:open?220:60,background:C.sidebar,display:"flex",flexDirection:"column",height:"100vh",transition:"width 0.2s",flexShrink:0,overflow:"hidden",zIndex:100}}>
      <div style={{padding:"14px 12px",borderBottom:`1px solid ${C.sidebarHover}`,display:"flex",alignItems:"center",gap:10,minHeight:60}}>
  {open&&<div style={{width:34,height:34,borderRadius:8,background:C.primary,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
    <Pill size={18} color="#fff"/>
  </div>}
        
        <div style={{marginLeft:"auto",cursor:"pointer",color:"#94A3B8"}} onClick={onToggle}>
          {open?<X size={16}/>:<Menu size={16}/>}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"8px 0"}}>
        {NAV.map(n=>{
          const Icon=n.icon;const isAct=active===n.id;
          const badge=(n.id==="inventory"&&lowStockCount>0)?lowStockCount:(n.id==="expiry"&&expiryCount>0)?expiryCount:0;
          return(
            <div key={n.id} onClick={()=>onNav(n.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",cursor:"pointer",background:isAct?C.sidebarActive:"transparent",borderLeft:isAct?`3px solid ${C.primary}`:"3px solid transparent",margin:"1px 0",transition:"background 0.15s",position:"relative"}}>
              <Icon size={18} color={isAct?C.primary:"#94A3B8"} style={{flexShrink:0}}/>
              {open&&<span style={{color:isAct?"#fff":"#CBD5E1",fontSize:13,fontWeight:isAct?600:400,flex:1}}>{n.label}</span>}
              {open&&badge>0&&<span style={{background:C.danger,color:"#fff",borderRadius:10,fontSize:10,fontWeight:700,padding:"1px 6px",minWidth:18,textAlign:"center"}}>{badge}</span>}
            </div>
          );
        })}
      </div>
      <div style={{padding:"12px",borderTop:`1px solid ${C.sidebarHover}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:30,height:30,borderRadius:"50%",background:C.sidebarActive,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <UserCircle size={16} color={C.primary}/>
          </div>
          {open&&<div><div style={{color:"#fff",fontSize:12,fontWeight:600}}>{ownerName||"user "}</div><div style={{color:"#64748B",fontSize:11}}>Manager</div></div>}
        </div>
      </div>
    </div>
  );
}

/* ── MODAL ──────────────────────────────────────────────────────────────────── */
function Modal({title,onClose,children,width=520}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#fff",borderRadius:14,width:"100%",maxWidth:width,maxHeight:"90vh",overflow:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"#fff",zIndex:1}}>
          <span style={{fontWeight:700,fontSize:16,color:C.text}}>{title}</span>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:4}}><X size={18}/></button>
        </div>
        <div style={{padding:20}}>{children}</div>
      </div>
    </div>
  );
}

function Field({label,children}){
  return <div style={{marginBottom:14}}><label style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:5}}>{label}</label>{children}</div>;
}

/* ── STAT CARD ──────────────────────────────────────────────────────────────── */
function StatCard({icon:Icon,label,value,sub,color,bg}){
  return(
    <div style={{...sCard,display:"flex",flexDirection:"column",gap:8}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:12,color:C.muted,fontWeight:600}}>{label}</span>
        <div style={{width:36,height:36,borderRadius:10,background:bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Icon size={18} color={color}/>
        </div>
      </div>
      <div style={{fontSize:24,fontWeight:700,color:C.text,lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:12,color:C.muted}}>{sub}</div>}
    </div>
  );
}

/* ── PAGE HEADER ────────────────────────────────────────────────────────────── */
function PageHeader({title,sub,children}){
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
      <div>
        <h1 style={{fontSize:22,fontWeight:700,color:C.text,margin:0}}>{title}</h1>
        {sub&&<p style={{fontSize:13,color:C.muted,margin:"3px 0 0"}}>{sub}</p>}
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{children}</div>
    </div>
  );
}

function SearchBar({value,onChange,placeholder}){
  return(
    <div style={{position:"relative",flex:1,maxWidth:320}}>
      <Search size={14} color={C.muted} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}/>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||"Search..."} style={{...sInp,paddingLeft:32,minWidth:200}}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════════════════════════════ */
function Dashboard({medicines,sales,suppliers}){
  const todaySales = sales.filter(s=>s.date===today());
  const todayRev = todaySales.reduce((a,s)=>a+s.total,0);
  const lowStock = medicines.filter(m=>m.stock<m.min);
  const expiringSoon = medicines.filter(m=>daysUntilExpiry(m.expiry)<60&&daysUntilExpiry(m.expiry)>0);
  const totalMeds = medicines.length;
  const recentSales = [...sales].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);

  return(
    <div>
      <PageHeader title="Dashboard" sub={`Welcome back! Today is ${new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}`}/>
      {(lowStock.length>0||expiringSoon.length>0)&&(
        <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
          {lowStock.length>0&&<div style={{flex:1,background:C.warningBg,border:`1px solid ${C.warningBorder}`,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
            <AlertTriangle size={16} color={C.warning}/><span style={{color:C.warning,fontSize:13,fontWeight:600}}>{lowStock.length} medicines are low on stock!</span>
          </div>}
          {expiringSoon.length>0&&<div style={{flex:1,background:C.dangerBg,border:`1px solid ${C.dangerBorder}`,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
            <AlertCircle size={16} color={C.danger}/><span style={{color:C.danger,fontSize:13,fontWeight:600}}>{expiringSoon.length} medicines expiring in 60 days!</span>
          </div>}
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:20}}>
        <StatCard icon={DollarSign} label="Today's Revenue" value={fmt(todayRev)} sub={`${todaySales.length} sales today`} color={C.primary} bg={C.primaryBg}/>
        <StatCard icon={Package} label="Total Medicines" value={totalMeds} sub={`${lowStock.length} low stock`} color={C.teal} bg={C.tealBg}/>
        <StatCard icon={AlertTriangle} label="Low Stock" value={lowStock.length} sub="Need reorder" color={C.warning} bg={C.warningBg}/>
        <StatCard icon={AlertCircle} label="Expiring Soon" value={expiringSoon.length} sub="Within 60 days" color={C.danger} bg={C.dangerBg}/>
        <StatCard icon={Users} label="Total Customers" value="7" sub="Active patients" color="#8B5CF6" bg="#EDE9FE"/>
        <StatCard icon={TrendingUp} label="This Month" value={fmt(428000)} sub="↑ 8.2% vs last month" color={C.success} bg={C.successBg}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16,marginBottom:20}}>
        <div style={sCard}>
          <div style={{fontWeight:600,color:C.text,marginBottom:16,fontSize:14}}>Revenue & Profit (Last 7 Months)</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={CHART_DATA} margin={{top:0,right:0,left:-20,bottom:0}}>
              <defs>
                <linearGradient id="cSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.primary} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={C.primary} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="cProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.teal} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={C.teal} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
              <XAxis dataKey="month" tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false} tickFormatter={v=>"Rs"+v/1000+"k"}/>
              <Tooltip formatter={(v)=>fmt(v)} contentStyle={{borderRadius:8,border:`1px solid ${C.border}`,fontSize:12}}/>
              <Area type="monotone" dataKey="sales" stroke={C.primary} strokeWidth={2} fill="url(#cSales)" name="Sales"/>
              <Area type="monotone" dataKey="profit" stroke={C.teal} strokeWidth={2} fill="url(#cProfit)" name="Profit"/>
            </AreaChart>
          </ResponsiveContainer>
          <div style={{display:"flex",gap:16,marginTop:8}}>
            <span style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:C.muted}}><span style={{width:10,height:10,borderRadius:2,background:C.primary}}></span>Sales</span>
            <span style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:C.muted}}><span style={{width:10,height:10,borderRadius:2,background:C.teal}}></span>Profit</span>
          </div>
        </div>
        <div style={sCard}>
          <div style={{fontWeight:600,color:C.text,marginBottom:8,fontSize:14}}>Sales by Category</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={CAT_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {CAT_DATA.map((e,i)=><Cell key={i} fill={PCOLORS[i%PCOLORS.length]}/>)}
              </Pie>
              <Tooltip formatter={(v)=>v+"%"} contentStyle={{borderRadius:8,border:`1px solid ${C.border}`,fontSize:12}}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {CAT_DATA.map((d,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:12}}>
                <span style={{display:"flex",alignItems:"center",gap:5,color:C.muted}}><span style={{width:8,height:8,borderRadius:2,background:PCOLORS[i%PCOLORS.length]}}></span>{d.name}</span>
                <span style={{fontWeight:600,color:C.text}}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:16}}>
        <div style={sCard}>
          <div style={{fontWeight:600,color:C.text,marginBottom:12,fontSize:14}}>Recent Sales</div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>
              {["Invoice","Customer","Items","Total","Payment"].map(h=><th key={h} style={sTh}>{h}</th>)}
            </tr></thead>
            <tbody>{recentSales.map(s=>(
              <tr key={s.id}>
                <td style={{...sTd,color:C.primary,fontWeight:600}}>{s.id}</td>
                <td style={sTd}>{s.customer}</td>
                <td style={sTd}>{s.items.length} item(s)</td>
                <td style={{...sTd,fontWeight:600}}>{fmt(s.total)}</td>
                <td style={sTd}><span style={sBadge(s.payment==="Cash"?C.successBg:s.payment==="UPI"?C.primaryBg:C.infoBg,s.payment==="Cash"?C.success:s.payment==="UPI"?C.primary:C.info,s.payment==="Cash"?C.successBorder:s.payment==="UPI"?C.primaryD:C.infoBorder)}>{s.payment}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={sCard}>
          <div style={{fontWeight:600,color:C.text,marginBottom:12,fontSize:14}}>⚠ Low Stock Alert</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {lowStock.slice(0,5).map(m=>(
              <div key={m.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 10px",background:C.warningBg,borderRadius:8,border:`1px solid ${C.warningBorder}`}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:C.text}}>{m.name}</div>
                  <div style={{fontSize:11,color:C.muted}}>Min: {m.min} strips</div>
                </div>
                <div style={{fontSize:18,fontWeight:700,color:C.warning}}>{m.stock}</div>
              </div>
            ))}
            {lowStock.length===0&&<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:20}}>All medicines adequately stocked ✓</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   INVENTORY
═══════════════════════════════════════════════════════════════════════════════ */
function Inventory({medicines,setMedicines,suppliers}){
  const [search,setSearch]=useState("");
  const [catFilter,setCatFilter]=useState("All");
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({});
  const [viewMed,setViewMed]=useState(null);

  const filtered=useMemo(()=>medicines.filter(m=>
    (catFilter==="All"||m.cat===catFilter)&&
    (m.name.toLowerCase().includes(search.toLowerCase())||m.batch.toLowerCase().includes(search.toLowerCase()))
  ),[medicines,search,catFilter]);

  const openAdd=()=>{setForm({name:"",cat:"Antibiotics",mfr:"",price:"",cost:"",stock:"",min:"",expiry:"",batch:"",unit:"Strip",sid:1,gst:5});setModal("add");};
  const openEdit=(m)=>{setForm({...m});setModal("edit");};
  const save=()=>{
    if(!form.name||!form.price||!form.stock){alert("Fill required fields");return;}
    if(modal==="add"){const id=Date.now();setMedicines(prev=>[...prev,{...form,id,price:+form.price,cost:+form.cost,stock:+form.stock,min:+form.min,sid:+form.sid,gst:+form.gst||5}]);}
    else{setMedicines(prev=>prev.map(m=>m.id===form.id?{...form,price:+form.price,cost:+form.cost,stock:+form.stock,min:+form.min,sid:+form.sid,gst:+form.gst||5}:m));}
    setModal(null);
  };
  const del=(id)=>{if(window.confirm("Delete this medicine?"))setMedicines(prev=>prev.filter(m=>m.id!==id));};

  return(
    <div>
      <PageHeader title="Inventory Management" sub={`${medicines.length} medicines · ${medicines.filter(m=>m.stock<m.min).length} low stock`}>
        <button onClick={openAdd} style={sBtn(C.primary)}><Plus size={14}/>Add Medicine</button>
      </PageHeader>
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name or batch..."/>
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={{...sInp,width:"auto",minWidth:150}}>
          <option value="All">All Categories</option>
          {CATEGORIES.map(c=><option key={c}>{c}</option>)}
        </select>
      </div>
      <div style={sCard}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>
            {["Medicine","Category","Batch","Stock","Price","Cost","GST%","Expiry","Status","Actions"].map(h=><th key={h} style={sTh}>{h}</th>)}
          </tr></thead>
          <tbody>{filtered.map(m=>{
            const sb=stockBadge(m.stock,m.min);const eb=expiryBadge(m.expiry);
            return(
              <tr key={m.id} style={{transition:"background 0.1s"}} onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                <td style={sTd}><div style={{fontWeight:600,color:C.text,fontSize:13}}>{m.name}</div><div style={{fontSize:11,color:C.muted}}>{m.mfr}</div></td>
                <td style={sTd}><span style={sBadge(C.primaryBg,C.primary,C.primaryD)}>{m.cat}</span></td>
                <td style={{...sTd,fontFamily:"monospace",fontSize:12}}>{m.batch}</td>
                <td style={sTd}><span style={{fontWeight:600,color:m.stock<m.min?C.danger:C.text}}>{m.stock}</span><span style={{color:C.muted,fontSize:11}}> {m.unit}</span></td>
                <td style={{...sTd,fontWeight:600}}>{fmt(m.price)}</td>
                <td style={{...sTd,color:C.muted}}>{fmt(m.cost)}</td>
                <td style={sTd}><span style={sBadge(C.infoBg,C.info,C.infoBorder)}>{m.gst||5}%</span></td>
                <td style={sTd}>{m.expiry}</td>
                <td style={sTd}>
                  <div style={{display:"flex",flexDirection:"column",gap:3}}>
                    <span style={sBadge(sb.bg,sb.color,sb.border)}>{sb.label}</span>
                    <span style={sBadge(eb.bg,eb.color,eb.border)}>{eb.label}</span>
                  </div>
                </td>
                <td style={sTd}>
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={()=>setViewMed(m)} style={{...sBtn("#F1F5F9",C.muted,C.border),padding:"5px 8px"}}><Eye size={13}/></button>
                    <button onClick={()=>openEdit(m)} style={{...sBtn(C.primaryBg,C.primary,C.primaryD),padding:"5px 8px"}}><Edit size={13}/></button>
                    <button onClick={()=>del(m.id)} style={{...sBtn(C.dangerBg,C.danger,C.dangerBorder),padding:"5px 8px"}}><Trash2 size={13}/></button>
                  </div>
                </td>
              </tr>
            );
          })}</tbody>
        </table>
        {filtered.length===0&&<div style={{textAlign:"center",padding:40,color:C.muted}}>No medicines found</div>}
      </div>

      {modal&&(
        <Modal title={modal==="add"?"Add New Medicine":"Edit Medicine"} onClose={()=>setModal(null)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={{gridColumn:"1/-1"}}><Field label="Medicine Name *"><input value={form.name||""} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={sInp} placeholder="e.g. Amoxicillin 500mg"/></Field></div>
            <Field label="Category"><select value={form.cat||""} onChange={e=>setForm(f=>({...f,cat:e.target.value}))} style={sInp}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></Field>
            <Field label="Manufacturer"><input value={form.mfr||""} onChange={e=>setForm(f=>({...f,mfr:e.target.value}))} style={sInp} placeholder="Manufacturer name"/></Field>
            <Field label="Selling Price (Rs) *"><input type="number" value={form.price||""} onChange={e=>setForm(f=>({...f,price:e.target.value}))} style={sInp} placeholder="0.00"/></Field>
            <Field label="Cost Price (Rs)"><input type="number" value={form.cost||""} onChange={e=>setForm(f=>({...f,cost:e.target.value}))} style={sInp} placeholder="0.00"/></Field>
            <Field label="GST %">
              <select value={form.gst!=null?form.gst:5} onChange={e=>setForm(f=>({...f,gst:+e.target.value}))} style={sInp}>
                {GST_RATES.map(r=><option key={r} value={r}>{r}%</option>)}
              </select>
            </Field>
            <Field label="Stock Quantity *"><input type="number" value={form.stock||""} onChange={e=>setForm(f=>({...f,stock:e.target.value}))} style={sInp} placeholder="0"/></Field>
            <Field label="Minimum Stock"><input type="number" value={form.min||""} onChange={e=>setForm(f=>({...f,min:e.target.value}))} style={sInp} placeholder="0"/></Field>
            <Field label="Batch No."><input value={form.batch||""} onChange={e=>setForm(f=>({...f,batch:e.target.value}))} style={sInp} placeholder="e.g. AM2408"/></Field>
            <Field label="Expiry (YYYY-MM)"><input type="month" value={form.expiry||""} onChange={e=>setForm(f=>({...f,expiry:e.target.value}))} style={sInp}/></Field>
            <Field label="Unit"><select value={form.unit||""} onChange={e=>setForm(f=>({...f,unit:e.target.value}))} style={sInp}>{UNITS.map(u=><option key={u}>{u}</option>)}</select></Field>
            <Field label="Supplier"><select value={form.sid||""} onChange={e=>setForm(f=>({...f,sid:e.target.value}))} style={sInp}>
              {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select></Field>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:16}}>
            <button onClick={()=>setModal(null)} style={sBtn("#F1F5F9",C.muted,C.border)}>Cancel</button>
            <button onClick={save} style={sBtn(C.primary)}><Save size={14}/>Save Medicine</button>
          </div>
        </Modal>
      )}

      {viewMed&&(
        <Modal title="Medicine Details" onClose={()=>setViewMed(null)} width={460}>
          {[["Name",viewMed.name],["Category",viewMed.cat],["Manufacturer",viewMed.mfr],["Batch No.",viewMed.batch],
            ["Selling Price",fmt(viewMed.price)],["Cost Price",fmt(viewMed.cost)],
            ["GST Rate",(viewMed.gst||5)+"%"],
            ["Margin",((viewMed.price-viewMed.cost)/viewMed.price*100).toFixed(1)+"%"],
            ["Current Stock",viewMed.stock+" "+viewMed.unit],["Min. Stock",viewMed.min+" "+viewMed.unit],
            ["Expiry",viewMed.expiry],["Days to Expiry",daysUntilExpiry(viewMed.expiry)+" days"]
          ].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`,fontSize:13}}>
              <span style={{color:C.muted,fontWeight:500}}>{k}</span>
              <span style={{fontWeight:600,color:C.text}}>{v}</span>
            </div>
          ))}
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   POINT OF SALE  — per-item GST, grouped in billing & PDF
═══════════════════════════════════════════════════════════════════════════════ */
function POS({medicines,setMedicines,sales,setSales,customers,settings}){
  const [search,setSearch]=useState("");
  const [cart,setCart]=useState([]);
  const [customer,setCustomer]=useState("Walk-in");
  const [discount,setDiscount]=useState(0);
  const [payment,setPayment]=useState("Cash");
  const [rx,setRx]=useState(false);
  const [receipt,setReceipt]=useState(null);

  const results=useMemo(()=>search.length>1?medicines.filter(m=>m.name.toLowerCase().includes(search.toLowerCase())&&m.stock>0).slice(0,8):[],[medicines,search]);

  const addToCart=(m)=>{
    setCart(c=>{const e=c.find(i=>i.id===m.id);return e?c.map(i=>i.id===m.id?{...i,qty:Math.min(i.qty+1,m.stock)}:i):[...c,{...m,qty:1,gst:m.gst!=null?m.gst:5}]});
    setSearch("");
  };
  const updateQty=(id,qty)=>{
    const med=medicines.find(m=>m.id===id);
    if(qty<1){removeFromCart(id);return;}
    if(qty>med.stock){alert("Insufficient stock");return;}
    setCart(c=>c.map(i=>i.id===id?{...i,qty}:i));
  };
  const removeFromCart=(id)=>setCart(c=>c.filter(i=>i.id!==id));
const [editItem,setEditItem]=useState(null);
const [editPrice,setEditPrice]=useState("");
const saveEditItem=()=>{
  setCart(c=>c.map(i=>i.id===editItem?{...i,price:+editPrice}:i));
  setEditItem(null);setEditPrice("");
};

  // ── Totals with per-item GST ──
  const subtotal = cart.reduce((a,i)=>a+i.price*i.qty, 0);
  const discAmt = +(subtotal * discount / 100).toFixed(2);
  const afterDiscount = +(subtotal - discAmt).toFixed(2);

  // GST breakdown grouped by rate (GST is inclusive in MRP)
  const gstBreakdown = useMemo(()=>computeGstBreakdown(cart, discount),[cart,discount]);
  const totalGst = +gstBreakdown.reduce((a,g)=>a+g.gstAmt,0).toFixed(2);
  const total = afterDiscount; // MRP already includes GST

  const checkout=()=>{
    if(cart.length===0){alert("Cart is empty");return;}
    const inv={
      id:"INV-"+(sales.length+1).toString().padStart(3,"0"),
      date:today(),customer,
      items:cart.map(i=>({name:i.name,batch:i.batch||"",qty:i.qty,price:i.price,gst:i.gst!=null?i.gst:5})),
      subtotal,discount:discAmt,tax:totalGst,gstBreakdown,total,payment,rx
    };
    setSales(s=>[inv,...s]);
    setMedicines(ms=>ms.map(m=>{const ci=cart.find(i=>i.id===m.id);return ci?{...m,stock:m.stock-ci.qty}:m;}));
    setReceipt(inv);
    setCart([]);setDiscount(0);setCustomer("Walk-in");setPayment("Cash");setRx(false);
  };

  // ── PDF Generation ──
  const generatePDF=()=>{
    const doc=new jsPDF("p","mm","a4");
    let y=15;
    const pw=doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(16);doc.setFont(undefined,"bold");
    doc.text(settings.name,pw/2,y,{align:"center"});y+=8;
    doc.setFontSize(9);doc.setFont(undefined,"normal");
    doc.text(settings.addr,pw/2,y,{align:"center"});y+=5;
    doc.text("Phone: "+settings.phone,pw/2,y,{align:"center"});y+=5;
    doc.text("GST No: "+settings.gst,pw/2,y,{align:"center"});y+=8;

    // Invoice details
    doc.setFontSize(9);
    doc.text("Invoice: "+receipt.id,15,y);
    doc.text("Date: "+receipt.date,pw-60,y);y+=5;
    doc.text("Customer: "+receipt.customer,15,y);
    doc.text("Payment: "+receipt.payment,pw-60,y);y+=8;

    // Divider
    doc.setDrawColor(200,200,200);
    doc.line(15,y,pw-15,y);y+=5;

    // Items table header
    doc.setFontSize(9);doc.setFont(undefined,"bold");
    doc.text("Medicine",15,y);
    doc.text("Qty",90,y,{align:"center"});
    doc.text("GST%",108,y,{align:"center"});
    doc.text("Price",128,y,{align:"right"});
    doc.text("GST Amt",150,y,{align:"right"});
    doc.text("Amount",175,y,{align:"right"});
    y+=4;
    doc.line(15,y,pw-15,y);y+=5;

    // Items rows
    doc.setFont(undefined,"normal");
    receipt.items.forEach(item=>{
      if(y>250){doc.addPage();y=15;}
      const gstRate = item.gst!=null?item.gst:5;
      const lineTotal = item.price*item.qty;
      const lineBase = lineTotal/(1+gstRate/100);
      const lineGst = lineTotal - lineBase;
      doc.text(item.name.substring(0,36),15,y);
      doc.text(item.qty.toString(),90,y,{align:"center"});
      doc.text(gstRate+"%",108,y,{align:"center"});
      doc.text("Rs"+item.price.toFixed(2),128,y,{align:"right"});
      doc.text("Rs"+lineGst.toFixed(2),150,y,{align:"right"});
      doc.text("Rs"+lineTotal.toFixed(2),175,y,{align:"right"});
      y+=6;
    });

    // Divider
    y+=2;doc.setDrawColor(200,200,200);
    doc.line(15,y,pw-15,y);y+=5;

    // Subtotals
    doc.setFontSize(9);doc.setFont(undefined,"normal");
    doc.text("Subtotal (MRP incl. GST)",100,y);
    doc.text("Rs"+receipt.subtotal.toFixed(2),175,y,{align:"right"});y+=5;
    doc.text("Discount ("+discount+"%)"+(receipt.discount>0?" Applied":""),100,y);
    doc.text("-Rs"+receipt.discount.toFixed(2),175,y,{align:"right"});y+=5;

    // GST breakdown per rate
    doc.setFont(undefined,"bold");
    doc.text("GST Breakdown:",15,y);
    doc.setFont(undefined,"normal");y+=5;
    const breakdown=receipt.gstBreakdown||[];
    if(breakdown.length===0){
      doc.text("GST (5% incl.)",100,y);
      doc.text("Rs"+receipt.tax.toFixed(2),175,y,{align:"right"});y+=5;
    } else {
      breakdown.forEach(g=>{
        doc.text(`  GST @ ${g.rate}% (incl.)`,100,y);
        doc.text("Rs"+g.gstAmt.toFixed(2),175,y,{align:"right"});y+=5;
      });
    }
    doc.text("Total GST",100,y);
    doc.text("Rs"+receipt.tax.toFixed(2),175,y,{align:"right"});y+=6;

    // Total
    doc.setFont(undefined,"bold");doc.setFontSize(11);
    doc.setDrawColor(0,0,0);doc.line(100,y,pw-15,y);y+=5;
    doc.text("TOTAL",100,y);
    doc.text("Rs"+receipt.total.toFixed(2),175,y,{align:"right"});y+=10;

    // Footer
    doc.setDrawColor(200,200,200);doc.line(15,y,pw-15,y);y+=8;
    doc.setFont(undefined,"bold");doc.setFontSize(12);
    doc.text("Thank You! Visit Again",pw/2,y,{align:"center"});y+=6;
    doc.setFont(undefined,"italic");doc.setFontSize(8);
    doc.text("Your health is our priority",pw/2,y,{align:"center"});

    doc.save(`Receipt-${receipt.id}.pdf`);
  };

  const shareToWhatsApp=()=>{
    const breakdown=(receipt.gstBreakdown||[]).map(g=>`GST @${g.rate}%: Rs${g.gstAmt.toFixed(2)}`).join("\n")||`GST: Rs${receipt.tax.toFixed(2)}`;
    const msg=`
*${settings.name}*
${settings.addr}
GST: ${settings.gst}

Invoice: ${receipt.id}
Date: ${receipt.date}
Customer: ${receipt.customer}

Items:
${receipt.items.map(i=>`${i.name} x${i.qty} @GST${i.gst!=null?i.gst:5}% = Rs${(i.price*i.qty).toFixed(2)}`).join("\n")}

Subtotal: Rs${receipt.subtotal.toFixed(2)}
Discount: -Rs${receipt.discount.toFixed(2)}
${breakdown}
Total GST: Rs${receipt.tax.toFixed(2)}
Total: Rs${receipt.total.toFixed(2)}

Payment: ${receipt.payment}
`;
    const phone=settings.phone.replace(/[^\d]/g,"");
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`,"_blank");
  };

  // ── Receipt View ──
  if(receipt) return(
    <div>
      <PageHeader title="Receipt Generated" sub={receipt.id}>
        <button onClick={generatePDF} style={sBtn(C.teal)}><FileText size={14}/>Download PDF</button>
        <button onClick={shareToWhatsApp} style={sBtn("#25D366")}><Send size={14}/>Share WhatsApp</button>
        <button onClick={()=>setReceipt(null)} style={sBtn(C.primary)}><ShoppingCart size={14}/>New Sale</button>
      </PageHeader>
      <div style={{maxWidth:520,margin:"0 auto"}}>
        <div style={{...sCard,textAlign:"center",marginBottom:16}}>
          <CheckCircle size={40} color={C.success} style={{margin:"10px auto"}}/>
          <div style={{fontSize:20,fontWeight:700,color:C.text}}>Payment Successful!</div>
          <div style={{color:C.muted,fontSize:13,marginTop:4}}>{receipt.id} · {receipt.date}</div>
        </div>
        <div style={sCard}>
          <div style={{fontWeight:700,fontSize:16,marginBottom:4,textAlign:"center"}}>{settings.name}</div>
          <div style={{fontSize:11,color:C.muted,textAlign:"center",marginBottom:16}}>{settings.addr} · GST: {settings.gst}</div>

          {/* Items with GST badge */}
          <div style={{marginBottom:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:8,padding:"6px 0",borderBottom:`2px solid ${C.border}`,fontSize:11,fontWeight:700,color:C.muted}}>
              <span>MEDICINE</span><span style={{textAlign:"center"}}>GST%</span><span style={{textAlign:"right"}}>AMOUNT</span>
            </div>
            {receipt.items.map((it,i)=>{
              const gstRate=it.gst!=null?it.gst:5;
              return(
                <div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:8,padding:"7px 0",borderBottom:`1px solid ${C.border}`,fontSize:13,alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:600}}>{it.name} × {it.qty}</div>
                    <div style={{fontSize:11,color:C.muted}}>Batch: {it.batch||"N/A"} · Rs{it.price}/unit</div>
                  </div>
                  <span style={{...sBadge(C.infoBg,C.info,C.infoBorder),textAlign:"center"}}>{gstRate}%</span>
                  <span style={{fontWeight:600,textAlign:"right"}}>{fmt(it.price*it.qty)}</span>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div style={{background:"#F8FAFC",borderRadius:8,padding:"10px 12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:13,color:C.muted}}>
              <span>Subtotal</span><span>{fmt(receipt.subtotal)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:13,color:C.muted}}>
              <span>Discount</span><span style={{color:C.success}}>-{fmt(receipt.discount)}</span>
            </div>
            {/* Per-rate GST breakdown */}
            {(receipt.gstBreakdown||[]).map(g=>(
              <div key={g.rate} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:13,color:C.muted}}>
                <span>GST @ {g.rate}% (incl.)</span><span>{fmt(g.gstAmt)}</span>
              </div>
            ))}
            {(!receipt.gstBreakdown||receipt.gstBreakdown.length===0)&&(
              <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:13,color:C.muted}}>
                <span>GST (incl.)</span><span>{fmt(receipt.tax)}</span>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12,color:C.muted,borderTop:`1px dashed ${C.border}`,marginTop:4}}>
              <span>Total GST</span><span style={{fontWeight:600,color:C.text}}>{fmt(receipt.tax)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0 4px",fontSize:16,fontWeight:700,color:C.text,borderTop:`2px solid ${C.border}`,marginTop:6}}>
              <span>Total</span><span style={{color:C.primary}}>{fmt(receipt.total)}</span>
            </div>
          </div>

          <div style={{marginTop:12,padding:"10px",background:C.primaryBg,borderRadius:8,textAlign:"center",fontSize:13,color:C.primary,fontWeight:600}}>
            Paid via {receipt.payment} · Customer: {receipt.customer}
          </div>
        </div>
      </div>
    </div>
  );

  // ── POS Main View ──
  {editItem&&(
  <Modal title="Edit Item Price" onClose={()=>setEditItem(null)} width={340}>
    <Field label="Unit Price (Rs)">
      <input type="number" value={editPrice} onChange={e=>setEditPrice(e.target.value)} style={sInp} autoFocus/>
    </Field>
    <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:16}}>
      <button onClick={()=>setEditItem(null)} style={sBtn("#F1F5F9",C.muted,C.border)}>Cancel</button>
      <button onClick={saveEditItem} style={sBtn(C.primary)}><Save size={14}/>Save</button>
    </div>
  </Modal>
)}
  return(
    <div>
      <PageHeader title="Point of Sale" sub="Create new sale bill"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 360px",gap:16}}>
        {/* Left */}
        <div>
          <div style={{...sCard,marginBottom:12}}>
            <div style={{fontWeight:600,fontSize:14,color:C.text,marginBottom:10}}>Search Medicine</div>
            <div style={{position:"relative"}}>
              <Search size={14} color={C.muted} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Type medicine name..." style={{...sInp,paddingLeft:32}}/>
            </div>
            {results.length>0&&(
              <div style={{marginTop:8,border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden"}}>
                {results.map(m=>(
                  <div key={m.id} onClick={()=>addToCart(m)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",cursor:"pointer",borderBottom:`1px solid ${C.border}`,transition:"background 0.1s"}}
                    onMouseEnter={e=>e.currentTarget.style.background="#F0F7FF"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                    <div>
                      <div style={{fontWeight:600,fontSize:13}}>{m.name}</div>
                      <div style={{fontSize:11,color:C.muted}}>Stock: {m.stock} · Batch: {m.batch} · Exp: {m.expiry||"N/A"} · {m.cat}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={sBadge(C.infoBg,C.info,C.infoBorder)}>GST {m.gst!=null?m.gst:5}%</span>
                      <span style={{fontWeight:700,color:C.primary,fontSize:14}}>{fmt(m.price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart */}
          <div style={sCard}>
            <div style={{fontWeight:600,fontSize:14,color:C.text,marginBottom:10}}>Cart ({cart.length} items)</div>
            {cart.length===0&&<div style={{textAlign:"center",padding:30,color:C.muted}}>Search and add medicines above</div>}
            {cart.map(item=>{
              const gstRate=item.gst!=null?item.gst:5;
              const lineGst=+((item.price*item.qty)*gstRate/(100+gstRate)).toFixed(2);
              return(
                <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:13}}>{item.name}</div>
                    <div style={{fontSize:11,color:C.muted,display:"flex",gap:8,alignItems:"center"}}>
                      <span>Batch: {item.batch||"N/A"}</span>
                      <span>·</span>
                      <span style={{color:C.warning}}>Exp: {item.expiry||"N/A"}</span>
                      <span>·</span>
                      <span>{fmt(item.price)}/unit</span>
                      <span>·</span>
                      <span style={sBadge(C.infoBg,C.info,C.infoBorder)}>GST {gstRate}%</span>
                      <span style={{color:C.muted}}>incl. {fmt(lineGst)}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <button onClick={()=>updateQty(item.id,item.qty-1)} style={{width:26,height:26,borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",cursor:"pointer",fontWeight:700,fontSize:14}}>-</button>
                    <input type="number" value={item.qty} onChange={e=>updateQty(item.id,+e.target.value)} style={{width:45,textAlign:"center",border:`1px solid ${C.border}`,borderRadius:6,padding:"3px",fontSize:13}}/>
                    <button onClick={()=>updateQty(item.id,item.qty+1)} style={{width:26,height:26,borderRadius:6,border:`1px solid ${C.border}`,background:C.primaryBg,cursor:"pointer",fontWeight:700,fontSize:14,color:C.primary}}>+</button>
                  </div>
                  <div style={{width:80,textAlign:"right",fontWeight:700,fontSize:13}}>{fmt(item.price*item.qty)}</div>
                  <button onClick={()=>{setEditItem(item.id);setEditPrice(item.price);}} style={{background:"none",border:"none",cursor:"pointer",color:C.primary,padding:4}}><Edit size={14}/></button>
<button onClick={()=>removeFromCart(item.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.danger,padding:4}}><Trash2 size={14}/></button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: billing */}
        <div>
          <div style={sCard}>
            <div style={{fontWeight:600,fontSize:14,color:C.text,marginBottom:12}}>Billing Details</div>
            <Field label="Customer">
              <select value={customer} onChange={e=>setCustomer(e.target.value)} style={sInp}>
                <option value="Walk-in">Walk-in Customer</option>
                {customers.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Discount (%)">
              <input type="number" min={0} max={100} value={discount} onChange={e=>setDiscount(+e.target.value)} style={sInp}/>
            </Field>
            <Field label="Payment Method">
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                {["Cash","UPI","Card"].map(p=>(
                  <button key={p} onClick={()=>setPayment(p)} style={{...sBtn(payment===p?C.primary:"#F1F5F9",payment===p?"#fff":C.muted,payment===p?C.primary:C.border),justifyContent:"center",padding:"8px"}}>{p}</button>
                ))}
              </div>
            </Field>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <input type="checkbox" id="rx" checked={rx} onChange={e=>setRx(e.target.checked)} style={{width:16,height:16}}/>
              <label htmlFor="rx" style={{fontSize:13,color:C.text,cursor:"pointer"}}>Prescription sale (Rx)</label>
            </div>

            {/* Summary with per-rate GST */}
            <div style={{background:"#F8FAFC",borderRadius:10,padding:12,marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:13,color:C.muted}}>
                <span>Subtotal</span><span>{fmt(subtotal)}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:13,color:C.muted}}>
                <span>Discount ({discount}%)</span><span style={{color:C.success}}>-{fmt(discAmt)}</span>
              </div>
              {gstBreakdown.length>0?(
                gstBreakdown.map(g=>(
                  <div key={g.rate} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:13,color:C.muted}}>
                    <span>GST @ {g.rate}% (incl.)</span><span>{fmt(g.gstAmt)}</span>
                  </div>
                ))
              ):(
                <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:13,color:C.muted}}>
                  <span>GST (incl.)</span><span>{fmt(totalGst)}</span>
                </div>
              )}
              {gstBreakdown.length>1&&(
                <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12,color:C.muted,borderTop:`1px dashed ${C.border}`,marginTop:4}}>
                  <span>Total GST</span><span style={{fontWeight:600,color:C.text}}>{fmt(totalGst)}</span>
                </div>
              )}
              <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0 0",fontSize:16,fontWeight:700,color:C.text,borderTop:`2px solid ${C.border}`,marginTop:6}}>
                <span>Total</span><span style={{color:C.primary}}>{fmt(total)}</span>
              </div>
            </div>

            <button onClick={checkout} style={{...sBtn(C.primary),width:"100%",justifyContent:"center",fontSize:15,padding:"12px"}}>
              <CheckCircle size={16}/>Complete Sale
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SALES HISTORY
═══════════════════════════════════════════════════════════════════════════════ */
function SalesHistory({sales,setSales,settings}){
  const [search,setSearch]=useState("");
  const [sel,setSel]=useState(null);
  const del=(id)=>{if(window.confirm("Delete this invoice?"))setSales(s=>s.filter(x=>x.id!==id));};
  const filtered=sales.filter(s=>s.id.toLowerCase().includes(search.toLowerCase())||s.customer.toLowerCase().includes(search.toLowerCase()));
  const totalRev=sales.reduce((a,s)=>a+s.total,0);

  const generateSalePDF=(s)=>{
    const doc=new jsPDF("p","mm","a4");
    let y=15; const pw=doc.internal.pageSize.getWidth();
    doc.setFontSize(16);doc.setFont(undefined,"bold");
    doc.text((settings?.name||"Pharmacy"),pw/2,y,{align:"center"});y+=8;
    doc.setFontSize(9);doc.setFont(undefined,"normal");
    doc.text(settings?.addr||"",pw/2,y,{align:"center"});y+=5;
    doc.text("GST No: "+(settings?.gst||""),pw/2,y,{align:"center"});y+=8;
    doc.text("Invoice: "+s.id,15,y);doc.text("Date: "+s.date,pw-60,y);y+=5;
    doc.text("Customer: "+s.customer,15,y);doc.text("Payment: "+s.payment,pw-60,y);y+=8;
    doc.setDrawColor(200,200,200);doc.line(15,y,pw-15,y);y+=5;
    doc.setFont(undefined,"bold");
    doc.text("Medicine",15,y);doc.text("Qty",90,y,{align:"center"});
    doc.text("GST%",108,y,{align:"center"});doc.text("Price",128,y,{align:"right"});
    doc.text("Amount",175,y,{align:"right"});y+=4;
    doc.line(15,y,pw-15,y);y+=5;
    doc.setFont(undefined,"normal");
    s.items.forEach(item=>{
      if(y>250){doc.addPage();y=15;}
      const gstRate=item.gst!=null?item.gst:5;
      doc.text(item.name.substring(0,36),15,y);
      doc.text(item.qty.toString(),90,y,{align:"center"});
      doc.text(gstRate+"%",108,y,{align:"center"});
      doc.text("Rs"+item.price.toFixed(2),128,y,{align:"right"});
      doc.text("Rs"+(item.price*item.qty).toFixed(2),175,y,{align:"right"});y+=6;
    });
    y+=2;doc.setDrawColor(200,200,200);doc.line(15,y,pw-15,y);y+=5;
    doc.setFontSize(9);doc.setFont(undefined,"normal");
    doc.text("Subtotal",100,y);doc.text("Rs"+s.subtotal.toFixed(2),175,y,{align:"right"});y+=5;
    doc.text("Discount",100,y);doc.text("-Rs"+s.discount.toFixed(2),175,y,{align:"right"});y+=5;
    (s.gstBreakdown||[]).forEach(g=>{
      doc.text("GST @ "+g.rate+"% (incl.)",100,y);doc.text("Rs"+g.gstAmt.toFixed(2),175,y,{align:"right"});y+=5;
    });
    if(!s.gstBreakdown||s.gstBreakdown.length===0){
      doc.text("GST (incl.)",100,y);doc.text("Rs"+s.tax.toFixed(2),175,y,{align:"right"});y+=5;
    }
    doc.setFont(undefined,"bold");doc.setFontSize(11);
    doc.line(100,y,pw-15,y);y+=5;
    doc.text("TOTAL",100,y);doc.text("Rs"+s.total.toFixed(2),175,y,{align:"right"});y+=10;
    doc.setDrawColor(200,200,200);doc.line(15,y,pw-15,y);y+=8;
    doc.setFont(undefined,"bold");doc.setFontSize(12);
    doc.text("Thank You! Visit Again",pw/2,y,{align:"center"});
    doc.save("Receipt-"+s.id+".pdf");
  };

  return(
    <div>
      <PageHeader title="Sales History" sub={`${sales.length} invoices · Total: ${fmt(totalRev)}`}/>
      <div style={{display:"flex",gap:10,marginBottom:16}}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search invoice or customer..."/>
      </div>
      <div style={sCard}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>
            {["Invoice","Date","Customer","Items","Subtotal","Discount","Tax","Total","Payment","Rx","Actions"].map(h=><th key={h} style={sTh}>{h}</th>)}
          </tr></thead>
          <tbody>{filtered.map(s=>(
            <tr key={s.id} onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"} onMouseLeave={e=>e.currentTarget.style.background=""}>
              <td style={{...sTd,color:C.primary,fontWeight:600}}>{s.id}</td>
              <td style={sTd}>{s.date}</td>
              <td style={sTd}>{s.customer}</td>
              <td style={sTd}>{s.items.length}</td>
              <td style={sTd}>{fmt(s.subtotal)}</td>
              <td style={{...sTd,color:C.success}}>{fmt(s.discount)}</td>
              <td style={sTd}>{fmt(s.tax)}</td>
              <td style={{...sTd,fontWeight:700}}>{fmt(s.total)}</td>
              <td style={sTd}><span style={sBadge(s.payment==="Cash"?C.successBg:s.payment==="UPI"?C.primaryBg:C.infoBg,s.payment==="Cash"?C.success:s.payment==="UPI"?C.primary:C.info,s.payment==="Cash"?C.successBorder:s.payment==="UPI"?C.primaryD:C.infoBorder)}>{s.payment}</span></td>
              <td style={sTd}>{s.rx?<span style={sBadge(C.warningBg,C.warning,C.warningBorder)}>Rx</span>:<span style={{color:C.muted,fontSize:12}}>—</span>}</td>
              <td style={sTd}>
                <div style={{display:"flex",gap:4}}>
                  <button onClick={()=>setSel(s)} style={{...sBtn(C.primaryBg,C.primary,C.primaryD),padding:"4px 8px",fontSize:12}}><Eye size={12}/>View</button>
                  <button onClick={()=>generateSalePDF(s)} style={{...sBtn(C.teal),padding:"4px 8px",fontSize:12}}><FileText size={12}/>PDF</button>
                  <button onClick={()=>del(s.id)} style={{...sBtn(C.dangerBg,C.danger,C.dangerBorder),padding:"4px 8px",fontSize:12}}><Trash2 size={12}/></button>
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {sel&&(
        <Modal title={`Invoice: ${sel.id}`} onClose={()=>setSel(null)} width={500}>
          <div style={{marginBottom:12,color:C.muted,fontSize:13}}>Date: {sel.date} · Customer: {sel.customer} · Payment: {sel.payment}</div>
          <table style={{width:"100%",borderCollapse:"collapse",marginBottom:12}}>
            <thead><tr>{["Medicine","Qty","GST%","Unit Price","Total"].map(h=><th key={h} style={sTh}>{h}</th>)}</tr></thead>
            <tbody>{sel.items.map((it,i)=>(
              <tr key={i}>
                <td style={sTd}>{it.name}</td>
                <td style={sTd}>{it.qty}</td>
                <td style={sTd}><span style={sBadge(C.infoBg,C.info,C.infoBorder)}>{it.gst!=null?it.gst:5}%</span></td>
                <td style={sTd}>{fmt(it.price)}</td>
                <td style={{...sTd,fontWeight:600}}>{fmt(it.price*it.qty)}</td>
              </tr>
            ))}</tbody>
          </table>
          {[["Subtotal",fmt(sel.subtotal)],["Discount","-"+fmt(sel.discount)]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:13,color:C.muted}}>
              <span>{k}</span><span>{v}</span>
            </div>
          ))}
          {(sel.gstBreakdown||[]).map(g=>(
            <div key={g.rate} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:13,color:C.muted}}>
              <span>GST @ {g.rate}% (incl.)</span><span>{fmt(g.gstAmt)}</span>
            </div>
          ))}
          {(!sel.gstBreakdown||sel.gstBreakdown.length===0)&&(
            <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:13,color:C.muted}}>
              <span>GST (incl.)</span><span>{fmt(sel.tax)}</span>
            </div>
          )}
          <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0 4px",fontSize:15,fontWeight:700,borderTop:`2px solid ${C.border}`,marginTop:4}}>
            <span>Total</span><span style={{color:C.primary}}>{fmt(sel.total)}</span>
          </div>
          <div style={{marginTop:12,display:"flex",justifyContent:"flex-end"}}>
            <button onClick={()=>generateSalePDF(sel)} style={sBtn(C.teal)}><FileText size={14}/>Download PDF</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
/* ═══════════════════════════════════════════════════════════════════════════════
   PURCHASE ORDERS — per-item GST selection + PDF
═══════════════════════════════════════════════════════════════════════════════ */
function PurchaseOrders({pos,setPos,suppliers,medicines,setMedicines}){
  const [modal,setModal]=useState(false);
const del=(id)=>{if(window.confirm("Delete this purchase order?"))setPos(p=>p.filter(o=>o.id!==id));};
  const [form,setForm]=useState({supplier:"",expected:today(),items:[{name:"",batch:"",qty:"",price:"",mrp:"",gst:5}]});
  const [sel,setSel]=useState(null);

  const addItem=()=>setForm(f=>({...f,items:[...f.items,{name:"",batch:"",qty:"",price:"",mrp:"",gst:5}]}));
  const updateItem=(i,k,v)=>setForm(f=>({...f,items:f.items.map((it,idx)=>idx===i?{...it,[k]:v}:it)}));
  const removeItem=(i)=>setForm(f=>({...f,items:f.items.filter((_,idx)=>idx!==i)}));

  // Total: cost × qty × (1 + gst/100) per item
  const poTotal = form.items.reduce((a,i)=>a+(+i.qty||0)*(+i.price||0)*(1+(+i.gst||0)/100),0);

  const save=()=>{
    if(!form.supplier||!form.expected||form.items.some(i=>!i.name||!i.qty)){alert("Fill all required fields");return;}
    const po={
      id:"PO-"+(pos.length+1).toString().padStart(3,"0"),
      date:today(),
      supplier:form.supplier,
      items:form.items.map(i=>({
        name:i.name,
        batch:i.batch||"",
        qty:+i.qty,
        price:+i.price,
        mrp:+i.mrp||0,
        gst:+i.gst||0,
        expiry:i.expiry||""
      })),
      total:+poTotal.toFixed(2),
      status:"Pending",
      expected:form.expected
    };
    setPos(p=>[po,...p]);
    setModal(false);
    setForm({supplier:"",expected:today(),items:[{name:"",batch:"",qty:"",price:"",mrp:"",gst:5,expiry:""}]});
  };

  const updateStatus=(id,status)=>{
    if(status==="Received"){
      const po=pos.find(p=>p.id===id);
      if(po){
        po.items.forEach(item=>{
          const exists=medicines.find(m=>m.name===item.name);
          if(!exists){
            setMedicines(prev=>[...prev,{
              id:Date.now()+Math.random(),
              name:item.name,cat:"Received",mfr:"PO",
              price:item.mrp||item.price,
              cost:item.price,
              stock:item.qty,min:0,
              expiry:item.expiry||"",batch:item.batch||"",
              unit:"Strip",sid:1,
              gst:item.gst||0
            }]);
          } else {
            setMedicines(prev=>prev.map(m=>m.name===item.name?{
              ...m,
              price:item.mrp||m.price,
              cost:item.price,
              stock:m.stock+item.qty,
              gst:item.gst!=null?item.gst:m.gst||5
            }:m));
          }
        });
      }
    }
    setPos(p=>p.map(o=>o.id===id?{...o,status}:o));
  };

  // PDF for PO
  const generatePOPDF=(po)=>{
    const doc=new jsPDF("p","mm","a4");
    let y=15;
    const pw=doc.internal.pageSize.getWidth();

    doc.setFontSize(14);doc.setFont(undefined,"bold");
    doc.text("PURCHASE ORDER",pw/2,y,{align:"center"});y+=8;
    doc.setFontSize(9);doc.setFont(undefined,"normal");
    doc.text(`PO No: ${po.id}`,15,y);
    doc.text(`Date: ${po.date}`,pw-60,y);y+=5;
    doc.text(`Supplier: ${po.supplier}`,15,y);
    doc.text(`Expected: ${po.expected}`,pw-60,y);y+=5;
    doc.text(`Status: ${po.status}`,15,y);y+=8;

    doc.setDrawColor(180,180,180);doc.line(15,y,pw-15,y);y+=5;

    // Header row
    doc.setFontSize(9);doc.setFont(undefined,"bold");
    doc.text("Medicine",15,y);
    doc.text("Batch",72,y);
    doc.text("Qty",98,y,{align:"center"});
    doc.text("Cost",115,y,{align:"right"});
    doc.text("GST%",130,y,{align:"center"});
    doc.text("GST Amt",150,y,{align:"right"});
    doc.text("MRP",164,y,{align:"right"});
    doc.text("Line Total",pw-15,y,{align:"right"});
    y+=4;
    doc.line(15,y,pw-15,y);y+=5;

    let grandTotal=0;
    let totalGstAmt=0;
    doc.setFont(undefined,"normal");
    po.items.forEach(it=>{
      if(y>260){doc.addPage();y=15;}
      const lineBase=(+it.price||0)*(+it.qty||0);
      const gstAmt=+(lineBase*(+it.gst||0)/100).toFixed(2);
      const lineTotal=+(lineBase+gstAmt).toFixed(2);
      grandTotal+=lineTotal;
      totalGstAmt+=gstAmt;

      doc.text(it.name.substring(0,30),15,y);
      doc.text(it.batch||"—",72,y);
      doc.text(String(it.qty),98,y,{align:"center"});
      doc.text("Rs"+it.price.toFixed(2),115,y,{align:"right"});
      doc.text((it.gst||0)+"%",130,y,{align:"center"});
      doc.text("Rs"+gstAmt.toFixed(2),150,y,{align:"right"});
      doc.text("Rs"+(it.mrp||0).toFixed(2),164,y,{align:"right"});
      doc.text("Rs"+lineTotal.toFixed(2),pw-15,y,{align:"right"});
      y+=6;
    });

    y+=2;doc.line(15,y,pw-15,y);y+=5;
    doc.setFont(undefined,"normal");
    doc.text("Total GST:",120,y);
    doc.text("Rs"+totalGstAmt.toFixed(2),pw-15,y,{align:"right"});y+=5;
    doc.setFont(undefined,"bold");doc.setFontSize(11);
    doc.line(120,y,pw-15,y);y+=5;
    doc.text("GRAND TOTAL:",120,y);
    doc.text("Rs"+grandTotal.toFixed(2),pw-15,y,{align:"right"});y+=10;

    // GST Summary by rate
    doc.setFontSize(9);doc.setFont(undefined,"bold");
    doc.text("GST Summary by Rate:",15,y);y+=5;
    doc.setFont(undefined,"normal");
    const gstGroups={};
    po.items.forEach(it=>{
      const r=it.gst||0;
      if(!gstGroups[r])gstGroups[r]=0;
      gstGroups[r]+=(+it.price||0)*(+it.qty||0)*(r/100);
    });
    Object.entries(gstGroups).sort((a,b)=>+a[0]-+b[0]).forEach(([rate,amt])=>{
      doc.text(`  GST @ ${rate}%:  Rs${amt.toFixed(2)}`,15,y);y+=5;
    });

    doc.save(`PO-${po.id}.pdf`);
  };

  return(
    <div>
      <PageHeader title="Purchase Orders" sub={`${pos.length} orders · ${pos.filter(p=>p.status==="Pending").length} pending`}>
        <button onClick={()=>setModal(true)} style={sBtn(C.primary)}><Plus size={14}/>New PO</button>
      </PageHeader>
      <div style={sCard}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>{["PO No.","Date","Supplier","Items","Total","Expected","Status","Actions"].map(h=><th key={h} style={sTh}>{h}</th>)}</tr></thead>
          <tbody>{pos.map(p=>{const sb=statusBadge(p.status);return(
            <tr key={p.id} onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"} onMouseLeave={e=>e.currentTarget.style.background=""}>
              <td style={{...sTd,color:C.primary,fontWeight:600,cursor:"pointer"}} onClick={()=>setSel(p)}>{p.id}</td>
              <td style={sTd}>{p.date}</td>
              <td style={sTd}>{p.supplier}</td>
              <td style={sTd}>{p.items.length}</td>
              <td style={{...sTd,fontWeight:700}}>{fmt(p.total)}</td>
              <td style={sTd}>{p.expected}</td>
              <td style={sTd}><span style={sBadge(sb.bg,sb.color,sb.border)}>{p.status}</span></td>
              <td style={sTd}>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
  <button onClick={()=>generatePOPDF(p)} style={{...sBtn(C.primaryBg,C.primary,C.primaryD),padding:"4px 8px",fontSize:12}}><FileText size={12}/>PDF</button>
  {p.status==="Pending"&&<>
    <button onClick={()=>updateStatus(p.id,"Received")} style={{...sBtn(C.successBg,C.success,C.successBorder),padding:"4px 8px",fontSize:12}}>Receive</button>
    <button onClick={()=>updateStatus(p.id,"Cancelled")} style={{...sBtn(C.dangerBg,C.danger,C.dangerBorder),padding:"4px 8px",fontSize:12}}>Cancel</button>
  </>}
  <button onClick={()=>del(p.id)} style={{...sBtn(C.dangerBg,C.danger,C.dangerBorder),padding:"4px 8px",fontSize:12}}><Trash2 size={12}/></button>
</div>
              </td>
            </tr>
          );})}
          </tbody>
        </table>
      </div>

      {/* New PO Modal */}
      {modal&&(
        <Modal title="New Purchase Order" onClose={()=>setModal(false)} width={820}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <Field label="Supplier *">
              <select value={form.supplier} onChange={e=>setForm(f=>({...f,supplier:e.target.value}))} style={sInp}>
                <option value="">Select supplier</option>
                {suppliers.map(s=><option key={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Expected Delivery *">
              <input type="date" value={form.expected} onChange={e=>setForm(f=>({...f,expected:e.target.value}))} style={sInp} min={today()}/>
            </Field>
          </div>

          <div style={{fontWeight:600,fontSize:13,marginBottom:8,color:C.text}}>Order Items — Set GST % per item</div>

          {/* Column headers for items */}
          <div style={{display:"grid",gridTemplateColumns:"2.2fr 0.85fr 0.6fr 0.55fr 0.8fr 0.8fr 0.65fr 30px",gap:6,marginBottom:4,padding:"0 2px"}}>
  {["Medicine Name","Batch No.","Expiry","Qty","Cost","MRP","GST%",""].map((h,i)=>(
    <div key={i} style={{fontSize:11,fontWeight:700,color:C.muted}}>{h}</div>
  ))}
</div>
          {form.items.map((it,i)=>(
  <div key={i} style={{display:"grid",gridTemplateColumns:"2.2fr 0.85fr 0.6fr 0.55fr 0.8fr 0.8fr 0.65fr 30px",gap:6,marginBottom:8,alignItems:"center"}}>
    <input
      value={it.name}
      onChange={e=>updateItem(i,"name",e.target.value)}
      placeholder="Medicine name"
      style={sInp}
    />
    <input
      value={it.batch||""}
      onChange={e=>updateItem(i,"batch",e.target.value)}
      placeholder="Batch No."
      style={sInp}
    />
    <input
      value={it.expiry&&it.expiry.includes("-")?it.expiry.split("-")[1]+it.expiry.split("-")[0].slice(2):it.expiry||""}
      onChange={e=>{
        const v=e.target.value.replace(/\D/g,"").slice(0,4);
        updateItem(i,"expiry",v.length===4?"20"+v.slice(2)+"-"+v.slice(0,2):v);
      }}
      placeholder="MMYY"
      maxLength={4}
      style={{...sInp,letterSpacing:1,textAlign:"center"}}
    />
    <input
      type="number"
      value={it.qty}
      onChange={e=>updateItem(i,"qty",e.target.value)}
      placeholder="Qty"
      style={sInp}
    />
    <input
      type="number"
      value={it.price}
      onChange={e=>updateItem(i,"price",e.target.value)}
      placeholder="Cost"
      style={sInp}
    />
    <input
      type="number"
      value={it.mrp||""}
      onChange={e=>updateItem(i,"mrp",e.target.value)}
      placeholder="MRP"
      style={sInp}
    />
    <select
      value={it.gst!=null?it.gst:5}
      onChange={e=>updateItem(i,"gst",+e.target.value)}
      style={{...sInp,padding:"8px 4px",fontWeight:600,color:C.info,background:C.infoBg,border:`1px solid ${C.infoBorder}`}}
    >
      {GST_RATES.map(r=><option key={r} value={r}>{r}%</option>)}
    </select>
    <button
      onClick={()=>removeItem(i)}
      style={{background:C.dangerBg,color:C.danger,border:`1px solid ${C.dangerBorder}`,borderRadius:6,padding:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",width:30,height:30,flexShrink:0}}
    >
      <Trash2 size={12}/>
    </button>
  </div>
))}

          <button onClick={addItem} style={{...sBtn("#F1F5F9",C.muted,C.border),marginBottom:16}}><Plus size={13}/>Add Item</button>

          {/* Live total preview */}
          <div style={{background:"#F8FAFC",borderRadius:8,padding:"10px 14px",marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:6}}>Order Summary</div>
            {form.items.filter(i=>i.name&&+i.qty&&+i.price).map((it,i)=>{
              const base=(+it.qty||0)*(+it.price||0);
              const gst=+(base*(+it.gst||0)/100).toFixed(2);
              return(
                <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginBottom:3}}>
                  <span>{it.name||"Item "+(i+1)} × {it.qty}</span>
                  <span>Cost: {fmt(base)} + GST@{it.gst||0}%: {fmt(gst)} = <strong style={{color:C.text}}>{fmt(base+gst)}</strong></span>
                </div>
              );
            })}
            <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:15,color:C.primary,borderTop:`2px solid ${C.border}`,paddingTop:8,marginTop:6}}>
              <span>Grand Total (incl. GST)</span>
              <span>{fmt(poTotal)}</span>
            </div>
          </div>

          <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
            <button onClick={()=>setModal(false)} style={sBtn("#F1F5F9",C.muted,C.border)}>Cancel</button>
            <button onClick={save} style={sBtn(C.primary)}><Save size={14}/>Create PO</button>
          </div>
        </Modal>
      )}

      {/* PO Detail Modal */}
      {sel&&(
        <Modal title={`PO Details: ${sel.id}`} onClose={()=>setSel(null)} width={700}>
          <div style={{display:"flex",gap:20,marginBottom:12,fontSize:13,color:C.muted,flexWrap:"wrap"}}>
            <span><strong>Supplier:</strong> {sel.supplier}</span>
            <span><strong>Date:</strong> {sel.date}</span>
            <span><strong>Expected:</strong> {sel.expected}</span>
            <span><strong>Status:</strong> <span style={sBadge(statusBadge(sel.status).bg,statusBadge(sel.status).color,statusBadge(sel.status).border)}>{sel.status}</span></span>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",marginBottom:12}}>
              <thead><tr>
                {["Medicine","Batch","Expiry","Qty","Cost Price","GST %","GST Amt","MRP","Line Total"].map(h=><th key={h} style={sTh}>{h}</th>)}
              </tr></thead>
              <tbody>{sel.items.map((it,i)=>{
                const base=(+it.price||0)*(+it.qty||0);
                const gstAmt=+(base*(+it.gst||0)/100).toFixed(2);
                const lineTotal=+(base+gstAmt).toFixed(2);
                return(
                  <tr key={i}>
                    <td style={sTd}>{it.name}</td>
                    <td style={{...sTd,fontFamily:"monospace",fontSize:12}}>{it.batch||"—"}</td>
                    <td style={{...sTd,color:it.expiry?C.warning:C.muted,fontWeight:600}}>{it.expiry||"—"}</td>
                    <td style={sTd}>{it.qty}</td>
                    <td style={sTd}>{fmt(it.price)}</td>
                    <td style={sTd}><span style={sBadge(C.infoBg,C.info,C.infoBorder)}>{it.gst||0}%</span></td>
                    <td style={{...sTd,color:C.warning,fontWeight:600}}>{fmt(gstAmt)}</td>
                    <td style={sTd}>{fmt(it.mrp||0)}</td>
                    <td style={{...sTd,fontWeight:600}}>{fmt(lineTotal)}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>

          {/* GST Summary */}
          {(()=>{
            const gstGroups={};
            sel.items.forEach(it=>{
              const r=it.gst||0;
              if(!gstGroups[r])gstGroups[r]=0;
              gstGroups[r]+=(+it.price||0)*(+it.qty||0)*(r/100);
            });
            const entries=Object.entries(gstGroups).sort((a,b)=>+a[0]-+b[0]);
            if(entries.length===0) return null;
            return(
              <div style={{background:"#F8FAFC",borderRadius:8,padding:"10px 14px",marginBottom:12}}>
                <div style={{fontWeight:700,fontSize:12,color:C.muted,marginBottom:6}}>GST SUMMARY</div>
                {entries.map(([rate,amt])=>(
                  <div key={rate} style={{display:"flex",justifyContent:"space-between",fontSize:13,color:C.muted,padding:"3px 0"}}>
                    <span>GST @ {rate}%</span><span style={{fontWeight:600,color:C.text}}>{fmt(amt)}</span>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13,fontWeight:700,borderTop:`1px solid ${C.border}`,paddingTop:6,marginTop:4}}>
                  <span>Total GST</span>
                  <span style={{color:C.warning}}>{fmt(Object.values(gstGroups).reduce((a,b)=>a+b,0))}</span>
                </div>
              </div>
            );
          })()}

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontWeight:700,fontSize:15,borderTop:`2px solid ${C.border}`,paddingTop:10}}>
            <span>Grand Total (incl. GST)</span>
            <span style={{color:C.primary}}>{fmt(sel.total)}</span>
          </div>
          <div style={{marginTop:12,display:"flex",justifyContent:"flex-end"}}>
            <button onClick={()=>generatePOPDF(sel)} style={sBtn(C.teal)}><FileText size={14}/>Download PDF</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SUPPLIERS
═══════════════════════════════════════════════════════════════════════════════ */
function Suppliers({suppliers,setSuppliers}){
  const [search,setSearch]=useState("");
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({});
  const filtered=suppliers.filter(s=>s.name.toLowerCase().includes(search.toLowerCase())||s.contact.toLowerCase().includes(search.toLowerCase()));
  const openAdd=()=>{setForm({name:"",contact:"",phone:"",email:"",addr:"",gst:"",terms:"Net 30",balance:0});setModal("add");};
  const openEdit=(s)=>{setForm({...s});setModal("edit");};
  const save=()=>{
    if(!form.name||!form.phone){alert("Fill required fields");return;}
    if(modal==="add") setSuppliers(s=>[...s,{...form,id:Date.now(),balance:+form.balance||0}]);
    else setSuppliers(s=>s.map(x=>x.id===form.id?{...form,balance:+form.balance||0}:x));
    setModal(null);
  };
  const del=(id)=>{if(window.confirm("Delete supplier?"))setSuppliers(s=>s.filter(x=>x.id!==id));};

  return(
    <div>
      <PageHeader title="Suppliers" sub={`${suppliers.length} registered suppliers`}>
        <button onClick={openAdd} style={sBtn(C.primary)}><Plus size={14}/>Add Supplier</button>
      </PageHeader>
      <div style={{marginBottom:16}}><SearchBar value={search} onChange={setSearch} placeholder="Search suppliers..."/></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:12}}>
        {filtered.map(s=>(
          <div key={s.id} style={sCard}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div>
                <div style={{fontWeight:700,fontSize:14,color:C.text}}>{s.name}</div>
                <div style={{fontSize:12,color:C.muted}}>Contact: {s.contact}</div>
              </div>
              <div style={{display:"flex",gap:4}}>
                <button onClick={()=>openEdit(s)} style={{...sBtn(C.primaryBg,C.primary,C.primaryD),padding:"5px 8px"}}><Edit size={13}/></button>
                <button onClick={()=>del(s.id)} style={{...sBtn(C.dangerBg,C.danger,C.dangerBorder),padding:"5px 8px"}}><Trash2 size={13}/></button>
              </div>
            </div>
            {[{icon:Phone,val:s.phone},{icon:Mail,val:s.email},{icon:MapPin,val:s.addr}].map(({icon:Icon,val})=>(
              <div key={val} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:C.muted,marginBottom:4}}>
                <Icon size={12}/>{val}
              </div>
            ))}
            <div style={{marginTop:10,padding:"8px 10px",background:"#F8FAFC",borderRadius:8,display:"flex",justifyContent:"space-between",fontSize:12}}>
              <span style={{color:C.muted}}>Terms: <strong style={{color:C.text}}>{s.terms}</strong></span>
              <span style={{color:s.balance>0?C.danger:C.success,fontWeight:600}}>{s.balance>0?"Due: "+fmt(s.balance):"Cleared"}</span>
            </div>
          </div>
        ))}
      </div>
      {modal&&<Modal title={modal==="add"?"Add Supplier":"Edit Supplier"} onClose={()=>setModal(null)}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div style={{gridColumn:"1/-1"}}><Field label="Company Name *"><input value={form.name||""} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={sInp} placeholder="Supplier company name"/></Field></div>
          <Field label="Contact Person"><input value={form.contact||""} onChange={e=>setForm(f=>({...f,contact:e.target.value}))} style={sInp}/></Field>
          <Field label="Phone *"><input value={form.phone||""} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} style={sInp}/></Field>
          <Field label="Email"><input value={form.email||""} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={sInp}/></Field>
          <Field label="GST Number"><input value={form.gst||""} onChange={e=>setForm(f=>({...f,gst:e.target.value}))} style={sInp}/></Field>
          <div style={{gridColumn:"1/-1"}}><Field label="Address"><input value={form.addr||""} onChange={e=>setForm(f=>({...f,addr:e.target.value}))} style={sInp}/></Field></div>
          <Field label="Payment Terms"><select value={form.terms||""} onChange={e=>setForm(f=>({...f,terms:e.target.value}))} style={sInp}>{["Net 15","Net 21","Net 30","Net 45","Net 60"].map(t=><option key={t}>{t}</option>)}</select></Field>
          <Field label="Outstanding Balance (Rs)"><input type="number" value={form.balance||0} onChange={e=>setForm(f=>({...f,balance:e.target.value}))} style={sInp}/></Field>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:16}}>
          <button onClick={()=>setModal(null)} style={sBtn("#F1F5F9",C.muted,C.border)}>Cancel</button>
          <button onClick={save} style={sBtn(C.primary)}><Save size={14}/>Save</button>
        </div>
      </Modal>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   CUSTOMERS
═══════════════════════════════════════════════════════════════════════════════ */
function Customers({customers,setCustomers}){
  const [search,setSearch]=useState("");
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({});
  const filtered=customers.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.phone.includes(search));
  const openAdd=()=>{setForm({name:"",phone:"",email:"",addr:"",points:0,total:0});setModal("add");};
  const openEdit=(c)=>{setForm({...c});setModal("edit");};
  const save=()=>{
    if(!form.name||!form.phone){alert("Fill required fields");return;}
    if(modal==="add") setCustomers(c=>[...c,{...form,id:Date.now(),points:+form.points||0,total:+form.total||0}]);
    else setCustomers(c=>c.map(x=>x.id===form.id?{...form,points:+form.points||0,total:+form.total||0}:x));
    setModal(null);
  };
  const del=(id)=>{if(window.confirm("Delete customer?"))setCustomers(c=>c.filter(x=>x.id!==id));};

  return(
    <div>
      <PageHeader title="Customers" sub={`${customers.length} registered customers`}>
        <button onClick={openAdd} style={sBtn(C.primary)}><Plus size={14}/>Add Customer</button>
      </PageHeader>
      <div style={{marginBottom:16}}><SearchBar value={search} onChange={setSearch} placeholder="Search by name or phone..."/></div>
      <div style={sCard}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>{["Customer","Phone","Email","Address","Loyalty Points","Total Purchases","Actions"].map(h=><th key={h} style={sTh}>{h}</th>)}</tr></thead>
          <tbody>{filtered.map(c=>(
            <tr key={c.id} onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"} onMouseLeave={e=>e.currentTarget.style.background=""}>
              <td style={sTd}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:C.primaryBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:C.primary,flexShrink:0}}>{c.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
                  <span style={{fontWeight:600,fontSize:13}}>{c.name}</span>
                </div>
              </td>
              <td style={sTd}>{c.phone}</td>
              <td style={sTd}>{c.email||"—"}</td>
              <td style={sTd}>{c.addr}</td>
              <td style={sTd}><span style={{display:"flex",alignItems:"center",gap:4,color:"#F59E0B",fontWeight:600}}><Star size={12}/>{c.points}</span></td>
              <td style={{...sTd,fontWeight:700}}>{fmt(c.total)}</td>
              <td style={sTd}>
                <div style={{display:"flex",gap:4}}>
                  <button onClick={()=>openEdit(c)} style={{...sBtn(C.primaryBg,C.primary,C.primaryD),padding:"5px 8px"}}><Edit size={13}/></button>
                  <button onClick={()=>del(c.id)} style={{...sBtn(C.dangerBg,C.danger,C.dangerBorder),padding:"5px 8px"}}><Trash2 size={13}/></button>
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {modal&&<Modal title={modal==="add"?"Add Customer":"Edit Customer"} onClose={()=>setModal(null)}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div style={{gridColumn:"1/-1"}}><Field label="Full Name *"><input value={form.name||""} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={sInp}/></Field></div>
          <Field label="Phone *"><input value={form.phone||""} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} style={sInp}/></Field>
          <Field label="Email"><input value={form.email||""} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={sInp}/></Field>
          <div style={{gridColumn:"1/-1"}}><Field label="Address"><input value={form.addr||""} onChange={e=>setForm(f=>({...f,addr:e.target.value}))} style={sInp}/></Field></div>
          <Field label="Loyalty Points"><input type="number" value={form.points||0} onChange={e=>setForm(f=>({...f,points:e.target.value}))} style={sInp}/></Field>
          <Field label="Total Purchases (Rs)"><input type="number" value={form.total||0} onChange={e=>setForm(f=>({...f,total:e.target.value}))} style={sInp}/></Field>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:16}}>
          <button onClick={()=>setModal(null)} style={sBtn("#F1F5F9",C.muted,C.border)}>Cancel</button>
          <button onClick={save} style={sBtn(C.primary)}><Save size={14}/>Save</button>
        </div>
      </Modal>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   EXPIRY TRACKER
═══════════════════════════════════════════════════════════════════════════════ */
function ExpiryTracker({medicines}){
  const [filter,setFilter]=useState("All");
  const sorted=[...medicines].sort((a,b)=>new Date(a.expiry+"-01")-new Date(b.expiry+"-01"));
  const filtered=sorted.filter(m=>{
    const d=daysUntilExpiry(m.expiry);
    if(filter==="Expired") return d<=0;
    if(filter==="30") return d>0&&d<=30;
    if(filter==="60") return d>0&&d<=60;
    if(filter==="90") return d>0&&d<=90;
    return true;
  });
  const expired=medicines.filter(m=>daysUntilExpiry(m.expiry)<=0).length;
  const in30=medicines.filter(m=>{const d=daysUntilExpiry(m.expiry);return d>0&&d<=30;}).length;
  const in60=medicines.filter(m=>{const d=daysUntilExpiry(m.expiry);return d>30&&d<=60;}).length;

  return(
    <div>
      <PageHeader title="Expiry Tracker" sub="Monitor medicine expiry dates"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:16}}>
        <StatCard icon={AlertCircle} label="Expired" value={expired} color={C.danger} bg={C.dangerBg} sub="Remove from shelf"/>
        <StatCard icon={AlertTriangle} label="Expiring in 30d" value={in30} color={C.warning} bg={C.warningBg} sub="Urgent attention"/>
        <StatCard icon={Clock} label="Expiring in 60d" value={in60} color="#D97706" bg="#FEF3C7" sub="Plan ahead"/>
        <StatCard icon={CheckCircle} label="Safe Stock" value={medicines.length-expired-in30-in60} color={C.success} bg={C.successBg} sub="Well within date"/>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {["All","Expired","30","60","90"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{...sBtn(filter===f?C.primary:"#F1F5F9",filter===f?"#fff":C.muted,filter===f?C.primary:C.border)}}>
            {f==="All"?"All":`${f==="Expired"?"Expired":"≤"+f+" days"}`}
          </button>
        ))}
      </div>
      <div style={sCard}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>{["Medicine","Category","Batch","Expiry Date","Days Left","Stock","Status"].map(h=><th key={h} style={sTh}>{h}</th>)}</tr></thead>
          <tbody>{filtered.map(m=>{
            const d=daysUntilExpiry(m.expiry);const eb=expiryBadge(m.expiry);
            return(
              <tr key={m.id} onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                <td style={sTd}><div style={{fontWeight:600}}>{m.name}</div><div style={{fontSize:11,color:C.muted}}>{m.mfr}</div></td>
                <td style={sTd}>{m.cat}</td>
                <td style={{...sTd,fontFamily:"monospace",fontSize:12}}>{m.batch}</td>
                <td style={sTd}>{m.expiry}</td>
                <td style={{...sTd,fontWeight:700,color:d<=0?C.danger:d<=30?C.warning:C.text}}>
                  {d<=0?"EXPIRED":`${d} days`}
                </td>
                <td style={sTd}>{m.stock} {m.unit}</td>
                <td style={sTd}><span style={sBadge(eb.bg,eb.color,eb.border)}>{eb.label}</span></td>
              </tr>
            );
          })}</tbody>
        </table>
        {filtered.length===0&&<div style={{textAlign:"center",padding:40,color:C.muted}}>No medicines match this filter</div>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   REPORTS
═══════════════════════════════════════════════════════════════════════════════ */
function Reports({sales,medicines}){
  const totalRev=sales.reduce((a,s)=>a+s.total,0);
  const totalTax=sales.reduce((a,s)=>a+s.tax,0);
  const avgBill=sales.length?totalRev/sales.length:0;
  const topMeds=[...medicines].sort((a,b)=>(b.price-b.cost)*(b.price)-(a.price-a.cost)*(a.price)).slice(0,5);
  const payMethodData=[
    {name:"Cash",value:sales.filter(s=>s.payment==="Cash").length},
    {name:"UPI",value:sales.filter(s=>s.payment==="UPI").length},
    {name:"Card",value:sales.filter(s=>s.payment==="Card").length},
  ];
  const PAY_COLORS=["#16A34A","#0EA5E9","#8B5CF6"];

  return(
    <div>
      <PageHeader title="Reports & Analytics" sub="Business insights and performance metrics"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:20}}>
        <StatCard icon={DollarSign} label="Total Revenue" value={fmt(totalRev)} sub="All time" color={C.primary} bg={C.primaryBg}/>
        <StatCard icon={TrendingUp} label="Avg. Bill Value" value={fmt(avgBill)} sub={`${sales.length} invoices`} color={C.teal} bg={C.tealBg}/>
        <StatCard icon={Activity} label="Total Tax Collected" value={fmt(totalTax)} sub="All GST rates" color="#8B5CF6" bg="#EDE9FE"/>
        <StatCard icon={FileText} label="Rx Sales" value={sales.filter(s=>s.rx).length} sub={`${sales.length?Math.round(sales.filter(s=>s.rx).length/sales.length*100):0}% of total`} color={C.warning} bg={C.warningBg}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16,marginBottom:16}}>
        <div style={sCard}>
          <div style={{fontWeight:600,fontSize:14,marginBottom:12}}>Monthly Revenue & Profit</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={CHART_DATA} margin={{top:0,right:0,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
              <XAxis dataKey="month" tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false} tickFormatter={v=>"Rs"+v/1000+"k"}/>
              <Tooltip formatter={v=>fmt(v)} contentStyle={{borderRadius:8,border:`1px solid ${C.border}`,fontSize:12}}/>
              <Bar dataKey="sales" fill={C.primary} radius={[4,4,0,0]} name="Sales"/>
              <Bar dataKey="profit" fill={C.teal} radius={[4,4,0,0]} name="Profit"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={sCard}>
          <div style={{fontWeight:600,fontSize:14,marginBottom:8}}>Payment Methods</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={payMethodData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name,value})=>`${name}: ${value}`} labelLine={false}>
                {payMethodData.map((e,i)=><Cell key={i} fill={PAY_COLORS[i]}/>)}
              </Pie>
              <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${C.border}`,fontSize:12}}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:8}}>
            {payMethodData.map((d,i)=>(
              <div key={d.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:12}}>
                <span style={{display:"flex",alignItems:"center",gap:5,color:C.muted}}><span style={{width:10,height:10,borderRadius:2,background:PAY_COLORS[i]}}></span>{d.name}</span>
                <span style={{fontWeight:600}}>{d.value} sales</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={sCard}>
          <div style={{fontWeight:600,fontSize:14,marginBottom:12}}>Top Margin Products</div>
          {topMeds.map((m,i)=>{
            const margin=((m.price-m.cost)/m.price*100).toFixed(1);
            return(
              <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<topMeds.length-1?`1px solid ${C.border}`:"none"}}>
                <div style={{width:24,height:24,borderRadius:6,background:C.primaryBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:C.primary,flexShrink:0}}>{i+1}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600}}>{m.name}</div>
                  <div style={{fontSize:11,color:C.muted}}>{m.cat} · GST {m.gst||5}%</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:700,color:C.success,fontSize:14}}>{margin}%</div>
                  <div style={{fontSize:11,color:C.muted}}>margin</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={sCard}>
          <div style={{fontWeight:600,fontSize:14,marginBottom:12}}>Sales Summary by Category</div>
          {CAT_DATA.map((d,i)=>(
            <div key={d.name} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                <span style={{fontWeight:500}}>{d.name}</span>
                <span style={{fontWeight:600,color:PCOLORS[i]}}>{d.value}%</span>
              </div>
              <div style={{height:8,background:C.border,borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${d.value}%`,background:PCOLORS[i],borderRadius:4,transition:"width 0.5s"}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   EMPLOYEES
═══════════════════════════════════════════════════════════════════════════════ */
function Employees({employees,setEmployees}){
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({});
  const ROLES=["Manager","Pharmacist","Cashier","Store Assistant","Delivery Staff"];

  const openAdd=()=>{setForm({name:"",role:"Pharmacist",phone:"",email:"",salary:"",joined:today(),status:"Active"});setModal("add");};
  const openEdit=(e)=>{setForm({...e});setModal("edit");};
  const save=()=>{
    if(!form.name||!form.phone){alert("Fill required fields");return;}
    if(modal==="add") setEmployees(e=>[...e,{...form,id:Date.now(),salary:+form.salary||0}]);
    else setEmployees(e=>e.map(x=>x.id===form.id?{...form,salary:+form.salary||0}:x));
    setModal(null);
  };
  const del=(id)=>{if(window.confirm("Remove employee?"))setEmployees(e=>e.filter(x=>x.id!==id));};

  return(
    <div>
      <PageHeader title="Employee Management" sub={`${employees.length} staff members · ${employees.filter(e=>e.status==="Active").length} active`}>
        <button onClick={openAdd} style={sBtn(C.primary)}><Plus size={14}/>Add Employee</button>
      </PageHeader>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
        {employees.map(e=>{const sb=statusBadge(e.status);return(
          <div key={e.id} style={sCard}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <div style={{width:44,height:44,borderRadius:"50%",background:C.primaryBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:C.primary,flexShrink:0}}>
                  {e.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:14}}>{e.name}</div>
                  <span style={sBadge(C.primaryBg,C.primary,C.primaryD)}>{e.role}</span>
                </div>
              </div>
              <span style={sBadge(sb.bg,sb.color,sb.border)}>{e.status}</span>
            </div>
            {[{icon:Phone,v:e.phone},{icon:Mail,v:e.email},{icon:Calendar,v:"Joined: "+e.joined}].map(({icon:Icon,v})=>(
              <div key={v} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:C.muted,marginBottom:4}}><Icon size={12}/>{v}</div>
            ))}
            <div style={{marginTop:10,padding:"8px 10px",background:"#F8FAFC",borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,color:C.muted}}>Monthly Salary</span>
              <span style={{fontWeight:700,color:C.text,fontSize:14}}>{fmt(e.salary)}</span>
            </div>
            <div style={{display:"flex",gap:6,marginTop:10}}>
              <button onClick={()=>openEdit(e)} style={{...sBtn(C.primaryBg,C.primary,C.primaryD),flex:1,justifyContent:"center"}}><Edit size={13}/>Edit</button>
              <button onClick={()=>del(e.id)} style={{...sBtn(C.dangerBg,C.danger,C.dangerBorder),padding:"8px 10px"}}><Trash2 size={13}/></button>
            </div>
          </div>
        );})}
      </div>
      {modal&&<Modal title={modal==="add"?"Add Employee":"Edit Employee"} onClose={()=>setModal(null)}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div style={{gridColumn:"1/-1"}}><Field label="Full Name *"><input value={form.name||""} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={sInp}/></Field></div>
          <Field label="Role"><select value={form.role||""} onChange={e=>setForm(f=>({...f,role:e.target.value}))} style={sInp}>{ROLES.map(r=><option key={r}>{r}</option>)}</select></Field>
          <Field label="Status"><select value={form.status||""} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={sInp}><option>Active</option><option>Inactive</option></select></Field>
          <Field label="Phone *"><input value={form.phone||""} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} style={sInp}/></Field>
          <Field label="Email"><input value={form.email||""} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={sInp}/></Field>
          <Field label="Monthly Salary (Rs)"><input type="number" value={form.salary||""} onChange={e=>setForm(f=>({...f,salary:e.target.value}))} style={sInp}/></Field>
          <Field label="Date of Joining"><input type="date" value={form.joined||""} onChange={e=>setForm(f=>({...f,joined:e.target.value}))} style={sInp}/></Field>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:16}}>
          <button onClick={()=>setModal(null)} style={sBtn("#F1F5F9",C.muted,C.border)}>Cancel</button>
          <button onClick={save} style={sBtn(C.primary)}><Save size={14}/>Save</button>
        </div>
      </Modal>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SETTINGS
═══════════════════════════════════════════════════════════════════════════════ */
function AppSettings({settings,setSettings,exportBackup,importBackup}){
  const DEFAULTS={name:"HealthPlus Pharmacy",owner:"user ",phone:"8050578799",email:"info@testin",addr:"MG Road, Bengaluru - 560001",gst:"29ABCDE1234F1Z5",license:"DL-2024-12345",dl:"PH-KA-2024-001"};
  const [store,setStore]=useState(settings||DEFAULTS);
  const [saved,setSaved]=useState(false);
  const save=()=>{localStorage.setItem("settings",JSON.stringify(store));setSettings(store);setSaved(true);setTimeout(()=>setSaved(false),2500);};
  const f=(k)=><Field label={k[0]}><input value={store[k[1]]||""} onChange={e=>setStore(s=>({...s,[k[1]]:e.target.value}))} style={sInp}/></Field>;
  return(
    <div>
      <PageHeader title="Settings" sub="Configure your store information"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={sCard}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:14,color:C.text,display:"flex",alignItems:"center",gap:6}}><Building2 size={16} color={C.primary}/>Store Information</div>
          {[["Store Name","name"],["Owner/Manager","owner"],["Phone","phone"],["Email","email"]].map(k=>f(k))}
          <Field label="Address"><textarea value={store.addr||""} onChange={e=>setStore(s=>({...s,addr:e.target.value}))} style={{...sInp,resize:"vertical",minHeight:60}}/></Field>
        </div>
        <div>
          <div style={{...sCard,marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:14,color:C.text,display:"flex",alignItems:"center",gap:6}}><FileText size={16} color={C.primary}/>Legal & Compliance</div>
            {[["GST Number","gst"],["Drug License No.","license"],["DL No.","dl"]].map(k=>f(k))}
          </div>
          <div style={{...sCard,background:C.primaryBg,border:`1px solid ${C.primaryD}`}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:8,color:C.primary}}>About MedStore Pro</div>
            <div style={{fontSize:13,color:C.muted,lineHeight:1.6}}>
              <div>Version: 2.2.0</div>
              <div>Platform: Windows & Android</div>
              <div>License: Medical Retail Edition</div>
              <div style={{marginTop:8}}>Per-item GST support with multi-rate breakdown in POS, receipts, and PDF invoices.</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{marginTop:16,display:"flex",gap:8,alignItems:"center"}}>
        <button onClick={save} style={sBtn(C.primary)}><Save size={14}/>Save Settings</button>
        <button onClick={exportBackup} style={sBtn("#F1F5F9",C.muted,C.border)}>⬇ Export Backup</button>
        <label style={{...sBtn("#F1F5F9",C.muted,C.border),cursor:"pointer"}}>
          ⬆ Import Backup
          <input type="file" accept=".json" onChange={importBackup} style={{display:"none"}}/>
        </label>
        {saved&&<span style={{color:C.success,fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:4}}><CheckCircle size={14}/>Saved successfully!</span>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════════════════════════ */
export default function App(){
  const [tab,setTab]=useState("dashboard");
  const [sidebar,setSidebar]=useState(true);

  
  const SETTINGS_DEFAULT={name:"HealthPlus Pharmacy",owner:"user ",phone:"8050578799",email:"info@testin",addr:"MG Road, Bengaluru - 560001",gst:"29ABCDE1234F1Z5",license:"DL-2024-12345",dl:"PH-KA-2024-001"};

 const [medicines,setMedicines]=useState([]);
const [suppliers,setSuppliers]=useState([]);
const [customers,setCustomers]=useState([]);
const [employees,setEmployees]=useState([]);
const [sales,setSales]=useState([]);
const [pos,setPos]=useState([]);

useEffect(()=>{
  window.db.getMedicines().then(setMedicines);
  window.db.getSuppliers().then(setSuppliers);
  window.db.getCustomers().then(setCustomers);
  window.db.getEmployees().then(setEmployees);
  window.db.getSales().then(setSales);
  window.db.getPurchaseOrders().then(setPos);
},[]);
  const [settings,setSettings]=useState(()=>load("settings",SETTINGS_DEFAULT));
  const [notifOpen,setNotifOpen]=useState(false);

  

  const lowStockCount=medicines.filter(m=>m.stock<m.min).length;
  const expiryCount=medicines.filter(m=>{const d=daysUntilExpiry(m.expiry);return d>0&&d<60;}).length;
  const alerts=[
    ...medicines.filter(m=>m.stock<m.min).map(m=>({type:"warning",msg:`${m.name} — low stock (${m.stock} left)`})),
    ...medicines.filter(m=>{const d=daysUntilExpiry(m.expiry);return d>0&&d<60;}).map(m=>({type:"danger",msg:`${m.name} — expires ${m.expiry}`})),
  ];

  const exportBackup=()=>{
    const data={medicines,suppliers,customers,employees,sales,pos,settings};
    const a=document.createElement("a");
    a.href="data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(data));
    a.download="medstore_backup_"+today()+".json";
    a.click();
  };
  const importBackup=(e)=>{
    const file=e.target.files[0];
    if(!file) return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      try{
        const data=JSON.parse(ev.target.result);
        if(data.medicines) setMedicines(data.medicines);
        if(data.suppliers) setSuppliers(data.suppliers);
        if(data.customers) setCustomers(data.customers);
        if(data.employees) setEmployees(data.employees);
        if(data.sales) setSales(data.sales);
        if(data.pos) setPos(data.pos);
        if(data.settings) setSettings(data.settings);
        alert("Backup restored successfully!");
      }catch{alert("Invalid backup file!");}
    };
    reader.readAsText(file);
  };

  const initials=(settings.owner||"NG").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();

  const curTab=tab;
  const content=()=>{
    if(curTab==="dashboard") return <Dashboard medicines={medicines} sales={sales} suppliers={suppliers}/>;
    if(curTab==="inventory") return <Inventory medicines={medicines} setMedicines={setMedicines} suppliers={suppliers}/>;
    if(curTab==="pos") return <POS medicines={medicines} setMedicines={setMedicines} sales={sales} setSales={setSales} customers={customers} settings={settings}/>;
    if(curTab==="sales") return <SalesHistory sales={sales} setSales={setSales} settings={settings}/>;
    if(curTab==="purchases") return <PurchaseOrders pos={pos} setPos={setPos} suppliers={suppliers} medicines={medicines} setMedicines={setMedicines}/>;
    if(curTab==="suppliers") return <Suppliers suppliers={suppliers} setSuppliers={setSuppliers}/>;
    if(curTab==="customers") return <Customers customers={customers} setCustomers={setCustomers}/>;
    if(curTab==="expiry") return <ExpiryTracker medicines={medicines}/>;
    if(curTab==="reports") return <Reports sales={sales} medicines={medicines}/>;
    if(curTab==="employees") return <Employees employees={employees} setEmployees={setEmployees}/>;
    if(curTab==="settings") return <AppSettings settings={settings} setSettings={setSettings} exportBackup={exportBackup} importBackup={importBackup}/>;
    return null;
  };

  return(
    <div style={{display:"flex",height:"100vh",background:C.bg,fontFamily:"'Segoe UI',system-ui,sans-serif",overflow:"hidden"}}>
      <Sidebar active={tab} onNav={setTab} open={sidebar} onToggle={()=>setSidebar(s=>!s)} lowStockCount={lowStockCount} expiryCount={expiryCount} ownerName={settings.owner}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{height:56,background:"#fff",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",padding:"0 20px",gap:12,flexShrink:0}}>
          <div style={{flex:1,fontWeight:600,fontSize:15,color:C.text}}>
            {NAV.find(n=>n.id===tab)?.label}
          </div>
          <div style={{fontSize:12,color:C.muted}}>{new Date().toLocaleDateString("en-IN")}</div>
          <div style={{position:"relative"}}>
            <button onClick={()=>setNotifOpen(o=>!o)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:6,position:"relative"}}>
              <Bell size={18}/>
              {alerts.length>0&&<span style={{position:"absolute",top:4,right:4,width:8,height:8,borderRadius:"50%",background:C.danger}}/>}
            </button>
            {notifOpen&&(
              <div style={{position:"absolute",right:0,top:36,width:320,background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 8px 30px rgba(0,0,0,0.12)",zIndex:200,maxHeight:360,overflow:"auto"}}>
                <div style={{padding:"12px 16px",fontWeight:700,fontSize:13,borderBottom:`1px solid ${C.border}`}}>Notifications ({alerts.length})</div>
                {alerts.length===0&&<div style={{padding:20,textAlign:"center",color:C.muted,fontSize:13}}>All clear!</div>}
                {alerts.map((a,i)=>(
                  <div key={i} style={{padding:"10px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:8,alignItems:"flex-start"}}>
                    {a.type==="warning"?<AlertTriangle size={14} color={C.warning} style={{flexShrink:0,marginTop:2}}/>:<AlertCircle size={14} color={C.danger} style={{flexShrink:0,marginTop:2}}/>}
                    <span style={{fontSize:12,color:C.text}}>{a.msg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{width:34,height:34,borderRadius:"50%",background:C.primaryBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:C.primary,cursor:"pointer"}}>{initials}</div>
        </div>
        <div style={{flex:1,overflow:"auto",padding:20}} onClick={()=>notifOpen&&setNotifOpen(false)}>
          {content()}
        </div>
      </div>
    </div>
  );
}