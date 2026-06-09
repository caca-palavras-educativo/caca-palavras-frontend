// ========================================
// CLASSE PARA GERENCIAR A GRADE DO JOGO
// ========================================

class Grade {
    constructor(tamanho) {
        this.tamanho = tamanho;
        this.grade = this.inicializarGrade();
        this.palavrasGrade = [];
    }
    
    // Inicializar grade vazia
    inicializarGrade() {
        return Array(this.tamanho).fill(null).map(() => 
            Array(this.tamanho).fill(null).map(() => ({
                letra: '',
                palavraIds: []
            }))
        );
    }
    
    // Inserir palavra na grade
    inserirPalavra(palavra, id, direcao) {
        // Direcoes: 0=horizontal, 1=vertical, 2=diagonal(descente), 3=diagonal(subida)
        
        let posicoes = [];
        
        // Tentar inserir com retry
        for (let tentativa = 0; tentativa < 100; tentativa++) {
            const row = Math.floor(Math.random() * this.tamanho);
            const col = Math.floor(Math.random() * this.tamanho);
            
            // Verificar se é possível inserir
            if (this.podeInserir(palavra, row, col, direcao)) {
                posicoes = this.inserirNaGrade(palavra, id, row, col, direcao);
                break;
            }
        }
        
        return posicoes;
    }
    
    // Verificar se é possível inserir palavra
    podeInserir(palavra, row, col, direcao) {
        if (direcao === 0) { // Horizontal
            if (col + palavra.length > this.tamanho) return false;
            for (let i = 0; i < palavra.length; i++) {
                if (this.grade[row][col + i].letra !== '' && 
                    this.grade[row][col + i].letra !== palavra[i]) {
                    return false;
                }
            }
        } else if (direcao === 1) { // Vertical
            if (row + palavra.length > this.tamanho) return false;
            for (let i = 0; i < palavra.length; i++) {
                if (this.grade[row + i][col].letra !== '' && 
                    this.grade[row + i][col].letra !== palavra[i]) {
                    return false;
                }
            }
        } else if (direcao === 2) { // Diagonal (descente)
            if (row + palavra.length > this.tamanho || col + palavra.length > this.tamanho) return false;
            for (let i = 0; i < palavra.length; i++) {
                if (this.grade[row + i][col + i].letra !== '' && 
                    this.grade[row + i][col + i].letra !== palavra[i]) {
                    return false;
                }
            }
        } else if (direcao === 3) { // Diagonal (subida)
            if (row - palavra.length + 1 < 0 || col + palavra.length > this.tamanho) return false;
            for (let i = 0; i < palavra.length; i++) {
                if (this.grade[row - i][col + i].letra !== '' && 
                    this.grade[row - i][col + i].letra !== palavra[i]) {
                    return false;
                }
            }
        }
        return true;
    }
    
    // Inserir palavra na grade
    inserirNaGrade(palavra, id, row, col, direcao) {
        const posicoes = [];
        
        for (let i = 0; i < palavra.length; i++) {
            let r = row;
            let c = col;
            
            if (direcao === 1) r += i;
            else if (direcao === 2) { r += i; c += i; }
            else if (direcao === 3) { r -= i; c += i; }
            else c += i;
            
            this.grade[r][c].letra = palavra[i].toUpperCase();
            if (!this.grade[r][c].palavraIds.includes(id)) {
                this.grade[r][c].palavraIds.push(id);
            }
            posicoes.push({ r, c });
        }
        
        this.palavrasGrade.push({
            id,
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
                    this.grade[i][j].letra = letras[Math.floor(Math.random() * letras.length)];
                }
            }
        }
    }
}

// ========================================
// CLASSE PARA GERENCIAR O JOGO
// ========================================

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
                `http://localhost:3000/palavras/tema/${this.temaId}`
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
    
    // Criar grade do caça-palavras
    criarGrade() {
        // Determinar tamanho baseado na dificuldade
        const tamanhos = {
            'facil': 10,
            'medio': 12,
            'dificil': 15
        };
        
        const tamanho = tamanhos[this.dificuldade] || 10;
        this.grade = new Grade(tamanho);
        
        // Inserir palavras na grade
        this.palavras.forEach((palavra, index) => {
            const direcoes = [0, 1, 2, 3]; // Todas as direções
            const direcao = direcoes[Math.floor(Math.random() * direcoes.length)];
            this.grade.inserirPalavra(palavra.termo.toUpperCase(), index, direcao);
        });
        
        // Completar com letras aleatórias
        this.grade.completarComLetrasAleatorias();
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
                
                // Event listener para clique individual (touch e mouse)
                celula.addEventListener('click', (e) => this.selecionarCelula(e, i, j));
                
                linha.appendChild(celula);
            }
            
            tabela.appendChild(linha);
        }
        
        container.appendChild(tabela);
    }
    
    // Selecionar célula individual
    selecionarCelula(e, row, col) {
        e.preventDefault();
        
        // Se é a primeira seleção
        if (this.selecionadas.length === 0) {
            this.selecionadas.push({ row, col });
            this.atualizarDisplaySelecao();
            return;
        }
        
        // Verificar se é uma célula já selecionada (desfazer)
        const jaExisteSelecionada = this.selecionadas.findIndex(s => s.row === row && s.col === col);
        if (jaExisteSelecionada !== -1) {
            // Remover e reconstruir até esse ponto (desfazer últimos cliques)
            this.selecionadas = this.selecionadas.slice(0, jaExisteSelecionada);
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
    
    // Confirmar palavra (validar e pontuar)
    confirmarPalavra() {
        if (this.selecionadas.length === 0) {
            this.exibirMensagem('Selecione uma palavra primeiro!', 'erro');
            return;
        }
        
        // Obter texto selecionado
        const textoSelecionado = this.selecionadas
            .map(pos => this.grade.grade[pos.row][pos.col].letra)
            .join('');
        
        // Procurar palavra na lista
        let encontrou = false;
        for (let i = 0; i < this.palavras.length; i++) {
            if (this.palavrasEncontradas.has(i)) continue;
            
            const palavra = this.palavras[i].termo.toUpperCase();
            
            // Verificar se o texto corresponde a palavra ou ao contrário
            if (textoSelecionado === palavra || textoSelecionado === palavra.split('').reverse().join('')) {
                this.palavraEncontrada(i);
                encontrou = true;
                break;
            }
        }
        
        if (!encontrou) {
            this.exibirMensagem('Palavra inválida!', 'erro');
        }
        
        // Limpar seleção após validação
        this.limparSelecao();
    }
    
    // Limpar seleção
    limparSelecao() {
        this.selecionadas = [];
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
        
        this.palavrasEncontradas.forEach(indice => {
            const palavra = this.grade.palavrasGrade[indice];
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
            const resposta = await fetch('http://localhost:3000/recordes');
            
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
            const resposta = await fetch('http://localhost:3000/recordes', {
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
        // Botão voltar
        document.getElementById('botaoVoltar').addEventListener('click', () => {
            this.parar();
            if (confirm('Deseja sair do jogo? Seu progresso será perdido.')) {
                window.location.href = '../index.html';
            }
        });
        
        // Botão confirmar palavra
        document.getElementById('botaoConfirmar').addEventListener('click', () => {
            this.confirmarPalavra();
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
        
        // Exibir modal
        const tempo = document.getElementById('cronometro').textContent;
        modal.abrir(tempo, this.pontuacao);
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.jogoEducativo = new JogoEducativo();
});
