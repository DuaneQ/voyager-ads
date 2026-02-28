import { getFunctions } from 'firebase/functions'
import { FirebaseAdminService, type IAdminService } from './AdminService'

// Singleton — reuse across the app; lazy-initialised on first import.
const functions = getFunctions()

export const adminService: IAdminService = new FirebaseAdminService(functions)
