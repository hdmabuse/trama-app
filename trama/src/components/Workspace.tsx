"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { exportPDF, exportMarkdown } from "@/lib/export";

/* ── Types ── */
type Code = { id:string; name:string; color:string; description:string|null; _count:{codings:number}; children?:Code[] };
type Doc = { id:string; title:string; content:string; wordCount:number; type:string; mimeType?:string|null; fileUrl?:string|null; fileName?:string|null; _count:{codings:number} };
type Coding = { id:string; startOffset:number; endOffset:number; selectedText:string; memo:string|null; code:{id:string;name:string;color:string} };
type ThemeCode = { code:{id:string;name:string;color:string} };
type Theme = { id:string; name:string; description:string|null; color:string; sortOrder:number; themeCodes:ThemeCode[] };
type Project = { id:string; name:string; description:string|null; color:string; documents:Doc[]; codes:Code[]; themes:Theme[] };

/* ── Icons ── */
function Ic({d,className="w-3.5 h-3.5"}:{d:string;className?:string}){
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;}
const ic={plus:"M12 5v14M5 12h14",search:"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",doc:"M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6",upload:"M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M17 8l-5-5-5 5 M12 3v12",download:"M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3",x:"M18 6L6 18M6 6l12 12",chevR:"M9 18l6-6-6-6",chevD:"M6 9l6 6 6-6",music:"M9 18V5l12-2v13 M9 18a3 3 0 11-6 0 3 3 0 016 0z M21 16a3 3 0 11-6 0 3 3 0 016 0z",film:"M4 4h16v16H4z M4 9h16 M4 15h16 M9 4v16 M15 4v16",tag:"M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01",filter:"M22 3H2l8 9.46V19l4 2v-8.54L22 3z",check:"M20 6L9 17l-5-5"};
const COLORS=["#ef4444","#10b981","#6366f1","#f59e0b","#ec4899","#8b5cf6","#14b8a6","#C97B5D"];

