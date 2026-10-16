#!/usr/bin/env bash
# Roda os testes da FASE 0. Uso: tests/run_tests.sh [caminho-do-godot]
# Saída: códigos != 0 indicam falha; logs em build/test-logs/.
set -u
GODOT="${1:-${GODOT:-godot}}"
cd "$(dirname "$0")/.."
mkdir -p build/test-logs
status=0

echo "== 1) Importação/abertura do projeto (editor headless)"
"$GODOT" --headless --editor --quit-after 5 --path . > build/test-logs/import.log 2>&1 || status=1
# Qualquer ERROR/SCRIPT ERROR no log conta como falha.
if grep -E "ERROR|SCRIPT ERROR|Parse Error" build/test-logs/import.log; then status=1; echo "FALHOU: erros na abertura"; else echo "PASSOU: projeto abre sem erros"; fi

echo "== 2) Teste de fumaça"
"$GODOT" --headless --path . -s res://tests/fase0_smoke_test.gd 2>&1 | tee build/test-logs/smoke.log
[ "${PIPESTATUS[0]}" -eq 0 ] || status=1
if grep -E "ERROR|SCRIPT ERROR" build/test-logs/smoke.log; then status=1; fi

echo "== 3) Cena principal roda por 30 quadros"
"$GODOT" --headless --path . --quit-after 30 > build/test-logs/run.log 2>&1 || status=1
cat build/test-logs/run.log
grep -q TEST_VAZIO_READY build/test-logs/run.log || status=1
if grep -E "ERROR|SCRIPT ERROR" build/test-logs/run.log; then status=1; fi

echo "== RESULTADO GERAL: $([ $status -eq 0 ] && echo PASSOU || echo FALHOU)"
exit $status
