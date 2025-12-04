# !/bin/bash
npm install . --force --verbose
npm audit fix --force
npm run dev
