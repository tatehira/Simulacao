document.addEventListener('DOMContentLoaded', () => {
    const inputValorBem = document.getElementById('valor-bem');
    const inputEntrada = document.getElementById('valor-entrada');
    const inputTaxa = document.getElementById('taxa-juros');
    const btnFetch = document.getElementById('fetch-rate');
    const btnSimular = document.getElementById('btn-simular');
    const toggleAnual = document.getElementById('toggle-anual');
    const taxaPeriodoLabel = document.getElementById('taxa-periodo-label');
    const resultsSection = document.getElementById('results-section');
    const resultsGrid = document.getElementById('results-grid');
    const loader = document.getElementById('loader');
    const selectCondicao = document.getElementById('condicao');

    // --- Máscaras e Formatação ---
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const parseCurrency = (value) => {
        return parseFloat(value.replace(/[^\d]/g, '')) / 100 || 0;
    };

    const handleCurrencyInput = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = (value / 100).toFixed(2) + '';
        value = value.replace(".", ",");
        value = value.replace(/(\d)(\d{3})(\d{3})/g, "$1.$2.$3");
        value = value.replace(/(\d)(\d{3})/g, "$1.$2");
        e.target.value = value;
    };

    inputValorBem.addEventListener('input', handleCurrencyInput);
    inputEntrada.addEventListener('input', handleCurrencyInput);

    // --- Lógica da Taxa ---
    toggleAnual.addEventListener('change', () => {
        taxaPeriodoLabel.textContent = toggleAnual.checked ? 'anual' : 'mensal';
    });

    const fetchBCBRate = async () => {
        loader.classList.remove('hidden');
        try {
            // Série 25471: Taxa média mensal de juros - PF - Veículos
            const response = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.25471/dados/ultimos/1?formato=json');
            const data = await response.json();
            
            if (data && data.length > 0) {
                let rate = parseFloat(data[0].valor);
                
                // Ajuste realista conforme solicitado: Novo ~1.8, Usado ~3.0
                // Se a média do BCB vier, vamos considerar que ela é a base.
                // Usaremos um fator de ajuste baseado na condição selecionada.
                const condicao = selectCondicao.value;
                if (condicao === 'novo') {
                    rate = rate * 0.9; // Um pouco abaixo da média
                } else {
                    rate = rate * 1.5; // Bem acima da média
                }

                inputTaxa.value = rate.toFixed(2);
                if (toggleAnual.checked) {
                    // Converter mensal para anual: (1 + i)^12 - 1
                    const anual = (Math.pow(1 + (rate / 100), 12) - 1) * 100;
                    inputTaxa.value = anual.toFixed(2);
                }
            }
        } catch (error) {
            console.error('Erro ao buscar taxa:', error);
            alert('Não foi possível obter a taxa em tempo real. Por favor, insira manualmente.');
        } finally {
            loader.classList.add('hidden');
        }
    };

    btnFetch.addEventListener('click', fetchBCBRate);

    // --- Simulação ---
    const calculatePrice = (principal, monthlyRate, months) => {
        if (monthlyRate === 0) return principal / months;
        return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
    };

    const simulate = () => {
        const valorBem = parseCurrency(inputValorBem.value);
        const entrada = parseCurrency(inputEntrada.value);
        const principal = valorBem - entrada;
        
        if (principal <= 0) {
            alert('A entrada não pode ser maior ou igual ao valor do bem.');
            return;
        }

        let taxaInput = parseFloat(inputTaxa.value) / 100;
        if (isNaN(taxaInput)) {
            alert('Por favor, insira uma taxa de juros válida.');
            return;
        }

        let monthlyRate = taxaInput;
        if (toggleAnual.checked) {
            // Converter anual para mensal: (1 + i_anual)^(1/12) - 1
            monthlyRate = Math.pow(1 + taxaInput, 1/12) - 1;
        }

        const isCarro = document.getElementById('carro').checked;
        const maxMonths = isCarro ? 60 : 48;
        const monthSteps = [12, 24, 36, 48, 60].filter(m => m <= maxMonths);

        resultsGrid.innerHTML = '';
        
        monthSteps.forEach(months => {
            const pmt = calculatePrice(principal, monthlyRate, months);
            
            const card = document.createElement('div');
            card.className = 'installment-card';
            card.innerHTML = `
                <span class="inst-mes">${months} meses</span>
                <span class="inst-valor">${formatCurrency(pmt)}</span>
            `;
            resultsGrid.appendChild(card);
        });

        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    };

    btnSimular.addEventListener('click', simulate);
});
