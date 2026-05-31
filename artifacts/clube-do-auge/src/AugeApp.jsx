import { useState, useRef, useCallback, useEffect } from "react";

// ─── BRAND KIT ────────────────────────────────────────────────────────────────
const C = {
  creme:"#FAF6EE", linho:"#F0E9DA", branco:"#FFFFFF",
  obs:"#1C1A17", obs2:"#2E2825", mid:"#5A4B43", lt:"#9C8880",
  ouro:"#C4A882", ouroDk:"#A8865A", ouroLt:"#EAD8B8",
  blush:"#E2B9A8", terra:"#7E5344",
  atencao:"#A32D2D", dev:"#854F0B", augeZ:"#0F6E56",
};
const FS = "'Cormorant Garamond', Georgia, serif";
const FB = "'Inter', sans-serif";

// ─── TELAS ────────────────────────────────────────────────────────────────────
const S = {
  SPLASH:"splash", LEGAL:"legal", LOGIN:"login",
  // Abas principais
  HOME:"home",   // checkin + calendário
  FEED:"feed",   // feed da comunidade
  JOR:"jor",     // jornada (restrita)
  CT:"ct",       // conteúdo
  PF:"pf",       // perfil
  // Subpáginas Feed
  NOVO:"novo", VOZ:"voz",
  // Subpáginas Conexões (dentro do Feed)
  CX:"cx", MATCH:"match", CHAT:"chat",
  // Subpáginas Jornada
  RODA:"roda", RET:"ret", CAL:"cal", ESC:"esc", EM:"em",
  // Diagnóstico
  DIAG:"diag",
};

const ABA_ORIGEM = {
  [S.HOME]:S.HOME,
  [S.FEED]:S.FEED, [S.NOVO]:S.FEED, [S.VOZ]:S.FEED,
  [S.CX]:S.CX, [S.MATCH]:S.CX, [S.CHAT]:S.CX,
  [S.JOR]:S.JOR, [S.RODA]:S.JOR, [S.RET]:S.JOR,
  [S.CAL]:S.JOR, [S.ESC]:S.JOR, [S.EM]:S.JOR,
  [S.CT]:S.CT, [S.PF]:S.PF,
};

// ─── DADOS ────────────────────────────────────────────────────────────────────
const HAB = {
  1:[{id:1,t:"Fiz meu movimento hoje"}],
  2:[{id:1,t:"Fiz meu movimento"},{id:2,t:"Não pulei nenhuma refeição"},{id:3,t:"Bebi 1,5L de água"},{id:4,t:"Proteína em 2+ refeições"}],
  3:[{id:1,t:"Fiz meu movimento"},{id:2,t:"Não pulei nenhuma refeição"},{id:3,t:"Bebi 1,5L de água"},{id:4,t:"Proteína em 2+ refeições"},{id:5,t:"Tive um momento só meu"},{id:6,t:"Respeitei meu horário de dormir"}],
};

const PERFIS_CX = [
  {id:1,nome:"Mariana Costa",ini:"MC",cor:"#8B4A6B",idade:52,cidade:"São Paulo",bio:"Pilates e caminhada. Busco parceira de manhã!",hab:["Pilates","Caminhada"],ok:true,compat:92,msgs:[]},
  {id:2,nome:"Cecília Alves",ini:"CA",cor:"#3A6B5C",idade:60,cidade:"Curitiba",bio:"Musculação 4x semana. Energia total!",hab:["Musculação","Funcional"],ok:true,compat:85,msgs:[]},
  {id:3,nome:"Lúcia Mendes",ini:"LM",cor:"#5C4A8B",idade:56,cidade:"Florianópolis",bio:"Amo nadar e estar perto do mar.",hab:["Natação","Caminhada"],ok:false,compat:78,msgs:[]},
];

const FEED0 = [
  {id:1,aut:"Mariana Costa",ini:"MC",cor:"#8B4A6B",fundo:"#3D2B35",tit:"Corrida 5km",desc:"Sol lindo hoje! Bati meu recorde pessoal.",tempo:"há 1h",publica:true,cur:["CA"],com:[{q:"CA",t:"Arrasou! 🔥"}]},
  {id:2,aut:"Cecília Alves",ini:"CA",cor:"#3A6B5C",fundo:"#1E2E2A",tit:"Musculação",desc:"Dia de pernas. Cada vez mais forte.",tempo:"há 3h",publica:true,cur:[],com:[]},
  {id:3,aut:"Você",ini:"RF",cor:C.ouroDk,fundo:"#1E252E",tit:"Yoga 40min",desc:"Paz total. Mente renovada.",tempo:"há 6h",publica:true,cur:["MC","CA"],com:[]},
];

const RODA_Q = [
  {id:1,dim:"Energia",tipo:"f",q:"Acordo com disposição e energia para começar o dia."},
  {id:2,dim:"Energia",tipo:"f",q:"Tenho energia suficiente para cumprir minhas obrigações sem me sentir esgotada no fim do dia."},
  {id:3,dim:"Energia",tipo:"f",q:"Me movimento ou pratico alguma atividade física durante a semana."},
  {id:4,dim:"Energia",tipo:"f",q:"Durmo e acordo em horários regulares."},
  {id:5,dim:"Energia",tipo:"f",q:"Consigo descansar de verdade quando preciso, sem culpa ou ansiedade."},
  {id:6,dim:"Consciência",tipo:"c",q:"Sei identificar o que me drena energia e o que me renova."},
  {id:7,dim:"Consciência",tipo:"c",q:"Conheço meus padrões de sabotagem: o que me faz desistir quando começo algo."},
  {id:8,dim:"Consciência",tipo:"c",q:"Consigo nomear o que quero para os próximos anos da minha vida."},
  {id:9,dim:"Consciência",tipo:"c",q:"Me percebo mudando com o tempo e aceito isso sem tanto sofrimento."},
  {id:10,dim:"Consciência",tipo:"c",q:"Consigo diferenciar o que é meu do que são expectativas dos outros sobre mim."},
  {id:11,dim:"Organização",tipo:"f",q:"Sei quais são minhas prioridades da semana antes de ela começar."},
  {id:12,dim:"Organização",tipo:"f",q:"Cumpro o que me comprometo a fazer por mim mesma."},
  {id:13,dim:"Organização",tipo:"f",q:"Tenho ao menos um momento na semana dedicado exclusivamente a mim."},
  {id:14,dim:"Organização",tipo:"f",q:"Quando a rotina desmorona, consigo retomar sem esperar o momento perfeito."},
  {id:15,dim:"Organização",tipo:"f",q:"Distribuo minhas tarefas de forma que não me sobrecarregue num único dia."},
  {id:16,dim:"Autocuidado",tipo:"f",q:"Faço refeições com qualidade, sem pular nenhuma ao longo do dia."},
  {id:17,dim:"Autocuidado",tipo:"f",q:"Bebo água com regularidade durante o dia."},
  {id:18,dim:"Autocuidado",tipo:"f",q:"Tenho algum ritual de cuidado pessoal que faço por mim, não por obrigação."},
  {id:19,dim:"Autocuidado",tipo:"f",q:"Vou a consultas médicas e exames de rotina sem precisar ser lembrada."},
  {id:20,dim:"Autocuidado",tipo:"f",q:"Dedico tempo ao que me dá prazer fora das obrigações do trabalho e da família."},
  {id:21,dim:"Protagonismo",tipo:"c",q:"Sinto que tenho controle sobre as escolhas que definem minha vida."},
  {id:22,dim:"Protagonismo",tipo:"c",q:"Quando algo não está bem, busco ativamente mudar em vez de esperar."},
  {id:23,dim:"Protagonismo",tipo:"c",q:"Me permito colocar minhas necessidades como prioridade sem me sentir egoísta."},
  {id:24,dim:"Protagonismo",tipo:"c",q:"Acredito que o melhor da minha vida ainda está por vir."},
  {id:25,dim:"Protagonismo",tipo:"c",q:"Tomo decisões sobre minha saúde e bem-estar sem depender da aprovação de outros."},
];
const DIMS = ["Energia","Consciência","Organização","Autocuidado","Protagonismo"];
const OFREQ = [{l:"Nunca",v:0},{l:"Às vezes",v:3.33},{l:"Quase sempre",v:6.67},{l:"Sempre",v:10}];
const OCONC = [{l:"Discordo totalmente",v:0},{l:"Discordo",v:3.33},{l:"Concordo",v:6.67},{l:"Concordo totalmente",v:10}];
const CAL_D = {1:"f",2:"f",3:"p",4:"f",5:"f",6:"v",7:"f",8:"f",9:"f",10:"p",11:"f",12:"f",13:"k",14:"f",15:"v",16:"f",17:"f",18:"p",19:"f",20:"f",21:"*",22:"f",23:"f",24:"v",25:"f",26:"h"};

const DIAG_Q = [
  {id:1,q:"Quando estabeleço uma meta e erro uma vez, costumo:",opts:["Recomeçar do zero na semana seguinte","Continuar do ponto onde parei","Desistir completamente","Reduzir a meta e manter"]},
  {id:2,q:"Minha relação com rotinas é:",opts:["Amo rotinas, me sinto perdida sem elas","Prefiro flexibilidade total","Começo bem mas dificulto manter","Funciona por períodos, depois abandono"]},
  {id:3,q:"Quando não estou com motivação para algo saudável:",opts:["Espero a vontade aparecer","Faço mesmo sem vontade, ainda que menor","Compenso depois com mais intensidade","Busco alguém para me apoiar"]},
  {id:4,q:"Meu maior desafio com hábitos é:",opts:["Começar","Manter consistência","Retomar após pausa","Não me cobrar demais"]},
  {id:5,q:"Diante de um imprevisto que muda minha rotina:",opts:["Fico ansiosa e busco alternativa","Aceito que o dia foi perdido","Faço uma versão reduzida do que planejei","Ajusto na semana seguinte"]},
];

const MEDALHAS = [
  {id:"momentum",   icon:"🥇",nome:"Largada de Momentum",   cor:C.ouro},
  {id:"retomada",   icon:"🛡️",nome:"Mestre da Retomada",    cor:C.ouroDk},
  {id:"protagonista",icon:"👑",nome:"Protagonista Consistente",cor:C.ouroLt},
];

// ─── IA ───────────────────────────────────────────────────────────────────────
const SYS_ISA = `Você é a assistente virtual da Dra. Isadora Zaniboni, médica geriatra, criadora do Clube do Auge.
TOM: Calorosa, direta, coloquial. Use "pra","tá","a gente". Parágrafos curtos. Termine com afeto 💖 ou ☀️.
NUNCA: "disciplina"/"força de vontade"/"estudos mostram"/"combater o envelhecimento"/"vai melhorar seus exames"/"idosa"/"declínio".
USE: "longevidade","energia","bem-estar","protagonismo".
REGRAS: Máx 3 sugestões. Sintoma físico → indique consulta presencial. Nunca prescreva. Português brasileiro.`;
const iaCache = new Map();
const callISA = async (msg) => {
  if (iaCache.has(msg)) return iaCache.get(msg);
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:300,system:SYS_ISA,messages:[{role:"user",content:msg}]})});
    const d = await r.json();
    const t = d.content?.[0]?.text || "Não consegui processar agora. Tente em instantes!";
    iaCache.set(msg,t); return t;
  } catch { return "Estou com dificuldade de conexão. Tente em instantes! 🌿"; }
};

