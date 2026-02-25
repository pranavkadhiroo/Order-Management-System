import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const { email, otp } = body;

        if (!email || !otp) {
            return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
        }

        const verification = await prisma.emailVerification.findUnique({
            where: { email }
        });

        if (!verification) {
            return NextResponse.json({ error: 'No OTP found for this email' }, { status: 404 });
        }

        if (verification.verified) {
            return NextResponse.json({ error: 'Email is already verified' }, { status: 400 });
        }

        if (verification.expiresAt < new Date()) {
            return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
        }

        if (verification.otp !== otp) {
            return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
        }

        // Mark as verified
        await prisma.emailVerification.update({
            where: { email },
            data: {
                verified: true
            }
        });

        return NextResponse.json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
    }
}
