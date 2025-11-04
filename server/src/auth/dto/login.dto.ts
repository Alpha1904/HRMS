import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
    @ApiProperty({ description: 'The contact information of the user' })
    @IsString()
    @IsNotEmpty({ message: "Contact information is required" })
    @IsEmail({}, { message: 'Invalid email format' })
    email: string;

    @ApiProperty({ description: 'The password of the user' })
    @IsString()
    @IsNotEmpty({ message: "Password is required" })
    password: string;
};