# Paperbase 

A web application for managing scientific paper PDFs and chemical structures extracted from them.


## Features

- Upload, view, and manage PDF documents with bibliographic information
- Capture chemical structures from PDFs
- Recognize chemical structures and convert them to SMILES and InChI formats
- Validate chemical structures
- Store and organize chemical compounds linked to their source papers

## Setup and Installation

### Prerequisites

1. [Bun](https://bun.sh/) for running the JavaScript server
2. Python 3.10 for the chemical service
3. [RDKit](https://www.rdkit.org/) for chemical structure manipulation
4. [DECIMER](https://github.com/Kohulan/DECIMER-Image_Transformer/) for chemical structure recognition

### Installation

#### JavaScript/TypeScript Server

```bash
# Install dependencies
bun install

# Start the server
bun run server.ts
```

#### Python Chemical Service

```bash
# you will need a working conda environment 
conda create -n paperbase python=3.10
conda activate paperbase 
pip install -r requirements.txt
# Start the chemical service
python chemical_service.py
```

During the first run, the chemical service will download the DECIMER model weights and cache them.
This may take a few minutes. 

## Usage

1. Access the application at http://localhost:8000
2. Upload PDFs with bibliographic information
3. View PDFs and capture regions containing chemical structures
4. Use the "Recognize Structure" feature to extract SMILES from images
5. Validate and save chemical structures with metadata

## Architecture

- **Frontend**: HTML/CSS/JavaScript
- **Backend Server**: Bun/TypeScript with SQLite database
- **Chemical Service**: Python Flask API with RDKit and DECIMER integration

## License and Copying

This project is licensed under the GPLv3 license. See the [LICENSE](LICENSE) file for details.
