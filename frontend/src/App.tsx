import {useCallback,useEffect,useMemo,useState} from 'react';
import {ReactFlow,Background,Controls,MiniMap,addEdge,applyNodeChanges,applyEdgeChanges,type Node,type Edge,type Connection,type NodeChange,type EdgeChange} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {Archive,ArrowDownRight,ArrowLeft,ArrowRight,BookOpen,Check,ChevronDown,Clock3,Compass,ExternalLink,FileText,Filter,Fingerprint,FlaskConical,FolderOpen,Globe2,Menu,Network,Search,ShieldAlert,Sparkles,X,Bookmark,PanelLeftClose,PanelLeftOpen,RotateCcw,Save,SlidersHorizontal} from 'lucide-react';
import type {CaseFile,Scenario} from './types';

const API=import.meta.env.VITE_API_URL||'http://localhost:8000';
const sectionDefs=[
 ['overview','Case overview','01'],['background','Background & context','02'],['timeline','Chronology','03'],['scene_findings','Scene findings','04'],['forensic_evidence','Forensic evidence','05'],['witness_statements','Witness accounts','06'],['investigative_leads','Leads & persons of interest','07'],['investigation_issues','Investigation review','08'],['official_conclusion','Court / official outcome','09'],['unanswered_questions','Open questions','10']
] as const;
const statusLabels:Record<string,string>={'unsolved':'Unsolved','convicted':'Conviction(s)','undertrial':'Trial pending','court-resolved':'Court outcome','court-appeal':'Appeal outcome','mixed-court':'Mixed outcomes','investigation-closed':'Investigation closed','court-sentence':'Sentence / litigation'};
const fmt=(s:string)=>s.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());

