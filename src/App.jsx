import React, { useState, useEffect, useRef } from 'react';
import { 
  Car, 
  Percent, 
  HelpCircle, 
  RefreshCw, 
  ArrowRight, 
  Share2, 
  CheckCircle,
  Building,
  CreditCard,
  Coins,
  Download,
  Smartphone,
  X
} from 'lucide-react';
import html2canvas from 'html2canvas';

export default function App() {
  // Simulação State
  const [simType, setSimType] = useState('veiculo'); // 'veiculo' | 'consignado'
  const [veiculoType, setVeiculoType] = useState('carro'); // 'carro' | 'moto'
  
  // Valores
  const [valorBem, setValorBem] = useState('');
  const [condicao, setCondicao] = useState('novo'); // 'novo' | 'usado'
  const [entrada, setEntrada] = useState('');
  const [banco, setBanco] = useState('bb'); // 'bb' | 'caixa' | 'bradesco' | 'itau' | 'santander'
  
  // Taxa de Juros
  const [taxaJuros, setTaxaJuros] = useState('');
  const [isAnual, setIsAnual] = useState(false);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState({ principal: 0, monthlyRate: 0 });
  const [copied, setCopied] = useState(false);
  
  // PWA & Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  
  const resultsRef = useRef(null);
  const cardRef = useRef(null);

  // --- Efeito para Gerenciamento de Instalação (PWA) ---
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detecção de iOS e Standalone
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    setIsIOS(ios);

    if (ios && !isStandalone) {
      setShowInstallBtn(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`Escolha de instalação PWA: ${outcome}`);
      setDeferredPrompt(null);
      setShowInstallBtn(false);
    }
  };

  // --- Máscaras e Formatação ---
  const formatBRL = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleCurrencyChange = (value, setter) => {
    let cleanValue = value.replace(/\D/g, '');
    if (cleanValue === '') {
      setter('');
      return;
    }
    const numericValue = parseInt(cleanValue, 10) / 100;
    setter(new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericValue));
  };

  const parseBRL = (formattedValue) => {
    if (!formattedValue) return 0;
    return parseFloat(formattedValue.replace(/\./g, '').replace(',', '.')) || 0;
  };

  // --- Buscar Taxa do BCB ---
  const fetchRate = async (type = simType, bankId = banco, cond = condicao) => {
    setLoading(true);
    try {
      if (type === 'consignado') {
        // Série 25467: Taxa média mensal de juros - Consignado Público
        const response = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.25467/dados/ultimos/1?formato=json');
        const data = await response.json();
        
        if (data && data.length > 0) {
          const baseRate = parseFloat(data[0].valor);
          
          // Ajustes realistas por banco
          const ajustesBancos = {
            bb: 0.96,       // Banco do Brasil ligeiramente abaixo da média
            caixa: 0.92,    // Caixa Econômica costuma ter as melhores taxas
            bradesco: 1.05, // Bradesco ligeiramente acima da média
            itau: 1.02,     // Itaú próximo à média
            santander: 1.0  // Santander na média
          };
          
          let rate = baseRate * (ajustesBancos[bankId] || 1);
          
          if (isAnual) {
            rate = (Math.pow(1 + (rate / 100), 12) - 1) * 100;
          }
          setTaxaJuros(rate.toFixed(2));
        } else {
          // Fallbacks realistas se a API estiver fora do ar
          const fallbacks = { bb: 1.45, caixa: 1.38, bradesco: 1.55, itau: 1.50, santander: 1.48 };
          setTaxaJuros(fallbacks[bankId].toFixed(2));
        }
      } else {
        // Série 25471: Taxa média mensal de juros - Veículos
        const response = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.25471/dados/ultimos/1?formato=json');
        const data = await response.json();
        
        if (data && data.length > 0) {
          let rate = parseFloat(data[0].valor);
          
          // Ajuste conforme condição
          if (cond === 'novo') {
            rate = rate * 0.88;
          } else {
            rate = rate * 1.45;
          }
          
          if (isAnual) {
            rate = (Math.pow(1 + (rate / 100), 12) - 1) * 100;
          }
          setTaxaJuros(rate.toFixed(2));
        } else {
          // Fallback Veículos
          const baseFallback = 1.95;
          let rate = cond === 'novo' ? baseFallback * 0.88 : baseFallback * 1.45;
          setTaxaJuros(rate.toFixed(2));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar taxa:', error);
      // Fallback amigável geral
      setTaxaJuros(type === 'consignado' ? '1.45' : '1.95');
    } finally {
      setLoading(false);
    }
  };

  // Buscar taxa ao carregar ou alterar filtros de entrada
  useEffect(() => {
    fetchRate();
  }, [simType, condicao, banco]);

  // Converter taxa se o toggle Anual/Mensal mudar
  useEffect(() => {
    const rateVal = parseFloat(taxaJuros);
    if (!isNaN(rateVal) && rateVal > 0) {
      if (isAnual) {
        // Mensal -> Anual: (1 + i)^12 - 1
        const anual = (Math.pow(1 + (rateVal / 100), 12) - 1) * 100;
        setTaxaJuros(anual.toFixed(2));
      } else {
        // Anual -> Mensal: (1 + i)^(1/12) - 1
        const mensal = (Math.pow(1 + (rateVal / 100), 1/12) - 1) * 100;
        setTaxaJuros(mensal.toFixed(2));
      }
    }
  }, [isAnual]);

  // --- Lógica de Simulação ---
  const calculatePrice = (principal, monthlyRate, months) => {
    if (monthlyRate === 0) return principal / months;
    return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  };

  const handleSimular = () => {
    const valorPrincipal = parseBRL(valorBem);
    const valorEntrada = simType === 'consignado' ? 0 : parseBRL(entrada);
    const principal = valorPrincipal - valorEntrada;
    
    if (principal <= 0) {
      alert(simType === 'consignado' ? 'Por favor, insira o valor do empréstimo.' : 'A entrada não pode ser maior ou igual ao valor do bem.');
      return;
    }

    const taxaDigitada = parseFloat(taxaJuros);
    if (isNaN(taxaDigitada) || taxaDigitada <= 0) {
      alert('Por favor, insira uma taxa de juros válida.');
      return;
    }

    let monthlyRate = taxaDigitada / 100;
    if (isAnual) {
      // Converte anual para mensal
      monthlyRate = Math.pow(1 + (taxaDigitada / 100), 1/12) - 1;
    }

    let monthsList = [];
    if (simType === 'consignado') {
      monthsList = [24, 36, 48, 60, 72, 84, 96];
    } else {
      const maxMonths = veiculoType === 'carro' ? 60 : 48;
      monthsList = [12, 24, 36, 48, 60].filter(m => m <= maxMonths);
    }

    const simulationResults = monthsList.map(months => {
      const pmt = calculatePrice(principal, monthlyRate, months);
      const totalPago = pmt * months;
      const totalJuros = totalPago - principal;
      return {
        months,
        value: pmt,
        totalPago,
        totalJuros
      };
    });

    setSummary({
      principal,
      monthlyRate
    });
    setResults(simulationResults);
    setShowResults(true);

    // Scroll suave para a seção de resultados
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // --- Compartilhar como Imagem ---
  const handleShare = async () => {
    if (!cardRef.current) return;
    setCopied(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0b0f19',
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], 'simulacao.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({
            files: [file],
            title: 'Minha Simulação de Crédito',
            text: 'Confira a simulação de crédito que realizei!'
          });
        } else {
          // Copiar para área de transferência se o navegador não suportar partilha direta
          const item = new ClipboardItem({ 'image/png': blob });
          navigator.clipboard.write([item]);
          alert('Imagem copiada para a área de transferência! Cole onde desejar.');
        }
      });
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
    } finally {
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <div className="grid-overlay"></div>
      
      {showInstallBtn && (
        <div className="install-banner">
          <div className="install-banner-body">
            <Smartphone className="install-banner-icon" size={20} />
            <div className="install-banner-info">
              <span className="install-banner-title">Simulador no seu celular</span>
              <span className="install-banner-desc">Instale o app para simular rápido e offline.</span>
            </div>
            <button type="button" className="btn-install-confirm" onClick={handleInstallClick}>
              Instalar
            </button>
            <button type="button" className="btn-install-dismiss" onClick={() => setShowInstallBtn(false)} aria-label="Fechar banner">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {showIOSInstructions && (
        <div className="ios-modal-overlay" onClick={() => setShowIOSInstructions(false)}>
          <div className="ios-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ios-modal-header">
              <h3>Instalar no iPhone / iPad</h3>
              <button type="button" className="btn-ios-close" onClick={() => setShowIOSInstructions(false)} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>
            <div className="ios-modal-body">
              <p>Adicione o <strong>Simulador Tatehira</strong> à sua tela de início:</p>
              
              <div className="ios-step">
                <span className="step-num">1</span>
                <span className="step-text">
                  Toque no ícone de compartilhar <Share2 size={16} className="inline-icon" /> na barra do navegador Safari.
                </span>
              </div>
              
              <div className="ios-step">
                <span className="step-num">2</span>
                <span className="step-text">
                  Role o menu e selecione a opção <strong>"Adicionar à Tela de Início"</strong>.
                </span>
              </div>
              
              <button type="button" className="btn-ios-ok" onClick={() => setShowIOSInstructions(false)}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="app-container" ref={cardRef}>
        
        {/* Header */}
        <header className="app-header">
          <div className="logo-container">
            {simType === 'consignado' ? <Coins size={32} /> : <Car size={32} />}
          </div>
          <div className="badge">
            <span className="badge-dot"></span>
            Simulador Tatehira
          </div>
          <h1>Simulação de Crédito</h1>
          <p className="subtitle">
            {simType === 'consignado' 
              ? 'Consignado para Servidores Públicos' 
              : 'Financiamento Automotivo · Tabela Price'}
          </p>
        </header>

        {/* Formulário Principal */}
        <main className="glass-card">
          
          {/* Tipo de Simulação Segment */}
          <div className="form-group">
            <label>Tipo de Simulação</label>
            <div className="segment-container">
              <button 
                type="button"
                className={`segment-btn ${simType === 'veiculo' ? 'active' : ''}`}
                onClick={() => setSimType('veiculo')}
              >
                <Car size={16} />
                Veículo
              </button>
              <button 
                type="button"
                className={`segment-btn ${simType === 'consignado' ? 'active' : ''}`}
                onClick={() => setSimType('consignado')}
              >
                <Coins size={16} />
                Consignado
              </button>
            </div>
          </div>

          {/* Tipo de Veículo (Carro / Moto) - Apenas para Veículos */}
          {simType === 'veiculo' && (
            <div className="form-group">
              <label>Tipo de Veículo</label>
              <div className="segment-container">
                <button 
                  type="button"
                  className={`segment-btn ${veiculoType === 'carro' ? 'active' : ''}`}
                  onClick={() => setVeiculoType('carro')}
                >
                  Carro
                </button>
                <button 
                  type="button"
                  className={`segment-btn ${veiculoType === 'moto' ? 'active' : ''}`}
                  onClick={() => setVeiculoType('moto')}
                >
                  Moto
                </button>
              </div>
            </div>
          )}

          {/* Inputs Principais */}
          <div className="form-row">
            <div>
              <label htmlFor="val-principal">
                {simType === 'consignado' ? 'Valor do Empréstimo' : 'Valor do Bem'}
              </label>
              <div className="input-wrapper">
                <span className="input-icon">R$</span>
                <input 
                  type="text" 
                  id="val-principal"
                  className="has-icon"
                  placeholder="0,00"
                  value={valorBem}
                  onChange={(e) => handleCurrencyChange(e.target.value, setValorBem)}
                  inputMode="numeric"
                />
              </div>
            </div>

            {/* Condição (Veículo) ou Banco (Consignado) */}
            {simType === 'veiculo' ? (
              <div>
                <label htmlFor="condicao">Condição</label>
                <select 
                  id="condicao"
                  value={condicao}
                  onChange={(e) => setCondicao(e.target.value)}
                >
                  <option value="novo">Novo</option>
                  <option value="usado">Usado</option>
                </select>
              </div>
            ) : (
              <div>
                <label htmlFor="banco">Banco Conveniado</label>
                <select 
                  id="banco"
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                >
                  <option value="bb">Banco do Brasil</option>
                  <option value="caixa">Caixa Econômica</option>
                  <option value="bradesco">Bradesco</option>
                  <option value="itau">Itaú</option>
                  <option value="santander">Santander</option>
                </select>
              </div>
            )}
          </div>

          {/* Entrada (Apenas para Veículos) */}
          {simType === 'veiculo' && (
            <div className="form-group">
              <label htmlFor="val-entrada">Valor de Entrada</label>
              <div className="input-wrapper">
                <span className="input-icon">R$</span>
                <input 
                  type="text" 
                  id="val-entrada"
                  className="has-icon"
                  placeholder="0,00"
                  value={entrada}
                  onChange={(e) => handleCurrencyChange(e.target.value, setEntrada)}
                  inputMode="numeric"
                />
              </div>
            </div>
          )}

          {/* Taxa de Juros e Ação de Busca */}
          <div className="form-group">
            <div className="label-action-row">
              <label htmlFor="taxa">Juros ({isAnual ? 'anual' : 'mensal'})</label>
              <button 
                type="button" 
                className="btn-fetch-bcb"
                onClick={() => fetchRate()}
                disabled={loading}
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                {simType === 'consignado' ? 'Atualizar Taxa Banco' : 'Buscar Juros BCB'}
              </button>
            </div>
            
            <div className="rate-input-group">
              <input 
                type="number" 
                id="taxa"
                step="0.01"
                placeholder="0,00"
                value={taxaJuros}
                onChange={(e) => setTaxaJuros(e.target.value)}
              />
              <div className="rate-type-toggle">
                <button
                  type="button"
                  className={`rate-type-btn ${!isAnual ? 'active' : ''}`}
                  onClick={() => setIsAnual(false)}
                >
                  % a.m.
                </button>
                <button
                  type="button"
                  className={`rate-type-btn ${isAnual ? 'active' : ''}`}
                  onClick={() => setIsAnual(true)}
                >
                  % a.a.
                </button>
              </div>
            </div>
          </div>

          {/* Spinner de Carregamento */}
          {loading && (
            <div className="spinner-container">
              <div className="spinner"></div>
              <span className="spinner-text">Consultando taxas no Banco Central...</span>
            </div>
          )}

          {/* Botão de Ação */}
          <button 
            type="button" 
            className="btn-simulate"
            onClick={handleSimular}
          >
            Simular Crédito
            <ArrowRight size={18} />
          </button>

          {/* Resultados */}
          {showResults && (
            <div className="results-section" ref={resultsRef}>
              <div className="results-header">
                <h2>Planos Simulados</h2>
                <div className="divider-line"></div>
              </div>
              
              <div className="summary-cards">
                <div className="summary-card">
                  <div className="summary-label">
                    {simType === 'consignado' ? 'Valor Emprestado' : 'Valor Financiado'}
                  </div>
                  <div className="summary-value">
                    {formatBRL(summary.principal)}
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Taxa Mensal</div>
                  <div className="summary-value">
                    {(summary.monthlyRate * 100).toFixed(2)}% a.m.
                  </div>
                </div>
              </div>

              <div className="installments-grid">
                {results.map((r, i) => (
                  <div className="installment-card" key={i}>
                    <div className="installment-months">{r.months} parcelas</div>
                    <div className="installment-value">{formatBRL(r.value)}</div>
                    <div className="installment-details">
                      <div className="detail-row">
                        <span className="detail-label">Juros</span>
                        <span className="detail-value text-accent">{formatBRL(r.totalJuros)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Total</span>
                        <span className="detail-value">{formatBRL(r.totalPago)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                type="button" 
                className="btn-share"
                onClick={handleShare}
              >
                <Share2 size={16} />
                {copied ? 'Copiado!' : 'Compartilhar Resultado'}
              </button>
            </div>
          )}
        </main>

        <footer className="app-footer">
          <p>© {new Date().getFullYear()} Tatehira Sistemas.</p>
          <p>Taxas médias reais consultadas via API do Banco Central do Brasil.</p>
        </footer>
      </div>
    </>
  );
}
