import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Package, Eye } from "lucide-react";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shippingComplete = searchParams.get('shipping_complete');

  useEffect(() => {
    document.title = "Order Complete - Thank You!";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", "Thank you for your purchase! Your handcrafted item order has been completed successfully.");
    
    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = window.location.origin + "/payment-success";

    // If no shipping details completed, redirect to shipping page
    if (!shippingComplete) {
      const timer = setTimeout(() => {
        navigate('/shipping-details');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [shippingComplete, navigate]);

  const handleViewShippingDetails = () => {
    const shippingData = localStorage.getItem('shipping_details');
    if (shippingData) {
      const details = JSON.parse(shippingData);
      alert(`Shipping to: ${details.firstName} ${details.lastName}\n${details.address}, ${details.city}, ${details.state} ${details.zipCode}`);
    }
  };

  if (!shippingComplete) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-muted-foreground mb-4">
              Redirecting you to shipping details...
            </p>
            <div className="animate-pulse">
              <div className="h-2 bg-primary/20 rounded-full">
                <div className="h-2 bg-primary rounded-full w-3/4 animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <CheckCircle className="h-20 w-20 text-green-600 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">Order Complete!</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Thank you for your purchase! Your handcrafted item will be carefully prepared and shipped to you.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Package className="h-5 w-5" />
              What's Next?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <h3 className="font-medium">Order Processing</h3>
                <p className="text-sm text-muted-foreground">
                  Your order is being prepared by our artisans (1-2 business days)
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <h3 className="font-medium">Shipping</h3>
                <p className="text-sm text-muted-foreground">
                  Your item will be carefully packaged and shipped (3-5 business days)
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <h3 className="font-medium">Delivery</h3>
                <p className="text-sm text-muted-foreground">
                  You'll receive a tracking number and delivery confirmation
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handleViewShippingDetails} variant="outline" className="gap-2">
            <Eye className="h-4 w-4" />
            View Shipping Details
          </Button>
          <Button onClick={() => navigate('/')} className="gap-2">
            Continue Shopping
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mt-8">
          A confirmation email has been sent to your email address with order details and tracking information.
        </p>
      </div>
    </main>
  );
};

export default PaymentSuccess;
