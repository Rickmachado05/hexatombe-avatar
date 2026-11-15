// Ímpeto RPG 1.0, Playtest Público — H06/CA05/C02/H04.1 (preços candidatos).
// PC e PX são orçamentos independentes; EN é custo de ativação.
export type Perfil = "introducao" | "avatar";
export const PERFIS = {
  introducao: { nome:"Ímpeto — livro", pc:80, px:25, ativa:24, passiva:20, exploracao:16 },
  avatar: { nome:"Hexatombe: Avatar — piloto experimental", pc:100, px:35, ativa:28, passiva:20, exploracao:16 },
} as const;
export type Efeito = "nenhum"|"dano"|"cura"|"escudo"|"mitigacao"|"empurrao"|"imobilizacao"|"atordoamento"|"buffCa1"|"buffCa2";
export type Ativacao = "principal"|"buff"|"reacao";
export type Dado = 4|6|8|10|12;
export type Ativa = {
  nome:string; efeito:Efeito; dado:Dado; quantidade:number; fixo:number;
  empurraoAdicional:boolean; ativacao:Ativacao; alvos:1|2|3;
  distante:boolean; rodadasExtras:number; gatilho:string; descricao:string; limites:string;
  referenciaAntiga?:string;
};
export type Passiva = {
  nome:string; efeito:"nenhum"|"dano"|"escudo"|"mitigacao"; dado:Dado;
  quantidade:number; fixo:number; usos:1|2|3; gatilho:string;
  descricao:string; limites:string; referenciaAntiga?:string;
};
export type ClassePX = "nenhum"|"pontual"|"especializada"|"complexa"|"ampla"|"extraordinaria";
export type Exploracao = {
  nome:string; classe:ClassePX; categoria:string; alvos:1|2|6;
  alcance:"proximo"|"distante"|"remoto"; duracao:"cena"|"duasCenas"|"dia";
  usos:1|2|3; automatica:boolean; descricao:string; limites:string; teste:string;
};
export const CATEGORIAS = [
  "Percepção e investigação","Deslocamento e acesso","Comunicação e informação",
  "Transformação e criação","Proteção ambiental","Relações e negociação",
  "Conhecimento espiritual/tecnológico"
];
export const EFEITOS:{id:Efeito;nome:string}[] = [
  {id:"nenhum",nome:"Sem efeito definido"},
  {id:"dano",nome:"Dano"},{id:"cura",nome:"Cura"},
  {id:"escudo",nome:"Escudo de absorção"},
  {id:"mitigacao",nome:"Mitigação de um impacto"},
  {id:"empurrao",nome:"Empurrão simples"},
  {id:"imobilizacao",nome:"Imobilização"},
  {id:"atordoamento",nome:"Atordoamento completo C02"},
  {id:"buffCa1",nome:"+1 CA Efetiva"},
  {id:"buffCa2",nome:"+2 CA Efetiva"}
];
export const PRECO_DADOS:Record<Dado,number>={4:3,6:4,8:5,10:6,12:7};
export const PRECO_PX:Record<Exclude<ClassePX,"nenhum">,number>={
  pontual:4,especializada:8,complexa:12,ampla:18,extraordinaria:28
};
export const novaAtiva=():Ativa=>({
  nome:"",efeito:"nenhum",dado:8,quantidade:1,fixo:0,empurraoAdicional:false,
  ativacao:"principal",alvos:1,distante:false,rodadasExtras:0,
  gatilho:"",descricao:"",limites:""
});
export const novaPassiva=():Passiva=>({
  nome:"",efeito:"nenhum",dado:4,quantidade:1,fixo:0,usos:1,gatilho:"",
  descricao:"",limites:""
});
export const novaExploracao=():Exploracao=>({
  nome:"",classe:"pontual",categoria:CATEGORIAS[0],alvos:1,alcance:"proximo",
  duracao:"cena",usos:1,automatica:false,descricao:"",limites:"",teste:""
});
export const usaDados=(e:Efeito)=>["dano","cura","escudo","mitigacao"].includes(e);
export function ativacaoValida(a:Ativa):boolean{
  if(a.efeito==="nenhum")return true;
  if(a.ativacao==="buff" && !["buffCa1","buffCa2"].includes(a.efeito))return false;
  if(a.ativacao==="reacao" && !["escudo","mitigacao"].includes(a.efeito))return false;
  if(a.rodadasExtras>0 && !["escudo","mitigacao","buffCa1","buffCa2"].includes(a.efeito))return false;
  return true;
}
const dados=(d:Dado,q:number,f:number)=>q*PRECO_DADOS[d]+f*2;
export function custoPC(a:Ativa):number{
  let base=0;
  switch(a.efeito){
    case "nenhum":return 0;
    case "dano":base=dados(a.dado,a.quantidade,a.fixo)+(a.empurraoAdicional?4:0);break;
    case "cura":base=dados(a.dado,a.quantidade,a.fixo)*1.5;break;
    case "escudo":case "mitigacao":base=dados(a.dado,a.quantidade,a.fixo)*1.25;break;
    case "empurrao":base=4;break;
    case "imobilizacao":base=8;break;
    case "atordoamento":base=19;break;
    case "buffCa1":base=8;break;
    case "buffCa2":base=16;break;
  }
  // H06: uma única operação de teto para os multiplicadores; duração depois.
  return Math.ceil(base*(a.alvos===3?2:a.alvos===2?1.5:1)*
    (a.ativacao==="principal"?1:1.5)*(a.distante?1.25:1))+
    3*a.rodadasExtras;
}
export function custoPassiva(p:Passiva):number{
  if(p.efeito==="nenhum")return 0;
  // H04.1: arredondar o efeito antes do automatismo e frequência.
  const base=Math.ceil(dados(p.dado,p.quantidade,p.fixo)*
    (p.efeito==="escudo"||p.efeito==="mitigacao"?1.25:1));
  return Math.ceil(base*1.5*(p.usos===3?2.5:p.usos===2?1.8:1));
}
export function custoPX(e:Exploracao):number{
  if(e.classe==="nenhum")return 0;
  const subtotal=PRECO_PX[e.classe]+(e.alvos===6?4:e.alvos===2?2:0)+
    (e.alcance==="remoto"?6:e.alcance==="distante"?2:0)+
    (e.duracao==="dia"?8:e.duracao==="duasCenas"?4:0)+
    (e.automatica?0:e.usos===3?6:e.usos===2?3:0);
  return e.automatica?Math.ceil(subtotal*1.5):subtotal;
}
export function custoEN(pc:number,a?:Ativa):number|null{
  if(pc===0)return 0;
  if(a?.efeito==="atordoamento"&&pc===19)return 12;
  if(a?.ativacao==="reacao"&&a.efeito==="escudo"&&a.quantidade===1&&
    a.dado===8&&a.fixo===2&&a.alvos===1&&!a.distante&&
    a.rodadasExtras===0&&pc===17)return 12;
  if(a?.ativacao==="reacao"&&a.efeito==="mitigacao"&&a.quantidade===2&&
    a.dado===8&&a.fixo===0&&a.alvos===1&&!a.distante&&
    a.rodadasExtras===0&&pc===19)return 15;
  if(pc<4)return null; // 3 PC e menores: o livro não fixa EN.
  if(pc<=7)return 3;if(pc<=14)return 6;if(pc<=22)return 10;
  if(pc<=30)return 15;if(pc<=40)return 21;if(pc<=55)return 28;
  if(pc<=70)return 36;return null;
}
export function custoENPX(px:number,automatica:boolean):number|null{
  if(px===0||automatica)return 0;
  if(px<=4)return 1;if(px<=8)return 2;if(px<=12)return 4;
  if(px<=18)return 6;if(px<=28)return 10;return null;
}
export const resumoAtiva=(a:Ativa)=>{
  if(usaDados(a.efeito))
    return String(a.quantidade)+"d"+a.dado+(a.fixo?"+"+a.fixo:"")+
      (a.empurraoAdicional&&a.efeito==="dano"?" + empurrão":"");
  return EFEITOS.find(e=>e.id===a.efeito)?.nome??"Não definida";
};
const obj=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==="object"&&!Array.isArray(x);
const texto=(x:unknown)=>typeof x==="string";
const inteiro=(x:unknown,min:number,max:number)=>
  typeof x==="number"&&Number.isInteger(x)&&x>=min&&x<=max;
