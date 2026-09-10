# FuelCount

Documentação do código JavaScript do aplicativo de orçamento financeiro. O diretório `js` usa módulos ES nativos e separa estado, regras de negócio, persistência, domínio e interface.

## Organização

- `app.js`: inicialização, eventos globais e atualização da interface.
- `estado.js`: estado compartilhado e normalização dos dados.
- `calculos.js`: funções puras de cálculo financeiro.
- `persistencia.js`: leitura e gravação no `localStorage`.
- `modules/`: funcionalidades de domínio e componentes interativos.
- `ui/`: referências aos elementos HTML e utilitários de interface.

## Fluxo principal

1. `app.js` carrega o tema e os dados persistidos.
2. Os módulos leem e mutam o objeto compartilhado exportado por `estado.js`.
3. Após ações que alteram dados, `app.js` chama `atualizarInterface()`.
4. Cada módulo renderiza sua própria área; `calculos.js` concentra as regras sem acesso ao DOM.
5. O fechamento do mês grava o histórico e retém apenas gastos e ganhos recorrentes.

## Documentação original dos arquivos

Os comentários abaixo foram retirados dos arquivos JavaScript e preservados aqui integralmente.

### `js/app.js`

```js
/**
 * app.js — orquestrador do FuelCount. Único arquivo que:
 *  1) sabe a ordem de inicialização do app;
 *  2) liga cada formulário/botão à função certa;
 *  3) decide QUANDO redesenhar a tela inteira (atualizarInterface).
 *
 * Os módulos de domínio (gastos, ganhos, poupança...) não chamam
 * atualizarInterface() sozinhos — isso é o que evita as dependências
 * circulares explicadas nos comentários de gastos.js/backup.js.
 */
/** Redesenha tudo que depende do estado atual. Chamada após qualquer ação que muda dados. */
// Só resincroniza o campo se ele não estiver em foco (evita apagar o
// "." ou a "," que o usuário está digitando — ver detalhe no commit
// original do bug em atualizarInterface()).
/** Fecha o mês: salva o histórico e aplica a retenção de Fixos/Parcelados (regras puras em calculos.js). */
// Na primeira visita, o alerta "🔥 0 dias" apareceria antes mesmo da
// pessoa ver o Bem-vindo — soa estranho pra quem acabou de chegar.
// adicionarGasto()/adicionarGanho() retornam false se a validação falhar
// — nesse caso não redesenhamos a tela nem soamos como se tivesse dado certo.
// Ver comentário completo no HTML/módulo original: não usamos `required`
// nativo em parcelasGasto porque ele fica oculto quando o tipo não é
// "parcelado", e o navegador não valida campo invisível.
```

### `js/calculos.js`

