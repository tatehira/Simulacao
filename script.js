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

    // Novos elementos
    const simVeiculo = document.getElementById('sim-veiculo');
    const simConsignado = document.getElementById('sim-consignado');
    const campoTipoVeiculo = document.getElementById('campo-tipo-veiculo');
    const campoCondicao = document.getElementById('campo-condicao');
    const campoBanco = document.getElementById('campo-banco');
    const campoEntrada = document.getElementById('campo-entrada');
    const labelValorPrincipal = document.getElementById('label-valor-principal');
    const fetchRateText = document.getElementById('fetch-rate-text');
    const selectBanco = document.getElementById('banco');
    
    const sFinanciado = document.getElementById('s-financiado');
    const sTaxa = document.getElementById('s-taxa');
    const sLabelFinanciado = document.getElementById('s-label-financiado');

    // --- Alternar Tipo de Simulação ---
    const toggleSimulacao = () => {
        if (simConsignado.checked) {
            campoTipoVeiculo.classList.add('hidden');
            campoCondicao.classList.add('hidden');
            campoEntrada.classList.add('hidden');
            campoBanco.classList.remove('hidden');
            labelValorPrincipal.textContent = 'Valor do Empréstimo (R$)';
            fetchRateText.textContent = 'Buscar Média do Banco';
            sLabelFinanciado.textContent = 'Empréstimo';
            inputEntrada.value = ''; // Limpa entrada
        } else {
            campoTipoVeiculo.classList.remove('hidden');
            campoCondicao.classList.remove('hidden');
            campoEntrada.classList.remove('hidden');
            campoBanco.classList.add('hidden');
            labelValorPrincipal.textContent = 'Valor do Bem (R$)';
            fetchRateText.textContent = 'Buscar Média de Juros (BCB)';
            sLabelFinanciado.textContent = 'Financiado';
        }
    };

    simVeiculo.addEventListener('change', toggleSimulacao);
    simConsignado.addEventListener('change', toggleSimulacao);

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
        if (value === '') {
            e.target.value = '';
            return;
        }
        const numericValue = parseInt(value) / 100;
        e.target.value = new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numericValue);
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
            if (simConsignado.checked) {
                // Simulação de taxas médias (fictícias baseadas no mercado atual) para Consignado Público (Mensal)
                const taxasConsignado = {
                    'bb': 1.45,
                    'caixa': 1.40,
                    'bradesco': 1.55,
                    'itau': 1.52,
                    'santander': 1.48
                };
                
                await new Promise(r => setTimeout(r, 600)); // Simular delay de API
                let rate = taxasConsignado[selectBanco.value];
                
                inputTaxa.value = rate.toFixed(2);
                if (toggleAnual.checked) {
                    const anual = (Math.pow(1 + (rate / 100), 12) - 1) * 100;
                    inputTaxa.value = anual.toFixed(2);
                }
            } else {
                // Série 25471: Taxa média mensal de juros - PF - Veículos
                const response = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.25471/dados/ultimos/1?formato=json');
                const data = await response.json();
                
                if (data && data.length > 0) {
                    let rate = parseFloat(data[0].valor);
                    
                    const condicao = selectCondicao.value;
                    if (condicao === 'novo') {
                        rate = rate * 0.9;
                    } else {
                        rate = rate * 1.5;
                    }

                    inputTaxa.value = rate.toFixed(2);
                    if (toggleAnual.checked) {
                        const anual = (Math.pow(1 + (rate / 100), 12) - 1) * 100;
                        inputTaxa.value = anual.toFixed(2);
                    }
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
        const entrada = simConsignado.checked ? 0 : parseCurrency(inputEntrada.value);
        const principal = valorBem - entrada;
        
        if (principal <= 0) {
            alert(simConsignado.checked ? 'O valor do empréstimo deve ser maior que zero.' : 'A entrada não pode ser maior ou igual ao valor do bem.');
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

        let maxMonths;
        let monthSteps;

        if (simConsignado.checked) {
            maxMonths = 96; // Máximo comum para servidor público
            monthSteps = [24, 36, 48, 60, 72, 84, 96].filter(m => m <= maxMonths);
        } else {
            const isCarro = document.getElementById('carro').checked;
            maxMonths = isCarro ? 60 : 48;
            monthSteps = [12, 24, 36, 48, 60].filter(m => m <= maxMonths);
        }

        resultsGrid.innerHTML = '';
        
        monthSteps.forEach(months => {
            const pmt = calculatePrice(principal, monthlyRate, months);
            
            const card = document.createElement('div');
            card.className = 'installment-card';
            // ic is the class used in CSS for styling the cards properly
            card.innerHTML = `
                <div class="ic">
                    <div class="im">${months}x</div>
                    <div class="iv">${formatCurrency(pmt)}</div>
                </div>
            `;
            resultsGrid.appendChild(card);
        });

        sFinanciado.textContent = formatCurrency(principal);
        sTaxa.textContent = (monthlyRate * 100).toFixed(2) + '% a.m.';

        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    };

    btnSimular.addEventListener('click', simulate);
});
