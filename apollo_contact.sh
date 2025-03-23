#!/bin/bash

curl -X POST "https://api.apollo.io/v1/mixed_people/search" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "wezLANODhT-v_14fz08phg",
    "page": 1,
    "per_page": 1
  }' 