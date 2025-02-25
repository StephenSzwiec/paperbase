class CompoundManager {
    constructor() {
        this.compounds = [];
        this.currentPDFId = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('saveCompound').addEventListener('click', () => this.saveCompound());
        document.getElementById('captureImage').addEventListener('click', () => this.captureImage());
        document.getElementById('recognizeStructure').addEventListener('click', () => this.recognizeStructure());
        document.getElementById('validateStructure').addEventListener('click', () => this.validateStructure());
        document.getElementById('smilesInput').addEventListener('change', () => this.validateStructure());
    }

    async saveCompound() {
        const smilesInput = document.getElementById('smilesInput');
        const inchiInput = document.getElementById('inchiInput');
        const pceInput = document.getElementById('pceInput');
        const capturedImage = document.getElementById('capturedImage');

        const compound = {
            pdfId: this.currentPDFId,
            smiles: smilesInput.value,
            inchi: inchiInput.value,
            pce: parseFloat(pceInput.value),
            image: capturedImage.getAttribute('data-image')
        };

        try {
            const response = await fetch('/api/compounds', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(compound)
            });

            if (response.ok) {
                this.clearForm();
                this.loadCompounds(this.currentPDFId);
            } else {
                throw new Error('Failed to save compound');
            }
        } catch (error) {
            console.error('Error saving compound:', error);
        }
    }

    captureImage() {
        const pdfHandler = window.pdfHandler;
        const imageData = pdfHandler.captureSelection();
        const capturedImage = document.getElementById('capturedImage');
        capturedImage.innerHTML = `<img src="${imageData}" style="max-width: 100%">`;
        capturedImage.setAttribute('data-image', imageData);
    }

    async recognizeStructure() {
        const capturedImage = document.getElementById('capturedImage');
        const imageData = capturedImage.getAttribute('data-image');
        const structurePreview = document.getElementById('structurePreview');
        const smilesInput = document.getElementById('smilesInput');
        const inchiInput = document.getElementById('inchiInput');

        if (!imageData) {
            alert('Please capture an image first');
            return;
        }

        try {
            // Show loading indicator
            structurePreview.innerHTML = '<div class="alert alert-info">Recognizing structure...</div>';
            
            const response = await fetch('http://localhost:5000/api/recognize-structure', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image: imageData })
            });

            const data = await response.json();
            if (response.ok) {
                // Update SMILES with canonical version
                smilesInput.value = data.smiles;
                
                // Populate InChI automatically
                inchiInput.value = data.inchi;
                
                // Add edit button to structure preview
                structurePreview.innerHTML = `
                    <div class="position-relative">
                        <img src="${data.structure_image}" style="max-width: 100%">
                        <button id="editStructure" class="btn btn-sm btn-primary position-absolute top-0 end-0 m-2">
                            Edit Structure
                        </button>
                    </div>
                `;
                
                // Store molblock for the editor
                structurePreview.setAttribute('data-molblock', data.molblock);
                
                // Add edit button event listener
                document.getElementById('editStructure').addEventListener('click', () => {
                    this.openStructureEditor(data.molblock);
                });
            } else {
                structurePreview.innerHTML = `<div class="alert alert-danger">Error: ${data.error}</div>`;
                alert('Error recognizing structure: ' + data.error);
            }
        } catch (error) {
            console.error('Error recognizing structure:', error);
            structurePreview.innerHTML = '<div class="alert alert-danger">Error connecting to chemical service</div>';
            alert('Error recognizing structure');
        }
    }

    async validateStructure() {
        const smilesInput = document.getElementById('smilesInput');
        const inchiInput = document.getElementById('inchiInput');
        const structurePreview = document.getElementById('structurePreview');
        const smiles = smilesInput.value;

        if (!smiles) {
            structurePreview.innerHTML = '';
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/validate-smiles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ smiles })
            });

            const data = await response.json();
            if (response.ok && data.valid) {
                // Update SMILES with canonical version
                smilesInput.value = data.smiles;
                
                // Populate InChI automatically
                inchiInput.value = data.inchi;
                
                // Add edit button to structure preview
                structurePreview.innerHTML = `
                    <div class="position-relative">
                        <img src="${data.structure_image}" style="max-width: 100%">
                        <button id="editStructure" class="btn btn-sm btn-primary position-absolute top-0 end-0 m-2">
                            Edit Structure
                        </button>
                    </div>
                `;
                
                // Store molblock for the editor
                structurePreview.setAttribute('data-molblock', data.molblock);
                
                // Add edit button event listener
                document.getElementById('editStructure').addEventListener('click', () => {
                    this.openStructureEditor(data.molblock);
                });
            } else {
                structurePreview.innerHTML = '<div class="alert alert-danger">Invalid SMILES</div>';
            }
        } catch (error) {
            console.error('Error validating SMILES:', error);
            structurePreview.innerHTML = '<div class="alert alert-danger">Error validating structure</div>';
        }
    }
    
    openStructureEditor(molblock) {
        // Encode molblock for URL
        const encodedMolblock = encodeURIComponent(molblock);
        
        // Open the editor in a new window
        const editorWindow = window.open(
            `http://localhost:5000/rdkit-editor.html?molblock=${encodedMolblock}`,
            'RDKitEditor',
            'width=800,height=600'
        );
        
        // Set up event listener to receive the edited molecule
        window.addEventListener('message', async (event) => {
            // Check if it's from our editor
            if (event.data && event.data.type === 'rdkit-molecule') {
                // Get the molfile from the editor
                const molblock = event.data.molblock;
                
                // Convert molfile to SMILES and InChI
                try {
                    const response = await fetch('http://localhost:5000/api/molfile-to-structure', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ molfile: molblock })
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        
                        // Update form values
                        document.getElementById('smilesInput').value = data.smiles;
                        document.getElementById('inchiInput').value = data.inchi;
                        
                        // Update structure preview
                        const structurePreview = document.getElementById('structurePreview');
                        structurePreview.innerHTML = `
                            <div class="position-relative">
                                <img src="${data.structure_image}" style="max-width: 100%">
                                <button id="editStructure" class="btn btn-sm btn-primary position-absolute top-0 end-0 m-2">
                                    Edit Structure
                                </button>
                            </div>
                        `;
                        
                        // Store new molblock
                        structurePreview.setAttribute('data-molblock', molblock);
                        
                        // Add edit button event listener
                        document.getElementById('editStructure').addEventListener('click', () => {
                            this.openStructureEditor(molblock);
                        });
                    }
                } catch (error) {
                    console.error('Error converting molfile:', error);
                }
            }
        });
    }

    async loadCompounds(pdfId) {
        this.currentPDFId = pdfId;
        try {
            const response = await fetch(`/api/compounds/${pdfId}`);
            const compounds = await response.json();
            this.displayCompounds(compounds);
        } catch (error) {
            console.error('Error loading compounds:', error);
        }
    }

    displayCompounds(compounds) {
        const compoundList = document.getElementById('compoundList');
        compoundList.innerHTML = compounds.map(compound => `
            <div class="compound-item">
                <img src="${compound.image}" class="compound-image">
                <div class="structure-image"></div>
                <div>SMILES: ${compound.smiles}</div>
                <div>InChI: ${compound.inchi}</div>
                <div>PCE: ${compound.pce}</div>
                <button onclick="compoundManager.deleteCompound(${compound.id})" class="btn btn-danger btn-sm mt-2">
                    Delete
                </button>
            </div>
        `).join('');
    }

    async deleteCompound(id) {
        try {
            const response = await fetch(`/api/compounds/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.loadCompounds(this.currentPDFId);
            }
        } catch (error) {
            console.error('Error deleting compound:', error);
        }
    }

    clearForm() {
        document.getElementById('smilesInput').value = '';
        document.getElementById('inchiInput').value = '';
        document.getElementById('pceInput').value = '';
        document.getElementById('capturedImage').innerHTML = '';
        document.getElementById('capturedImage').removeAttribute('data-image');
        document.getElementById('structurePreview').innerHTML = '';
    }
}