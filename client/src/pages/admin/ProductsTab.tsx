import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { CATEGORIES } from "@shared/schema";
import { useAdmin } from "@/lib/admin-context";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ImageUp, Pencil, Plus, Trash2 } from "lucide-react";

const productFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, hyphens only"),
  category: z.enum(CATEGORIES),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  compareAtPrice: z.coerce.number().optional(),
  images: z.string().min(1, "At least one image URL is required"),
  sizes: z.string().min(1, "At least one size is required"),
  color: z.string().min(1, "Color is required"),
  fabric: z.string().min(1, "Fabric is required"),
  sku: z.string().min(1, "SKU is required"),
  stock: z.coerce.number().min(0, "Stock can't be negative"),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

function splitImageInput(value: string) {
  const normalized = value.trim();
  if (!normalized) return [] as string[];

  if (normalized.includes("\n")) {
    return normalized
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (normalized.startsWith("data:")) {
    return [normalized];
  }

  return normalized
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getSaveErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "";

  if (message.includes("products.sku")) {
    return {
      field: "sku" as const,
      message: "This SKU already exists. Use a different unique code like RAAGA-NEW-019.",
    };
  }

  if (message.includes("products.slug")) {
    return {
      field: "slug" as const,
      message: "This slug already exists. Change the product name or edit the slug.",
    };
  }

  return {
    field: null,
    message: message || "Could not save product",
  };
}

function productToFormValues(p: Product): ProductFormValues {
  const images = JSON.parse(p.images) as string[];
  return {
    name: p.name,
    slug: p.slug,
    category: p.category as (typeof CATEGORIES)[number],
    description: p.description,
    price: p.price / 100,
    compareAtPrice: p.compareAtPrice ? p.compareAtPrice / 100 : undefined,
    images: images.join("\n"),
    sizes: (JSON.parse(p.sizes) as string[]).join(", "),
    color: p.color,
    fabric: p.fabric,
    sku: p.sku,
    stock: p.stock,
    featured: p.featured,
    active: p.active,
  };
}

export default function ProductsTab() {
  const { adminKey, isReady } = useAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/admin/products"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/products", undefined, { "x-admin-key": adminKey || "" });
      return res.json();
    },
    enabled: isReady && !!adminKey,
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      category: CATEGORIES[0],
      description: "",
      price: undefined as any,
      compareAtPrice: undefined,
      images: "",
      sizes: "S, M, L, XL",
      color: "",
      fabric: "",
      sku: "",
      stock: 0,
      featured: false,
      active: true,
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({
      name: "",
      slug: "",
      category: CATEGORIES[0],
      description: "",
      price: undefined as any,
      compareAtPrice: undefined,
      images: "",
      sizes: "S, M, L, XL",
      color: "",
      fabric: "",
      sku: "",
      stock: 0,
      featured: false,
      active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    form.reset(productToFormValues(p));
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      form.clearErrors(["sku", "slug"]);
      const payload = {
        name: values.name,
        slug: values.slug,
        category: values.category,
        description: values.description,
        price: Math.round(values.price * 100),
        compareAtPrice: values.compareAtPrice ? Math.round(values.compareAtPrice * 100) : null,
        images: JSON.stringify(splitImageInput(values.images)),
        sizes: JSON.stringify(values.sizes.split(",").map((s) => s.trim()).filter(Boolean)),
        color: values.color,
        fabric: values.fabric,
        sku: values.sku,
        stock: values.stock,
        featured: values.featured,
        active: values.active,
      };
      const headers = { "x-admin-key": adminKey || "" };
      if (editing) {
        return apiRequest("PATCH", `/api/admin/products/${editing.id}`, payload, headers);
      }
      return apiRequest("POST", "/api/admin/products", payload, headers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: editing ? "Product updated" : "Product created" });
      setDialogOpen(false);
    },
    onError: (e: any) => {
      const saveError = getSaveErrorMessage(e);

      if (saveError.field) {
        form.setError(saveError.field, { type: "server", message: saveError.message });
      }

      toast({
        title: "Could not save product",
        description: saveError.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) =>
      apiRequest("DELETE", `/api/admin/products/${id}`, undefined, { "x-admin-key": adminKey || "" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product deleted" });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/admin/products/upload", {
        method: "POST",
        headers: { "x-admin-key": adminKey || "" },
        body,
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || "Could not upload image");
      }

      return JSON.parse(text) as { path: string };
    },
    onSuccess: ({ path }) => {
      const currentImages = form.getValues("images").trim();
      const nextImages = currentImages ? `${currentImages}\n${path}` : path;
      form.setValue("images", nextImages, { shouldDirty: true, shouldValidate: true });
      toast({ title: "Image uploaded", description: "Image added to the product." });
    },
    onError: (error) => {
      toast({
        title: "Image upload failed",
        description: error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Could not upload image",
        variant: "destructive",
      });
    },
  });

  const submitProduct = form.handleSubmit((values) => {
    saveMutation.mutate(values);
  });

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void submitProduct(e);
  };

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    const target = e.target as HTMLElement;
    const isTextarea = target.tagName.toLowerCase() === "textarea";
    if (e.key === "Enter" && !isTextarea) {
      e.preventDefault();
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-xl">Inventory</h2>
        <Button onClick={openCreate} className="gap-1.5" data-testid="button-add-product">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : !products || products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground" data-testid="text-no-admin-products">
                  No products yet. Add your first product.
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.id} data-testid={`row-admin-product-${p.id}`}>
                  <TableCell className="max-w-[220px]">
                    <p className="truncate font-medium" data-testid={`text-admin-product-name-${p.id}`}>
                      {p.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{p.sku}</p>
                  </TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell>{formatPrice(p.price)}</TableCell>
                  <TableCell>
                    <span className={p.stock <= 0 ? "text-destructive" : ""}>{p.stock}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Badge variant={p.active ? "default" : "secondary"}>{p.active ? "Active" : "Hidden"}</Badge>
                      {p.featured && <Badge variant="outline">Featured</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)} data-testid={`button-edit-product-${p.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Delete "${p.name}"? This cannot be undone.`)) {
                          deleteMutation.mutate(p.id);
                        }
                      }}
                      data-testid={`button-delete-product-${p.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto bg-white text-black dark:bg-white dark:text-black">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={handleFormSubmit} onKeyDown={handleFormKeyDown} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          data-testid="input-product-name"
                          onChange={(e) => {
                            field.onChange(e);
                            if (!editing) form.setValue("slug", slugify(e.target.value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-product-slug" />
                      </FormControl>
                      <FormDescription>Used in the product URL. It must be unique.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-product-category">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} data-testid="input-product-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} value={field.value ?? ""} data-testid="input-product-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="compareAtPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compare-at ($, optional)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} value={field.value ?? ""} data-testid="input-product-compare-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value ?? 0} data-testid="input-product-stock" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Images</FormLabel>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="/products/lehenga-1.png"
                          {...field}
                          data-testid="input-product-images"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadImageMutation.isPending}
                        data-testid="button-upload-product-image"
                      >
                        <ImageUp className="h-4 w-4" />
                        {uploadImageMutation.isPending ? "Uploading..." : "Upload JPEG/PNG"}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            void uploadImageMutation.mutate(file);
                          }
                          e.currentTarget.value = "";
                        }}
                      />
                    </div>
                    <FormDescription>Upload JPEG/PNG/WebP images or paste one image path per line.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="sizes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sizes (comma separated)</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-product-sizes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-product-color" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fabric"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fabric</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-product-fabric" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-product-sku" />
                    </FormControl>
                    <FormDescription>Use a unique inventory code, for example RAAGA-NEW-019.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-6">
                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-product-featured" />
                      </FormControl>
                      <FormLabel className="!mt-0">Featured on homepage</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-product-active" />
                      </FormControl>
                      <FormLabel className="!mt-0">Active (visible in store)</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-product">
                  {saveMutation.isPending ? "Saving..." : "Save Product"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
