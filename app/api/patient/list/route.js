import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import models from '@/lib/schema'

export async function GET() {
  try {
    await connectDB()
    const patients = await models.Patient.find({})
      .select('patientId name age contact bills')
      .sort({ createdAt: -1 })
    
    return NextResponse.json(patients)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    )
  }
} 