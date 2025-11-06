import {z} from 'zod';

const nameSchema = z.object({
    name: z.string().min(3,'User name must be at least 3 characters long').max(30,'User name must be at most 30 characters long'),
});
const passwordSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters long')
            .max(20, 'Password must be at most 20 characters long')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number')
            .regex(/[\W_]/, 'Password must contain at least one special character(!@#$%^&*)')
});
const emailSchema = z.object({
    email: z.string().email('Invalid email format')
});
export function checkUserSyntax(user) {
    const result = z.object({
        name: nameSchema.shape.name,
        email: emailSchema.shape.email,
        password: passwordSchema.shape.password
    }).safeParse(user);
    if(!result.success){
        return {success: false,message: result.error.flatten().fieldErrors};
    }else{
        return {success: true,message: 'Valid User format'};
    }
}
export function checkPasswordSyntax(password) {
    const result = passwordSchema.safeParse({password});
    if(!result.success){
        return {success: false,message: result.error.flatten().fieldErrors};
    }else{
        return {success: true,message: 'Valid User format'};
    }
}
export function checkEmailSyntax(email) {
    const result = emailSchema.safeParse({email});
    if(!result.success){
        return {success: false,message: result.error.flatten().fieldErrors};
    }else{
        return {success: true,message: 'Valid User format'};
    }
}
export function checkNameSyntax(name) {
    const result = nameSchema.safeParse({name});
    if(!result.success){
        return {success: false,message: result.error.flatten().fieldErrors};
    }else{
        return {success: true,message: 'Valid User format'};
    }
}