const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    studentCode: {
        type: String,
        required: function() {
            // Only required for 'user' role (students)
            return this.role === 'user';
        },
        unique: true,
        sparse: true, // Allow null/undefined values to be non-unique
        uppercase: true,
        trim: true,
        validate: {
            validator: function (v) {
                // Allow ADMIN format for admin users, SE format for students
                return /^(SE\d{6}|ADMIN\d{2})$/.test(v);
            },
            message: 'Student code must be in format SE followed by 6 digits (e.g., SE150001) or ADMIN followed by 2 digits for admin'
        }
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'lecture'],
        default: 'user'
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    refreshToken: {
        type: String,
        select: false
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String,
        select: false
    },
    otpExpires: {
        type: Date,
        select: false
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function () {
    // Only hash password if it's new or modified
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user without password
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.refreshToken;
    delete user.__v;
    return user;
};

// Static method to create default admin
userSchema.statics.createDefaultAdmin = async function () {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const existingAdmin = await this.findOne({ email: adminEmail });

    if (!existingAdmin) {
        await this.create({
            studentCode: 'ADMIN01',
            name: 'Administrator',
            email: adminEmail,
            password: adminPassword,
            role: 'admin',
            isEmailVerified: true
        });
        console.log(`✓ Default admin created: ${adminEmail}`);
    }
};

module.exports = mongoose.model('User', userSchema);
