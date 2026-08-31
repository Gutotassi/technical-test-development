#!/bin/bash

BASE_URL="http://localhost:3000/admin/emails"

echo "=========================================="
echo "1. Testando GET: Listar e-mails com falha"
echo "=========================================="
curl -X GET "$BASE_URL" \
     -H "Content-Type: application/json" \
     -w "\nHTTP Status: %{http_code}\n\n"

EMAIL_ID="1"

echo "=========================================="
echo "2. Testando POST: Reenviar e-mail (ID: $EMAIL_ID)"
echo "=========================================="
curl -X POST "$BASE_URL/$EMAIL_ID/reenviar" \
     -H "Content-Type: application/json" \
     -w "\nHTTP Status: %{http_code}\n\n"