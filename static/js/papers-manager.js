document.addEventListener('DOMContentLoaded', function() {
    // Initialize DataTable
    const papersTable = $('#papersTable').DataTable({
        columns: [
            { data: 'id' },
            { data: 'title' },
            { data: 'authors' },
            { data: 'year' },
            { data: 'journal' },
            { data: 'volume' },
            { 
                data: null, 
                defaultContent: '', 
                orderable: false,
                render: function(data, type, row) {
                    return `
                        <div class="btn-group" role="group">
                            <button type="button" class="btn btn-sm btn-primary view-pdf" data-id="${row.id}" title="View PDF">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-secondary edit-paper" data-id="${row.id}" title="Edit">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-danger delete-paper" data-id="${row.id}" title="Delete">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        responsive: true,
        order: [[0, 'desc']]
    });

    // Load papers
    loadPapers();

    // Event listeners
    document.getElementById('savePaperBtn').addEventListener('click', savePaper);
    document.getElementById('updatePaperBtn').addEventListener('click', updatePaper);
    
    // Action buttons event delegation
    document.getElementById('papersTableBody').addEventListener('click', function(e) {
        const target = e.target.closest('button');
        if (!target) return;
        
        const paperId = target.getAttribute('data-id');
        
        if (target.classList.contains('view-pdf')) {
            viewPdf(paperId);
        } else if (target.classList.contains('edit-paper')) {
            editPaper(paperId);
        } else if (target.classList.contains('delete-paper')) {
            showDeleteConfirmation(paperId);
        }
    });
    
    // Confirm delete button
    document.getElementById('confirmDeleteBtn').addEventListener('click', function() {
        const paperId = this.getAttribute('data-id');
        deletePaper(paperId);
    });

    // Load papers from server
    async function loadPapers() {
        try {
            const response = await fetch('/api/pdfs');
            const papers = await response.json();
            
            // Clear and reload table
            papersTable.clear();
            papersTable.rows.add(papers).draw();
        } catch (error) {
            console.error('Error loading papers:', error);
            showAlert('Error loading papers. Please try again later.', 'danger');
        }
    }

    // Save new paper
    async function savePaper() {
        const paperFile = document.getElementById('paperFile').files[0];
        const title = document.getElementById('paperTitle').value;
        const authors = document.getElementById('paperAuthors').value;
        const year = document.getElementById('paperYear').value;
        const journal = document.getElementById('paperJournal').value;
        const volume = document.getElementById('paperVolume').value;
        
        if (!paperFile || !title || !authors || !year || !journal) {
            showAlert('Please fill in all required fields.', 'warning', 'addPaperModal');
            return;
        }
        
        try {
            const formData = new FormData();
            formData.append('pdf', paperFile);
            formData.append('bibtexData', JSON.stringify({
                title, authors, year, journal, volume
            }));
            
            const response = await fetch('/api/pdfs', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                // Close modal and reset form
                const modal = bootstrap.Modal.getInstance(document.getElementById('addPaperModal'));
                modal.hide();
                document.getElementById('addPaperForm').reset();
                
                // Reload papers
                loadPapers();
                showAlert('Paper added successfully', 'success');
            } else {
                const data = await response.json();
                showAlert(`Error adding paper: ${data.error}`, 'danger', 'addPaperModal');
            }
        } catch (error) {
            console.error('Error adding paper:', error);
            showAlert('Error adding paper. Please try again.', 'danger', 'addPaperModal');
        }
    }

    // View PDF
    async function viewPdf(paperId) {
        try {
            // Create a blob URL for the PDF
            const pdfUrl = `/api/pdfs/${paperId}`;
            
            // Set the iframe source
            document.getElementById('pdfViewer').src = pdfUrl;
            
            // Show the modal
            const viewPdfModal = new bootstrap.Modal(document.getElementById('viewPdfModal'));
            viewPdfModal.show();
        } catch (error) {
            console.error('Error viewing PDF:', error);
            showAlert('Error loading PDF. Please try again.', 'danger');
        }
    }

    // Edit paper
    async function editPaper(paperId) {
        try {
            // Get paper details
            const papers = papersTable.data().toArray();
            const paper = papers.find(p => p.id == paperId);
            
            if (!paper) {
                showAlert('Paper not found', 'danger');
                return;
            }
            
            // Fill the form
            document.getElementById('editPaperId').value = paper.id;
            document.getElementById('editPaperTitle').value = paper.title;
            document.getElementById('editPaperAuthors').value = paper.authors;
            document.getElementById('editPaperYear').value = paper.year;
            document.getElementById('editPaperJournal').value = paper.journal;
            document.getElementById('editPaperVolume').value = paper.volume || '';
            
            // Show the modal
            const editPaperModal = new bootstrap.Modal(document.getElementById('editPaperModal'));
            editPaperModal.show();
        } catch (error) {
            console.error('Error editing paper:', error);
            showAlert('Error loading paper details. Please try again.', 'danger');
        }
    }

    // Update paper
    async function updatePaper() {
        const paperId = document.getElementById('editPaperId').value;
        const title = document.getElementById('editPaperTitle').value;
        const authors = document.getElementById('editPaperAuthors').value;
        const year = document.getElementById('editPaperYear').value;
        const journal = document.getElementById('editPaperJournal').value;
        const volume = document.getElementById('editPaperVolume').value;
        
        if (!title || !authors || !year || !journal) {
            showAlert('Please fill in all required fields.', 'warning', 'editPaperModal');
            return;
        }
        
        try {
            const response = await fetch(`/api/pdfs/${paperId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title, authors, year, journal, volume
                })
            });
            
            if (response.ok) {
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('editPaperModal'));
                modal.hide();
                
                // Reload papers
                loadPapers();
                showAlert('Paper updated successfully', 'success');
            } else {
                const data = await response.json();
                showAlert(`Error updating paper: ${data.error}`, 'danger', 'editPaperModal');
            }
        } catch (error) {
            console.error('Error updating paper:', error);
            showAlert('Error updating paper. Please try again.', 'danger', 'editPaperModal');
        }
    }

    // Show delete confirmation
    function showDeleteConfirmation(paperId) {
        document.getElementById('confirmDeleteBtn').setAttribute('data-id', paperId);
        const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
        confirmModal.show();
    }

    // Delete paper
    async function deletePaper(paperId) {
        try {
            const response = await fetch(`/api/pdfs/${paperId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
                modal.hide();
                
                // Reload papers
                loadPapers();
                showAlert('Paper deleted successfully', 'success');
            } else {
                const data = await response.json();
                showAlert(`Error deleting paper: ${data.error}`, 'danger');
            }
        } catch (error) {
            console.error('Error deleting paper:', error);
            showAlert('Error deleting paper. Please try again.', 'danger');
        }
    }

    // Helper function to show alerts
    function showAlert(message, type, modalId = null) {
        // Create alert element
        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${type} alert-dismissible fade show`;
        alertElement.role = 'alert';
        alertElement.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        // Append to appropriate container
        if (modalId) {
            // Inside modal
            const modalBody = document.querySelector(`#${modalId} .modal-body`);
            modalBody.insertBefore(alertElement, modalBody.firstChild);
        } else {
            // Main page
            const container = document.querySelector('.container');
            container.insertBefore(alertElement, container.firstChild);
        }
        
        // Auto dismiss after 5 seconds
        setTimeout(() => {
            alertElement.classList.remove('show');
            setTimeout(() => alertElement.remove(), 150);
        }, 5000);
    }
});