'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_SALT_ROUNDS = 12;

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Administrator email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return EMAIL_REGEX.test(v);
        },
        message: 'Administrator email is not valid'
      }
    },
    password: {
      type: String,
      required: [true, 'Password hash is required']
    },
    name: {
      type: String,
      required: [true, 'Administrator name is required'],
      trim: true,
      maxlength: [100, 'Name must not exceed 100 characters'],
      default: 'Institute Administrator'
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'superadmin'],
        message: 'Invalid administrative role'
      },
      default: 'admin'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLoginAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      }
    }
  }
);

// Hash password before saving if modified, guarding against double-hashing
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  // If already a valid bcrypt hash, do not re-hash
  if (/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(this.password)) {
    return next();
  }

  if (this.password.length < 8) {
    return next(new Error('Password must be at least 8 characters long'));
  }

  try {
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare candidate password
adminSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || !this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = {
  Admin,
  BCRYPT_SALT_ROUNDS,
  EMAIL_REGEX
};
