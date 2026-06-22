// Controlar modal de conclusão

class Modal {
    constructor() {
        this.modalOverlay = document.getElementById('modalOverlay');
        this.modalConclusao = document.getElementById('modalConclusao');
        this.botaoFecharModal = document.getElementById('botaoFecharModal');
        this.botaoNovoJogo = document.getElementById('botaoNovoJogo');
        this.botaoMenuPrincipal = document.getElementById('botaoMenuPrincipal');
        
        this.configurarEventos();
    }
    
    configurarEventos() {
        this.botaoFecharModal.addEventListener('click', () => this.fechar());
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) {
                this.fechar();
            }
        });
        
        this.botaoNovoJogo.addEventListener('click', () => this.novoJogo());
        this.botaoMenuPrincipal.addEventListener('click', () => this.menuPrincipal());
    }
    
    abrir(tempoFinal, pontuacao) {
        document.getElementById('tempoFinal').textContent = tempoFinal;
        document.getElementById('pontuacaoFinal').textContent = pontuacao;
        this.modalOverlay.classList.add('ativo');
    }
    
    fechar() {
        this.modalOverlay.classList.remove('ativo');
    }
    
    novoJogo() {
        location.reload();
    }
    
    menuPrincipal() {
        window.location.href = '../index.html';
    }
}

// Exportar para uso global
const modal = new Modal();
