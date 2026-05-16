"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { SL_MAP_PATHS, VIEWBOX } from "./srilankaMapData";

export const SL_DISTRICTS = [
    "Ampara","Anuradhapura","Badulla","Batticaloa","Colombo",
    "Galle","Gampaha","Hambantota","Jaffna","Kalutara",
    "Kandy","Kegalle","Kilinochchi","Kurunegala","Mannar",
    "Matale","Matara","Monaragala","Mullaitivu","Nuwara Eliya",
    "Polonnaruwa","Puttalam","Ratnapura","Trincomalee","Vavuniya",
];

const PROV_COLOR: Record<string,string> = {
    Northern:"#7c3aed","North Central":"#d97706","North Western":"#0891b2",
    Central:"#059669",Western:"#2563eb",Sabaragamuwa:"#ea580c",
    Eastern:"#db2777",Uva:"#dc2626",Southern:"#65a30d",
};
const DIST_PROV: Record<string,string> = {
    Jaffna:"Northern",Kilinochchi:"Northern",Mannar:"Northern",Mullaitivu:"Northern",Vavuniya:"Northern",
    Anuradhapura:"North Central",Polonnaruwa:"North Central",
    Puttalam:"North Western",Kurunegala:"North Western",
    Kandy:"Central",Matale:"Central","Nuwara Eliya":"Central",
    Colombo:"Western",Gampaha:"Western",Kalutara:"Western",
    Kegalle:"Sabaragamuwa",Ratnapura:"Sabaragamuwa",
    Trincomalee:"Eastern",Batticaloa:"Eastern",Ampara:"Eastern",
    Badulla:"Uva",Monaragala:"Uva",
    Galle:"Southern",Matara:"Southern",Hambantota:"Southern",
};

interface Props { value:string; onChange:(d:string)=>void; required?:boolean }

