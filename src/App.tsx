import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import { lazy, Suspense } from "react";
import { canPurchaseProduct } from "@/lib/productAvailability";

const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCanceled = lazy(() => import("./pages/PaymentCanceled"));
const ShippingDetails = lazy(() => import("./pages/ShippingDetails"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const Contact = lazy(() => import("./pages/Contact"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div role="status" className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/product/:id" element={<ProductDetail onAddToCart={(product, quantity) => {
              if (!canPurchaseProduct(product)) return;
              const cart = JSON.parse(localStorage.getItem("cart") || "[]");
              const existing = cart.find((i: any) => i.id === product.id);
              if (existing) existing.quantity += quantity;
              else cart.push({ ...product, quantity });
              localStorage.setItem("cart", JSON.stringify(cart));
            }} />} />

            <Route path="/shipping-details" element={<ShippingDetails />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-canceled" element={<PaymentCanceled />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/shipping-policy" element={<ShippingPolicy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
