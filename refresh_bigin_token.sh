#!/bin/bash

echo "Refreshing Bigin token..."

response=$(curl -X POST "https://accounts.zoho.com/oauth/v2/token" \
  -d "refresh_token=1000.c5f8b93d7c1b9cd1dfe48462a9bb95bb.13d7a97f15d89d525cd7d5dd1f66cd33" \
  -d "client_id=1000.NLFWT8BFUWU985022Q1MKC8SPA9OHA" \
  -d "client_secret=81b71c0f64d39c01c0e81f7bb1f2b2a9ed17c3fc05" \
  -d "grant_type=refresh_token" -v)

echo "Response: $response"

# Extract the access token
access_token=$(echo $response | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$access_token" ]; then
  echo "New access token: $access_token"
  
  # Update the bigin_contact.sh script with the new token
  sed -i "s/Bearer [a-zA-Z0-9.]*/Bearer $access_token/" bigin_contact.sh
  echo "Updated bigin_contact.sh with the new token"
else
  echo "Failed to get new access token!"
fi 