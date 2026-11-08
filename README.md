# Hexatombe: Avatar

**Criador de fichas de personagem para RPG**, desenvolvido com React, TypeScript e Vite. O projeto combina uma interface temática inspirada nos quatro elementos com regras de combate, personalização de técnicas e exportação de fichas em PDF.

> **Status:** beta — versão inicial do criador de personagens. Algumas regras são propostas de *playtest* e podem ser ajustadas pelo mestre.

## Funcionalidades

- **Identidade:** nome, elemento, classe, retrato e história do personagem.
- **Cinco identidades elementais:** Água, Terra, Fogo, Ar e Não Dobrador, com temas visuais próprios.
- **Classes:** Lutador, Linha de Frente e Conjurador.
- **Combate:** atributos por classe, ataque básico, pontos de vida, recurso de técnicas (Mana/Foco), CA e regeneração.
- **Técnicas:** cinco habilidades ativas personalizáveis a partir de modelos com custos, efeitos e limitações mecânicas.
- **Passiva:** personalização narrativa com modelos de ativação e efeito.
- **Prévia:** consulta da ficha montada antes da exportação.
- **PDF dinâmico:** geração no navegador, em formato A4, com aparência de pergaminho, identidade visual do elemento e páginas adicionais para textos extensos.

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
3. Consulte os atributos na aba **Combate**.
4. Personalize as cinco técnicas e a habilidade passiva.
5. Revise o resultado em **Prévia**.
6. Clique em **Gerar ficha em PDF** para exportar o pergaminho.

**Atenção:** nesta versão, o editor ainda não salva automaticamente os personagens. Exporte o PDF antes de fechar ou atualizar a página. O PDF serve para consulta e impressão; ainda não é um arquivo de importação de volta para o editor.

## Organização

- `src/App.tsx`: interface e regras do criador de personagens.
- `src/pdf/exportarFichaPdf.ts`: lógica de exportação da ficha para PDF.
- `src/*.css`: estilos, abas e temas visuais.
- `public/`: imagens e recursos estáticos usados pelo aplicativo.

## Próximas melhorias

- [ ] Salvamento local e recuperação da ficha em edição.
- [ ] Exportação/importação de dados da ficha em JSON.
- [ ] Refinamentos de acessibilidade e experiência em telas menores.
- [ ] Testes adicionais de compatibilidade e impressão dos PDFs.
- [ ] Publicação de uma demonstração online.

Ferramentas de preparação e gerenciamento de mesa podem ser desenvolvidas futuramente como um módulo separado.

## Sobre o projeto

Este é um **projeto de fãs independente e não oficial**, inspirado em *Avatar* e *Hexatombe*. Não possui afiliação ou endosso dos detentores dessas propriedades. Nomes e referências pertencem a seus respectivos titulares.

Desenvolvido por [Rickmachado05](https://github.com/Rickmachado05) como projeto de estudo, desenvolvimento web e portfólio.

> O código foi publicado para consulta. Nenhuma licença de reutilização foi definida neste repositório até o momento.
