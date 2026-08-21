import mongoose, {InferSchemaType, Model, Schema} from "mongoose";

const userSchema = new Schema(
  {
    name: {type: String, required: true, trim: true},
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {type: String, required: true},
    securityQuestionId: {type: String, required: true},
    securityAnswerHash: {type: String, required: true},
  },
  {timestamps: true},
);

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

type UserModelType = Model<UserDocument>;

export const UserModel =
  (mongoose.models.User as UserModelType | undefined) ??
  mongoose.model<UserDocument>("User", userSchema);
