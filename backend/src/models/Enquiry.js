'use strict';

const mongoose = require('mongoose');

const VALID_PROGRAMS = [
  'Auxiliary Nursing & Midwifery (ANM)',
  'General Nursing & Midwifery (GNM)',
  'Bachelor of Science in Nursing (B.Sc.)',
  'Post Basic B.Sc. Nursing',
  'Master of Science in Nursing (M.Sc.)'
];

// Agreed standard workflow statuses
const VALID_STATUSES = ['new', 'contacted', 'in_review', 'admitted', 'closed', 'archived'];

// Backward compatibility: support historical 'resolved' records without corrupting data
const LEGACY_STATUSES = ['resolved'];
const ALL_ALLOWED_STATUSES = [...VALID_STATUSES, ...LEGACY_STATUSES];

function normalizeStatus(status) {
  if (status === 'resolved') {
    return 'closed';
  }
  return status;
}

const noteSchema = new mongoose.Schema(
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

const enquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Candidate full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must not exceed 100 characters']
    },
    phone: {
      type: String,
      required: [true, 'Contact phone number is required'],
      trim: true,
      minlength: [10, 'Phone number must contain at least 10 digits'],
      maxlength: [20, 'Phone number must not exceed 20 characters']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [255, 'Email must not exceed 255 characters'],
      default: null
    },
    program: {
      type: String,
      required: [true, 'Intended academic program is required'],
      trim: true,
      enum: {
        values: VALID_PROGRAMS,
        message: 'Selected program is not an advertised discipline'
      }
    },
    message: {
      type: String,
      trim: true,
      maxlength: [1000, 'Inquiry message must not exceed 1000 characters'],
      default: ''
    },
    consent: {
      type: Boolean,
      required: [true, 'Candidate consent is required to process admissions enquiry'],
      validate: {
        validator: function (v) {
          return v === true;
        },
        message: 'Candidate consent must be granted'
      }
    },
    status: {
      type: String,
      enum: {
        values: ALL_ALLOWED_STATUSES,
        message: 'Invalid enquiry status'
      },
      default: 'new'
    },
    notes: {
      type: [noteSchema],
      default: []
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

enquirySchema.index({ createdAt: -1 });
enquirySchema.index({ status: 1 });
enquirySchema.index({ status: 1, createdAt: -1 });
enquirySchema.index({ program: 1, createdAt: -1 });
enquirySchema.index({ phone: 1 });
enquirySchema.index({ email: 1 });

const Enquiry = mongoose.model('Enquiry', enquirySchema);

module.exports = {
  Enquiry,
  VALID_PROGRAMS,
  VALID_STATUSES,
  LEGACY_STATUSES,
  ALL_ALLOWED_STATUSES,
  normalizeStatus
};
