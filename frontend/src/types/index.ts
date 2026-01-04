export interface Facility {
    facilityId: number;
    name: string;
    location: string;
    type: string;
    capacity: number;
    imageUrl: string | null;
    status: string;
    price: number;
    priceType: 'PER_HOUR' | 'PER_BOOKING' | 'ONE_TIME';
    transactionType: string;
    requiresApproval: boolean;
    managerId: number;
}
