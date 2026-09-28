FROM node:20-alpine

WORKDIR /app

# Copia apenas os arquivos de dependências primeiro (melhora o cache do Docker)
COPY package.json package-lock.json* ./

RUN npm install

# Copia o restante do código do projeto
COPY . .

# Porta do Metro Bundler — serve o web e o bundle no Expo SDK 54
# (a antiga 19006 era do webpack, descontinuado a partir do SDK 50)
EXPOSE 8081

CMD ["npx", "expo", "start", "--web", "--host", "lan"]