// ─── LOCAL STORAGE HOOK ───────────────────────────────────────────────────────
function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s !== null ? JSON.parse(s) : initial;
    } catch { return initial; }
  });
  const set = v => {
    setVal(prev => {
      const next = typeof v === "function" ? v(prev) : v;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  };
  return [val, set];
}

// ─── LOGO SVG (brand kit oficial) ────────────────────────────────────────────
function Logo({ width=200, fundo="escuro" }) {
  const textoAuge = fundo==="escuro" ? "#F0E9DA" : "#1C1A17";
  const textoClube = fundo==="escuro" ? "#6B5E52" : "#9A8C7E";
  const arco = fundo==="escuro" ? "#C4A882" : "#C4A882";
  const tag = "#C4A882";
  const h = width * (158/380);
  return (
    <svg width={width} height={h} viewBox="0 0 380 158" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M 35 126 C 110 142 272 46 350 38" stroke={arco} strokeWidth="0.55" fill="none" strokeLinecap="round"/>
      <circle cx="350" cy="38" r="1.5" fill={arco}/>
      <text x="190" y="34" textAnchor="middle" fontFamily="'Inter',sans-serif" fontWeight="300" fontSize="10" letterSpacing="7" fill={textoClube}>CLUBE DO</text>
      <text x="190" y="110" textAnchor="middle" fontFamily="'Cormorant Garamond',Georgia,serif" fontWeight="300" fontSize="80" letterSpacing="18" fill={textoAuge}>AUGE</text>
      <text x="190" y="144" textAnchor="middle" fontFamily="'Inter',sans-serif" fontWeight="300" fontSize="7" letterSpacing="4.5" fill={tag}>MÉTODO · MOVIMENTO · 40+</text>
    </svg>
  );
}

// ─── ÍCONES NAV ───────────────────────────────────────────────────────────────
const Ico = {
  home: c=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  feed: c=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/></svg>,
  jor:  c=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  ct:   c=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  cx:   c=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  pf:   c=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

// ─── COMPONENTES BASE ─────────────────────────────────────────────────────────
function Grain({ children, style={} }) {
  return (
    <div style={{position:"relative",minHeight:"100%",...style}}>
      <div style={{position:"absolute",inset:0,background:C.obs,
        backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E")`,
        backgroundSize:"200px 200px",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"relative",zIndex:1}}>{children}</div>
    </div>
  );
}

function Phone({ children }) {
  return (
    <div style={{display:"flex",justifyContent:"center",alignItems:"center",minHeight:"100vh",background:"#0D0D14",fontFamily:FB}}>
      <div style={{width:390,height:844,background:C.obs,borderRadius:50,overflow:"hidden",position:"relative",boxShadow:"0 0 0 10px #0D0D14,0 0 0 12px #1a1a28,0 40px 80px rgba(0,0,0,.8)",display:"flex",flexDirection:"column"}}>
        <div style={{background:C.obs,padding:"12px 24px 8px",display:"flex",justifyContent:"space-between",fontSize:12,color:C.lt,fontFamily:FB,fontWeight:300}}>
          <span>9:41</span><span>●●● 🔋</span>
        </div>
        {children}
      </div>
    </div>
  );
}
function Rolar({ children }) { return <div style={{flex:1,overflowY:"auto",overflowX:"hidden"}}>{children}</div>; }
function Brinde({ msg }) {
  return <div style={{position:"absolute",top:56,left:"50%",zIndex:300,transform:"translateX(-50%)",background:C.obs2,color:C.ouro,padding:"10px 20px",borderRadius:20,fontSize:13,fontFamily:FS,fontStyle:"italic",boxShadow:"0 8px 24px rgba(0,0,0,.5)",whiteSpace:"nowrap",border:`1px solid ${C.ouro}44`,animation:"toastIn .3s ease"}}>{msg}</div>;
}
function Av({ ini, cor, sz=40 }) {
  return <div style={{width:sz,height:sz,borderRadius:"50%",flexShrink:0,background:cor,display:"flex",alignItems:"center",justifyContent:"center",color:C.branco,fontWeight:400,fontSize:sz*.32,fontFamily:FB}}>{ini}</div>;
}
function BtnPill({ children, onClick, style={} }) {
  return <button onClick={onClick} style={{width:"100%",background:C.ouroLt,border:"none",borderRadius:50,padding:"16px",fontFamily:FB,fontWeight:400,fontSize:15,color:C.obs2,cursor:"pointer",letterSpacing:"0.06em",...style}}>{children}</button>;
}
function BtnOut({ children, onClick, style={} }) {
  return <button onClick={onClick} style={{width:"100%",background:"transparent",border:`1px solid ${C.ouro}55`,borderRadius:50,padding:"15px",fontFamily:FB,fontWeight:300,fontSize:14,color:C.ouro,cursor:"pointer",letterSpacing:"0.06em",...style}}>{children}</button>;
}
function Cab({ titulo, voltar, acao }) {
  return (
    <div style={{background:C.obs,padding:"12px 18px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.ouro}15`}}>
      {voltar ? <button onClick={voltar} style={{background:"none",border:"none",color:C.lt,fontFamily:FB,fontWeight:300,fontSize:13,cursor:"pointer",width:60}}>← Voltar</button> : <div style={{width:60}}/>}
      <div style={{fontFamily:FS,fontSize:17,fontWeight:300,letterSpacing:"0.12em",color:C.linho,textAlign:"center"}}>{titulo}</div>
      <div style={{width:60,display:"flex",justifyContent:"flex-end"}}>{acao||null}</div>
    </div>
  );
}


// ─── ROOT ─────────────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().split("T")[0];

export default function App() {
  const [legalOk,  setLegalOk]  = useState(true); // DEMO
  const [perfil,   setPerfil]   = useState("jornada"); // DEMO
  const [diagOk,   setDiagOk]   = useState(true); // DEMO
  const [tela,     setTela]     = useState(S.HOME);

  // Feed
  const [feed,     setFeed]     = useState(FEED0);

  // Checkin / Hábitos — chave diária: reseta automaticamente no dia seguinte
  const [habF,     setHabF]     = useLocalStorage(`auge_habF_${TODAY}`, {});
  const [chips,    setChips]    = useLocalStorage(`auge_chips_${TODAY}`, []);
  const [ckOk,     setCkOk]     = useLocalStorage(`auge_ckOk_${TODAY}`, false);
  const [notas,    setNotas]    = useLocalStorage(`auge_notas_${TODAY}`, "");

  // Roda AUGE
  const [rodaR,    setRodaR]    = useState({});
  const [rodaI,    setRodaI]    = useState(0);

  // Conexões
  const [matches,  setMatches]  = useState([]);
  const [ci,       setCi]       = useState(0);
  const [sw,       setSw]       = useState(null);
  const [selM,     setSelM]     = useState(null);

  // Jornada — persistidos entre sessões
  const [anc,      setAnc]      = useLocalStorage("auge_anc", "Eu sou a mulher que volta.");
  const [kitMin,   setKitMin]   = useLocalStorage("auge_kitMin", "");
  const [kitApoio, setKitApoio] = useLocalStorage("auge_kitApoio", "");
  const [escT,     setEscT]     = useState("vitorias");
  const [vit,      setVit]      = useLocalStorage("auge_vit", [{sem:1,texto:"Fiz 3 dias de caminhada!",data:"05/05"},{sem:2,texto:"Dormi às 22h por 5 dias.",data:"12/05"}]);
  const [historico,setHist]     = useLocalStorage("auge_historico", {});
  // Hábitos angulares personalizados — persistidos entre sessões
  const [habAngulares, setHabAngulares] = useLocalStorage("auge_habAngulares", []);
  // Data de cadastro para cálculo S6/S12 da Roda
  const [dataCadastro] = useState(new Date(Date.now() - 2 * 7 * 24 * 60 * 60 * 1000)); // demo: 2 semanas atrás
  const [retomadas,setRet]      = useLocalStorage("auge_retomadas", 0);

  const [toast,    setToast]    = useState(null);

  const sem = 3;
  const mes = sem<=4?1:sem<=8?2:3;
  const hDia = habAngulares.length > 0 ? habAngulares : HAB[mes];
  const feitos = hDia.filter(h=>habF[h.id]).length;

  const ir   = t => setTela(t);
  const tk   = m => { setToast(m); setTimeout(()=>setToast(null),3000); };
  const back = () => ir(ABA_ORIGEM[tela]||S.HOME);

  const login = tipo => {
    setPerfil(tipo);
    if(tipo==="jornada" && !diagOk) ir(S.DIAG);
    else ir(S.HOME);
  };

  const doSwipe = dir => {
    const p=PERFIS_CX[ci]; setSw(dir);
    setTimeout(()=>{setSw(null);if(dir==="right"){setMatches(m=>[...m,{...p,msgs:[]}]);tk(`Conexão com ${p.nome.split(" ")[0]}! 💚`);}setCi(i=>i+1);},380);
  };

  const postTreino = entry => {
    setFeed(f=>[{id:Date.now(),aut:"Você",ini:"RF",cor:C.ouroDk,...entry,tempo:"agora",cur:[],com:[]}, ...f]);
    ir(S.FEED);
  };

  const calcRoda = () => Object.fromEntries(DIMS.map(d=>{
    const ps=RODA_Q.filter(p=>p.dim===d);
    const vs=ps.map(p=>rodaR[p.id]).filter(v=>v!==null&&v!==undefined);
    return[d,vs.length?+(vs.reduce((a,b)=>a+b,0)/vs.length).toFixed(1):null];
  }));
  const zc=n=>n===null?C.lt:n<4?C.atencao:n<7?C.dev:C.augeZ;
  const zl=n=>n===null?"—":n<4?"Atenção":n<7?"Desenvolvimento":"Auge";

  // Pontos e medalhas
  const pontos = Object.values(historico).reduce((t,d)=>t+d.feitos*5+(d.feitos===d.total&&d.total>0?5:0)+(d.retomada?15:0),0);
  const diasC  = Object.values(historico).filter(d=>d.feitos>0||d.retomada).length;
  const vals   = Object.values(historico);
  let seq=0,maxSeq=0; vals.forEach(d=>{if(d.feitos>0||d.retomada){seq++;maxSeq=Math.max(maxSeq,seq);}else seq=0;});
  const medC   = [...(maxSeq>=3?["momentum"]:[]),...(retomadas>=3?["retomada"]:[]),...(diasC>=21?["protagonista"]:[])];

  const ctx = {perfil,ir,back,tk,feed,setFeed,habF,setHabF,chips,setChips,ckOk,setCkOk,notas,setNotas,rodaR,setRodaR,rodaI,setRodaI,matches,setMatches,ci,sw,doSwipe,selM,setSelM,anc,setAnc,kitMin,setKitMin,kitApoio,setKitApoio,escT,setEscT,vit,setVit,historico,setHist,retomadas,setRet,sem,mes,hDia,feitos,postTreino,calcRoda,zc,zl,pontos,medC,
    habAngulares,setHabAngulares,dataCadastro};

  const SEM_NAV = [S.SPLASH,S.LEGAL,S.LOGIN,S.DIAG,S.VOZ,S.CHAT,S.RODA];

  // LGPD — só mostra uma vez (primeira vez que usa o app)
  if(!legalOk && tela !== S.SPLASH) return (
    <Phone>
      <Rolar><AvisoLegal onAceitar={()=>{localStorage.setItem('auge_lgpd','1');setLegalOk(true);setTela(S.LOGIN);}}/></Rolar>
      <Estilos/>
    </Phone>
  );

  // Diagnóstico de Sabotadores (primeiro acesso Jornada)
  if(tela===S.DIAG) return (
    <Phone>
      <Rolar><Diagnostico onConcluir={()=>{setDiagOk(true);ir(S.HOME);}}/></Rolar>
      <Estilos/>
    </Phone>
  );

  const renderTela = () => {
    switch(tela) {
      case S.LOGIN:   return <Login onLogin={login}/>;
      case S.HOME:    return <Home {...ctx}/>;
      case S.FEED:    return <Feed {...ctx}/>;
      case S.NOVO:    return <Novo {...ctx}/>;
      case S.VOZ:     return <Voz  {...ctx}/>;
      case S.CX:      return <Cx   {...ctx}/>;
      case S.MATCH:   return selM ? <MatchDet {...ctx}/> : <Cx {...ctx}/>;
      case S.CHAT:    return selM ? <Chat     {...ctx}/> : <Cx {...ctx}/>;
      case S.JOR:     return perfil==="jornada" ? <Jornada {...ctx}/> : <VitJornada ir={ir} onLogin={login}/>;
      case S.RODA:    return perfil==="jornada" ? <Roda    {...ctx}/> : <VitJornada ir={ir} onLogin={login}/>;
      case S.RET:     return perfil==="jornada" ? <Retomada {...ctx}/> : <VitJornada ir={ir} onLogin={login}/>;
      case S.CAL:     return perfil==="jornada" ? <Calendario {...ctx}/> : <VitJornada ir={ir} onLogin={login}/>;
      case S.ESC:     return perfil==="jornada" ? <Escritas {...ctx}/> : <VitJornada ir={ir} onLogin={login}/>;
      case S.EM:      return perfil==="jornada" ? <Emergencia {...ctx}/> : <VitJornada ir={ir} onLogin={login}/>;
      case S.CT:      return <Conteudo {...ctx}/>;
      case S.PF:      return <Perfil   {...ctx} habAngulares={habAngulares} setHabAngulares={setHabAngulares}/>;
      default:        return <Home {...ctx}/>;
    }
  };

  return (
    <Phone>
      {toast && <Brinde msg={toast}/>}
      <Rolar>{renderTela()}</Rolar>
      {!SEM_NAV.includes(tela) && <NavBar tela={tela} ir={ir} mc={matches.length} perfil={perfil}/>}
      <Estilos/>
    </Phone>
  );
}

function Estilos() {
  return <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Inter:wght@300;400;500&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{display:none;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-6px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
    @keyframes swR{to{transform:translateX(130%) rotate(15deg);opacity:0}}
    @keyframes swL{to{transform:translateX(-130%) rotate(-15deg);opacity:0}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
    @keyframes wave{0%,100%{height:5px}50%{height:26px}}
    input:focus,textarea:focus{outline:none;}
    input{caret-color:#C4A882;}
    textarea{caret-color:#C4A882;}
    button:active{opacity:.75;}
  `}</style>;
}

// ─── NAV BAR ──────────────────────────────────────────────────────────────────
function NavBar({ tela, ir, mc, perfil }) {
  const aba = ABA_ORIGEM[tela]||S.HOME;
  const tabs=[
    {id:S.HOME, label:"Início",    icon:Ico.home},
    {id:S.FEED, label:"Feed",      icon:Ico.feed},
    {id:S.CX,   label:"Conexões",  icon:Ico.cx, badge:mc},
    {id:S.JOR,  label:"Jornada",   icon:Ico.jor},
    {id:S.CT,   label:"Conteúdo",  icon:Ico.ct},
    {id:S.PF,   label:"Perfil",    icon:Ico.pf},
  ];
  // Nota: Jornada aparece para todos — Comunidade vê vitrine, Jornada vê conteúdo
  return (
    <div style={{background:C.obs,borderTop:`1px solid ${C.ouro}15`,display:"flex",padding:"10px 0 16px"}}>
      {tabs.map(t=>(
        <div key={t.id} onClick={()=>ir(t.id)} style={{flex:1,textAlign:"center",cursor:"pointer",position:"relative"}}>
          {t.badge>0 && <div style={{position:"absolute",top:0,right:"18%",width:15,height:15,borderRadius:"50%",background:C.terra,color:C.branco,fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{t.badge}</div>}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            {t.icon(aba===t.id?C.ouro:C.lt)}
            <div style={{fontFamily:FB,fontWeight:300,fontSize:10,color:aba===t.id?C.ouro:C.lt,transition:"color .2s"}}>{t.label}</div>
          </div>
          {aba===t.id && <div style={{width:18,height:1.5,background:C.ouro,margin:"3px auto 0",borderRadius:100}}/>}
        </div>
      ))}
    </div>
  );
}

// ─── SPLASH ───────────────────────────────────────────────────────────────────
function Splash({ ir }) {
  const stars = Array.from({length:40},(_,i)=>({
    w:i%5===0?2.5:i%3===0?1.5:1,
    op:0.08+((i*37)%100)/400,
    l:((i*67+13)%90)+5,
    t:((i*43+7)%90)+5,
  }));
  return (
    <Grain style={{minHeight:760,display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"0 32px 52px"}}>
      {stars.map((s,i)=>(
        <div key={i} style={{position:"absolute",width:s.w,height:s.w,borderRadius:"50%",background:C.ouro,opacity:s.op,left:`${s.l}%`,top:`${s.t}%`,boxShadow:i%5===0?`0 0 3px ${C.ouro}66`:undefined}}/>
      ))}
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,paddingTop:60}}>
        <Logo width={240} fundo="escuro"/>
        <div style={{width:1,height:36,background:C.ouro,opacity:.25,marginTop:8}}/>
        <div style={{fontFamily:FS,fontStyle:"italic",fontSize:16,fontWeight:300,color:`${C.linho}66`,lineHeight:1.6,textAlign:"center",maxWidth:240,marginTop:4}}>
          "O auge não é o que você foi. É o que você está construindo."
        </div>
      </div>
      <BtnPill onClick={ir}>Entrar no app</BtnPill>
    </Grain>
  );
}

// ─── AVISO LEGAL ──────────────────────────────────────────────────────────────
function AvisoLegal({ onAceitar }) {
  const [rolado, setRolado] = useState(false);
  const [aceito, setAceito] = useState(false);
  return (
    <Grain style={{minHeight:760,display:"flex",flexDirection:"column",padding:"40px 26px 48px",animation:"fadeUp .4s ease"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10,marginBottom:24}}>
        <Logo width={140} fundo="escuro"/>
      </div>
      <div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:C.ouro,letterSpacing:"0.4em",textTransform:"uppercase",textAlign:"center",marginBottom:16}}>Aviso Legal e Termos</div>
      <div onScroll={e=>{const el=e.target;if(el.scrollTop+el.clientHeight>=el.scrollHeight-10)setRolado(true);}}
        style={{flex:1,overflowY:"auto",background:"rgba(255,255,255,.04)",border:`1px solid ${C.ouro}18`,borderRadius:12,padding:"18px",marginBottom:18}}>
        <div style={{fontFamily:FB,fontWeight:300,fontSize:13,color:`rgba(255,255,255,.5)`,lineHeight:1.8}}>
          <p style={{marginBottom:12}}>Este aplicativo é um <b style={{color:`rgba(255,255,255,.7)`}}>programa de desenvolvimento de hábitos e estilo de vida</b>. Não substitui consulta médica, acompanhamento clínico individual, avaliação de exames ou prescrição de medicamentos de qualquer natureza.</p>
          <p style={{marginBottom:12}}>A formação médica da facilitadora, Dra. Isadora Zaniboni, informa a profundidade do conteúdo — não caracteriza ato médico. A tríade diagnóstica (anamnese, exame físico e conduta clínica) não está presente neste programa.</p>
          <p style={{marginBottom:12}}>Se você possui condições de saúde que requerem acompanhamento médico, a participação é complementar ao seu tratamento — nunca substituta.</p>
          <p style={{marginBottom:12}}>Seus dados de hábitos, monitoramento emocional e respostas da Roda AUGE são tratados como dados pessoais sensíveis, armazenados com segurança e nunca compartilhados com terceiros, conforme a LGPD (Lei 13.709/2018).</p>
          <p>Você pode solicitar a exclusão definitiva de todos os seus dados a qualquer momento através do suporte.</p>
        </div>
      </div>
      <div onClick={()=>setAceito(a=>!a)} style={{display:"flex",alignItems:"center",gap:12,marginBottom:18,cursor:"pointer"}}>
        <div style={{width:22,height:22,borderRadius:6,border:`1.5px solid ${aceito?C.ouro:C.ouro+"44"}`,background:aceito?`${C.ouro}22`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {aceito&&<span style={{color:C.ouro,fontSize:14}}>✓</span>}
        </div>
        <div style={{fontFamily:FB,fontWeight:300,fontSize:13,color:`rgba(255,255,255,.45)`,lineHeight:1.5}}>Li e aceito os termos acima</div>
      </div>
      <BtnPill onClick={()=>aceito&&onAceitar()} style={{opacity:aceito?1:.4}}>Continuar</BtnPill>
      {!rolado && <div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:`rgba(255,255,255,.2)`,textAlign:"center",marginTop:10}}>Role para baixo para ler os termos</div>}
    </Grain>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [email, setEmail]   = useState("");
  const [senha, setSenha]   = useState("");
  return (
    <Grain style={{minHeight:760,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 32px 48px",animation:"fadeUp .4s ease"}}>
      <Logo width={180} fundo="escuro"/>
      <div style={{fontFamily:FS,fontSize:22,fontWeight:300,color:C.linho,marginTop:20,marginBottom:8}}>Bem-vinda</div>
      <div style={{fontFamily:FB,fontWeight:300,fontSize:13,color:`rgba(255,255,255,.35)`,marginBottom:44,textAlign:"center"}}>Entre com seu e-mail e senha</div>
      {/* Input underline estilo AstroJourney */}
      <div style={{width:"100%",marginBottom:28}}>
        <div style={{fontFamily:FB,fontWeight:300,fontSize:13,color:`rgba(255,255,255,.45)`,marginBottom:8}}>E-mail</div>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
          style={{width:"100%",background:"transparent",border:"none",borderBottom:`1px solid rgba(255,255,255,.25)`,color:C.branco,fontFamily:FB,fontWeight:300,fontSize:16,padding:"8px 0"}}/>
      </div>
      <div style={{width:"100%",marginBottom:36}}>
        <div style={{fontFamily:FB,fontWeight:300,fontSize:13,color:`rgba(255,255,255,.45)`,marginBottom:8}}>Senha</div>
        <input type="password" value={senha} onChange={e=>setSenha(e.target.value)}
          style={{width:"100%",background:"transparent",border:"none",borderBottom:`1px solid rgba(255,255,255,.25)`,color:C.branco,fontFamily:FB,fontWeight:300,fontSize:16,padding:"8px 0"}}/>
      </div>
      <div style={{fontFamily:FB,fontWeight:300,fontSize:13,color:`rgba(255,255,255,.3)`,marginBottom:28,cursor:"pointer"}}>Esqueceu sua senha?</div>
      {/* Simulação: botões de demo */}
      <BtnPill onClick={()=>onLogin("comunidade")} style={{marginBottom:12}}>Entrar</BtnPill>
      <div style={{fontFamily:FB,fontWeight:300,fontSize:13,color:`rgba(255,255,255,.25)`,marginTop:16,cursor:"pointer",textAlign:"center"}}>Criar novo cadastro</div>
      {/* Demo apenas — em produção o banco identifica o plano */}
      <div style={{marginTop:24,padding:"12px 16px",background:`rgba(255,255,255,.03)`,border:`1px solid ${C.ouro}12`,borderRadius:10}}>
        <div style={{fontFamily:FB,fontWeight:300,fontSize:10,color:`rgba(255,255,255,.2)`,textAlign:"center",marginBottom:10,letterSpacing:"0.1em",textTransform:"uppercase"}}>Demo — simular plano</div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>onLogin("comunidade")} style={{flex:1,background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}18`,borderRadius:8,padding:"9px",fontFamily:FB,fontSize:11,color:`rgba(255,255,255,.35)`,cursor:"pointer"}}>Comunidade</button>
          <button onClick={()=>onLogin("jornada")} style={{flex:1,background:`${C.ouro}12`,border:`1px solid ${C.ouro}33`,borderRadius:8,padding:"9px",fontFamily:FB,fontSize:11,color:C.ouro,cursor:"pointer"}}>Jornada AUGE</button>
        </div>
      </div>
    </Grain>
  );
}

// ─── DIAGNÓSTICO DE SABOTADORES ───────────────────────────────────────────────
function Diagnostico({ onConcluir }) {
  const [idx, setIdx]   = useState(0);
  const [resp, setResp] = useState({});
  const q = DIAG_Q[idx];
  const escolher = opt => {
    const n={...resp,[q.id]:opt};
    setResp(n);
    if(idx<DIAG_Q.length-1) setIdx(i=>i+1); else onConcluir(n);
  };
  return (
    <Grain style={{minHeight:760,animation:"fadeUp .4s ease"}}>
      <div style={{padding:"1.5rem 1.25rem"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,marginBottom:"1.5rem"}}>
          <Logo width={120} fundo="escuro"/>
          <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,letterSpacing:"0.4em",textTransform:"uppercase"}}>Diagnóstico de Perfil</div>
        </div>
        <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,letterSpacing:"0.35em",textTransform:"uppercase",marginBottom:"0.75rem"}}>Pergunta {idx+1} de {DIAG_Q.length}</div>
        <div style={{height:2,background:`rgba(255,255,255,.08)`,borderRadius:100,marginBottom:"1.5rem",position:"relative"}}>
          <div style={{position:"absolute",top:0,left:0,height:"100%",background:C.ouro,borderRadius:100,width:`${((idx+1)/DIAG_Q.length)*100}%`,transition:"width .3s"}}/>
        </div>
        <div style={{fontFamily:FS,fontSize:19,fontWeight:300,color:`rgba(255,255,255,.85)`,lineHeight:1.55,marginBottom:"2rem"}}>{q.q}</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {q.opts.map((op,i)=>(
            <button key={i} onClick={()=>escolher(op)} style={{background:`rgba(255,255,255,.05)`,border:`1px solid ${C.ouro}18`,borderRadius:10,padding:"14px 16px",cursor:"pointer",textAlign:"left",fontFamily:FB,fontSize:14,color:`rgba(255,255,255,.55)`,lineHeight:1.4}}>
              {op}
            </button>
          ))}
        </div>
        <div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:`rgba(255,255,255,.2)`,textAlign:"center",marginTop:"1.5rem",lineHeight:1.6}}>Suas respostas são vistas apenas pela Dra. Isadora</div>
      </div>
    </Grain>
  );
}