```js
/**
 * calculos.js — funções puras de cálculo financeiro do FuelCount.
 *
 * "Puras" aqui significa: nenhuma função neste arquivo toca no DOM, no
 * localStorage ou em variáveis globais. Tudo que cada função precisa entra
 * por parâmetro, e tudo que ela produz sai pelo retorno. Isso é o que torna
 * possível testar cada uma isoladamente (veja calculos.test.js) e também o
 * que possibilita reaproveitar essa lógica fora do navegador, se um dia
 * fizer sentido (ex: um script de relatório rodando em Node).
 */
/**
 * Movimento líquido de poupança (depósitos menos retiradas) dentro de um
 * mês/ano específico. Função genérica usada tanto pelo mês atual quanto
 * por qualquer mês já fechado no histórico.
 */
/**
 * Movimento líquido de poupança dentro do mês/ano atual (depósitos menos
 * retiradas). Usado só para calcular o "Saldo Livre" — de propósito NÃO
 * usa o saldo total acumulado, porque "Guardado" nunca zera ao Fechar o
 * Mês, enquanto "Saldo Restante" é sempre relativo ao mês corrente. Somar
 * o total histórico deixaria o Saldo Livre cada vez mais negativo com o
 * passar dos meses, mesmo sem nenhum gasto novo.
 */
/** Converte "8/2026" em { mesIndex: 7, ano: 2026, ordem: 24319 } (ordem serve pra ordenar cronologicamente). */
/**
 * Calcula o valor "guardado ajustado" de um mês: o quanto foi guardado,
 * penalizado quando o Saldo Livre daquele mês ficou negativo. A ideia é
 * que guardar dinheiro enquanto se está no vermelho não deveria contar
 * como progresso real de educação financeira — o gráfico precisa refletir
 * isso, não só mostrar "quanto foi depositado".
 */
// Só penaliza quando o saldo livre é negativo; do contrário o valor
// ajustado é igual ao valor bruto guardado naquele mês.
/**
 * Calcula a variação percentual entre o valor atual e o valor anterior.
 * Regra de negócio: se não houver valor anterior para comparar (undefined,
 * null ou 0 — divisão por zero não faz sentido aqui), retorna null.
 * @returns {number|null} variação em pontos percentuais, ou null se não houver base de comparação
 */
/**
 * Regra pura de retenção de Gastos usada ao Fechar o Mês: Pontuais somem,
 * Fixos continuam do jeito que estão, Parcelados perdem uma parcela e
 * somem quando o contador chega a zero.
 */
// Se chegou a 0, a parcela foi paga por completo e não volta pro próximo mês
// tipo === 'pontual' (ou ausente, por retrocompatibilidade): não retorna
/**
 * Regra pura de retenção de Ganhos usada ao Fechar o Mês: Pontuais somem,
 * Fixos (ex: um freela recorrente) continuam.
 */
/**
 * Atualiza o streak (mutando o objeto recebido): soma 1 se a última
 * atividade foi ontem, reinicia pra 1 se foi antes disso, não faz nada se
 * já tiver contado hoje. Aceita `dataReferencia` pra ser testável sem
 * depender do relógio real do sistema.
 */
/**
 * Determina se o streak ainda está "vivo" (última atividade foi hoje ou
 * ontem) e quantos dias mostrar. Streak quebrado exibe 0, mesmo que o
 * valor salvo em `streak.dias` seja maior — o dado só é "resetado de
 * verdade" na próxima vez que o usuário registrar uma atividade
 * (registrarAtividadeStreak), mas pra fins de exibição já tratamos como zero.
 */
/**
 * Escolhe a frase do banner emocional com base no contexto financeiro
 * atual. Prioridade: boas-vindas (app vazio) > queda de gastos > dinheiro
 * guardado no mês > alta de gastos > estável > genérica.
 */
```

### `js/estado.js`

```js
/**
 * estado.js — a única fonte de verdade do FuelCount.
 *
 * `estado` é um objeto mutável exportado por referência: todo módulo que
 * importar `estado` daqui enxerga sempre a versão mais atual, porque
 * ninguém tem uma cópia — todos apontam pro mesmo objeto na memória.
 *
 * Isso é diferente de exportar uma função `getEstado()`: com objeto
 * mutável, `estado.gastos.push(x)` em qualquer módulo já reflete em todos
 * os outros sem precisar de nenhum mecanismo de sincronização.
 */
// [{ id, descricao, categoria, valor, tipo: 'pontual'|'fixo' }]
// { 'Categoria': valorLimiteMensal }
// [{ id, tipo: 'deposito'|'retirada', valor, descricao, data }]
// ultimaData: 'YYYY-MM-DD'
/**
 * Substitui o estado inteiro por um novo objeto (usado por carregarDados()
 * e importarBackup(), que precisam trocar tudo de uma vez, não só um campo).
 * Só existe porque `export let` não permite reatribuição de fora do módulo
 * — só o próprio módulo pode fazer `estado = novoValor`.
 */
/**
 * Estado inicial "vazio" — usado tanto como ponto de partida de um app novo
 * quanto como fallback de segurança quando os dados salvos estão corrompidos.
 */
/**
 * Recebe um objeto qualquer (vindo do localStorage ou de um arquivo de
 * backup importado) e devolve um estado válido, preenchendo com valores
 * padrão qualquer campo ausente ou de tipo errado. Extraída aqui porque
 * carregarDados() e importarBackup() precisavam exatamente da mesma
 * validação — antes essa lógica estava copiada e colada nos dois lugares.
 */
```

