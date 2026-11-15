# Hexatombe: Avatar

**Criador de fichas de personagem para RPG**, desenvolvido com React, TypeScript e Vite. O projeto combina uma interface temática inspirada nos quatro elementos com regras de combate, personalização de técnicas e exportação de fichas em PDF.

> **Status:** beta pública — versão inicial do criador de personagens, publicada na Vercel e em testes com jogadores. Algumas regras são propostas de *playtest* e podem ser ajustadas pelo mestre.

### 🌐 Experimente o aplicativo

**[Abrir Hexatombe: Avatar — versão online](https://hexatombe-avatar.vercel.app/)**

Sem instalação: crie seu personagem no navegador, exporte o pergaminho em PDF ou salve a ficha editável em JSON. O código-fonte está disponível neste repositório.

## Funcionalidades

- **Identidade:** nome, elemento, retrato e história do personagem.
- **Cinco identidades elementais:** Água, Terra, Fogo, Ar e Não Dobrador, com temas visuais próprios.
- **Arquétipos e vantagens:** Ofensivo, Defensor, Controlador e Suporte, com talentos T02. Além disso, cada personagem pode escolher uma das oito vantagens universais V01, independentemente do arquétipo.
- **Recursos:** HP, Energia (EN), CA Base, Ataque Base e regeneração calculados pelos PR, sem perfis fixos de combate. O Ataque Básico continua com nome e descrição editáveis.
- **Derivação D01:** opcional, quando pelo menos um atributo chega a 12. Escolha Resistência (+3 HP), Reserva (+5 EN) ou Potência (+1 dano fixo no Ataque Básico), com atributo justificativo e anotação narrativa. Os bônus D01 não custam PR, não concedem CA nem bônus de acerto. Os valores seguem candidatos ao playtest de Avatar.
- **Ímpeto 1.0 (migração incremental):** editor dividido em Identidade, Arquétipo, Atributos, Perícias, Habilidades, Exploração e Prévia. Oito atributos universais com base 8, teto 14 e 32 PA (piloto Avatar A01, não homologado). Quatro arquétipos T02 com três talentos cada, separados das habilidades e da passiva. As 16 perícias universais são agrupadas em Físicas, Exploração, Conhecimento e Sociais, com 6 PT (piloto Avatar A01; Treinado +2 por 1 PT, Especialista +4 por 2 PT totais). **Pontos de Recursos (PR):** painel experimental com 20 PR para investir em HP, Energia, CA Base, Ataque Base e regeneração. A escala experiente A01 usa bases 130 HP/120 EN, CA 8, ataque 2d6+2, regeneração 0, mais os investimentos em PR e derivação D01. Estes números foram propostos a partir das faixas históricas de Hexatombe, mas não estão homologados em playtests. Tudo é salvo no navegador e no JSON. Os valores antigos fixos de combate já foram removidos do editor; o novo construtor de habilidades e exploração substitui os modelos anteriores na interface. A exportação PDF foi atualizada para mostrar os dados atuais da ficha.
- **Configuração de habilidades exclusiva de Avatar:** 100 PC compartilhados e 35 PX de exploração conforme o piloto experimental Hexatombe: Avatar. Não há seletor de outro perfil; o teto individual de técnicas de exploração ainda é conservador e experimental.
- **Habilidades de combate (H06):** cinco técnicas ativas com construção e custos de PC automáticos para dano, cura, escudo, mitigação, controle e bônus de CA; modificadores de alvos, ativação, duração e alcance, com limites e custo de Energia (EN).
- **Passiva (H04.1):** uma habilidade automática de combate com gatilho, benefício, frequência limitada e custo próprio de PC.
- **Técnicas de exploração (H06):** até três técnicas adicionais, compradas com PX independentes de PC, com classes de potência, escopo, duração, repetição e custo de EN.
- **Prévia:** consulta da ficha montada antes da exportação.
- **PDF dinâmico:** geração A4 com no mínimo quatro seções (resumo de combate, atributos e perícias, técnicas H06/passiva, exploração PX/história). Preserva as manchas de sangue, molduras rituais douradas e linhas da cor do elemento. Descrições longas ganham páginas adicionais sem cortes; apenas os resumos de consulta rápida podem ser abreviados.
- **JSON editável:** exporte a ficha completa (incluindo elemento, retrato, cinco técnicas e passiva) e importe-a novamente no editor, em outro navegador ou dispositivo.
- **Interface mobile completa:** em celulares, as sete abas viram uma navegação por etapas com progresso e seletor nativo; campos e recursos adaptam-se ao toque, cartões de habilidade não têm rolagem interna, botões Anterior/Próxima ficam acessíveis no rodapé e exportações JSON/PDF continuam disponíveis. A folha `src/HexatombeMobile.css` é carregada por último para preservar o layout desktop. Compatível também com smartphones em paisagem e telas touch compactas.

## Tecnologias

| Tecnologia | Uso |
| --- | --- |
| React | Interface e componentes da aplicação |
| TypeScript | Tipagem dos dados e regras da ficha |
| Vite | Ambiente de desenvolvimento e build |
| CSS | Identidade visual e temas elementais |
| jsPDF | Geração das fichas em PDF |

## Como executar localmente

**Pré-requisito:** Node.js e npm instalados.

```bash
git clone https://github.com/Rickmachado05/hexatombe-avatar.git
cd hexatombe-avatar
npm install
npm run dev
```

Abra no navegador o endereço local exibido pelo Vite.

Para gerar uma versão de produção:

```bash
npm run build
npm run preview
```

Para executar a verificação de lint disponível no projeto:

```bash
npm run lint
```

## Como usar

1. Escolha o elemento do personagem.
2. Preencha a identidade e adicione um retrato, se desejar. Não existe mais seleção de perfil de combate.
3. Na aba **Arquétipo**, escolha um dos quatro arquétipos do Ímpeto, um de seus três talentos T02 e uma vantagem universal V01. A vantagem não consome PC/PX e não ocupa espaço de habilidade.
4. Na aba **Atributos**, distribua os 32 PA da escala piloto Avatar A01 entre os oito atributos (base 8, teto 14), escolha uma derivação D01 se houver atributo 12+ e distribua **20 PR** entre HP, Energia, CA Base, Ataque Base e regeneração. A ficha parte de **130 HP/120 EN** e soma automaticamente os investimentos e a derivação escolhida. A01 é experimental.
5. Na aba **Perícias**, distribua 6 PT da escala piloto Avatar A01: Não treinado (+0), Treinado (+2) ou Especialista (+4).
6. Na aba **Habilidades**, construa as cinco técnicas ativas e uma passiva. Elas compartilham o orçamento fixo da campanha: **100 PC de Avatar** (experimental).
7. Na aba **Exploração**, crie até três técnicas independentes, usando os **35 PX de Avatar** (experimental).
8. Revise o resultado em **Prévia**.
9. Clique em **Exportar JSON** para salvar a ficha editável e em **Gerar ficha em PDF** para imprimir o pergaminho completo atualizado (atributos, perícias, T02/V01/D01, cinco ativas, passiva, PX e história). O texto longo é paginado automaticamente.
10. Para recuperar uma ficha, clique em **Importar ficha JSON** na página inicial (ou **Importar JSON** no editor) e escolha o arquivo exportado. A importação substitui o rascunho atual após confirmação.

**Escala Avatar A01 (novembro de 2026):** mantém a configuração de habilidades de 100 PC e 35 PX, enquanto atualiza as bases de atributos e recursos para 130 HP, 120 EN, 32 PA, 20 PR e 6 PT. Os custos de PR continuam iguais ao livro: +3 HP/PR, +5 EN/PR e custos progressivos de CA, Ataque e regeneração. Exemplos de alocação: equilibrado 136 HP/130 EN/CA 10 (15 PR usados); defensor 145 HP/120 EN/CA 11 (19 PR); suporte 130 HP/180 EN/CA 10 (18 PR). Os exemplos não representam classes obrigatórias. **Importante:** importar JSON de antes da A01 recalcula HP/EN sob as bases atuais; o editor avisa antes de substituir o rascunho. 

**Salvamento de rascunho:** o editor salva automaticamente a ficha em edição no armazenamento local deste navegador, incluindo retrato, técnicas e passiva. Ao reabrir o site no mesmo navegador, é possível continuar a edição. Isso não é backup em nuvem: limpar os dados do navegador pode apagar o rascunho. **Exporte JSON para manter um arquivo editável independente**; o PDF serve para consulta e impressão, não para reimportação.

**Compatibilidade:** fichas antigas podem conter a propriedade `classe` (Lutador, Linha de Frente ou Conjurador). Ela é aceita para leitura mas ignorada pelo criador atual, que não a exporta mais. JSONs que continham `perfilHabilidades: "introducao"` podem ser reabertos; passam a utilizar a única configuração atual, `avatar`, ao importar e exportar. A ausência de `derivacaoD01` em JSONs anteriores é aceita como nenhuma derivação; quando uma derivação está presente, ela precisa ter um atributo de sustentação com valor 12+.

**PDF:** utiliza exclusivamente a construção atual Ímpeto A01; os modelos legados continuam sendo aceitos apenas para importar JSONs antigos. A página 1 resume os recursos e o combate; a página 2 detalha atributos, perícias e escolhas; a página 3 (ou mais) apresenta cinco ativas e passiva; a página 4 (ou mais) cobre técnicas de exploração e história. Os textos integrais de descrição, gatilho, limites e história são preservados, enquanto os resumos de consulta rápida podem ser abreviados. **O JSON continua sendo o formato editável para backup e reabertura.**

**Formato do JSON:** arquivo identificado por `formato: "hexatombe-avatar-ficha"`, `versaoFormato: 1` e o objeto `ficha`. O editor valida a estrutura antes de substituir os dados atuais e aceita também o objeto de rascunho v1 sem invólucro. Os campos novos `escalaAvatar`, `atributosImpeto`, `derivacaoD01`, `recursosImpeto`, `arquetipoImpeto`, `talentoArquetipo`, `vantagemUniversal`, `periciasImpeto`, `perfilHabilidades`, `ativasImpeto`, `passivaImpeto` e `exploracaoImpeto` são opcionais para preservar a importação de JSON antigos. O valor legado `abaAtiva: "combate"` é convertido para a aba `atributos`. O limite de importação é 8 MB. A compatibilidade automática com o **Portal do Mestre** depende de integração específica no importador daquela plataforma.

## Organização

- `src/App.tsx`: interface e regras do criador de personagens.
- `src/impeto/habilidades.ts`: cálculos e validações H06/H04.1 de PC, PX e EN.
- `src/impeto/HabilidadesEditor.tsx`: editor de combate e exploração.
- `src/pdf/exportarFichaPdf.ts`: exportação atual para PDF A4 com elementos rituais e paginação dinâmica H06/PX.
- `src/*.css`: estilos, abas e temas visuais.
- `public/`: imagens e recursos estáticos usados pelo aplicativo.

## Próximas melhorias

- [x] Salvamento local automático e recuperação da ficha em edição.
- [x] Exportação/importação de dados da ficha em JSON (aguardando testes manuais).
- [ ] Refinamentos de acessibilidade e experiência em telas menores.
- [ ] Testes adicionais de compatibilidade e impressão dos PDFs.
- [x] Publicação de uma demonstração online na Vercel.

Ferramentas de preparação e gerenciamento de mesa podem ser desenvolvidas futuramente como um módulo separado.

## Sobre o projeto

Este é um **projeto de fãs independente e não oficial**, inspirado em *Avatar* e *Hexatombe*. Não possui afiliação ou endosso dos detentores dessas propriedades. Nomes e referências pertencem a seus respectivos titulares.

Desenvolvido por [Rickmachado05](https://github.com/Rickmachado05) como projeto de estudo, desenvolvimento web e portfólio.

> O código foi publicado para consulta. Nenhuma licença de reutilização foi definida neste repositório até o momento.