// ═══════════════════════════════════════════════════════════════════
// ABA: INÍCIO — Checkin + Calendário (HOME ÚNICA)
// ═══════════════════════════════════════════════════════════════════

function DefinirHabitos({ onSalvar }) {
  const [h1,setH1]=useState(""); const [h2,setH2]=useState(""); const [h3,setH3]=useState("");
  const ok = h1.trim()&&h2.trim()&&h3.trim();
  const salvar=()=>{if(!ok)return;onSalvar([{id:"ha1",t:h1.trim()},{id:"ha2",t:h2.trim()},{id:"ha3",t:h3.trim()}]);};
  return(
    <div style={{animation:"fadeUp .4s ease"}}>
      <div style={{fontFamily:FS,fontSize:20,fontWeight:300,color:"rgba(255,255,255,.85)",marginBottom:6}}>Seus hábitos angulares</div>
      <div style={{fontFamily:FB,fontWeight:300,fontSize:13,color:"rgba(255,255,255,.35)",lineHeight:1.65,marginBottom:22}}>
        Defina os 3 hábitos que quer trabalhar. Pode editar depois no Perfil.
      </div>
      {[["1º hábito","Ex: Caminhar 30 minutos",h1,setH1],
        ["2º hábito","Ex: Não pular nenhuma refeição",h2,setH2],
        ["3º hábito","Ex: 10 minutos só para mim",h3,setH3]].map(([lb,ex,v,s],i)=>(
        <div key={i} style={{marginBottom:20}}>
          <div style={{fontFamily:FB,fontWeight:300,fontSize:10,color:C.ouro,letterSpacing:"0.25em",textTransform:"uppercase",marginBottom:8}}>{lb}</div>
          <input value={v} onChange={e=>s(e.target.value)} placeholder={ex}
            style={{width:"100%",background:"transparent",border:"none",
              borderBottom:`1px solid ${v.trim()?C.ouro+"66":"rgba(255,255,255,.2)"}`,
              color:C.branco,fontFamily:FS,fontSize:17,fontWeight:300,padding:"8px 0"}}/>
        </div>
      ))}
      <div style={{background:`${C.ouro}10`,border:`1px solid ${C.ouro}18`,borderRadius:10,padding:"12px 14px",marginBottom:20}}>
        <div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:"rgba(255,255,255,.4)",lineHeight:1.65}}>
          Escreva hábitos pequenos e concretos — algo que consegue fazer mesmo nos dias difíceis.
        </div>
      </div>
      <BtnPill onClick={salvar} style={{opacity:ok?1:.4}}>Salvar meus hábitos</BtnPill>
    </div>
  );
}

function Home({ perfil, sem, mes, hDia, feitos, habF, setHabF, chips, setChips,
                ckOk, setCkOk, notas, setNotas, anc, historico, setHist,
                retomadas, setRet, pontos, medC, ir, tk,
                habAngulares, setHabAngulares }) {
  const [passo, setPasso] = useState(0); // 0=aguardando 1=chips 2=habitos 3=nota 4=feito
  const CHIPS = [
    {id:"cansada",   e:"😮‍💨",l:"Cansada"},
    {id:"ansiosa",   e:"🌀", l:"Ansiosa"},
    {id:"energizada",e:"🔋",l:"Energizada"},
    {id:"forte",     e:"⚡", l:"Forte"},
    {id:"progredindo",e:"📈",l:"Progredindo"},
  ];
  const total = hDia.length;
  const pct   = total ? Math.round(feitos/total*100) : 0;
  const toggle= id => setChips(c=>c.includes(id)?c.filter(x=>x!==id):[...c.slice(-1),id]);

  const salvar = () => {
    const hoje = new Date().toISOString().split("T")[0];
    setHist(h=>({...h,[hoje]:{feitos,total,retomada:false}}));
    setCkOk(true);
    tk(pct===100?"Dia completo! +"+( feitos*5+5)+" pontos 🏆":"Checkin salvo. Você apareceu hoje 💖");
    setPasso(4);
  };

  // Calendário mensal
  const dias = Array.from({length:31},(_,i)=>i+1);
  const rdCor = d => {
    const t=CAL_D[d];
    if(t==="f") return {bg:C.ouro,tc:C.obs,bo:"none"};
    if(t==="p") return {bg:`${C.ouroLt}33`,tc:C.ouroDk,bo:`1.5px solid ${C.ouro}`};
    if(t==="k") return {bg:`${C.blush}44`,tc:C.blush,bo:"none"};
    if(t==="*") return {bg:C.ouro,tc:C.obs,bo:"none",ex:"★"};
    if(t==="h") return {bg:C.ouroDk,tc:C.branco,bo:`2px solid ${C.ouro}`};
    return {bg:"transparent",tc:`rgba(255,255,255,.2)`,bo:`1px solid ${C.ouro}12`};
  };

  return (
    <div style={{animation:"fadeUp .35s ease"}}>
      {/* Header com logo */}
      <div style={{background:C.obs,padding:"12px 18px 20px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderBottom:`1px solid ${C.ouro}15`,position:"relative"}}>
        {Array.from({length:18},(_,i)=>({w:i%4===0?2:1,op:0.06+((i*31)%60)/1000,l:((i*59+11)%96)+2,t:((i*41+5)%90)+5})).map((s,i)=>(
          <div key={i} style={{position:"absolute",width:s.w,height:s.w,borderRadius:"50%",background:C.ouro,opacity:s.op,left:`${s.l}%`,top:`${s.t}%`}}/>
        ))}
        <Logo width={160} fundo="escuro"/>
        {perfil==="jornada" && (
          <button onClick={()=>ir(S.EM)} style={{background:`${C.blush}22`,border:`1px solid ${C.blush}44`,borderRadius:20,padding:"5px 10px",color:C.blush,fontFamily:FB,fontSize:10,cursor:"pointer"}}>SOS</button>
        )}
        {perfil!=="jornada" && <div style={{width:40}}/>}
      </div>

      <Grain style={{padding:"18px 18px 24px"}}>
        {/* Saudação */}
        <div style={{fontFamily:FB,fontWeight:300,fontSize:10,color:C.ouro,letterSpacing:"0.35em",textTransform:"uppercase",marginBottom:4}}>BOM DIA ☀️</div>
        <div style={{fontFamily:FS,fontStyle:"italic",fontSize:13,color:`rgba(240,233,218,.45)`,lineHeight:1.5,marginBottom:20,borderLeft:`1px solid ${C.ouro}33`,paddingLeft:10}}>"{anc}"</div>

        {/* Checkin */}
        {passo===0 && (
          <div>
            <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,letterSpacing:"0.35em",textTransform:"uppercase",marginBottom:12}}>
              {ckOk ? "✓ Checkin feito hoje" : "Checkin do dia"}
            </div>
            {!ckOk ? (
              <button onClick={()=>setPasso(1)}
                style={{width:"100%",background:`${C.ouro}15`,border:`1px solid ${C.ouro}33`,borderRadius:12,padding:"18px",cursor:"pointer",textAlign:"left",marginBottom:18}}>
                <div style={{fontFamily:FS,fontSize:18,fontWeight:300,color:C.ouro,marginBottom:4}}>Como você chegou hoje?</div>
                <div style={{fontFamily:FB,fontWeight:300,fontSize:12,color:`rgba(255,255,255,.35)`}}>Toque para registrar seus hábitos</div>
                <div style={{marginTop:14,background:C.ouroLt,borderRadius:50,padding:"11px",textAlign:"center",fontFamily:FB,fontWeight:400,fontSize:13,color:C.obs2}}>Fazer checkin</div>
              </button>
            ) : (
              <div style={{background:`${C.ouro}12`,border:`1px solid ${C.ouro}22`,borderRadius:12,padding:"14px 16px",marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontFamily:FS,fontSize:16,color:C.ouro}}>{feitos} de {total} hábitos · {pct}%</div>
                <button onClick={()=>setPasso(1)} style={{background:"none",border:"none",color:`rgba(255,255,255,.3)`,fontFamily:FB,fontSize:11,cursor:"pointer"}}>editar</button>
              </div>
            )}
          </div>
        )}

        {/* Passo 1 — definir hábitos (primeiro uso) ou chips */}
        {passo===1 && habAngulares.length===0 && (
          <DefinirHabitos onSalvar={habs=>{ setHabAngulares(habs); setPasso(1); }}/>
        )}

        {passo===1 && habAngulares.length>0 && (
          <div>
            <div style={{fontFamily:FS,fontSize:22,fontWeight:300,color:`rgba(255,255,255,.85)`,marginBottom:6}}>Como você chegou hoje?</div>
            <div style={{fontFamily:FB,fontWeight:300,fontSize:12,color:`rgba(255,255,255,.35)`,marginBottom:20}}>Selecione até 2</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:24}}>
              {CHIPS.map(c=>{const s=chips.includes(c.id);return(
                <button key={c.id} onClick={()=>toggle(c.id)} style={{background:s?`${C.ouro}22`:`rgba(255,255,255,.05)`,border:`1px solid ${s?C.ouro+"55":C.ouro+"15"}`,borderRadius:50,padding:"9px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:15}}>{c.e}</span>
                  <span style={{fontFamily:FB,fontWeight:300,fontSize:12,color:s?C.ouro:`rgba(255,255,255,.4)`}}>{c.l}</span>
                </button>
              );})}
            </div>
            <BtnPill onClick={()=>chips.length>0&&setPasso(2)} style={{opacity:chips.length>0?1:.4}}>Continuar</BtnPill>
          </div>
        )}

        {/* Passo 2 — hábitos */}
        {passo===2 && (
          <div>
            <div style={{fontFamily:FS,fontSize:22,fontWeight:300,color:`rgba(255,255,255,.85)`,marginBottom:18}}>Hábitos de hoje</div>
            {hDia.map(h=>(
              <div key={h.id} onClick={()=>setHabF(hb=>({...hb,[h.id]:!hb[h.id]}))}
                style={{background:habF[h.id]?`${C.ouro}18`:`rgba(255,255,255,.04)`,border:`1px solid ${habF[h.id]?C.ouro+"44":C.ouro+"12"}`,borderRadius:10,padding:"15px 14px",marginBottom:10,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,border:`1.5px solid ${habF[h.id]?C.ouro:`rgba(255,255,255,.2)`}`,background:habF[h.id]?C.ouro:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:C.obs,fontSize:13,fontWeight:500}}>
                  {habF[h.id]&&"✓"}
                </div>
                <div style={{fontFamily:FS,fontSize:17,fontWeight:300,color:habF[h.id]?C.ouro:`rgba(255,255,255,.75)`}}>{h.t}</div>
              </div>
            ))}
            <div style={{background:`${C.ouro}10`,borderRadius:8,padding:"10px 12px",marginTop:6,marginBottom:18}}>
              <div style={{fontFamily:FS,fontStyle:"italic",fontSize:14,color:C.ouro}}>{feitos} de {total} · {pct}%</div>
            </div>
            <BtnPill onClick={()=>setPasso(3)}>Continuar</BtnPill>
          </div>
        )}

        {/* Passo 3 — nota */}
        {passo===3 && (
          <div>
            <div style={{fontFamily:FS,fontSize:22,fontWeight:300,color:`rgba(255,255,255,.85)`,marginBottom:6}}>Quer registrar algo?</div>
            <div style={{fontFamily:FB,fontWeight:300,fontSize:12,color:`rgba(255,255,255,.35)`,marginBottom:18}}>Sempre opcional</div>
            <textarea value={notas} onChange={e=>setNotas(e.target.value)} placeholder="O que você quer lembrar desse dia?" style={{width:"100%",background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}18`,borderRadius:10,padding:"13px",fontSize:14,fontFamily:FS,color:`rgba(255,255,255,.7)`,resize:"none",height:120,lineHeight:1.7}}/>
            <BtnPill onClick={salvar} style={{marginTop:16}}>Salvar checkin</BtnPill>
            <button onClick={salvar} style={{width:"100%",background:"none",border:"none",color:`rgba(255,255,255,.25)`,fontFamily:FB,fontWeight:300,fontSize:12,cursor:"pointer",marginTop:10}}>Pular e salvar</button>
          </div>
        )}

        {/* Passo 4 — fechamento */}
        {passo===4 && (
          <div style={{textAlign:"center",marginBottom:18}}>
            <div style={{fontFamily:FS,fontStyle:"italic",fontSize:56,color:C.ouro,marginBottom:10}}>{pct}%</div>
            <div style={{fontFamily:FS,fontSize:18,fontWeight:300,color:`rgba(255,255,255,.75)`,lineHeight:1.4,marginBottom:8}}>
              {pct===100?"Dia completo.":pct>=50?"Mais da metade. Isso conta.":"Qualquer passo é progresso."}
            </div>
            {perfil==="jornada" && (
              <div style={{background:`${C.ouro}12`,borderRadius:8,padding:"10px 14px",marginTop:12,display:"inline-block"}}>
                <div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:C.ouro}}>+{feitos*5+(pct===100?5:0)} pontos AUGE</div>
              </div>
            )}
            <button onClick={()=>setPasso(0)} style={{background:"none",border:"none",color:`rgba(255,255,255,.3)`,fontFamily:FB,fontWeight:300,fontSize:12,cursor:"pointer",marginTop:14,display:"block",width:"100%"}}>← Voltar ao início</button>
          </div>
        )}

        {/* Calendário mensal */}
        <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,letterSpacing:"0.35em",textTransform:"uppercase",marginBottom:12,marginTop:passo===0?0:16}}>
          Maio 2026 · Calendário
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:10}}>
          {["D","S","T","Q","Q","S","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontFamily:FB,fontWeight:300,fontSize:9,color:`rgba(255,255,255,.25)`,padding:"2px 0"}}>{d}</div>)}
          {Array.from({length:4},(_,i)=><div key={"e"+i}/>)}
          {dias.map(d=>{const {bg,tc,bo,ex}=rdCor(d);return(
            <div key={d} style={{aspectRatio:"1",borderRadius:7,background:bg,border:bo||"none",display:"flex",alignItems:"center",justifyContent:"center",fontSize:ex?8:10,fontFamily:FS,fontWeight:300,color:tc}}>{ex||d}</div>
          );})}
        </div>
        <div style={{fontFamily:FB,fontWeight:300,fontSize:10,color:`rgba(255,255,255,.2)`,lineHeight:1.5,marginBottom:18}}>
          Pequeno, repetido e infinito. Qualquer cor é uma vitória.
        </div>

        {/* Próximo encontro */}
        {perfil==="jornada" && (
          <div style={{background:`${C.ouro}10`,border:`1px solid ${C.ouro}18`,borderRadius:10,padding:"12px 14px"}}>
            <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,letterSpacing:"0.3em",textTransform:"uppercase",marginBottom:4}}>Próxima mentoria</div>
            <div style={{fontFamily:FS,fontSize:16,color:`rgba(255,255,255,.8)`}}>Quinta, 29/05 · 19h30</div>
            <div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:C.ouro,marginTop:2}}>Semana 4 · Zoom · 75 min</div>
          </div>
        )}
      </Grain>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ABA: FEED — posts públicos e privados
// ═══════════════════════════════════════════════════════════════════
function Feed({ feed, setFeed, ir }) {
  const [open,setOpen]=useState(null); const [txt,setTxt]=useState("");
  const curtir=id=>setFeed(f=>f.map(p=>{if(p.id!==id)return p;const j=p.cur.includes("RF");return{...p,cur:j?p.cur.filter(x=>x!=="RF"):[...p.cur,"RF"]};}));
  const comentar=id=>{if(!txt.trim())return;setFeed(f=>f.map(p=>p.id===id?{...p,com:[...p.com,{q:"Você",t:txt}]}:p));setTxt("");};
  // Feed só mostra posts públicos (ou posts da própria usuária)
  const visiveis = feed.filter(p=>p.publica||p.aut==="Você");
  return (
    <div style={{animation:"fadeUp .35s ease"}}>
      <div style={{background:C.obs,padding:"12px 18px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.ouro}15`}}>
        <div style={{width:40}}/>
        <Logo width={100} fundo="escuro"/>
        <div style={{width:40}}/>
      </div>
      <Grain style={{padding:"14px 14px 8px"}}>
        {/* Botão registrar */}
        <div onClick={()=>ir(S.NOVO)} style={{background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}15`,borderRadius:12,padding:"14px 16px",marginBottom:14,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontFamily:FS,fontStyle:"italic",fontSize:15,color:`rgba(255,255,255,.35)`}}>O que você treinou hoje?</div>
          <div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:C.ouro,letterSpacing:"0.1em"}}>+ POSTAR</div>
        </div>

        {visiveis.map(p=>{const cu=p.cur.includes("RF");const ab=open===p.id;return(
          <div key={p.id} style={{background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}15`,borderRadius:12,marginBottom:14,overflow:"hidden"}}>
            <div style={{height:178,background:p.fundo,position:"relative",display:"flex",alignItems:"flex-end"}}>
              {p.imgSrc&&<img src={p.imgSrc} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>}
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.65),transparent 55%)"}}/>
              {!p.publica && <div style={{position:"absolute",top:10,right:10,background:`rgba(0,0,0,.5)`,borderRadius:20,padding:"3px 9px",display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:10}}>🔒</span><span style={{fontFamily:FB,fontSize:9,color:`rgba(255,255,255,.6)`}}>Só você</span></div>}
              <div style={{position:"relative",padding:"0 14px 12px",width:"100%"}}>
                <div style={{color:C.branco,fontFamily:FS,fontSize:19,fontWeight:300}}>{p.tit}</div>
                <div style={{color:`rgba(255,255,255,.6)`,fontSize:11,fontFamily:FB,fontWeight:300,marginTop:2}}>{p.tempo}</div>
              </div>
            </div>
            <div style={{padding:"12px 14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:8}}><Av ini={p.ini} cor={p.cor} sz={32}/><div style={{fontFamily:FB,fontWeight:500,fontSize:13,color:`rgba(255,255,255,.8)`}}>{p.aut}</div></div>
              <div style={{fontSize:14,fontFamily:FB,fontWeight:300,color:`rgba(255,255,255,.5)`,lineHeight:1.65,marginBottom:10}}>{p.desc}</div>
              <div style={{display:"flex",borderTop:`1px solid ${C.ouro}12`,paddingTop:9}}>
                <button onClick={()=>curtir(p.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",fontSize:14,color:cu?"#E84040":`rgba(255,255,255,.35)`,fontFamily:FB,display:"flex",alignItems:"center",justifyContent:"center",gap:5,padding:"5px 0"}}>{cu?"❤️":"🤍"}<span style={{fontSize:12}}>{p.cur.length}</span></button>
                <button onClick={()=>setOpen(ab?null:p.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",fontSize:14,color:`rgba(255,255,255,.35)`,fontFamily:FB,display:"flex",alignItems:"center",justifyContent:"center",gap:5,padding:"5px 0"}}>💬<span style={{fontSize:12}}>{p.com.length}</span></button>
              </div>
              {ab&&(<div style={{marginTop:10,borderTop:`1px solid ${C.ouro}12`,paddingTop:10}}>
                {p.com.map((c,i)=><div key={i} style={{display:"flex",gap:7,marginBottom:8}}><div style={{width:26,height:26,borderRadius:"50%",background:C.ouroDk,display:"flex",alignItems:"center",justifyContent:"center",color:C.branco,fontSize:10,fontFamily:FB,flexShrink:0}}>{c.q.slice(0,2).toUpperCase()}</div><div style={{background:`rgba(255,255,255,.06)`,borderRadius:10,padding:"6px 10px",fontSize:13,fontFamily:FB,color:`rgba(255,255,255,.65)`,flex:1}}>{c.t}</div></div>)}
                <div style={{display:"flex",gap:7,marginTop:4}}><input value={txt} onChange={e=>setTxt(e.target.value)} placeholder="Escreva um comentário..." style={{flex:1,background:`rgba(255,255,255,.06)`,border:"none",borderRadius:20,padding:"8px 12px",fontSize:13,fontFamily:FB,color:C.branco}}/><button onClick={()=>comentar(p.id)} style={{background:`${C.obs2}`,border:`1px solid ${C.ouro}33`,borderRadius:"50%",width:36,height:36,cursor:"pointer",color:C.ouro,fontSize:16}}>→</button></div>
              </div>)}
            </div>
          </div>
        );})}
      </Grain>
    </div>
  );
}

