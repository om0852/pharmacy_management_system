import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'smartcoder0852@gmail.com', // Replace with your email
    pass: process.env.EMAIL_PASSWORD // Add this to your .env file
  }
});

export async function POST(request) {
  try {
    const { subject, content } = await request.json();

    const mailOptions = {
      from: 'smartcoder0852@gmail.com',
      to: 'salunkeom474@gmail.com',
      subject: subject,
      html: content
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 