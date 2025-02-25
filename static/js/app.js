pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const pdfHandler = new PDFHandler();
const compoundManager = new CompoundManager();
window.pdfHandler = pdfHandler;
window.compoundManager = compoundManager;

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('pdf', document.getElementById('pdfFile').files[0]);

    // Get values from individual BibTeX fields
    const bibtexData = {
        title: document.getElementById('titleInput').value,
        authors: document.getElementById('authorsInput').value,
        year: document.getElementById('yearInput').value,
        journal: document.getElementById('journalInput').value,
        volume: document.getElementById('volumeInput').value
    };

    formData.append('bibtexData', JSON.stringify(bibtexData));

    try {
        const response = await fetch('/api/pdfs', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            loadPDFList();
        }
    } catch (error) {
        console.error('Error uploading PDF:', error);
    }
});

async function loadPDFList() {
    try {
        const response = await fetch('/api/pdfs');
        const pdfs = await response.json();

        const pdfList = document.getElementById('pdfList');
        pdfList.innerHTML = pdfs.map(pdf => `
            <div class="list-group-item" onclick="loadPDF(${pdf.id})">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6>${pdf.title || 'Untitled'}</h6>
                        <small>${pdf.authors || 'Unknown authors'}</small>
                        <div class="text-muted">
                            ${pdf.journal ? `${pdf.journal}, ` : ''}
                            ${pdf.volume ? `Volume ${pdf.volume}, ` : ''}
                            ${pdf.year || ''}
                        </div>
                    </div>
                    <button onclick="deletePDF(${pdf.id}, event)" class="btn btn-danger btn-sm">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading PDF list:', error);
    }
}

async function loadPDF(id) {
    try {
        const response = await fetch(`/api/pdfs/${id}`);
        const pdfData = await response.arrayBuffer();
        await pdfHandler.loadDocument(pdfData);
        compoundManager.loadCompounds(id);
    } catch (error) {
        console.error('Error loading PDF:', error);
    }
}

async function deletePDF(id, event) {
    event.stopPropagation();
    try {
        const response = await fetch(`/api/pdfs/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadPDFList();
        }
    } catch (error) {
        console.error('Error deleting PDF:', error);
    }
}

// Initial load
loadPDFList();