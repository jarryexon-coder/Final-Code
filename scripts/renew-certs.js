#!/bin/bash
# /scripts/renew-certs.sh

certbot renew --quiet --post-hook "systemctl reload nginx"
