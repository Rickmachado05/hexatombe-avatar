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
- **Ímpeto 1.0 (migração incremental):** editor dividido em Identidade, Arquétipo, Atributos, Perícias, Habilidades, Exploração e Prévia. Oito atributos universais com base 8, teto 14 e 28 PA provisórios, ainda em calibração para a campanha. Quatro arquétipos T02 com três talentos cada, separados das habilidades e da passiva. As 16 perícias universais são agrupadas em Físicas, Exploração, Conhecimento e Sociais, com 4 PT provisórios (Treinado +2 por 1 PT, Especialista +4 por 2 PT totais). **Pontos de Recursos (PR):** painel experimental com 20 PR provisórios para investir em HP, Energia, CA Base, Ataque Base e regeneração, com custos progressivos e conferência do saldo. Tudo é salvo no navegador e no JSON. Os valores antigos fixos de combate já foram removidos do editor; o novo construtor de habilidades e exploração substitui os modelos anteriores na interface. O PDF ainda aguarda migração.
- **Configuração de habilidades exclusiva de Avatar:** 100 PC compartilhados e 35 PX de exploração conforme o piloto experimental Hexatombe: Avatar. Não há seletor de outro perfil; o teto individual de técnicas de exploração ainda é conservador e experimental.
- **Habilidades de combate (H06):** cinco técnicas ativas com construção e custos de PC automáticos para dano, cura, escudo, mitigação, controle e bônus de CA; modificadores de alvos, ativação, duração e alcance, com limites e custo de Energia (EN).
- **Passiva (H04.1):** uma habilidade automática de combate com gatilho, benefício, frequência limitada e custo próprio de PC.
- **Técnicas de exploração (H06):** até três técnicas adicionais, compradas com PX independentes de PC, com classes de potência, escopo, duração, repetição e custo de EN.
- **Prévia:** consulta da ficha montada antes da exportação.
- **PDF dinâmico:** geração no navegador, em formato A4, com aparência de pergaminho, identidade visual do elemento e páginas adicionais para textos extensos.
- **JSON editável:** exporte a ficha completa (incluindo elemento, retrato, cinco técnicas e passiva) e importe-a novamente no editor, em outro navegador ou dispositivo.

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
4. Na aba **Atributos**, distribua os 28 PA provisórios entre os oito atributos, escolha uma derivação D01 se houver atributo 12+ e depois distribua **20 PR provisórios** entre HP, Energia, CA Base, Ataque Base e regeneração. O cálculo de HP, EN e dano básico soma automaticamente a derivação escolhida. A escala avançada de Avatar ainda será calibrada.
5. Na aba **Perícias**, distribua 4 PT de referência: Não treinado (+0), Treinado (+2) ou Especialista (+4).
6. Na aba **Habilidades**, construa as cinco técnicas ativas e uma passiva. Elas compartilham o orçamento fixo da campanha: **100 PC de Avatar** (experimental).
7. Na aba **Exploração**, crie até três técnicas independentes, usando os **35 PX de Avatar** (experimental).
8. Revise o resultado em **Prévia**.
9. Clique em **Exportar JSON** para salvar a ficha completa atualizada. **Gerar ficha em PDF** ainda utiliza o layout e as habilidades anteriores e pede confirmação; a reformulação do PDF será feita depois.
10. Para recuperar uma ficha, clique em **Importar ficha JSON** na página inicial (ou **Importar JSON** no editor) e escolha o arquivo exportado. A importação substitui o rascunho atual após confirmação.

**Salvamento de rascunho:** o editor salva automaticamente a ficha em edição no armazenamento local deste navegador, incluindo retrato, técnicas e passiva. Ao reabrir o site no mesmo navegador, é possível continuar a edição. Isso não é backup em nuvem: limpar os dados do navegador pode apagar o rascunho. **Exporte JSON para manter um arquivo editável independente**; o PDF serve para consulta e impressão, não para reimportação.

**Compatibilidade:** fichas antigas podem conter a propriedade `classe` (Lutador, Linha de Frente ou Conjurador). Ela é aceita para leitura mas ignorada pelo criador atual, que não a exporta mais. JSONs que continham `perfilHabilidades: "introducao"` podem ser reabertos; passam a utilizar a única configuração atual, `avatar`, ao importar e exportar. A ausência de `derivacaoD01` em JSONs anteriores é aceita como nenhuma derivação; quando uma derivação está presente, ela precisa ter um atributo de sustentação com valor 12+.

**PDF:** ainda usa o layout e os modelos de habilidades antigos. Os dados de HP, Energia, CA, regeneração e dano básico enviados para exportação já vêm dos PR e da derivação D01, mas o documento ainda não traz os oito atributos, perícias, talentos T02, habilidades H06 ou técnicas PX. O editor mostra um aviso antes de gerar esse PDF. **O JSON é a fonte fiel da ficha durante a migração.**

**Formato do JSON:** arquivo identificado por `formato: "hexatombe-avatar-ficha"`, `versaoFormato: 1` e o objeto `ficha`. O editor valida a estrutura antes de substituir os dados atuais e aceita também o objeto de rascunho v1 sem invólucro. Os campos novos `atributosImpeto`, `derivacaoD01`, `recursosImpeto`, `arquetipoImpeto`, `talentoArquetipo`, `vantagemUniversal`, `periciasImpeto`, `perfilHabilidades`, `ativasImpeto`, `passivaImpeto` e `exploracaoImpeto` são opcionais para preservar a importação de JSON antigos. O valor legado `abaAtiva: "combate"` é convertido para a aba `atributos`. O limite de importação é 8 MB. A compatibilidade automática com o **Portal do Mestre** depende de integração específica no importador daquela plataforma.

## Organização

- `src/App.tsx`: interface e regras do criador de personagens.
- `src/impeto/habilidades.ts`: cálculos e validações H06/H04.1 de PC, PX e EN.
- `src/impeto/HabilidadesEditor.tsx`: editor de combate e exploração.
- `src/pdf/exportarFichaPdf.ts`: exportação legada para PDF (aguarda atualização).
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
