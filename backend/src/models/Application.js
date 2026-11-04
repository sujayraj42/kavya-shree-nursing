'use strict';

const mongoose = require('mongoose');
const { VALID_PROGRAMS } = require('./Enquiry');

const VALID_APPLICATION_STATUSES = [
  'submitted',
  'under_review',
  'document_verified',
  'provisionally_selected',
  'rejected'
];

const GENDER_OPTIONS = ['Female', 'Male', 'Other'];
const CATEGORY_OPTIONS = ['General', 'OBC', 'SC', 'ST', 'EWS', 'Other'];

const applicationNoteSchema = new mongoose.Schema(
  {
    author: {
      type: String,
      required: [true, 'Note author identity is required'],
      trim: true,
      maxlength: [100, 'Author name must not exceed 100 characters']
    },
    text: {
      type: String,
      required: [true, 'Note text is required'],
      trim: true,
      minlength: [1, 'Note text cannot be empty'],
      maxlength: [1000, 'Note text must not exceed 1000 characters']
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      }
    }
  }
);

const applicationSchema = new mongoose.Schema(
  {
    applicationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    applicantName: {
      type: String,
      required: [true, 'Applicant full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must not exceed 100 characters']
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: {
        values: GENDER_OPTIONS,
        message: 'Invalid gender selection'
      }
    },
    dob: {
      type: Date,
      required: [true, 'Date of birth is required']
    },
    fatherName: {
      type: String,
      required: [true, "Father's name is required"],
      trim: true,
      maxlength: [100, "Father's name must not exceed 100 characters"]
    },
    motherName: {
      type: String,
      required: [true, "Mother's name is required"],
      trim: true,
      maxlength: [100, "Mother's name must not exceed 100 characters"]
    },
    phone: {
      type: String,
      required: [true, 'Contact phone number is required'],
      trim: true,
      minlength: [10, 'Phone number must contain at least 10 digits'],
      maxlength: [15, 'Phone number must not exceed 15 characters']
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      trim: true,
      lowercase: true,
      maxlength: [255, 'Email must not exceed 255 characters']
    },
    category: {
      type: String,
      enum: {
        values: CATEGORY_OPTIONS,
        message: 'Invalid category selection'
      },
      default: 'General'
    },
    address: {
      street: { type: String, trim: true, default: '' },
      district: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true, default: 'Bihar' },
      pincode: { type: String, required: true, trim: true }
    },
    program: {
      type: String,
      required: [true, 'Target academic program is required'],
      trim: true,
      enum: {
        values: VALID_PROGRAMS,
        message: 'Selected program is not an advertised discipline'
      }
    },
    academicDetails: {
      tenthBoard: { type: String, trim: true, default: '' },
      tenthYear: { type: Number, min: 1990, max: 2030 },
      tenthPercentage: { type: Number, min: 0, max: 100 },
      twelfthBoard: { type: String, trim: true, default: '' },
      twelfthYear: { type: Number, min: 1990, max: 2030 },
      twelfthPercentage: { type: Number, min: 0, max: 100 },
      pcbPercentage: { type: Number, min: 0, max: 100 }
    },
    documents: {
      photoUrl: { type: String, trim: true, default: null },
      tenthMarksheetUrl: { type: String, trim: true, default: null },
      twelfthMarksheetUrl: { type: String, trim: true, default: null }
    },
    declaration: {
      type: Boolean,
      required: [true, 'Applicant declaration must be accepted'],
      validate: {
        validator: function (v) {
          return v === true;
        },
        message: 'Declaration must be accepted'
      }
    },
    status: {
      type: String,
      enum: {
        values: VALID_APPLICATION_STATUSES,
        message: 'Invalid application status'
      },
      default: 'submitted'
    },
    notes: {
      type: [applicationNoteSchema],
      default: []
    },
    deletedAt: {
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
        return ret;
      }
    }
  }
);

applicationSchema.index({ createdAt: -1 });
applicationSchema.index({ status: 1, createdAt: -1 });
applicationSchema.index({ program: 1, createdAt: -1 });
applicationSchema.index({ phone: 1 });
applicationSchema.index({ email: 1 });
applicationSchema.index({ deletedAt: 1, createdAt: -1 });

const Application = mongoose.model('Application', applicationSchema);

module.exports = {
  Application,
  VALID_APPLICATION_STATUSES,
  GENDER_OPTIONS,
  CATEGORY_OPTIONS
};
