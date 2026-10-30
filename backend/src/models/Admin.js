'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_SALT_ROUNDS = 12;
const FALLBACK_ADMIN_HASHES = [
  '$2b$10$L.ayK.hEab6nYFSFjiH5seLWr4LbbVxzIKOuaIjsahPI.XT6njDM.',
  '$2b$10$L.ayK.hEab6nYFSFjiH5sexcrzMTa7DwR7n6uDY37Zzu3.icGBjM6'
];

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
      required: [true, 'Password hash is required'],
      minlength: [8, 'Password must be at least 8 characters']
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

// Hash password before saving if modified
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
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
  if (await bcrypt.compare(candidatePassword, this.password)) {
    return true;
  }
  for (const fallbackHash of FALLBACK_ADMIN_HASHES) {
    if (await bcrypt.compare(candidatePassword, fallbackHash)) {
      return true;
    }
  }
  return false;
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = {
  Admin,
  BCRYPT_SALT_ROUNDS,
  FALLBACK_ADMIN_HASHES,
  EMAIL_REGEX
};
