FROM node:20-alpine

WORKDIR /app

# Copia apenas os arquivos de dependências primeiro (melhora o cache do Docker)
COPY package.json package-lock.json* ./

RUN npm install

# Copia o restante do código do projeto
COPY . .

# Porta padrão do Expo Web
EXPOSE 19006

# Porta do Metro Bundler (necessária mesmo rodando web)
EXPOSE 8081

CMD ["npx", "expo", "start", "--web", "--host", "lan"]
