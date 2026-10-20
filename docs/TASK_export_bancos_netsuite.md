# Tarea: Exportar movimientos bancarios de NetSuite a un solo Excel

Agregar al portal de automatizaciones (Next.js en Vercel Hobby + Supabase) una vista y una API route que generen un único `.xlsx` con todas las líneas contables de cuentas bancarias de un rango de fechas (100k+ filas por mes).

## Contexto / por qué no n8n
- n8n Cloud se queda sin memoria con ~137k filas en una ejecución. Se mueve al portal.
- Vercel Hobby: máx 2 GB memoria, máx 300 s por función. Configurar `export const maxDuration = 300` y `export const runtime = 'nodejs'`.
- Respuesta de función limitada a ~4,5 MB → el Excel NO se devuelve en la respuesta: se sube a Supabase Storage y se devuelve un signed URL.

## Variables de entorno (ya NO hardcodear credenciales)
- `NETSUITE_ACCOUNT_ID=6389340`
- `NETSUITE_CONSUMER_KEY`
- `NETSUITE_CERT_ID` (kid del JWT)
- `NETSUITE_PRIVATE_KEY` (PEM PKCS#8; puede venir en una sola línea, normalizar a bloques de 64 chars)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (solo server)
- `EXPORTS_BUCKET=exports`

## Autenticación NetSuite (OAuth 2.0 client credentials, M2M)
1. JWT firmado PS256 (`crypto.sign('sha256', ..., { padding: RSA_PKCS1_PSS_PADDING, saltLength: RSA_PSS_SALTLEN_DIGEST })`).
   - header: `{ alg: 'PS256', typ: 'JWT', kid: NETSUITE_CERT_ID }`
   - payload: `{ iss: CONSUMER_KEY, scope: ['restlets','rest_webservices'], aud: TOKEN_URL, iat: now, exp: now+3600 }`
2. POST `https://6389340.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token`, form-urlencoded:
   `grant_type=client_credentials`, `client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer`, `client_assertion=<jwt>`.
3. Usar `access_token` una sola vez para toda la exportación.

## SuiteQL
- POST `https://6389340.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql?limit=1000&offset=N`
- Headers: `Authorization: Bearer <token>`, `Prefer: transient`, `Content-Type: application/json`
- Body: `{ "q": "<query>" }`
- Paginar con `offset += 1000` mientras `hasMore === true`. Quitar `links` de cada item.
- Límite REST: máx 100.000 resultados por query → **dividir por día** (una query por fecha).
- SuiteQL omite campos nulos en la respuesta → rellenar con `null`.
- Concurrencia: ~5 días en paralelo (p-limit o similar). Reintento con backoff ante 429/5xx.

Query por día (`{FECHA}` = YYYY-MM-DD):
```sql
SELECT t.id, t.tranid, t.trandate, t.postingperiod, t.type, BUILTIN.DF(t.type) AS tipo_documento, t.status, t.memo AS nota_principal, t.currency, t.exchangerate, t.createddate, t.lastmodifieddate, tl.id AS linea, tl.memo AS nota_linea, tl.entity, BUILTIN.DF(tl.entity) AS tercero, tl.department, BUILTIN.DF(tl.department) AS centro_costo, tl.class, tl.location, a.id AS cuenta_id, a.acctnumber, a.accountsearchdisplaynamecopy AS cuenta_contable, a.accttype, tal.debit, tal.credit, tal.amount, tal.netamount
FROM transactionaccountingline tal
JOIN transaction t ON t.id = tal.transaction
JOIN transactionline tl ON tl.transaction = tal.transaction AND tl.id = tal.transactionline
JOIN account a ON a.id = tal.account
WHERE tal.posting = 'T' AND a.accttype = 'Bank' AND t.type <> 'Journal'
  AND t.trandate = TO_DATE('{FECHA}','YYYY-MM-DD')
ORDER BY t.tranid, t.id, tl.id, a.id
```

## Excel
- Librería: `exceljs` con `stream.xlsx.WorkbookWriter` escribiendo a `/tmp/<archivo>.xlsx`; `row.commit()` por fila. No acumular todas las filas en memoria.
- Hoja: `Bancos`. Nombre archivo: `bancos_{inicio}_{fin}.xlsx`.
- Las filas deben quedar en orden de fecha: procesar días en paralelo pero escribir en orden (buffer por día, escribir día N cuando esté listo y los anteriores ya estén escritos).
- `debit`, `credit`, `amount`, `netamount`, `exchangerate` como número; fechas como fecha.
- Headers en español, en este orden:

| campo SuiteQL | Header |
|---|---|
| id | ID Transacción |
| tranid | Número Documento |
| trandate | Fecha |
| postingperiod | Periodo Contable |
| type | Código Tipo |
| tipo_documento | Tipo Documento |
| status | Estado |
| nota_principal | Nota Principal |
| currency | Moneda |
| exchangerate | Tasa de Cambio |
| createddate | Fecha Creación |
| lastmodifieddate | Fecha Última Modificación |
| linea | Línea |
| nota_linea | Nota Línea |
| entity | ID Tercero |
| tercero | Tercero |
| department | ID Centro de Costo |
| centro_costo | Centro de Costo |
| class | Clase |
| location | Ubicación |
| cuenta_id | ID Cuenta |
| acctnumber | Número Cuenta |
| cuenta_contable | Cuenta Contable |
| accttype | Tipo Cuenta |
| debit | Débito |
| credit | Crédito |
| amount | Monto |
| netamount | Monto Neto |

## Entrega
- Subir a Supabase Storage (bucket `exports`, privado), signed URL de 1 h.
- Respuesta API: `{ url, fileName, filas, duracionMs }`.
- Borrar el archivo de `/tmp` al terminar.

## API route
`POST /api/export-bancos` body `{ fechaInicio, fechaFin }` (YYYY-MM-DD). Validar fechas y rango ≤ 31 días. Requiere usuario autenticado del portal (seguir el patrón de auth existente).

## Vista
Página en el portal siguiendo el diseño/componentes existentes:
- Selector de fecha inicio/fin (default: mes anterior).
- Botón "Generar Excel" → estado de carga (puede tardar 1–3 min).
- Al terminar: botón de descarga, número de filas y duración. Mostrar errores claros (timeout, NetSuite, Storage).

## Criterios de aceptación
- Agosto 2026 (~137k filas) genera un solo Excel sin timeout ni OOM en Vercel Hobby.
- Conteo de filas del Excel = suma de filas de todas las páginas.
- Sin credenciales en el código.
