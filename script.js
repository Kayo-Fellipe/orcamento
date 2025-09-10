// Array para armazenar os serviços
let services = [];

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    updateSummary();
    
    // Listeners para o formulário
    document.getElementById('addService').addEventListener('click', addService);
    document.getElementById('exportBudget').addEventListener('click', exportBudget);
    
    // Listeners para taxas
    document.getElementById('urgencyTax').addEventListener('change', updateSummary);
    document.getElementById('complexityTax').addEventListener('change', updateSummary);
    document.getElementById('installmentTax').addEventListener('change', toggleInstallmentFields);
    document.getElementById('installmentCount').addEventListener('input', updateInstallmentCalculation);
    document.getElementById('interestRate').addEventListener('input', updateInstallmentCalculation);
    
    // Enter key para adicionar serviço
    document.getElementById('serviceName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addService();
    });
    document.getElementById('servicePrice').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addService();
    });
    document.getElementById('serviceQuantity').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addService();
    });
});

function addService() {
    const name = document.getElementById('serviceName').value.trim();
    const price = parseFloat(document.getElementById('servicePrice').value) || 0;
    const quantity = parseInt(document.getElementById('serviceQuantity').value) || 1;
    
    if (!name || price <= 0) {
        alert('Por favor, preencha o nome do serviço e um preço válido.');
        return;
    }
    
    const service = {
        id: Date.now(),
        name: name,
        price: price,
        quantity: quantity
    };
    
    services.push(service);
    
    // Limpar formulário
    document.getElementById('serviceName').value = '';
    document.getElementById('servicePrice').value = '';
    document.getElementById('serviceQuantity').value = '1';
    
    updateServicesList();
    updateSummary();
    updateInstallmentCalculation();
}

function removeService(id) {
    services = services.filter(service => service.id !== id);
    updateServicesList();
    updateSummary();
    updateInstallmentCalculation();
}

function updateServicesList() {
    const servicesList = document.getElementById('servicesList');
    
    if (services.length === 0) {
        servicesList.innerHTML = '<p class="empty-state">Nenhum serviço adicionado ainda</p>';
        return;
    }
    
    servicesList.innerHTML = services.map(service => `
        <div class="service-item">
            <div class="service-info">
                <h4>${service.name}</h4>
                <p>Quantidade: ${service.quantity} | Preço unitário: R$ ${service.price.toFixed(2).replace('.', ',')}</p>
            </div>
            <div style="display: flex; align-items: center;">
                <span class="service-price">R$ ${(service.price * service.quantity).toFixed(2).replace('.', ',')}</span>
                <button class="remove-service" onclick="removeService(${service.id})">Remover</button>
            </div>
        </div>
    `).join('');
}

function toggleInstallmentFields() {
    const checkbox = document.getElementById('installmentTax');
    const fields = document.getElementById('installmentFields');
    
    if (checkbox.checked) {
        fields.style.display = 'block';
        updateInstallmentCalculation();
    } else {
        fields.style.display = 'none';
        updateSummary(); // Atualiza o resumo sem parcelamento
    }
}

function updateInstallmentCalculation() {
    const installmentCount = parseInt(document.getElementById('installmentCount').value) || 2;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    
    // Pega o valor total atual do orçamento
    const currentTotal = calculateCurrentTotal();
    
    if (currentTotal <= 0) {
        document.getElementById('installmentSummary').innerHTML = `
            <h4>Resumo do Parcelamento</h4>
            <p style="color: #666; font-style: italic;">Adicione serviços ao orçamento para calcular o parcelamento</p>
        `;
        return;
    }
    
    // Calcula o parcelamento
    let installmentValue, totalWithInterest;
    
    if (interestRate === 0) {
        // Sem juros - divisão simples
        installmentValue = currentTotal / installmentCount;
        totalWithInterest = currentTotal;
    } else {
        // Com juros - fórmula do sistema Price
        const monthlyRate = interestRate / 100;
        const factor = Math.pow(1 + monthlyRate, installmentCount);
        installmentValue = currentTotal * (monthlyRate * factor) / (factor - 1);
        totalWithInterest = installmentValue * installmentCount;
    }
    
    const totalInterest = totalWithInterest - currentTotal;
    
    // Atualiza o resumo
    document.getElementById('installmentSummary').innerHTML = `
        <h4>Resumo do Parcelamento</h4>
        <div class="summary-item">
            <span class="summary-label">Valor à vista:</span>
            <span class="summary-value">R$ ${currentTotal.toFixed(2).replace('.', ',')}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Parcelas:</span>
            <span class="summary-value">${installmentCount}x de R$ ${installmentValue.toFixed(2).replace('.', ',')}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Total com juros:</span>
            <span class="summary-value">R$ ${totalWithInterest.toFixed(2).replace('.', ',')}</span>
        </div>
        ${totalInterest > 0 ? `
        <div class="summary-item">
            <span class="summary-label">Juros totais:</span>
            <span class="summary-value" style="color: #dc3545;">R$ ${totalInterest.toFixed(2).replace('.', ',')}</span>
        </div>
        ` : ''}
    `;
    
    // Atualiza o resumo geral
    updateSummary();
}

