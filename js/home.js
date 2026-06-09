// Lógica da tela inicial

// Elementos do DOM
const selectTema = document.getElementById('selectTema');
const selectDificuldade = document.getElementById('selectDificuldade');
const botaoIniciar = document.getElementById('botaoIniciar');
const containerCarregamento = document.getElementById('containerCarregamento');

// Carregar temas ao inicializar a página
document.addEventListener('DOMContentLoaded', carregarTemas);

// Função para carregar temas da API
async function carregarTemas() {
    try {
        mostrarCarregamento(true);
        const temas = await obterTemas();
        
        // Limpar opções anteriores (exceto a padrão)
        selectTema.innerHTML = '<option value="">Selecione um tema...</option>';
        
        // Popular o select com os temas
        temas.forEach(tema => {
            const option = document.createElement('option');
            option.value = tema.id;
            option.textContent = tema.nome;
            selectTema.appendChild(option);
        });
        
        mostrarCarregamento(false);
    } catch (erro) {
        mostrarCarregamento(false);
        console.error('Erro ao carregar temas:', erro);
        alert('Erro ao carregar temas. Por favor, recarregue a página.');
    }
}

// Função para mostrar/ocultar indicador de carregamento
function mostrarCarregamento(ativo) {
    if (ativo) {
        containerCarregamento.style.display = 'block';
        botaoIniciar.disabled = true;
    } else {
        containerCarregamento.style.display = 'none';
        botaoIniciar.disabled = false;
    }
}

// Event listener para o botão "Iniciar Jogo"
botaoIniciar.addEventListener('click', iniciarJogo);

// Função para iniciar o jogo
function iniciarJogo() {
    const temaId = selectTema.value;
    const dificuldade = selectDificuldade.value;
    
    // Validar seleções
    if (!temaId) {
        alert('Por favor, selecione um tema.');
        selectTema.focus();
        return;
    }
    
    if (!dificuldade) {
        alert('Por favor, selecione uma dificuldade.');
        selectDificuldade.focus();
        return;
    }
    
    // Obter nome do tema selecionado
    const nomeTema = selectTema.options[selectTema.selectedIndex].text;
    
    // Construir URL com parâmetros
    const params = new URLSearchParams({
        tema_id: temaId,
        tema_nome: nomeTema,
        dificuldade: dificuldade
    });
    
    // Redirecionar para página do jogo
    window.location.href = `pages/jogo.html?${params.toString()}`;
}

// Função para buscar temas (importada de api.js)
async function obterTemas() {
    try {
        const resposta = await fetch('http://localhost:3000/temas');
        
        if (!resposta.ok) {
            throw new Error(`Erro: ${resposta.status}`);
        }
        
        const dados = await resposta.json();
        return dados.dados;
    } catch (erro) {
        console.error('Erro ao buscar temas:', erro);
        throw erro;
    }
}
