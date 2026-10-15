const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/src/app.module.js');
const { AuthService } = require('./dist/src/auth/auth.service.js');
const { PrismaService } = require('./dist/src/lib/prisma/prisma.service.js');
const http = require('http');

async function runTest() {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/velvet_iron_dev?schema=public';
  process.env.PORT = '3333';
  process.env.JWT_SECRET = 'testsecret123';

  console.log('Booting local server on port 3333...');
  const app = await NestFactory.create(AppModule);
  await app.listen(3333);

  try {
    const prisma = app.get(PrismaService);
    const authService = app.get(AuthService);

    // 1. Get a user
    let user = await prisma.client.user.findFirst();
    if (!user) {
      user = await prisma.client.user.create({
        data: { email: 'httptest@example.com', password: 'pass', name: 'HTTP Test' }
      });
    }

    // 2. Generate token (simulating a login)
    console.log('Generating tokens for user:', user.email);
    const tokens = await authService.generateTokens(user);
    const refreshToken = tokens.refresh_token;
    console.log('Got Refresh Token:', refreshToken.substring(0, 30) + '...');

    // 3. Send HTTP request to /auth/refresh-token
    console.log('Sending HTTP POST to http://localhost:3333/auth/refresh-token...');
    
    const response = await fetch('http://localhost:3333/auth/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Body:', data);
    
    if (response.status === 201 || response.status === 200) {
      console.log('✅ HTTP Route Test Passed Successfully!');
    } else {
      console.error('❌ HTTP Route Test Failed!');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await app.close();
  }
}

runTest();