// Novo treino com opção público/privado
function Novo({ back, postTreino }) {
  const [ex,setEx]=useState(""); const [dur,setDur]=useState(""); const [cap,setCap]=useState(""); const [foto,setFoto]=useState(null); const [publica,setPublica]=useState(true);
  const ref=useRef(); const ok=ex&&dur&&cap;
  const EX=["Caminhada","Corrida","Pilates","Yoga","Musculação","Natação","Dança","Funcional","Trilha","Alongamento"];
  return (
    <div style={{animation:"fadeUp .4s ease"}}>
      <Cab titulo="Registrar treino" voltar={back}/>
      <Grain style={{padding:"20px 20px 36px"}}>
        <div onClick={()=>ref.current?.click()} style={{height:148,borderRadius:12,border:`1.5px dashed ${C.ouro}33`,background:`rgba(255,255,255,.03)`,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginBottom:20}}>
          {foto?<img src={foto} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{textAlign:"center"}}><div style={{fontSize:28}}>📷</div><div style={{fontSize:13,fontFamily:FB,fontWeight:300,color:C.lt,marginTop:7}}>Toque para adicionar foto</div></div>}
        </div>
        <input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setFoto(ev.target.result);r.readAsDataURL(f);}}/>
        <div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:C.lt,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:10}}>Exercício</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:18}}>
          {EX.map(e=><button key={e} onClick={()=>setEx(e)} style={{background:ex===e?`${C.ouro}22`:`rgba(255,255,255,.04)`,color:ex===e?C.ouro:`rgba(255,255,255,.45)`,border:`1px solid ${ex===e?C.ouro+"55":C.ouro+"15"}`,borderRadius:8,padding:"12px 8px",fontSize:13,fontFamily:FB,fontWeight:300,cursor:"pointer"}}>{e}</button>)}
        </div>
        <div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:C.lt,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:10}}>Duração</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:18}}>
          {["15 min","30 min","45 min","1 hora","1h30","2h+"].map(d=><button key={d} onClick={()=>setDur(d)} style={{background:dur===d?C.ouroLt:`rgba(255,255,255,.04)`,color:dur===d?C.obs2:`rgba(255,255,255,.45)`,border:`1px solid ${dur===d?C.ouro+"88":C.ouro+"15"}`,borderRadius:50,padding:"9px 14px",fontSize:13,fontFamily:FB,cursor:"pointer"}}>{d}</button>)}
        </div>
        <div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:C.lt,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:10}}>Como foi?</div>
        <textarea value={cap} onChange={e=>setCap(e.target.value)} placeholder="Conta para as amigas..." style={{width:"100%",background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}18`,borderRadius:8,padding:"12px 14px",fontSize:14,fontFamily:FB,color:C.branco,resize:"none",height:85,lineHeight:1.65}}/>
        {/* Visibilidade */}
        <div style={{marginTop:16,marginBottom:18}}>
          <div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:C.lt,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:10}}>Visibilidade</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setPublica(true)} style={{flex:1,background:publica?`${C.ouro}22`:`rgba(255,255,255,.04)`,border:`1px solid ${publica?C.ouro+"55":C.ouro+"15"}`,borderRadius:8,padding:"11px",cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:16,marginBottom:4}}>🌍</div>
              <div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:publica?C.ouro:`rgba(255,255,255,.35)`}}>Público</div>
              <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:`rgba(255,255,255,.2)`,marginTop:2}}>Toda a comunidade vê</div>
            </button>
            <button onClick={()=>setPublica(false)} style={{flex:1,background:!publica?`${C.ouro}22`:`rgba(255,255,255,.04)`,border:`1px solid ${!publica?C.ouro+"55":C.ouro+"15"}`,borderRadius:8,padding:"11px",cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:16,marginBottom:4}}>🔒</div>
              <div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:!publica?C.ouro:`rgba(255,255,255,.35)`}}>Só para mim</div>
              <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:`rgba(255,255,255,.2)`,marginTop:2}}>Só você vê</div>
            </button>
          </div>
        </div>
        <BtnPill onClick={()=>ok&&postTreino({fundo:"#1E252E",tit:ex,desc:`${cap} (${dur})`,publica,imgSrc:foto})} style={{opacity:ok?1:.4}}>
          {publica?"Publicar no feed":"Salvar para mim"}
        </BtnPill>
      </Grain>
    </div>
  );
}

// Voz com IA (só Dra. Isadora)
function Voz({ back, postTreino, tk }) {
  const [fase,setFase]=useState("idle"); const [tr,setTr]=useState(""); const [res,setRes]=useState(null); const [err,setErr]=useState(false);
  const rRef=useRef(null);
  const iniciar=useCallback(()=>{const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){setErr(true);return;}const r=new SR();r.lang="pt-BR";r.continuous=false;r.interimResults=true;r.onstart=()=>setFase("ouvindo");r.onresult=(e)=>setTr(Array.from(e.results).map(r=>r[0].transcript).join(""));r.onend=()=>{if(tr)proc(tr);else setFase("idle");};r.onerror=()=>{setFase("idle");setErr(true);};rRef.current=r;r.start();},[tr]);
  const parar=()=>{rRef.current?.stop();};
  const proc=async texto=>{setFase("proc");const isa=await callISA(`A usuária disse: "${texto}". Parabenize genuinamente e dê até 2 dicas práticas de recuperação pós-treino. Calorosa e breve.`);setRes({texto,isa});setFase("resultado");};
  const demo=async()=>{const t="Corri 5 quilômetros hoje de manhã, levei 35 minutos";setTr(t);await proc(t);};
  const [publica,setPublica]=useState(true);
  return (
    <Grain style={{minHeight:760,animation:"fadeUp .4s ease"}}>
      <Cab titulo="Registrar por voz" voltar={back}/>
      <div style={{padding:"28px 22px"}}>
        {fase==="idle"&&(<div style={{textAlign:"center"}}>
          <div style={{background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}18`,borderRadius:12,padding:"20px 18px",marginBottom:26}}>
            <div style={{fontFamily:FB,fontWeight:300,fontSize:13,color:`rgba(255,255,255,.4)`,marginBottom:12,lineHeight:1.6}}>Toque no microfone e conte seu treino:</div>
            {["Corri 5km em 35 minutos","Fiz yoga por 40 minutos","Caminhei no parque por meia hora"].map((ex,i)=><div key={i} style={{background:`rgba(255,255,255,.04)`,borderRadius:8,padding:"8px 12px",marginBottom:7,fontSize:12,fontFamily:FS,fontStyle:"italic",color:`rgba(255,255,255,.35)`,textAlign:"left"}}>"{ex}"</div>)}
          </div>
          <div onClick={iniciar} style={{width:90,height:90,borderRadius:"50%",background:`radial-gradient(circle,${C.ouro}20,${C.ouro}06)`,border:`1px solid ${C.ouro}33`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",margin:"0 auto 12px",fontSize:38}}>🎤</div>
          <div style={{fontFamily:FB,fontWeight:300,fontSize:13,color:`rgba(255,255,255,.35)`}}>Toque para falar</div>
          {err&&<div style={{marginTop:22}}><div style={{fontSize:12,fontFamily:FB,color:C.lt,marginBottom:10}}>Microfone não disponível</div><button onClick={demo} style={{background:`${C.terra}88`,border:"none",borderRadius:50,padding:"10px 22px",color:C.branco,fontSize:13,fontFamily:FB,cursor:"pointer"}}>▶ Ver demo com IA</button></div>}
        </div>)}
        {fase==="ouvindo"&&(<div style={{textAlign:"center"}}>
          <div style={{background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}33`,borderRadius:12,padding:"22px",marginBottom:22,minHeight:100}}>
            <div style={{fontFamily:FB,fontWeight:300,fontSize:10,color:C.ouro,letterSpacing:"0.3em",textTransform:"uppercase",marginBottom:10}}>Ouvindo...</div>
            <div style={{fontFamily:FS,fontSize:16,color:tr?`rgba(255,255,255,.8)`:`rgba(255,255,255,.3)`,fontStyle:tr?"normal":"italic",lineHeight:1.6}}>{tr||"Fale agora..."}</div>
          </div>
          <div style={{display:"flex",justifyContent:"center",gap:5,marginBottom:24,alignItems:"center",height:32}}>{[0,1,2,3,4,5,6].map(i=><div key={i} style={{width:4,background:C.ouro,borderRadius:100,animation:`wave 1s ease-in-out ${i*0.1}s infinite`}}/>)}</div>
          <button onClick={parar} style={{background:`${C.terra}88`,border:"none",borderRadius:50,padding:"13px 36px",color:C.branco,fontSize:15,fontFamily:FB,cursor:"pointer"}}>⏹  Parar</button>
        </div>)}
        {fase==="proc"&&(<div style={{textAlign:"center",padding:"44px 0"}}><div style={{fontSize:48,marginBottom:16,animation:"pulse 1.5s ease-in-out infinite"}}>🧠</div><div style={{fontFamily:FS,fontSize:18,color:`rgba(255,255,255,.7)`,marginBottom:6}}>A Dra. Isadora está respondendo...</div></div>)}
        {fase==="resultado"&&res&&(<div style={{animation:"fadeUp .4s ease"}}>
          <div style={{background:`rgba(255,255,255,.05)`,border:`1px solid ${C.ouro}25`,borderRadius:12,padding:"13px 15px",marginBottom:14}}>
            <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,letterSpacing:"0.3em",textTransform:"uppercase",marginBottom:5}}>Treino registrado</div>
            <div style={{fontFamily:FS,fontStyle:"italic",fontSize:14,color:`rgba(255,255,255,.6)`}}>"{res.texto}"</div>
          </div>
          <div style={{background:`rgba(255,255,255,.05)`,border:`1px solid ${C.ouro}25`,borderRadius:12,padding:"18px",marginBottom:18}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><Av ini="DI" cor={C.ouroDk} sz={40}/><div><div style={{fontFamily:FB,fontWeight:500,fontSize:13,color:`rgba(255,255,255,.85)`}}>Dra. Isadora</div><div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:C.lt}}>Médica Geriatra · Longevidade</div></div></div>
            <div style={{fontFamily:FB,fontWeight:300,fontSize:14,color:`rgba(255,255,255,.6)`,lineHeight:1.75}}>{res.isa}</div>
          </div>
          {/* Visibilidade */}
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            <button onClick={()=>setPublica(true)} style={{flex:1,background:publica?`${C.ouro}22`:`rgba(255,255,255,.04)`,border:`1px solid ${publica?C.ouro+"44":C.ouro+"12"}`,borderRadius:8,padding:"10px 8px",cursor:"pointer",textAlign:"center"}}>
              <div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:publica?C.ouro:`rgba(255,255,255,.3)`}}>🌍 Público</div>
            </button>
            <button onClick={()=>setPublica(false)} style={{flex:1,background:!publica?`${C.ouro}22`:`rgba(255,255,255,.04)`,border:`1px solid ${!publica?C.ouro+"44":C.ouro+"12"}`,borderRadius:8,padding:"10px 8px",cursor:"pointer",textAlign:"center"}}>
              <div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:!publica?C.ouro:`rgba(255,255,255,.3)`}}>🔒 Só para mim</div>
            </button>
          </div>
          <BtnPill onClick={()=>{postTreino({fundo:"#1E252E",tit:"Treino",desc:res.texto,publica});tk("Treino registrado! 🎉");}}>
            ✅  {publica?"Registrar no feed":"Salvar para mim"}
          </BtnPill>
          <button onClick={()=>{setFase("idle");setTr("");setRes(null);}} style={{width:"100%",background:"none",border:`1px solid ${C.ouro}18`,borderRadius:50,padding:"12px",fontFamily:FB,fontWeight:300,fontSize:12,color:C.lt,cursor:"pointer",marginTop:10}}>🎤  Registrar outro treino</button>
        </div>)}
      </div>
    </Grain>
  );
}

// ─── CONEXÕES (dentro do Feed) ────────────────────────────────────────────────
function Cx({ matches,setMatches,ci,sw,doSwipe,selM,setSelM,ir,back,tk }) {
  const p=PERFIS_CX[ci];
  return(
    <div style={{animation:"fadeUp .35s ease"}}>
      <Cab titulo="Conexões" voltar={back}/>
      <Grain style={{padding:"18px 16px 8px"}}>
        <div style={{fontFamily:FB,fontWeight:300,fontSize:12,color:`rgba(255,255,255,.35)`,marginBottom:18,textAlign:"center"}}>Encontre sua parceira de treino</div>
        {p?(<>
          <div style={{background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}18`,borderRadius:14,overflow:"hidden",marginBottom:14,animation:sw==="right"?"swR .38s ease forwards":sw==="left"?"swL .38s ease forwards":"none"}}>
            <div style={{height:218,background:p.cor,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
              <div style={{fontSize:58,fontFamily:FS,fontWeight:300,color:`rgba(255,255,255,.18)`}}>{p.ini}</div>
              {p.ok&&<div style={{position:"absolute",top:12,right:12,background:`rgba(15,110,86,.8)`,borderRadius:20,padding:"4px 10px"}}><span style={{color:C.branco,fontSize:11,fontWeight:500}}>✓ Verificada</span></div>}
              <div style={{position:"absolute",top:12,left:12,background:`rgba(0,0,0,.5)`,borderRadius:20,padding:"4px 10px"}}><span style={{color:C.branco,fontSize:11,fontWeight:500}}>💚 {p.compat}%</span></div>
              <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(to top,rgba(0,0,0,.7),transparent)",padding:"18px 16px 14px"}}>
                <div style={{color:C.branco,fontFamily:FS,fontSize:21,fontWeight:300}}>{p.nome}</div>
                <div style={{color:`rgba(255,255,255,.6)`,fontSize:12,fontFamily:FB,fontWeight:300}}>{p.idade} anos · {p.cidade}</div>
              </div>
            </div>
            <div style={{padding:"14px 16px 16px"}}>
              <div style={{fontFamily:FB,fontWeight:300,fontSize:13,color:`rgba(255,255,255,.5)`,lineHeight:1.7,marginBottom:10}}>{p.bio}</div>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{p.hab.map(h=><span key={h} style={{background:`${C.ouro}15`,borderRadius:20,padding:"4px 11px",fontSize:11,fontFamily:FB,fontWeight:300,color:C.ouro,border:`1px solid ${C.ouro}30`}}>{h}</span>)}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>doSwipe("left")} style={{flex:1,padding:"15px",borderRadius:50,background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}18`,color:`rgba(255,255,255,.4)`,fontSize:14,fontFamily:FB,fontWeight:300,cursor:"pointer"}}>Passar →</button>
            <button onClick={()=>doSwipe("right")} style={{flex:1,padding:"15px",borderRadius:50,background:`linear-gradient(135deg,${C.ouro}28,${C.ouro}12)`,border:`1px solid ${C.ouro}55`,color:C.ouro,fontSize:14,fontFamily:FB,fontWeight:300,cursor:"pointer"}}>💪 Vamos treinar juntas?</button>
          </div>
        </>):(<div style={{background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}15`,borderRadius:12,padding:"44px 22px",textAlign:"center"}}><div style={{fontFamily:FS,fontSize:20,color:`rgba(255,255,255,.5)`,marginBottom:8}}>Por hoje é só!</div><div style={{fontFamily:FB,fontWeight:300,fontSize:13,color:`rgba(255,255,255,.3)`,lineHeight:1.6}}>Novas mulheres aparecem toda semana</div></div>)}
        {matches.length>0&&(<div style={{marginTop:22}}>
          <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,letterSpacing:"0.3em",textTransform:"uppercase",marginBottom:12}}>Suas conexões ({matches.length})</div>
          {matches.map(m=><div key={m.id} onClick={()=>{setSelM(m);ir(S.MATCH);}} style={{background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}15`,borderRadius:12,padding:"13px 15px",display:"flex",alignItems:"center",gap:12,marginBottom:8,cursor:"pointer"}}><Av ini={m.ini} cor={m.cor} sz={42}/><div style={{flex:1}}><div style={{fontFamily:FB,fontWeight:500,fontSize:14,color:`rgba(255,255,255,.8)`}}>{m.nome}</div><div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:`rgba(255,255,255,.3)`,marginTop:2}}>Toque para enviar mensagem</div></div><span style={{color:`rgba(255,255,255,.2)`,fontSize:17}}>›</span></div>)}
        </div>)}
      </Grain>
    </div>
  );
}

function MatchDet({ selM, setSelM, ir, back }) {
  const m=selM; const [matched,setMatched]=useState(false);
  return(<div style={{animation:"fadeUp .4s ease"}}><div style={{background:m.cor,padding:"52px 20px 26px",textAlign:"center",position:"relative"}}><button onClick={back} style={{position:"absolute",top:14,left:14,background:`rgba(255,255,255,.15)`,border:"none",borderRadius:20,padding:"7px 13px",color:C.branco,fontSize:12,cursor:"pointer",fontFamily:FB}}>← Voltar</button><div style={{width:76,height:76,borderRadius:"50%",background:`rgba(255,255,255,.2)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FS,fontSize:28,color:C.branco,margin:"0 auto 10px"}}>{m.ini}</div><div style={{fontFamily:FS,fontSize:22,fontWeight:300,color:C.branco}}>{m.nome}</div><div style={{color:`rgba(255,255,255,.7)`,fontSize:13,fontFamily:FB,fontWeight:300,marginTop:3}}>{m.idade} anos · {m.cidade}</div>{m.ok&&<div style={{display:"inline-block",background:`rgba(255,255,255,.15)`,borderRadius:20,padding:"4px 13px",marginTop:10,color:C.branco,fontSize:11,fontFamily:FB}}>✓ Verificada</div>}</div><Grain style={{padding:"20px 20px 36px"}}><div style={{fontFamily:FB,fontWeight:300,fontSize:13,color:`rgba(255,255,255,.5)`,lineHeight:1.7,marginBottom:14}}>{m.bio}</div><div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:22}}>{m.hab.map(h=><span key={h} style={{background:`${C.ouro}15`,borderRadius:20,padding:"5px 12px",fontSize:12,fontFamily:FB,color:C.ouro,border:`1px solid ${C.ouro}30`}}>{h}</span>)}</div>{!matched?(<><BtnPill onClick={()=>setMatched(true)} style={{marginBottom:10}}>💪 Confirmar conexão</BtnPill><button onClick={()=>ir(S.CHAT)} style={{width:"100%",background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}18`,borderRadius:50,padding:"14px",fontFamily:FB,fontWeight:300,fontSize:13,color:`rgba(255,255,255,.4)`,cursor:"pointer"}}>💬 Enviar mensagem</button></>):(<div style={{background:`${C.augeZ}18`,border:`1px solid ${C.augeZ}44`,borderRadius:12,padding:"20px",textAlign:"center",marginBottom:14}}><div style={{fontSize:28,marginBottom:8}}>🎉</div><div style={{fontFamily:FS,fontSize:18,color:`rgba(255,255,255,.85)`,marginBottom:6}}>Conexão feita!</div><a href={`https://wa.me/5548999999999`} target="_blank" rel="noopener noreferrer" style={{display:"block",background:C.ouroLt,borderRadius:50,padding:"13px",fontFamily:FB,fontSize:14,color:C.obs2,textDecoration:"none",textAlign:"center",marginTop:12}}>📱 Conversar no WhatsApp</a></div>)}</Grain></div>);
}

function Chat({ selM, setMatches, back }) {
  const m=selM;const[msgs,setMsgs]=useState(m.msgs||[]);const[txt,setTxt]=useState("");const bot=useRef();
  const SUGE=["Oi! Vi que você também curte pilates 🌸","Que horário você costuma treinar?","Vamos combinar um treino juntas?","Topa um café esta semana?"];
  const enviar=()=>{if(!txt.trim())return;const n={de:"RF",texto:txt.trim(),hora:"agora"};setMsgs(ms=>[...ms,n]);setMatches(ms=>ms.map(mm=>mm.id===m.id?{...mm,msgs:[...(mm.msgs||[]),n]}:mm));setTxt("");setTimeout(()=>{const rs=["Que ótimo! Eu também adoro treinar cedo ☀️","Vamos combinar! Qual horário você prefere?","Perfeito! Manda seu contato e a gente acerta 💪"];setMsgs(ms=>[...ms,{de:m.ini,texto:rs[Math.floor(Math.random()*rs.length)],hora:"agora"}]);},1200);};
  return(<div style={{display:"flex",flexDirection:"column",height:"100%",animation:"fadeUp .35s ease"}}><div style={{background:C.obs,padding:"12px 15px 14px",display:"flex",alignItems:"center",gap:11,borderBottom:`1px solid ${C.ouro}15`}}><button onClick={back} style={{background:"none",border:"none",color:`rgba(255,255,255,.35)`,fontFamily:FB,fontWeight:300,fontSize:13,cursor:"pointer"}}>←</button><Av ini={m.ini} cor={m.cor} sz={36}/><div><div style={{fontFamily:FB,fontWeight:500,fontSize:13,color:`rgba(255,255,255,.85)`}}>{m.nome.split(" ")[0]}</div><div style={{fontFamily:FB,fontWeight:300,fontSize:10,color:`rgba(255,255,255,.3)`}}>{m.compat}% compatível · {m.cidade}</div></div></div><div style={{flex:1,overflowY:"auto",background:C.obs,padding:"14px 13px 8px",display:"flex",flexDirection:"column",gap:8}}>{msgs.length===0&&<div style={{textAlign:"center",padding:"22px 0"}}><div style={{fontFamily:FS,fontStyle:"italic",fontSize:14,color:`rgba(255,255,255,.3)`,lineHeight:1.6}}>Comece a conversa!<br/>Combine um treino 💚</div></div>}{msgs.map((msg,i)=>{const eu=msg.de==="RF";return(<div key={i} style={{display:"flex",justifyContent:eu?"flex-end":"flex-start",alignItems:"flex-end",gap:7}}>{!eu&&<Av ini={m.ini} cor={m.cor} sz={26}/>}<div style={{maxWidth:"73%",background:eu?`${C.ouro}20`:`rgba(255,255,255,.06)`,borderRadius:eu?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"10px 13px",border:`1px solid ${eu?C.ouro+"28":C.ouro+"10"}`}}><div style={{fontFamily:FB,fontWeight:300,fontSize:13,color:eu?C.ouroLt:`rgba(255,255,255,.65)`,lineHeight:1.6}}>{msg.texto}</div><div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:`rgba(255,255,255,.2)`,marginTop:3}}>{msg.hora}</div></div></div>);})}<div ref={bot}/></div>{msgs.length===0&&<div style={{background:C.obs,padding:"0 13px 8px",display:"flex",gap:7,overflowX:"auto"}}>{SUGE.map((s,i)=><button key={i} onClick={()=>setTxt(s)} style={{background:`${C.ouro}10`,border:`1px solid ${C.ouro}18`,borderRadius:20,padding:"6px 11px",fontSize:11,fontFamily:FS,fontStyle:"italic",color:C.ouro,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{s}</button>)}</div>}<div style={{padding:"9px 13px 14px",background:C.obs,borderTop:`1px solid ${C.ouro}15`,display:"flex",gap:8}}><input value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&enviar()} placeholder="Escreva uma mensagem..." style={{flex:1,background:`rgba(255,255,255,.06)`,border:`1px solid ${C.ouro}15`,borderRadius:20,padding:"10px 15px",fontSize:13,fontFamily:FB,fontWeight:300,color:C.branco}}/><button onClick={enviar} style={{background:`${C.ouro}28`,border:`1px solid ${C.ouro}44`,borderRadius:"50%",width:42,height:42,cursor:"pointer",color:C.ouro,fontSize:18}}>→</button></div></div>);
}


// ═══════════════════════════════════════════════════════════════════
// ABA: JORNADA — Vitrine (Comunidade) ou Conteúdo (Aluna)
// ═══════════════════════════════════════════════════════════════════

// Vitrine para quem é só da Comunidade
function VitJornada({ ir, onLogin }) {
  return (
    <Grain style={{minHeight:760,animation:"fadeUp .4s ease"}}>
      <Cab titulo="Jornada AUGE"/>
      <div style={{padding:"24px 20px 36px",textAlign:"center"}}>
        <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,letterSpacing:"0.4em",textTransform:"uppercase",marginBottom:16}}>Mentoria exclusiva</div>
        <div style={{fontFamily:FS,fontSize:28,fontWeight:300,color:`rgba(255,255,255,.85)`,lineHeight:1.3,marginBottom:8}}>Jornada AUGE</div>
        <div style={{fontFamily:FS,fontStyle:"italic",fontSize:16,color:C.ouro,marginBottom:24}}>12 semanas de transformação real</div>

        {/* Benefícios */}
        {[
          {icon:"✅",titulo:"Checkin diário de hábitos",desc:"Acompanhamento dos seus hábitos com feedback personalizado"},
          {icon:"⭕",titulo:"Roda AUGE",desc:"Autodiagnóstico em 5 dimensões da sua vida: energia, consciência, organização, autocuidado e protagonismo"},
          {icon:"🔁",titulo:"Protocolo de Retomada",desc:"Método comprovado para nunca ficar mais de 2 dias sem agir"},
          {icon:"👩‍⚕️",titulo:"Mentoria com a Dra. Isadora",desc:"Encontros semanais ao vivo com acompanhamento individual"},
        ].map((b,i)=>(
          <div key={i} style={{background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}18`,borderRadius:10,padding:"14px 16px",marginBottom:10,textAlign:"left",display:"flex",gap:14,alignItems:"flex-start"}}>
            <div style={{fontSize:22,flexShrink:0}}>{b.icon}</div>
            <div>
              <div style={{fontFamily:FS,fontSize:16,fontWeight:300,color:`rgba(255,255,255,.8)`,marginBottom:3}}>{b.titulo}</div>
              <div style={{fontFamily:FB,fontWeight:300,fontSize:12,color:`rgba(255,255,255,.35)`,lineHeight:1.5}}>{b.desc}</div>
            </div>
          </div>
        ))}

        {/* Depoimento */}
        <div style={{borderLeft:`2px solid ${C.ouro}44`,padding:"14px 16px",margin:"20px 0",textAlign:"left"}}>
          <div style={{fontFamily:FS,fontStyle:"italic",fontSize:15,color:`rgba(255,255,255,.6)`,lineHeight:1.6,marginBottom:6}}>"Em 12 semanas consegui criar uma rotina que achei que nunca seria possível para mim."</div>
          <div style={{fontFamily:FB,fontWeight:300,fontSize:10,color:C.ouro,letterSpacing:"0.2em"}}>— Maria, 54 anos · Florianópolis</div>
        </div>

        <BtnPill onClick={()=>window.open("https://wa.me/5548999999999","_blank")} style={{marginBottom:12}}>
          Quero participar da próxima turma
        </BtnPill>
        <BtnOut onClick={()=>onLogin("jornada")} style={{fontSize:13}}>
          Já sou aluna — entrar
        </BtnOut>
      </div>
    </Grain>
  );
}

// Menu principal da Jornada (alunas)
function Jornada({ sem, hDia, feitos, ckOk, anc, pontos, medC, historico, retomadas, ir }) {
  const hist = historico||{};
  const SEMANA = ["S","T","Q","Q","S","S","D"];
  return (
    <div style={{animation:"fadeUp .35s ease"}}>
      <div style={{background:C.obs,padding:"12px 18px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.ouro}15`}}>
        <div style={{fontFamily:FS,fontSize:18,fontWeight:300,letterSpacing:"0.1em",color:C.linho}}>Jornada AUGE</div>
        <div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:C.ouro,letterSpacing:"0.2em"}}>S{sem} de 12</div>
      </div>
      <Grain style={{padding:"16px 18px 24px"}}>
        {/* Âncora */}
        <div style={{fontFamily:FS,fontStyle:"italic",fontSize:13,color:`${C.ouroLt}55`,lineHeight:1.5,marginBottom:16,borderLeft:`1px solid ${C.ouro}33`,paddingLeft:12}}>"{anc}"</div>

        {/* Emergência */}
        <button onClick={()=>ir(S.EM)} style={{width:"100%",background:`${C.blush}10`,border:`1px solid ${C.blush}33`,borderRadius:10,padding:"11px 16px",marginBottom:16,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontFamily:FS,fontStyle:"italic",fontSize:14,color:C.blush}}>Estou no limite hoje...</div>
          <div style={{fontFamily:FB,fontWeight:300,fontSize:10,color:C.blush,letterSpacing:"0.1em"}}>KIT →</div>
        </button>

        {/* Pontos + retomadas */}
        <div style={{display:"flex",gap:10,marginBottom:16}}>
          <div style={{flex:1,background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}15`,borderRadius:10,padding:"12px 14px"}}>
            <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,letterSpacing:"0.3em",textTransform:"uppercase",marginBottom:4}}>Pontos AUGE</div>
            <div style={{fontFamily:FS,fontSize:26,color:C.ouro}}>{pontos}</div>
          </div>
          <div style={{flex:1,background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}15`,borderRadius:10,padding:"12px 14px"}}>
            <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:`rgba(255,255,255,.3)`,letterSpacing:"0.3em",textTransform:"uppercase",marginBottom:4}}>Retomadas</div>
            <div style={{fontFamily:FS,fontSize:26,color:C.lt}}>{retomadas||0}</div>
          </div>
        </div>

        {/* Calendário semanal */}
        <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:`rgba(255,255,255,.3)`,letterSpacing:"0.3em",textTransform:"uppercase",marginBottom:8}}>Esta semana</div>
        <div style={{display:"flex",gap:5,marginBottom:6}}>
          {SEMANA.map((d,i)=>{
            const dia=hist[`day${i}`]||{feitos:0,total:1,retomada:false};
            const cor=dia.retomada?C.blush:dia.feitos===dia.total&&dia.total>0?C.ouro:dia.feitos>0?C.ouroLt:"transparent";
            return(
              <div key={i} style={{flex:1,aspectRatio:"1",borderRadius:6,background:cor,border:`1px solid ${cor==="transparent"?C.ouro+"12":cor}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:cor===C.ouro?C.obs:cor===C.ouroLt?C.obs2:`rgba(255,255,255,.2)`}}>{d}</div>
              </div>
            );
          })}
        </div>
        <div style={{fontFamily:FB,fontWeight:300,fontSize:10,color:`rgba(255,255,255,.2)`,marginBottom:18,lineHeight:1.5}}>Pequeno, repetido e infinito. Qualquer cor é uma vitória.</div>

        {/* Medalhas */}
        <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,letterSpacing:"0.3em",textTransform:"uppercase",marginBottom:10}}>Medalhas</div>
        <div style={{display:"flex",gap:8,marginBottom:20}}>
          {MEDALHAS.map(med=>{
            const ok=medC.includes(med.id);
            return(
              <div key={med.id} style={{flex:1,background:ok?`${med.cor}12`:`rgba(255,255,255,.02)`,border:`1px solid ${ok?med.cor+"30":C.ouro+"10"}`,borderRadius:10,padding:"10px 6px",textAlign:"center"}}>
                <div style={{fontSize:20,filter:ok?"none":"grayscale(1)",opacity:ok?1:.3}}>{med.icon}</div>
                <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:ok?`rgba(255,255,255,.5)`:`rgba(255,255,255,.15)`,marginTop:4,lineHeight:1.4}}>{med.nome}</div>
              </div>
            );
          })}
        </div>

        {/* Ferramentas — SÓ conteúdo exclusivo da Jornada */}
        <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,letterSpacing:"0.3em",textTransform:"uppercase",marginBottom:12}}>Ferramentas exclusivas</div>
        {[
          {icon:"⭕",tit:"Roda AUGE",sub:"Autodiagnóstico das 5 dimensões · 25 perguntas",sc:S.RODA},
          {icon:"🔁",tit:"Protocolo de Retomada",sub:"Voltar quando cair faz parte do método",sc:S.RET},
          {icon:"📅",tit:"Calendário completo",sub:"Sua evolução nas 12 semanas",sc:S.CAL},
          {icon:"✍️",tit:"Espaços de escrita",sub:"Vitórias, Âncora, Porquês e Carta para o Futuro",sc:S.ESC},
        ].map(item=>(
          <div key={item.sc} onClick={()=>ir(item.sc)} style={{background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}12`,borderRadius:10,padding:"13px 15px",marginBottom:9,cursor:"pointer",display:"flex",alignItems:"center",gap:13}}>
            <div style={{fontSize:20,flexShrink:0}}>{item.icon}</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:FS,fontSize:16,fontWeight:300,color:`rgba(255,255,255,.8)`,marginBottom:2}}>{item.tit}</div>
              <div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:`rgba(255,255,255,.3)`,lineHeight:1.4}}>{item.sub}</div>
            </div>
            <div style={{color:`rgba(255,255,255,.2)`,fontSize:16}}>›</div>
          </div>
        ))}
      </Grain>
    </div>
  );
}

