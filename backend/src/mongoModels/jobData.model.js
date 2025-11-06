import mongoose, { Schema } from "mongoose";

const jobCompletionSchema = new Schema({
  jobName: { type: String, required: true, unique: true },
  lastRun: { type: Date, default: null },
},
{
  timestamps: true,
});
export const JobMeta = mongoose.model("JobMeta", jobCompletionSchema);