/* ═══════════════════════════════════════════ */
/* MAIN WORKSPACE                              */
/* ═══════════════════════════════════════════ */
export function Workspace({project,userId}:{project:Project;userId:string}){
  const router=useRouter();
  const [activeDocIdx,setActiveDocIdx]=useState(0);
  const [codings,setCodings]=useState<Coding[]>([]);
  const [showCodingPopup,setShowCodingPopup]=useState(false);
  const [selection,setSelection]=useState<{text:string;start:number;end:number}|null>(null);
  const [expandedCodes,setExpandedCodes]=useState<string[]>(project.codes.filter(c=>c.children?.length).map(c=>c.id));
  const [showNewCode,setShowNewCode]=useState(false);
  const [newCodeName,setNewCodeName]=useState("");
  const [newCodeColor,setNewCodeColor]=useState("#6366f1");
  const [showUpload,setShowUpload]=useState(false);
  const [showAddDoc,setShowAddDoc]=useState(false);
  const [newDocTitle,setNewDocTitle]=useState("");
  const [newDocContent,setNewDocContent]=useState("");
  const [searchCode,setSearchCode]=useState("");
  const [showExportMenu,setShowExportMenu]=useState(false);
  const [rightTab,setRightTab]=useState<"codes"|"themes">("codes");
  // Themes
  const [showNewTheme,setShowNewTheme]=useState(false);
  const [showEditTheme,setShowEditTheme]=useState<string|null>(null);
  const [newThemeName,setNewThemeName]=useState("");
  const [newThemeColor,setNewThemeColor]=useState("#8b5cf6");
  const [newThemeDesc,setNewThemeDesc]=useState("");
  // Filters
  const [themeFilter,setThemeFilter]=useState<string|null>(null);
  const [showThemeFilter,setShowThemeFilter]=useState(false);
  // Search
  const [showSearch,setShowSearch]=useState(false);

  const activeDoc=project.documents[activeDocIdx];

  // Keyboard shortcut
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key==="k"){e.preventDefault();setShowSearch(true);}};
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);
  },[]);

  // Load codings
  const loadCodings=useCallback(async()=>{
    if(!activeDoc)return;
    const r=await fetch(`/api/codificacoes?documentId=${activeDoc.id}`);
    if(r.ok)setCodings(await r.json());
  },[activeDoc]);
  useEffect(()=>{loadCodings();},[loadCodings]);

  // Get code IDs that belong to filtered theme
  const filteredCodeIds=themeFilter
    ? project.themes.find(t=>t.id===themeFilter)?.themeCodes.map(tc=>tc.code.id)||[]
    : null;

  function handleTextSelect(){
    const sel=window.getSelection();if(!sel||sel.isCollapsed||!sel.toString().trim())return;
    const reader=document.getElementById("text-reader");if(!reader)return;
    const range=sel.getRangeAt(0);const pre=document.createRange();
    pre.selectNodeContents(reader);pre.setEnd(range.startContainer,range.startOffset);
    const s=pre.toString().length;
    setSelection({text:sel.toString(),start:s,end:s+sel.toString().length});setShowCodingPopup(true);
  }

  async function applyCoding(codeId:string,memo:string){
    if(!activeDoc||!selection)return;
    await fetch("/api/codificacoes",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({documentId:activeDoc.id,codeId,startOffset:selection.start,endOffset:selection.end,selectedText:selection.text,memo:memo||null})});
    setShowCodingPopup(false);setSelection(null);window.getSelection()?.removeAllRanges();loadCodings();router.refresh();
  }
  async function removeCoding(id:string){await fetch(`/api/codificacoes?id=${id}`,{method:"DELETE"});loadCodings();router.refresh();}
  async function createCode(e:React.FormEvent){e.preventDefault();
    await fetch("/api/codigos",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:newCodeName,color:newCodeColor,projectId:project.id})});
    setShowNewCode(false);setNewCodeName("");router.refresh();}
  async function createCodeInline(name:string,color:string):Promise<string|null>{
    const r=await fetch("/api/codigos",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,color,projectId:project.id})});
    if(!r.ok)return null;const c=await r.json();router.refresh();return c.id;}
  async function addDocument(e:React.FormEvent){e.preventDefault();
    await fetch("/api/documentos",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:newDocTitle,content:newDocContent,projectId:project.id})});
    setShowAddDoc(false);setNewDocTitle("");setNewDocContent("");router.refresh();}

  // Themes CRUD
  async function createTheme(e:React.FormEvent){e.preventDefault();
    await fetch("/api/temas",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:newThemeName,color:newThemeColor,description:newThemeDesc||null,projectId:project.id})});
    setShowNewTheme(false);setNewThemeName("");setNewThemeDesc("");router.refresh();}
  async function deleteTheme(id:string){
    await fetch(`/api/temas/${id}`,{method:"DELETE"});
    if(themeFilter===id)setThemeFilter(null);router.refresh();}
  async function toggleThemeCode(themeId:string,codeId:string,has:boolean){
    if(has){await fetch(`/api/temas/${themeId}/codigos?codeId=${codeId}`,{method:"DELETE"});}
    else{await fetch(`/api/temas/${themeId}/codigos`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({codeIds:[codeId]})});}
    router.refresh();}

  // Export
  async function handleExport(fmt:"pdf"|"md"){
    setShowExportMenu(false);
    const allCodings:{documentTitle:string;codeName:string;selectedText:string;memo:string|null}[]=[];
    for(const doc of project.documents){const r=await fetch(`/api/codificacoes?documentId=${doc.id}`);
      if(r.ok){const cs:Coding[]=await r.json();cs.forEach(c=>allCodings.push({documentTitle:doc.title,codeName:c.code.name,selectedText:c.selectedText,memo:c.memo}));}}
    const allCodes=project.codes.flatMap(c=>[c,...(c.children||[])]);
    const data={projectName:project.name,projectDescription:project.description,
      documents:project.documents.map(d=>({title:d.title,content:d.content,wordCount:d.wordCount,type:d.type})),
      codes:allCodes.map(c=>({name:c.name,color:c.color,count:c._count.codings})),codings:allCodings,
      themes:project.themes.map(t=>({name:t.name,color:t.color,description:t.description,codes:t.themeCodes.map(tc=>tc.code.name)}))};
    if(fmt==="pdf")exportPDF(data);else exportMarkdown(data);
  }

  // Render text with highlights + theme filter
  function renderText(content:string){
    if(!codings.length)return content;
    const sorted=[...codings].sort((a,b)=>a.startOffset-b.startOffset);
    const parts:React.ReactNode[]=[];let cursor=0;
    sorted.forEach((c,i)=>{
      if(c.startOffset>cursor)parts.push(content.slice(cursor,c.startOffset));
      const dimmed=filteredCodeIds&&!filteredCodeIds.includes(c.code.id);
      parts.push(
        <span key={i} className={`cursor-pointer rounded-sm relative group ${dimmed?"opacity-20":""}`}
          style={{background:`${c.code.color}20`,borderBottom:`2px solid ${c.code.color}`}}
          title={`${c.code.name}${c.memo?` — ${c.memo}`:""}`}>
          {content.slice(c.startOffset,c.endOffset)}
          {!dimmed&&<span className="hidden group-hover:flex absolute -top-8 left-0 bg-stone-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20 items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{background:c.code.color}}/>{c.code.name}
            <button onClick={e=>{e.stopPropagation();removeCoding(c.id);}} className="ml-1 text-stone-400 hover:text-white">✕</button>
          </span>}
        </span>);
      cursor=c.endOffset;
    });
    if(cursor<content.length)parts.push(content.slice(cursor));
    return parts;
  }

  const filteredCodes=project.codes.filter(c=>!searchCode||c.name.toLowerCase().includes(searchCode.toLowerCase()));
  const activeThemeName=themeFilter?project.themes.find(t=>t.id===themeFilter)?.name:null;

  /* ── RENDER ── */
  return(
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="h-11 bg-white border-b border-stone-200 flex items-center px-4 gap-3 shrink-0">
        <span className="text-sm font-semibold text-stone-800">{project.name}</span>
        <div className="flex-1"/>
        <button onClick={()=>setShowSearch(true)} className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-stone-400 bg-stone-50 border border-stone-200 rounded-md hover:border-stone-300 transition">
          <Ic d={ic.search} className="w-3 h-3"/>Buscar <kbd className="ml-1 text-[10px] bg-stone-100 px-1 rounded">⌘K</kbd>
        </button>
        <span className="text-xs text-stone-400">{project.documents.length} doc{project.documents.length!==1&&"s"} · {project.codes.length} cód. · {project.themes.length} tema{project.themes.length!==1&&"s"}</span>
        <div className="relative">
          <button onClick={()=>setShowExportMenu(!showExportMenu)} className="px-3 py-1.5 bg-trama-500 hover:bg-trama-600 text-white text-xs font-medium rounded-md flex items-center gap-1.5 transition">
            <Ic d={ic.download} className="w-3 h-3"/>Exportar</button>
          {showExportMenu&&<div className="absolute right-0 top-9 bg-white border border-stone-200 rounded-lg shadow-lg py-1 w-44 z-40">
            <button onClick={()=>handleExport("pdf")} className="w-full text-left px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 flex items-center gap-2">
              <span className="text-[10px] bg-red-100 text-red-600 font-mono px-1.5 py-0.5 rounded">PDF</span>Relatório</button>
            <button onClick={()=>handleExport("md")} className="w-full text-left px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 flex items-center gap-2">
              <span className="text-[10px] bg-stone-100 text-stone-600 font-mono px-1.5 py-0.5 rounded">MD</span>Markdown</button>
          </div>}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ══ LEFT — Documents ══ */}
        <div className="w-[20%] min-w-[180px] border-r border-stone-200 bg-white flex flex-col overflow-hidden">
          <div className="p-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Documentos</span>
            <div className="flex gap-1">
              <button onClick={()=>setShowUpload(true)} className="p-1 rounded bg-stone-50 hover:bg-trama-50 text-trama-500" title="Upload"><Ic d={ic.upload} className="w-3.5 h-3.5"/></button>
              <button onClick={()=>setShowAddDoc(true)} className="p-1 rounded bg-stone-50 hover:bg-trama-50 text-trama-500" title="Colar texto"><Ic d={ic.plus} className="w-3.5 h-3.5"/></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {project.documents.length===0&&<div className="p-4 text-center"><p className="text-xs text-stone-400 mb-2">Nenhum documento.</p><button onClick={()=>setShowUpload(true)} className="text-xs text-trama-500 font-medium">Upload</button></div>}
            {project.documents.map((doc,i)=>(
              <button key={doc.id} onClick={()=>setActiveDocIdx(i)} className={`w-full text-left px-3 py-2.5 transition border-l-[3px] ${activeDocIdx===i?"bg-orange-50 border-argila":"border-transparent hover:bg-stone-50"}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Ic d={doc.type==="AUDIO"?ic.music:doc.type==="VIDEO"?ic.film:ic.doc} className={`w-3 h-3 shrink-0 ${activeDocIdx===i?"text-argila":"text-stone-300"}`}/>
                  <span className={`text-xs truncate ${activeDocIdx===i?"font-medium text-stone-800":"text-stone-600"}`}>{doc.title}</span>
                </div>
                <div className="flex gap-3 pl-[18px]">
                  <span className="text-[11px] text-stone-400">{doc.type==="AUDIO"||doc.type==="VIDEO"?doc.type.toLowerCase():`${doc.wordCount} pal.`}</span>
                  <span className="text-[11px] text-stone-400">{doc._count.codings} cód.</span>
                </div>
              </button>))}
          </div>
        </div>

        {/* ══ CENTER — Reader ══ */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeDoc?(<>
            <div className="px-4 py-2 border-b border-stone-200 bg-white flex items-center gap-3 shrink-0">
              <span className="text-xs font-medium text-stone-600 truncate">{activeDoc.title}</span>
              {activeDoc.fileName&&<span className="text-[10px] text-stone-400 bg-stone-50 px-2 py-0.5 rounded">{activeDoc.fileName}</span>}
              <div className="flex-1"/>
              {/* Theme filter */}
              <div className="relative">
                <button onClick={()=>setShowThemeFilter(!showThemeFilter)}
                  className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border transition ${themeFilter?"bg-trama-50 border-trama-300 text-trama-600":"border-stone-200 text-stone-400 hover:border-stone-300"}`}>
                  <Ic d={ic.filter} className="w-3 h-3"/>
                  {activeThemeName||"Filtro por tema"}
                  {themeFilter&&<button onClick={e=>{e.stopPropagation();setThemeFilter(null);setShowThemeFilter(false);}} className="ml-1 hover:text-trama-700">✕</button>}
                </button>
                {showThemeFilter&&<div className="absolute right-0 top-8 bg-white border border-stone-200 rounded-lg shadow-lg py-1 w-52 z-40">
                  <button onClick={()=>{setThemeFilter(null);setShowThemeFilter(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-stone-50 ${!themeFilter?"font-medium text-trama-500":"text-stone-600"}`}>Sem filtro</button>
                  {project.themes.map(t=>(
                    <button key={t.id} onClick={()=>{setThemeFilter(t.id);setShowThemeFilter(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-stone-50 flex items-center gap-2 ${themeFilter===t.id?"font-medium text-trama-500":"text-stone-600"}`}>
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:t.color}}/>{t.name}
                      <span className="ml-auto text-xs text-stone-400">{t.themeCodes.length} cód.</span>
                    </button>))}
                </div>}
              </div>
              <span className="text-[11px] text-stone-400">{activeDoc.wordCount} palavras</span>
            </div>
            {activeDoc.fileUrl&&(activeDoc.type==="AUDIO"||activeDoc.type==="VIDEO")&&(
              <div className="bg-stone-50 border-b border-stone-200 p-4">
                {activeDoc.type==="AUDIO"?<audio controls className="w-full" src={activeDoc.fileUrl}/>
                  :<video controls className="w-full max-h-64 rounded-lg bg-black" src={activeDoc.fileUrl}/>}
              </div>)}
            <div className="flex-1 overflow-y-auto bg-white p-8 scrollbar-thin">
              <div id="text-reader" className="max-w-2xl mx-auto leading-[1.9] text-[15px] text-stone-800 whitespace-pre-wrap" onMouseUp={handleTextSelect}>
                {renderText(activeDoc.content)}
              </div>
            </div>
          </>):(
            <div className="flex-1 flex items-center justify-center"><div className="text-center"><p className="text-sm text-stone-400 mb-2">Selecione ou adicione um documento.</p>
              <button onClick={()=>setShowUpload(true)} className="text-sm text-trama-500 font-medium">Upload</button></div></div>)}
        </div>

        {/* ══ RIGHT — Codes & Themes ══ */}
        <div className="w-[28%] min-w-[260px] border-l border-stone-200 bg-white flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-stone-200 shrink-0">
            {(["codes","themes"] as const).map(tab=>(
              <button key={tab} onClick={()=>setRightTab(tab)}
                className={`flex-1 py-2.5 text-xs font-medium transition ${rightTab===tab?"text-trama-500 border-b-2 border-trama-500":"text-stone-400 hover:text-stone-600"}`}>
                {tab==="codes"?"Códigos":"Temas"}
              </button>))}
          </div>

          {rightTab==="codes"?(<>
            {/* Codes panel */}
            <div className="p-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Códigos ({project.codes.length})</span>
              <button onClick={()=>setShowNewCode(true)} className="px-2.5 py-1 bg-trama-500 hover:bg-trama-600 text-white text-[11px] font-medium rounded-md flex items-center gap-1 transition"><Ic d={ic.plus} className="w-3 h-3"/>Novo</button>
            </div>
            <div className="px-3 pb-2">
              <div className="flex items-center bg-stone-50 border border-stone-200 rounded-md px-2.5 py-1.5 gap-1.5">
                <Ic d={ic.search} className="w-3 h-3 text-stone-400"/>
                <input value={searchCode} onChange={e=>setSearchCode(e.target.value)} placeholder="Buscar código..." className="bg-transparent text-xs flex-1 outline-none"/>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin px-3">
              {filteredCodes.map(code=>(
                <div key={code.id} className="mb-0.5">
                  <button onClick={()=>code.children?.length&&setExpandedCodes(s=>s.includes(code.id)?s.filter(x=>x!==code.id):[...s,code.id])}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-stone-50 transition text-left">
                    {code.children?.length?<Ic d={expandedCodes.includes(code.id)?ic.chevD:ic.chevR} className="w-3 h-3 text-stone-400"/>:<span className="w-3"/>}
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:code.color}}/>
                    <span className="text-sm text-stone-700 flex-1">{code.name}</span>
                    <span className="text-xs text-stone-400 bg-stone-50 rounded-full px-2 py-0.5">{code._count.codings}</span>
                  </button>
                  {code.children?.length&&expandedCodes.includes(code.id)?code.children.map((ch:any)=>(
                    <div key={ch.id} className="flex items-center gap-2 pl-9 pr-2 py-1.5">
                      <span className="w-2 h-2 rounded-full opacity-60" style={{background:ch.color}}/>
                      <span className="text-xs text-stone-500 flex-1">{ch.name}</span>
                      <span className="text-[11px] text-stone-400">{ch._count?.codings??0}</span>
                    </div>)):null}
                </div>))}
            </div>
            {/* Stats */}
            <div className="border-t border-stone-200 p-3">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-2.5">Estatísticas</span>
              {project.codes.slice(0,5).map(code=>{const max=Math.max(...project.codes.map(c=>c._count.codings),1);return(
                <div key={code.id} className="mb-2"><div className="flex justify-between mb-1"><span className="text-[11px] text-stone-500">{code.name}</span><span className="text-[11px] text-stone-400">{code._count.codings}</span></div>
                  <div className="bg-stone-100 rounded-sm h-1 overflow-hidden"><div className="h-full rounded-sm" style={{width:`${(code._count.codings/max)*100}%`,background:code.color}}/></div></div>);})}
            </div>
          </>):(<>
            {/* Themes panel */}
            <div className="p-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Temas ({project.themes.length})</span>
              <button onClick={()=>setShowNewTheme(true)} className="px-2.5 py-1 bg-trama-500 hover:bg-trama-600 text-white text-[11px] font-medium rounded-md flex items-center gap-1 transition"><Ic d={ic.plus} className="w-3 h-3"/>Novo</button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin px-3">
              {project.themes.length===0&&<p className="text-xs text-stone-400 text-center py-6">Nenhum tema criado. Crie temas para agrupar códigos relacionados.</p>}
              {project.themes.map(theme=>(
                <div key={theme.id} className="mb-3 border border-stone-100 rounded-lg p-3 hover:border-stone-200 transition">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{background:theme.color}}/>
                    <span className="text-sm font-medium text-stone-700 flex-1">{theme.name}</span>
                    <button onClick={()=>setShowEditTheme(showEditTheme===theme.id?null:theme.id)} className="text-[10px] text-stone-400 hover:text-trama-500 px-1.5 py-0.5 rounded border border-stone-200">editar</button>
                    <button onClick={()=>deleteTheme(theme.id)} className="text-stone-300 hover:text-red-400"><Ic d={ic.x} className="w-3 h-3"/></button>
                  </div>
                  {theme.description&&<p className="text-xs text-stone-400 mb-2 leading-relaxed">{theme.description}</p>}
                  <div className="flex flex-wrap gap-1">
                    {theme.themeCodes.map(tc=>(
                      <span key={tc.code.id} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full" style={{background:`${tc.code.color}15`,color:tc.code.color}}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{background:tc.code.color}}/>{tc.code.name}
                      </span>))}
                    {theme.themeCodes.length===0&&<span className="text-[11px] text-stone-400 italic">Nenhum código associado</span>}
                  </div>
                  {/* Edit theme — associate codes */}
                  {showEditTheme===theme.id&&(
                    <div className="mt-3 pt-3 border-t border-stone-100">
                      <p className="text-[11px] font-medium text-stone-500 mb-2">Códigos deste tema:</p>
                      {project.codes.flatMap(c=>[c,...(c.children||[])]).map(code=>{
                        const has=theme.themeCodes.some(tc=>tc.code.id===code.id);
                        return(
                          <button key={code.id} onClick={()=>toggleThemeCode(theme.id,code.id,has)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-stone-50 transition">
                            <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${has?"border-transparent":"border-stone-300"}`}
                              style={has?{background:code.color}:{}}>
                              {has&&<Ic d={ic.check} className="w-2.5 h-2.5 text-white"/>}
                            </span>
                            <span className="w-2 h-2 rounded-full" style={{background:code.color}}/>
                            <span className="text-xs text-stone-600">{code.name}</span>
                          </button>);})}
                    </div>)}
                </div>))}
            </div>
          </>)}
        </div>
      </div>

      {/* ══ MODALS ══ */}
      {showCodingPopup&&selection&&<CodingPopup codes={project.codes} selectedText={selection.text} onApply={applyCoding} onCreateCode={createCodeInline} onClose={()=>{setShowCodingPopup(false);setSelection(null);}}/>}
      {showUpload&&<UploadModal projectId={project.id} onClose={()=>setShowUpload(false)} onDone={()=>{setShowUpload(false);router.refresh();}}/>}
      {showSearch&&<SearchModal projectId={project.id} documents={project.documents} onNavigate={(idx)=>{setActiveDocIdx(idx);setShowSearch(false);}} onClose={()=>setShowSearch(false)}/>}
      {showNewCode&&<Modal onClose={()=>setShowNewCode(false)}><form onSubmit={createCode} className="w-full max-w-sm">
        <h3 className="text-base font-semibold text-stone-800 mb-4">Novo código</h3>
        <input value={newCodeName} onChange={e=>setNewCodeName(e.target.value)} autoFocus required className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-trama-500/30 focus:border-trama-500" placeholder="Nome do código"/>
        <div className="flex gap-2 mb-5">{COLORS.map(c=><button key={c} type="button" onClick={()=>setNewCodeColor(c)} className={`w-6 h-6 rounded-full transition ${newCodeColor===c?"ring-2 ring-offset-2 ring-stone-400":""}`} style={{background:c}}/>)}</div>
        <div className="flex justify-end gap-2"><button type="button" onClick={()=>setShowNewCode(false)} className="px-3 py-1.5 text-sm text-stone-500">Cancelar</button><button type="submit" disabled={!newCodeName} className="px-4 py-1.5 bg-trama-500 text-white text-sm font-medium rounded-lg disabled:opacity-50">Criar</button></div>
      </form></Modal>}
      {showNewTheme&&<Modal onClose={()=>setShowNewTheme(false)}><form onSubmit={createTheme} className="w-full max-w-sm">
        <h3 className="text-base font-semibold text-stone-800 mb-4">Novo tema</h3>
        <input value={newThemeName} onChange={e=>setNewThemeName(e.target.value)} autoFocus required className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-trama-500/30 focus:border-trama-500" placeholder="Nome do tema"/>
        <textarea value={newThemeDesc} onChange={e=>setNewThemeDesc(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-trama-500/30" placeholder="Descrição (opcional)"/>
        <div className="flex gap-2 mb-5">{COLORS.map(c=><button key={c} type="button" onClick={()=>setNewThemeColor(c)} className={`w-6 h-6 rounded-full transition ${newThemeColor===c?"ring-2 ring-offset-2 ring-stone-400":""}`} style={{background:c}}/>)}</div>
        <div className="flex justify-end gap-2"><button type="button" onClick={()=>setShowNewTheme(false)} className="px-3 py-1.5 text-sm text-stone-500">Cancelar</button><button type="submit" disabled={!newThemeName} className="px-4 py-1.5 bg-trama-500 text-white text-sm font-medium rounded-lg disabled:opacity-50">Criar</button></div>
      </form></Modal>}
      {showAddDoc&&<Modal onClose={()=>setShowAddDoc(false)}><form onSubmit={addDocument} className="w-full max-w-lg">
        <h3 className="text-base font-semibold text-stone-800 mb-4">Colar texto</h3>
        <input value={newDocTitle} onChange={e=>setNewDocTitle(e.target.value)} autoFocus required className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-trama-500/30 focus:border-trama-500" placeholder="Título"/>
        <textarea value={newDocContent} onChange={e=>setNewDocContent(e.target.value)} rows={10} required className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-trama-500/30 font-mono" placeholder="Cole o texto aqui..."/>
        <div className="flex justify-end gap-2"><button type="button" onClick={()=>setShowAddDoc(false)} className="px-3 py-1.5 text-sm text-stone-500">Cancelar</button><button type="submit" disabled={!newDocTitle||!newDocContent} className="px-4 py-1.5 bg-trama-500 text-white text-sm font-medium rounded-lg disabled:opacity-50">Adicionar</button></div>
      </form></Modal>}
    </div>);
}

/* ── Modal wrapper ── */
function Modal({children,onClose}:{children:React.ReactNode;onClose:()=>void}){
  return <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}><div onClick={e=>e.stopPropagation()} className="bg-white rounded-xl shadow-xl p-6">{children}</div></div>;}

/* ── Coding Popup with inline code creation ── */
function CodingPopup({codes,selectedText,onApply,onCreateCode,onClose}:{codes:{id:string;name:string;color:string;children?:any[]}[];selectedText:string;onApply:(codeId:string,memo:string)=>void;onCreateCode:(name:string,color:string)=>Promise<string|null>;onClose:()=>void;}){
  const [sel,setSel]=useState<string|null>(null);const [memo,setMemo]=useState("");const [search,setSearch]=useState("");
  const [creating,setCreating]=useState(false);const [newN,setNewN]=useState("");const [newC,setNewC]=useState("#6366f1");const [saving,setSaving]=useState(false);
  const all=codes.flatMap(c=>[c,...(c.children||[])]);
  const filtered=all.filter(c=>!search||c.name.toLowerCase().includes(search.toLowerCase()));
  async function handleCreate(){setSaving(true);const id=await onCreateCode(creating?newN:search.trim(),newC);setSaving(false);if(id){setSel(id);setCreating(false);setSearch("");}}
  return(
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-semibold text-stone-800">Codificar trecho</h3><button onClick={onClose} className="text-stone-400 hover:text-stone-600"><Ic d={ic.x} className="w-4 h-4"/></button></div>
        <div className="bg-stone-50 rounded-lg p-3 mb-4 border-l-[3px] border-argila"><p className="text-xs text-stone-500 italic leading-relaxed line-clamp-3">&ldquo;{selectedText}&rdquo;</p><span className="text-[11px] text-stone-400 mt-1.5 block">{selectedText.length} caracteres</span></div>
        <div className="flex items-center bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 gap-1.5 mb-3"><Ic d={ic.search} className="w-3 h-3 text-stone-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar ou criar código..." className="bg-transparent text-xs flex-1 outline-none" autoFocus/></div>
        {!creating?(<div className="max-h-48 overflow-y-auto mb-3 scrollbar-thin">
          {filtered.map(c=>(<button key={c.id} onClick={()=>setSel(c.id)} className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md mb-0.5 transition text-left ${sel===c.id?"bg-stone-100":"hover:bg-stone-50"}`}>
            <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${sel===c.id?"border-transparent":"border-stone-300"}`} style={sel===c.id?{background:c.color}:{}}>
              {sel===c.id&&<Ic d={ic.check} className="w-2.5 h-2.5 text-white"/>}</span>
            <span className="w-2 h-2 rounded-full" style={{background:c.color}}/><span className="text-sm text-stone-700">{c.name}</span></button>))}
          {search.trim()&&<button onClick={()=>{setCreating(true);setNewN(search.trim());}} className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-md text-left hover:bg-trama-50 border border-dashed border-stone-200 mt-2 transition">
            <span className="w-4 h-4 rounded bg-trama-500 flex items-center justify-center shrink-0"><Ic d={ic.plus} className="w-2.5 h-2.5 text-white"/></span>
            <span className="text-sm text-trama-600 font-medium">Criar &ldquo;{search.trim()}&rdquo;</span></button>}
        </div>):(
          <div className="bg-stone-50 rounded-lg p-3 mb-3 border border-stone-200">
            <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-2">Novo código</p>
            <input value={newN} onChange={e=>setNewN(e.target.value)} autoFocus className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-trama-500/30 bg-white" placeholder="Nome"/>
            <div className="flex gap-2 mb-3">{COLORS.map(c=><button key={c} type="button" onClick={()=>setNewC(c)} className={`w-5 h-5 rounded-full transition ${newC===c?"ring-2 ring-offset-1 ring-stone-400":""}`} style={{background:c}}/>)}</div>
            <div className="flex gap-2"><button onClick={()=>setCreating(false)} className="px-3 py-1 text-xs text-stone-500">Voltar</button>
              <button onClick={handleCreate} disabled={!newN.trim()||saving} className="px-3 py-1 bg-trama-500 text-white text-xs font-medium rounded-md disabled:opacity-50">{saving?"Criando...":"Criar e selecionar"}</button></div>
          </div>)}
        <label className="text-[11px] font-medium text-stone-400 uppercase tracking-wider block mb-1.5">Memo (opcional)</label>
        <textarea value={memo} onChange={e=>setMemo(e.target.value)} rows={2} placeholder="Nota sobre este trecho..." className="w-full px-3 py-2 rounded-lg border border-stone-200 text-xs resize-none mb-4 focus:outline-none focus:ring-2 focus:ring-trama-500/30"/>
        <div className="flex justify-end gap-2"><button onClick={onClose} className="px-3 py-1.5 text-sm text-stone-500">Cancelar</button>
          <button onClick={()=>sel&&onApply(sel,memo)} disabled={!sel} className="px-4 py-1.5 bg-trama-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition">Aplicar</button></div>
      </div>
    </div>);}

/* ── Upload Modal ── */
function UploadModal({projectId,onClose,onDone}:{projectId:string;onClose:()=>void;onDone:()=>void}){
  const [dragging,setDragging]=useState(false);const [files,setFiles]=useState<File[]>([]);const [uploading,setUploading]=useState(false);
  const [progress,setProgress]=useState<Record<string,string>>({});const inputRef=useRef<HTMLInputElement>(null);
  const ACCEPT=".txt,.md,.pdf,.docx,.mp3,.m4a,.wav,.ogg,.webm,.mp4,.mov";
  function addFiles(f:FileList|File[]){const a=Array.from(f);setFiles(p=>[...p,...a]);a.forEach(f=>setProgress(p=>({...p,[f.name]:"pending"})));}
  function handleDrop(e:React.DragEvent){e.preventDefault();setDragging(false);if(e.dataTransfer.files.length)addFiles(e.dataTransfer.files);}
  async function uploadAll(){setUploading(true);for(const f of files){setProgress(p=>({...p,[f.name]:"uploading"}));try{
    const fd=new FormData();fd.append("file",f);fd.append("projectId",projectId);fd.append("title",f.name.replace(/\.[^.]+$/,""));
    const r=await fetch("/api/upload",{method:"POST",body:fd});setProgress(p=>({...p,[f.name]:r.ok?"done":"error"}));}catch{setProgress(p=>({...p,[f.name]:"error"}));}}
    setUploading(false);setTimeout(onDone,500);}
  const stC:Record<string,string>={uploading:"text-trama-500",done:"text-green-600",error:"text-red-500"};
  const stL:Record<string,string>={uploading:"Enviando...",done:"Pronto",error:"Erro"};
  const fIc=(n:string)=>{const e=n.split(".").pop()?.toLowerCase()||"";if(["mp3","m4a","wav","ogg"].includes(e))return ic.music;if(["mp4","webm","mov"].includes(e))return ic.film;return ic.doc;};
  return(
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4"><h3 className="text-base font-semibold text-stone-800">Upload de arquivos</h3><button onClick={onClose} className="text-stone-400 hover:text-stone-600"><Ic d={ic.x} className="w-4 h-4"/></button></div>
        <p className="text-xs text-stone-400 mb-4">Texto: TXT, MD, PDF, DOCX · Áudio: MP3, M4A, WAV, OGG · Vídeo: MP4, WebM, MOV · Máx: 50MB</p>
        <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={handleDrop} onClick={()=>inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition mb-4 ${dragging?"border-trama-500 bg-trama-50":"border-stone-200 hover:border-stone-300"}`}>
          <Ic d={ic.upload} className="w-8 h-8 text-stone-300 mx-auto mb-3"/><p className="text-sm text-stone-500 mb-1">Arraste arquivos aqui</p><p className="text-xs text-stone-400">ou clique para selecionar</p>
          <input ref={inputRef} type="file" multiple accept={ACCEPT} className="hidden" onChange={e=>e.target.files&&addFiles(e.target.files)}/></div>
        {files.length>0&&<div className="max-h-48 overflow-y-auto mb-4 space-y-1 scrollbar-thin">
          {files.map(f=><div key={f.name} className="flex items-center gap-2 px-3 py-2 bg-stone-50 rounded-lg">
            <Ic d={fIc(f.name)} className="w-4 h-4 text-stone-400 shrink-0"/><span className="text-sm text-stone-700 flex-1 truncate">{f.name}</span>
            <span className="text-[11px] text-stone-400">{(f.size/1024/1024).toFixed(1)}MB</span>
            {progress[f.name]&&progress[f.name]!=="pending"&&<span className={`text-[11px] font-medium ${stC[progress[f.name]]||""}`}>{stL[progress[f.name]]||""}</span>}
            {!uploading&&<button onClick={()=>{setFiles(p=>p.filter(x=>x.name!==f.name));setProgress(p=>{const n={...p};delete n[f.name];return n;});}} className="text-stone-400 hover:text-stone-600 shrink-0"><Ic d={ic.x} className="w-3 h-3"/></button>}
          </div>)}</div>}
        <div className="flex justify-end gap-2"><button onClick={onClose} className="px-3 py-1.5 text-sm text-stone-500">Cancelar</button>
          <button onClick={uploadAll} disabled={files.length===0||uploading} className="px-4 py-1.5 bg-trama-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition flex items-center gap-1.5">
            <Ic d={ic.upload} className="w-3.5 h-3.5"/>{uploading?"Enviando...":`Enviar ${files.length} arquivo${files.length!==1?"s":""}`}</button></div>
      </div>
    </div>);}

/* ── Search Modal (⌘K) ── */
function SearchModal({projectId,documents,onNavigate,onClose}:{projectId:string;documents:Doc[];onNavigate:(idx:number)=>void;onClose:()=>void}){
  const [query,setQuery]=useState("");const [results,setResults]=useState<{documentId:string;documentTitle:string;excerpt:string;offset:number}[]>([]);
  const [loading,setLoading]=useState(false);const inputRef=useRef<HTMLInputElement>(null);
  useEffect(()=>{inputRef.current?.focus();},[]);
  useEffect(()=>{if(query.length<2){setResults([]);return;}
    const t=setTimeout(async()=>{setLoading(true);const r=await fetch(`/api/busca?projectId=${projectId}&q=${encodeURIComponent(query)}`);
      if(r.ok){const d=await r.json();setResults(d.results||[]);}setLoading(false);},300);
    return()=>clearTimeout(t);},[query,projectId]);
  function navigate(docId:string){const idx=documents.findIndex(d=>d.id===docId);if(idx>=0)onNavigate(idx);}
  return(
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-[15vh] z-50" onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-200">
          <Ic d={ic.search} className="w-4 h-4 text-stone-400 shrink-0"/>
          <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar em todos os documentos..."
            className="flex-1 text-sm outline-none" autoFocus/>
          <kbd className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading&&<p className="text-xs text-stone-400 text-center py-6">Buscando...</p>}
          {!loading&&query.length>=2&&results.length===0&&<p className="text-xs text-stone-400 text-center py-6">Nenhum resultado para &ldquo;{query}&rdquo;</p>}
          {results.map((r,i)=>(
            <button key={i} onClick={()=>navigate(r.documentId)} className="w-full text-left px-4 py-3 hover:bg-stone-50 border-b border-stone-100 transition">
              <span className="text-xs font-medium text-trama-500 block mb-1">{r.documentTitle}</span>
              <span className="text-xs text-stone-600 leading-relaxed">{r.excerpt}</span>
            </button>))}
        </div>
        {query.length<2&&<p className="text-xs text-stone-400 text-center py-6">Digite pelo menos 2 caracteres para buscar</p>}
      </div>
    </div>);}
