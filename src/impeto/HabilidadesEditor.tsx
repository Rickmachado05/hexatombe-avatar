import type { ChangeEvent } from "react";
import {
  CATEGORIAS,EFEITOS,PERFIS,PRECO_PX,usaDados,custoPC,custoPassiva,custoPX,custoEN,
  custoENPX,resumoAtiva,
} from "./habilidades";
import type { Ativa,Passiva,Exploracao,Perfil,Efeito,Dado,Ativacao,ClassePX } from "./habilidades";
import "./HabilidadesEditor.css";

type Props = {
  perfil:Perfil; ativas:Ativa[]; passiva:Passiva; exploracao:Exploracao[];
  editarAtiva:(i:number,campos:Partial<Ativa>)=>void;
  editarPassiva:(campos:Partial<Passiva>)=>void;
  editarExploracao:(i:number,campos:Partial<Exploracao>)=>void;
  adicionarExploracao:()=>void;
  removerExploracao:(i:number)=>void;
};

const OPCOES_DADOS: Dado[]=[4,6,8,10,12];
const OPCOES_PX:Exclude<ClassePX,"nenhum">[]=["pontual","especializada","complexa","ampla","extraordinaria"];
const TIPO_ATIVACAO:Record<Ativacao,string>={
  principal:"Ação principal",buff:"Buff rápido (até 1/turno)",
  reacao:"Reação (até 1/rodada)"
};
function numeroSeguro(e:ChangeEvent<HTMLInputElement>,min:number,max:number):number{
  const n=Number(e.target.value);
  return Number.isFinite(n)?Math.max(min,Math.min(max,Math.round(n))):min;
}
function CampoTexto({titulo,valor,alterar,linhas=0,ajuda}:{
  titulo:string;valor:string;alterar:(v:string)=>void;linhas?:number;ajuda?:string;
}) {
  return <label className="impeto-campo">
    <span>{titulo}</span>
    {linhas>0 ?
      <textarea rows={linhas} value={valor} onChange={e=>alterar(e.target.value)} /> :
      <input type="text" value={valor} onChange={e=>alterar(e.target.value)} />}
    {ajuda && <small>{ajuda}</small>}
  </label>;
}
function Orcamentos({perfil,ativas,passiva,exploracao}:Pick<Props,
  "perfil"|"ativas"|"passiva"|"exploracao">) {
  const l=PERFIS[perfil];
  const totalPC=ativas.reduce((a,b)=>a+custoPC(b),0)+custoPassiva(passiva);
  const totalPX=exploracao.reduce((a,b)=>a+custoPX(b),0);
  return <div className="impeto-orcamentos">
    <div className="impeto-campanha-fixa">
      <strong>HEXATOMBE: AVATAR</strong>
      <span>Orçamento exclusivo da campanha</span>
    </div>
    <div className="impeto-saldos">
      <div><strong>{l.pc-totalPC}</strong><span>PC restantes</span>
        <small>{totalPC}/{l.pc} usados</small></div>
      <div><strong>{l.px-totalPX}</strong><span>PX restantes</span>
        <small>{totalPX}/{l.px} usados</small></div>
    </div>
    <small>PC das cinco ativas + uma passiva; PX exclusivos das até três técnicas de exploração.
      Não é permitido trocar PC por PX. A campanha utiliza 100 PC e 35 PX do
      piloto experimental Avatar, com teto individual PX provisório de 16.</small>
  </div>;
}
function Dados({dado,quantidade,fixo,onChange}:{
  dado:Dado;quantidade:number;fixo:number;
  onChange:(campos:{dado?:Dado;quantidade?:number;fixo?:number})=>void;
}) {
  return <div className="impeto-grade-campos">
    <label>Dado
      <select value={dado} onChange={e=>onChange({dado:Number(e.target.value) as Dado})}>
        {OPCOES_DADOS.map(d=><option key={d} value={d}>d{d}</option>)}
      </select>
    </label>
    <label>Quantidade de dados
      <input type="number" min={1} max={10} step={1} value={quantidade}
        onChange={e=>onChange({quantidade:numeroSeguro(e,1,10)})}/>
    </label>
    <label>Bônus fixo
      <input type="number" min={0} max={20} step={1} value={fixo}
        onChange={e=>onChange({fixo:numeroSeguro(e,0,20)})}/>
    </label>
  </div>;
}
export function CombateImpeto(props:Props){
  const {perfil,ativas,passiva,exploracao,editarAtiva,editarPassiva}=props;
  const limite=PERFIS[perfil];
  return <div className="impeto-construtor">
    <h2>Construtor de Habilidades de Combate</h2>
    <Orcamentos {...{perfil,ativas,passiva,exploracao}}/>
    <p className="impeto-explicacao">H06: cinco técnicas ativas e uma passiva dividem o mesmo orçamento
      PC. Cada ativa tem teto de {limite.ativa} PC; a passiva, {limite.passiva} PC.
      Dano, cura e proteção não são somados automaticamente ao Ataque Básico.
      Os custos são candidatos em playtest.</p>
    {ativas.map((a,i)=>{
      const pc=custoPC(a),en=custoEN(pc,a);
      const ehDado=usaDados(a.efeito);
      const permitidas:Ativacao[]=a.efeito==="buffCa1"||a.efeito==="buffCa2" ?
        ["principal","buff"] :
        a.efeito==="escudo"||a.efeito==="mitigacao" ?
          ["principal","reacao"] : ["principal"];
      return <details className="impeto-cartao" key={i} open={i===0?undefined:undefined}>
        <summary>
          <span className="impeto-numero">{i+1}</span>
          <span className="impeto-nome">{a.nome||"Habilidade "+(i+1)}
            <small>{resumoAtiva(a)} · {a.ativacao==="principal"?"Principal":TIPO_ATIVACAO[a.ativacao]}</small>
          </span>
          <span className="impeto-preco">{pc} PC<small>{en===null?"EN a revisar":en+" EN"}</small></span>
        </summary>
        <div className="impeto-corpo">
          <CampoTexto titulo="Nome da habilidade" valor={a.nome}
            alterar={v=>editarAtiva(i,{nome:v})} />
          <label className="impeto-campo"><span>Efeito principal</span>
            <select value={a.efeito} onChange={e=>{
              const efeito=e.target.value as Efeito;
              editarAtiva(i,{efeito,ativacao:"principal",rodadasExtras:0,empurraoAdicional:false});
            }}>{EFEITOS.map(o=><option key={o.id} value={o.id}>{o.nome}</option>)}</select>
          </label>
          {ehDado&&<Dados dado={a.dado} quantidade={a.quantidade} fixo={a.fixo}
            onChange={campos=>editarAtiva(i,campos)}/>}
          {a.efeito==="dano"&&<label className="impeto-check">
            <input type="checkbox" checked={a.empurraoAdicional}
              onChange={e=>editarAtiva(i,{empurraoAdicional:e.target.checked})}/>
            Somar empurrão simples ao dano (+4 PC antes dos modificadores)
          </label>}
          <div className="impeto-grade-campos">
            <label>Ativação
              <select value={a.ativacao}
                onChange={e=>editarAtiva(i,{ativacao:e.target.value as Ativacao})}>
                {permitidas.map(op=><option key={op} value={op}>{TIPO_ATIVACAO[op]}</option>)}
              </select>
            </label>
            <label>Alvos
              <select value={a.alvos}
                onChange={e=>editarAtiva(i,{alvos:Number(e.target.value) as 1|2|3})}>
                <option value={1}>1 alvo · ×1</option>
                <option value={2}>2 alvos · ×1,5</option>
                <option value={3}>3 alvos · ×2</option>
              </select>
            </label>
            <label>Rodadas extras (+3 PC cada)
              <select value={a.rodadasExtras}
                disabled={!["escudo","mitigacao","buffCa1","buffCa2"].includes(a.efeito)}
                onChange={e=>editarAtiva(i,{rodadasExtras:Number(e.target.value)})}>
                {[0,1,2,3].map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
          <label className="impeto-check">
            <input type="checkbox" checked={a.distante}
              onChange={e=>editarAtiva(i,{distante:e.target.checked})}/>
            Alcance narrativo distante (+25% no subtotal, H03 opcional)
          </label>
          {a.ativacao==="reacao"&&<CampoTexto titulo="Gatilho da reação" valor={a.gatilho}
            alterar={v=>editarAtiva(i,{gatilho:v})}
            ajuda="Proteções reativas normalmente são declaradas após acerto, antes do dano."/>}
          <CampoTexto titulo="Manifestação narrativa" valor={a.descricao} linhas={3}
            alterar={v=>editarAtiva(i,{descricao:v})}/>
          <CampoTexto titulo="Limitações, defesa e contrajogo" valor={a.limites} linhas={2}
            alterar={v=>editarAtiva(i,{limites:v})}/>
          {a.referenciaAntiga&&<p className="impeto-legado">{a.referenciaAntiga}</p>}
          <p className="impeto-resultado">Custo de criação: <strong>{pc} PC</strong> ·
            Custo de uso: <strong>{en===null?"pactuar EN com o mestre":en+" EN"}</strong></p>
          {a.efeito==="atordoamento"&&<p className="impeto-nota">C02: uma defesa inicial;
            perde próxima ação principal e buff, testa escape, no máximo duas ativações afetadas.
            Chefes perdem no máximo uma ativação por rodada.</p>}
          {a.efeito==="dano"&&<p className="impeto-nota">Crítico em 20 natural acrescenta
            um dado do mesmo tipo; não duplica bônus fixos.</p>}
        </div>
      </details>;
    })}
    <section className="impeto-cartao impeto-passiva">
      <h3>Passiva de combate · H04.1</h3>
      <p>Uma passiva não é talento do arquétipo e não usa reação nem concede ações extras.
        Registre um gatilho verificável e um número máximo de disparos por combate.</p>
      <CampoTexto titulo="Nome da passiva" valor={passiva.nome}
        alterar={v=>editarPassiva({nome:v})}/>
      <div className="impeto-grade-campos">
        <label>Efeito
          <select value={passiva.efeito} onChange={e=>editarPassiva({efeito:e.target.value as Passiva["efeito"]})}>
            <option value="nenhum">Sem efeito definido</option>
            <option value="dano">Bônus de dano a um acerto</option>
            <option value="escudo">Absorção automática</option>
            <option value="mitigacao">Mitigação automática</option>
          </select>
        </label>
        <label>Usos automáticos/combate
          <select value={passiva.usos} onChange={e=>editarPassiva({usos:Number(e.target.value) as 1|2|3})}>
            <option value={1}>1 uso · ×1</option>
            <option value={2}>2 usos · ×1,8</option>
            <option value={3}>3 usos · ×2,5</option>
          </select>
        </label>
      </div>
      {passiva.efeito!=="nenhum"&&<Dados dado={passiva.dado}
        quantidade={passiva.quantidade} fixo={passiva.fixo}
        onChange={campos=>editarPassiva(campos)}/>}
      <CampoTexto titulo="Gatilho observável" valor={passiva.gatilho}
        alterar={v=>editarPassiva({gatilho:v})}
        ajuda="Ex.: ao receber o primeiro acerto do combate. Não há gatilhos ilimitados."/>
      <CampoTexto titulo="Manifestação narrativa" valor={passiva.descricao} linhas={2}
        alterar={v=>editarPassiva({descricao:v})}/>
      <CampoTexto titulo="Limites e não acúmulo" valor={passiva.limites} linhas={2}
        alterar={v=>editarPassiva({limites:v})}/>
      {passiva.referenciaAntiga&&<p className="impeto-legado">{passiva.referenciaAntiga}</p>}
      <p className="impeto-resultado">Custo: <strong>{custoPassiva(passiva)} PC</strong>
        (teto {limite.passiva} PC) · aplicação automática sem ação extra.</p>
    </section>
  </div>;
}
export function ExploracaoImpeto(props:Props){
  const {perfil,ativas,passiva,exploracao,editarExploracao,adicionarExploracao,removerExploracao}=props;
  const limite=PERFIS[perfil];
  return <div className="impeto-construtor">
    <h2>Técnicas de Exploração</h2>
    <Orcamentos {...{perfil,ativas,passiva,exploracao}}/>
    <p className="impeto-explicacao">Até três técnicas adicionais, compradas com PX independentes
      das cinco ativas e da passiva. Cada técnica tem teto de {limite.exploracao} PX.
      Não ganha ataque, buff, reação ou ação principal extra. Os usos cotidianos do elemento
      continuam livres; PX compra feitos especiais.</p>
    {exploracao.map((e,i)=>{
      const px=custoPX(e),en=custoENPX(px,e.automatica);
      return <details key={i} className="impeto-cartao">
        <summary><span className="impeto-numero">EX {i+1}</span>
          <span className="impeto-nome">{e.nome||"Técnica de exploração "+(i+1)}
            <small>{e.classe} · {e.categoria}</small></span>
          <span className="impeto-preco">{px} PX<small>{en===null?"EN especial":en+" EN"}</small></span>
        </summary>
        <div className="impeto-corpo">
          <button className="impeto-excluir" type="button" onClick={()=>removerExploracao(i)}>
            Remover técnica
          </button>
          <CampoTexto titulo="Nome da técnica" valor={e.nome}
            alterar={v=>editarExploracao(i,{nome:v})}/>
          <div className="impeto-grade-campos">
            <label>Categoria narrativa
              <select value={e.categoria}
                onChange={v=>editarExploracao(i,{categoria:v.target.value})}>
                {CATEGORIAS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>Classe do efeito
              <select value={e.classe}
                onChange={v=>editarExploracao(i,{classe:v.target.value as ClassePX})}>
                <option value="nenhum">Não definida</option>
                {OPCOES_PX.map(c=><option key={c} value={c}>{c} · {PRECO_PX[c]} PX base</option>)}
              </select>
            </label>
            <label>Alvos ou locais
              <select value={e.alvos}
                onChange={v=>editarExploracao(i,{alvos:Number(v.target.value) as 1|2|6})}>
                <option value={1}>1 (+0 PX)</option>
                <option value={2}>2 (+2 PX)</option>
                <option value={6}>Grupo até 6 (+4 PX)</option>
              </select>
            </label>
            <label>Alcance
              <select value={e.alcance}
                onChange={v=>editarExploracao(i,{alcance:v.target.value as Exploracao["alcance"]})}>
                <option value="proximo">Próximo (+0 PX)</option>
                <option value="distante">Distante (+2 PX)</option>
                <option value="remoto">Remoto (+6 PX)</option>
              </select>
            </label>
            <label>Duração
              <select value={e.duracao}
                onChange={v=>editarExploracao(i,{duracao:v.target.value as Exploracao["duracao"]})}>
                <option value="cena">Até uma cena (+0 PX)</option>
                <option value="duasCenas">Mais uma cena (+4 PX)</option>
                <option value="dia">Até um dia (+8 PX)</option>
              </select>
            </label>
            {!e.automatica&&<label>Ativações especiais/cena
              <select value={e.usos}
                onChange={v=>editarExploracao(i,{usos:Number(v.target.value) as 1|2|3})}>
                <option value={1}>1 (+0 PX)</option>
                <option value={2}>2 (+3 PX)</option>
                <option value={3}>3 (+6 PX)</option>
              </select>
            </label>}
          </div>
          <label className="impeto-check">
            <input type="checkbox" checked={e.automatica}
              onChange={v=>editarExploracao(i,{automatica:v.target.checked,usos:1})}/>
            Automática uma vez por cena (×1,5 PX, H06 experimental)
          </label>
          <CampoTexto titulo="O que esta técnica permite fazer?" valor={e.descricao} linhas={3}
            alterar={v=>editarExploracao(i,{descricao:v})}/>
          <CampoTexto titulo="Testes/perícias relevantes" valor={e.teste} linhas={2}
            alterar={v=>editarExploracao(i,{teste:v})}
            ajuda="Comprar PX não elimina testes quando existe risco, resistência ou consequência."/>
          <CampoTexto titulo="Limites, materiais, risco e contrajogo" valor={e.limites} linhas={2}
            alterar={v=>editarExploracao(i,{limites:v})}/>
          <p className="impeto-resultado">Construção: <strong>{px} PX</strong> · Ativação:{" "}
            <strong>{en===null?"EN especial a pactuar":en+" EN"}</strong></p>
          <p className="impeto-nota">Em combate, usar PX sob pressão para alterar um objetivo
            consome ação principal, salvo regra especial aprovada pelo mestre.
            PX não gera dano, cura, controle contra CA nem ações extras.</p>
        </div>
      </details>;
    })}
    <button className="impeto-adicionar" type="button"
      disabled={exploracao.length>=3} onClick={adicionarExploracao}>
      + Adicionar técnica de exploração ({exploracao.length}/3)
    </button>
    <p className="impeto-nota">Categorias Ampla (18 PX) e Extraordinária (28 PX) aparecem na
      tabela H06, mas ultrapassam o teto atual de 16 PX por técnica deste criador.
      Para usá-las será necessário aprovar outro teto de campanha.</p>
  </div>;
}

export function ResumoHabilidadesImpeto({perfil,ativas,passiva,exploracao}:Pick<Props,
  "perfil"|"ativas"|"passiva"|"exploracao">){
  const pc=ativas.reduce((a,b)=>a+custoPC(b),0)+custoPassiva(passiva);
  const px=exploracao.reduce((a,b)=>a+custoPX(b),0);
  return <div className="impeto-resumo">
    <h3>Habilidades do Ímpeto</h3>
    <p>Configuração: {PERFIS[perfil].nome} · PC {pc}/{PERFIS[perfil].pc} ·
      PX {px}/{PERFIS[perfil].px}</p>
    <h4>Cinco técnicas ativas</h4>
    {ativas.map((a,i)=><p key={i}><strong>{i+1}. {a.nome||"Sem nome"}</strong> —
      {resumoAtiva(a)} · {custoPC(a)} PC · {custoEN(custoPC(a),a)??"EN a pactuar"} EN
      {a.descricao&&<small>{a.descricao}</small>}</p>)}
    <h4>Passiva</h4>
    <p><strong>{passiva.nome||"Sem nome"}</strong> — {passiva.efeito} ·
      {custoPassiva(passiva)} PC · {passiva.usos} ativação(ões)/combate</p>
    <h4>Exploração ({exploracao.length}/3)</h4>
    {exploracao.length===0&&<p>Nenhuma técnica especial de exploração comprada.</p>}
    {exploracao.map((e,i)=><p key={i}><strong>{e.nome||"Sem nome"}</strong> —
      {e.classe} · {custoPX(e)} PX · {custoENPX(custoPX(e),e.automatica)??"EN especial"} EN
      {e.descricao&&<small>{e.descricao}</small>}</p>)}
    <p className="impeto-nota">Este resumo é editável no JSON; o PDF ainda não inclui
      o construtor H06/H04.1/PX e será atualizado separadamente.</p>
  </div>;
}