### `js/persistencia.js`

```js
/**
 * persistencia.js — salvar e carregar o estado do localStorage.
 *
 * Isolado num módulo próprio porque é o único lugar do app que sabe que a
 * "gaveta" de armazenamento é o localStorage. Se um dia isso mudar (ex:
 * IndexedDB, ou sync com um backend), só este arquivo muda — nenhum outro
 * módulo faz `localStorage.getItem` diretamente.
 */
```

### `js/modules/backup.js`

```js
/**
 * modules/backup.js — exportar/importar backup em JSON, e exportar o
 * extrato em CSV.
 *
 * importarBackup() é assíncrono (usa FileReader) e devolve uma Promise
 * que resolve `true`/`false`. Por quê: se essa função chamasse
 * atualizarInterface() diretamente ao terminar, precisaria importar de
 * app.js — e app.js precisa importar backup.js pra ligar o botão. Mesma
 * dependência circular que resolvemos em gastos.js/ganhos.js, só que
 * aqui com um Promise no lugar de um retorno síncrono, porque o resultado
 * só existe depois que o arquivo termina de ser lido.
 */
// Some sozinho depois de alguns segundos, sem precisar de clique
/**
 * @returns {Promise<boolean>} true se o backup foi restaurado com sucesso
 *   (quem chamar deve redesenhar a tela nesse caso); false se falhou ou
 *   se o usuário cancelou a confirmação.
 */
// Validação básica da estrutura antes de sobrescrever os dados atuais
// (isso é diferente de normalizarEstado: aqui a intenção é rejeitar
// um JSON qualquer ANTES de incomodar o usuário com a confirmação —
// normalizarEstado só entra depois, pra preencher o que faltar)
// permite selecionar o mesmo arquivo de novo, se precisar
// Escapa campos que contenham vírgula, aspas ou quebra de linha, seguindo o padrão CSV
// BOM (\uFEFF) garante acentuação correta ao abrir no Excel
```

### `js/modules/carrossel.js`

```js
/**
 * modules/carrossel.js — a navegação entre os 3 slides de gráficos
 * (setas, dots, swipe no mobile). A troca visual em si é feita com
 * display:none/block (não transform), de propósito — veja o comentário
 * dentro de irParaSlide() para o porquê.
 */
// Suporte a swipe (arrastar o dedo) no mobile
// navegação circular
// Requisito: o botão de minimizar não deve existir para a Evolução
// Histórica. Como Pizza e Histórico dividem o mesmo card (carrossel),
// a seta é escondida somente enquanto o slide de Histórico está ativo,
// e volta a aparecer normalmente no slide de Distribuição.
// Passo crucial: o Chart.js não mede canvas com display:none. Ao tornar
// o slide visível de novo, é preciso forçar o recálculo do tamanho —
// essa é a causa-raiz do bug de gráfico "quebrado" no carrossel antigo.
```

### `js/modules/categorias.js`

```js
/**
 * categorias.js — cores e ícones por categoria, compartilhados entre
 * vários domínios (Gastos, Ganhos, Gráficos, Modal de Detalhamento).
 *
 * Existe como módulo próprio porque, sem ele, cada um desses domínios
 * precisaria manter sua própria cópia do mapa de cores — e é exatamente
 * esse tipo de duplicação que causa bug de "mudei a cor aqui mas esqueci
 * de mudar ali".
 */
// Paleta alinhada à identidade visual: verde petróleo, âmbar e tons neutros elegantes
// Verde petróleo (cor de marca)
// Verde esmeralda
// Azul petróleo claro
// Âmbar (accent)
// Rosa-vermelho (mesma família do "danger")
// Magenta suave
// Verde oliva
// Verde petróleo escuro
// Roxo acinzentado, elegante e discreto
// Cinza neutro
```