export default function App(){
 const [page,setPage]=useState<'home'|'archives'|'case'|'board'|'detective'|'forensics'>('home');
 const [cases,setCases]=useState<CaseFile[]>([]),[selected,setSelected]=useState<CaseFile|null>(null);
 const [q,setQ]=useState(''),[country,setCountry]=useState('All countries'),[status,setStatus]=useState('All statuses'),[category,setCategory]=useState('All categories'),[sort,setSort]=useState('title');
 const [loading,setLoading]=useState(true),[apiUp,setApiUp]=useState(false),[mobile,setMobile]=useState(false);
 const [scenario,setScenario]=useState<Scenario|null>(null),[forensics,setForensics]=useState<any[]>([]),[stats,setStats]=useState<any>(null);
 const [savedIds,setSavedIds]=useState<string[]>(()=>JSON.parse(localStorage.getItem('er-saved')||'[]'));
 const [notice,setNotice]=useState('');
 const loadCases=useCallback(async()=>{
   setLoading(true);
   const params=new URLSearchParams({page_size:'100',sort});
   if(q.trim())params.set('q',q.trim());if(country!=='All countries')params.set('country',country);
   if(status!=='All statuses')params.set('status',status);if(category!=='All categories')params.set('category',category);
   try{const r=await fetch(`${API}/api/cases?${params}`);if(!r.ok)throw new Error();const data=await r.json();setCases(data.items);setApiUp(true)}
   catch{setApiUp(false);setNotice('API is offline — start FastAPI to load the case archive.')}
   finally{setLoading(false)}
 },[q,country,status,category,sort]);
 useEffect(()=>{loadCases()},[loadCases]);
 useEffect(()=>{fetch(API+'/api/stats').then(r=>r.json()).then(setStats).catch(()=>{});fetch(API+'/api/forensics').then(r=>r.json()).then(d=>setForensics(d.items||[])).catch(()=>{});},[]);
 useEffect(()=>{localStorage.setItem('er-saved',JSON.stringify(savedIds))},[savedIds]);
 const openCase=async(id:string)=>{try{const r=await fetch(`${API}/api/cases/${id}`);if(!r.ok)throw new Error();setSelected(await r.json());setPage('case')}catch{setNotice('Could not load this dossier. Check that the API is running.')}};
 const navigate=(p:typeof page)=>{setPage(p);setMobile(false);if(p!=='case'&&p!=='board')setSelected(null);window.scrollTo({top:0,behavior:'smooth'})};
 const toggleSaved=(id:string)=>setSavedIds(a=>a.includes(id)?a.filter(x=>x!==id):[...a,id]);
 const filtered=cases;
 const countries=useMemo(()=>['All countries',...Array.from(new Set(cases.map(c=>c.country))).sort()],[cases]);
 const categories=useMemo(()=>['All categories',...Array.from(new Set(cases.map(c=>c.category))).sort()],[cases]);
 return <div className="app" style={{"--asset-base":import.meta.env.BASE_URL} as React.CSSProperties}>
  <header className="topbar">
   <button className="mobile-menu" onClick={()=>setMobile(!mobile)} aria-label="Toggle navigation"><Menu/></button>
   <button className="brand" onClick={()=>navigate('home')}><span className="brand-glyph">✳</span><span className="brand-name">THE EVIDENCE ROOM<small>ARCHIVE · INVESTIGATE · UNDERSTAND</small></span></button>
   <nav className={mobile?'nav open':'nav'}>
    <button className={page==='home'?'on':''} onClick={()=>navigate('home')}>The room</button>
    <button className={page==='archives'||page==='case'?'on':''} onClick={()=>navigate('archives')}>Case archive <sup>{cases.length}</sup></button>
    <button className={page==='board'?'on':''} onClick={()=>navigate('board')}>Evidence board</button>
    <button className={page==='detective'?'on':''} onClick={()=>navigate('detective')}>Detective mode</button>
    <button className={page==='forensics'?'on':''} onClick={()=>navigate('forensics')}>Forensic lab</button>
   </nav>
   <div className="top-right"><span className={apiUp?'live-dot':'live-dot offline'}/><span className="micro">{apiUp?'ARCHIVE LIVE':'LOCAL PREVIEW'}</span><button className="top-icon" onClick={()=>navigate('archives')} title="Search archive"><Search size={17}/></button><button className="saved-count" onClick={()=>{navigate('archives');setStatus('All statuses');setQ('')}}><Bookmark size={14}/>{savedIds.length}</button></div>
  </header>
  {notice&&<div className="notice"><ShieldAlert size={15}/>{notice}<button onClick={()=>setNotice('')}><X size={14}/></button></div>}
  <main>
  {page==='home'&&<Home cases={cases} stats={stats} openCase={openCase} go={navigate}/>}
  {page==='archives'&&<ArchivePage cases={filtered} loading={loading} q={q} setQ={setQ} country={country} setCountry={setCountry} countries={countries} status={status} setStatus={setStatus} category={category} setCategory={setCategory} categories={categories} sort={sort} setSort={setSort} openCase={openCase} savedIds={savedIds} toggleSaved={toggleSaved}/>}
  {page==='case'&&selected&&<Dossier item={selected} openBoard={()=>navigate('board')} saved={savedIds.includes(selected.id)} toggleSaved={()=>toggleSaved(selected.id)}/>}
  {page==='board'&&<BoardPage cases={cases} initialCase={selected} openCase={openCase}/>}
  {page==='detective'&&<DetectivePage/>}
  {page==='forensics'&&<ForensicPage items={forensics}/>}
  </main>
  <footer className="footer"><div className="footer-top"><div className="footer-brand">THE EVIDENCE ROOM <span>✳</span></div><p>Curiosity is welcome. Certainty must be earned.</p><div className="micro">A RESEARCH-FIRST ARCHIVE · EST. 2026</div></div><div className="footer-bottom"><span>Educational use · Source-led case research · Victim-centred reporting</span><span>VERSION 2.0.0</span></div></footer>
 </div>
}

