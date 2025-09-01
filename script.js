document.addEventListener('DOMContentLoaded', () => {

    // --- COLE A URL DO SEU SCRIPT DO GOOGLE SHEETS AQUI ---
    const GOOGLE_SHEET_URL = 'COLE_A_SUA_URL_DO_GOOGLE_SHEET_AQUI';
    // -----------------------------------------------------------

    // Elementos de Navegação e Páginas
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page-content');
    
    // Elementos da Página de Produção
    const abrirPopupBtn = document.getElementById('abrir-popup-btn');
    const fecharPopupBtn = document.getElementById('fechar-popup-btn');
    const gerarPdfBtn = document.getElementById('gerar-pdf-btn');
    const popupOverlay = document.getElementById('popup-overlay');
    const formProducao = document.getElementById('form-producao');
    const tabelaMateriaPrimaBody = document.querySelector('#tabela-materia-prima tbody');
    const tabelaProducaoBody = document.querySelector('#tabela-producao tbody');
    const mpStatusRow = document.getElementById('mp-status-row');
    const prodStatusRow = document.getElementById('prod-status-row');

    // Elementos da Página de Manuais de BPF
    const abrirBpfPopupBtn = document.getElementById('abrir-bpf-popup-btn');
    const fecharBpfPopupBtn = document.getElementById('fechar-bpf-popup-btn');
    const bpfPopupOverlay = document.getElementById('bpf-popup-overlay');
    const formBpf = document.getElementById('form-bpf');
    const manualDisplayContainer = document.getElementById('manual-display-container');
    const manualContent = document.getElementById('manual-content');
    const manualPlaceholder = document.getElementById('manual-placeholder');
    const gerarBpfPdfBtn = document.getElementById('gerar-bpf-pdf-btn');
    
    // Elementos Comuns
    const logoUpload = document.getElementById('logo-upload');
    const logoImg = document.getElementById('logo-img');
    const establishmentNameInput = document.getElementById('establishment-name');
    const establishmentCnpjInput = document.getElementById('establishment-cnpj');
    const establishmentPhoneInput = document.getElementById('establishment-phone');
    
    let totalEntries = 0;

    // --- LÓGICA DE NAVEGAÇÃO ENTRE PÁGINAS ---
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const pageId = link.dataset.page;
            
            pages.forEach(page => page.classList.add('hidden'));
            document.getElementById(pageId).classList.remove('hidden');

            navLinks.forEach(nav => nav.classList.remove('active-link'));
            link.classList.add('active-link');
        });
    });

    // --- LÓGICA DA PÁGINA DE MANUAIS DE BPF ---
    abrirBpfPopupBtn.addEventListener('click', () => bpfPopupOverlay.classList.remove('hidden'));
    fecharBpfPopupBtn.addEventListener('click', () => bpfPopupOverlay.classList.add('hidden'));

    formBpf.addEventListener('submit', e => {
        e.preventDefault();
        
        const title = document.getElementById('bpf-title').value;
        const manager = document.getElementById('bpf-manager').value;
        const objective = document.getElementById('bpf-objective').value;
        const hygiene = document.getElementById('bpf-hygiene').value;
        const pests = document.getElementById('bpf-pests').value;
        const handlers = document.getElementById('bpf-handlers').value;
        const water = document.getElementById('bpf-water').value;

        manualContent.innerHTML = `
            <h1 class="text-center">${title}</h1>
            <p class="text-center font-semibold">Responsável Técnico: ${manager}</p>
            <br>
            <h2>1. Objetivo</h2>
            <p>${objective.replace(/\n/g, '<br>')}</p>
            <h2>2. Higienização de Equipamentos e Utensílios</h2>
            <p>${hygiene.replace(/\n/g, '<br>')}</p>
            <h2>3. Controle Integrado de Pragas</h2>
            <p>${pests.replace(/\n/g, '<br>')}</p>
            <h2>4. Higiene e Saúde dos Manipuladores</h2>
            <p>${handlers.replace(/\n/g, '<br>')}</p>
            <h2>5. Controle da Água de Abastecimento</h2>
            <p>${water.replace(/\n/g, '<br>')}</p>
        `;
        
        manualPlaceholder.classList.add('hidden');
        manualDisplayContainer.classList.remove('hidden');
        
        bpfPopupOverlay.classList.add('hidden');
        formBpf.reset();
    });

    gerarBpfPdfBtn.addEventListener('click', () => {
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
            alert('A biblioteca de geração de PDF não foi carregada. Verifique a sua conexão com a internet.');
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const content = manualContent;

        doc.html(content, {
            callback: function(doc) {
                doc.save('Manual_BPF.pdf');
            },
            x: 15,
            y: 15,
            width: 170,
            windowWidth: 650
        });
    });


    // --- LÓGICA DA PÁGINA DE PRODUÇÃO ---
    const formatCNPJ = (value) => value.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2').substring(0, 18);
    const formatPhone = (value) => value.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{4})$/, '$1-$2').substring(0, 15);
    establishmentCnpjInput.addEventListener('input', (e) => { e.target.value = formatCNPJ(e.target.value); });
    establishmentPhoneInput.addEventListener('input', (e) => { e.target.value = formatPhone(e.target.value); });
    const mostrarPopup = () => { popupOverlay.classList.remove('hidden'); requestAnimationFrame(() => popupOverlay.classList.remove('popup-enter')); };
    const esconderPopup = () => { popupOverlay.classList.add('popup-enter'); popupOverlay.addEventListener('transitionend', () => popupOverlay.classList.add('hidden'), { once: true }); };
    const updatePdfButton = () => { gerarPdfBtn.disabled = totalEntries === 0; };
    
    const adicionarDadosNaTela = (data, isNewEntry = false) => {
        const [dataLanc, dataReceb, tipo, corte, peso, lote] = data.materiaPrima;
        const novaLinhaMP = tabelaMateriaPrimaBody.insertRow(isNewEntry ? 0 : -1);
        novaLinhaMP.className = 'bg-white border-b hover:bg-gray-50';
        novaLinhaMP.innerHTML = `<td class="px-4 py-3">${dataLanc}</td><td class="px-4 py-3">${dataReceb}</td><td class="px-4 py-3 font-medium text-gray-900">${tipo}</td><td class="px-4 py-3">${corte}</td><td class="px-4 py-3">${peso}</td><td class="px-4 py-3">${lote}</td>`;
        const [dataProd, produto, pesoProd, loteProd, responsavel, loteOrigem] = data.producao;
        const novaLinhaProducao = tabelaProducaoBody.insertRow(isNewEntry ? 0 : -1);
        novaLinhaProducao.className = 'bg-white border-b hover:bg-gray-50';
        novaLinhaProducao.innerHTML = `<td class="px-4 py-3">${dataProd}</td><td class="px-4 py-3 font-medium text-gray-900">${produto}</td><td class="px-4 py-3">${pesoProd}</td><td class="px-4 py-3">${loteProd}</td><td class="px-4 py-3">${responsavel}</td><td class="px-4 py-3 text-blue-600 font-semibold">${loteOrigem}</td>`;
        totalEntries++;
        updatePdfButton();
    };
    
    const carregarDadosIniciais = async () => {
        if (GOOGLE_SHEET_URL === 'COLE_A_SUA_URL_DO_GOOGLE_SHEET_AQUI' || !GOOGLE_SHEET_URL) { mpStatusRow.querySelector('td').textContent = 'URL da planilha não configurada no script.js'; prodStatusRow.querySelector('td').textContent = 'URL da planilha não configurada no script.js'; return; }
        mpStatusRow.querySelector('td').textContent = 'A carregar dados da planilha...'; prodStatusRow.querySelector('td').textContent = 'A carregar dados da planilha...';
        try {
            const response = await fetch(GOOGLE_SHEET_URL); const result = await response.json();
            if (result.status === 'success' && result.data) {
                tabelaMateriaPrimaBody.innerHTML = ''; tabelaProducaoBody.innerHTML = ''; totalEntries = 0;
                const { materiaPrima, producao } = result.data;
                if (materiaPrima.length > 0) { materiaPrima.forEach((row, index) => { if (producao[index]) { adicionarDadosNaTela({ materiaPrima: row, producao: producao[index] }); } }); }
                if (totalEntries === 0) { tabelaMateriaPrimaBody.innerHTML = `<tr id="mp-status-row"><td colspan="6" class="text-center py-4 text-gray-500">Nenhum dado lançado ainda.</td></tr>`; tabelaProducaoBody.innerHTML = `<tr id="prod-status-row"><td colspan="6" class="text-center py-4 text-gray-500">Nenhum dado lançado ainda.</td></tr>`; }
            } else { throw new Error(result.message || 'Falha ao carregar os dados.'); }
        } catch (error) { console.error('Erro ao carregar dados da planilha:', error); tabelaMateriaPrimaBody.innerHTML = `<tr id="mp-status-row"><td colspan="6" class="text-center py-4 text-gray-500">Erro ao carregar dados. Verifique o console.</td></tr>`; tabelaProducaoBody.innerHTML = `<tr id="prod-status-row"><td colspan="6" class="text-center py-4 text-gray-500">Erro ao carregar dados. Verifique o console.</td></tr>`; }
    };
    
    formProducao.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (GOOGLE_SHEET_URL === 'COLE_A_SUA_URL_DO_GOOGLE_SHEET_AQUI' || !GOOGLE_SHEET_URL) { alert('CONFIGURAÇÃO NECESSÁRIA:\n\nCole a URL do seu App Script na constante "GOOGLE_SHEET_URL" no topo do arquivo script.js.'); return; }
        const submitButton = formProducao.querySelector('button[type="submit"]'); submitButton.disabled = true; submitButton.textContent = 'A salvar...';
        const dataRecebimento = document.getElementById('data-recebimento').value; const dataProducao = document.getElementById('data-producao').value;
        const dadosPayload = { materiaPrima: [new Date().toLocaleDateString('pt-BR'), new Date(dataRecebimento + 'T00:00:00').toLocaleDateString('pt-BR'), document.getElementById('tipo-materia-prima').value, document.getElementById('corte-materia-prima').value, parseFloat(document.getElementById('peso-materia-prima').value).toFixed(2), document.getElementById('lote-materia-prima').value], producao: [new Date(dataProducao + 'T00:00:00').toLocaleDateString('pt-BR'), document.getElementById('produto-final').value, parseFloat(document.getElementById('peso-produzido').value).toFixed(2), document.getElementById('lote-produto-final').value, document.getElementById('responsavel').value, document.getElementById('lote-materia-prima').value] };
        try {
            await fetch(GOOGLE_SHEET_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dadosPayload) });
            console.log('Dados enviados para o Google Sheets.'); if (totalEntries === 0) { tabelaMateriaPrimaBody.innerHTML = ''; tabelaProducaoBody.innerHTML = ''; }
            adicionarDadosNaTela(dadosPayload, true); formProducao.reset(); esconderPopup();
        } catch (error) { console.error('Erro ao enviar dados:', error); alert('Houve um erro de rede ao salvar os dados. Verifique a sua conexão e o console.'); } finally { submitButton.disabled = false; submitButton.textContent = 'Salvar Lançamento'; }
    });
    
    logoUpload.addEventListener('change', (event) => { const file = event.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = (e) => { logoImg.src = e.target.result; }; reader.readAsDataURL(file); } });
    
    abrirPopupBtn.addEventListener('click', mostrarPopup);
    fecharPopupBtn.addEventListener('click', esconderPopup);
    
    gerarPdfBtn.addEventListener('click', () => {
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
            alert('A biblioteca de geração de PDF não foi carregada. Verifique a sua conexão com a internet.');
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF(); 
        const establishmentName = establishmentNameInput.value; 
        const establishmentAddress = document.getElementById('establishment-address').value; 
        const establishmentCity = document.getElementById('establishment-city').value; 
        const establishmentPhone = document.getElementById('establishment-phone').value; 
        const establishmentCnpj = document.getElementById('establishment-cnpj').value; 
        const generationDate = new Date().toLocaleDateString('pt-BR');
        
        let currentY = 15;
        try { if (logoImg.src && !logoImg.src.includes('placehold.co')) doc.addImage(logoImg, 'PNG', 14, currentY, 20, 20); } catch (e) { console.error("Erro ao adicionar a logo no PDF:", e); }
        doc.setFontSize(16); doc.text(establishmentName, 40, currentY + 8); doc.setFontSize(9); doc.setTextColor(100); doc.text(`Relatório gerado em: ${generationDate}`, 40, currentY + 14); currentY += 25;
        const detailsLine1 = [establishmentAddress, establishmentCity].filter(Boolean).join(' - '); if (detailsLine1) { doc.text(detailsLine1, 14, currentY); currentY += 5; }
        const detailsLine2 = [establishmentPhone ? `Tel: ${establishmentPhone}` : '', establishmentCnpj ? `CNPJ: ${establishmentCnpj}` : ''].filter(Boolean).join(' | '); if (detailsLine2) { doc.text(detailsLine2, 14, currentY); currentY += 5; }
        currentY += 8;
        doc.autoTable({ html: '#tabela-materia-prima', startY: currentY, headStyles: { fillColor: [52, 73, 94] }, didDrawPage: data => { doc.setFontSize(12); doc.setTextColor(0); doc.text('Relatório de Matéria-Prima', data.settings.margin.left, currentY - 5); } });
        currentY = doc.lastAutoTable.finalY + 12;
        doc.setFontSize(12); doc.setTextColor(0); doc.text('Relatório de Produção Final', 14, currentY); currentY += 5;
        doc.autoTable({ html: '#tabela-producao', startY: currentY, headStyles: { fillColor: [39, 174, 96] } });
        doc.save(`relatorio-producao-${generationDate}.pdf`);
    });

    // Inicia o carregamento dos dados assim que a página estiver pronta.
    carregarDadosIniciais();
});