// ─── RODA AUGE ────────────────────────────────────────────────────────────────
function Roda({ rodaR, setRodaR, rodaI, setRodaI, calcRoda, zc, zl, back, tk, perfil, dataCadastro }) {
  const [fase,setFase]=useState("intro");
  const [momento,setMom]=useState(null);
  const canvasRef=useRef(null); const chartRef=useRef(null);
  const perg=RODA_Q[rodaI];
  const opts=perg?.tipo==="f"?OFREQ:OCONC;

  const resp=v=>{setRodaR(r=>({...r,[perg.id]:v}));if(rodaI<24)setRodaI(i=>i+1);else setFase("resultado");};

  useEffect(()=>{
    if(fase!=="resultado"||!canvasRef.current)return;
    if(chartRef.current){chartRef.current.destroy();chartRef.current=null;}
    const notas=calcRoda();const data=DIMS.map(d=>notas[d]===null?0:notas[d]);
    const draw=()=>{const ctx=canvasRef.current?.getContext("2d");if(!ctx||!window.Chart)return;chartRef.current=new window.Chart(ctx,{type:"radar",data:{labels:DIMS,datasets:[{data,backgroundColor:"rgba(196,168,130,0.12)",borderColor:"#C4A882",borderWidth:1.5,pointBackgroundColor:"#C4A882",pointRadius:4}]},options:{responsive:false,scales:{r:{min:0,max:10,ticks:{display:false},grid:{color:"rgba(90,75,67,0.3)"},angleLines:{color:"rgba(90,75,67,0.3)"},pointLabels:{color:"rgba(240,233,218,0.6)",font:{size:10,family:"sans-serif"}}}},plugins:{legend:{display:false}}}});};
    if(window.Chart){draw();}else{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";s.onload=draw;document.head.appendChild(s);}
    return()=>{if(chartRef.current){chartRef.current.destroy();chartRef.current=null;}};
  },[fase]);

  if(fase==="intro") return(
    <Grain style={{minHeight:760,animation:"fadeUp .4s ease"}}>
      <Cab titulo="Roda AUGE" voltar={back}/>
      <div style={{padding:"24px 20px 36px",textAlign:"center"}}>
        <Logo width={130} fundo="escuro"/>
        <div style={{fontFamily:FS,fontSize:36,fontWeight:300,letterSpacing:"0.12em",color:C.ouro,marginTop:10,marginBottom:4}}>RODA</div>
        <div style={{fontFamily:FB,fontWeight:300,fontSize:9,letterSpacing:"0.35em",textTransform:"uppercase",color:`rgba(255,255,255,.3)`,marginBottom:24}}>AUGE · 25 perguntas · 5 dimensões</div>
        <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:`rgba(255,255,255,.3)`,letterSpacing:"0.25em",textTransform:"uppercase",marginBottom:10}}>Selecione o momento</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:28}}>
          {[["S1","Início"],["S6","Meio"],["S12","Fim"]].map(([m,sub])=>(
            <button key={m} onClick={()=>setMom(m)} style={{background:momento===m?`${C.ouro}22`:`rgba(255,255,255,.04)`,border:`1px solid ${momento===m?C.ouro+"55":C.ouro+"15"}`,borderRadius:10,padding:"14px 0",cursor:"pointer",color:momento===m?C.ouro:`rgba(255,255,255,.3)`,fontFamily:FB,fontSize:12,letterSpacing:"0.2em"}}>
              {m}<br/><span style={{fontSize:9,opacity:.6}}>{sub}</span>
            </button>
          ))}
        </div>
        <BtnPill onClick={()=>{if(momento){setRodaR({});setRodaI(0);setFase("perguntas");}}} style={{opacity:momento?1:.4}}>Iniciar diagnóstico</BtnPill>
      </div>
    </Grain>
  );

  if(fase==="perguntas"&&perg){
    const posInDim=RODA_Q.filter((p,i)=>i<rodaI&&p.dim===perg.dim).length+1;
    const skipTxt=perg.tipo==="f"?"Isso não faz parte da minha rotina":"Não consigo avaliar agora";
    return(
      <Grain style={{minHeight:760,animation:"fadeUp .35s ease"}}>
        <div style={{padding:"1.5rem 1.25rem"}}>
          <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,letterSpacing:"0.35em",textTransform:"uppercase",marginBottom:"1rem"}}>
            <span>{perg.dim}</span><span style={{opacity:.4}}> · </span><span>{posInDim} de 5</span><span style={{opacity:.4,margin:"0 .4em"}}>·</span><span style={{color:`rgba(255,255,255,.3)`}}>{rodaI+1} / 25</span>
          </div>
          <div style={{height:2,background:`rgba(255,255,255,.08)`,borderRadius:100,marginBottom:"1.5rem",position:"relative"}}>
            <div style={{position:"absolute",top:0,left:0,height:"100%",background:C.ouro,borderRadius:100,width:`${(rodaI/25)*100}%`,transition:"width .3s"}}/>
          </div>
          <div style={{fontFamily:FS,fontSize:20,fontWeight:300,color:`rgba(255,255,255,.85)`,lineHeight:1.6,marginBottom:"2rem",minHeight:80}}>{perg.q}</div>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {opts.map((op,i)=>(
              <button key={i} onClick={()=>resp(op.v)} style={{background:`rgba(255,255,255,.05)`,border:`1px solid ${C.ouro}15`,borderRadius:10,padding:"14px 16px",cursor:"pointer",textAlign:"left",fontFamily:FB,fontSize:14,color:`rgba(255,255,255,.55)`,lineHeight:1.4}}>
                {op.l}
              </button>
            ))}
          </div>
          <button onClick={()=>resp(null)} style={{background:"transparent",border:"none",color:`rgba(255,255,255,.25)`,fontFamily:FB,fontSize:11,letterSpacing:"0.15em",textTransform:"uppercase",padding:"0.7rem",cursor:"pointer",width:"100%",textAlign:"center",marginTop:"0.75rem"}}>{skipTxt}</button>
        </div>
      </Grain>
    );
  }

  const notas=calcRoda();const vals=Object.values(notas).filter(v=>v!==null);
  const ind=vals.length?+(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1):null;
  const z=ind!==null?(ind<=3.9?{l:"Zona de Atenção",c:C.atencao}:ind<=6.9?{l:"Zona de Desenvolvimento",c:C.dev}:{l:"Zona de Auge",c:C.augeZ}):null;
  return(
    <Grain style={{minHeight:760,animation:"fadeUp .4s ease"}}>
      <Cab titulo="Resultado" voltar={back}/>
      <div style={{padding:"1.5rem 1.25rem"}}>
        <div style={{fontFamily:FB,fontWeight:300,fontSize:9,letterSpacing:"0.4em",textTransform:"uppercase",color:`rgba(255,255,255,.3)`,textAlign:"center",marginBottom:"0.5rem"}}>Resultado · {momento}</div>
        <div style={{fontSize:64,fontWeight:300,color:C.ouro,textAlign:"center",lineHeight:1,fontFamily:FS}}>{ind!==null?ind.toFixed(1):"—"}</div>
        {z&&<div style={{fontFamily:FB,fontWeight:300,fontSize:10,letterSpacing:"0.35em",textTransform:"uppercase",textAlign:"center",marginTop:"0.3rem",color:z.c}}>{z.l}</div>}
        <div style={{display:"flex",justifyContent:"center",margin:"1.5rem 0"}}><canvas ref={canvasRef} width={260} height={260}/></div>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:"1.5rem"}}>
          {DIMS.map(d=>{const n=notas[d];const dc=n===null?{c:`rgba(255,255,255,.2)`}:n<=3.9?{c:C.atencao}:n<=6.9?{c:C.ouroDk}:{c:C.ouro};return(
            <div key={d} style={{background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}12`,borderRadius:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontFamily:FB,fontSize:11,letterSpacing:"0.2em",textTransform:"uppercase",color:`rgba(255,255,255,.4)`}}>{d}</span>
              <span style={{fontFamily:FS,fontSize:18,color:dc.c}}>{n===null?"—":n.toFixed(1)}</span>
            </div>
          );})}
        </div>
        <div style={{borderLeft:`1px solid ${C.ouro}44`,padding:"0.9rem 1rem",marginBottom:"1.5rem"}}>
          <p style={{fontSize:14,fontWeight:300,fontStyle:"italic",color:`rgba(255,255,255,.55)`,lineHeight:1.6,fontFamily:FS}}>"O auge não é o que você foi. É o que você está construindo."</p>
        </div>
        <BtnPill onClick={()=>{tk("Roda salva! Repita na semana 6 e 12 💖");back();}}>Salvar resultado</BtnPill>
        <BtnOut onClick={()=>{setFase("intro");setMom(null);setRodaR({});setRodaI(0);}} style={{marginTop:10}}>Fazer novamente</BtnOut>
      </div>
    </Grain>
  );
}

// ─── RETOMADA ─────────────────────────────────────────────────────────────────
function Retomada({ anc, back, tk, setRet }) {
  const [mot,setMot]=useState(""); const [onde,setOnde]=useState(""); const [p,setP]=useState(1);
  return(
    <div style={{animation:"fadeUp .4s ease"}}>
      <Cab titulo="Protocolo de Retomada" voltar={back}/>
      <Grain style={{padding:"20px 20px 36px"}}>
        <div style={{fontFamily:FS,fontSize:22,fontWeight:300,color:`rgba(255,255,255,.85)`,lineHeight:1.3,marginBottom:5}}>Você pode voltar agora.</div>
        <div style={{fontFamily:FS,fontStyle:"italic",fontSize:16,color:C.ouro,marginBottom:20}}>Não do zero. De onde você parou.</div>
        <div style={{background:`${C.ouro}10`,border:`1px solid ${C.ouro}20`,borderRadius:10,padding:"15px",marginBottom:18,textAlign:"center"}}><div style={{fontFamily:FS,fontStyle:"italic",fontSize:16,color:C.ouro,lineHeight:1.5}}>"{anc}"</div></div>
        <div style={{background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}12`,borderRadius:10,padding:"15px",marginBottom:18}}>
          <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,letterSpacing:"0.35em",textTransform:"uppercase",marginBottom:12}}>A regra dos 2 dias</div>
          {["Nunca dois dias seguidos sem o hábito","Se ontem não aconteceu, hoje acontece com metade","Nunca compensar — retomada é com menos, não com mais","O dia de retomada conta tanto quanto qualquer outro"].map((r,i)=>(
            <div key={i} style={{display:"flex",gap:10,marginBottom:8}}><div style={{color:C.ouro,fontSize:15,flexShrink:0}}>·</div><div style={{fontFamily:FB,fontWeight:300,fontSize:13,color:`rgba(255,255,255,.4)`,lineHeight:1.5}}>{r}</div></div>
          ))}
        </div>
        {p>=1&&<div style={{marginBottom:14}}><div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:`rgba(255,255,255,.35)`,marginBottom:8}}>O que aconteceu?</div><textarea value={mot} onChange={e=>setMot(e.target.value)} placeholder="Sem julgamento." style={{width:"100%",background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}15`,borderRadius:10,padding:"12px",fontSize:14,fontFamily:FS,color:`rgba(255,255,255,.65)`,resize:"none",height:76,lineHeight:1.6}}/></div>}
        {p>=2&&<div style={{marginBottom:14}}><div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:`rgba(255,255,255,.35)`,marginBottom:8}}>Onde quebrou?</div><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{["Falta de tempo","Cansaço","Imprevisto","Esqueci","Outro"].map(op=><button key={op} onClick={()=>setOnde(op)} style={{padding:"9px 14px",borderRadius:50,border:`1px solid ${onde===op?C.ouro+"55":C.ouro+"15"}`,background:onde===op?`${C.ouro}20`:`rgba(255,255,255,.03)`,color:onde===op?C.ouro:`rgba(255,255,255,.3)`,fontFamily:FB,fontWeight:300,fontSize:13,cursor:"pointer"}}>{op}</button>)}</div></div>}
        {p===1&&<BtnPill onClick={()=>mot&&setP(2)} style={{opacity:mot?1:.4}}>Continuar</BtnPill>}
        {p>=2&&<div><div style={{background:`${C.ouroLt}10`,border:`1px solid ${C.ouro}25`,borderRadius:10,padding:"14px",marginBottom:14}}><div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,letterSpacing:"0.3em",textTransform:"uppercase",marginBottom:8}}>Com o que você volta hoje?</div><div style={{fontFamily:FS,fontStyle:"italic",fontSize:14,color:`rgba(255,255,255,.55)`,lineHeight:1.6}}>5 minutos de movimento. Uma refeição no horário. Um copo de água. Isso conta.</div></div><BtnPill onClick={()=>{setRet(r=>r+1);tk("Retomada registrada. +20 pontos AUGE 💖");back();}}>Registrar minha retomada</BtnPill></div>}
      </Grain>
    </div>
  );
}

// ─── CALENDÁRIO ───────────────────────────────────────────────────────────────
function Calendario({ back }) {
  const dias=Array.from({length:31},(_,i)=>i+1);
  const rdCor=d=>{const t=CAL_D[d];if(t==="f")return{bg:C.ouro,tc:C.obs,bo:"none"};if(t==="p")return{bg:`${C.ouroLt}30`,tc:C.ouroDk,bo:`1.5px solid ${C.ouro}`};if(t==="k")return{bg:`${C.blush}40`,tc:C.blush,bo:"none"};if(t==="*")return{bg:C.ouro,tc:C.obs,bo:"none",ex:"★"};if(t==="h")return{bg:C.ouroDk,tc:C.branco,bo:`2px solid ${C.ouro}`};return{bg:"transparent",tc:`rgba(255,255,255,.2)`,bo:`1px solid ${C.ouro}10`};};
  return(
    <div style={{animation:"fadeUp .4s ease"}}>
      <Cab titulo="Calendário" voltar={back}/>
      <Grain style={{padding:"18px 18px 32px"}}>
        <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,letterSpacing:"0.35em",textTransform:"uppercase",marginBottom:12}}>As 12 semanas</div>
        <div style={{display:"flex",gap:4,marginBottom:22}}>
          {Array.from({length:12},(_,i)=>i+1).map(s=>{const h=s<3?42:s===3?21:8;return(<div key={s} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}><div style={{width:"100%",background:`rgba(196,168,130,${s<=2?.7:s===3?.4:.12})`,borderRadius:4,height:h}}/><div style={{fontFamily:FB,fontWeight:300,fontSize:8,color:`rgba(255,255,255,.25)`}}>{s}</div></div>);})}
        </div>
        <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,letterSpacing:"0.35em",textTransform:"uppercase",marginBottom:12}}>Maio 2026</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:16}}>
          {["D","S","T","Q","Q","S","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontFamily:FB,fontWeight:300,fontSize:9,color:`rgba(255,255,255,.25)`,padding:"2px 0"}}>{d}</div>)}
          {Array.from({length:4},(_,i)=><div key={"e"+i}/>)}
          {dias.map(d=>{const {bg,tc,bo,ex}=rdCor(d);return(<div key={d} style={{aspectRatio:"1",borderRadius:7,background:bg,border:bo||"none",display:"flex",alignItems:"center",justifyContent:"center",fontSize:ex?8:10,fontFamily:FS,fontWeight:300,color:tc}}>{ex||d}</div>);})}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {[[C.ouro,"Todos os hábitos"],[`${C.ouroLt}30`,"Parcial"],[`${C.blush}40`,"Kit / Retomada"],["transparent","Sem registro"]].map(([c,l])=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:9}}><div style={{width:12,height:12,borderRadius:4,background:c,border:`1px solid ${C.ouro}25`,flexShrink:0}}/><div style={{fontFamily:FB,fontWeight:300,fontSize:12,color:`rgba(255,255,255,.3)`}}>{l}</div></div>
          ))}
        </div>
      </Grain>
    </div>
  );
}

// ─── ESPAÇOS DE ESCRITA ───────────────────────────────────────────────────────
function Escritas({ vit, setVit, anc, setAnc, escT, setEscT, back, tk }) {
  const [nv,setNv]=useState(""); const [na,setNa]=useState(anc);
  const [p1,sp1]=useState(""); const [p2,sp2]=useState(""); const [p3,sp3]=useState("");
  return(
    <div style={{animation:"fadeUp .4s ease"}}>
      <Cab titulo="Espaços de escrita" voltar={back}/>
      <Grain style={{padding:"0 18px 24px"}}>
        <div style={{display:"flex",borderBottom:`1px solid ${C.ouro}12`,marginBottom:18}}>
          {[["vitorias","Vitórias"],["ancora","Âncora"],["porques","Porquês"],["carta","Carta"]].map(([id,lb])=>(
            <button key={id} onClick={()=>setEscT(id)} style={{flex:1,padding:"12px 0",background:"none",border:"none",borderBottom:`2px solid ${escT===id?C.ouro:"transparent"}`,fontFamily:FB,fontWeight:300,fontSize:10,color:escT===id?C.ouro:`rgba(255,255,255,.3)`,cursor:"pointer",transition:"all .2s"}}>{lb}</button>
          ))}
        </div>
        {escT==="vitorias"&&(<div>
          <div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:`rgba(255,255,255,.35)`,marginBottom:10}}>Qual foi sua vitória essa semana?</div>
          <textarea value={nv} onChange={e=>setNv(e.target.value)} placeholder="Não existe vitória pequena demais." style={{width:"100%",background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}15`,borderRadius:10,padding:"13px",fontSize:15,fontFamily:FS,color:`rgba(255,255,255,.7)`,resize:"none",height:110,lineHeight:1.7,marginBottom:12}}/>
          <BtnPill onClick={()=>{if(!nv.trim())return;const d=new Date();setVit(v=>[...v,{sem:3,texto:nv,data:`${d.getDate()}/${d.getMonth()+1}`}]);setNv("");tk("Vitória registrada! 💖");}} style={{opacity:nv.trim()?1:.4,marginBottom:20}}>Registrar vitória</BtnPill>
          {vit.map((v,i)=><div key={i} style={{borderLeft:`2px solid ${C.ouro}33`,paddingLeft:13,marginBottom:13}}><div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:3}}>Semana {v.sem} · {v.data}</div><div style={{fontFamily:FS,fontStyle:"italic",fontSize:14,color:`rgba(255,255,255,.6)`,lineHeight:1.5}}>{v.texto}</div></div>)}
        </div>)}
        {escT==="ancora"&&(<div>
          <div style={{background:`${C.ouro}10`,border:`1px solid ${C.ouro}18`,borderRadius:10,padding:"22px 18px",textAlign:"center",marginBottom:16}}><div style={{fontFamily:FS,fontStyle:"italic",fontSize:20,color:C.ouro,lineHeight:1.5}}>"{na||anc}"</div></div>
          <textarea value={na} onChange={e=>setNa(e.target.value)} placeholder="A frase que vai te trazer de volta..." style={{width:"100%",background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}15`,borderRadius:10,padding:"13px",fontSize:15,fontFamily:FS,fontStyle:"italic",color:`rgba(255,255,255,.65)`,resize:"none",height:80,lineHeight:1.6,marginBottom:12}}/>
          <BtnPill onClick={()=>{setAnc(na);tk("Âncora salva 💖");}}>Salvar minha âncora</BtnPill>
        </div>)}
        {escT==="porques"&&(<div>
          <div style={{fontFamily:FB,fontWeight:300,fontSize:12,color:`rgba(255,255,255,.25)`,lineHeight:1.7,marginBottom:16}}>Essas respostas são só suas. Ninguém mais acessa.</div>
          {[["Por que isso importa para você de verdade?",p1,sp1],["O que você está perdendo hoje por estar onde está?",p2,sp2],["Como você quer se sentir daqui a 5 anos?",p3,sp3]].map(([q,v,s],i)=>(
            <div key={i} style={{marginBottom:18}}><div style={{fontFamily:FS,fontStyle:"italic",fontSize:15,color:`rgba(255,255,255,.6)`,lineHeight:1.5,marginBottom:8}}>{q}</div><textarea value={v} onChange={e=>s(e.target.value)} placeholder="Escreva com honestidade..." style={{width:"100%",background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}12`,borderRadius:10,padding:"11px 12px",fontSize:14,fontFamily:FS,color:`rgba(255,255,255,.6)`,resize:"none",height:80,lineHeight:1.6}}/></div>
          ))}
          <BtnPill onClick={()=>tk("Porquês salvos 💖")}>Salvar meus porquês</BtnPill>
        </div>)}
        {escT==="carta"&&(<div style={{textAlign:"center",paddingTop:8}}>
          <div style={{fontSize:36,marginBottom:14}}>✉️</div>
          <div style={{fontFamily:FS,fontSize:20,fontWeight:300,color:`rgba(255,255,255,.8)`,marginBottom:8}}>Carta para o Futuro</div>
          <div style={{fontFamily:FB,fontWeight:300,fontSize:13,color:`rgba(255,255,255,.3)`,lineHeight:1.7,marginBottom:28,maxWidth:260,margin:"0 auto 28px"}}>Escreva uma carta para você mesma agora. Ela só será aberta na Semana 12.</div>
          <a href="https://www.futureme.org" target="_blank" rel="noopener noreferrer" style={{display:"block",textDecoration:"none"}}><BtnPill style={{pointerEvents:"none"}}>Abrir FutureMe e escrever</BtnPill></a>
          <div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:`rgba(255,255,255,.18)`,marginTop:14,lineHeight:1.6}}>Você será redirecionada para o FutureMe. Programme o envio para o seu e-mail na Semana 12.</div>
        </div>)}
      </Grain>
    </div>
  );
}

