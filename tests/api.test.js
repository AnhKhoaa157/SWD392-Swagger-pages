const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const User = require('../src/models/user.model');

describe('Authentication API', () => {
    beforeAll(async () => {
        // Clean up test users before running tests
        await User.deleteMany({ email: /test.*@example\.com/ });
    });

    afterAll(async () => {
        // Clean up after tests
        await User.deleteMany({ email: /test.*@example\.com/ });
        await mongoose.connection.close();
    });

    describe('POST /api/auth/register', () => {
        test('Should register new user successfully', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test1@example.com',
                    password: '123456'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data).toHaveProperty('refreshToken');
            expect(response.body.data.user).toHaveProperty('email', 'test1@example.com');
        });

        test('Should fail with duplicate email', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test1@example.com',
                    password: '123456'
                });

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
        });

        test('Should fail with short password', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test2@example.com',
                    password: '123'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test('Should fail with missing fields', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test3@example.com'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        test('Should login successfully', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test1@example.com',
                    password: '123456'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data).toHaveProperty('refreshToken');
        });

        test('Should fail with wrong password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test1@example.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        test('Should fail with non-existent email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: '123456'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/refresh', () => {
        let refreshToken;

        beforeAll(async () => {
            // Login to get refresh token
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test1@example.com',
                    password: '123456'
                });
            refreshToken = response.body.data.refreshToken;
        });

        test('Should refresh access token successfully', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('accessToken');
        });

        test('Should fail with invalid refresh token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken: 'invalid-token' });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/forgot-password', () => {
        test('Should reset password successfully', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({
                    email: 'test1@example.com',
                    newPassword: 'newpassword123'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('Should fail with short password', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({
                    email: 'test1@example.com',
                    newPassword: '123'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test('Should login with new password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test1@example.com',
                    password: 'newpassword123'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});