function calculateCurrentTotal() {
    let total = 0;
    
    // Soma todos os serviços
    services.forEach(service => {
        total += service.price * service.quantity;
    });
    
    // Aplica taxas se marcadas
    if (document.getElementById('urgencyTax').checked) {
        total *= 1.20; // 20% de taxa de urgência
    }
    
    if (document.getElementById('complexityTax').checked) {
        total *= 1.15; // 15% de taxa de complexidade
    }
    
    return total;
}

function updateSummary() {
    let total = calculateCurrentTotal();
    
    // Se o parcelamento estiver ativo, mostra o valor parcelado
    const installmentActive = document.getElementById('installmentTax').checked;
    if (installmentActive) {
        const installmentCount = parseInt(document.getElementById('installmentCount').value) || 2;
        const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
        
        if (interestRate === 0) {
            const installmentValue = total / installmentCount;
            document.getElementById('totalPrice').textContent = 
                `${installmentCount}x de R$ ${installmentValue.toFixed(2).replace('.', ',')} = R$ ${total.toFixed(2).replace('.', ',')}`;
        } else {
            const monthlyRate = interestRate / 100;
            const factor = Math.pow(1 + monthlyRate, installmentCount);
            const installmentValue = total * (monthlyRate * factor) / (factor - 1);
            const totalWithInterest = installmentValue * installmentCount;
            
            document.getElementById('totalPrice').textContent = 
                `${installmentCount}x de R$ ${installmentValue.toFixed(2).replace('.', ',')} = R$ ${totalWithInterest.toFixed(2).replace('.', ',')}`;
        }
    } else {
        document.getElementById('totalPrice').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }
}

function exportBudget() {
    if (services.length === 0) {
        alert('Adicione pelo menos um serviço antes de exportar o orçamento.');
        return;
    }
    
    let exportText = 'ORÇAMENTO DETALHADO\n';
    exportText += '==================\n\n';
    
    exportText += 'SERVIÇOS:\n';
    services.forEach((service, index) => {
        exportText += `${index + 1}. ${service.name}\n`;
        exportText += `   Quantidade: ${service.quantity}\n`;
        exportText += `   Preço unitário: R$ ${service.price.toFixed(2).replace('.', ',')}\n`;
        exportText += `   Subtotal: R$ ${(service.price * service.quantity).toFixed(2).replace('.', ',')}\n\n`;
    });
    
    let subtotal = services.reduce((sum, service) => sum + (service.price * service.quantity), 0);
    exportText += `SUBTOTAL: R$ ${subtotal.toFixed(2).replace('.', ',')}\n\n`;
    
    // Taxas
    if (document.getElementById('urgencyTax').checked || document.getElementById('complexityTax').checked) {
        exportText += 'TAXAS APLICADAS:\n';
        if (document.getElementById('urgencyTax').checked) {
            exportText += `- Taxa de Urgência (20%): R$ ${(subtotal * 0.20).toFixed(2).replace('.', ',')}\n`;
        }
        if (document.getElementById('complexityTax').checked) {
            exportText += `- Taxa de Complexidade (15%): R$ ${(subtotal * 0.15).toFixed(2).replace('.', ',')}\n`;
        }
        exportText += '\n';
    }
    
    const total = calculateCurrentTotal();
    
    // Parcelamento
    if (document.getElementById('installmentTax').checked) {
        const installmentCount = parseInt(document.getElementById('installmentCount').value) || 2;
        const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
        
        exportText += 'PARCELAMENTO:\n';
        exportText += `Valor à vista: R$ ${total.toFixed(2).replace('.', ',')}\n`;
        
        if (interestRate === 0) {
            const installmentValue = total / installmentCount;
            exportText += `${installmentCount}x de R$ ${installmentValue.toFixed(2).replace('.', ',')} (sem juros)\n`;
            exportText += `Total: R$ ${total.toFixed(2).replace('.', ',')}\n\n`;
        } else {
            const monthlyRate = interestRate / 100;
            const factor = Math.pow(1 + monthlyRate, installmentCount);
            const installmentValue = total * (monthlyRate * factor) / (factor - 1);
            const totalWithInterest = installmentValue * installmentCount;
            const totalInterest = totalWithInterest - total;
            
            exportText += `${installmentCount}x de R$ ${installmentValue.toFixed(2).replace('.', ',')} (${interestRate}% a.m.)\n`;
            exportText += `Total com juros: R$ ${totalWithInterest.toFixed(2).replace('.', ',')}\n`;
            exportText += `Juros totais: R$ ${totalInterest.toFixed(2).replace('.', ',')}\n\n`;
        }
    }
    
    exportText += `VALOR TOTAL: R$ ${total.toFixed(2).replace('.', ',')}\n`;
    exportText += `\nData: ${new Date().toLocaleDateString('pt-BR')}\n`;
    
    // Criar e baixar arquivo
    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orcamento_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}