### `js/modules/ganhos.js`

```js
/**
 * modules/ganhos.js — tudo que é específico do domínio "Ganho" (renda
 * extra: freelance, vendas, cashback etc). Espelha modules/gastos.js na
 * estrutura, mas é mais simples porque Ganhos não têm o conceito de
 * "parcelado" — só Pontual ou Fixo.
 */
/**
 * Valida os campos do formulário e adiciona um ganho ao estado.
 * @returns {boolean} true se adicionou com sucesso, false se a validação falhou.
 */
// 'pontual' | 'fixo'
```

### `js/modules/gastos.js`

```js
/**
 * modules/gastos.js — tudo que é específico do domínio "Gasto":
 * adicionar, remover, renderizar o extrato, e a regra de retenção usada
 * ao Fechar o Mês.
 *
 * Nota de arquitetura: adicionarGasto()/removerGasto() NÃO chamam
 * atualizarInterface() — só mutam o estado e retornam true/false. Quem
 * decide redesenhar a tela é o app.js. Se essas funções chamassem
 * atualizarInterface() diretamente, este arquivo precisaria importar de
 * app.js, e app.js precisa importar deste arquivo pra ligar os
 * formulários — uma dependência circular. Devolvendo um booleano, o
 * app.js decide o que fazer depois, sem esse problema.
 */
/**
 * Valida os campos do formulário e adiciona um gasto ao estado.
 * @returns {boolean} true se adicionou com sucesso, false se a validação falhou
 *   (nesse caso, quem chamou não deve redesenhar a tela nem resetar o formulário).
 */
// 'pontual' | 'fixo' | 'parcelado'
// Gastos parcelados carregam quantas parcelas ainda restam (incluindo a atual).
// Esse contador é decrementado a cada "Fechar Mês" até chegar a zero.
/**
 * Remove um gasto e, se o Modal de Detalhamento estiver aberto justamente
 * na categoria desse gasto, atualiza ou fecha o modal conforme sobrarem
 * ou não outros gastos na mesma categoria.
 */
// Selo visual ao lado da descrição: indica gastos Fixos ou Parcelados
// (gastos Pontuais não recebem selo, pois são o comportamento padrão)
```

### `js/modules/graficos.js`

```js
/**
 * modules/graficos.js — os três gráficos principais do carrossel:
 * Distribuição por Categoria (doughnut), Evolução Histórica (barras) e
 * Evolução do Guardado (linhas). Também guarda as instâncias do Chart.js
 * (só este módulo sabe que elas existem — quem precisa mexer nelas usa
 * as funções exportadas, nunca a variável direto).
 */
// Plugin simples para desenhar o total gasto no centro do doughnut
// (indicador compacto — evita depender só da legenda pra ver o total)
// legenda customizada em HTML abaixo do gráfico
// Clique numa fatia abre o detalhamento da categoria
// Constrói a legenda em grid (HTML), clicável para abrir o detalhamento da categoria
// Cor via CSSOM (não via atributo style="" inline), assim o CSP pode
// bloquear estilo inline no geral sem precisar abrir exceção pra isso.
// h.rendaTotal é o campo novo (salário + ganhos extras); h.salario cobre
// meses fechados antes dessa mudança, que só guardavam o salário puro.
/**
 * Gráfico de linhas: quanto foi guardado por mês (linha cheia) vs. o
 * valor ajustado (linha tracejada), que é penalizado nos meses em que o
 * Saldo Livre p/ Gastar ficou negativo. A ideia é dar um retrato visual
 * de "estou realmente evoluindo financeiramente, ou só empurrando o
 * problema pra depois?" — guardar dinheiro estando no vermelho não deveria
 * parecer progresso.
 */
// Meses já fechados no histórico, ordenados cronologicamente
// Acrescenta o mês corrente (ainda não fechado) como último ponto,
// usando os totais ao vivo — mesma lógica usada no card de Resumo
/**
 * Redimensiona só o gráfico do slide indicado. O Chart.js não mede
 * canvas com display:none, então sempre que um slide (ou a seção
 * colapsável que o contém) volta a ficar visível, é preciso forçar esse
 * recálculo — daí esta função ser compartilhada entre carrossel.js
 * (troca de slide) e menu.js (reabrir uma seção colapsada).
 */
/** Usado por tema.js: destrói as 3 instâncias pra forçar recriação com as cores do novo tema. */
```

