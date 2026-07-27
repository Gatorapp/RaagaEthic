import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Order, OrderItem } from "@shared/schema";
import { useAdmin } from "@/lib/admin-context";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Trash2 } from "lucide-react";

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
  const { adminKey, isReady } = useAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteCandidate, setDeleteCandidate] = useState<Order | null>(null);

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/orders", undefined, { "x-admin-key": adminKey || "" });
      return res.json();
    },
    enabled: isReady && !!adminKey,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/admin/orders/${id}`, { status }, { "x-admin-key": adminKey || "" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Order status updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) =>
      apiRequest("DELETE", `/api/admin/orders/${id}`, undefined, {
        "x-admin-key": adminKey || "",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      setDeleteCandidate(null);
      toast({ title: "Order deleted" });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not delete order",
        description: error.message,
        variant: "destructive",
      });
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
                    <TableCell className="min-w-[240px]">
                      <div className="space-y-1.5">
                        {items.map((item, index) => (
                          <div
                            key={`${item.productId}-${item.size}-${index}`}
                            className="flex items-center justify-between gap-3 text-xs"
                          >
                            <span className="min-w-0 truncate text-muted-foreground">
                              {item.name} ({item.size})
                            </span>
                            <Badge
                              variant="outline"
                              className="shrink-0"
                              data-testid={`text-order-item-quantity-${o.id}-${index}`}
                            >
                              Qty: {item.qty}
                            </Badge>
                          </div>
                        ))}
                      </div>
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
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8"
                          onClick={() => setDeleteCandidate(o)}
                          aria-label={`Delete order ${o.orderNumber}`}
                          data-testid={`button-delete-order-${o.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

      <AlertDialog
        open={Boolean(deleteCandidate)}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeleteCandidate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this order?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCandidate
                ? `Order ${deleteCandidate.orderNumber} will permanently disappear from the backend.`
                : "This order will be permanently deleted."}
              {" "}This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!deleteCandidate || deleteMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (deleteCandidate) deleteMutation.mutate(deleteCandidate.id);
              }}
              data-testid="button-confirm-delete-order"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
