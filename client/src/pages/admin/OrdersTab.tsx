import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Order, OrderItem } from "@shared/schema";
import { useAdmin } from "@/lib/admin-context";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  paid: "default",
  fulfilled: "outline",
  cancelled: "destructive",
};

export default function OrdersTab() {
  const { adminKey } = useAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/orders", undefined, { "x-admin-key": adminKey || "" });
      return res.json();
    },
    enabled: !!adminKey,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/admin/orders/${id}`, { status }, { "x-admin-key": adminKey || "" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Order status updated" });
    },
  });

  return (
    <div>
      <h2 className="mb-4 font-serif text-xl">Orders</h2>
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Placed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : !orders || orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground" data-testid="text-no-orders">
                  No orders yet.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => {
                const items: OrderItem[] = JSON.parse(o.items);
                return (
                  <TableRow key={o.id} data-testid={`row-order-${o.id}`}>
                    <TableCell className="font-medium" data-testid={`text-order-number-${o.id}`}>
                      {o.orderNumber}
                    </TableCell>
                    <TableCell>
                      <p>{o.customerName}</p>
                      <p className="text-xs text-muted-foreground">{o.email}</p>
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <p className="truncate text-xs text-muted-foreground">
                        {items.map((i) => `${i.name} (${i.size}) x${i.qty}`).join(", ")}
                      </p>
                    </TableCell>
                    <TableCell>{formatPrice(o.total)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={STATUS_VARIANT[o.status] || "secondary"} data-testid={`badge-order-status-${o.id}`}>
                          {o.status}
                        </Badge>
                        <Select
                          value={o.status}
                          onValueChange={(status) => statusMutation.mutate({ id: o.id, status })}
                        >
                          <SelectTrigger className="h-8 w-28" data-testid={`select-order-status-${o.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["pending", "paid", "fulfilled", "cancelled"].map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
