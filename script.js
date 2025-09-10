// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    updateSummary();
    
    // Listeners para taxas
    document.getElementById('urgencyTax').addEventListener('change', updateSummary);
    document.getElementById('complexityTax').addEventListener('change', updateSummary);
    document.getElementById('installmentTax').addEventListener('change', toggleInstallmentFields);
    document.getElementById('installmentCount').addEventListener('input', updateInstallmentCalculation);
    document.getElementById('interestRate').addEventListener('input', updateInstallmentCalculation);
});

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