### `js/modules/limites.js`

```js
/**
 * modules/limites.js — teto de gasto por categoria: definir, remover e
 * renderizar a lista com destaque visual quando o gasto se aproxima ou
 * ultrapassa o limite.
 */
// Atualiza o modal se estiver aberto na mesma categoria
```

### `js/modules/menu.js`

```js
/**
 * modules/menu.js — a gaveta lateral (menu hambúrguer) e o comportamento
 * de recolher/expandir seções (⌄).
 */
// Ao reabrir a seção do carrossel, o Chart.js precisa recalcular o
// tamanho do canvas visível (mesma lógica usada na troca de slides
// em carrossel.js — daí compartilharem redimensionarGraficoDoSlide).
```

### `js/modules/modal.js`

```js
/**
 * modules/modal.js — o Modal de Detalhamento por Categoria: abre ao clicar
 * numa fatia do gráfico de pizza (ou na legenda), mostra o total, a barra
 * de progresso do limite (se houver) e um gráfico de barras com cada
 * gasto daquela categoria.
 *
 * `categoriaAtualModal` fica só neste módulo (não é exportado como
 * variável direta) — quem precisa saber "qual categoria está aberta agora"
 * usa obterCategoriaAtualModal(), um getter. Isso deixa explícito que é
 * leitura, e evita qualquer módulo de fora tentar reatribuir o valor por
 * engano (o que quebraria o controle do próprio modal.js sobre seu estado).
 */
// Barra de progresso do limite (se houver limite definido para a categoria)
// Cores: verde até 70%, amarelo até 100%, vermelho acima de 100%
// Lista de itens da categoria
// Importante: o overlay precisa ficar visível ANTES de criar o gráfico.
// Criar um gráfico do Chart.js num canvas ainda com display:none faz o
// cálculo de tamanho vir como 0x0 (mesma causa-raiz do bug no carrossel).
/** Usado por tema.js ao trocar de tema: destrói a instância pra forçar recriação com as cores certas. */
/** Usado por tema.js: se o modal estiver aberto no momento da troca de tema, recria o gráfico dele também. */
```

### `js/modules/onboarding.js`

```js
/**
 * modules/onboarding.js — banner de boas-vindas pra quem abre o app pela
 * primeira vez, com um jeito de rever depois ("Como usar" no menu).
 *
 * A preferência "já vi isso" fica numa chave própria do localStorage
 * (fuelcount_onboarding_visto), separada do `estado` financeiro — assim
 * ela nunca entra num backup exportado (não faz sentido "restaurar" se
 * alguém já viu ou não uma tela de boas-vindas) e não precisa de
 * validação/normalização como os dados financeiros precisam.
 */
// Um card por função do app. Tom sempre de convite ("se quiser") — o tour
// é só apresentação, ninguém precisa preencher nada pra passar pro próximo.
/** Chamada uma vez, ao iniciar o app. @returns {boolean} true se era a primeira visita (banner mostrado). */
// ---- Tour guiado ----
// Reabre a qualquer momento, mesmo pra quem já marcou como visto —
// é a "porta de volta" que evita a decisão "não mostrar mais" ser irreversível.
```

