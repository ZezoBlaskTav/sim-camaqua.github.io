document.addEventListener('DOMContentLoaded', () => {

    // --- PASSO IMPORTANTE: COLE A URL DO SEU SCRIPT DO GOOGLE AQUI ---
    const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbw7Qg184-qlg7hEwcOMKqDA6plQG05b8_ZlXDXWyqK7U7uigZchhw-y1dZuUhE6Okhk5w/exec';
    // --------------------------------------------------------------------

    const { jsPDF } = window.jspdf;

    const abrirPopupBtn = document.getElementById('abrir-popup-btn');
    const fecharPopupBtn = document.getElementById('fechar-popup-btn');
    const gerarPdfBtn = document.getElementById('gerar-pdf-btn');
    const popupOverlay = document.getElementById('popup-overlay');
    const formProducao = document.getElementById('form-producao');
    const tabelaMateriaPrimaBody = document.querySelector('#tabela-materia-prima tbody');
    const tabelaProducaoBody = document.querySelector('#tabela-producao tbody');
    const logoUpload = document.getElementById('logo-upload');
    const logoImg = document.getElementById('logo-img');
    const establishmentNameInput = document.getElementById('establishment-name');
    const establishmentCnpjInput = document.getElementById('establishment-cnpj');
    const establishmentPhoneInput = document.getElementById('establishment-phone');
    
    let isFirstEntryMP = true;
    let isFirstEntryProd = true;
    let totalEntries = 0;

    const formatCNPJ = (value) => {
        return value.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2').substring(0, 18);
    };

    const formatPhone = (value) => {
        return value.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{4})$/, '$1-$2').substring(0, 15);
    };

    establishmentCnpjInput.addEventListener('input', (e) => { e.target.value = formatCNPJ(e.target.value); });
    establishmentPhoneInput.addEventListener('input', (e) => { e.target.value = formatPhone(e.target.value); });

    function mostrarPopup() {
        popupOverlay.classList.remove('hidden');
        requestAnimationFrame(() => popupOverlay.classList.remove('popup-enter'));
    }

    function esconderPopup() {
        popupOverlay.classList.add('popup-enter');
        popupOverlay.addEventListener('transitionend', () => { popupOverlay.classList.add('hidden'); }, { once: true });
    }

    function updatePdfButton() {
        gerarPdfBtn.disabled = totalEntries === 0;
    }

    logoUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => { logoImg.src = e.target.result; };
            reader.readAsDataURL(file);
        }
    });

    abrirPopupBtn.addEventListener('click', mostrarPopup);
    fecharPopupBtn.addEventListener('click', esconderPopup);

    formProducao.addEventListener('submit', (event) => {
        event.preventDefault();

        // --- NOVA VERIFICAÇÃO PARA AJUDAR NO DEBUG ---
        if (GOOGLE_SHEET_URL === 'COLE_SUA_URL_AQUI' || !GOOGLE_SHEET_URL) {
            alert('CONFIGURAÇÃO NECESSÁRIA:\n\nPor favor, cole a URL do seu App Script do Google na constante "GOOGLE_SHEET_URL" no topo do arquivo script.js.');
            return; // Interrompe o envio se a URL não for definida
        }
        // --- FIM DA NOVA VERIFICAÇÃO ---

        const submitButton = formProducao.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';

        const hoje = new Date().toLocaleDateString('pt-BR');
        const dataRecebimento = document.getElementById('data-recebimento').value;
        const tipoMateriaPrima = document.getElementById('tipo-materia-prima').value;
        const corteMateriaPrima = document.getElementById('corte-materia-prima').value;
        const pesoMateriaPrima = parseFloat(document.getElementById('peso-materia-prima').value).toFixed(2);
        const loteMateriaPrima = document.getElementById('lote-materia-prima').value;

        const dataProducao = document.getElementById('data-producao').value;
        const produtoFinal = document.getElementById('produto-final').value;
        const pesoProduzido = parseFloat(document.getElementById('peso-produzido').value).toFixed(2);
        const loteProdutoFinal = document.getElementById('lote-produto-final').value;
        const responsavel = document.getElementById('responsavel').value;

        const dataRecebimentoFmt = new Date(dataRecebimento + 'T00:00:00').toLocaleDateString('pt-BR');
        const dataProducaoFmt = new Date(dataProducao + 'T00:00:00').toLocaleDateString('pt-BR');

        // --- LÓGICA DE ENVIO PARA O GOOGLE SHEETS ---
        const payload = {
            materiaPrima: {
                DataLançamento: hoje,
                DataRecebimento: dataRecebimentoFmt,
                Tipo: tipoMateriaPrima,
                Corte: corteMateriaPrima,
                PesoKg: pesoMateriaPrima,
                LoteMP: loteMateriaPrima
            },
            producao: {
                DataProdução: dataProducaoFmt,
                ProdutoFinal: produtoFinal,
                PesoProduzidoKg: pesoProduzido,
                LoteProdutoFinal: loteProdutoFinal,
                Responsavel: responsavel,
                LoteMPOrigem: loteMateriaPrima
            }
        };

        fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            console.log('Dados enviados para o Google Sheets. Verifique a planilha para confirmar o recebimento.');
        })
        .catch(error => {
            console.error('Erro ao enviar dados para o Google Sheets:', error);
            alert('Houve um erro de rede ao salvar os dados na planilha. Verifique sua conexão e o console para mais detalhes.');
        })
        .finally(() => {
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar Lançamento';
            
            adicionarDadosNaTela(payload, hoje, dataRecebimentoFmt, dataProducaoFmt);
            formProducao.reset();
            esconderPopup();
        });
    });

    function adicionarDadosNaTela(payload, hoje, dataRecebimentoFmt, dataProducaoFmt) {
        if (isFirstEntryMP) {
            tabelaMateriaPrimaBody.innerHTML = '';
            isFirstEntryMP = false;
        }
        const novaLinhaMP = tabelaMateriaPrimaBody.insertRow(0);
        novaLinhaMP.className = 'bg-white border-b hover:bg-gray-50';
        novaLinhaMP.innerHTML = `
            <td class="px-4 py-3">${hoje}</td>
            <td class="px-4 py-3">${dataRecebimentoFmt}</td>
            <td class="px-4 py-3 font-medium text-gray-900">${payload.materiaPrima.Tipo}</td>
            <td class="px-4 py-3">${payload.materiaPrima.Corte}</td>
            <td class="px-4 py-3">${payload.materiaPrima.PesoKg}</td>
            <td class="px-4 py-3">${payload.materiaPrima.LoteMP}</td>
        `;

        if (isFirstEntryProd) {
            tabelaProducaoBody.innerHTML = '';
            isFirstEntryProd = false;
        }
        const novaLinhaProducao = tabelaProducaoBody.insertRow(0);
        novaLinhaProducao.className = 'bg-white border-b hover:bg-gray-50';
        novaLinhaProducao.innerHTML = `
            <td class="px-4 py-3">${dataProducaoFmt}</td>
            <td class="px-4 py-3 font-medium text-gray-900">${payload.producao.ProdutoFinal}</td>
            <td class="px-4 py-3">${payload.producao.PesoProduzidoKg}</td>
            <td class="px-4 py-3">${payload.producao.LoteProdutoFinal}</td>
            <td class="px-4 py-3">${payload.producao.Responsavel}</td>
            <td class="px-4 py-3 text-blue-600 font-semibold">${payload.producao.LoteMPOrigem}</td>
        `;

        totalEntries++;
        updatePdfButton();
    }

    gerarPdfBtn.addEventListener('click', () => {
        const doc = new jsPDF();
        const establishmentName = establishmentNameInput.value;
        const establishmentAddress = document.getElementById('establishment-address').value;
        const establishmentCity = document.getElementById('establishment-city').value;
        const establishmentPhone = document.getElementById('establishment-phone').value;
        const establishmentCnpj = document.getElementById('establishment-cnpj').value;
        const generationDate = new Date().toLocaleDateString('pt-BR');

        let currentY = 15;
        try {
            if (logoImg.src && !logoImg.src.includes('placehold.co')) {
                doc.addImage(logoImg, 'PNG', 14, currentY, 20, 20);
            }
        } catch (e) { console.error("Erro ao adicionar a logo no PDF:", e); }

        doc.setFontSize(16);
        doc.text(establishmentName, 40, currentY + 8);
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Relatório gerado em: ${generationDate}`, 40, currentY + 14);
        currentY += 25;
        const detailsLine1 = [establishmentAddress, establishmentCity].filter(Boolean).join(' - ');
        if (detailsLine1) {
            doc.text(detailsLine1, 14, currentY);
            currentY += 5;
        }
        const detailsLine2 = [establishmentPhone ? `Tel: ${establishmentPhone}` : '', establishmentCnpj ? `CNPJ: ${establishmentCnpj}` : ''].filter(Boolean).join(' | ');
        if (detailsLine2) {
            doc.text(detailsLine2, 14, currentY);
            currentY += 5;
        }
        currentY += 8;

        doc.autoTable({
            html: '#tabela-materia-prima',
            startY: currentY,
            headStyles: { fillColor: [52, 73, 94] },
            didDrawPage: function(data) {
                doc.setFontSize(12);
                doc.setTextColor(0);
                doc.text('Relatório de Matéria-Prima', data.settings.margin.left, currentY - 5);
            }
        });

        currentY = doc.lastAutoTable.finalY + 12;
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text('Relatório de Produção Final', 14, currentY);
        currentY += 5;

        doc.autoTable({
            html: '#tabela-producao',
            startY: currentY,
            headStyles: { fillColor: [39, 174, 96] },
        });

        doc.save(`relatorio-producao-${generationDate}.pdf`);
    });
});

