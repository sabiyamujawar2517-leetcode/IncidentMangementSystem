#!/usr/bin/env bash
# Phase 2 smoke test. Requires: API running on BASE (dev seed data loaded), curl, jq.
set -u
BASE=${BASE:-http://localhost:5080}
FAIL=0

# check <label> <expected-status> <method> <path> [json-body]  -> body in $BODY
check() {
  local label=$1 expected=$2 method=$3 path=$4 data=${5:-}
  local args=(-s -o /tmp/smoke_body -w '%{http_code}' -X "$method" "$BASE$path")
  [ -n "$data" ] && args+=(-H 'Content-Type: application/json' -d "$data")
  local code; code=$(curl "${args[@]}")
  BODY=$(cat /tmp/smoke_body)
  if [ "$code" = "$expected" ]; then echo "PASS $code $label"; else echo "FAIL $code (expected $expected) $label: $BODY"; FAIL=1; fi
}

CAT=$(curl -s "$BASE/api/categories" | jq -r '.[0].id')
CAT2=$(curl -s "$BASE/api/categories" | jq -r '.[1].id')
SVC=$(curl -s "$BASE/api/services" | jq -r '.[0].id')
USERS=$(docker exec incidentagent-postgres psql -U incidentagent -d incidentagent -tAc 'select "Id" from "Users" order by "Email"')
REPORTER=$(echo "$USERS" | sed -n 1p); ENGINEER=$(echo "$USERS" | sed -n 3p); LEAD=$(echo "$USERS" | sed -n 2p)

NEW='{"title":"Checkout page down","description":"500 on submit","priority":"P1Critical","categoryId":"'$CAT'","serviceId":"'$SVC'","reporterId":"'$REPORTER'"}'

check "create" 201 POST /api/incidents "$NEW"
ID=$(echo "$BODY" | jq -r .id); echo "     number=$(echo "$BODY" | jq -r .incidentNumber) status=$(echo "$BODY" | jq -r .status)"

check "list page=1 pageSize=2" 200 GET "/api/incidents?page=1&pageSize=2&status=Open"
echo "     items=$(echo "$BODY" | jq '.items|length') total=$(echo "$BODY" | jq .totalCount)"
check "list pageSize=500 rejected" 400 GET "/api/incidents?pageSize=500"
check "get" 200 GET "/api/incidents/$ID"

check "update" 200 PUT "/api/incidents/$ID" \
  '{"title":"Checkout page down (EU)","description":"500 on submit","priority":"P2High","categoryId":"'$CAT2'","serviceId":"'$SVC'","actorUserId":"'$LEAD'"}'

check "assign (Open -> Assigned)" 200 POST "/api/incidents/$ID/assign" '{"assigneeId":"'$ENGINEER'","actorUserId":"'$LEAD'"}'
echo "     status=$(echo "$BODY" | jq -r .status) assignee=$(echo "$BODY" | jq -r .assigneeName)"
check "list filter assignedToId" 200 GET "/api/incidents?assignedToId=$ENGINEER"

check "status Assigned -> Investigating (valid)" 200 POST "/api/incidents/$ID/status" '{"newStatus":"Investigating","actorUserId":"'$ENGINEER'","note":"Looking at logs"}'
check "status Investigating -> Closed (invalid)" 409 POST "/api/incidents/$ID/status" '{"newStatus":"Closed"}'
check "status -> Resolved" 200 POST "/api/incidents/$ID/status" '{"newStatus":"Resolved","actorUserId":"'$ENGINEER'"}'
echo "     resolvedAtUtc=$(echo "$BODY" | jq -r .resolvedAtUtc)"

check "comment" 201 POST "/api/incidents/$ID/comments" '{"authorId":"'$REPORTER'","body":"Confirmed fixed"}'

check "history" 200 GET "/api/incidents/$ID/history"
echo "$BODY" | jq -r '.[] | "     \(.changedAtUtc) \(.fieldName): \(.oldValue) -> \(.newValue) by \(.changedByName)"'

check "status -> Closed" 200 POST "/api/incidents/$ID/status" '{"newStatus":"Closed"}'
check "comment on Closed rejected" 409 POST "/api/incidents/$ID/comments" '{"authorId":"'$REPORTER'","body":"late"}'
check "update Closed rejected" 409 PUT "/api/incidents/$ID" "$(echo "$NEW" | jq -c '.')"

check "invalid body (missing fields)" 400 POST /api/incidents '{"title":"","priority":null}'
echo "     errors=$(echo "$BODY" | jq -c '.errors | keys')"
check "malformed JSON" 400 POST /api/incidents '{not json'
check "unknown id" 404 GET "/api/incidents/00000000-0000-0000-0000-000000000001"

# Two concurrent creates must receive different incident numbers.
for n in 1 2; do curl -s -X POST "$BASE/api/incidents" -H 'Content-Type: application/json' -d "$NEW" > /tmp/smoke_c$n & done; wait
N1=$(jq -r .incidentNumber /tmp/smoke_c1); N2=$(jq -r .incidentNumber /tmp/smoke_c2)
if [ "$N1" != "$N2" ] && [ "$N1" != null ] && [ "$N2" != null ]; then echo "PASS concurrent creates: $N1 / $N2"; else echo "FAIL concurrent creates: $N1 / $N2"; FAIL=1; fi

check "/health" 200 GET /health
check "/health/ready" 200 GET /health/ready
check "/api/hello" 200 GET /api/hello

[ $FAIL = 0 ] && echo "ALL PASSED" || { echo "SOME CHECKS FAILED"; exit 1; }
