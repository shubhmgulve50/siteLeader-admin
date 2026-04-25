import z from "zod";

export const addAdvisorSchema = z
  .object({
    name: z.string().min(1, { message: "Name is required" }),
    phone: z
      .string()
      .min(10, { message: "Phone number must be at least 10 digits" })
      .max(10, { message: "Phone number must be exactly 10 digits" })
      .regex(/^\d+$/, { message: "Phone number must contain only digits" }),
    email: z
      .string()
      .email({ message: "Invalid email" })
      .optional()
      .or(z.literal("")),
    professionType: z.enum(["job", "business"], {
      required_error: "Please select a profession type",
    }),
    // Job-related fields
    jobTitle: z.string().optional(),
    companyName: z.string().optional(),
    jobLocation: z.string().optional(),
    jobExperience: z.string().optional(),
    jobSalary: z.string().optional(),
    // Business-related fields
    businessName: z.string().optional(),
    businessType: z.string().optional(),
    businessLocation: z.string().optional(),
    businessExperience: z.string().optional(),
    businessRevenue: z.string().optional(),
  })
  .refine(
    (data) => {
      // If profession type is job, validate job fields
      if (data.professionType === "job") {
        return data.jobTitle && data.companyName && data.jobLocation;
      }
      // If profession type is business, validate business fields
      if (data.professionType === "business") {
        return data.businessName && data.businessType && data.businessLocation;
      }
      return true;
    },
    {
      message:
        "Please fill in all required fields for the selected profession type",
      path: ["professionType"],
    }
  );
