class BudgetCalculator {
    constructor() {
        this.selectedServices = new Map();
        this.selectedFees = new Map();
        this.transportFee = null;
        this.discount = 0;
        this.installment = null;
        this.initializeEventListeners();
        this.updateSummary();
    }

    initializeEventListeners() {
        // Checkboxes de serviços
        const checkboxes = document.querySelectorAll('.service-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.handleServiceSelection(e.target);
            });
        });

        // Campos de horas
        const hoursFields = document.querySelectorAll('.hours-input');
        hoursFields.forEach(field => {
            field.addEventListener('input', (e) => {
                this.formatTimeInput(e.target);
                const serviceId = e.target.dataset.service;
                if (serviceId === 'transporte') {
                    this.handleTransportHoursChange(e.target);
                } else {
                    this.handleHoursChange(e.target);
                }
            });
            
            // Adicionar validação para horas
            field.addEventListener('blur', (e) => {
                this.validateTimeInput(e.target);
            });
        });

        // Campos de valor personalizado
        const customValueFields = document.querySelectorAll('.custom-value-input');
        customValueFields.forEach(field => {
            field.addEventListener('input', (e) => {
                this.formatCurrencyInput(e.target);
                this.handleCustomValueChange(e.target);
            });
            
            field.addEventListener('blur', (e) => {
                this.finalizeCurrencyFormat(e.target);
                this.handleCustomValueChange(e.target);
            });
        });

        // Campos de parcelamento
        const installmentFields = document.querySelectorAll('.installment-input');
        installmentFields.forEach(field => {
            // Remover qualquer event listener existente para evitar duplicação
            field.removeEventListener('input', this.handleInstallmentChange);
            field.removeEventListener('change', this.handleInstallmentChange);
            
            // Adicionar event listeners para input e change
            field.addEventListener('input', (e) => {
                this.handleInstallmentChange(e.target);
            });
            
            field.addEventListener('change', (e) => {
                this.handleInstallmentChange(e.target);
            });
        });

        // Seletores de preço (variants)
        const priceVariants = document.querySelectorAll('.price-variant');
        priceVariants.forEach(select => {
            select.addEventListener('change', (e) => {
                this.handlePriceVariantChange(e.target);
            });
        });

        // Botões de ação
        document.getElementById('clearAll').addEventListener('click', () => {
            this.clearAllServices();
        });

        document.getElementById('exportBudget').addEventListener('click', () => {
            this.exportBudget();
        });
    }

    handleServiceSelection(checkbox) {
        const serviceId = checkbox.dataset.service;
        const isCustom = checkbox.dataset.type === 'custom';
        const isInstallment = checkbox.dataset.type === 'installment';
        
        if (checkbox.checked) {
            if (isInstallment || serviceId === 'parcelamento') {
                const installmentFields = document.querySelectorAll('.installment-input');
                this.handleInstallmentSelection(checkbox, installmentFields, true);
            } else if (isCustom) {
                if (serviceId === 'transporte') {
                    const hoursField = document.querySelector(`.hours-input[data-service="${serviceId}"]`);
                    
                    // Ativar campo de horas
                    if (hoursField) {
                        hoursField.disabled = false;
                        hoursField.focus();
                    }

                    this.addTransportFee(serviceId, checkbox, hoursField);
                } else if (serviceId === 'desconto') {
                    const customValueField = document.querySelector(`.custom-value-input[data-service="${serviceId}"]`);
                    this.handleDiscountSelection(checkbox, customValueField, true);
                } else {
                    const customValueField = document.querySelector(`.custom-value-input[data-service="${serviceId}"]`);
                    
                    // Ativar campo de valor personalizado
                    if (customValueField) {
                        customValueField.disabled = false;
                        customValueField.focus();
                    }

                    this.addCustomFee(serviceId, checkbox, customValueField);
                }
            } else {
                const hoursField = document.querySelector(`.hours-input[data-service="${serviceId}"]`);
                const priceVariant = document.querySelector(`.price-variant[data-service="${serviceId}"]`);
                
                // Ativar campo de horas
                if (hoursField) {
                    hoursField.disabled = false;
                    hoursField.focus();
                }
                
                // Ativar variant de preço se existir
                if (priceVariant) {
                    priceVariant.disabled = false;
                }

                this.addService(serviceId, checkbox, hoursField, priceVariant);
            }
        } else {
            if (isInstallment || serviceId === 'parcelamento') {
                const installmentFields = document.querySelectorAll('.installment-input');
                this.handleInstallmentSelection(checkbox, installmentFields, false);
            } else if (isCustom) {
                if (serviceId === 'transporte') {
                    const hoursField = document.querySelector(`.hours-input[data-service="${serviceId}"]`);
                    
                    // Desativar campo de horas
                    if (hoursField) {
                        hoursField.disabled = true;
                        hoursField.value = '';
                    }

                    this.removeTransportFee();
                } else if (serviceId === 'desconto') {
                    const customValueField = document.querySelector(`.custom-value-input[data-service="${serviceId}"]`);
                    this.handleDiscountSelection(checkbox, customValueField, false);
                } else {
                    const customValueField = document.querySelector(`.custom-value-input[data-service="${serviceId}"]`);
                    
                    // Desativar campo de valor personalizado
                    if (customValueField) {
                        customValueField.disabled = true;
                        customValueField.value = '';
                    }

                    this.removeCustomFee(serviceId);
                }
            } else {
                const hoursField = document.querySelector(`.hours-input[data-service="${serviceId}"]`);
                const priceVariant = document.querySelector(`.price-variant[data-service="${serviceId}"]`);
                
                // Desativar campos
                if (hoursField) {
                    hoursField.disabled = true;
                    hoursField.value = '';
                }
                
                if (priceVariant) {
                    priceVariant.disabled = true;
                }

                this.removeService(serviceId);
            }
        }

        this.updateSummary();
    }

    handleHoursChange(hoursField) {
        const serviceId = hoursField.dataset.service;
        const service = this.selectedServices.get(serviceId);
        
        if (service) {
            service.hours = this.parseTimeToHours(hoursField.value);
            this.updateSummary();
        }
    }

    handlePriceVariantChange(priceVariant) {
        const serviceId = priceVariant.dataset.service;
        const service = this.selectedServices.get(serviceId);
        
        if (service) {
            service.pricePerHour = parseFloat(priceVariant.value);
            this.updateTransportRate();
            this.updateSummary();
        }
    }

    handleCustomValueChange(customValueField) {
        const serviceId = customValueField.dataset.service;
        const rawValue = this.parseCurrencyValue(customValueField.value);
        
        if (serviceId === 'desconto') {
            this.discount = rawValue;
        } else {
            const fee = this.selectedFees.get(serviceId);
            if (fee) {
                fee.price = rawValue;
            }
        }
        
        this.updateSummary();
    }

    addTransportFee(serviceId, checkbox, hoursField) {
        const serviceCard = checkbox.closest('.service-card');
        const serviceName = serviceCard.querySelector('.service-name').textContent;

        this.transportFee = {
            id: serviceId,
            name: serviceName,
            hours: hoursField ? this.parseTimeToHours(hoursField.value) : 0,
            rate: this.calculateTransportRate(),
            element: serviceCard
        };

        this.updateTransportCalculation();
    }

    removeTransportFee() {
        this.transportFee = null;
    }

    handleTransportHoursChange(hoursField) {
        if (this.transportFee) {
            this.transportFee.hours = this.parseTimeToHours(hoursField.value);
            this.transportFee.rate = this.calculateTransportRate();
            this.updateTransportCalculation();
            this.updateSummary();
        }
    }

    handleDiscountSelection(checkbox, customValueField, isSelected) {
        if (isSelected) {
            customValueField.disabled = false;
            customValueField.focus();
        } else {
            customValueField.disabled = true;
            customValueField.value = '';
            this.discount = 0;
        }
    }

    handleInstallmentSelection(checkbox, installmentFields, isSelected) {
        if (isSelected) {
            // Valores padrão
            const parcelasField = document.querySelector('.installment-input[data-field="parcelas"]');
            const jurosField = document.querySelector('.installment-input[data-field="juros"]');
            
            // Primeiro habilitar os campos
            installmentFields.forEach(field => {
                field.disabled = false;
                field.readOnly = false; // Garantir que não esteja como somente leitura
            });
            
            // Definir valores padrão se necessário
            if (parcelasField && (!parcelasField.value || parcelasField.value === '0')) {
                parcelasField.value = '2'; // Default to 2 installments
            }
            if (jurosField && (!jurosField.value || parseFloat(jurosField.value.replace(',', '.')) === 0)) {
                jurosField.value = '2,99'; // Default interest rate with comma as decimal separator
            }
            
            // Atualizar o objeto de parcelamento - garantir que os valores sejam numéricos
            const parcelas = parseInt(parcelasField.value) || 2;
            const juros = parseFloat(jurosField.value.replace(',', '.')) || 2.99;
            
            this.installment = {
                parcelas: parcelas,
                juros: juros
            };
            
            // Focar no campo de parcelas após um pequeno delay para garantir que o navegador processou as mudanças
            setTimeout(() => {
                parcelasField.focus();
                // Tentar selecionar todo o texto para facilitar a edição
                parcelasField.select();
            }, 50);
            
            // Force update summary to show installment calculation immediately
            this.updateSummary();
        } else {
            installmentFields.forEach(field => {
                field.disabled = true;
                field.value = '';
            });
            this.installment = null;
        }
    }

    handleInstallmentChange(field) {
        if (!this.installment) return;
        
        const fieldType = field.dataset.field;
        
        // Validate and set appropriate values
        if (fieldType === 'parcelas') {
            // Ensure parcelas is at least 1 and at most 24
            let value = parseInt(field.value) || 1;
            value = Math.max(1, Math.min(24, value));
            field.value = value.toString(); // Update field with validated value
            this.installment.parcelas = value;
        } else if (fieldType === 'juros') {
            // Ensure juros is at least 0 and has proper decimal format
            // Replace comma with period for proper parsing
            let value = parseFloat(field.value.replace(',', '.')) || 0;
            value = Math.max(0, Math.min(100, value)); // Cap at 100%
            field.value = value.toFixed(2).replace('.', ','); // Format with 2 decimal places using comma
            this.installment.juros = value; // Store the actual numeric value
        }
        
        this.updateSummary();
    }

    formatTimeInput(input) {
        let value = input.value.replace(/[^\d]/g, ''); // Remove tudo exceto números
        
        // Limita a 4 dígitos
        if (value.length > 4) {
            value = value.substring(0, 4);
        }
        
        // Adiciona dois pontos automaticamente após 2 dígitos
        if (value.length >= 3) {
            value = value.substring(0, 2) + ':' + value.substring(2);
        }
        
        input.value = value;
    }

    validateTimeInput(input) {
        const value = input.value;
        
        if (!value) {
            return;
        }
        
        // Regex para validar formato HH:MM
        const timeRegex = /^(\d{1,2}):(\d{2})$/;
        const match = value.match(timeRegex);
        
        if (match) {
            let hours = parseInt(match[1]);
            let minutes = parseInt(match[2]);
            
            // Validar minutos (0-59)
            if (minutes > 59) {
                minutes = 59;
            }
            
            // Formatar com zeros à esquerda
            const formattedTime = String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
            input.value = formattedTime;
        } else {
            // Se não estiver no formato correto, limpar o campo
            input.value = '';
        }
    }

    parseTimeToHours(timeString) {
        if (!timeString) return 0;
        
        const timeRegex = /^(\d{1,2}):(\d{2})$/;
        const match = timeString.match(timeRegex);
        
        if (match) {
            const hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            return hours + (minutes / 60);
        }
        
        return 0;
    }

    formatHoursToTime(hours) {
        const wholeHours = Math.floor(hours);
        const minutes = Math.round((hours - wholeHours) * 60);
        return String(wholeHours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
    }

    formatCurrencyInput(input) {
        let value = input.value.replace(/\D/g, ''); // Remove tudo que não é dígito
        
        if (value === '') {
            input.value = '';
            return;
        }
        
        // Converte para centavos
        value = parseInt(value) / 100;
        
        // Formata como moeda brasileira
        input.value = value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    finalizeCurrencyFormat(input) {
        if (input.value === '' || input.value === 'R$ 0,00') {
            input.value = '';
        }
    }

    parseCurrencyValue(currencyString) {
        if (!currencyString) return 0;
        
        // Remove R$, espaços e converte vírgula para ponto
        const cleanValue = currencyString
            .replace(/R\$\s?/g, '')
            .replace(/\./g, '')
            .replace(',', '.');
            
        return parseFloat(cleanValue) || 0;
    }

    calculateTransportRate() {
        // Calcular a taxa média dos serviços selecionados
        let totalRate = 0;
        let serviceCount = 0;
        
        this.selectedServices.forEach(service => {
            totalRate += service.pricePerHour;
            serviceCount++;
        });
        
        return serviceCount > 0 ? totalRate / serviceCount : 0;
    }

    updateTransportCalculation() {
        if (!this.transportFee) return;
        
        // Recalcular a taxa baseada nos serviços atuais
        this.transportFee.rate = this.calculateTransportRate();
    }

    addService(serviceId, checkbox, hoursField, priceVariant) {
        const serviceCard = checkbox.closest('.service-card');
        const serviceName = serviceCard.querySelector('.service-name').textContent;
        const defaultPrice = parseFloat(checkbox.dataset.price);
        const currentPrice = priceVariant ? parseFloat(priceVariant.value) : defaultPrice;

        const service = {
            id: serviceId,
            name: serviceName,
            pricePerHour: currentPrice,
            hours: hoursField ? this.parseTimeToHours(hoursField.value) : 0,
            element: serviceCard
        };

        this.selectedServices.set(serviceId, service);
        
        // Atualizar taxa de transporte se existir
        if (this.transportFee) {
            this.transportFee.rate = this.calculateTransportRate();
            this.updateTransportCalculation();
        }
    }

    addCustomFee(serviceId, checkbox, customValueField) {
        const serviceCard = checkbox.closest('.service-card');
        const serviceName = serviceCard.querySelector('.service-name').textContent;

        const fee = {
            id: serviceId,
            name: serviceName,
            price: customValueField ? (parseFloat(customValueField.value) || 0) : 0,
            element: serviceCard
        };

        this.selectedFees.set(serviceId, fee);
    }

    removeService(serviceId) {
        this.selectedServices.delete(serviceId);
        
        // Atualizar taxa de transporte se existir
        if (this.transportFee) {
            this.transportFee.rate = this.calculateTransportRate();
            this.updateTransportCalculation();
        }
    }

    removeCustomFee(serviceId) {
        this.selectedFees.delete(serviceId);
    }

    updateSummary() {
        this.updateServicesSection();
        this.updateFeesSection();
        this.updateDiscountSection();
        this.updateInstallmentSection();
        this.updateTotals();
    }

    updateServicesSection() {
        const servicesContainer = document.getElementById('selectedServices');
        servicesContainer.innerHTML = '';

        if (this.selectedServices.size === 0) {
            servicesContainer.innerHTML = '<p class="no-services">Nenhum serviço selecionado</p>';
            return;
        }

        this.selectedServices.forEach(service => {
            const serviceValue = service.hours * service.pricePerHour;
            const summaryElement = this.createServiceSummaryElement(service, serviceValue);
            servicesContainer.appendChild(summaryElement);
        });
    }

    updateFeesSection() {
        const feesContainer = document.getElementById('selectedFees');
        feesContainer.innerHTML = '';

        const hasRegularFees = this.selectedFees.size > 0;
        // CORREÇÃO: Verificar apenas se transportFee existe, não se tem horas ou total
        const hasTransportFee = this.transportFee !== null;

        if (!hasRegularFees && !hasTransportFee) {
            feesContainer.innerHTML = '<p class="no-services">Nenhuma taxa selecionada</p>';
            return;
        }

        // Adicionar taxas regulares primeiro
        this.selectedFees.forEach(fee => {
            const summaryElement = this.createFeeSummaryElement(fee);
            feesContainer.appendChild(summaryElement);
        });

        // CORREÇÃO: Adicionar taxa de transporte se existir, mesmo com 0 horas
        if (this.transportFee) {
            const transportSummary = this.createTransportSummaryElement();
            feesContainer.appendChild(transportSummary);
        }
    }

    updateDiscountSection() {
        const discountSection = document.getElementById('discountSection');
        const discountContainer = document.getElementById('selectedDiscount');
        const discountRow = document.getElementById('discountRow');
        
        if (this.discount > 0) {
            discountSection.style.display = 'block';
            discountRow.style.display = 'flex';
            
            discountContainer.innerHTML = `
                <div class="discount-summary">
                    <span class="discount-summary-name">Desconto aplicado</span>
                    <span class="discount-summary-value">- ${this.formatCurrency(this.discount)}</span>
                </div>
            `;
            
            document.getElementById('discountValue').textContent = `- ${this.formatCurrency(this.discount)}`;
        } else {
            discountSection.style.display = 'none';
            discountRow.style.display = 'none';
        }
    }

    updateInstallmentSection() {
        const installmentSection = document.getElementById('installmentSection');
        const installmentContainer = document.getElementById('selectedInstallment');
        const installmentTotalRow = document.getElementById('installmentTotalRow');
        
        if (this.installment) {
            const totalValue = this.calculateTotalValue();
            const installmentCalculation = this.calculateInstallment(totalValue, this.installment.parcelas, this.installment.juros);
            
            installmentSection.style.display = 'block';
            installmentTotalRow.style.display = 'flex';
            
            // Determine if we should show the interest calculation
            const showInterestCalculation = this.installment.parcelas > 1 && this.installment.juros > 0;
            
            installmentContainer.innerHTML = `
                <div class="installment-summary">
                    <div class="installment-summary-header">
                        <span>Parcelamento em ${this.installment.parcelas}x</span>
                        <span>Juros: ${this.installment.juros.toFixed(2)}%</span>
                    </div>
                    <div class="installment-summary-details">
                        <div class="installment-detail-row">
                            <span>Valor à vista:</span>
                            <span>${this.formatCurrency(totalValue)}</span>
                        </div>
                        <div class="installment-detail-row">
                            <span>Valor da parcela:</span>
                            <span>${this.formatCurrency(installmentCalculation.valorParcela)}</span>
                        </div>
                        ${showInterestCalculation ? `
                        <div class="installment-detail-row">
                            <span>Total com juros:</span>
                            <span>${this.formatCurrency(installmentCalculation.valorTotal)}</span>
                        </div>
                        <div class="installment-detail-row">
                            <span>Juros totais:</span>
                            <span>${this.formatCurrency(installmentCalculation.valorTotal - totalValue)}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            document.getElementById('installmentTotalValue').textContent = this.formatCurrency(installmentCalculation.valorTotal);
        } else {
            installmentSection.style.display = 'none';
            installmentTotalRow.style.display = 'none';
        }
    }

    calculateInstallment(valorTotal, numeroParcelas, taxaJuros) {
        if (numeroParcelas <= 1 || taxaJuros <= 0) {
            return {
                valorParcela: valorTotal,
                valorTotal: valorTotal
            };
        }
        
        // Aplicar a taxa de juros diretamente sobre o valor total
        const taxaJurosPorParcela = taxaJuros / 100;
        const valorTotalComJuros = valorTotal * (1 + taxaJurosPorParcela);
        const valorParcela = valorTotalComJuros / numeroParcelas;
        
        // Arredonda para duas casas decimais para evitar problemas de precisão
        return {
            valorParcela: Math.round(valorParcela * 100) / 100,
            valorTotal: Math.round(valorTotalComJuros * 100) / 100
        };
    }

    updateTotals() {
        const totalHoursElement = document.getElementById('totalHours');
        const subtotalServicesElement = document.getElementById('subtotalServices');
        const subtotalFeesElement = document.getElementById('subtotalFees');
        const totalValueElement = document.getElementById('totalValue');

        let totalHours = 0;
        let subtotalServices = 0;
        let subtotalFees = 0;

        // Calcular totais dos serviços
        this.selectedServices.forEach(service => {
            const serviceValue = service.hours * service.pricePerHour;
            totalHours += service.hours;
            subtotalServices += serviceValue;
        });

        // Calcular total das taxas
        this.selectedFees.forEach(fee => {
            subtotalFees += fee.price;
        });

        // Adicionar taxa de transporte
        if (this.transportFee) {
            const transportTotal = this.transportFee.hours * this.transportFee.rate;
            subtotalFees += transportTotal;
            totalHours += this.transportFee.hours;
        }

        const totalValue = subtotalServices + subtotalFees - this.discount;

        // Atualizar elementos
        totalHoursElement.textContent = this.formatHoursToTime(totalHours);
        subtotalServicesElement.textContent = this.formatCurrency(subtotalServices);
        subtotalFeesElement.textContent = this.formatCurrency(subtotalFees);
        totalValueElement.textContent = this.formatCurrency(totalValue);
    }

    createServiceSummaryElement(service, serviceValue) {
        const div = document.createElement('div');
        div.className = 'service-summary';
        
        div.innerHTML = `
            <span class="service-summary-name">${service.name}</span>
            <div class="service-summary-details">
                <span>${this.formatHoursToTime(service.hours)} × R$ ${service.pricePerHour.toFixed(2)}</span>
                <span class="service-summary-value">${this.formatCurrency(serviceValue)}</span>
            </div>
        `;

        return div;
    }

    createFeeSummaryElement(fee) {
        const div = document.createElement('div');
        div.className = 'fee-summary';
        
        div.innerHTML = `
            <span class="fee-summary-name">${fee.name}</span>
            <span class="fee-summary-value">${this.formatCurrency(fee.price)}</span>
        `;

        return div;
    }

    createTransportSummaryElement() {
        const div = document.createElement('div');
        div.className = 'transport-summary';
        
        const transportTotal = this.transportFee.hours * this.transportFee.rate;
        
        div.innerHTML = `
            <span class="transport-summary-name">${this.transportFee.name}</span>
            <div class="transport-summary-details">
                <span>${this.formatHoursToTime(this.transportFee.hours)} × ${this.formatCurrency(this.transportFee.rate)}</span>
                <span class="transport-summary-value">${this.formatCurrency(transportTotal)}</span>
            </div>
        `;

        return div;
    }

    clearAllServices() {
        const hasServices = this.selectedServices.size > 0 || this.selectedFees.size > 0 || this.transportFee;
        
        if (!hasServices) return;

        if (confirm('Tem certeza que deseja limpar todos os serviços e taxas selecionados?')) {
            // Limpar checkboxes e campos
            const checkboxes = document.querySelectorAll('.service-checkbox:checked');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
                
                const serviceId = checkbox.dataset.service;
                const isCustom = checkbox.dataset.type === 'custom';
                
                if (!isCustom) {
                    const hoursField = document.querySelector(`.hours-input[data-service="${serviceId}"]`);
                    const priceVariant = document.querySelector(`.price-variant[data-service="${serviceId}"]`);
                    
                    if (hoursField) {
                        hoursField.disabled = true;
                        hoursField.value = '';
                    }
                    
                    if (priceVariant) {
                        priceVariant.disabled = true;
                    }
                } else {
                    if (serviceId === 'transporte') {
                        const hoursField = document.querySelector(`.hours-input[data-service="${serviceId}"]`);
                        
                        if (hoursField) {
                            hoursField.disabled = true;
                            hoursField.value = '';
                        }
                    } else {
                        const customValueField = document.querySelector(`.custom-value-input[data-service="${serviceId}"]`);
                        
                        if (customValueField) {
                            customValueField.disabled = true;
                            customValueField.value = '';
                        }
                    }
                }
            });

            // Limpar parcelamento
            const installmentFields = document.querySelectorAll('.installment-input');
            installmentFields.forEach(field => {
                field.disabled = true;
                field.value = '';
            });

            // Limpar mapas
            this.selectedServices.clear();
            this.selectedFees.clear();
            this.transportFee = null;
            this.discount = 0;
            this.installment = null;
            this.updateSummary();
        }
    }

    exportBudget() {
        const hasItems = this.selectedServices.size > 0 || this.selectedFees.size > 0 || this.transportFee;
        
        if (!hasItems) {
            alert('Nenhum serviço ou taxa selecionado para exportar.');
            return;
        }

        let exportText = '=== ORÇAMENTO - SERVIÇOS AUDIOVISUAIS ===\n\n';
        exportText += `Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
        
        // Serviços
        if (this.selectedServices.size > 0) {
            exportText += 'SERVIÇOS SELECIONADOS:\n';
            exportText += '-'.repeat(50) + '\n';

            let totalHours = 0;
            let subtotalServices = 0;

            this.selectedServices.forEach(service => {
                const serviceValue = service.hours * service.pricePerHour;
                totalHours += service.hours;
                subtotalServices += serviceValue;

                exportText += `${service.name}\n`;
                exportText += `  • Tempo: ${this.formatHoursToTime(service.hours)}\n`;
                exportText += `  • Valor/hora: R$ ${service.pricePerHour.toFixed(2)}\n`;
                exportText += `  • Subtotal: ${this.formatCurrency(serviceValue)}\n\n`;
            });

            exportText += `Total de Tempo: ${this.formatHoursToTime(totalHours)}\n`;
            exportText += `Subtotal Serviços: ${this.formatCurrency(subtotalServices)}\n\n`;
        }

        // Taxas
        if (this.selectedFees.size > 0 || this.transportFee) {
            exportText += 'TAXAS DE SERVIÇO:\n';
            exportText += '-'.repeat(50) + '\n';

            let subtotalFees = 0;

            this.selectedFees.forEach(fee => {
                subtotalFees += fee.price;
                exportText += `${fee.name}: ${this.formatCurrency(fee.price)}\n`;
            });

            // Adicionar taxa de transporte na exportação
            if (this.transportFee) {
                const transportTotal = this.transportFee.hours * this.transportFee.rate;
                subtotalFees += transportTotal;
                exportText += `${this.transportFee.name}:\n`;
                exportText += `  • Tempo: ${this.formatHoursToTime(this.transportFee.hours)}\n`;
                exportText += `  • Valor/hora: ${this.formatCurrency(this.transportFee.rate)}\n`;
                exportText += `  • Subtotal: ${this.formatCurrency(transportTotal)}\n`;
            }

            exportText += `\nSubtotal Taxas: ${this.formatCurrency(subtotalFees)}\n\n`;
        }

        // Total final
        const totalValue = this.calculateTotalValue();
        exportText += '-'.repeat(50) + '\n';
        exportText += `VALOR À VISTA: ${this.formatCurrency(totalValue)}\n`;
        
        // Adicionar informações de parcelamento se existir
        if (this.installment && this.installment.parcelas > 1) {
            const installmentCalculation = this.calculateInstallment(totalValue, this.installment.parcelas, this.installment.juros);
            exportText += `\nPARCELAMENTO:\n`;
            exportText += `• ${this.installment.parcelas}x de ${this.formatCurrency(installmentCalculation.valorParcela)}\n`;
            exportText += `• Taxa de juros: ${this.installment.juros.toFixed(2)}% ao mês\n`;
            exportText += `• Valor total parcelado: ${this.formatCurrency(installmentCalculation.valorTotal)}\n`;
            exportText += `• Juros totais: ${this.formatCurrency(installmentCalculation.valorTotal - totalValue)}\n`;
        }
        
        exportText += '-'.repeat(50) + '\n\n';
        
        exportText += 'Observações:\n';
        exportText += '• Valores sujeitos a alteração conforme complexidade do projeto\n';
        exportText += '• Orçamento válido por 30 dias\n';
        exportText += '• Condições de pagamento a combinar\n\n';
        
        exportText += 'Gerado em: ' + new Date().toLocaleString('pt-BR');

        // Criar e baixar arquivo
        this.downloadTextFile(exportText, `orcamento_${Date.now()}.txt`);
    }

    calculateTotalValue() {
        let subtotalServices = 0;
        let subtotalFees = 0;

        this.selectedServices.forEach(service => {
            subtotalServices += service.hours * service.pricePerHour;
        });

        this.selectedFees.forEach(fee => {
            subtotalFees += fee.price;
        });

        // Adicionar taxa de transporte
        if (this.transportFee) {
            const transportTotal = this.transportFee.hours * this.transportFee.rate;
            subtotalFees += transportTotal;
        }

        return subtotalServices + subtotalFees - this.discount;
    }

    downloadTextFile(content, filename) {
        const element = document.createElement('a');
        const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    updateTransportRate() {
        if (this.transportFee) {
            this.transportFee.rate = this.calculateTransportRate();
            this.updateTransportCalculation();
        }
    }
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new BudgetCalculator();
});