export default function DistrictDropdown({value,onChange,required}:Props) {
    const [open,setOpen] = useState(false);
    const [search,setSearch] = useState("");
    const [hovered,setHovered] = useState("");
    const [pos,setPos] = useState({top:0,left:0,width:0,goUp:false});
    const [mounted,setMounted] = useState(false);
    const PANEL_H = 320;
    const trigRef = useRef<HTMLButtonElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const listRefs = useRef<Record<string,HTMLButtonElement|null>>({});

    useEffect(()=>{setMounted(true);},[]);

    const calcPos = useCallback(()=>{
        if(!trigRef.current) return;
        const r = trigRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - r.bottom;
        const goUp = spaceBelow < PANEL_H && r.top > spaceBelow;
        const top = goUp
            ? r.top + window.scrollY - PANEL_H - 4
            : r.bottom + window.scrollY + 4;
        setPos({top, left:r.left+window.scrollX, width:r.width, goUp});
    },[PANEL_H]);

    const handleOpen = ()=>{ calcPos(); setOpen(o=>!o); };

    useEffect(()=>{
        if(!open) return;
        setTimeout(()=>searchRef.current?.focus(),80);
        const onPtr=(e:PointerEvent)=>{
            const panel=document.getElementById("dd-panel");
            if(!trigRef.current?.contains(e.target as Node)&&!panel?.contains(e.target as Node)){
                setOpen(false); setSearch("");
            }
        };
        const onScroll=()=>calcPos();
        document.addEventListener("pointerdown",onPtr);
        window.addEventListener("scroll",onScroll,true);
        return()=>{document.removeEventListener("pointerdown",onPtr);window.removeEventListener("scroll",onScroll,true);};
    },[open,calcPos]);

    const filtered = SL_DISTRICTS.filter(d=>d.toLowerCase().includes(search.toLowerCase()));
    const select=(d:string)=>{onChange(d);setOpen(false);setSearch("");};

    const PANEL_W=580;
    const panelLeft = typeof window!=="undefined"
        ? Math.max(8, Math.min(pos.left+pos.width/2-PANEL_W/2, window.innerWidth-PANEL_W-8))
        : pos.left;

    return (
        <div style={{position:"relative"}}>
            {required&&<input tabIndex={-1} required value={value} onChange={()=>{}} style={{position:"absolute",opacity:0,width:"100%",height:1,pointerEvents:"none"}}/>}

            {/* Trigger */}
            <button type="button" ref={trigRef} onClick={handleOpen} style={{
                width:"100%",display:"flex",alignItems:"center",gap:"0.65rem",
                padding:"0 1rem",height:52,
                borderRadius:open?"14px 14px 0 0":14,
                background:open?"rgba(240,246,255,0.92)":"rgba(248,250,255,0.65)",
                backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
                border:`1.5px solid ${value||open?"rgba(26,115,232,0.35)":"rgba(26,115,232,0.14)"}`,
                boxShadow:value?"0 0 0 3px rgba(26,115,232,0.08),inset 0 1px 0 rgba(255,255,255,0.8)":"0 2px 16px rgba(26,115,232,0.06),inset 0 1px 0 rgba(255,255,255,0.8)",
                cursor:"pointer",transition:"all 0.2s",outline:"none",textAlign:"left",
            }}>
                <span style={{fontSize:"1rem",opacity:0.55,flexShrink:0}}>📍</span>
                <span style={{flex:1,fontSize:"0.9rem",color:value?"var(--text-primary)":"#9ca3af",fontWeight:value?500:400}}>
                    {value||"Select district…"}
                </span>
                {value&&(
                    <span style={{fontSize:"0.68rem",fontWeight:700,padding:"2px 8px",borderRadius:999,background:`${PROV_COLOR[DIST_PROV[value]]}20`,color:PROV_COLOR[DIST_PROV[value]]}}>
                        {DIST_PROV[value]}
                    </span>
                )}
                <motion.svg animate={{rotate:open?180:0}} transition={{duration:0.18}}
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke={open?"var(--vet-blue)":"#6b7280"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                </motion.svg>
            </button>

            {mounted&&open&&createPortal(
                <AnimatePresence>
                    <motion.div id="dd-panel" key="ddp"
                        initial={{opacity:0,y:-10,scaleY:0.95}}
                        animate={{opacity:1,y:0,scaleY:1}}
                        exit={{opacity:0,y:-8,scaleY:0.95}}
                        transition={{duration:0.18,ease:"easeOut"}}
                        style={{
                            position:"absolute",
                            top:pos.top,
                            left:panelLeft,
                            width:PANEL_W,
                            zIndex:2147483647,
                            display:"flex",
                            background:"rgba(245,248,255,0.97)",
                            backdropFilter:"blur(28px)",
                            WebkitBackdropFilter:"blur(28px)",
                            border:"1.5px solid rgba(26,115,232,0.18)",
                            borderRadius:18,
                            boxShadow:"0 24px 56px rgba(26,115,232,0.16),0 4px 16px rgba(0,0,0,0.08)",
                            overflow:"hidden",
                            transformOrigin:pos.goUp?"bottom center":"top center",
                        }}>

                        {/* LEFT — search + list */}
                        <div style={{width:220,display:"flex",flexDirection:"column",borderRight:"1px solid rgba(26,115,232,0.1)",flexShrink:0}}>
                            <div style={{display:"flex",alignItems:"center",gap:"0.4rem",padding:"0.6rem 0.8rem",borderBottom:"1px solid rgba(26,115,232,0.08)"}}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                <input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)}
                                    placeholder="Search district…"
                                    style={{flex:1,border:"none",outline:"none",background:"transparent",fontSize:"0.82rem",color:"var(--text-primary)",fontFamily:"inherit"}}/>
                                {search&&<button type="button" onClick={()=>setSearch("")} style={{background:"none",border:"none",cursor:"pointer",color:"#9ca3af",fontSize:"0.8rem",padding:0}}>✕</button>}
                            </div>
                            <div style={{overflowY:"auto",maxHeight:280,padding:"0.3rem"}}>
                                {filtered.length===0
                                    ?<div style={{padding:"1rem",textAlign:"center",color:"var(--text-muted)",fontSize:"0.82rem"}}>No results</div>
                                    :filtered.map(d=>{
                                        const col=PROV_COLOR[DIST_PROV[d]];
                                        const sel=value===d,hov=hovered===d;
                                        return(
                                            <button key={d} type="button"
                                                ref={el=>{listRefs.current[d]=el;}}
                                                onClick={()=>select(d)}
                                                onMouseEnter={()=>setHovered(d)}
                                                onMouseLeave={()=>setHovered("")}
                                                style={{width:"100%",display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.45rem 0.65rem",borderRadius:8,border:"none",background:sel?`${col}18`:hov?"rgba(26,115,232,0.05)":"transparent",color:sel?col:"var(--text-primary)",fontSize:"0.84rem",fontWeight:sel?600:400,cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all 0.12s"}}>
                                                <span style={{width:6,height:6,borderRadius:"50%",flexShrink:0,background:col,opacity:sel||hov?1:0.35,transition:"opacity 0.12s"}}/>
                                                {d}
                                                {sel&&<svg style={{marginLeft:"auto",flexShrink:0}} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                            </button>
                                        );
                                    })}
                            </div>
                            <div style={{padding:"0.35rem 0.8rem",borderTop:"1px solid rgba(26,115,232,0.08)",fontSize:"0.68rem",color:"var(--text-muted)"}}>
                                {filtered.length} / {SL_DISTRICTS.length} districts
                            </div>
                        </div>

                        {/* RIGHT — real SVG map */}
                        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0.75rem 0.5rem",background:"linear-gradient(135deg,rgba(241,245,255,0.7),rgba(224,234,255,0.5))",position:"relative",minWidth:0}}>
                            <div style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",color:"#6b7280",marginBottom:"0.4rem"}}>
                                🗺 Sri Lanka — Click district
                            </div>
                            <svg viewBox={VIEWBOX} style={{width:"100%",maxWidth:190,height:"auto",filter:"drop-shadow(0 6px 20px rgba(26,115,232,0.15))"}}>
                                {SL_MAP_PATHS.map(({name,d})=>{
                                    const col=PROV_COLOR[DIST_PROV[name]];
                                    const sel=value===name,hov=hovered===name;
                                    return(
                                        <path key={name} d={d}
                                            fill={sel?col:hov?`${col}88`:`${col}30`}
                                            stroke={sel?col:hov?`${col}aa`:`${col}55`}
                                            strokeWidth={sel?1.5:0.8}
                                            style={{cursor:"pointer",transition:"fill 0.15s,stroke 0.15s"}}
                                            onClick={()=>select(name)}
                                            onMouseEnter={()=>{setHovered(name);listRefs.current[name]?.scrollIntoView({block:"nearest",behavior:"smooth"});}}
                                            onMouseLeave={()=>setHovered("")}
                                        />
                                    );
                                })}
                            </svg>
                            <AnimatePresence>
                                {hovered&&(
                                    <motion.div key={hovered}
                                        initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                                        transition={{duration:0.12}}
                                        style={{position:"absolute",bottom:"0.6rem",left:"50%",transform:"translateX(-50%)",background:PROV_COLOR[DIST_PROV[hovered]],color:"#fff",padding:"0.28rem 0.75rem",borderRadius:999,fontSize:"0.74rem",fontWeight:700,whiteSpace:"nowrap",pointerEvents:"none",boxShadow:"0 4px 12px rgba(0,0,0,0.15)"}}>
                                        {hovered} · {DIST_PROV[hovered]}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </AnimatePresence>
            ,document.body)}
        </div>
    );
}
