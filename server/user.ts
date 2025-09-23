"use server";
import { auth } from "@/lib/auth"
import { success } from "zod";

export const signIn = async (email: string, password: string) => {
    try {
         await auth.api.signInEmail({
        body: {
            email,
            password,
        }
    })
    return ({
        success: true,
        message: "sign in successful"
    })
    } catch (error) {
        const e = error as Error 
        return ({
            success: false,
            message: e.message || "An unknown error occurred"
        })
    }
   
}

export const signUp = async (username: string, email: string, password: string) => {
    try {
        await auth.api.signUpEmail({
            body: {
                email,
                password,
                name: username
            }
        })
        return ({
            success: true,
            message: "sign up successful"
        })
    } catch (error) {
        const e = error as Error 
        return ({
            success: false,
            message: e.message || "An unknown error occurred"
        })
    }
}