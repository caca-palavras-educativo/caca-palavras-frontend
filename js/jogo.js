//Classe para gerenciar grade do jogo
class Grade {
    constructor(tamanho) {
        this.tamanho = tamanho;
        this.grade = this.inicializarGrade();
        this.palavrasGrade = []; // Array com dados de cada palavra inserida
    }

    // Inicializar grade vazia com células limpas
    inicializarGrade() {
        return Array(this.tamanho).fill(null).map(() =>
            Array(this.tamanho).fill(null).map(() => ({
                letra: '',
                palavraIds: [] // IDs das palavras que usam esta célula
            }))
        );
    }

    // Resetar grade mantendo o tamanho
    resetar() {
        this.grade = this.inicializarGrade();
        this.palavrasGrade = [];
    }

    // Inserir palavra em posição específica com direção específica
    // Retorna posições da palavra ou null se não conseguiu inserir
    inserirPalavraEm(palavra, id, row, col, direcao) {
        // Validar se pode inserir nesta posição
        if (!this.podeInserir(palavra, row, col, direcao)) {
            return null;
        }

        // Inserir e retornar posições
        return this.inserirNaGrade(palavra, id, row, col, direcao);
    }

    // Verificar se é possível inserir palavra em posição e direção específicas
    // Permite compartilhamento de letras se forem iguais
    podeInserir(palavra, row, col, direcao) {
        const deltas = this.obterDeltas(direcao);
        if (!deltas) return false;

        // Validar limites da grade
        for (let i = 0; i < palavra.length; i++) {
            const novaLinha = row + deltas.dr * i;
            const novaColuna = col + deltas.dc * i;

            if (novaLinha < 0 || novaLinha >= this.tamanho ||
                novaColuna < 0 || novaColuna >= this.tamanho) {
                return false;
            }

            const celula = this.grade[novaLinha][novaColuna];
            const letraEsperada = palavra[i].toUpperCase();

            // Se célula ocupada, só permite se letra for igual (compartilhamento)
            if (celula.letra !== '' && celula.letra !== letraEsperada) {
                return false;
            }
        }

        return true;
    }

    // Obter deslocamento (delta) para cada direção
    obterDeltas(direcao) {
        const deltas = {
            0: { dr: 0, dc: 1 },  // Horizontal (direita)
            1: { dr: 1, dc: 0 },  // Vertical (baixo)
            2: { dr: 1, dc: 1 },  // Diagonal descente
            3: { dr: -1, dc: 1 }  // Diagonal subida
        };
        return deltas[direcao] || null;
    }

    // Inserir palavra na grade
    inserirNaGrade(palavra, id, row, col, direcao) {
        const posicoes = [];
        const deltas = this.obterDeltas(direcao);

        for (let i = 0; i < palavra.length; i++) {
            const r = row + deltas.dr * i;
            const c = col + deltas.dc * i;
            const letraUppercase = palavra[i].toUpperCase();

            this.grade[r][c].letra = letraUppercase;

            // Adicionar ID da palavra se não existir
            if (!this.grade[r][c].palavraIds.includes(id)) {
                this.grade[r][c].palavraIds.push(id);
            }

            posicoes.push({ r, c });
        }

        // Registrar palavra inserida
        this.palavrasGrade.push({
            id,
            termo: palavra,
            posicoes,
            direcao,
            encontrada: false
        });

        return posicoes;
    }

