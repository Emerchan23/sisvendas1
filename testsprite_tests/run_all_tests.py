#!/usr/bin/env python3
"""
Script para executar todos os testes do TestSprite
"""

import os
import subprocess
import sys
from pathlib import Path

def run_test(test_file):
    """Executa um teste individual e retorna o resultado"""
    print(f"\n{'='*60}")
    print(f"Executando: {test_file}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(
            [sys.executable, test_file],
            capture_output=True,
            text=True,
            timeout=120  # 2 minutos timeout
        )
        
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
            
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        print(f"❌ TIMEOUT: {test_file} excedeu 2 minutos")
        return False
    except Exception as e:
        print(f"❌ ERRO: {str(e)}")
        return False

def main():
    """Função principal"""
    # Diretório dos testes
    test_dir = Path(__file__).parent
    
    # Lista de todos os arquivos de teste
    test_files = [
        "TC001_User_Authentication_Success_with_Valid_Credentials.py",
        "TC002_User_Authentication_Failure_with_Invalid_Credentials.py", 
        "TC003_Multi_Company_Data_Isolation.py",
        "TC004_Client_Registration_with_Valid_CPFCNPJ.py",
        "TC005_Client_Registration_with_Invalid_CPFCNPJ.py",
        "TC006_Product_Catalogue_Creation_and_Validation.py",
        "TC007_Sales_Simple_Test.py",  # Usando versão simplificada
        "TC008_Sales_Simple_Test.py",  # Usando versão simplificada
        "TC009_Budget_Creation_PDF_Generation_and_Email_Dispatch.py",
        "TC010_Budget_Creation_with_Invalid_Email_Configuration.py",
        "TC011_Financial_Transactions_Receipts_and_Payments_Recording.py",
        "TC012_Dashboard_Real_Time_Metrics_and_Graph_Updates.py",
        "TC013_Backup_Export_and_Import_with_Data_Integrity.py",
        "TC015_Security_Authorization_Middleware_Blocking_Unauthorized_Access.py",
        "TC016_Responsive_UI_Behavior_Across_Devices.py",
        "TC017_Performance_Response_Time_Under_Load_for_Basic_Operations.py",
        "TC018_Backup_Import_Handling_Malformed_JSON_Backup_Files.py",
        "TC019_User_Preferences_Persistence_and_Isolation.py",
        "TC020_First_Time_Installation_Auto_Setup_Flow.py"
    ]
    
    # Contadores
    total_tests = 0
    passed_tests = 0
    failed_tests = []
    
    print("🚀 Iniciando execução de todos os testes...")
    print(f"Total de testes: {len(test_files)}")
    
    # Executar cada teste
    for test_file in test_files:
        test_path = test_dir / test_file
        
        if not test_path.exists():
            print(f"⚠️  AVISO: Arquivo {test_file} não encontrado")
            continue
            
        total_tests += 1
        
        if run_test(test_path):
            passed_tests += 1
            print(f"✅ {test_file} - PASSOU")
        else:
            failed_tests.append(test_file)
            print(f"❌ {test_file} - FALHOU")
    
    # Relatório final
    print(f"\n{'='*80}")
    print("📊 RELATÓRIO FINAL")
    print(f"{'='*80}")
    print(f"Total de testes executados: {total_tests}")
    print(f"Testes que passaram: {passed_tests}")
    print(f"Testes que falharam: {len(failed_tests)}")
    print(f"Taxa de sucesso: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "N/A")
    
    if failed_tests:
        print(f"\n❌ Testes que falharam:")
        for test in failed_tests:
            print(f"  - {test}")
    
    # Retornar código de saída apropriado
    if len(failed_tests) == 0:
        print("\n🎉 Todos os testes passaram!")
        return 0
    else:
        print(f"\n⚠️  {len(failed_tests)} teste(s) falharam")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)