// ─── KIT DE EMERGÊNCIA ────────────────────────────────────────────────────────
function Emergencia({ anc, kitMin, setKitMin, kitApoio, setKitApoio, back, tk }) {
  const [edit,setEdit]=useState(false);const [tm,setTm]=useState(kitMin);const [ta,setTa]=useState(kitApoio);const naoTem=!kitMin;
  return(
    <div style={{animation:"fadeUp .4s ease"}}>
      <div style={{background:`${C.blush}18`,padding:"20px 20px 22px",borderBottom:`1px solid ${C.blush}25`}}>
        <button onClick={back} style={{background:"none",border:"none",color:C.blush,fontFamily:FB,fontWeight:300,fontSize:12,cursor:"pointer",marginBottom:12}}>← Jornada</button>
        <div style={{fontFamily:FS,fontSize:24,fontWeight:300,color:`rgba(255,255,255,.85)`,lineHeight:1.2}}>Kit de Emergência</div>
        <div style={{fontFamily:FS,fontStyle:"italic",fontSize:14,color:C.blush,marginTop:4}}>O mínimo possível para não parar.</div>
      </div>
      <Grain style={{padding:"18px 20px 36px"}}>
        <div style={{background:`${C.ouro}10`,border:`1px solid ${C.ouro}18`,borderRadius:10,padding:"16px",marginBottom:18,textAlign:"center"}}><div style={{fontFamily:FS,fontStyle:"italic",fontSize:17,color:C.ouro,lineHeight:1.5}}>"{anc}"</div></div>
        {naoTem&&!edit?(<div><div style={{background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}12`,borderRadius:10,padding:"16px",marginBottom:14}}><div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,letterSpacing:"0.3em",textTransform:"uppercase",marginBottom:8}}>Seu kit ainda não foi criado</div><div style={{fontFamily:FB,fontWeight:300,fontSize:13,color:`rgba(255,255,255,.4)`,lineHeight:1.7}}>O Kit de Emergência é construído com a Dra. Isadora na sua sessão individual. Cada kit é único — feito para a sua vida real.</div></div><BtnPill onClick={()=>setEdit(true)}>Adicionar meu kit agora</BtnPill></div>)
        :edit?(<div>
          <div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:`rgba(255,255,255,.35)`,marginBottom:6}}>Qual é o seu mínimo viável?</div>
          <div style={{fontFamily:FB,fontWeight:300,fontSize:10,color:`rgba(255,255,255,.2)`,marginBottom:10,lineHeight:1.6}}>Tão pequeno que consegue fazer mesmo no pior dia.</div>
          <textarea value={tm} onChange={e=>setTm(e.target.value)} placeholder="Ex: 10 minutos de caminhada antes do café" style={{width:"100%",background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}15`,borderRadius:10,padding:"11px",fontSize:14,fontFamily:FS,color:`rgba(255,255,255,.65)`,resize:"none",height:76,lineHeight:1.6,marginBottom:14}}/>
          <div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:`rgba(255,255,255,.35)`,marginBottom:6}}>Onde você busca apoio?</div>
          <textarea value={ta} onChange={e=>setTa(e.target.value)} placeholder="Ex: Ligo para minha irmã / Leio minha âncora" style={{width:"100%",background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}15`,borderRadius:10,padding:"11px",fontSize:14,fontFamily:FS,color:`rgba(255,255,255,.65)`,resize:"none",height:76,lineHeight:1.6,marginBottom:14}}/>
          <BtnPill onClick={()=>{setKitMin(tm);setKitApoio(ta);setEdit(false);tk("Kit salvo 💖");}} style={{opacity:tm.trim()?1:.4,marginBottom:10}}>Salvar meu kit</BtnPill>
          <button onClick={()=>setEdit(false)} style={{width:"100%",background:"none",border:"none",color:`rgba(255,255,255,.2)`,fontFamily:FB,fontWeight:300,fontSize:12,cursor:"pointer"}}>Cancelar</button>
        </div>)
        :(<div>
          <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,letterSpacing:"0.3em",textTransform:"uppercase",marginBottom:10}}>Meu mínimo viável</div>
          <div style={{background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}12`,borderRadius:10,padding:"14px",marginBottom:14}}><div style={{fontFamily:FS,fontSize:16,color:`rgba(255,255,255,.7)`,lineHeight:1.6}}>{kitMin}</div></div>
          {kitApoio&&<><div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,letterSpacing:"0.3em",textTransform:"uppercase",marginBottom:10}}>Onde busco apoio</div><div style={{background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}12`,borderRadius:10,padding:"14px",marginBottom:14}}><div style={{fontFamily:FS,fontSize:16,color:`rgba(255,255,255,.7)`,lineHeight:1.6}}>{kitApoio}</div></div></>}
          <div style={{background:`${C.ouroLt}10`,border:`1px solid ${C.ouro}20`,borderRadius:10,padding:"13px",marginBottom:18,textAlign:"center"}}><div style={{fontFamily:FS,fontStyle:"italic",fontSize:15,color:C.ouro,lineHeight:1.6}}>"Isso conta. Isso já é o auge de hoje."</div></div>
          <BtnPill onClick={()=>{tk("Registrado. Você apareceu hoje 💖");back();}} style={{marginBottom:10}}>Registrar meu kit de hoje</BtnPill>
          <button onClick={()=>{setTm(kitMin);setTa(kitApoio);setEdit(true);}} style={{width:"100%",background:"none",border:`1px solid ${C.ouro}15`,borderRadius:50,padding:"11px",fontFamily:FB,fontWeight:300,fontSize:11,color:`rgba(255,255,255,.25)`,cursor:"pointer",letterSpacing:"0.1em"}}>Editar meu kit</button>
        </div>)}
      </Grain>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// ABA: CONTEÚDO
// ═══════════════════════════════════════════════════════════════════
function Conteudo({ perfil }) {
  const [sub, setSub] = useState("clube");
  const VS=[
    {id:1,tag:"Fisiologia 40+",titulo:"O que muda no seu corpo depois dos 40",dur:"18 min",thumb:"#1E252E"},
    {id:2,tag:"Longevidade",titulo:"Os 5 pilares da longevidade feminina",dur:"22 min",thumb:"#1E2E2A"},
    {id:3,tag:"Movimento",titulo:"Treino de força em casa — sem equipamento",dur:"35 min",thumb:"#252028"},
    {id:4,tag:"Mente",titulo:"Meditação guiada para reduzir ansiedade",dur:"12 min",thumb:"#201E2E"},
    {id:5,tag:"Sono",titulo:"Respiração para melhorar a qualidade do sono",dur:"8 min",thumb:"#1A2020"},
  ];
  const GUIAS=[
    {icon:"🏃",titulo:"Guia do Movimento",sub:"Mês 1 · Volume 1",tag:"PDF"},
    {icon:"🥗",titulo:"Guia da Alimentação e Hidratação",sub:"Mês 2 · Volume 2",tag:"PDF"},
    {icon:"🌙",titulo:"Guia do Tempo para Si",sub:"Mês 3 · Volume 3",tag:"PDF"},
  ];
  const MINI=[
    {icon:"🎯",titulo:"Mini Guia do Sabotador Principal",sub:"Diagnóstico personalizado",tag:"PDF"},
    {icon:"🥘",titulo:"Planejamento Alimentar em 15 min",sub:"Template semanal",tag:"PDF"},
    {icon:"📖",titulo:"Curadoria do Auge",sub:"Leituras recomendadas",tag:"Lista"},
  ];
  return(
    <div style={{animation:"fadeUp .35s ease"}}>
      <div style={{background:C.obs,padding:"12px 18px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.ouro}15`}}>
        <div style={{width:40}}/>
        <Logo width={100} fundo="escuro"/>
        <div style={{width:40}}/>
      </div>
      {perfil==="jornada"&&(
        <div style={{background:C.obs,display:"flex",borderBottom:`1px solid ${C.ouro}12`,padding:"0 18px"}}>
          {[["clube","Clube"],["jornada","Minha Jornada"]].map(([id,lb])=>(
            <button key={id} onClick={()=>setSub(id)} style={{flex:1,padding:"11px 0",background:"none",border:"none",borderBottom:`2px solid ${sub===id?C.ouro:"transparent"}`,fontFamily:FB,fontWeight:300,fontSize:12,color:sub===id?C.ouro:`rgba(255,255,255,.3)`,cursor:"pointer",letterSpacing:"0.08em",transition:"all .2s"}}>{lb}</button>
          ))}
        </div>
      )}
      <Grain style={{padding:"14px 16px 8px"}}>
        {sub==="clube"&&VS.map(v=>(
          <div key={v.id} style={{background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}12`,borderRadius:10,marginBottom:10,overflow:"hidden",display:"flex",cursor:"pointer"}}>
            <div style={{width:88,background:v.thumb,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,color:`rgba(255,255,255,.3)`}}>▶</div>
            <div style={{padding:"12px 14px",flex:1}}>
              <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>{v.tag}</div>
              <div style={{fontFamily:FS,fontSize:15,color:`rgba(255,255,255,.75)`,lineHeight:1.3,marginBottom:3}}>{v.titulo}</div>
              <div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:`rgba(255,255,255,.3)`}}>Dra. Isadora · {v.dur}</div>
            </div>
          </div>
        ))}
        {sub==="jornada"&&(
          <div>
            <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,letterSpacing:"0.35em",textTransform:"uppercase",marginBottom:12}}>Guias dos Hábitos Angulares</div>
            {GUIAS.map((g,i)=>{
              const bloq = perfil!=="jornada";
              return(
              <div key={i} onClick={()=>bloq&&(window._showVit=true)}
                style={{background:`rgba(255,255,255,.04)`,border:`1px solid ${bloq?C.ouro+"08":C.ouro+"15"}`,borderRadius:10,padding:"13px 15px",marginBottom:9,display:"flex",alignItems:"center",gap:12,cursor:"pointer",opacity:bloq?.6:1}}>
                <div style={{fontSize:22,flexShrink:0}}>{g.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:FS,fontSize:15,color:bloq?`rgba(255,255,255,.4)`:`rgba(255,255,255,.8)`,marginBottom:2}}>{g.titulo}</div>
                  <div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:`rgba(255,255,255,.25)`}}>{g.sub}</div>
                </div>
                {bloq
                  ? <div style={{fontSize:18}}>🔒</div>
                  : <div style={{background:`${C.ouro}18`,border:`1px solid ${C.ouro}30`,borderRadius:20,padding:"3px 9px",fontFamily:FB,fontSize:9,color:C.ouro,letterSpacing:"0.1em"}}>{g.tag}</div>
                }
              </div>
            );})}
            <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,letterSpacing:"0.35em",textTransform:"uppercase",marginBottom:12,marginTop:18}}>Mini Guias e Ferramentas</div>
            {MINI.map((g,i)=>{
              const bloq = perfil!=="jornada";
              return(
              <div key={i}
                style={{background:`rgba(255,255,255,.04)`,border:`1px solid ${bloq?C.ouro+"08":C.ouro+"15"}`,borderRadius:10,padding:"13px 15px",marginBottom:9,display:"flex",alignItems:"center",gap:12,cursor:"pointer",opacity:bloq?.6:1}}>
                <div style={{fontSize:20,flexShrink:0}}>{g.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:FS,fontSize:15,color:bloq?`rgba(255,255,255,.4)`:`rgba(255,255,255,.8)`,marginBottom:2}}>{g.titulo}</div>
                  <div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:`rgba(255,255,255,.25)`}}>{g.sub}</div>
                </div>
                {bloq
                  ? <div style={{fontSize:18}}>🔒</div>
                  : <div style={{background:`${C.ouro}18`,border:`1px solid ${C.ouro}30`,borderRadius:20,padding:"3px 9px",fontFamily:FB,fontSize:9,color:C.ouro,letterSpacing:"0.1em"}}>{g.tag}</div>
                }
              </div>
            );})}
            {perfil!=="jornada" && (
              <div style={{background:`${C.ouro}10`,border:`1px solid ${C.ouro}25`,borderRadius:10,padding:"16px",marginTop:8,textAlign:"center"}}>
                <div style={{fontFamily:FS,fontStyle:"italic",fontSize:15,color:C.ouro,marginBottom:8}}>Quer ter acesso a todo o conteúdo?</div>
                <div style={{fontFamily:FB,fontWeight:300,fontSize:12,color:`rgba(255,255,255,.4)`,lineHeight:1.6,marginBottom:14}}>Os guias e mini guias são exclusivos da Jornada AUGE.</div>
                <BtnPill onClick={()=>window.open("https://wa.me/5548999999999","_blank")} style={{fontSize:13}}>Quero entrar na lista de espera</BtnPill>
              </div>
            )}
          </div>
        )}
      </Grain>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ABA: PERFIL
// ═══════════════════════════════════════════════════════════════════
function Perfil({ perfil, matches, pontos, medC, habAngulares, setHabAngulares }) {
  return(
    <div style={{animation:"fadeUp .35s ease"}}>
      <div style={{background:C.obs,padding:"24px 18px 30px",textAlign:"center",borderBottom:`1px solid ${C.ouro}12`}}>
        <div style={{width:80,height:80,borderRadius:"50%",background:`${C.ouro}18`,border:`1px solid ${C.ouro}33`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FS,fontSize:28,color:C.ouro,margin:"0 auto 12px"}}>RF</div>
        <div style={{fontFamily:FS,fontSize:22,fontWeight:300,color:`rgba(255,255,255,.85)`}}>Regina Fonseca</div>
        <div style={{fontFamily:FB,fontWeight:300,fontSize:12,color:C.ouro,marginTop:4}}>{perfil==="jornada"?"Aluna da Jornada · Semana 3 de 12":"Assinante da Comunidade"}</div>
        {perfil==="jornada"&&<div style={{display:"inline-block",background:"rgba(15,110,86,.18)",border:"1px solid rgba(15,110,86,.3)",borderRadius:20,padding:"4px 14px",marginTop:10,color:"#4ade80",fontSize:11,fontFamily:FB}}>✓ Identidade verificada</div>}
      </div>
      <Grain style={{padding:"18px 18px 32px"}}>
        {/* Estatísticas */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
          {[["💚","Conexões",`${matches?.length||0}`],["📋","Treinos",`8`],["▶","Conteúdos","12"],["⭐","Pontos AUGE",`${pontos||0}`]].map(([ic,l,v])=>(
            <div key={l} style={{background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}12`,borderRadius:10,padding:"13px 14px"}}>
              <div style={{fontFamily:FB,fontWeight:300,fontSize:11,color:`rgba(255,255,255,.35)`,marginBottom:4}}>{ic}  {l}</div>
              <div style={{fontFamily:FS,fontSize:22,color:C.ouro}}>{v}</div>
            </div>
          ))}
        </div>

        {/* Medalhas */}
        {perfil==="jornada"&&(
          <div style={{marginBottom:18}}>
            <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,letterSpacing:"0.3em",textTransform:"uppercase",marginBottom:12}}>Medalhas</div>
            <div style={{display:"flex",gap:8}}>
              {MEDALHAS.map(med=>{const ok=medC?.includes(med.id);return(
                <div key={med.id} style={{flex:1,background:ok?`${med.cor}12`:`rgba(255,255,255,.02)`,border:`1px solid ${ok?med.cor+"28":C.ouro+"10"}`,borderRadius:10,padding:"10px 6px",textAlign:"center"}}>
                  <div style={{fontSize:20,filter:ok?"none":"grayscale(1)",opacity:ok?1:.3}}>{med.icon}</div>
                  <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:ok?`rgba(255,255,255,.45)`:`rgba(255,255,255,.15)`,marginTop:4,lineHeight:1.4}}>{med.nome}</div>
                </div>
              );})}
            </div>
          </div>
        )}

        {/* Próximo encontro */}
        {perfil==="jornada"&&(
          <div style={{background:`${C.ouro}10`,border:`1px solid ${C.ouro}20`,borderRadius:10,padding:"14px 16px",marginBottom:14}}>
            <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,letterSpacing:"0.3em",textTransform:"uppercase",marginBottom:5}}>Próxima mentoria</div>
            <div style={{fontFamily:FS,fontSize:17,color:`rgba(255,255,255,.8)`}}>Quinta, 29/05 às 19h30</div>
            <div style={{fontFamily:FB,fontWeight:300,fontSize:12,color:C.ouro,marginTop:3}}>Semana 4 · via Zoom · 75 minutos</div>
          </div>
        )}

        {/* Preferências para o radar de amigas */}
        <PrefRadar/>
        <EditarHabitos habAngulares={habAngulares} setHabAngulares={setHabAngulares}/>

        {/* Aviso legal */}
        <div style={{background:`rgba(255,255,255,.02)`,border:`1px solid ${C.ouro}10`,borderRadius:10,padding:"12px 14px",marginTop:14}}>
          <div style={{fontFamily:FB,fontWeight:300,fontSize:10,color:`rgba(255,255,255,.2)`,lineHeight:1.6}}>Este app é um programa de desenvolvimento de hábitos e estilo de vida. Não substitui consulta médica ou acompanhamento clínico.</div>
        </div>
      </Grain>
    </div>
  );
}

