export type Gender = "male" | "female";

export type Sexuality = "heterosexual" | "homosexual" | "bisexual";

export interface UserInfo {
    name: string;
    player: Gender;
    sexuality: Sexuality
    harasser: Gender;
}

export const DEBUG: boolean = import.meta.env.VITE_DEBUG === 'true';