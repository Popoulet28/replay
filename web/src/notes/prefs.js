import { clone } from '../core/helpers.js';
import { S } from '../core/state.js';
import { saveSettings } from '../core/storage.js';

/* ---------------- réglages de l'encre ---------------- */
export const INK_DEFAULT={ pen:{type:'fountain', size:2.4, color:'#1d2fa0'}, hl:{color:'#ffe94d', size:18, straight:true},
  eraser:{mode:'stroke', size:16, hlOnly:false}, shape:{color:'#16182a', size:2.4}, text:{size:22, color:'#16182a', font:'sans'},
  finger:false, penButton:true, gestures:true, recent:[] };
export function inkPrefs(){ const s=S.settings; if(!s.ink) s.ink=clone(INK_DEFAULT); for(const k in INK_DEFAULT) if(s.ink[k]===undefined) s.ink[k]=clone(INK_DEFAULT[k]); return s.ink; }
export let inkSaveT=null; export function inkPrefsChanged(){ clearTimeout(inkSaveT); inkSaveT=setTimeout(()=>saveSettings(),600); }
export const PEN_COLORS=['#1d2fa0','#16182a','#d3302f','#1d8a4e','#7a3fc4','#e07020','#2f8fd8','#8b8f9f'];
export const HL_COLORS=['#ffe94d','#9cf0a0','#ffa3cf','#9cd3ff','#ffc27a'];
export const PEN_SIZES=[1.4,2.4,4.2], HL_SIZES=[11,18,28], ER_SIZES=[8,16,34];

