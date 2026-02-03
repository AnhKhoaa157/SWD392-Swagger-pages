const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const User = require('../src/models/user.model');

describe('User API', () => {
    let adminToken;
    let userToken;
    let userId;

    beforeAll(async () => {
        // Clean up test data
        await User.deleteMany({ email: /testuser.*@example\.com/ });

        // Create admin user for testing
        const adminRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@example.com',
                password: 'admin123'
            });
        adminToken = adminRes.body.data.accessToken;

        // Create regular user for testing
        const userRegister = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test Regular User',
                email: 'testuser1@example.com',
                password: '123456'
            });
        userToken = userRegister.body.data.accessToken;
        userId = userRegister.body.data.user._id;
    });

    afterAll(async () => {
        // Clean up after tests
        await User.deleteMany({ email: /testuser.*@example\.com/ });
        await mongoose.connection.close();
    });

    describe('GET /api/users - Get all users', () => {
        test('Admin should get all users', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body).toHaveProperty('count');
        });

        test('Regular user should be forbidden', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });

        test('Should fail without token', async () => {
            const response = await request(app).get('/api/users');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/users/me - Get current user', () => {
        test('Should get current user profile', async () => {
            const response = await request(app)
                .get('/api/users/me')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('email', 'testuser1@example.com');
        });

        test('Should fail without token', async () => {
            const response = await request(app).get('/api/users/me');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/users/:id - Get user by ID', () => {
        test('User should get own profile', async () => {
            const response = await request(app)
                .get(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data._id).toBe(userId);
        });

        test('Admin should get any user profile', async () => {
            const response = await request(app)
                .get(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('Should fail for non-existent user', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/users/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/users - Create user', () => {
        test('Admin should create new user', async () => {
            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test User 2',
                    email: 'testuser2@example.com',
                    password: '123456',
                    role: 'user'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('email', 'testuser2@example.com');
        });

        test('Regular user should be forbidden', async () => {
            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    name: 'Test User 3',
                    email: 'testuser3@example.com',
                    password: '123456'
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });

        test('Should fail with duplicate email', async () => {
            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test User',
                    email: 'testuser2@example.com',
                    password: '123456'
                });

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/users/:id - Update user', () => {
        test('User should update own profile', async () => {
            const response = await request(app)
                .put(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    name: 'Updated Name'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Updated Name');
        });

        test('Admin should update any user', async () => {
            const response = await request(app)
                .put(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Admin Updated Name'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('User should not change own role', async () => {
            const response = await request(app)
                .put(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    role: 'admin'
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });

        test('Admin should change user role', async () => {
            const response = await request(app)
                .put(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    role: 'admin'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.role).toBe('admin');
        });
    });

    describe('DELETE /api/users/:id - Delete user', () => {
        test('Regular user should be forbidden', async () => {
            const response = await request(app)
                .delete(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });

        test('Admin should delete user', async () => {
            const response = await request(app)
                .delete(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('Should fail for non-existent user', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .delete(`/api/users/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });
});
