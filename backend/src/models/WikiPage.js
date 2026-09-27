import mongoose from 'mongoose';

const wikiPageSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'Technical Documentation',
    },
    attachmentUrl: {
      type: String,
      default: '',
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

wikiPageSchema.index({ projectId: 1, slug: 1 }, { unique: true });

const WikiPage = mongoose.model('WikiPage', wikiPageSchema);
export default WikiPage;