function PrefRadar() {
  const INTERESSES = ["Caminhada","Corrida","Pilates","Yoga","Musculação","Natação","Dança","Funcional","Leitura","Meditação"];
  const [cidade, setCidade] = useState("");
  const [sels,   setSels]   = useState([]);
  const [salvo,  setSalvo]  = useState(false);
  const toggle = i => setSels(s=>s.includes(i)?s.filter(x=>x!==i):[...s,i]);
  return (
    <div style={{background:`rgba(255,255,255,.04)`,border:`1px solid ${C.ouro}15`,
      borderRadius:10,padding:"16px",marginBottom:14}}>
      <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,
        letterSpacing:"0.35em",textTransform:"uppercase",marginBottom:14}}>
        Minhas preferências · Radar de Amigas
      </div>
      <div style={{fontFamily:FB,fontWeight:300,fontSize:12,
        color:`rgba(255,255,255,.35)`,marginBottom:8}}>Cidade</div>
      <input value={cidade} onChange={e=>setCidade(e.target.value)}
        placeholder="Ex: Florianópolis"
        style={{width:"100%",background:"transparent",border:"none",
          borderBottom:`1px solid rgba(255,255,255,.2)`,color:C.branco,
          fontFamily:FB,fontWeight:300,fontSize:15,padding:"7px 0",
          marginBottom:18}}/>
      <div style={{fontFamily:FB,fontWeight:300,fontSize:12,
        color:`rgba(255,255,255,.35)`,marginBottom:10}}>
        Interesses (selecione os seus)
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:16}}>
        {INTERESSES.map(i=>{const s=sels.includes(i);return(
          <button key={i} onClick={()=>toggle(i)}
            style={{background:s?`${C.ouro}22`:`rgba(255,255,255,.04)`,
              border:`1px solid ${s?C.ouro+"44":C.ouro+"12"}`,borderRadius:50,
              padding:"7px 13px",fontFamily:FB,fontWeight:300,fontSize:12,
              color:s?C.ouro:`rgba(255,255,255,.4)`,cursor:"pointer"}}>
            {i}
          </button>
        );})}
      </div>
      {salvo?(
        <div style={{fontFamily:FB,fontWeight:300,fontSize:12,
          color:C.augeZ,textAlign:"center"}}>✓ Preferências salvas!</div>
      ):(
        <BtnPill onClick={()=>setSalvo(true)} style={{fontSize:13}}>
          Salvar preferências
        </BtnPill>
      )}
    </div>
  );
}

