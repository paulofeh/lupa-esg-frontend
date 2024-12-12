import os
from datetime import datetime

def create_consolidation():
    # Configuração do arquivo de saída
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = f"frontend_consolidation_{timestamp}.txt"
    
    # Mapeamento de extensões para tipos de arquivo
    file_types = {
        '.js': 'JavaScript',
        '.css': 'CSS',
        '.html': 'HTML'
    }
    
    # Estrutura do frontend
    frontend_dirs = [
        'css',
        'data',
        'js'
    ]
    
    processed_files = set()  # Conjunto para rastrear arquivos processados
    
    with open(output_file, 'w', encoding='utf-8') as f:
        # Cabeçalho
        f.write(f"Frontend Code Consolidation\n")
        f.write(f"Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("="*50 + "\n\n")
        
        # Processa cada diretório
        for dir_path in frontend_dirs:
            if not os.path.exists(dir_path):
                continue
                
            f.write(f"\n### Directory: {dir_path}\n")
            f.write("-"*50 + "\n")
            
            # Caminha recursivamente pelo diretório
            for root, _, files in os.walk(dir_path):
                for file in sorted(files):
                    _, ext = os.path.splitext(file)
                    if ext not in file_types:
                        continue

                    file_path = os.path.join(root, file)
                    relative_path = os.path.relpath(file_path)

                    if file_path in processed_files:
                        continue  # Pula arquivos já processados

                    processed_files.add(file_path)  # Marca o arquivo como processado

                    # Escreve cabeçalho do arquivo
                    f.write(f"\n## File: {relative_path}\n")
                    f.write(f"Type: {file_types[ext]}\n")
                    f.write("-"*30 + "\n")

                    # Lê e escreve o conteúdo do arquivo
                    try:
                        with open(file_path, 'r', encoding='utf-8') as source:
                            content = source.read()
                            f.write(content)
                            f.write("\n\n")
                    except Exception as e:
                        f.write(f"Error reading file: {str(e)}\n")

        print(f"Consolidation complete. Output saved to: {output_file}")

if __name__ == "__main__":
    create_consolidation()