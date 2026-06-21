# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v55.0.0/ before writing any code.

find order id for ben the the rider
curl -X GET "https://api.voltgoapp.com/api/v1/admin/orders?rider_id=798c51d3-5a29-4f16-bb8d-ea9bdfd8e643&status=in_transit" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiYjQzZGEwYTQtZmRhNS00ZjUyLTkzMTEtMjUyM2Y4YTQ1ZGY0IiwiaWF0IjoxNzgxNjQ3NDIyLCJleHAiOjE3ODE3MzAyMjJ9.4ICJ4mwMMdS-Q5vQixvoYi1eCK39csK3dzRVqnvxa0k"

curl -X 'POST' \
  'https://api.voltgoapp.com/api/v1/admin/orders/f9f1eb9e-70db-47b5-af65-f920c97cc438/cancel' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiYjQzZGEwYTQtZmRhNS00ZjUyLTkzMTEtMjUyM2Y4YTQ1ZGY0IiwiaWF0IjoxNzgxNTYwOTU5LCJleHAiOjE3ODE2NDM3NTl9.MjxZ05vO3sFYmUcUH9M2G6RLC_qAx8xeKFCWmLH7ltc' \
  -H 'Content-Type: application/json' \
  -d '{}'



  Step 1 — find your new order:
curl -X 'GET' \
  'https://api.voltgoapp.com/api/v1/admin/orders' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiYjQzZGEwYTQtZmRhNS00ZjUyLTkzMTEtMjUyM2Y4YTQ1ZGY0IiwiaWF0IjoxNzgxOTAxMTYwLCJleHAiOjE3ODE5ODM5NjB9.nVtl9MkE4W1VIRSAcPidYBLPTAomw9nR3Yrt62AoV7k'

Look for the entry with the most recent created_at and status: "pending" or "searching". Grab its id.
Step 2 — assign your rider (Bernard Bosro):

curl -X 'PUT' \
  'https://api.voltgoapp.com/api/v1/admin/orders/6c4a78b6-c077-44de-b307-f756d35d436e/assign-rider' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiYjQzZGEwYTQtZmRhNS00ZjUyLTkzMTEtMjUyM2Y4YTQ1ZGY0IiwiaWF0IjoxNzgxOTAxMTYwLCJleHAiOjE3ODE5ODM5NjB9.nVtl9MkE4W1VIRSAcPidYBLPTAomw9nR3Yrt62AoV7k' \
  -H 'Content-Type: application/json' \
  -d '{"rider_id": "879afbca-f297-4165-9a9a-d225c7c10b0b"}'

  curl -X PUT \
  'https://api.voltgoapp.com/api/v1/admin/orders/569c0768-83b2-420b-b463-0c6ba5954345/assign-rider' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiYjQzZGEwYTQtZmRhNS00ZjUyLTkzMTEtMjUyM2Y4YTQ1ZGY0IiwiaWF0IjoxNzgxNzkzNTA0LCJleHAiOjE3ODE4NzYzMDR9.tf0XUOjXADFc6S7Iy6_L9FwCND2XhKrtQ_4lZMLuHsk' \
  -H 'Content-Type: application/json' \
  -d '{"rider_id":"879afbca-f297-4165-9a9a-d225c7c10b0b"}'
Run step 1, paste the result for the newest order, and I'll fill in step 2 with the exact order ID for you.

5991c389-662d-49bf-9b38-c998c8daa4c1

xcrun simctl location booted set 5.6037,-0.1870