#!/usr/bin/env bash
# Roda todos os testes da FASE 0. Uso: tests/run_tests.sh   (HEADED=1 para ver o navegador)
# Logs em build/test-logs/. Sai != 0 se algo falhar.
set -u
cd "$(dirname "$0")/.."
mkdir -p build/test-logs
status=0

echo "== 1) Testes Node (estrutura, núcleo, integridade das referências)"
node --test tests/*.test.js > build/test-logs/node.log 2>&1 || status=1
grep -E "^# (tests|pass|fail)|^not ok" build/test-logs/node.log

echo "== 2) Verificador de arte (autoteste)"
python3 -I tools/verificar_asset.py --autoteste > build/test-logs/verificador.log 2>&1 || status=1
cat build/test-logs/verificador.log

echo "== 3) Cena vazia no Chromium (?test=1)"
node tests/navegador_fase0.js > build/test-logs/navegador.log 2>&1 || status=1
cat build/test-logs/navegador.log

echo "== 4) Nenhum processo de navegador sobrando"
sleep 1
if pgrep -x "headless_shell|chrome|chromium|chrome_crashpad" > /dev/null; then
  echo "FALHOU: navegador ainda aberto"; status=1
else
  echo "PASSOU: nenhum navegador aberto"
fi

echo "== RESULTADO GERAL: $([ $status -eq 0 ] && echo PASSOU || echo FALHOU)"
exit $status
