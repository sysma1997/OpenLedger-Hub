import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc.js";

import type { Base } from "../../shared/domain/Base";

dayjs.extend(dayjsUtc);

export class User implements Base {
    public readonly name: string;
    public readonly email: string;
    public readonly createAt: Date;
    
    public readonly id?: string | undefined;
    public readonly password?: string | undefined;
    public readonly lastUpdate?: Date | undefined;
    public readonly profile?: string | undefined;
    public readonly config?: UserConfig | undefined;

    constructor(name: string, 
        email: string, 
        createAt: Date, 
        id?: string, 
        password?: string, 
        lastUpdate?: Date, 
        profile?: string, 
        config?: UserConfig) {
        if (!name || !email) {
            let message: string = "";
            let lineBreak: number = 0;

            if (!name) {
                message += "The name for user is required.";
                lineBreak++;
            }
            if (!email) message += ((lineBreak++ > 0) ? "\n" : "") + 
                "The email for user is required.";
            
            throw new Error(message);
        }
        if (!User.IsValidEmail(email)) 
            throw new Error(`The '${email}' is not a valid email.`);

        this.name = name;
        this.email = email;
        this.password = password;
        this.createAt = createAt;
            
        this.id = id;
        this.password = password;
        this.lastUpdate = lastUpdate;
        this.profile = profile;
        this.config = config;
    }

    static FromDto(dto: UserDto): User {
        const createAt = dayjs.utc(dto.createAt).toDate();
        const lastUpdate = (dto.lastUpdate) ? dayjs.utc(dto.lastUpdate).toDate() : undefined;
        return new User(dto.name, dto.email, createAt, 
            dto.id, dto.password, lastUpdate, 
            dto.profile, dto.config);
    }
    static IsValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    setName(name: string): User {
        return new User(name, this.email, this.createAt, 
            this.id, this.password, this.lastUpdate, 
            this.profile, this.config);
    }
    setEmail(email: string): User {
        return new User(this.name, email, this.createAt, 
            this.id, this.password, this.lastUpdate, 
            this.profile, this.config);
    }
    setLastUpdate(lastUpdate: Date | undefined): User {
        return new User(this.name, this.email, this.createAt, 
            this.id, this.password, lastUpdate, 
            this.profile, this.config);
    }
    setProfile(profile?: string | undefined): User {
        return new User(this.name, this.email, this.createAt, 
            this.id, this.password, this.lastUpdate, 
            profile, this.config);
    }
    setConfig(config?: UserConfig | undefined): User {
        return new User(this.name, this.email, this.createAt, 
            this.id, this.password, this.lastUpdate, 
            this.profile, config);
    }

    toDto(showPassword: boolean = false): UserDto {
        const user: UserDto =  {
            name: this.name, 
            email: this.email, 
            createAt: dayjs.utc(this.createAt).toDate().toString()
        };

        if (this.id != null) user.id = this.id;
        if (showPassword) user.password = this.password;
        if (this.lastUpdate != null) user.lastUpdate = dayjs.utc(this.lastUpdate).toDate().toString();
        if (this.profile) user.profile = this.profile;
        if (this.config) user.config = this.config;

        return user;
    }
    toString(showPassword: boolean = false): string {
        return JSON.stringify(this.toDto(showPassword));
    }
}
export interface UserDto {
    name: string;
    email: string;
    createAt: string;
    
    id?: string;
    password?: string;
    lastUpdate?: string;
    profile?: string;
    config?: UserConfig;
}
export interface UserConfig {
    twoStep: {
        active: boolean, 
        type: string
    }
}