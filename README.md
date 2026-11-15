# Hexatombe: Avatar

**Criador de fichas de personagem para RPG**, desenvolvido com React, TypeScript e Vite. O projeto combina uma interface temática inspirada nos quatro elementos com regras de combate, personalização de técnicas e exportação de fichas em PDF.

> **Status:** beta pública — versão inicial do criador de personagens, publicada na Vercel e em testes com jogadores. Algumas regras são propostas de *playtest* e podem ser ajustadas pelo mestre.

### 🌐 Experimente o aplicativo

**[Abrir Hexatombe: Avatar — versão online](https://hexatombe-avatar.vercel.app/)**

Sem instalação: crie seu personagem no navegador, exporte o pergaminho em PDF ou salve a ficha editável em JSON. O código-fonte está disponível neste repositório.

## Funcionalidades

- **Identidade:** nome, elemento, classe, retrato e história do personagem.
- **Cinco identidades elementais:** Água, Terra, Fogo, Ar e Não Dobrador, com temas visuais próprios.
- **Classes:** Lutador, Linha de Frente e Conjurador.
- **Combate:** atributos por classe, ataque básico, pontos de vida, recurso de técnicas (Mana/Foco), CA e regeneração (estrutura anterior em processo de adaptação).
- **Ímpeto 1.0 (migração incremental):** editor dividido em Identidade, Arquétipo, Atributos, Perícias, Habilidades e Prévia. Oito atributos universais com base 8, teto 14 e 28 PA de referência. Quatro arquétipos T02 com três talentos cada, separados das habilidades e da passiva. As 16 perícias universais são agrupadas em Físicas, Exploração, Conhecimento e Sociais, com 4 PT de referência (Treinado +2 por 1 PT, Especialista +4 por 2 PT totais). Tudo é salvo no navegador e no JSON. Os valores antigos de combate e o PDF ainda não foram migrados.
- **Técnicas:** cinco habilidades ativas personalizáveis a partir de modelos com custos, efeitos e limitações mecânicas.
- **Passiva:** personalização narrativa com modelos de ativação e efeito.
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
2. Preencha a identidade, selecione a classe e adicione um retrato, se desejar.
3. Na aba **Arquétipo**, escolha um dos quatro arquétipos do Ímpeto e um de seus três talentos T02.
4. Na aba **Atributos**, distribua os 28 PA de referência entre os oito atributos. O cálculo de HP/Energia/CA ainda segue o modelo anterior durante a migração.
5. Na aba **Perícias**, distribua 4 PT de referência: Não treinado (+0), Treinado (+2) ou Especialista (+4).
6. Na aba **Habilidades**, personalize as cinco técnicas e a habilidade passiva.
7. Revise o resultado em **Prévia**.
8. Clique em **Gerar ficha em PDF** para exportar o pergaminho ou em **Exportar JSON** para salvar uma cópia editável.
9. Para recuperar uma ficha, clique em **Importar ficha JSON** na página inicial (ou **Importar JSON** no editor) e escolha o arquivo exportado. A importação substitui o rascunho atual após confirmação.

**Salvamento de rascunho:** o editor salva automaticamente a ficha em edição no armazenamento local deste navegador, incluindo retrato, técnicas e passiva. Ao reabrir o site no mesmo navegador, é possível continuar a edição. Isso não é backup em nuvem: limpar os dados do navegador pode apagar o rascunho. **Exporte JSON para manter um arquivo editável independente**; o PDF serve para consulta e impressão, não para reimportação.

**Formato do JSON:** arquivo identificado por `formato: "hexatombe-avatar-ficha"`, `versaoFormato: 1` e o objeto `ficha`. O editor valida a estrutura antes de substituir os dados atuais e aceita também o objeto de rascunho v1 sem invólucro. Os campos novos `atributosImpeto`, `arquetipoImpeto`, `talentoArquetipo` e `periciasImpeto` são opcionais para preservar a importação de JSON antigos. O valor legado `abaAtiva: "combate"` é convertido para a aba `atributos`. O limite de importação é 8 MB. A compatibilidade automática com o **Portal do Mestre** depende de integração específica no importador daquela plataforma.

## Organização

- `src/App.tsx`: interface e regras do criador de personagens.
- `src/pdf/exportarFichaPdf.ts`: lógica de exportação da ficha para PDF.
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