const um=(x:unknown,a:unknown[])=>a.includes(x);
export function validaAtiva(x:unknown):x is Ativa{
  if(!obj(x))return false;
  return texto(x.nome)&&um(x.efeito,EFEITOS.map(e=>e.id))&&
    um(x.dado,[4,6,8,10,12])&&inteiro(x.quantidade,1,10)&&inteiro(x.fixo,0,20)&&
    typeof x.empurraoAdicional==="boolean"&&um(x.ativacao,["principal","buff","reacao"])&&
    um(x.alvos,[1,2,3])&&typeof x.distante==="boolean"&&inteiro(x.rodadasExtras,0,3)&&
    texto(x.gatilho)&&texto(x.descricao)&&texto(x.limites)&&
    (x.referenciaAntiga===undefined||texto(x.referenciaAntiga))&&
    ativacaoValida(x as Ativa)&&(!x.empurraoAdicional||x.efeito==="dano");
}
export function validaPassiva(x:unknown):x is Passiva{
  if(!obj(x))return false;
  return texto(x.nome)&&um(x.efeito,["nenhum","dano","escudo","mitigacao"])&&
    um(x.dado,[4,6,8,10,12])&&inteiro(x.quantidade,1,10)&&inteiro(x.fixo,0,20)&&
    um(x.usos,[1,2,3])&&texto(x.gatilho)&&texto(x.descricao)&&texto(x.limites)&&
    (x.referenciaAntiga===undefined||texto(x.referenciaAntiga));
}
export function validaExploracao(x:unknown):x is Exploracao{
  if(!obj(x))return false;
  return texto(x.nome)&&um(x.classe,["nenhum","pontual","especializada","complexa","ampla","extraordinaria"])&&
    um(x.categoria,CATEGORIAS)&&um(x.alvos,[1,2,6])&&
    um(x.alcance,["proximo","distante","remoto"])&&
    um(x.duracao,["cena","duasCenas","dia"])&&
    um(x.usos,[1,2,3])&&typeof x.automatica==="boolean"&&
    (!x.automatica||x.usos===1)&&
    texto(x.descricao)&&texto(x.limites)&&texto(x.teste);
}
export function validaConstrucao(perfil:Perfil,ativas:Ativa[],passiva:Passiva,exploracao:Exploracao[]):boolean{
  if(!um(perfil,["introducao","avatar"])||
    !Array.isArray(ativas)||ativas.length!==5||!ativas.every(validaAtiva)||
    !validaPassiva(passiva)||!Array.isArray(exploracao)||exploracao.length>3||
    !exploracao.every(validaExploracao))return false;
  const l=PERFIS[perfil],pc=ativas.map(custoPC),p=custoPassiva(passiva),px=exploracao.map(custoPX);
  return pc.every(n=>n<=l.ativa)&&p<=l.passiva&&
    pc.reduce((a,b)=>a+b,0)+p<=l.pc&&
    px.every(n=>n<=l.exploracao)&&px.reduce((a,b)=>a+b,0)<=l.px;
}
export function migrarAtivas(
  antigas:{nome:string;efeito:string;limitacoes:string;modelo:string}[]
):Ativa[]{
  return Array.from({length:5},(_,i)=>({
    ...novaAtiva(),nome:antigas[i]?.nome??"",descricao:antigas[i]?.efeito??"",
    limites:antigas[i]?.limitacoes??""
  }));
}
export function migrarPassiva(antiga:{nome:string;descricao:string;modelo:string}):Passiva{
  return {...novaPassiva(),nome:antiga.nome,descricao:antiga.descricao};
}
