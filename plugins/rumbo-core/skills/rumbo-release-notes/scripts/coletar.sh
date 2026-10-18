#!/usr/bin/env bash
# Coleta os commits de uma janela e devolve em blocos legíveis, com corpo.
#
#   bash coletar.sh <caminho-do-repo> <desde> [ate] [branch]
#   bash coletar.sh ~/Projects/meu-produto 2026-08-27 2026-09-03 main
#
# O corpo do commit é onde está o porquê. Por isso ele vem inteiro: a triagem
# é trabalho do método, não deste script.
#
# A janela filtra por data de COMMIT, não de autoria: o que importa é o que
# chegou na branch nesta semana. Commit antigo que entrou agora conta, e por
# isso as duas datas aparecem.
set -uo pipefail

REPO="${1:?uso: coletar.sh <repo> <desde> [ate] [branch]}"
DESDE="${2:?informe a data inicial, formato AAAA-MM-DD}"
ATE="${3:-$(date +%F)}"
BRANCH="${4:-}"

[ -d "$REPO/.git" ] || { echo "erro: $REPO não é um repositório git" >&2; exit 1; }
cd "$REPO" || exit 1
[ -z "$BRANCH" ] && BRANCH="$(git symbolic-ref --short HEAD 2>/dev/null || echo main)"
# A branch vira argumento do git: um valor comecando com "-" seria lido como opcao
# (--output=arquivo sobrescreve o que quiser). So passa o que resolve num commit.
case "$BRANCH" in -*) echo "erro: branch \"$BRANCH\" invalida" >&2; exit 1 ;; esac
git rev-parse --verify --quiet "$BRANCH^{commit}" >/dev/null || { echo "erro: branch \"$BRANCH\" nao existe em $(basename "$REPO")" >&2; exit 1; }
for d in "$DESDE" "$ATE"; do
  [[ "$d" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || { echo "erro: data \"$d\" fora do formato AAAA-MM-DD" >&2; exit 1; }
done

echo "REPO: $(basename "$REPO")   BRANCH: $BRANCH   JANELA: $DESDE a $ATE"
echo

TOTAL=$(git log "$BRANCH" --since="$DESDE" --until="$ATE 23:59:59" --pretty='%h' | wc -l | tr -d ' ')
echo "commits na janela: $TOTAL"
echo

echo "--- CONTAGEM POR TIPO (o filtro do método começa aqui) ---"
git log "$BRANCH" --since="$DESDE" --until="$ATE 23:59:59" --pretty='%s' \
  | sed -E 's/^([a-z]+)(\(.*\))?!?:.*/\1/' | sort | uniq -c | sort -rn
echo

echo "--- COMMITS, COM CORPO ---"
git log "$BRANCH" --since="$DESDE" --until="$ATE 23:59:59" \
  --pretty=format:'
================================================================
%h  %cd (autoria %ad)  %an
%s
----------------------------------------------------------------
%b' --date=short
echo
