import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Edit, Plus, Upload, X, CloudUpload } from "lucide-react";
import {
  BUCKET, LOCAL_ASSETS, productImageRefs, resolveImageUrls, uploadProductImage, FALLBACK_IMAGE,
} from "@/lib/productImages";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  images: string[] | null;
  category: string | null;
  stock_quantity: number;
  in_stock: boolean;
}

const db = () => (supabase as any).schema("api").from("products");

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "", description: "", price: "", category: "", stock_quantity: "",
  });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    const { data, error } = await db().select("*").order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to fetch products");
    } else {
      const list: Product[] = (data || []).map((p: any) => ({ ...p, price: Number(p.price) }));
      setProducts(list);
      const refs = list.map((p) => productImageRefs(p)[0] || "");
      const urls = await resolveImageUrls(refs.filter(Boolean));
      const map: Record<string, string> = {};
      let j = 0;
      list.forEach((p, i) => { if (refs[i]) map[p.id] = urls[j++]; });
      setThumbs(map);
    }
    setLoading(false);
  };

  const loadPreviews = async (refs: string[]) => {
    const urls = await resolveImageUrls(refs);
    setPreviews((prev) => {
      const next = { ...prev };
      refs.forEach((r, i) => { if (urls[i]) next[r] = urls[i]; });
      return next;
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const added: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) { toast.error(`${file.name} is not an image`); continue; }
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is over 10MB`); continue; }
      try {
        const ext = file.name.split(".").pop() || "jpg";
        added.push(await uploadProductImage(file, ext));
      } catch (e: any) {
        toast.error(`Upload failed: ${e.message}`);
      }
    }
    if (added.length) {
      setImages((prev) => [...prev, ...added]);
      await loadPreviews(added);
      toast.success(`${added.length} photo(s) uploaded`);
    }
    setUploading(false);
  };

  const removeImage = async (ref: string) => {
    setImages((prev) => prev.filter((r) => r !== ref));
    if (!ref.startsWith("http") && !LOCAL_ASSETS[ref]) {
      await supabase.storage.from(BUCKET).remove([ref]);
    }
  };

  const makeCover = (ref: string) => setImages((prev) => [ref, ...prev.filter((r) => r !== ref)]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const stock = parseInt(formData.stock_quantity);
    const productData = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      images,
      image_url: images[0] || null,
      category: formData.category || null,
      stock_quantity: stock,
      in_stock: stock > 0,
    };
    const { error } = editingProduct
      ? await db().update(productData).eq("id", editingProduct.id)
      : await db().insert([productData]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(editingProduct ? "Product updated successfully" : "Product created successfully");
      setIsDialogOpen(false);
      resetForm();
      fetchProducts();
    }
    setLoading(false);
  };

  const handleDelete = async (product: Product) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const { error } = await db().delete().eq("id", product.id);
    if (error) {
      toast.error("Failed to delete product");
    } else {
      const stored = productImageRefs(product).filter((r) => !r.startsWith("http") && !LOCAL_ASSETS[r]);
      if (stored.length) await supabase.storage.from(BUCKET).remove(stored);
      toast.success("Product deleted successfully");
      fetchProducts();
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    const refs = productImageRefs(product);
    setImages(refs);
    loadPreviews(refs);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      category: product.category || "",
      stock_quantity: product.stock_quantity.toString(),
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setImages([]);
    setFormData({ name: "", description: "", price: "", category: "", stock_quantity: "" });
  };

  // One-time move: copy the built-in sample photos into Supabase Storage
  const migrateBuiltInPhotos = async () => {
    setMigrating(true);
    try {
      const uploaded: Record<string, string> = {};
      let moved = 0;
      for (const p of products) {
        const refs = productImageRefs(p);
        if (!refs.some((r) => LOCAL_ASSETS[r])) continue;
        const newRefs: string[] = [];
        for (const r of refs) {
          if (!LOCAL_ASSETS[r]) { newRefs.push(r); continue; }
          if (!uploaded[r]) {
            const blob = await (await fetch(LOCAL_ASSETS[r])).blob();
            uploaded[r] = await uploadProductImage(new File([blob], r, { type: "image/jpeg" }), "jpg");
          }
          newRefs.push(uploaded[r]);
        }
        const { error } = await db().update({ images: newRefs, image_url: newRefs[0] }).eq("id", p.id);
        if (error) throw error;
        moved++;
      }
      toast.success(moved ? `Moved photos for ${moved} product(s) to storage` : "All photos are already in storage");
      fetchProducts();
    } catch (e: any) {
      toast.error(`Move failed: ${e.message}`);
    }
    setMigrating(false);
  };

  const hasBuiltIn = products.some((p) => productImageRefs(p).some((r) => LOCAL_ASSETS[r]));

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your products and inventory</p>
        </div>
        <div className="flex gap-2">
          {hasBuiltIn && (
            <Button variant="outline" onClick={migrateBuiltInPhotos} disabled={migrating}>
              <CloudUpload className="w-4 h-4 mr-2" />
              {migrating ? "Moving photos..." : "Move sample photos to storage"}
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                <DialogDescription>
                  {editingProduct ? "Update product details" : "Create a new product"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input id="name" value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input id="price" type="number" step="0.01" value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <Input id="stock" type="number" value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Photos</Label>
                  {images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {images.map((ref, i) => (
                        <div key={ref} className="relative group">
                          <img src={previews[ref] || FALLBACK_IMAGE} alt={`Photo ${i + 1}`}
                            className="w-full h-20 object-cover rounded-md border cursor-pointer"
                            onClick={() => makeCover(ref)} title="Click to make cover photo" />
                          {i === 0 && <Badge className="absolute bottom-1 left-1 text-[10px] px-1 py-0">Cover</Badge>}
                          <button type="button" onClick={() => removeImage(ref)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                            aria-label="Remove photo">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-md p-4 cursor-pointer hover:bg-muted text-sm text-muted-foreground">
                    <Upload className="w-4 h-4" />
                    {uploading ? "Uploading..." : "Upload photos (up to 10MB each)"}
                    <input type="file" accept="image/*" multiple className="hidden" disabled={uploading}
                      onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
                  </label>
                  {images.length > 1 && <p className="text-xs text-muted-foreground">Click a photo to make it the cover.</p>}
                </div>
                <Button type="submit" className="w-full" disabled={loading || uploading}>
                  {loading ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>Manage your product inventory</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && products.length === 0 ? (
            <p>Loading products...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Photo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <img src={thumbs[product.id] || FALLBACK_IMAGE} alt={product.name}
                        className="w-12 h-12 object-cover rounded-md" />
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category || "Uncategorized"}</TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>{product.stock_quantity}</TableCell>
                    <TableCell>
                      <Badge variant={product.in_stock ? "default" : "destructive"}>
                        {product.in_stock ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(product)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <DiscountsManager />
      </div>
    </div>
  );
}