function Home({cases,stats,openCase,go}:{cases:CaseFile[];stats:any;openCase:(id:string)=>void;go:(p:any)=>void}){
 const preferred=['zodiac-killer','black-dahlia','jonbenet-ramsey','burari-deaths','aarushi-talwar'];
 const featured=preferred.map(id=>cases.find(c=>c.id===id)).filter(Boolean) as CaseFile[];
 const picks=(featured.length?featured:cases.slice(0,5));
 const india=cases.filter(c=>c.country==='India').length;
 const international=cases.length-india;
 const solved=cases.filter(c=>['convicted','court-resolved','court-sentence','court-appeal'].includes(c.status_type)).length;
 const unsolved=cases.filter(c=>c.status_type==='unsolved').length;
 const tiles=[
  {title:'Case Archives',desc:'Explore documented cases in depth',icon:<Archive/>,go:()=>go('archives'),image:'tile-archives'},
  {title:'Evidence Board',desc:'Connect clues, people and events',icon:<Network/>,go:()=>go('board'),image:'tile-board'},
  {title:'Crime Timeline',desc:'Reconstruct the sequence of events',icon:<Clock3/>,go:()=>go('archives'),image:'tile-timeline'},
  {title:'Detective Mode',desc:'Solve fictional investigation scenarios',icon:<Compass/>,go:()=>go('detective'),image:'tile-detective'},
  {title:'Forensic Lab',desc:'Learn the science behind the evidence',icon:<FlaskConical/>,go:()=>go('forensics'),image:'tile-forensic'}
 ];
 return <div className="home noir-home">
  <section className="noir-hero">
   <div className="noir-hero-bg"/>
   <div className="noir-hero-copy">
    <div className="noir-classified">INDEPENDENT RESEARCH PROJECT <span>·</span> EST. 2026</div>
    <h1>THE <em>EVIDENCE</em><br/>ROOM</h1>
    <p>A growing archive of real cases, source notes<br/>and questions that deserve a closer look.</p>
    <div className="noir-actions"><button className="noir-enter" onClick={()=>go('archives')}>Browse the case files <ArrowRight size={17}/></button><button className="noir-watch" onClick={()=>go('detective')}><span>↗</span> Try a fictional investigation</button></div>
   </div>
   <aside className="hero-pencil-note"><span>desk note / 01</span><b>Sources first.<br/>Theories second.</b><small>— a rule I keep coming back to</small></aside>
   <div className="noir-hero-caption"><span>THE WALL OF QUESTIONS</span><span>OBSERVE · CONNECT · VERIFY</span></div>
  </section>
  <section className="noir-tools" aria-label="Investigation tools">
   {tiles.map((t,i)=><button key={t.title} className={`noir-tool ${t.image}`} onClick={t.go}><span className="noir-tool-no">0{i+1} / ON MY DESK</span><span className="noir-tool-icon">{t.icon}</span><b>{t.title}</b><small>{t.desc}</small><span className="noir-tool-arrow"><ArrowRight size={17}/></span></button>)}
  </section>
  <section className="noir-archive-section">
   <aside className="noir-filter-panel"><div className="noir-panel-title">EXPLORE THE ARCHIVE</div>
    <button className="noir-filter-active" onClick={()=>go('archives')}><span>▦</span> All Cases <b>{cases.length}</b></button>
    <button onClick={()=>{go('archives')}}><span>◎</span> Indian Cases <b>{india}</b></button>
    <button onClick={()=>go('archives')}><span>⌖</span> International Cases <b>{international}</b></button>
    <button onClick={()=>go('archives')}><span>✓</span> Court outcomes <b>{solved}</b></button>
    <button onClick={()=>go('archives')}><span>?</span> Unsolved Cases <b>{unsolved}</b></button>
    <div className="noir-sidebar-note">A living collection.<br/><i>Never a final word.</i></div>
   </aside>
   <div className="noir-featured-panel"><div className="noir-section-heading"><div><span className="noir-kicker">THE CASE FILES</span><h2>Featured <em>investigations.</em></h2></div><button onClick={()=>go('archives')}>View all cases <ArrowRight size={15}/></button></div>
    <div className="noir-case-strip">{picks.map((c,i)=><button key={c.id} className={`noir-case-card noir-case-${i%5}`} onClick={()=>openCase(c.id)}>
      <span className="noir-case-photo" style={{backgroundImage:`url('${import.meta.env.BASE_URL}images/case-${(['zodiac','black-dahlia','jonbenet','burari','aarushi'][i%5])}.jpg')`}}/>
      <span className="noir-case-shade"/>
      <span className="noir-case-meta">{c.country==='India'?'INDIA':'INTERNATIONAL'} · {(c.status||'RESEARCH').toUpperCase()}</span>
      <b>{c.title}</b><small>{c.summary}</small><span className="noir-open-case">OPEN CASE <ArrowRight size={13}/></span>
     </button>)}</div>
    <div className="noir-bottom-line"><span>{cases.length} CASE FILES · SOURCE-LED RESEARCH</span><span>SELECT A FILE TO OPEN ITS DOSSIER →</span></div>
   </div>
  </section>
  <section className="noir-manifesto"><span className="noir-stamp">E.R.<small>ARCHIVE<br/>EDITION</small></span><p>Evidence does not speak for itself.<br/><em>It asks to be examined.</em></p><span className="noir-manifesto-note">FACTS / QUESTIONS / CONTEXT</span></section>
  <section className="maker-note" aria-labelledby="maker-note-title">
   <div className="maker-paper">
    <div className="maker-paper-top"><span>NOTES FROM THE DESK</span><span>PERSONAL PROJECT · 001</span></div>
    <span className="maker-kicker">A NOTE FROM THE PERSON BEHIND THE FILES</span>
    <h2 id="maker-note-title">Why I built <em>this archive.</em></h2>
    <p>I wanted one place where I could slow down, follow a timeline, compare sources and keep the unanswered questions visible. This is my way of learning in public — one case file at a time, with room for corrections along the way.</p>
    <div className="maker-signoff"><span>— The person behind the files</span><small>BUILT WITH CURIOSITY · STILL A WORK IN PROGRESS</small></div>
    <span className="maker-paperclip" aria-hidden="true">✳</span>
   </div>
   <aside className="maker-margin">
    <span className="maker-handwriting">a reminder</span>
    <p>Good research makes room for uncertainty.</p>
    <ul><li>Check the source, not just the headline.</li><li>Separate an allegation from a finding.</li><li>Leave unanswered questions unanswered.</li></ul>
    <span className="maker-margin-stamp">FIELD<br/>NOTES</span>
   </aside>
  </section>
 </div>
}