function EditarHabitos({ habAngulares, setHabAngulares }) {
  const [vals, setVals] = useState(
    habAngulares.length > 0
      ? habAngulares.map(h=>h.t)
      : ["","",""]
  );
  const [salvo, setSalvo] = useState(false);
  const ok = vals.every(v=>v.trim());
  const salvar = () => {
    if(!ok) return;
    setHabAngulares(vals.map((t,i)=>({id:"ha"+(i+1),t:t.trim()})));
    setSalvo(true);
    setTimeout(()=>setSalvo(false),2000);
  };
  return(
    <div style={{background:"rgba(255,255,255,.04)",border:`1px solid ${C.ouro}15`,
      borderRadius:10,padding:"16px",marginBottom:14,marginTop:14}}>
      <div style={{fontFamily:FB,fontWeight:300,fontSize:9,color:C.ouro,
        letterSpacing:"0.35em",textTransform:"uppercase",marginBottom:14}}>
        Meus hábitos angulares
      </div>
      {vals.map((v,i)=>(
        <div key={i} style={{marginBottom:16}}>
          <div style={{fontFamily:FB,fontWeight:300,fontSize:10,
            color:"rgba(255,255,255,.35)",letterSpacing:"0.2em",
            textTransform:"uppercase",marginBottom:6}}>
            {i+1}º hábito
          </div>
          <input value={v} onChange={e=>{const n=[...vals];n[i]=e.target.value;setVals(n);}}
            placeholder="Defina seu hábito"
            style={{width:"100%",background:"transparent",border:"none",
              borderBottom:`1px solid ${v.trim()?C.ouro+"55":"rgba(255,255,255,.2)"}`,
              color:C.branco,fontFamily:FS,fontSize:16,fontWeight:300,padding:"7px 0"}}/>
        </div>
      ))}
      {salvo
        ? <div style={{fontFamily:FB,fontWeight:300,fontSize:12,color:C.augeZ,textAlign:"center"}}>✓ Hábitos salvos!</div>
        : <BtnPill onClick={salvar} style={{opacity:ok?1:.4,fontSize:13}}>Salvar hábitos</BtnPill>
      }
    </div>
  );
}
