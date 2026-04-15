# Tatehira Sistemas - Simulador de Financiamento

Simulador de financiamento automotivo (Carros e Motos) desenvolvido com foco em performance, responsividade e precisão de dados.

##  Tecnologias Utilizadas
- **HTML5 & CSS3**: Estrutura semântica e estilização premium com Glassmorphism.
- **JavaScript (Vanilla)**: Lógica de cálculo e manipulação de DOM sem dependências externas.
- **API Banco Central (SGS)**: Consumo de dados reais para taxas de juros atualizadas.
- **Google Fonts (Outfit)**: Tipografia moderna.

##  Funcionalidades
- **Simulação Realista**: Valores baseados na Tabela Price.
- **Dados Reais**: Busca automática da taxa média de juros de veículos via Banco Central.
- **Ajuste de Condição**: Diferenciação inteligente de taxas para veículos Novos vs. Usados.
- **Responsividade**: Experiência mobile-first completa.
- **Personalização**: Suporte para Carros (até 60x) e Motos (até 48x).

##  Como Executar
1. Clone ou baixe este repositório.
2. Abra o arquivo `index.html` em qualquer navegador moderno.
3. Não requer instalação ou servidor backend.

##  Regras de Negócio
- **Taxa Mensal**: Obtida via API BCB (Série 25471).
- **Spread**:
  - Novo: Média BCB * 0.9 (estimativa de taxa preferencial).
  - Usado: Média BCB * 1.5 (estimativa de taxa de mercado para usados).
- **Parcelamento**:
  - Carro: 12x, 24x, 36x, 48x, 60x.
  - Moto: 12x, 24x, 36x, 48x.

---
Desenvolvido por **Tatehira Sistemas**.