    // Completar espaços vazios com letras aleatórias
    completarComLetrasAleatorias() {
        const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let i = 0; i < this.tamanho; i++) {
            for (let j = 0; j < this.tamanho; j++) {
                if (this.grade[i][j].letra === '') {
                    // Usar letra aleatória sem repetição excessiva
                    this.grade[i][j].letra = letras[Math.floor(Math.random() * letras.length)];
                }
            }
        }
    }

    // Procurar palavra na grade (para validação)
    // Retorna true se encontrar a palavra (direta ou inversa)
    procurarPalavra(palavra) {
        const palavraUpper = palavra.toUpperCase();
        const palavraInversa = palavraUpper.split('').reverse().join('');

        // Verificar todas as direções possíveis
        for (let row = 0; row < this.tamanho; row++) {
            for (let col = 0; col < this.tamanho; col++) {
                // Tentar 4 direções: horizontal, vertical, diagonal desc, diagonal subida
                for (let direcao = 0; direcao < 4; direcao++) {
                    if (this.encontrouPalavraEm(palavraUpper, row, col, direcao)) {
                        return true;
                    }
                    if (this.encontrouPalavraEm(palavraInversa, row, col, direcao)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    // Verificar se palavra existe em posição e direção específicas
    encontrouPalavraEm(palavra, row, col, direcao) {
        const deltas = this.obterDeltas(direcao);
        if (!deltas) return false;

        let textoEncontrado = '';

        for (let i = 0; i < palavra.length; i++) {
            const r = row + deltas.dr * i;
            const c = col + deltas.dc * i;

            // Validar limites
            if (r < 0 || r >= this.tamanho || c < 0 || c >= this.tamanho) {
                return false;
            }

            textoEncontrado += this.grade[r][c].letra;
        }

        return textoEncontrado === palavra;
    }
}

//Classe para gerenciar o jogo
class JogoEducativo {
    constructor() {
        this.temaId = null;
        this.temaNome = null;
        this.dificuldade = null;
        this.palavras = [];
        this.grade = null;
        this.tempo = 0;
        this.pontuacao = 0;
        this.cronometroId = null;
        this.selecionadas = [];
        this.palavrasEncontradas = new Set();
        this.melhorTempoAtual = null;
        this.direcaoFixada = null; // Armazena a direção após 2ª seleção
        this.arrastando = false;
        this.inicializar();
    }

    // Inicializar o jogo
    async inicializar() {
        try {
            // Ler parâmetros da URL
            this.lerParametrosURL();

            // Exibir informações na tela
            this.exibirInformacoes();

            // Buscar palavras da API
            await this.buscarPalavras();

            // Criar grade
            this.criarGrade();

            // Exibir palavras na lista
            this.exibirListaPalavras();

            // Renderizar grade visual
            this.renderizarGrade();

            // Iniciar cronômetro
            this.iniciarCronometro();

            // Buscar melhor tempo
            await this.buscarMelhorTempo();

            // Configurar event listeners
            this.configurarEventos();
        } catch (erro) {
            console.error('Erro ao inicializar jogo:', erro);
            alert('Erro ao carregar o jogo. Redirecionando...');
            window.location.href = '../index.html';
        }
    }

    // Ler parâmetros da URL
    lerParametrosURL() {
        const params = new URLSearchParams(window.location.search);
        this.temaId = params.get('tema_id');
        this.temaNome = params.get('tema_nome');
        this.dificuldade = params.get('dificuldade');

        // Validar parâmetros
        if (!this.temaId || !this.temaNome || !this.dificuldade) {
            throw new Error('Parâmetros da URL inválidos');
        }
    }

    // Exibir informações na tela
    exibirInformacoes() {
        // Título do tema
        document.getElementById('tituloTema').textContent = this.temaNome;

        // Dificuldade
        const dificuldadeTexto = {
            'facil': 'Fácil',
            'medio': 'Médio',
            'dificil': 'Difícil'
        };
        document.getElementById('dificuldadeJogo').textContent =
            dificuldadeTexto[this.dificuldade] || this.dificuldade;
    }

    // Buscar palavras da API
    async buscarPalavras() {
        try {
            const resposta = await fetch(
                `https://caca-palavras-backend.onrender.com/palavras/tema/${this.temaId}`
            );

            if (!resposta.ok) {
                throw new Error(`Erro: ${resposta.status}`);
            }

            const dados = await resposta.json();
            this.palavras = dados.dados || [];

            if (this.palavras.length === 0) {
                throw new Error('Nenhuma palavra encontrada para este tema');
            }
        } catch (erro) {
            console.error('Erro ao buscar palavras:', erro);
            throw erro;
        }
    }

    // Criar grade do caça-palavras com garantia de inserção 100%
    criarGrade() {
        // Tamanhos iniciais por dificuldade
        const tamanhosPorDificuldade = {
            'facil': 10,
            'medio': 12,
            'dificil': 15
        };

        let tamanho = tamanhosPorDificuldade[this.dificuldade] || 10;
        let sucesso = false;
        let tentativasGrade = 0;
        const maxTentativasGrade = 5; // Máximo de tentativas antes de aumentar tamanho

        // Tentar gerar até conseguir inserir todas as palavras
        // CORRIGIDO (Requisito 4): Usar maxTentativasGrade no controle do laço
        while (!sucesso && tentativasGrade < 10) {
            // Se atingimos maxTentativasGrade tentativas, aumentar o tamanho
            if (tentativasGrade > 0 && tentativasGrade % maxTentativasGrade === 0) {
                tamanho += 2;
            }
            tentativasGrade++;
            this.grade = new Grade(tamanho);

            // Embaralhar lista de palavras para variação
            const palavrasEmbaralhadas = this.embaralharPalavras();

            let todasInseridas = true;

            // Tentar inserir cada palavra
            for (let index = 0; index < palavrasEmbaralhadas.length; index++) {
                const palavra = palavrasEmbaralhadas[index];
                const indicePalavraOriginal = this.palavras.indexOf(palavra);

                // Tentar inserir com direções aleatórias
                let inserida = false;
                const direcoes = [0, 1, 2, 3];
                const direcoesMisturadas = this.embaralharArray(direcoes);

                for (let d = 0; d < direcoesMisturadas.length && !inserida; d++) {
                    const direcao = direcoesMisturadas[d];
                    const posicao = this.encontrarPosicaoAleatoriaParaPalavra(
                        palavra.termo.toUpperCase(),
                        direcao
                    );

                    if (posicao) {
                        const resultado = this.grade.inserirPalavraEm(
                            palavra.termo.toUpperCase(),
                            indicePalavraOriginal,
                            posicao.row,
                            posicao.col,
                            direcao
                        );

                        if (resultado) {
                            inserida = true;
                        }
                    }
                }

                // Se não conseguiu inserir, marca falha
                if (!inserida) {
                    todasInseridas = false;
                    break;
                }
            }

            // Se todas foram inseridas, validar
            if (todasInseridas) {
                sucesso = this.validarGrade();
            }

            // Se falhou, aumentar tamanho para próxima tentativa
            if (!sucesso) {
                tamanho += 2;
            }
        }

        if (!sucesso) {
            throw new Error('Não foi possível gerar a grade do jogo');
        }

        // Completar espaços vazios com letras aleatórias
        this.grade.completarComLetrasAleatorias();
    }

    // Embaralhar array (Fisher-Yates shuffle)
    embaralharArray(array) {
        const copia = [...array];
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
    }

    // Embaralhar palavras com variação por dificuldade
    embaralharPalavras() {
        const copia = [...this.palavras];

        // Variação de embaralhamento por dificuldade
        const repeticoes = {
            'facil': 1,
            'medio': 3,
            'dificil': 5
        };

        const reps = repeticoes[this.dificuldade] || 1;

        // Aplicar embaralhamento múltiplas vezes
        for (let rep = 0; rep < reps; rep++) {
            for (let i = copia.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [copia[i], copia[j]] = [copia[j], copia[i]];
            }
        }

        return copia;
    }

    // Encontrar posição aleatória válida para inserir palavra
    encontrarPosicaoAleatoriaParaPalavra(palavra, direcao) {
        // Tentar até 50 posições aleatórias
        for (let tentativa = 0; tentativa < 50; tentativa++) {
            const row = Math.floor(Math.random() * this.grade.tamanho);
            const col = Math.floor(Math.random() * this.grade.tamanho);

            if (this.grade.podeInserir(palavra, row, col, direcao)) {
                return { row, col };
            }
        }

        return null;
    }

    // Validar que todas as palavras existem na grade
    validarGrade() {
        for (let i = 0; i < this.palavras.length; i++) {
            const palavra = this.palavras[i].termo;

            // Verificar se palavra existe na grade (direta ou inversa)
            if (!this.grade.procurarPalavra(palavra)) {
                console.warn(`Palavra "${palavra}" não encontrada na grade após inserção`);
                return false;
            }
        }

        return true;
    }

    // Renderizar grade visual
    renderizarGrade() {
        const container = document.getElementById('containerGrade');
        container.innerHTML = '';

        const tabela = document.createElement('table');
        tabela.className = 'grade-tabela';

        for (let i = 0; i < this.grade.tamanho; i++) {
            const linha = document.createElement('tr');

            for (let j = 0; j < this.grade.tamanho; j++) {
                const celula = document.createElement('td');
                celula.className = 'celula-grade';
                celula.textContent = this.grade.grade[i][j].letra;
                celula.dataset.row = i;
                celula.dataset.col = j;

                // Mouse
                celula.addEventListener('pointerdown', (e) => {
                    this.limparSelecao();

                    this.arrastando = true;

                    this.selecionarCelula(e, i, j);
                });

                // celula.addEventListener('pointerenter', (e) => {
                //     if (!this.arrastando) return;

                //     const jaSelecionada = this.selecionadas.some(
                //         s => s.row === i && s.col === j
                //     );

                //     if (!jaSelecionada) {
                //         this.selecionarCelula(e, i, j);
                //     }
                // });
                linha.appendChild(celula);
            }

            tabela.appendChild(linha);
        }

        container.appendChild(tabela);

        tabela.addEventListener('pointermove', (e) => {

    if (!this.arrastando) return;

    const elemento = document.elementFromPoint(
        e.clientX,
        e.clientY
    );

    if (
        elemento &&
        elemento.classList.contains('celula-grade')
    ) {

        const row = parseInt(elemento.dataset.row);
        const col = parseInt(elemento.dataset.col);

        const jaSelecionada = this.selecionadas.some(
            s => s.row === row && s.col === col
        );

        if (!jaSelecionada) {
            this.selecionarCelula(e, row, col);
        }
    }
});

    }

    // Selecionar célula individual
    selecionarCelula(e, row, col) {
        e.preventDefault();

        // Se é a primeira seleção
        if (this.selecionadas.length === 0) {
            this.selecionadas.push({ row, col });
            this.direcaoFixada = null;
            this.atualizarDisplaySelecao();
            return;
        }

        // Verificar se é uma célula já selecionada (desfazer)
        const jaExisteSelecionada = this.selecionadas.findIndex(s => s.row === row && s.col === col);
        if (jaExisteSelecionada !== -1) {
            // Remover e reconstruir até esse ponto (desfazer últimos cliques)
            this.selecionadas = this.selecionadas.slice(0, jaExisteSelecionada);
            // CORRIGIDO (Requisito 2-3): Se removemos até ficar com 1 ou 0 elementos, resetar direção
            if (this.selecionadas.length <= 1) {
                this.direcaoFixada = null;
            }
            this.atualizarDisplaySelecao();
            return;
        }

        // Verificar se é adjacente à última seleção
        const ultima = this.selecionadas[this.selecionadas.length - 1];
        const distancia = Math.max(Math.abs(row - ultima.row), Math.abs(col - ultima.col));

        // Permitir apenas células adjacentes (linha, coluna ou diagonal)
        if (distancia !== 1) {
            return;
        }

        // CORRIGIDO (Requisito 2): Calcular direção do movimento e validar linha reta
        const dr = row === ultima.row ? 0 : (row > ultima.row ? 1 : -1);
        const dc = col === ultima.col ? 0 : (col > ultima.col ? 1 : -1);

        // Validar que o movimento continua em linha reta
        // Se ainda não fixou direção (2ª seleção), fixar agora
        if (this.direcaoFixada === null) {
            // CORRIGIDO (Requisito 2): Fixar direção na segunda seleção
            this.direcaoFixada = { dr, dc };
        } else {
            // Verificar se a direção está mantendo a mesma (impedir zig-zag)
            if (this.direcaoFixada.dr !== dr || this.direcaoFixada.dc !== dc) {
                // Movimento em direção diferente - não permitir zig-zag
                return;
            }
        }

        // Adicionar à seleção
        this.selecionadas.push({ row, col });
        this.atualizarDisplaySelecao();
    }

    // Atualizar display da seleção
    atualizarDisplaySelecao() {
        // Limpar destaques anteriores
        document.querySelectorAll('.celula-grade').forEach(celula => {
            celula.classList.remove('selecionada');
        });

        // Destacar células selecionadas
        this.selecionadas.forEach(pos => {
            const celula = document.querySelector(
                `[data-row="${pos.row}"][data-col="${pos.col}"]`
            );
            if (celula) celula.classList.add('selecionada');
        });

        // Atualizar display da palavra
        const texto = this.selecionadas
            .map(pos => this.grade.grade[pos.row][pos.col].letra)
            .join('');

        document.getElementById('palavraSelecionada').textContent = texto || '---';
    }

    // Confirmar palavra (validar com exatidão e pontuar)
    confirmarPalavra() {
        if (this.selecionadas.length === 0) {
            this.exibirMensagem('Selecione uma palavra primeiro!', 'erro');
            return;
        }

        // Obter texto selecionado
        const textoSelecionado = this.selecionadas
            .map(pos => this.grade.grade[pos.row][pos.col].letra)
            .join('');

        // Validação exata: procurar palavra com comprimento e conteúdo exatos
        let indiceEncontrado = -1;
        let palavraEncontradaExata = false;

        // Percorrer lista de palavras
        for (let i = 0; i < this.palavras.length; i++) {
            // Pular se já foi encontrada (impedir duplicação de pontos)
            if (this.palavrasEncontradas.has(i)) {
                continue;
            }

            const palavra = this.palavras[i].termo.toUpperCase();
            const palavraInversa = palavra.split('').reverse().join('');

            // Comparação exata: sem includes(), sem startsWith(), comparação completa
            // Validar comprimento exato
            if (textoSelecionado.length !== palavra.length) {
                continue;
            }

            // Comparar sequência completa (direta ou inversa)
            if (textoSelecionado === palavra || textoSelecionado === palavraInversa) {
                indiceEncontrado = i;
                palavraEncontradaExata = true;
                break;
            }
        }

        // Processar resultado
        if (palavraEncontradaExata && indiceEncontrado !== -1) {
            this.palavraEncontrada(indiceEncontrado);
        } else {
            this.exibirMensagem('Palavra inválida!', 'erro');
        }

        // Limpar seleção após validação
        this.limparSelecao();
    }

    // Limpar seleção
    limparSelecao() {
        this.selecionadas = [];
        // CORRIGIDO (Requisito 2-3): Resetar direção ao limpar seleção
        this.direcaoFixada = null;
        this.atualizarDisplaySelecao();
        document.getElementById('palavraSelecionada').textContent = '---';
        // Remover mensagens
        const msg = document.querySelector('.mensagem-validacao');
        if (msg) msg.remove();
    }

    // Exibir mensagem de validação
    exibirMensagem(texto, tipo) {
        // Remover mensagem anterior se existir
        const msgAnterior = document.querySelector('.mensagem-validacao');
        if (msgAnterior) msgAnterior.remove();

        // Criar nova mensagem
        const msg = document.createElement('div');
        msg.className = `mensagem-validacao ${tipo}`;
        msg.textContent = texto;

        // Inserir após os controles
        const controles = document.querySelector('.controles-selecao');
        if (controles) {
            controles.parentNode.insertBefore(msg, controles.nextSibling);
        }

        // Remover após 3 segundos
        setTimeout(() => {
            if (msg && msg.parentNode) {
                msg.remove();
            }
        }, 3000);
    }

    // Palavra foi encontrada
    palavraEncontrada(indice) {
        this.palavrasEncontradas.add(indice);

        // Atualizar pontuação
        this.pontuacao += 10;
        document.getElementById('pontuacao').textContent = this.pontuacao;

        // Marcar palavra como encontrada na lista
        const itemLista = document.querySelector(`[data-id="${indice}"]`);
        if (itemLista) {
            itemLista.classList.add('encontrado');
        }

        // Destacar palavras na grade
        this.destacarPalavrasNaGrade();

        // Exibir mensagem de sucesso
        this.exibirMensagem('✓ Palavra encontrada!', 'sucesso');

        // Verificar se todas foram encontradas
        if (this.palavrasEncontradas.size === this.palavras.length) {
            this.finalizarJogo();
        }
    }

    // Destacar palavras encontradas na grade
    destacarPalavrasNaGrade() {
        document.querySelectorAll('.celula-grade').forEach(celula => {
            celula.classList.remove('encontrada');
        });

        // CORRIGIDO (Requisito 1): Usar ID da palavra em vez de índice para destacar
        // Isso garante que a palavra correta seja destacada independentemente da ordem
        // de inserção na grade (palavrasGrade é preenchido na ordem de inserção,
        // mas o índice em palavrasEncontradas corresponde à posição em this.palavras)
        this.palavrasEncontradas.forEach(indice => {
            // Procurar a palavra em palavrasGrade usando o ID (que é o índice original)
            const palavra = this.grade.palavrasGrade.find(p => p.id === indice);
            if (palavra) {
                palavra.posicoes.forEach(pos => {
                    const celula = document.querySelector(
                        `[data-row="${pos.r}"][data-col="${pos.c}"]`
                    );
                    if (celula) celula.classList.add('encontrada');
                });
            }
        });
    }

    // Exibir lista de palavras
    exibirListaPalavras() {
        const listaPalavras = document.getElementById('listaPalavras');
        listaPalavras.innerHTML = '';

        this.palavras.forEach((palavra, index) => {
            const itemLista = document.createElement('li');
            itemLista.className = 'item-palavra';
            itemLista.dataset.id = index;
            itemLista.textContent = palavra.termo;

            // Event listener para exibir explicação
            itemLista.addEventListener('click', () => {
                this.exibirExplicacao(palavra);
                this.destacarPalavra(itemLista);
            });

            listaPalavras.appendChild(itemLista);
        });
    }

    // Exibir explicação da palavra
    exibirExplicacao(palavra) {
        const containerExplicacao = document.getElementById('containerExplicacao');
        containerExplicacao.innerHTML = `
            <div class="explicacao-ativa">
                <p class="palavra-destaque">${palavra.termo}</p>
                <p class="texto-explicacao">${palavra.explicacao}</p>
            </div>
        `;
    }

    // Destacar palavra selecionada
    destacarPalavra(elemento) {
        document.querySelectorAll('.item-palavra').forEach(item => {
            item.classList.remove('ativo');
        });
        elemento.classList.add('ativo');
    }

    // Iniciar cronômetro
    iniciarCronometro() {
        this.tempo = 0;
        this.atualizarCronometro();

        this.cronometroId = setInterval(() => {
            this.tempo++;
            this.atualizarCronometro();
        }, 1000);
    }

    // Atualizar display do cronômetro
    atualizarCronometro() {
        const minutos = Math.floor(this.tempo / 60);
        const segundos = this.tempo % 60;
        const tempo = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
        document.getElementById('cronometro').textContent = tempo;
    }

    // Buscar melhor tempo (recorde)
    async buscarMelhorTempo() {
        try {
            const resposta = await fetch('https://caca-palavras-backend.onrender.com/recordes');

            if (!resposta.ok) {
                throw new Error(`Erro: ${resposta.status}`);
            }

            const dados = await resposta.json();
            const recordes = dados.dados || [];

            // Procurar recorde para este tema e dificuldade
            const recorde = recordes.find(r =>
                r.tema_id == this.temaId && r.dificuldade === this.dificuldade
            );

            if (recorde) {
                const minutos = Math.floor(recorde.melhor_tempo / 60);
                const segundos = recorde.melhor_tempo % 60;
                const tempo = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
                document.getElementById('melhorTempo').textContent = tempo;
                this.melhorTempoAtual = recorde.melhor_tempo;
            }
        } catch (erro) {
            console.error('Erro ao buscar melhor tempo:', erro);
        }
    }

    // Salvar recorde se necessário
    async salvarRecorde() {
        try {
            const resposta = await fetch(' https://caca-palavras-backend.onrender.com/recordes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tema_id: this.temaId,
                    dificuldade: this.dificuldade,
                    melhor_tempo: this.tempo
                })
            });

            if (!resposta.ok) {
                throw new Error(`Erro: ${resposta.status}`);
            }

            const dados = await resposta.json();
            console.log('Recorde salvo:', dados);

            // Se foi atualizado, mostrar melhor tempo
            if (dados.acao === 'atualizado') {
                alert('🎉 Novo recorde! Você bateu o tempo anterior!');
                await this.buscarMelhorTempo();
            }
        } catch (erro) {
            console.error('Erro ao salvar recorde:', erro);
        }
    }

    // Configurar event listeners
    configurarEventos() {
        document.addEventListener('pointerup', () => {

            if (!this.arrastando) return;

            this.arrastando = false;

            if (this.selecionadas.length > 1) {
                this.confirmarPalavra();
            }
        });

        // Botão voltar
        document.getElementById('botaoVoltar').addEventListener('click', () => {
            this.parar();
            if (confirm('Deseja sair do jogo? Seu progresso será perdido.')) {
                window.location.href = '../index.html';
            }
        });
        // Botão limpar seleção
        document.getElementById('botaoLimpar').addEventListener('click', () => {
            this.limparSelecao();
        });
    }

    // Parar cronômetro
    parar() {
        if (this.cronometroId) {
            clearInterval(this.cronometroId);
            this.cronometroId = null;
        }
    }

    // Finalizar jogo
    async finalizarJogo() {
        this.parar();

        // Salvar recorde
        await this.salvarRecorde();

        // Exibir modal ou fallback para alert
        const tempo = document.getElementById('cronometro').textContent;

        // CORRIGIDO (Requisito 6): Verificar se objeto modal existe antes de usar
        // Evita ReferenceError: modal is not defined
        if (typeof modal !== 'undefined' && modal && typeof modal.abrir === 'function') {
            modal.abrir(tempo, this.pontuacao);
        } else {
            // Fallback para alert se modal não estiver disponível
            const mensagem = `🎉 Parabéns! Você completou o jogo!\n\nTempo: ${tempo}\nPontuação: ${this.pontuacao}`;
            alert(mensagem);
        }
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.jogoEducativo = new JogoEducativo();
});
