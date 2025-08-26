import { useNuxtApp } from "nuxt/app";
import type {
    State,
    SignupResponse,
    SigninResponse,
    ResetPasswordResponse,
    UpdatePasswordResponse,
} from "./types";

function initialState(): State {
    return {
        authUser: null,
        loading: false,
        resetPasswordResponse: null,
        updatePasswordResponse: null,
        currentView: "signin",
    };
}

export const useAuthStore = defineStore("authStore", {
    state: (): State => initialState(),

    getters: {
        isLoggedIn(state): boolean {
            return !!state.authUser;
        },
        getAuthUser(state) {
            return state.authUser || null;
        },
        getResetPassword(state): ResetPasswordResponse | null {
            return state.resetPasswordResponse || null;
        },
        getUpdatePassword(state): UpdatePasswordResponse | null {
            return state.updatePasswordResponse || null;
        },
        getCurrentView(state): string {
            return state.currentView;
        },
    },

    actions: {
        initializeStore() {
            if (import.meta.client) {
                const storedUser = localStorage.getItem("authUser");
                if (storedUser) {
                    this.authUser = JSON.parse(storedUser);
                }
            }
        },

        async signup(formData: Record<string, any>) {
            const { $error } = useNuxtApp();
            this.loading = true;

            try {
                const data = await $fetch<SignupResponse>(
                    "/api/auth/signup",
                    {
                        method: "POST",
                        body: formData,
                    }
                );

                if (data?.status === "success") {
                    // this.authUser = data.data || {};
                    this.authUser = null;
                    if (import.meta.client) {
                        localStorage.removeItem("authUser");
                        localStorage.removeItem("authToken");
                    }
                } else {
                    throw new Error(data?.message || "Signup failed");
                }
            } catch (error: any) {
                $error(error.message || "Signup error");
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async signIn({ email, password }: { email: string; password: string }) {
            const { $error } = useNuxtApp();
            this.loading = true;

            try {
                const data = await $fetch<SigninResponse>(
                    "/api/auth/signin",
                    {
                        method: "POST",
                        body: { email, password },
                    }
                );

                if (data?.status === "success") {
                    this.authUser = data.user || {};
                    localStorage.setItem("authUser", JSON.stringify(data.user)); // Store user in localStorage
                    localStorage.setItem("authToken", data.token); // Store token
                } else {
                    throw new Error(data?.message || "Sign-in failed");
                }
            } catch (error: any) {
                throw error;
            } finally {
                this.loading = false;
            }
        },
        async googleSignIn(formData: Record<string, any>) {
            const { $error } = useNuxtApp();
            this.loading = true;

            try {
                const data = await $fetch<SigninResponse>(
                    "/api/auth/google-signin",
                    {
                        method: "POST",
                        body: formData,
                    }
                );

                if (data?.status === "success") {
                    this.authUser = data.user || {};
                    localStorage.setItem("authUser", JSON.stringify(data.user));
                    localStorage.setItem("authToken", data.token);

                    return {
                        status: "success",
                        message: data.message || "Sign-in successful!",
                        redirect: data.redirect || "/profile",
                    };
                } else {
                    throw new Error(data?.message || "Sign-in failed");
                }
            } catch (error: any) {
                $error(error.message || "An unknown error occurred during sign-in.");
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async resetPassword(formData: Record<string, any> | null) {
            this.loading = true;

            try {
                const data = await $fetch<ResetPasswordResponse>(
                    "/api/auth/reset-password",
                    {
                        method: "POST",
                        body: formData,
                    }
                );

                if (data?.status === "success") {
                    return data;
                } else {
                    throw new Error(
                        data?.message || "Failed to send Reset reset email"
                    );
                }
            } catch (error: any) {
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async updatePassword(formData: Record<string, any> | null) {
            this.loading = true;

            try {
                const data = await $fetch<UpdatePasswordResponse>(
                    "/api/auth/update-password",
                    {
                        method: "POST",
                        body: formData,
                    }
                );

                if (data?.status === "success") {
                    return data;
                } else {
                    throw new Error(data?.message || "Failed to Update Password");
                }
            } catch (error: any) {
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async signOut() {
            try {
                this.authUser = null;
                localStorage.removeItem("authUser");
                localStorage.removeItem("authToken");
                navigateTo("/");
            } catch (error) {
                console.error("Error during logout:", error.message);
            }
        },
    },
});