### `js/modules/poupanca.js`

```js
/**
 * modules/poupanca.js — o "cofrinho" manual do FuelCount: registrar
 * depósitos/retiradas, calcular o Saldo Livre p/ Gastar, e renderizar a
 * lista de movimentos.
 *
 * Nota: renderizarPoupanca() chama renderizarGraficoGuardado() (de
 * graficos.js) porque o gráfico de Evolução do Guardado precisa se
 * atualizar toda vez que um movimento é registrado/removido.
 */
```

### `js/modules/streak.js`

```js
/**
 * modules/streak.js — a parte de UI do streak e do banner emocional
 * (o cálculo em si mora em calculos.js, testável; aqui só o que toca
 * DOM e o `alert()` nativo).
 */
/**
 * Alerta exibido uma única vez ao abrir o app, mostrando a sequência
 * mesmo quando está zerada (diferente do badge no banner, que some
 * quando não há sequência ativa, pra não soar como cobrança).
 */
```

### `js/modules/tema.js`

```js
/**
 * modules/tema.js — alternar e persistir o tema claro/escuro.
 *
 * corTextoGrafico()/corGradeGrafico() NÃO moram aqui — ficam em
 * ui/utils.js, de propósito. Veja o comentário lá pra explicação
 * completa, mas em resumo: se estivessem aqui, graficos.js precisaria
 * importar de tema.js e tema.js precisaria importar de graficos.js pra
 * recriar os gráficos — uma dependência circular.
 */
/** Destrói e recria todos os gráficos (principais + modal, se aberto) com as cores do novo tema. */
```

### `js/ui/dom.js`

```js
/**
 * dom.js — único lugar do app que sabe os IDs/seletores do HTML.
 *
 * Toda referência a elemento da tela passa por aqui. Se um ID mudar no
 * index.html, o ajuste é numa linha só deste arquivo — nenhum outro módulo
 * precisa saber ou ser tocado.
 *
 * Importante: como esses `document.getElementById` rodam assim que este
 * módulo é importado, o `<script type="module">` no HTML precisa estar
 * depois do `<body>` (ou o app.js precisa esperar o DOM existir) — módulos
 * já se comportam como `defer` por padrão, então isso funciona colocando
 * a tag de script no fim do <body>, como já é o caso no index.html atual.
 */
// Formulário: Adicionar Gasto
// Formulário: Adicionar Ganho
// Configuração do Mês
// Resumo Financeiro
// Extratos
// Limites por Categoria
// Poupança / Guardado
// Banner Emocional (frase + streak)
// Botão de Fechar Mês
// Tema Claro/Escuro
// Menu Hambúrguer
// Onboarding: Boas-vindas
// Onboarding: Tour guiado (um card por função)
// Exportar / Backup
// Carrossel de Gráficos
// Canvas dos Gráficos (Chart.js)
// Modal de Detalhamento por Categoria
```

### `js/ui/utils.js`

```js
/**
 * ui/utils.js — pequenos utilitários compartilhados que tocam o DOM, mas
 * não pertencem a nenhum domínio específico (gastos, ganhos, poupança...).
 *
 * corTextoGrafico()/corGradeGrafico() moraram aqui de propósito, e não em
 * tema.js: graficos.js precisa delas pra saber a cor certa ao desenhar, e
 * tema.js precisa poder recriar os gráficos ao trocar de tema. Se essas
 * duas funções estivessem em tema.js, graficos.js importaria de tema.js
 * E tema.js importaria de graficos.js — uma dependência circular, que ES
 * Modules não resolve de forma segura. Ficando num módulo neutro, os dois
 * lados importam de utils.js sem nenhum dos dois depender do outro.
 */
/** Escapa HTML para evitar XSS ao inserir texto do usuário via innerHTML. */
```

## Execução

Abra `index.html` em um navegador compatível com módulos ES. O aplicativo usa `Chart.js` carregado pela página e persiste os dados localmente no navegador.
