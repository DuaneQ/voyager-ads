import { functions } from '../../config/firebaseConfig'
import { FirebaseAdsBillingService, type IAdsBillingService } from './AdsBillingService'

export const adsBillingService: IAdsBillingService = new FirebaseAdsBillingService(functions)