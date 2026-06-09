// Centralizar as chamadas da API
const API_BASE_URL = 'http://localhost:3000';

// GET /temas - Buscar todos os temas
const obterTemas = async () => {
    try {
        const resposta = await fetch(`${API_BASE_URL}/temas`);
        
        if (!resposta.ok) {
            throw new Error(`Erro ao buscar temas: ${resposta.status}`);
        }
        
        const dados = await resposta.json();
        return dados.dados; // Retorna array de temas
    } catch (erro) {
        console.error('Erro na API:', erro);
        throw erro;
    }
};

module.exports = {
    obterTemas
};
