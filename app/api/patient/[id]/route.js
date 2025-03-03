import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import models from '@/lib/schema'

export async function DELETE(request, { params }) {
  try {
    const { id } = params
    await connectDB()
    
    const patient = await models.Patient.findByIdAndDelete(id)
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ message: 'Patient deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete patient' },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    
    await connectDB()
    const patient = await models.Patient.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    )
    
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(patient)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update patient' },
      { status: 500 }
    )
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = params
    await connectDB()
    
    const patient = await models.Patient.findById(id)
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(patient)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch patient' },
      { status: 500 }
    )
  }
} 