function ArchivePage({cases,loading,q,setQ,country,setCountry,countries,status,setStatus,category,setCategory,categories,sort,setSort,openCase,savedIds,toggleSaved}:any){
 return <section className="page-wrap archive-page">
  <div className="page-heading"><div className="eyebrow">01 / THE COLLECTION · WORKING INDEX</div><h1>Case <em>archives.</em></h1><p>A growing set of files I'm collecting, reading and checking. Search by name, place, category or status — and follow the references back to the record.</p></div>
  <div className="archive-tools"><div className="search-box"><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search names, locations, case details..."/>{q&&<button onClick={()=>setQ('')}><X size={14}/></button>}</div><div className="filters-row"><label><Globe2 size={14}/><select value={country} onChange={e=>setCountry(e.target.value)}>{countries.map((c:string)=><option key={c}>{c}</option>)}</select><ChevronDown size={13}/></label><label><Filter size={14}/><select value={status} onChange={e=>setStatus(e.target.value)}><option>All statuses</option><option value="unsolved">Unsolved</option><option value="undertrial">Trial pending</option><option value="convicted">Convictions</option><option value="court-resolved">Court outcome</option><option value="mixed-court">Mixed outcomes</option></select><ChevronDown size={13}/></label><label><FolderOpen size={14}/><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map((c:string)=><option key={c}>{c}</option>)}</select><ChevronDown size={13}/></label><label><SlidersHorizontal size={14}/><select value={sort} onChange={e=>setSort(e.target.value)}><option value="title">A–Z</option><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="country">Country</option></select><ChevronDown size={13}/></label></div><div className="archive-count"><span>{cases.length} FILES</span><span>·</span><span>RESEARCH INDEX</span></div></div>
  {loading?<div className="loading-state"><div className="loading-mark">✳</div>Opening the archive…</div>:<div className="archive-grid">{cases.map((c:CaseFile,i:number)=><CaseCard key={c.id} item={c} index={i} open={()=>openCase(c.id)} saved={savedIds.includes(c.id)} toggleSaved={()=>toggleSaved(c.id)}/>)}</div>}
  {!loading&&cases.length===0&&<div className="empty-state">No files match this combination. Clear a filter or try a different search.</div>}
  <div className="editorial-standard"><ShieldAlert size={17}/><p><b>Editorial standard.</b> The archive separates documented facts, prosecution allegations, court findings and unresolved questions. A case summary is a starting point, not a substitute for primary records.</p></div>
 </section>
}
function CaseCard({item,index,open,saved,toggleSaved}:{item:CaseFile;index:number;open:()=>void;saved:boolean;toggleSaved:()=>void}){
 const artClass='case-art art-'+(index%6);
 return <article className="case-card">
  <button className={artClass} data-case={item.id} style={{backgroundImage:`url('${import.meta.env.BASE_URL}images/cases/${item.id}.svg')`}} onClick={open}><span className="art-file">{item.case_number} / RESEARCH COPY</span><span className="art-glyph">{item.country==='India'?'IND':item.category==='Hijacking'?'FLIGHT':item.category==='Unsolved homicide'?'UNSOLVED':'DOSSIER'}</span><span className="art-period">{item.period}</span><span className="art-serial">EVIDENCE ROOM</span><span className="art-handnote">field copy · keep checking</span></button>
  <div className="case-card-content"><div className="card-meta"><span>{item.country.toUpperCase()}</span><span className={'status-chip '+item.status_type}>{statusLabels[item.status_type]||item.status_type}</span></div><button className="card-title" onClick={open}>{item.title}</button><p>{item.summary}</p><div className="card-tags">{item.tags.slice(0,3).map(t=><span key={t}>{t}</span>)}</div><div className="card-bottom"><button className="open-dossier" onClick={open}>OPEN DOSSIER <ArrowRight size={14}/></button><button className={saved?'save-btn saved':'save-btn'} onClick={toggleSaved} title={saved?'Remove bookmark':'Bookmark case'}><Bookmark size={15} fill={saved?'currentColor':'none'}/></button></div></div>
 </article>
}

