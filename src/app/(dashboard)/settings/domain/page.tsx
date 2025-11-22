"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Copy, CheckCircle2, AlertCircle, Globe, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";

export default function CustomDomainPage() {
  const { data: tenantConfig } = useTenant();
  const [copied, setCopied] = useState<string | null>(null);

  const subdomain = tenantConfig?.subdomain || "";
  const customDomain = tenantConfig?.customDomain || "";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "maliktechdairy.com";
  const cnameValue = subdomain ? `${subdomain}.${baseUrl}` : "";

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Custom Domain Setup</h1>
        <p className="text-muted-foreground mt-2">
          Configure a custom domain for your farm (Enterprise plan feature)
        </p>
      </div>

      {/* Current Subdomain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Current Subdomain
          </CardTitle>
          <CardDescription>
            Your farm is currently accessible via this subdomain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              value={cnameValue}
              readOnly
              className="font-mono"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(cnameValue, "subdomain")}
            >
              {copied === "subdomain" ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://${cnameValue}`, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom Domain Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Custom Domain</CardTitle>
          <CardDescription>
            Follow these steps to use your own domain (e.g., farm.yourdomain.com)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Enterprise Plan Required</AlertTitle>
            <AlertDescription>
              Custom domain is available for Enterprise plan subscribers only.
              <Button variant="link" className="p-0 h-auto ml-1" asChild>
                <a href="/dashboard/subscription">Upgrade now</a>
              </Button>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Step 1: Add CNAME Record</h3>
              <p className="text-sm text-muted-foreground mb-3">
                In your domain's DNS settings, add a CNAME record:
              </p>
              <div className="bg-muted p-4 rounded-lg space-y-2 font-mono text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground">Type:</span> CNAME
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    <Input
                      placeholder="farm"
                      className="inline-block w-32 h-6 text-sm"
                      defaultValue="farm"
                    />
                    <span className="text-muted-foreground">.yourdomain.com</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground">Value:</span>{" "}
                    <span className="font-semibold">{cnameValue}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(cnameValue, "cname")}
                  >
                    {copied === "cname" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground">TTL:</span> 3600 (or default)
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Step 2: Wait for DNS Propagation</h3>
              <p className="text-sm text-muted-foreground">
                DNS changes can take up to 48 hours to propagate, though usually it's much faster
                (15 minutes to 2 hours).
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Step 3: Verify Domain</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Once DNS has propagated, enter your custom domain below and click verify:
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="farm.yourdomain.com"
                  className="flex-1"
                  defaultValue={customDomain}
                />
                <Button>Verify Domain</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                We'll check if the CNAME record is correctly configured.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Common DNS Providers */}
      <Card>
        <CardHeader>
          <CardTitle>DNS Provider Guides</CardTitle>
          <CardDescription>
            Quick links to add CNAME records on popular DNS providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            {[
              { name: "Cloudflare", url: "https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-cname-record/" },
              { name: "GoDaddy", url: "https://www.godaddy.com/help/add-a-cname-record-19236" },
              { name: "Namecheap", url: "https://www.namecheap.com/support/knowledgebase/article.aspx/223/2237/how-to-add-a-cname-record-for-your-domain/" },
              { name: "Google Domains", url: "https://support.google.com/domains/answer/3290350" },
              { name: "AWS Route 53", url: "https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-creating.html" },
              { name: "Name.com", url: "https://www.name.com/support/articles/115004893508-Adding-CNAME-records" },
            ].map((provider) => (
              <a
                key={provider.name}
                href={provider.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors"
              >
                <span className="font-medium">{provider.name}</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-semibold mb-1">CNAME record not working?</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Wait at least 15 minutes after adding the record</li>
              <li>Check that the CNAME value matches exactly: <code className="bg-muted px-1 rounded">{cnameValue}</code></li>
              <li>Ensure there are no conflicting A or AAAA records</li>
              <li>Use a DNS checker tool like <a href="https://dnschecker.org" target="_blank" rel="noopener noreferrer" className="text-primary underline">dnschecker.org</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Need help?</h4>
            <p className="text-sm text-muted-foreground">
              Contact support at{" "}
              <a href="mailto:support@maliktechdairy.com" className="text-primary underline">
                support@maliktechdairy.com
              </a>{" "}
              or check our{" "}
              <a href="/docs" className="text-primary underline">
                documentation
              </a>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

