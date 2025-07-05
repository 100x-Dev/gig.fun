'use client';

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';
import { Badge } from '~/components/ui/Badge';
import { format } from 'date-fns';

type PaymentStatus = 'completed' | 'pending' | 'failed';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description: string;
  date: string;
  serviceTitle?: string;
  receiver?: string;
}

const statusVariant = {
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
};

const statusLabel = {
  completed: 'Completed',
  pending: 'Pending',
  failed: 'Failed',
};

export default function PaymentHistory({ payments }: { payments: Payment[] }) {
  if (!payments?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            No payment history found.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {payments.map((payment) => (
          <div key={payment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">
                  {payment.serviceTitle || 'Service Payment'}
                </h4>
                {payment.receiver && (
                  <p className="text-sm text-gray-500">To: {payment.receiver}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {format(new Date(payment.date), 'MMM d, yyyy')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: payment.currency || 'USD',
                  }).format(payment.amount)}
                </p>
                <Badge className={`mt-1 ${statusVariant[payment.status]}`}>
                  {statusLabel[payment.status]}
                </Badge>
              </div>
            </div>
            {payment.description && (
              <p className="text-sm text-gray-600 mt-2">
                {payment.description}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