const dossierArtwork=(id:string)=>`${import.meta.env.BASE_URL}images/cases/${id}.svg`;
function Dossier({item,openBoard,saved,toggleSaved}:{item:CaseFile;openBoard:()=>void;saved:boolean;toggleSaved:()=>void}){
 const [tab,setTab]=useState<string>('overview'),[collapsed,setCollapsed]=useState(false);
 const photoUrl=dossierArtwork(item.id);
 const activeIndex=sectionDefs.findIndex(x=>x[0]===tab);
 return <section className="page-wrap dossier-page">
  <div className="breadcrumbs"><button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>ARCHIVE</button><span>/</span>{item.country.toUpperCase()}<span>/</span>{item.case_number}</div>
  <div className="dossier-photo-hero">
   <img className="dossier-case-photo" src={photoUrl} alt="AI-generated atmospheric illustration for this case dossier" />
   <div className="dossier-photo-shade"/>
   <div className="dossier-photo-copy"><div className="eyebrow">CLASSIFIED DOSSIER <i/> {item.case_number} <i/> {item.period}</div><h1>{item.title}</h1><p>{item.subtitle}</p><div className="dossier-chips"><span>{item.category}</span><span>{item.region}</span><span className={'status-chip '+item.status_type}>{item.status}</span></div></div>
   <div className="dossier-photo-credit">AI-GENERATED ATMOSPHERIC ARTWORK · NOT CASE EVIDENCE</div>
   <div className="dossier-emblem">E.R.<small>ARCHIVE<br/>EDITION</small></div>
  </div>
  <div className="dossier-actions"><button className="btn-outline" onClick={openBoard}><Network size={15}/> Open evidence board</button><button className={saved?'btn-outline saved':'btn-outline'} onClick={toggleSaved}><Bookmark size={15} fill={saved?'currentColor':'none'}/>{saved?'Saved to your files':'Save dossier'}</button><span className="micro">LAST REVIEWED {item.last_researched}</span></div>
  <div className="dossier-layout">
   <aside className={collapsed?'dossier-sidebar collapsed':'dossier-sidebar'}><div className="sidebar-head"><span className="micro">IN THIS DOSSIER</span><button onClick={()=>setCollapsed(!collapsed)}>{collapsed?<PanelLeftOpen size={15}/>:<PanelLeftClose size={15}/>}</button></div>{!collapsed&&sectionDefs.map(([key,label,no])=><button key={key} className={tab===key?'section-link active':'section-link'} onClick={()=>{setTab(key);window.scrollTo({top:300,behavior:'smooth'})}}><span>{no}</span>{label}</button>)}{!collapsed&&<button className="sidebar-board" onClick={openBoard}><Network size={15}/> INVESTIGATION BOARD</button>}</aside>
   <article className="dossier-article"><div className="section-label">SECTION {sectionDefs[activeIndex]?.[2]} <span>/</span> {sectionDefs[activeIndex]?.[1].toUpperCase()}</div><h2>{sectionDefs[activeIndex]?.[1]}</h2><p className="dossier-prose">{item.sections[tab]}</p>
    {tab==='timeline'&&<div className="timeline-list">{item.timeline.map((t,i)=><div className="timeline-entry" key={i}><div className="timeline-date">{t.date}</div><div className="timeline-marker"/><div className="timeline-event"><h4>{t.title}</h4><p>{t.detail}</p><span>{t.evidence_status}</span></div></div>)}</div>}
    {tab==='forensic_evidence'&&<div className="evidence-index">{item.evidence.map(e=><div className="evidence-index-row" key={e.id}><Fingerprint/><div><b>{e.title}</b><p>{e.detail}</p><small>{e.status}</small></div></div>)}</div>}
    {tab==='unanswered_questions'&&<div className="question-panel"><Sparkles/><span className="micro">QUESTIONS FOR THE RECORD</span><p>{item.sections.unanswered_questions}</p></div>}
    {tab==='investigative_leads'&&<div className="caution-panel"><ShieldAlert/><p>Names and theories in public discourse are not proof. This dossier records the investigative context without naming private individuals as suspects unless a reliable public record makes that necessary.</p></div>}
    <div className="dossier-pager"><span className="micro">END OF SECTION {sectionDefs[activeIndex]?.[2]}</span><div><button className="btn-outline" disabled={activeIndex===0} onClick={()=>setTab(sectionDefs[Math.max(0,activeIndex-1)][0])}><ArrowLeft size={14}/> Previous</button><button className="btn-primary compact" disabled={activeIndex===9} onClick={()=>setTab(sectionDefs[Math.min(9,activeIndex+1)][0])}>Next section <ArrowRight size={14}/></button></div></div>
   </article>
  </div>
  <section className="source-register"><div className="source-head"><div><div className="eyebrow">THE SOURCE REGISTER</div><h2>Follow the <em>record.</em></h2></div><span className="micro">{item.sources.length} STARTING REFERENCES</span></div><p>These references are research entry points. Confirm each factual statement against the underlying judgment, official record or original reporting before relying on it.</p>{item.sources.map((s,i)=><a key={i} className="source-row" href={s.url} target="_blank" rel="noreferrer"><span className="source-no">0{i+1}</span><FileText/><span className="source-title"><b>{s.title}</b><small>{s.publisher}</small></span><ExternalLink size={15}/></a>)}</section>
  <div className="editorial-standard"><ShieldAlert size={17}/><p>{item.editorial_note} Status is reviewed as of the date shown and may change with later proceedings.</p></div>
 </section>
}

