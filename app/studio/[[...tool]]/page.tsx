'use client'
import { NextStudio } from 'next-sanity/studio'
import config from '../../../sanity.config'

export default function StudioPage() { return <div className="studio-shell"><NextStudio config={config} /></div> }
