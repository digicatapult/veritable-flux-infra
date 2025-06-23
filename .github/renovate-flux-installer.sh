#!/bin/bash

# A Flux installation is required by Renovate's Flux manager
curl -s https://fluxcd.io/install.sh | bash

runuser -u ubuntu renovate
