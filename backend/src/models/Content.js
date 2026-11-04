'use strict';

const mongoose = require('mongoose');

const contentItemSchema = new mongoose.Schema(
  {
    section: {
      type: String,
      required: true,
      index: true,
      enum: ['notices', 'courses', 'approvals', 'faculty', 'hospital-tieups', 'gallery', 'faqs', 'downloads']
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    subtitle: {
      type: String,
      trim: true,
      default: ''
    },
    content: {
      type: String,
      trim: true,
      default: ''
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    order: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
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

contentItemSchema.index({ section: 1, isActive: 1, order: 1 });

const ContentItem = mongoose.model('ContentItem', contentItemSchema);

module.exports = {
  ContentItem
};