function BoardPage({cases,initialCase,openCase}:{cases:CaseFile[];initialCase:CaseFile|null;openCase:(id:string)=>void}){
 const [caseId,setCaseId]=useState(initialCase?.id||cases[0]?.id||''),[active,setActive]=useState<CaseFile|null>(initialCase);
 const [nodes,setNodes]=useState<Node[]>([]),[edges,setEdges]=useState<Edge[]>([]),[notes,setNotes]=useState(''),[saving,setSaving]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{if(!caseId)return;fetch(`${API}/api/cases/${caseId}`).then(r=>r.json()).then(c=>{setActive(c);const key='er-board-'+caseId;const saved=localStorage.getItem(key);if(saved){const b=JSON.parse(saved);setNodes(b.nodes);setEdges(b.edges);setNotes(b.notes||'')}else{setNodes(c.evidence.map((e:any)=>({id:e.id,position:{x:e.x,y:e.y},data:{label:<div className="evidence-node"><span>{e.kind}</span><b>{e.title}</b><small>{e.detail}</small></div>},style:{width:205,background:'#e9dfcb',border:'1px solid #ad9470',borderRadius:2,padding:0,color:'#2c251d',boxShadow:'3px 6px 14px #0004'}})));setEdges(c.evidence.slice(1).map((e:any,i:number)=>({id:'archive-link-'+i,source:c.evidence[0].id,target:e.id,label:'review',style:{stroke:'#98564a',strokeWidth:2},labelStyle:{fill:'#5a3b30',fontSize:10}})));setNotes('')}}).catch(()=>setMessage('Could not load case evidence. Start the API first.'))},[caseId]);
 const onNodesChange=(changes:NodeChange[])=>setNodes(ns=>applyNodeChanges(changes,ns));
 const onEdgesChange=(changes:EdgeChange[])=>setEdges(es=>applyEdgeChanges(changes,es));
 const onConnect=(connection:Connection)=>setEdges(es=>addEdge({...connection,label:'my connection',style:{stroke:'#98564a',strokeWidth:2}},es));
 const save=async()=>{setSaving(true);const payload={case_id:caseId,nodes,edges,notes};localStorage.setItem('er-board-'+caseId,JSON.stringify(payload));try{const r=await fetch(`${API}/api/boards/${caseId}-workspace`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok)throw new Error();setMessage('Workspace saved to the API and this browser.')}catch{setMessage('Saved in this browser. Start the API to enable server-side persistence.')}finally{setSaving(false)}};
 const reset=()=>{if(active){localStorage.removeItem('er-board-'+caseId);setNodes(active.evidence.map((e:any)=>({id:e.id,position:{x:e.x,y:e.y},data:{label:<div className="evidence-node"><span>{e.kind}</span><b>{e.title}</b><small>{e.detail}</small></div>},style:{width:205,background:'#e9dfcb',border:'1px solid #ad9470',borderRadius:2,padding:0,color:'#2c251d'}})));setEdges([]);setNotes('');setMessage('Board reset to the case starter layout.')}};
 return <section className="page-wrap board-page"><div className="page-heading"><div className="eyebrow">02 / THE INVESTIGATIVE WORKSPACE</div><h1>Connect the <em>dots.</em></h1><p>A working wall for your questions and connections. Move evidence, draw links, add notes. A connection is a hypothesis — never a verdict.</p></div>
  <div className="board-controls"><label className="board-select"><Archive size={15}/><select value={caseId} onChange={e=>setCaseId(e.target.value)}>{cases.map(c=><option value={c.id}>{c.title}</option>)}</select><ChevronDown size={14}/></label><span className="micro">DRAG TO ARRANGE · CONNECT HANDLES TO LINK</span><button className="btn-outline" onClick={reset}><RotateCcw size={14}/> Reset</button><button className="btn-primary compact" onClick={save} disabled={saving}><Save size={14}/>{saving?'Saving…':'Save workspace'}</button></div>
  <div className="board-frame"><div className="board-frame-label">WORKING WALL <span>· {active?.title||'SELECT A FILE'}</span><span className="board-grid-note">PINBOARD / NOT TO SCALE</span></div><div className="board-flow"><ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} fitView fitViewOptions={{padding:.18}}><Background color="#95856a" gap={23}/><Controls/><MiniMap nodeColor="#c5ad83" maskColor="rgba(30,25,19,.18)"/></ReactFlow></div></div>
  <div className="board-notes"><div><div className="eyebrow">INVESTIGATOR'S NOTEBOOK</div><h3>What are you noticing?</h3><p>Record questions, contradictions and things that need corroboration. Notes are saved with this board in your browser and, when the API is running, in SQLite.</p></div><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Observation:&#10;Possible connection:&#10;What I still need to verify:..."/></div>{message&&<div className="inline-message">{message}</div>}<div className="editorial-standard"><ShieldAlert/><p>All links on this board are user-created analytical hypotheses. Do not use them to accuse private individuals or imply a conclusion unsupported by the record.</p></div>
 </section>
}

