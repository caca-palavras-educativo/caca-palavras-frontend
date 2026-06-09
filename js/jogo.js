// Lógica da tela do jogo

class JogoEducativo {
    constructor() {
        this.temaId = null;
        this.temaNome = null;
        this.dificuldade = null;
        this.palavras = [];
        this.tempo = 0;
        this.pontuacao = 0;
        this.cronometroId = null;
        
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
            
            // Exibir palavras na lista
            this.exibirListaPalavras();
            
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
    
    // Exibir lista de palavras
    exibirListaPalavras() {
        const listaPalavras = document.getElementById('listaPalavras');
        listaPalavras.innerHTML = '';
        
        this.palavras.forEach((palavra) => {
            const itemLista = document.createElement('li');
            itemLista.className = 'item-palavra';
            itemLista.dataset.id = palavra.id;
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
        // Remover destaque de todos os itens
        document.querySelectorAll('.item-palavra').forEach(item => {
            item.classList.remove('ativo');
        });
        
        // Adicionar destaque ao item clicado
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
            }
        } catch (erro) {
            console.error('Erro ao buscar melhor tempo:', erro);
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
    }
    
    // Parar cronômetro
    parar() {
        if (this.cronometroId) {
            clearInterval(this.cronometroId);
            this.cronometroId = null;
        }
    }
    
    // Finalizar jogo
    finalizarJogo() {
        this.parar();
        const tempo = document.getElementById('cronometro').textContent;
        modal.abrir(tempo, this.pontuacao);
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.jogoEducativo = new JogoEducativo();
});
