class BudgetCalculator {
    constructor() {
        this.selectedServices = new Map();
        this.selectedFees = new Map();
        this.transportFee = null;
        this.discount = 0;
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
                const serviceId = e.target.dataset.service;
                if (serviceId === 'transporte') {
                    this.handleTransportHoursChange(e.target);
                } else {
                    this.handleHoursChange(e.target);
                }
            });
            
            // Adicionar validação para horas
            field.addEventListener('blur', (e) => {
                this.validateAndFormatHours(e.target);
            });
        });

        // Campos de valor personalizado
        const customValueFields = document.querySelectorAll('.custom-value-input');
        customValueFields.forEach(field => {
            field.addEventListener('input', (e) => {
                this.handleCustomValueChange(e.target);
            });
            
            // Adicionar formatação de moeda
            field.addEventListener('input', (e) => {
                this.formatCurrencyInput(e.target);
            });
            
            field.addEventListener('blur', (e) => {
                this.finalizeCurrencyFormat(e.target);
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
        
        if (checkbox.checked) {
            if (isCustom) {
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
            if (isCustom) {
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
            service.hours = parseFloat(hoursField.value) || 0;
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
            hours: hoursField ? (parseFloat(hoursField.value) || 0) : 0,
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
            this.transportFee.hours = parseFloat(hoursField.value) || 0;
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
            hours: hoursField ? (parseFloat(hoursField.value) || 0) : 0,
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
        const hasTransportFee = this.transportFee && this.transportFee.total > 0;

        if (!hasRegularFees && !hasTransportFee) {
            feesContainer.innerHTML = '<p class="no-services">Nenhuma taxa selecionada</p>';
            return;
        }

        this.selectedFees.forEach(fee => {
            const summaryElement = this.createFeeSummaryElement(fee);
            feesContainer.appendChild(summaryElement);
        });

        // Adicionar taxa de transporte se existir
        if (this.transportFee && this.transportFee.hours > 0) {
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
        totalHoursElement.textContent = totalHours.toFixed(1) + 'h';
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
                <span>${service.hours}h × R$ ${service.pricePerHour.toFixed(2)}</span>
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
                <span>${this.transportFee.hours}h × ${this.formatCurrency(this.transportFee.rate)}</span>
                <span class="transport-summary-value">${this.formatCurrency(transportTotal)}</span>
            </div>
        `;

        return div;
    }

    clearAllServices() {
        const hasServices = this.selectedServices.size > 0 || this.selectedFees.size > 0;
        
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

            // Limpar mapas
            this.selectedServices.clear();
            this.selectedFees.clear();
            this.transportFee = null;
            this.discount = 0;
            this.updateSummary();
        }
    }

    exportBudget() {
        const hasItems = this.selectedServices.size > 0 || this.selectedFees.size > 0;
        
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
                exportText += `  • Horas: ${service.hours}h\n`;
                exportText += `  • Valor/hora: R$ ${service.pricePerHour.toFixed(2)}\n`;
                exportText += `  • Subtotal: ${this.formatCurrency(serviceValue)}\n\n`;
            });

            exportText += `Total de Horas: ${totalHours.toFixed(1)}h\n`;
            exportText += `Subtotal Serviços: ${this.formatCurrency(subtotalServices)}\n\n`;
        }

        // Taxas
        if (this.selectedFees.size > 0 || (this.transportFee && this.transportFee.hours > 0)) {
            exportText += 'TAXAS DE SERVIÇO:\n';
            exportText += '-'.repeat(50) + '\n';

            let subtotalFees = 0;

            this.selectedFees.forEach(fee => {
                subtotalFees += fee.price;
                exportText += `${fee.name}: ${this.formatCurrency(fee.price)}\n`;
            });

            // Adicionar taxa de transporte na exportação
            if (this.transportFee && this.transportFee.hours > 0) {
                const transportTotal = this.transportFee.hours * this.transportFee.rate;
                subtotalFees += transportTotal;
                exportText += `${this.transportFee.name}:\n`;
                exportText += `  • Horas: ${this.transportFee.hours}h\n`;
                exportText += `  • Valor/hora: ${this.formatCurrency(this.transportFee.rate)}\n`;
                exportText += `  • Subtotal: ${this.formatCurrency(transportTotal)}\n`;
            }

            exportText += `\nSubtotal Taxas: ${this.formatCurrency(subtotalFees)}\n\n`;
        }

        // Total final
        const totalValue = this.calculateTotalValue();
        exportText += '-'.repeat(50) + '\n';
        exportText += `VALOR TOTAL: ${this.formatCurrency(totalValue)}\n`;
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
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new BudgetCalculator();
});