import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase.js";
import { Tenant } from "../../types.js";

export class TenantRepository {
  static async getAllTenants(): Promise<Tenant[]> {
    const snapshot = await getDocs(collection(db, 'tenants'));
    return snapshot.docs.map(doc => doc.data() as Tenant);
  }

  static async getTenantById(tenantId: string): Promise<Tenant | null> {
    const d = await getDoc(doc(db, 'tenants', tenantId));
    if (d.exists()) {
      return d.data() as Tenant;
    }
    return null;
  }
}