function DetectivePage(){
 const [scenarios,setScenarios]=useState<Scenario[]>([]),[active,setActive]=useState<Scenario|null>(null),[opened,setOpened]=useState<number[]>([]),[choice,setChoice]=useState<number|null>(null),[reveal,setReveal]=useState(false);
 useEffect(()=>{fetch(API+'/api/detective/scenarios').then(r=>r.json()).then(async d=>{const full=await Promise.all((d.items||[]).map((x:any)=>fetch(API+'/api/detective/scenarios/'+x.id).then(r=>r.json())));setScenarios(full)}).catch(()=>{})},[]);
 const start=(s:Scenario)=>{setActive(s);setOpened([]);setChoice(null);setReveal(false)};
 return <section className="page-wrap detective-page"><div className="page-heading"><div className="eyebrow">03 / TRAINING SIMULATION · FICTIONAL FILES ONLY</div><h1>Think like an <em>investigator.</em></h1><p>Invented scenarios designed to practise careful reasoning, evidence handling and the difference between an investigative lead and a supported conclusion.</p></div>
 {!active?<div className="scenario-grid">{scenarios.map((s,i)=><button className="scenario-card" key={s.id} onClick={()=>start(s)}><div className="scenario-art"><span>SIMULATION / 0{i+1}</span><Compass size={43}/><small>FICTIONAL CASE MATERIAL</small></div><div className="scenario-info"><div className="eyebrow">{s.difficulty.toUpperCase()} LEVEL</div><h3>{s.title}</h3><p>{s.brief}</p><span className="link-arrow">OPEN CASE <ArrowRight size={14}/></span></div></button>)}</div>:<div className="simulation"><button className="link-arrow" onClick={()=>setActive(null)}><ArrowLeft size={15}/> All simulations</button><div className="simulation-heading"><div className="eyebrow">FICTIONAL CASE FILE · {active.difficulty.toUpperCase()}</div><h2>{active.title}</h2><p>{active.brief}</p></div><div className="clue-heading"><h3>Examine the clues</h3><span className="micro">{opened.length} / {active.clues.length} REVIEWED</span></div><div className="clue-grid">{active.clues.map((c,i)=><button key={c.title} className={opened.includes(i)?'clue-card opened':'clue-card'} onClick={()=>setOpened(a=>a.includes(i)?a.filter(x=>x!==i):[...a,i])}><span>CLUE 0{i+1} · {c.kind.toUpperCase()}</span><b>{c.title}</b>{opened.includes(i)?<p>{c.body}</p>:<small>Inspect evidence <ArrowDownRight size={13}/></small>}</button>)}</div><div className="question-box"><div className="eyebrow">YOUR NEXT MOVE</div><h3>{active.question}</h3>{active.options.map((o,i)=><button key={i} className={choice===i?'answer-option chosen':'answer-option'} onClick={()=>{setChoice(i);setReveal(false)}}><span>{String.fromCharCode(65+i)}</span>{o}{choice===i&&<Check size={15}/>}</button>)}<button className="btn-primary" disabled={choice===null} onClick={()=>setReveal(true)}>Submit reasoning <ArrowRight size={15}/></button>{reveal&&<div className="answer-reveal"><b>{choice===active.answer?'A disciplined conclusion.':'Re-examine the record.'}</b><p>{active.explanation}</p></div>}</div></div>}
 </section>
}
function ForensicPage({items}:{items:any[]}){
 const [active,setActive]=useState<any>(null);
 return <section className="page-wrap forensic-page"><div className="page-heading"><div className="eyebrow">04 / THE SCIENCE OF INVESTIGATION</div><h1>The forensic <em>lab.</em></h1><p>Methods, materials and limitations. Learn what forensic disciplines can tell us — and what they cannot.</p></div><div className="lab-layout"><div className="lab-grid">{items.map((f,i)=><button className={'lab-card lab-'+i} key={f.id} onClick={()=>setActive(f)}><span className="lab-symbol">{['◉','⌘','⌁','✳','⌖','▤','◌','⌑'][i%8]}</span><div className="eyebrow">{f.eyebrow}</div><h3>{f.title}</h3><p>{f.summary}</p><span className="link-arrow">EXPLORE METHOD <ArrowRight size={14}/></span></button>)}</div><aside className="lab-aside"><div className="eyebrow">METHOD NOTE</div><h3>{active?active.title:'Evidence is a process.'}</h3><p>{active?active.summary:'Forensic findings are produced through controlled methods, documented procedures and careful interpretation. A result must be read in context, with its limitations made clear.'}</p>{active&&<><h4>Typical workflow</h4><ol>{active.workflow.map((s:string)=><li key={s}>{s}</li>)}</ol><div className="lab-caution"><ShieldAlert size={16}/>{active.limits}</div></>}<div className="lab-seal">OBSERVE<br/>DOCUMENT<br/>INTERPRET</div></aside></div></section>
}
